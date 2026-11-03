import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import { authorizeAdmin, handleAnalytics } from '../server/analytics-handler.mjs'
import { AnalyticsError, reportRequests, reportRows, fetchAnalytics } from '../server/ga4.mjs'

test('GA reports constrain scope and date range without record-level identifiers', () => {
  const requests = reportRequests(30, 'web')
  assert.equal(requests.length, 6)
  assert.equal(requests[0].dateRanges[0].startDate, '29daysAgo')
  assert.equal(requests[0].dimensionFilter.filter.stringFilter.value, 'web')
  assert.equal(reportRequests(7, 'all')[0].dimensionFilter, undefined)
  assert.ok(!JSON.stringify(requests).includes('userId'))
})

test('GA response rows preserve empty results and convert metric values', () => {
  assert.deepEqual(reportRows({}), [])
  assert.deepEqual(reportRows({ dimensionHeaders: [{ name: 'country' }], metricHeaders: [{ name: 'activeUsers' }], rows: [{ dimensionValues: [{ value: 'Vietnam' }], metricValues: [{ value: '12' }] }] }), [{ country: 'Vietnam', activeUsers: 12 }])
})

test('backend rejects missing token, customer role and banned admins', async () => {
  await assert.rejects(authorizeAdmin('', {}), e => e.status === 401)
  const config = { VITE_SUPABASE_URL: 'https://test.supabase.co', VITE_SUPABASE_ANON_KEY: 'public-test-key' }
  const makeClient = profile => () => ({ auth: { getUser: async () => ({ data: { user: { id: 'verified-user' } }, error: null }) }, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: profile, error: null }) }) }) }) })
  for (const profile of [{ role: 'customer' }, { role: 'admin', banned_at: '2026-01-01' }, { role: 'admin', deleted_at: '2026-01-01' }]) {
    await assert.rejects(authorizeAdmin('Bearer test-token', config, makeClient(profile)), e => e.status === 403)
  }
  await authorizeAdmin('Bearer test-token', config, makeClient({ role: 'admin', banned_at: null, deleted_at: null }))
})

test('HTTP endpoint returns 401/405 without exposing credentials or calling Google', async () => {
  for (const [method, expected] of [['GET', 401], ['POST', 405]]) {
    const res = { headers: {}, setHeader(key, value) { this.headers[key] = value }, end(body) { this.body = body } }
    await handleAnalytics({ method, url: '/api/analytics', headers: {} }, res, {})
    assert.equal(res.statusCode, expected)
    assert.equal(res.headers['Cache-Control'], 'private, no-store')
    assert.ok(JSON.parse(res.body).error)
    assert.ok(!res.body.includes('private_key'))
  }
})

test('backend reads six reports in batches of five and keeps OAuth token server-side', async () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const config = { GA4_PROPERTY_ID: '987654321', GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ type: 'service_account', client_email: 'test@unit-test.iam.gserviceaccount.com', private_key: privateKey.export({ format: 'pem', type: 'pkcs8' }) }) }
  const requests = []
  const fetcher = async (url, init) => {
    if (url === 'https://oauth2.googleapis.com/token') return { ok: true, json: async () => ({ access_token: 'private-oauth-token', expires_in: 3600 }) }
    const body = JSON.parse(init.body)
    requests.push(body.requests.length)
    return { ok: true, json: async () => ({ reports: body.requests.map(request => ({ dimensionHeaders: request.dimensions, metricHeaders: request.metrics, rows: [], metadata: { timeZone: 'Asia/Ho_Chi_Minh' } })) }) }
  }
  const report = await fetchAnalytics(config, { days: 30, platform: 'all' }, fetcher)
  assert.deepEqual(requests, [5, 1])
  assert.equal(report.summary, null)
  assert.deepEqual(report.sources, [])
  assert.ok(!JSON.stringify(report).includes('private-oauth-token'))
  assert.ok(!JSON.stringify(report).includes('PRIVATE KEY'))
  await assert.rejects(fetchAnalytics(config, { days: 365, platform: 'all' }, fetcher), AnalyticsError)
})
