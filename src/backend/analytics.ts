import { useEffect } from 'react'
import { analyticsLocation, isAnalyticsPage, measurementId } from './analyticsConfig'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export const gaId = measurementId(import.meta.env.VITE_GA_MEASUREMENT_ID)
export const gaConfigured = Boolean(gaId)
const allowedEnvironment = import.meta.env.PROD || import.meta.env.VITE_GA_ENABLED_IN_DEV === 'true'
let initialized = false
let lastPage = ''
let lastLocation = ''
let collecting = false
const pendingConversions: { name: string; params: Record<string, unknown> }[] = []

function setCollecting(enabled: boolean) {
  collecting = enabled
  if (gaId && typeof window !== 'undefined') (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = !enabled
}

function initialize() {
  if (!gaConfigured || !allowedEnvironment || typeof window === 'undefined') return false
  if (initialized) return true
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function (..._args: unknown[]) { window.dataLayer!.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', gaId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: analyticsLocation(window.location.origin, 'home', window.location.search),
    page_referrer: referrerOrigin(),
  })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`
  script.dataset.mementoAnalytics = 'ga4'
  script.onerror = () => console.warn('Không tải được Google Analytics. Các chức năng khác vẫn hoạt động.')
  document.head.appendChild(script)
  initialized = true
  return true
}

function referrerOrigin() {
  try { return document.referrer ? new URL(document.referrer).origin : '' } catch { return '' }
}

export function useAnalyticsPage(view: string, role: string, ready: boolean) {
  useEffect(() => {
    if (!ready || !isAnalyticsPage(view, role)) {
      setCollecting(false)
      lastPage = ''
      return
    }
    setCollecting(true)
    if (!initialize() || lastPage === view) return
    const location = analyticsLocation(window.location.origin, view, window.location.search)
    window.gtag?.('event', 'page_view', {
      send_to: gaId, page_title: `Memento | ${view}`, page_location: location,
      page_referrer: lastLocation || referrerOrigin(),
    })
    lastPage = view
    lastLocation = location
    for (const conversion of pendingConversions.splice(0)) {
      window.gtag?.('event', conversion.name, { send_to: gaId, ...conversion.params, page_location: location })
    }
  }, [view, role, ready])
}

// Only explicit, non-personal conversion fields are sent. Never send email, phone,
// Supabase user IDs, access tokens, booking notes or bank details to GA.
export function trackConversion(name: 'sign_up' | 'booking_created', params: { method?: string; value?: number; currency?: string } = {}) {
  if (!gaConfigured || !allowedEnvironment) return
  if (!collecting) {
    if (pendingConversions.length < 10) pendingConversions.push({ name, params })
    return
  }
  if (!initialize()) return
  window.gtag?.('event', name, { send_to: gaId, ...params,
    page_location: lastLocation || analyticsLocation(window.location.origin, 'home', window.location.search),
  })
}
