export const acquisitionSources = [
  { value: 'facebook', label: 'Facebook', chartColor: '#2563eb' },
  { value: 'tiktok', label: 'TikTok', chartColor: '#1e293b' },
  { value: 'other', label: 'Nguồn khác', chartColor: '#0d9488' },
  { value: '', label: 'Chưa xác định', chartColor: '#94a3b8' },
] as const

// Remember the first arrival in this tab while the user navigates to signup.
export function captureAcquisitionSource() {
  const key = 'memento-acquisition-source'
  const saved = sessionStorage.getItem(key)
  if (saved) return saved

  const params = new URLSearchParams(window.location.search)
  const campaign = params.get('utm_source')?.trim().toLowerCase()
  const referrer = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''
  const matchesDomain = (domain: string) => referrer === domain || referrer.endsWith('.' + domain)
  let source = ''
  if (campaign) {
    source = ['facebook', 'fb', 'facebook.com'].includes(campaign) ? 'facebook'
      : ['tiktok', 'tik_tok', 'tiktok.com'].includes(campaign) ? 'tiktok' : 'other'
  } else if (params.has('fbclid') || matchesDomain('facebook.com') || matchesDomain('fb.com')) {
    source = 'facebook'
  } else if (params.has('ttclid') || matchesDomain('tiktok.com')) {
    source = 'tiktok'
  } else if (referrer && referrer !== window.location.hostname) {
    source = 'other'
  }
  if (source) sessionStorage.setItem(key, source)
  return source
}
