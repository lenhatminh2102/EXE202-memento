import { maskContact } from './maskContact'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useBackend } from './BackendContext'
import type { Row } from './BackendContext'
import { calcCommission, getDepositAmount, isPaid, isStagedPayment } from './bookings'
import type { BookingRow } from './bookings'
import { supabase } from './supabase'
import { useTableVersion } from './useTableVersion'

export const isDemoAccount = (account: Row) => /^memento-demo-.+@example\.invalid$/i.test(account.email?.trim() || '')

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const day = (value: Date) => value.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })
const card = 'min-w-0 rounded-2xl border border-border bg-card p-5'
const ratio = (part: number, total: number) => total ? Math.round(part / total * 100) : 0

function DailyChart({ title, rows, series }: { title: string; rows: Row[]; series: [string, string, string][] }) {
  return <section className={card}><h3 className="mb-4 font-semibold">{title}</h3>
    <div style={{ height: 220 }}><ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows}><CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" minTickGap={18} /><YAxis allowDecimals={false} /><Tooltip />
        {series.map(([key, label, color]) => <Bar key={key} dataKey={key} name={label} fill={color} radius={[4, 4, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer></div>
  </section>
}

export function AdminStatistics() {
  const { users, bookings } = useBackend()
  const [days, setDays] = useState(30)
  const [reviews, setReviews] = useState<Row[] | null>(null)
  const [reviewError, setReviewError] = useState(false)
  const version = useTableVersion('photographer_reviews')
  useEffect(() => {
    let live = true
    void supabase.from('photographer_reviews').select('rating,created_at').eq('hidden', false).then(({ data, error }) => {
      if (!live) return
      setReviewError(Boolean(error))
      setReviews(data)
    })
    return () => { live = false }
  }, [version])

  const today = Date.now()
  const daily = Array.from({ length: days }, (_, index) => {
    const key = day(new Date(today - (days - 1 - index) * 86400000))
    return { key, label: key.slice(8) + '/' + key.slice(5, 7), paid: 0, commission: 0, transactions: 0, newUsers: 0, totalUsers: 0 }
  })
  const byDay = new Map(daily.map(row => [row.key, row]))
  const dayOf = (value?: string) => value && Number.isFinite(Date.parse(value)) ? day(new Date(value)) : ''
  const accounts = users.filter(user => !user.deleted_at && !isDemoAccount(user))
  for (const account of accounts) {
    const key = dayOf(account.created_at)
    const row = byDay.get(key)
    if (row) row.newUsers++
  }
  let cumulative = accounts.filter(account => {
    const key = dayOf(account.created_at)
    return key && key < daily[0].key
  }).length
  for (const row of daily) {
    cumulative += row.newUsers
    row.totalUsers = cumulative
  }
  const orders = bookings.filter(order => byDay.has(dayOf(order.created_at)))
  const paidOrders = new Set<string>()
  const customers = new Map<string, { name: string; total: number; orders: Set<string> }>()
  const photographers = new Map<string, { name: string; total: number; orders: Set<string> }>()
  for (const order of bookings) {
    if (!isPaid(order as BookingRow)) continue
    const staged = isStagedPayment(order as BookingRow)
    const payments = staged
      ? [[order.deposit_paid_at, getDepositAmount(order as BookingRow)], [order.final_paid_at, order.remaining_amount]]
      : [[order.final_paid_at || order.paid_at || order.deposit_paid_at, order.package_price]]
    for (const [timestamp, amount] of payments) {
      const row = byDay.get(dayOf(timestamp))
      const value = Number(amount)
      if (!row || !Number.isFinite(value) || value <= 0) continue
      row.paid += value
      row.commission += calcCommission(value)
      row.transactions++
      paidOrders.add(String(order.id))
      for (const [group, id, name] of [[customers, order.client_id, order.client_name], [photographers, order.photographer_id, order.photographer_name]] as const) {
        if (!id) continue
        const entry = group.get(String(id)) ?? { name: name || 'Chưa có tên', total: 0, orders: new Set<string>() }
        entry.total += value
        entry.orders.add(String(order.id))
        group.set(String(id), entry)
      }
    }
  }
  const periodReviews = reviews?.filter(review => byDay.has(dayOf(review.created_at)))
  const average = periodReviews?.length ? (periodReviews.reduce((sum, review) => sum + Number(review.rating), 0) / periodReviews.length).toFixed(1) : '—'
  const sum = (key: 'paid' | 'commission' | 'transactions' | 'newUsers') => daily.reduce((total, row) => total + row[key], 0)
  const completed = orders.filter(order => order.status === 'completed').length
  const cancelled = orders.filter(order => ['cancelled', 'rejected'].includes(order.status)).length
  const roles = [
    ['Khách hàng', accounts.filter(account => ['client', 'customer'].includes(account.role)).length],
    ['Nhiếp ảnh gia', accounts.filter(account => account.role === 'photographer').length],
    ['Quản trị viên', accounts.filter(account => account.role === 'admin').length],
  ] as const
  const bars = (rows: ReadonlyArray<readonly [string, number]>, total: number) => rows.map(([label, count]) => <div key={label} className="mb-3 text-sm">
    <div className="mb-1 flex justify-between gap-3"><span>{label}</span><strong>{count}</strong></div>
    <div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: ratio(count, total) + '%' }} /></div>
  </div>)
  const cards = (items: [string, string | number][]) => <div className="dashboard-metrics">{items.map(([label, value]) => <div className={card} key={label}>
    <p className="text-sm text-muted-foreground">{label}</p><strong className="text-xl">{value}</strong>
  </div>)}</div>

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-bold">Thống kê Memento</h2>
      <label className="text-sm">Khoảng thời gian <select className="rounded-xl border border-border bg-card p-2" value={days} onChange={event => setDays(Number(event.target.value))}>
        {[7, 30, 90].map(value => <option key={value} value={value}>{value} ngày gần đây</option>)}
      </select></label>
    </div>
    {cards([['Hoa hồng Memento (ước tính)', currency.format(sum('commission'))], ['Tổng tiền đã thu', currency.format(sum('paid'))], ['Lượt thanh toán', sum('transactions')], ['Người dùng mới', sum('newUsers')], ['Đánh giá', periodReviews?.length ?? '—'], ['Điểm trung bình / 5', average]])}
    {reviewError && <p role="alert" className="text-sm text-red-700">Chưa tải được thống kê đánh giá.</p>}
    <div className="dashboard-reports">
      <DailyChart title="Thanh toán và hoa hồng theo ngày" rows={daily} series={[[ 'paid', 'Tiền đã thu', '#3b82f6'], ['commission', 'Hoa hồng ước tính', '#0f766e']]} />
      <section className={card}><h3 className="mb-4 font-semibold">Trạng thái {orders.length} đơn tạo trong kỳ</h3>{bars([['Hoàn tất', completed], ['Đang xử lý', orders.length - completed - cancelled], ['Từ chối hoặc hủy', cancelled]], orders.length)}</section>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <DailyChart title="Lượt thanh toán theo ngày" rows={daily} series={[[ 'transactions', 'Lượt thanh toán', '#7c3aed']]} />
      <DailyChart title="Người dùng mới theo ngày" rows={daily} series={[[ 'newUsers', 'Người dùng mới', '#0891b2']]} />
      <section className={card}><h3 className="mb-4 font-semibold">Phân bố điểm đánh giá</h3>{periodReviews ? bars([5, 4, 3, 2, 1].map(rating => [rating + ' sao', periodReviews.filter(review => Number(review.rating) === rating).length]), periodReviews.length) : <p>Chưa có dữ liệu.</p>}</section>
    </div>
    <h2 className="text-xl font-bold">Thống kê người dùng</h2>
    {cards([['Tổng tài khoản', accounts.length], ['Khách hàng / Nhiếp ảnh gia', roles[0][1] + ' / ' + roles[1][1]], ['Đơn tạo trong kỳ có thanh toán trong kỳ', ratio(orders.filter(order => paidOrders.has(String(order.id))).length, orders.length) + '%'], ['Khách có từ 2 đơn thanh toán', ratio([...customers.values()].filter(entry => entry.orders.size >= 2).length, customers.size) + '%']])}
    <div className="dashboard-reports">
      <DailyChart title="Tăng trưởng tài khoản theo ngày" rows={daily} series={[[ 'totalUsers', 'Tổng tích lũy', '#16a34a']]} />
      <section className={card}><h3 className="mb-4 font-semibold">Phân bố vai trò</h3>{bars(roles, accounts.length)}</section>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      {([[ 'Khách hàng chi tiêu nhiều nhất', customers], ['Nhiếp ảnh gia có doanh số cao nhất', photographers]] as const).map(([title, group]) => <section key={title} className={card}>
        <h3 className="mb-4 font-semibold">{title}</h3>
        {group.size ? <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr><th className="text-left">Tên</th><th className="text-right">Số đơn</th><th className="text-right">Thanh toán</th></tr></thead>
          <tbody>{[...group].sort((a, b) => b[1].total - a[1].total).slice(0, 5).map(([id, entry]) => <tr key={id} className="border-t border-border">
            <td className="py-3">{maskContact(entry.name)}</td><td className="text-right">{entry.orders.size}</td><td className="text-right">{currency.format(entry.total)}</td>
          </tr>)}</tbody>
        </table></div> : <p className="text-sm text-muted-foreground">Chưa có thanh toán trong kỳ.</p>}
      </section>)}
    </div>
  </section>
}
