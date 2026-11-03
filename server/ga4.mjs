import { readFile } from 'node:fs/promises'
import { createSign } from 'node:crypto'

const tokenCache = new Map()
const reportCache = new Map()
export class AnalyticsError extends Error {
  constructor(message, status = 502) { super(message); this.status = status }
}

async function credentials(config) {
  try {
    const text = config.GOOGLE_SERVICE_ACCOUNT_JSON || (config.GOOGLE_APPLICATION_CREDENTIALS ? await readFile(config.GOOGLE_APPLICATION_CREDENTIALS, 'utf8') : '')
    if (!text) throw new Error('missing')
    const key = JSON.parse(text)
    if (key.type !== 'service_account' || !key.client_email?.endsWith('.iam.gserviceaccount.com') || !key.private_key?.includes('PRIVATE KEY')) throw new Error('invalid')
    return key
  } catch { throw new AnalyticsError('Chưa cấu hình Service Account hợp lệ trên backend.', 503) }
}

async function accessToken(config, fetcher) {
  const key = await credentials(config)
  const cached = tokenCache.get(key.client_email)
  if (cached && cached.expires > Date.now() + 60000) return cached.token
  const now = Math.floor(Date.now() / 1000)
  const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const body = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`
  const signer = createSign('RSA-SHA256'); signer.update(body); signer.end()
  const assertion = `${body}.${signer.sign(key.private_key, 'base64url')}`
  const response = await fetcher('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }), signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new AnalyticsError('Google không xác thực được Service Account. Kiểm tra key và trạng thái tài khoản.', 503)
  const data = await response.json()
  if (!data.access_token) throw new AnalyticsError('Google chưa trả access token cho backend.')
  tokenCache.set(key.client_email, { token: data.access_token, expires: Date.now() + Number(data.expires_in || 3600) * 1000 })
  return data.access_token
}

export function reportRequests(days, platform) {
  const base = { dateRanges: [{ startDate: `${days - 1}daysAgo`, endDate: 'today' }] }
  if (platform !== 'all') base.dimensionFilter = { filter: { fieldName: 'platform', stringFilter: { matchType: 'EXACT', value: platform, caseSensitive: false } } }
  const request = (dimensions, metrics, order, limit = 20) => ({ ...base, dimensions: dimensions.map(name => ({ name })), metrics: metrics.map(name => ({ name })), limit: String(limit), ...(order ? { orderBys: [order] } : {}) })
  return [
    request([], ['totalUsers', 'activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'eventCount'], null, 1),
    request(['date'], ['activeUsers', 'sessions', 'screenPageViews'], { dimension: { dimensionName: 'date' } }, 90),
    request(['sessionSource', 'sessionMedium', 'sessionCampaignName'], ['sessions', 'totalUsers'], { metric: { metricName: 'sessions' }, desc: true }),
    request(['deviceCategory', 'operatingSystem'], ['activeUsers', 'sessions'], { metric: { metricName: 'activeUsers' }, desc: true }),
    request(['country'], ['activeUsers', 'sessions'], { metric: { metricName: 'activeUsers' }, desc: true }),
    request(['eventName'], ['eventCount', 'totalUsers'], { metric: { metricName: 'eventCount' }, desc: true }),
  ]
}

export function reportRows(report) {
  const dimensions = report.dimensionHeaders || [], metrics = report.metricHeaders || []
  return (report.rows || []).map(row => Object.fromEntries([
    ...dimensions.map((h, i) => [h.name, row.dimensionValues?.[i]?.value || '']),
    ...metrics.map((h, i) => [h.name, Number(row.metricValues?.[i]?.value || 0)]),
  ]))
}

export async function fetchAnalytics(config, { days = 30, platform = 'all' } = {}, fetcher = fetch) {
  if (!/^[1-9]\d+$/.test(config.GA4_PROPERTY_ID || '')) throw new AnalyticsError('Backend chưa có GA4 Property ID hợp lệ.', 503)
  if (![7, 30, 90].includes(days) || !['all', 'web', 'android', 'ios'].includes(platform)) throw new AnalyticsError('Bộ lọc Analytics không hợp lệ.', 400)
  const cacheKey = `${config.GA4_PROPERTY_ID}:${days}:${platform}`
  const cached = reportCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) return cached.data
  const token = await accessToken(config, fetcher)
  const api = async (method, body) => {
    const response = await fetcher(`https://analyticsdata.googleapis.com/v1beta/properties/${config.GA4_PROPERTY_ID}:${method}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) })
    if (!response.ok) {
      if (response.status === 403) throw new AnalyticsError('Google từ chối truy cập. Kiểm tra đã bật Analytics Data API và cấp Viewer cho Service Account trên đúng property.', 503)
      if (response.status === 429) throw new AnalyticsError('GA4 đang giới hạn lượt gọi. Vui lòng thử lại sau.', 429)
      throw new AnalyticsError(`Không lấy được báo cáo GA4 (HTTP ${response.status}).`)
    }
    return response.json()
  }
  const requests = reportRequests(days, platform)
  const [batch, events] = await Promise.all([
    api('batchRunReports', { requests: requests.slice(0, 5) }),
    api('batchRunReports', { requests: requests.slice(5) }),
  ])
  const reports = [...(batch.reports || []), ...(events.reports || [])]
  if (reports.length !== 6) throw new AnalyticsError('GA4 chưa trả đủ các báo cáo yêu cầu.')
  const data = { propertyId: config.GA4_PROPERTY_ID, days, platform, fetchedAt: new Date().toISOString(),
    timezone: reports[0].metadata?.timeZone || '', summary: reportRows(reports[0])[0] || null,
    daily: reportRows(reports[1]), sources: reportRows(reports[2]), devices: reportRows(reports[3]), countries: reportRows(reports[4]), events: reportRows(reports[5]),
    metadata: reports.map((r, i) => ({ report: ['summary','daily','sources','devices','countries','events'][i], rowCount: r.rowCount || 0, thresholded: Boolean(r.metadata?.subjectToThresholding), otherRows: Boolean(r.metadata?.dataLossFromOtherRow) })),
  }
  reportCache.set(cacheKey, { data, expires: Date.now() + 60000 })
  return data
}
