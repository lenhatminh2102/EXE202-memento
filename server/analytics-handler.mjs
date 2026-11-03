import { createClient } from '@supabase/supabase-js'
import { AnalyticsError, fetchAnalytics } from './ga4.mjs'

export async function authorizeAdmin(header, config, makeClient = createClient) {
  const match = /^Bearer\s+([^\s]+)$/i.exec(header || '')
  if (!match) throw new AnalyticsError('Vui lòng đăng nhập Memento để xem Analytics.', 401)
  const url = config.SUPABASE_URL || config.VITE_SUPABASE_URL
  const key = config.SUPABASE_ANON_KEY || config.VITE_SUPABASE_ANON_KEY || config.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new AnalyticsError('Backend chưa có cấu hình xác thực Supabase.', 503)
  const client = makeClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${match[1]}` }, fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) } })
  const { data, error } = await client.auth.getUser(match[1])
  if (error || !data.user) throw new AnalyticsError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 401)
  const { data: profile, error: profileError } = await client.from('profiles').select('role,banned_at,deleted_at').eq('id', data.user.id).single()
  if (profileError || profile?.role !== 'admin' || profile.banned_at || profile.deleted_at) throw new AnalyticsError('Chỉ quản trị viên đang hoạt động được xem Analytics.', 403)
}

export async function handleAnalytics(req, res, config = process.env) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  try {
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); throw new AnalyticsError('API này chỉ hỗ trợ GET.', 405) }
    await authorizeAdmin(req.headers.authorization, config)
    const query = new URL(req.url, 'http://localhost').searchParams
    const days = Number(query.get('days') || 30), platform = query.get('platform') || 'all'
    const data = await fetchAnalytics(config, { days, platform })
    res.statusCode = 200; res.end(JSON.stringify(data))
  } catch (error) {
    res.statusCode = error instanceof AnalyticsError ? error.status : 502
    res.end(JSON.stringify({ error: error instanceof AnalyticsError ? error.message : 'Không kết nối được dịch vụ Analytics. Vui lòng thử lại.' }))
  }
}
