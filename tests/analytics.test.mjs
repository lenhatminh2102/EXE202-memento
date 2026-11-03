import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { measurementId, lookerEmbedUrl, analyticsLocation, isAnalyticsPage } from '../src/backend/analyticsConfig.ts'

test('analytics remains disabled without a valid GA4 measurement ID', () => {
  assert.equal(measurementId(undefined), '')
  assert.equal(measurementId('UA-123-4'), '')
  assert.equal(measurementId('G-TEST123'), 'G-TEST123')
})

test('report embeds allow Google Looker Studio only', () => {
  assert.equal(lookerEmbedUrl('https://lookerstudio.google.com/embed/reporting/report-123/page/page1'), 'https://lookerstudio.google.com/embed/reporting/report-123/page/page1')
  for (const bad of ['javascript:alert(1)', 'http://lookerstudio.google.com/embed/reporting/a', 'https://lookerstudio.google.com.evil.test/embed/reporting/a', 'https://user:pass@lookerstudio.google.com/embed/reporting/a', 'https://lookerstudio.google.com/reporting/a']) assert.equal(lookerEmbedUrl(bad), '')
})

test('page URLs retain UTM attribution while excluding credentials and personal data', () => {
  const location = analyticsLocation('https://memento.example', 'search', '?utm_source=facebook&utm_campaign=launch&access_token=secret&email=user@example.com&bookingId=123&utm_content=user@example.com')
  assert.equal(location, 'https://memento.example/search?utm_source=facebook&utm_campaign=launch')
  assert.equal(isAnalyticsPage('admin-dashboard', 'admin'), false)
  assert.equal(isAnalyticsPage('login', 'public'), false)
  assert.equal(isAnalyticsPage('messages', 'client'), false)
  assert.equal(isAnalyticsPage('search', 'public'), true)
})

test('SPA sends one manual pageview per screen and never initializes on admin pages', async () => {
  const calls = [], scripts = []
  const previousWindow = globalThis.window, previousDocument = globalThis.document
  globalThis.window = { location: { origin: 'https://memento.example', search: '?utm_source=google&token=secret' } }
  globalThis.document = { referrer: 'https://google.com/search?q=private', createElement: () => ({ dataset: {} }), head: { appendChild: script => scripts.push(script) } }
  try {
    const config = stripTypeScriptTypes(readFileSync(new URL('../src/backend/analyticsConfig.ts', import.meta.url), 'utf8'))
    const configUrl = 'data:text/javascript;base64,' + Buffer.from(config).toString('base64')
    let source = stripTypeScriptTypes(readFileSync(new URL('../src/backend/analytics.ts', import.meta.url), 'utf8'))
    source = source.replace(/import \{ useEffect \} from 'react'/, 'const useEffect = callback => callback()')
      .replace("'./analyticsConfig'", JSON.stringify(configUrl))
      .replaceAll('import.meta.env.VITE_GA_MEASUREMENT_ID', "'G-TEST123'")
      .replaceAll('import.meta.env.PROD', 'true')
      .replaceAll('import.meta.env.VITE_GA_ENABLED_IN_DEV', "'false'")
    const analytics = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
    analytics.useAnalyticsPage('admin-dashboard', 'admin', true)
    assert.equal(scripts.length, 0)
    analytics.useAnalyticsPage('home', 'public', true)
    analytics.useAnalyticsPage('home', 'public', true)
    analytics.useAnalyticsPage('search', 'client', true)
    calls.push(...window.dataLayer.map(args => Array.from(args)))
    assert.equal(scripts.length, 1)
    assert.equal(calls.find(c => c[0] === 'config')[2].send_page_view, false)
    const pages = calls.filter(c => c[0] === 'event' && c[1] === 'page_view')
    assert.equal(pages.length, 2)
    assert.equal(pages[0][2].page_referrer, 'https://google.com')
    assert.ok(!JSON.stringify(calls).includes('secret'))
    analytics.useAnalyticsPage('messages', 'client', true)
    assert.equal(window['ga-disable-G-TEST123'], true)
    const before = window.dataLayer.length
    analytics.trackConversion('sign_up', { method: 'email' })
    assert.equal(window.dataLayer.length, before)
    analytics.useAnalyticsPage('home', 'client', true)
    assert.equal(window['ga-disable-G-TEST123'], false)
    assert.equal(Array.from(window.dataLayer.at(-1))[1], 'sign_up')
  } finally { globalThis.window = previousWindow; globalThis.document = previousDocument }
})
