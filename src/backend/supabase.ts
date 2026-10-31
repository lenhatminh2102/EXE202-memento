import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const backendConfigured = Boolean(url && key)
if (!backendConfigured) throw new Error('Thiếu VITE_SUPABASE_URL hoặc public key. Cấu hình .env.local trước khi chạy FE.')

// Only public browser credentials belong here. RLS remains the authority for writes.
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  global: {
    fetch: (input, init = {}) => fetch(input, {
      ...init,
      signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
    }),
  },
})

export function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : (error as { message?: string })?.message || String(error)
  if (/fetch|network|timeout|aborted|resolve/i.test(message)) return 'Không kết nối được Supabase. Kiểm tra mạng và cấu hình project, sau đó thử lại.'
  return message
}

export function unwrap<T extends { data?: unknown; error: unknown }>({ data, error }: T): NonNullable<T['data']> {
  if (error) throw new Error(errorMessage(error))
  return data as NonNullable<T['data']>
}

export async function checkedUpdate(table: string, patch: Record<string, unknown>, column: string, id: string | number) {
  const rows = unwrap(await supabase.from(table).update(patch).eq(column, id).select('*'))
  if (!rows?.length) throw new Error('Không cập nhật được dữ liệu. Kiểm tra quyền truy cập hoặc tải lại trang.')
  return rows
}
