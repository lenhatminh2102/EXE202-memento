import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    hcaptcha?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string
      reset: (id: string) => void
      remove: (id: string) => void
    }
  }
}
export const captchaEnabled = Boolean(import.meta.env.VITE_HCAPTCHA_SITE_KEY)

export function Captcha({ onToken, resetKey = 0 }: { onToken: (token: string | null) => void; resetKey?: number }) {
  const element = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const callback = useRef(onToken)
  const [error, setError] = useState('')
  useEffect(() => { callback.current = onToken }, [onToken])
  useEffect(() => {
    if (!captchaEnabled) return
    if (!document.querySelector('script[data-memento-captcha]')) {
      const script = document.createElement('script')
      script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit'
      script.async = true; script.defer = true; script.dataset.mementoCaptcha = 'true'
      script.onerror = () => setError('Không tải được CAPTCHA. Kiểm tra mạng hoặc trình chặn nội dung.')
      document.head.appendChild(script)
    }
    const timer = setInterval(() => {
      if (!window.hcaptcha || !element.current || widget.current) return
      widget.current = window.hcaptcha.render(element.current, {
        sitekey: import.meta.env.VITE_HCAPTCHA_SITE_KEY,
        callback: (token: string) => callback.current(token),
        'expired-callback': () => callback.current(null),
        'error-callback': () => { callback.current(null); setError('CAPTCHA lỗi hoặc tên miền chưa được cho phép. Vui lòng thử lại.') },
      })
      clearInterval(timer)
    }, 200)
    return () => { clearInterval(timer); if (widget.current) window.hcaptcha?.remove(widget.current); widget.current = null }
  }, [])
  useEffect(() => { if (widget.current) { window.hcaptcha?.reset(widget.current); callback.current(null) } }, [resetKey])
  if (!captchaEnabled) return null
  return <div className="space-y-2"><div ref={element} className="min-h-20" />{error && <p role="alert" className="text-red-700 text-sm">{error}</p>}</div>
}
