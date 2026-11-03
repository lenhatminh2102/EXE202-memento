export function measurementId(value: string | undefined): string {
  const id = (value || '').trim().toUpperCase()
  return /^G-[A-Z0-9]+$/.test(id) ? id : ''
}

export function lookerEmbedUrl(value: string | undefined): string {
  if (!value?.trim()) return ''
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return ''
    if (!['lookerstudio.google.com', 'datastudio.google.com'].includes(url.hostname)) return ''
    if (!/^\/embed\/reporting\/[a-zA-Z0-9_-]+(?:\/page\/[a-zA-Z0-9_-]+)?\/?$/.test(url.pathname)) return ''
    url.hostname = 'lookerstudio.google.com'
    return url.href
  } catch { return '' }
}

export const isAnalyticsPage = (view: string, role: string) => role !== 'admin' && ![
  'login', 'register', 'forgot', 'client-profile', 'client-settings', 'photo-profile', 'photo-settings',
  'messages', 'application', 'history-detail', 'photo-booking-detail', 'payment',
].includes(view) && !view.startsWith('admin-')

// Keep campaign attribution while excluding auth tokens, contact details and record IDs.
export function analyticsLocation(origin: string, view: string, search: string): string {
  const url = new URL('/' + encodeURIComponent(view), origin)
  const params = new URLSearchParams(search)
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const value = params.get(key)
    if (value && value.length <= 100 && !/[@\r\n]/.test(value)) url.searchParams.set(key, value)
  }
  return url.href
}
