import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { gaConfigured, gaId } from './analytics'
import { useBackend } from './BackendContext'
import { supabase, errorMessage } from './supabase'

type Row = Record<string, string | number>
type Report = {
  propertyId: string; days: number; platform: string; fetchedAt: string; timezone: string;
  summary: Row | null; daily: Row[]; sources: Row[]; devices: Row[]; countries: Row[]; events: Row[];
  metadata: { report: string; rowCount: number; thresholded: boolean; otherRows: boolean }[];
}
const number = (value: string | number | undefined) => new Intl.NumberFormat('vi-VN').format(Number(value || 0))
const dayLabel = (value: string | number) => { const date = String(value); return date.length === 8 ? date.slice(6) + '/' + date.slice(4,6) : date }

function ReportTable({ title, rows, columns }: { title: string; rows: Row[]; columns: { key: string; label: string; numeric?: boolean }[] }) {
  return <section className="bg-card border border-border rounded-2xl overflow-hidden min-w-0"><h3 className="font-bold px-5 py-4 border-b border-border">{title}</h3>{!rows.length ? <p className="p-5 text-sm text-muted-foreground">Không có dữ liệu trong phạm vi đã chọn.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-secondary/40">{columns.map(c => <th key={c.key} className={'px-4 py-3 font-semibold ' + (c.numeric ? 'text-right' : 'text-left')}>{c.label}</th>)}</tr></thead><tbody>{rows.map((r,i) => <tr key={i} className="border-t border-border">{columns.map(c => <td key={c.key} className={'px-4 py-3 ' + (c.numeric ? 'text-right tabular-nums' : '')}>{c.numeric ? number(r[c.key]) : String(r[c.key] || '—')}</td>)}</tr>)}</tbody></table></div>}</section>
}

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
  const daily = (data?.daily || []).map(row => ({ ...row, label: dayLabel(row.date) }))
  return <section className="space-y-5">
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap justify-between items-start gap-3"><div><h2 className="text-xl font-bold">Google Analytics</h2><p className="text-sm text-muted-foreground mt-1">Dữ liệu trực tiếp từ GA4 qua backend Memento. Không cần đăng nhập Google thêm.</p></div><button disabled={loading} className="px-4 py-2 border border-border rounded-xl text-sm disabled:opacity-50" onClick={() => setVersion(v => v+1)}>Làm mới</button></div>
      <div className="flex flex-wrap gap-3"><label className="text-sm">Khoảng thời gian<select className="block mt-1 border border-border rounded-xl px-3 py-2 bg-card" value={days} onChange={e => setDays(Number(e.target.value))}>{[7,30,90].map(n => <option key={n} value={n}>{n} ngày gần đây</option>)}</select></label></div>
      <p className="text-xs text-muted-foreground">Số liệu theo khoảng ngày GA4, không phải số người online ngay lúc này. Mỗi bảng phân nhóm có thể đếm lại cùng người dùng; không cộng các hàng để suy ra tổng người dùng.</p>
      {loading && <p role="status" className="text-sm text-primary">Đang đồng bộ dữ liệu GA4…</p>}
      {error && <p role="alert" className="text-sm bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl">{error}</p>}
      {data && <p className="text-xs text-muted-foreground">Property {data.propertyId} · Múi giờ {data.timezone || 'theo property'} · Cập nhật {new Date(data.fetchedAt).toLocaleString('vi-VN')}. Backend cache tối đa 60 giây.</p>}
      {data?.metadata.some(m => m.thresholded || m.otherRows) && <p className="text-xs text-amber-800">Google có áp dụng ngưỡng dữ liệu hoặc gom một số hàng. Bảng hiển thị theo kết quả Google trả về.</p>}
    </div>
    {data && <>
      {summary ? <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">{[['totalUsers','Tổng người dùng'],['activeUsers','Người dùng hoạt động'],['newUsers','Người dùng mới'],['sessions','Phiên truy cập'],['screenPageViews','Lượt xem trang / màn hình'],['eventCount','Sự kiện']].map(([key,label]) => <div key={key} className="bg-card border border-border rounded-2xl p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-bold text-primary mt-2">{number(summary[key])}</p></div>)}</div> : <p className="p-5 bg-card border border-border rounded-2xl text-sm">GA4 chưa có dữ liệu trong phạm vi đã chọn. Không dùng dữ liệu mẫu.</p>}
      <div className="bg-card border border-border rounded-2xl p-5"><h3 className="font-bold mb-4">Người dùng hoạt động theo ngày</h3>{daily.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={daily}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip /><Area name="Người dùng hoạt động" dataKey="activeUsers" stroke="#0f6d6a" fill="#d4efeb" /></AreaChart></ResponsiveContainer></div> : <p className="text-sm text-muted-foreground">Chưa có dữ liệu theo ngày.</p>}</div>
      <ReportTable title="Nguồn truy cập (20 nguồn đầu)" rows={data.sources} columns={[{key:'sessionSource',label:'Nguồn'},{key:'sessionMedium',label:'Kênh'},{key:'sessionCampaignName',label:'Chiến dịch'},{key:'sessions',label:'Phiên',numeric:true},{key:'totalUsers',label:'Người dùng',numeric:true}]} />
      <div className="grid lg:grid-cols-2 gap-5"><ReportTable title="Thiết bị / hệ điều hành (20 nhóm đầu)" rows={data.devices} columns={[{key:'deviceCategory',label:'Thiết bị'},{key:'operatingSystem',label:'Hệ điều hành'},{key:'activeUsers',label:'Người dùng hoạt động',numeric:true}]} /><ReportTable title="Quốc gia (20 quốc gia đầu)" rows={data.countries} columns={[{key:'country',label:'Quốc gia'},{key:'activeUsers',label:'Người dùng hoạt động',numeric:true},{key:'sessions',label:'Phiên',numeric:true}]} /></div>
      <ReportTable title="Sự kiện (20 sự kiện đầu)" rows={data.events} columns={[{key:'eventName',label:'Sự kiện'},{key:'eventCount',label:'Số lần',numeric:true},{key:'totalUsers',label:'Người dùng',numeric:true}]} />
    </>}
    {settings && <div className="bg-card border border-border rounded-2xl p-5 space-y-3"><h3 className="font-bold">Trạng thái cấu hình</h3><p className="text-sm">Tracking web: {gaConfigured ? gaId : 'Chưa cấu hình Measurement ID'}.</p><p className="text-sm">API đọc báo cáo: {data ? 'Đã kết nối GA4' : error ? 'Chưa kết nối thành công' : 'Đang kiểm tra'}.</p><p className="text-xs text-muted-foreground">Dữ liệu báo cáo được đọc bằng Service Account trên backend và chỉ cấp cho admin Memento. Tracking localhost mặc định tắt. Số liệu luôn tổng hợp website và ứng dụng Android/iOS trong cùng property.</p></div>}
  </section>
}

export function AnalyticsSettingsPage() {
  return <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6"><h1 className="text-2xl font-bold">Cài đặt Analytics</h1><AnalyticsPanel settings /></div>
}
