import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = { ...process.env }
try {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
} catch { /* process environment may supply the configuration */ }
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Thiếu public Supabase configuration trong .env.local.')
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: {
  fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(20000) }),
} })
let failed = false
for (const table of ['photographers', 'profiles', 'bookings', 'photographer_applications', 'photographer_reviews', 'pinned_photographers', 'notifications', 'messages']) {
  const { error } = await client.from(table).select(table === 'pinned_photographers' ? 'photographer_id' : 'id').limit(1)
  console.log(`${error ? 'FAIL' : 'OK'} ${table}${error ? ': ' + error.message : ' (public read)'}`)
  if (error) failed = true
}
const { error } = await client.rpc('get_photographers_stats', {}, { get: true })
console.log(`${error ? 'FAIL' : 'OK'} get_photographers_stats${error ? ': ' + error.message : ''}`)
if (error) failed = true
console.log('Không thực hiện thao tác ghi. Các bảng trả rỗng vẫn cần xác minh RLS bằng tài khoản thật.')
process.exitCode = failed || error ? 1 : 0
