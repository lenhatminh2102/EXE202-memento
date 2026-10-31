import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { buildServiceOptions, revenueByMonth } from '../src/backend/model.ts'

// Compile the supplied business helpers with an isolated database double.
// These tests never contact the deployed project or create real bookings.
const source = readFileSync(new URL('../src/backend/bookings.ts', import.meta.url), 'utf8')
const compiled = stripTypeScriptTypes(source)
  .replace(/import \{ supabase \} from [^;]+;/, 'const supabase = globalThis.__mementoTestDb;')
  .replace(/import \{ categoryLabel as svcCategoryLabel \} from [^;]+;/, 'const svcCategoryLabel = value => value;')
let result = { data: null, error: { message: 'permission denied' } }
let insertPayload
globalThis.__mementoTestDb = {
  from: () => ({
    insert: value => { insertPayload = value; return { select: () => ({ single: async () => result }) } },
    update: () => ({ eq: () => ({ select: async () => result }) }),
  }),
}
const bookings = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))

test('backend price groups take precedence and exclude unpriced services', () => {
  const options = buildServiceOptions({ price_groups: [{ id: 'g', category: 'photo', lines: [
    { id: 'a', name: 'Chụp chân dung', price: '1.500.000đ', detail: '2 giờ' },
    { id: 'b', name: 'Liên hệ', price: '' },
  ] }], packages: [{ name: 'Legacy', price: 1 }] })
  assert.equal(options.length, 1)
  assert.equal(options[0].price, 1500000)
  assert.equal(options[0].id, 'g:a')
})
test('deposit and balance sum exactly to the quoted service total', () => {
  for (const total of [1, 99999, 1500000, 2500001]) {
    assert.equal(bookings.calcDeposit(total) + bookings.calcRemaining(total), total)
    assert.equal(bookings.calcPtgPayout(total) + bookings.calcCommission(total), total)
  }
})
test('failed create remains a server error rather than a local success', async () => {
  result = { data: null, error: { message: 'permission denied' } }
  const response = await bookings.createBooking({ client_id: 'client', photographer_user_id: 'ptg', package_price: 1500000 })
  assert.equal(response.data, null)
  assert.equal(response.error, 'permission denied')
  assert.equal(insertPayload.deposit_amount, 300000)
  assert.equal(insertPayload.remaining_amount, 1200000)
  assert.equal(insertPayload.status, 'pending')
})
test('self bookings are rejected before writing', async () => {
  insertPayload = null
  const response = await bookings.createBooking({ client_id: 'same', photographer_user_id: 'same', package_price: 1000 })
  assert.ok(response.error)
  assert.equal(insertPayload, null)
})
test('RLS update affecting zero rows is not reported as success', async () => {
  result = { data: [], error: null }
  assert.match(await bookings.updateBookingStatus('booking', 'confirmed'), /quyền/)
})
test('revenue includes completed orders only in the current year', () => {
  const year = new Date().getFullYear()
  const months = revenueByMonth([
    { booking_date: `${year}-02-12`, status: 'completed', package_price: 2000000 },
    { booking_date: `${year}-02-13`, status: 'pending', package_price: 3000000 },
    { booking_date: `${year - 1}-02-12`, status: 'completed', package_price: 4000000 },
  ])
  assert.equal(months[1].revenue, 2000000)
  assert.equal(months[1].bookings, 2)
  assert.equal(months.length, 12)
})
