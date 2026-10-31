// Adapt the backend's price_groups/packages to the existing desktop cards.
export type ServiceOption = { id: string; name: string; price: number; duration: string; photos: string; edits: string; popular: boolean; category: string }
export function buildServiceOptions(p: Record<string, any>): ServiceOption[] {
  const groups = Array.isArray(p.price_groups) ? p.price_groups : []
  const lines = groups.flatMap((g: any) => (g.lines || []).map((l: any) => ({
    id: `${g.id}:${l.id}`, name: l.name, price: typeof l.price === 'number' ? l.price : Number(String(l.price || '').replace(/[^\d]/g, '')),
    duration: l.detail || '', photos: 'Theo thỏa thuận', edits: 'Theo thỏa thuận', popular: false, category: g.category || 'photo',
  })))
  if (lines.length) return lines.filter((x: any) => Number.isFinite(x.price) && x.price > 0)
  return (p.packages || []).map((x: any, i: number) => ({ ...x, id: String(i), price: Number(x.price), duration: x.desc || '', photos: 'Theo thỏa thuận', edits: 'Theo thỏa thuận', popular: false, category: 'photo' })).filter((x: any) => x.price > 0)
}

export function revenueByMonth(bookings: Record<string, any>[]) {
  const year = new Date().getFullYear()
  return Array.from({ length: 12 }, (_, i) => {
    const rows = bookings.filter(b => new Date(b.booking_date).getFullYear() === year && new Date(b.booking_date).getMonth() === i)
    return { month: `T${i + 1}`, revenue: rows.filter(b => b.status === 'completed').reduce((s, b) => s + Number(b.package_price || 0), 0), bookings: rows.length }
  })
}

export const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Chờ đặt cọc', deposit_paid: 'Đã đặt cọc', processing: 'Đang xử lý', active: 'Đang thực hiện',
  paid: 'Đã thanh toán', handover: 'Bàn giao ảnh', final_payment: 'Chờ quyết toán', closing: 'Chờ hoàn tất', completed: 'Hoàn thành', rejected: 'Từ chối', cancelled: 'Đã hủy',
}
