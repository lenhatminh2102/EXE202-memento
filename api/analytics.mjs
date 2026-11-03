import { handleAnalytics } from '../server/analytics-handler.mjs'

// Vercel Node Function. Credentials stay server-side; the browser sends only
// its existing Supabase access token, which is verified before querying GA4.
export default function handler(req, res) { return handleAnalytics(req, res) }
