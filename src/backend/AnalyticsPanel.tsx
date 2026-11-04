import { useEffect, useState } from 'react'
import { gaConfigured, gaId } from './analytics'
import { useBackend } from './BackendContext'
import { supabase, errorMessage } from './supabase'

type Row = Record<string, string | number>
type Report = {
  propertyId: string; days: number; platform: string; fetchedAt: string; timezone: string;
  summary: Row | null;
  metadata: { report: string; rowCount: number; thresholded: boolean; otherRows: boolean }[];
}
const number = (value: string | number | undefined) => new Intl.NumberFormat('vi-VN').format(Number(value || 0))
export function AnalyticsPanel({ settings = false }: { settings?: boolean }) {
  const { user } = useBackend()
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (user?.role !== 'admin') return
    let live = true, busy = false
    const controller = new AbortController()
    setData(null)
    const load = async () => {
      if (busy) return
      busy = true; setLoading(true)
      try {
        const { data: auth, error: authError } = await supabase.auth.getSession()
        if (authError) throw authError
        if (!auth.session) throw new Error('Vui lòng đăng nhập lại tài khoản admin.')
        const response = await fetch('/api/analytics?days=' + days + '&platform=all', { headers: { Authorization: 'Bearer ' + auth.session.access_token }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]) })
        if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('API Analytics chưa chạy. Khởi động lại server local hoặc deploy kèm API backend.')
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Không lấy được dữ liệu Analytics.')
        if (live) { setData(result); setError('') }
      } catch (e) { if (live && !controller.signal.aborted) { setError(errorMessage(e)); setData(null) } }
      finally { busy = false; if (live) setLoading(false) }
    }
    void load()
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void load() }, 60000)
    return () => { live = false; controller.abort(); clearInterval(timer) }
  }, [user?.id, user?.role, days, version])
  if (user?.role !== 'admin') return null
  const summary = data?.summary
  return <section className="space-y-5">
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap justify-between items-start gap-3"><div><h2 className="text-xl font-bold">Google Analytics</h2></div><button disabled={loading} className="px-4 py-2 border border-border rounded-xl text-sm disabled:opacity-50" onClick={() => setVersion(v => v+1)}>Làm mới</button></div>
      <div className="flex flex-wrap gap-3"><label className="text-sm">Khoảng thời gian<select className="block mt-1 border border-border rounded-xl px-3 py-2 bg-card" value={days} onChange={e => setDays(Number(e.target.value))}>{[7,30,90].map(n => <option key={n} value={n}>{n} ngày gần đây</option>)}</select></label></div>
      {loading && <p role="status" className="text-sm text-primary">Đang đồng bộ dữ liệu GA4…</p>}
      {error && <p role="alert" className="text-sm bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl">{error}</p>}
      {data?.metadata.some(m => m.report === 'summary' && (m.thresholded || m.otherRows)) && <p className="text-xs text-amber-800">Google có áp dụng ngưỡng dữ liệu cho số liệu tổng quan.</p>}
    </div>
    {data && <>
      {summary ? <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">{[['totalUsers','Tổng người dùng'],['activeUsers','Người dùng hoạt động'],['newUsers','Người dùng mới'],['sessions','Phiên truy cập'],['screenPageViews','Lượt xem trang / màn hình'],['eventCount','Sự kiện']].map(([key,label]) => <div key={key} className="bg-card border border-border rounded-2xl p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-bold text-primary mt-2">{number(summary[key])}</p></div>)}</div> : <p className="p-5 bg-card border border-border rounded-2xl text-sm">GA4 chưa có dữ liệu trong phạm vi đã chọn. Không dùng dữ liệu mẫu.</p>}
    </>}
    {settings && <div className="bg-card border border-border rounded-2xl p-5 space-y-3"><h3 className="font-bold">Trạng thái cấu hình</h3><p className="text-sm">Tracking web: {gaConfigured ? gaId : 'Chưa cấu hình Measurement ID'}.</p><p className="text-sm">API đọc báo cáo: {data ? 'Đã kết nối GA4' : error ? 'Chưa kết nối thành công' : 'Đang kiểm tra'}.</p><p className="text-xs text-muted-foreground">Dữ liệu báo cáo được đọc bằng Service Account trên backend và chỉ cấp cho admin Memento. Tracking localhost mặc định tắt. Số liệu luôn tổng hợp website và ứng dụng Android/iOS trong cùng property.</p></div>}
  </section>
}

export function AnalyticsSettingsPage() {
  return <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6"><h1 className="text-2xl font-bold">Cài đặt Analytics</h1><AnalyticsPanel settings /></div>
}
