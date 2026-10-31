import { useBackend, avatar } from './BackendContext'
import type { Row } from './BackendContext'
import { revenueByMonth } from './model'

// Read-only adapter for the supplied desktop design. Business writes use BackendPages.
export function useDesignData() {
  const data = useBackend()
  const PHOTOGRAPHERS = data.photographers
  const BOOKINGS: Row[] = data.bookings.map(b => ({ ...b,
    photographer: PHOTOGRAPHERS.find(p => p.id === Number(b.photographer_id)) || { id: b.photographer_id, name: b.photographer_name || 'Nhiếp ảnh gia', avatar: b.photographer_avatar || avatar },
    date: b.booking_date ? new Date(b.booking_date).toLocaleDateString('vi-VN') : '', time: b.start_time?.slice(0, 5),
    location: '', package: b.package_name, price: Number(b.package_price || 0),
  }))
  return { PHOTOGRAPHERS, BOOKINGS,
    REVENUE_DATA: revenueByMonth(data.bookings),
  }
}
