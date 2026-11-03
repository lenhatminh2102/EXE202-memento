import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { handleAnalytics } from './server/analytics-handler.mjs'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  return {
    plugins: [react(), tailwindcss(), {
      name: 'local-ga4-backend',
      configureServer(server) {
        server.middlewares.use('/api/analytics', (req, res) => { void handleAnalytics(req, res, env) })
      },
    }],
  }
})
