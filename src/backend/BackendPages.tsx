import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useBackend, avatar } from './BackendContext'
import type { Row } from './BackendContext'
import { checkedUpdate, errorMessage, supabase, unwrap } from './supabase'
import { statusLabels } from './model'
import * as booking from './bookings'
import { Captcha, captchaEnabled } from './Captcha'
import { AnalyticsPanel } from './AnalyticsPanel';
import { trackConversion } from './analytics';
import { useTableVersion } from './useTableVersion'

const inputClass = 'w-full border border-border rounded-xl px-4 py-3 text-sm bg-secondary/40 outline-none focus:border-primary'
const buttonClass = 'px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50'
const money = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ'
const date = (s: string) => s ? new Date(s).toLocaleDateString('vi-VN') : '—'
function Message({ error, success }: { error?: string; success?: string }) {
  return <>{error && <p role="alert" className="rounded-xl bg-red-50 text-red-800 border border-red-200 p-3 text-sm">{error}</p>}{success && <p role="status" className="rounded-xl bg-teal-50 text-teal-800 p-3 text-sm">{success}</p>}</>
}
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="max-w-6xl mx-auto p-6 sm:p-8"><h1 className="text-2xl font-bold mb-6">{title}</h1><div className="space-y-4">{children}</div></section>
}
function Field({ label, name, type = 'text', value, required = false }: { label: string; name: string; type?: string; value?: string; required?: boolean }) {
  return <label className="block text-sm font-medium space-y-1.5"><span>{label}</span><input className={inputClass} name={name} type={type} defaultValue={value} required={required} /></label>
}
function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const perform = async (task: () => Promise<void>, message = 'Đã lưu dữ liệu trên máy chủ.') => {
    if (busy) return
    setBusy(true); setError(''); setSuccess('')
    try { await task(); setSuccess(message) } catch (e) { setError(errorMessage(e)) } finally { setBusy(false) }
  }
  return { busy, error, success, perform }
}

export function RegisterForm({ onDone }: { onDone: () => void }) {
  const action = useAction()
  const verification = useAction()
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [reset, setReset] = useState(0)
  if (confirmationEmail !== null) return <form className="space-y-4" onSubmit={e => {
    e.preventDefault()
    const fields = new FormData(e.currentTarget)
    void verification.perform(async () => {
      const email = String(fields.get('email')).trim()
      const token = String(fields.get('token')).trim()
      unwrap(await supabase.auth.verifyOtp({ email, token, type: 'email' }))
      onDone()
    })
  }}>
    <h2 className="text-lg font-semibold">Xác nhận email</h2>
    <p className="text-sm text-muted-foreground">Nhập mã trong email xác nhận. Nếu email có liên kết xác nhận, bạn cũng có thể bấm vào liên kết đó.</p>
    <Message error={verification.error} />
    <Field key={confirmationEmail} label="Email đăng ký" name="email" type="email" value={confirmationEmail} required />
    <label className="block space-y-1.5 text-sm font-medium">
      <span>Mã xác nhận</span>
      <input className={inputClass} name="token" inputMode="numeric" autoComplete="one-time-code" required />
    </label>
    <button className={buttonClass} disabled={verification.busy}>{verification.busy ? 'Đang xác nhận…' : 'Xác nhận email'}</button>
    <button type="button" className="ml-3 text-sm text-primary" disabled={verification.busy} onClick={() => setConfirmationEmail(null)}>Quay lại đăng ký</button>
  </form>

  return <form className="space-y-4" onSubmit={e => {
    e.preventDefault(); const f = new FormData(e.currentTarget)
    void action.perform(async () => {
      const password = String(f.get('password'))
      if (captchaEnabled && !captchaToken) throw new Error('Vui lòng hoàn tất CAPTCHA.')
      if (password.length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.')
      const email = String(f.get('email')).trim()
      try {
        const signup = unwrap(await supabase.auth.signUp({ email, password,
          options: { captchaToken: captchaToken || undefined, emailRedirectTo: window.location.origin, data: { full_name: String(f.get('name')), phone: String(f.get('phone')) } } }))
        if (signup.user && signup.user.identities?.length) trackConversion('sign_up', { method: 'email' })
        if (signup.session) onDone()
        else setConfirmationEmail(email)
      } finally {
        setCaptchaToken(null)
        setReset(n => n + 1)
      }
    })
  }}>
    <Message {...action} />
    <Field label="Họ và tên" name="name" required /><Field label="Email" name="email" type="email" required />
    <Field label="Số điện thoại" name="phone" /><Field label="Mật khẩu (ít nhất 8 ký tự)" name="password" type="password" required />
    <p className="text-sm text-muted-foreground">Tài khoản mới là khách hàng. Bạn có thể gửi hồ sơ trở thành nhiếp ảnh gia sau khi đăng nhập.</p>
    <Captcha onToken={setCaptchaToken} resetKey={reset} />
    <button className={buttonClass} disabled={action.busy}>{action.busy ? 'Đang đăng ký…' : 'Đăng ký'}</button>
    <button type="button" disabled={action.busy} onClick={() => setConfirmationEmail("")} className="ml-3 text-primary text-sm">Tôi đã có mã xác nhận</button>
  </form>
}

export function ForgotForm() {
  const action = useAction()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [reset, setReset] = useState(0)
  return <form className="space-y-4" onSubmit={e => {
    e.preventDefault(); const f = new FormData(e.currentTarget)
    void action.perform(async () => {
      if (captchaEnabled && !captchaToken) throw new Error('Vui lòng hoàn tất CAPTCHA.')
      try { unwrap(await supabase.auth.resetPasswordForEmail(String(f.get('email')).trim(), { redirectTo: window.location.origin, captchaToken: captchaToken || undefined })) }
      finally { setCaptchaToken(null); setReset(n => n + 1) }
    }, 'Nếu email có tài khoản, bạn sẽ nhận được hướng dẫn khôi phục.')
  }}><Message {...action} /><Field label="Email" name="email" type="email" required /><Captcha onToken={setCaptchaToken} resetKey={reset} /><button className={buttonClass} disabled={action.busy}>Gửi link khôi phục</button></form>
}

export function RecoveryPage() {
  const action = useAction()
  const { logout } = useBackend()
  return <Panel title="Đặt lại mật khẩu"><form className="bg-card border border-border rounded-2xl p-6 max-w-xl space-y-4" onSubmit={e => {
    e.preventDefault(); const f = new FormData(e.currentTarget)
    void action.perform(async () => {
      const password = String(f.get('password'))
      if (password.length < 8 || password !== f.get('confirm')) throw new Error('Mật khẩu cần ít nhất 8 ký tự và hai lần nhập phải giống nhau.')
      unwrap(await supabase.auth.updateUser({ password })); await logout()
    }, 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.')
  }}><Message {...action} /><Field label="Mật khẩu mới" name="password" type="password" required /><Field label="Nhập lại mật khẩu" name="confirm" type="password" required /><button className={buttonClass} disabled={action.busy}>Lưu mật khẩu</button></form></Panel>
}

export function ProfilePage({ settings = false }: { settings?: boolean }) {
  const { profile, user, run } = useBackend()
  const action = useAction()
  if (!profile || !user) return null
  return <Panel title={settings ? 'Cài đặt tài khoản' : 'Hồ sơ cá nhân'}>
    <form key={user.id} className="bg-card border border-border rounded-2xl p-6 max-w-3xl space-y-4" onSubmit={e => {
      e.preventDefault(); const f = new FormData(e.currentTarget)
      void action.perform(async () => {
        await run(async () => {
        const patch: Row = { full_name: String(f.get('name')), phone: String(f.get('phone')), gender: f.get('gender') || null, onboarding_completed: true }
        const file = f.get('avatar') as File | null
        if (file?.size) {
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Ảnh đại diện cần là JPG, PNG hoặc WebP, tối đa 5 MB.')
          const ext = file.type.split('/')[1]
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`
          unwrap(await supabase.storage.from('avatars').upload(path, file, { contentType: file.type }))
          patch.avatar_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
        }
        await checkedUpdate('profiles', patch, 'id', user.id)
          // Refresh the authenticated profile without trusting a role supplied by the browser.
          window.dispatchEvent(new Event('memento-profile-updated'))
        })
      })
    }}>
      <div className="flex items-center gap-4"><img src={profile.avatar_url || avatar} alt="" className="w-20 h-20 rounded-2xl object-cover" /><div><h2 className="font-bold text-lg">{user.name}</h2><p className="text-sm text-muted-foreground">{user.email}</p><p className="text-xs text-muted-foreground">Tham gia {date(profile.created_at)}</p></div></div>
      <Message {...action} /><Field label="Họ và tên" name="name" value={profile.full_name || ''} required /><Field label="Số điện thoại" name="phone" value={profile.phone || ''} />
      <label className="block text-sm space-y-2"><span>Đổi ảnh đại diện</span><input className={inputClass} type="file" name="avatar" accept="image/jpeg,image/png,image/webp" /></label>
      <label className="block text-sm space-y-1.5"><span>Giới tính</span><select name="gender" defaultValue={profile.gender || ''} className={inputClass}><option value="">Chưa chọn</option><option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác</option></select></label>
      <button className={buttonClass} disabled={action.busy}>Lưu hồ sơ</button>
    </form>
    <AccountSettings />
  </Panel>
}

function AccountSettings() {
  const action = useAction()
  return <form className="bg-card border border-border rounded-2xl p-6 max-w-3xl space-y-4" onSubmit={e => {
    e.preventDefault(); const f = new FormData(e.currentTarget)
    void action.perform(async () => {
      const password = String(f.get('password'))
      if (password.length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.')
      unwrap(await supabase.auth.updateUser({ password }))
    }, 'Đã cập nhật mật khẩu.')
  }}><h2 className="font-bold">Đổi mật khẩu</h2><Message {...action} /><Field label="Mật khẩu mới" name="password" type="password" required /><button className={buttonClass} disabled={action.busy}>Đổi mật khẩu</button></form>
}

function PriceGroupEditor({ initial }: { initial: Row[] }) {
  const [groups, setGroups] = useState<Row[]>(initial)
  const update = (index: number, patch: Row) => setGroups(rows => rows.map((g, i) => i === index ? { ...g, ...patch } : g))
  return <div className="space-y-4">
    <input type="hidden" name="price_groups" value={JSON.stringify(groups)} />
    {groups.map((g, i) => <div key={g.id} className="border border-border rounded-xl p-4 space-y-3">
      <label className="block text-sm space-y-1"><span>Tên nhóm dịch vụ</span><input className={inputClass} value={g.title} onChange={e => update(i, { title: e.target.value })} required /></label>
      <select className={inputClass} aria-label="Loại dịch vụ" value={g.category || 'photo'} onChange={e => update(i, { category: e.target.value })}>{[['photo', 'Chụp ảnh'], ['makeup', 'Trang điểm'], ['editor', 'Chỉnh ảnh'], ['rental_studio', 'Thuê studio'], ['rental_outfit', 'Thuê trang phục'], ['others', 'Khác']].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      {(g.lines || []).map((line: Row, j: number) => <div key={line.id} className="grid sm:grid-cols-3 gap-2">
        {['name', 'price', 'detail'].map(key => <input key={key} className={inputClass} aria-label={key === 'name' ? 'Tên dịch vụ' : key === 'price' ? 'Giá dịch vụ' : 'Mô tả dịch vụ'} placeholder={key === 'name' ? 'Tên dịch vụ' : key === 'price' ? 'Giá (VND)' : 'Mô tả'} type={key === 'price' ? 'number' : 'text'} min={key === 'price' ? '1' : undefined} value={line[key] || ''} required={key !== 'detail'} onChange={e => update(i, { lines: g.lines.map((l: Row, k: number) => k === j ? { ...l, [key]: e.target.value } : l) })} />)}
        <button type="button" className="text-red-700 text-sm text-left" onClick={() => update(i, { lines: g.lines.filter((_: Row, k: number) => k !== j) })}>Xóa dịch vụ</button>
      </div>)}
      <div className="flex gap-4"><button type="button" className="text-primary text-sm" onClick={() => update(i, { lines: [...(g.lines || []), { id: crypto.randomUUID(), name: '', price: '', detail: '' }] })}>+ Thêm dịch vụ</button><button type="button" className="text-red-700 text-sm" onClick={() => setGroups(rows => rows.filter((_, k) => k !== i))}>Xóa nhóm</button></div>
    </div>)}
    <button type="button" className="text-primary text-sm font-semibold" onClick={() => setGroups(rows => [...rows, { id: crypto.randomUUID(), title: '', category: 'photo', lines: [{ id: crypto.randomUUID(), name: '', price: '', detail: '' }] }])}>+ Thêm nhóm dịch vụ</button>
  </div>
}

export function PhotographerEditor({ section = 'profile' }: { section?: string }) {
  const { user, photographers, run } = useBackend()
  const p = photographers.find(x => x.user_id === user?.id)
  const action = useAction()
  if (!p) return <ApplicationPage />
  return <Panel title={section === 'portfolio' ? 'Quản lý portfolio' : section === 'packages' ? 'Quản lý gói dịch vụ' : 'Hồ sơ nhiếp ảnh gia'}>
    <form key={p.id} className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-3xl" onSubmit={e => {
      e.preventDefault(); const f = new FormData(e.currentTarget)
      void action.perform(async () => {
        const patch: Row = {}
        if (section === 'portfolio') {
          const urls = String(f.get('portfolio')).split('\n').map(s => s.trim()).filter(Boolean)
          if (urls.some(s => !/^https:\/\//.test(s))) throw new Error('Mỗi ảnh cần một địa chỉ HTTPS hợp lệ.')
          const files = (f.getAll('uploads') as File[]).filter(file => file.size)
          if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) throw new Error('Ảnh cần là JPG, PNG hoặc WebP, tối đa 10 MB mỗi ảnh.')
          for (const file of files) {
            const path = `${user!.id}/edit-${Date.now()}/${crypto.randomUUID()}.${file.type.split('/')[1]}`
            unwrap(await supabase.storage.from('photographer-applications').upload(path, file, { contentType: file.type }))
            urls.push(supabase.storage.from('photographer-applications').getPublicUrl(path).data.publicUrl)
          }
          patch.standalone_pins = urls; patch.portfolio = urls
        } else if (section === 'packages') {
          const groups = JSON.parse(String(f.get('price_groups')))
          if (!Array.isArray(groups) || !groups.every(g => g.id && g.title && Array.isArray(g.lines) && g.lines.every((l: Row) => l.id && l.name && Number(String(l.price).replace(/[^\d]/g, '')) > 0))) throw new Error('Điền tên nhóm, tên dịch vụ và giá lớn hơn 0 trước khi lưu.')
          patch.price_groups = groups
        } else {
          patch.bio = String(f.get('bio')); patch.work_locations = String(f.get('location')).split(',').map(s => s.trim()).filter(Boolean)
          patch.equipment = String(f.get('equipment'))
        }
        // Same RPC used by the supplied backend; it enforces photographer ownership.
        await run(async () => { const saved = unwrap(await supabase.rpc('update_my_ptg_profile', { p_patch: patch })); if (!saved?.ok) throw new Error('Máy chủ chưa xác nhận đã lưu hồ sơ.') })
      })
    }}>
      <Message {...action} />
      {section === 'portfolio' ? <label className="block text-sm space-y-2"><span>Địa chỉ ảnh (mỗi dòng một ảnh)</span><textarea name="portfolio" rows={10} defaultValue={(p.standalone_pins || p.portfolio || []).join('\n')} className={inputClass} /><span className="block">Thêm ảnh từ máy</span><input className={inputClass} type="file" name="uploads" multiple accept="image/jpeg,image/png,image/webp" /></label> : section === 'packages' ? <PriceGroupEditor initial={p.price_groups || []} /> : <><Field label="Địa điểm làm việc (ngăn cách bằng dấu phẩy)" name="location" value={(p.work_locations || [p.location]).join(', ')} /><Field label="Thiết bị" name="equipment" value={p.equipment || ''} /><label className="block text-sm space-y-2"><span>Giới thiệu</span><textarea name="bio" defaultValue={p.bio} rows={6} className={inputClass} /></label></>}
      <button className={buttonClass} disabled={action.busy}>Lưu thay đổi</button>
    </form>
  </Panel>
}

export function ApplicationPage() {
  const { user, profile, run } = useBackend()
  const [existing, setExisting] = useState<Row | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const action = useAction()
  useEffect(() => {
    let live = true
    if (user) void supabase.from('photographer_applications').select('*').eq('user_id', user.id).maybeSingle().then(({ data, error }) => {
      if (live) { setExisting(data); setLoadError(error ? errorMessage(error) : ''); setLoading(false) }
    })
    return () => { live = false }
  }, [user?.id])
  if (!user) return null
  return <Panel title="Đăng ký trở thành nhiếp ảnh gia"><Message error={loadError} />{loading ? <p>Đang tải hồ sơ…</p> : existing?.status === 'pending' || existing?.status === 'approved' ? <p>Trạng thái hồ sơ: {existing.status === 'pending' ? 'Đang chờ duyệt' : 'Đã duyệt'}.</p> : <form className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-3xl" onSubmit={e => {
    e.preventDefault(); const f = new FormData(e.currentTarget)
    void action.perform(async () => {
      await run(async () => {
        const payload = { user_id: user.id, full_name: String(f.get('name')), phone: String(f.get('phone')), bio: String(f.get('bio')),
          work_locations: String(f.get('location')).split(',').map(s => s.trim()), selected_styles: String(f.get('styles')).split(',').map(s => s.trim()),
          proof_link: String(f.get('proof')), agreed_terms: true, status: 'pending', submitted_at: new Date().toISOString() }
        const saved = unwrap(await supabase.from('photographer_applications').upsert(payload, { onConflict: 'user_id' }).select('*').single())
        setExisting(saved)
      })
    }, 'Đã gửi hồ sơ để admin xét duyệt.')
  }}><Message {...action} />{existing?.admin_note && <p>Lý do từ chối trước: {existing.admin_note}</p>}<Field label="Họ và tên" name="name" value={existing?.full_name || profile?.full_name || ''} required /><Field label="Số điện thoại" name="phone" value={existing?.phone || profile?.phone || ''} required /><Field label="Địa điểm làm việc" name="location" value={(existing?.work_locations || []).join(', ')} required /><Field label="Phong cách (ngăn cách bằng dấu phẩy)" name="styles" value={(existing?.selected_styles || []).join(', ')} required /><Field label="Link portfolio / minh chứng" name="proof" type="url" value={existing?.proof_link || ''} required /><Field label="Giới thiệu" name="bio" value={existing?.bio || ''} /><label className="flex gap-2 text-sm"><input type="checkbox" required />Tôi đồng ý điều khoản cung cấp dịch vụ và gửi hồ sơ để xét duyệt.</label><button className={buttonClass} disabled={action.busy || Boolean(loadError)}>Gửi hồ sơ</button></form>}</Panel>
}

export function BookingList({ admin = false, calendar = false }: { admin?: boolean; calendar?: boolean }) {
  const { bookings, user, loading } = useBackend()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<string | null>(null)
  const rows = bookings.filter(b => filter === 'all' || b.status === filter).sort((a, b) => calendar ? String(a.booking_date).localeCompare(b.booking_date) : 0)
  return <Panel title={calendar ? 'Lịch chụp' : admin ? 'Quản lý đặt lịch' : 'Đặt lịch của tôi'}>
    <select className={inputClass + ' max-w-xs'} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
    {!loading && !rows.length && <p className="rounded-2xl bg-card border border-border p-6 text-muted-foreground">Chưa có đặt lịch phù hợp.</p>}
    {rows.map(b => <article key={b.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold">{b.photographer_name}</p><p className="text-xs text-muted-foreground break-all">#{b.id}</p></div><span className="text-sm bg-secondary px-3 py-1 rounded-full">{statusLabels[b.status] || b.status}</span></div>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground"><span>{date(b.booking_date)} · {b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)}</span><span>{b.package_name}</span>{admin && <span>Khách: {b.client_name || b.client_id}</span>}<strong className="text-primary">{money(Number(b.package_price))}</strong></div>
      <button className={buttonClass} onClick={() => setSelected(selected === b.id ? null : b.id)}>{selected === b.id ? 'Thu gọn' : 'Chi tiết & thao tác'}</button>
      {selected === b.id && <BookingActions key={b.id} row={b} admin={admin && user?.role === 'admin'} />}
    </article>)}
  </Panel>
}

function BookingActions({ row: b, admin }: { row: Row; admin: boolean }) {
  const { user, run } = useBackend()
  const action = useAction()
  const [drive, setDrive] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Row[]>([])
  const isClient = user?.id === b.client_id
  const isPtg = user?.id === b.photographer_user_id
  const typed = b as booking.BookingRow
  const step = booking.flowStep(typed)
  useEffect(() => {
    let live = true
    void supabase.from('booking_photo_feedback').select('*').eq('booking_id', b.id).order('created_at').then(({ data }) => { if (live) setFeedback(data || []) })
    return () => { live = false }
  }, [b.id, b.updated_at, action.success])
  const apply = (task: () => Promise<string | null>) => void action.perform(async () => { await run(async () => { const error = await task(); if (error) throw new Error(error) }) })
  const update = (status: booking.BookingStatus) => apply(() => booking.updateBookingStatus(b.id, status))
  return <div className="border-t border-border pt-4 space-y-4">
    <Message {...action} />{b.client_note && <p className="text-sm whitespace-pre-wrap">Ghi chú khách: {b.client_note}</p>}{b.ptg_note && <p className="text-sm">Ghi chú thợ: {b.ptg_note}</p>}
    <div className="flex flex-wrap gap-2">
      {isPtg && b.status === 'pending' && <><button disabled={action.busy} className={buttonClass} onClick={() => update('confirmed')}>Chấp nhận</button><button disabled={action.busy} className={buttonClass} onClick={() => update('rejected')}>Từ chối</button></>}
      {isClient && ['pending', 'confirmed'].includes(b.status) && !booking.isPaid(typed) && <button disabled={action.busy} className={buttonClass} onClick={() => update('cancelled')}>Hủy lịch chưa thanh toán</button>}
      {(isClient || isPtg) && step === 'shoot_confirm' && !(isClient ? b.shoot_confirm_client_at : b.shoot_confirm_ptg_at) && <button className={buttonClass} disabled={action.busy} onClick={() => apply(() => booking.confirmShoot(b.id))}>Xác nhận đã chụp</button>}
      {(isClient || isPtg) && booking.cancelMode(typed) === 'mutual' && <button className={buttonClass} disabled={action.busy} onClick={() => apply(async () => (await booking.requestMutualCancel(b.id)).error)}>Yêu cầu / đồng ý hủy đơn</button>}
      {(isClient || isPtg) && booking.cancelRequestState(typed, user!.id) === 'mine' && <button className={buttonClass} disabled={action.busy} onClick={() => apply(() => booking.withdrawCancelRequest(b.id))}>Rút yêu cầu hủy</button>}
      {(isClient || isPtg) && step === 'review' && <button className={buttonClass} disabled={action.busy} onClick={() => apply(async () => {
        const block = booking.finalConfirmBlock(typed, isClient ? 'client' : 'ptg', feedback.filter(f => !f.resolved).length)
        if (block) return block
        const { error } = await supabase.rpc('confirm_final', { p_booking: b.id }); return error?.message || null
      })}>Xác nhận hoàn tất</button>}
      {(isClient || isPtg) && !['cancelled', 'rejected'].includes(b.status) && <button className={buttonClass} disabled={action.busy} onClick={() => void action.perform(async () => {
        const id = unwrap(await supabase.rpc('open_booking_chat', { p_booking_id: b.id }))
        if (!id) throw new Error('Chưa mở được cuộc trò chuyện.')
        setChatId(id)
      }, 'Đã mở cuộc trò chuyện.')}>Nhắn tin</button>}
    </div>
    {isClient && (booking.isAwaitingDeposit(typed) || booking.canPayFinalNow(typed) || booking.isAwaitingFinal(typed)) && <PaymentPanel row={b} />}
    {step === 'wait_date' && <p className="text-sm text-muted-foreground">Chờ đến ngày chụp để hai bên xác nhận.</p>}
    {isPtg && ['drive', 'await_drive', 'pay_final', 'review'].includes(step) && <form className="flex gap-2" onSubmit={e => { e.preventDefault(); apply(() => { const invalid = booking.validateDriveUrl(drive); return invalid ? Promise.resolve(invalid) : booking.submitDriveUrl(b.id, drive) }) }}><input type="url" required placeholder="https://drive.google.com/…" value={drive} onChange={e => setDrive(e.target.value)} className={inputClass} /><button className={buttonClass} disabled={action.busy}>Gửi link ảnh</button></form>}
    {b.drive_url && (isPtg || admin || !booking.isStagedPayment(typed) || b.final_paid_at) && <a href={/^https:\/\//.test(b.drive_url) ? b.drive_url : '#'} target="_blank" rel="noreferrer" className="text-primary underline text-sm">Mở bộ ảnh bàn giao</a>}
    {(isClient || isPtg) && ['review', 'pay_final'].includes(step) && <div className="space-y-3"><h3 className="font-semibold">Góp ý chỉnh sửa ảnh</h3>{feedback.map(f => <div key={f.id} className="bg-secondary/40 rounded-xl p-3 text-sm"><p>{f.photo_label}: {f.note}</p><p>{f.resolved ? 'Đã chỉnh xong' : 'Chờ chỉnh sửa'}</p>{isPtg && !f.resolved && <button className={buttonClass} disabled={action.busy} onClick={() => apply(async () => {
      const { error } = await supabase.rpc('ptg_resolve_feedback', { p_feedback_id: f.id, p_resolved: true }); return error?.message || null
    })}>Đã chỉnh xong</button>}</div>)}{isClient && <form className="space-y-2" onSubmit={e => {
      e.preventDefault(); const f = new FormData(e.currentTarget)
      void action.perform(async () => { unwrap(await supabase.from('booking_photo_feedback').insert({ booking_id: b.id, user_id: user!.id, photo_label: String(f.get('photo')), note: String(f.get('note')) }).select('id').single()) }, 'Đã gửi góp ý.')
    }}><Field label="Tên / số thứ tự ảnh" name="photo" required /><Field label="Nội dung chỉnh sửa" name="note" required /><button className={buttonClass} disabled={action.busy}>Gửi góp ý</button></form>}</div>}
    {isClient && b.refund_status === 'need_info' && <RefundForm id={b.id} />}
    {admin && <AdminPaymentActions row={b} />}
    {chatId && <Chat conversationId={chatId} />}
  </div>
}

function PaymentPanel({ row: b }: { row: Row }) {
  const action = useAction()
  const { run } = useBackend()
  const typed = b as booking.BookingRow
  const final = !booking.isAwaitingDeposit(typed)
  const amount = final ? booking.getRemainingAmount(typed) : booking.getDepositAmount(typed)
  const description = final ? booking.buildFinalDescription(b.id) : booking.buildDepositDescription(b.id)
  const account = import.meta.env.VITE_PAYMENT_ACCOUNT
  const bank = import.meta.env.VITE_PAYMENT_BANK
  const accountName = import.meta.env.VITE_PAYMENT_ACCOUNT_NAME || ''
  return <div className="bg-secondary/40 p-4 rounded-xl space-y-3"><h3 className="font-semibold">{final ? 'Thanh toán phần còn lại' : 'Đặt cọc'}: {money(amount)}</h3><Message {...action} />
    {account && bank ? <><p className="text-sm">{bank} · {account} · {accountName}</p><p className="text-sm">Nội dung: <strong>{description}</strong></p><img className="w-48 rounded-xl" alt="QR chuyển khoản" src={booking.buildVietQrUrl({ account, bank, amount, description })} />{!final && <button className={buttonClass} disabled={action.busy || booking.isUserTransferReported(typed)} onClick={() => void action.perform(async () => { await run(async () => { const error = await booking.reportUserTransfer(b.id); if (error) throw new Error(error) }) }, 'Đã báo chuyển khoản, chờ admin đối soát.')}>{booking.isUserTransferReported(typed) ? 'Đang chờ đối soát' : 'Tôi đã chuyển khoản'}</button>}<p className="text-xs text-muted-foreground">Trạng thái thanh toán được cập nhật sau khi admin xác nhận nhận tiền.</p></> : <p className="text-sm">Chưa cấu hình tài khoản nhận tiền cho FE. Liên hệ quản trị viên trước khi chuyển khoản.</p>}
  </div>
}

function RefundForm({ id }: { id: string }) {
  const action = useAction()
  const { run } = useBackend()
  return <form className="space-y-3" onSubmit={e => {
    e.preventDefault(); const f = new FormData(e.currentTarget)
    void action.perform(async () => { await run(async () => {
      const { error } = await supabase.rpc('submit_refund_info', { p_booking: id, p_bank_code: String(f.get('bank')), p_bank_name: String(f.get('bank')), p_save: false, p_account: String(f.get('account')), p_account_name: String(f.get('name')) })
      if (error) throw error
    }) })
  }}><h3 className="font-semibold">Tài khoản nhận hoàn tiền</h3><Message {...action} /><Field name="bank" label="Mã ngân hàng" required /><Field name="account" label="Số tài khoản" required /><Field name="name" label="Tên chủ tài khoản" required /><button className={buttonClass} disabled={action.busy}>Gửi thông tin hoàn tiền</button></form>
}

function AdminPaymentActions({ row: b }: { row: Row }) {
  const { run } = useBackend()
  const action = useAction()
  const rpc = (name: string, args: Row) => void action.perform(async () => { await run(async () => { unwrap(await supabase.rpc(name, args)) }) })
  return <div className="border-t pt-3 space-y-3"><h3 className="font-bold">Đối soát thanh toán (admin)</h3><Message {...action} />
    <div className="flex flex-wrap gap-2">{b.status === 'confirmed' && !b.deposit_paid_at && <button className={buttonClass} disabled={action.busy} onClick={() => rpc('admin_mark_booking_paid', { p_booking_id: b.id, p_note: booking.buildDepositDescription(b.id) })}>Xác nhận đã nhận cọc</button>}
      {b.deposit_paid_at && !b.final_paid_at && !['cancelled', 'rejected', 'completed'].includes(b.status) && <button className={buttonClass} disabled={action.busy} onClick={() => void action.perform(async () => { await run(async () => { await checkedUpdate('bookings', { final_paid_at: new Date().toISOString(), payment_status: 'fully_paid', updated_at: new Date().toISOString() }, 'id', b.id) }) })}>Xác nhận nhận phần còn lại</button>}
      {b.status === 'closing' && <button className={buttonClass} disabled={action.busy} onClick={() => rpc('admin_mark_ptg_payout', { p_booking_id: b.id, p_kind: 'final', p_ref: null })}>Đã chuyển tiền cho thợ / chốt đơn</button>}
    </div><p className="text-xs text-muted-foreground">Chỉ xác nhận sau khi đã kiểm tra giao dịch ngân hàng.</p>
  </div>
}

export function ReviewsPanel({ photographerId, admin = false }: { photographerId?: number; admin?: boolean }) {
  const reviewVersion = useTableVersion('photographer_reviews')
  const { user } = useBackend()
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const action = useAction()
  useEffect(() => {
    let live = true
    const query = admin ? supabase.from('photographer_reviews').select('*').order('created_at', { ascending: false }) : supabase.rpc('list_photographer_reviews', { p_photographer_id: photographerId, p_limit: 50, p_offset: 0 })
    void Promise.resolve(query).then(result => { if (live) { if (result.error) setError(errorMessage(result.error)); else { setRows(result.data || []); setError('') } } })
    return () => { live = false }
  }, [photographerId, admin, version, reviewVersion])
  return <div className="space-y-4"><Message error={error || action.error} success={action.success} />{rows.length === 0 && !error && <p className="text-sm text-muted-foreground">Chưa có đánh giá.</p>}{rows.map(r => <article key={r.id} className="bg-card border border-border rounded-2xl p-4 space-y-2"><div className="flex justify-between gap-3"><strong>{r.reviewer_name || (admin ? r.reviewer_id : 'Thành viên')}</strong><span>{r.rating} / 5 · {date(r.created_at)}</span></div><p className="text-sm">{r.comment}</p>{admin && <button className={buttonClass} disabled={action.busy} onClick={() => void action.perform(async () => {
    await checkedUpdate('photographer_reviews', { hidden: !r.hidden }, 'id', r.id); setVersion(v => v + 1)
  })}>{r.hidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}</button>}</article>)}
    {user && photographerId && !admin && <form className="bg-card border border-border rounded-2xl p-5 space-y-3" onSubmit={e => {
      e.preventDefault(); const f = new FormData(e.currentTarget)
      void action.perform(async () => { unwrap(await supabase.rpc('submit_review', { p_photographer_id: photographerId, p_rating: Number(f.get('rating')), p_comment: String(f.get('comment')) })); setVersion(v => v + 1) }, 'Đã lưu đánh giá.')
    }}><h3 className="font-bold">Đánh giá của bạn</h3><select name="rating" className={inputClass}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} sao</option>)}</select><textarea name="comment" required maxLength={2000} rows={3} className={inputClass} placeholder="Chia sẻ trải nghiệm…" /><button className={buttonClass} disabled={action.busy}>Gửi / cập nhật đánh giá</button></form>}
  </div>
}

export function Notifications() {
  const { notifications, run } = useBackend()
  const action = useAction()
  return <Panel title="Thông báo"><Message {...action} /><button className={buttonClass} disabled={action.busy || !notifications.some(n => !n.read_at)} onClick={() => void action.perform(async () => { await run(async () => { unwrap(await supabase.rpc('mark_notifications_read', { p_ids: notifications.filter(n => !n.read_at).map(n => n.id), p_tab: null })) }) })}>Đánh dấu tất cả đã đọc</button>{!notifications.length && <p>Chưa có thông báo.</p>}{notifications.map(n => <article key={n.id} className={'bg-card border border-border rounded-2xl p-5 ' + (n.read_at ? 'opacity-60' : '')}><h3 className="font-bold">{n.title}</h3><p className="text-sm mt-1">{n.body}</p><p className="text-xs text-muted-foreground mt-2">{date(n.created_at)}</p></article>)}</Panel>
}

export function Messages() {
  const { user } = useBackend()
  const [rows, setRows] = useState<Row[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    void supabase.rpc('list_my_conversations').then(({ data, error }) => { if (live) { setRows(data || []); setError(error ? errorMessage(error) : '') } })
    return () => { live = false }
  }, [user?.id])
  return <Panel title="Tin nhắn"><Message error={error} />{!rows.length && !error && <p>Chưa có cuộc trò chuyện. Bạn có thể mở chat trong chi tiết đặt lịch.</p>}<div className="grid md:grid-cols-3 gap-5"><div className="space-y-2">{rows.map(r => <button key={r.conversation_id} className="bg-card border border-border rounded-xl p-4 text-left w-full" onClick={() => setSelected(r.conversation_id)}><strong className="text-sm">{r.partner_name}</strong><p className="text-sm truncate text-muted-foreground">{r.last_body || 'Bắt đầu trò chuyện'}</p>{r.unread_count > 0 && <span className="text-xs text-primary">{r.unread_count} chưa đọc</span>}</button>)}</div><div className="md:col-span-2">{selected && <Chat key={selected} conversationId={selected} canSend={rows.find(r => r.conversation_id === selected)?.can_send !== false} />}</div></div></Panel>
}

function Chat({ conversationId, canSend = true }: { conversationId: string; canSend?: boolean }) {
  const { user } = useBackend()
  const [messages, setMessages] = useState<Row[]>([])
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const action = useAction()
  useEffect(() => {
    let live = true
    const load = async () => {
      const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(100)
      if (live) { setMessages((data || []).reverse()); setError(error ? errorMessage(error) : '') }
      if (!error) await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId })
    }
    void load()
    const ch = supabase.channel(`messages:${conversationId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, () => void load()).subscribe()
    return () => { live = false; void supabase.removeChannel(ch) }
  }, [conversationId])
  return <div className="bg-card border border-border rounded-2xl p-4 space-y-3"><Message error={error || action.error} /><div className="max-h-96 overflow-y-auto flex flex-col gap-2">{messages.map(m => <p key={m.id} className={'rounded-xl px-3 py-2 text-sm whitespace-pre-wrap max-w-[85%] ' + (m.sender_id === user?.id ? 'bg-primary text-white self-end' : 'bg-secondary self-start')}>{m.body}</p>)}</div><form className="flex gap-2" onSubmit={e => {
    e.preventDefault(); const text = body.trim(); if (!text) return
    void action.perform(async () => {
      const sent = unwrap(await supabase.rpc('send_message', { p_conversation_id: conversationId, p_body: text }))
      if (sent?.id) setMessages(prev => [...prev.filter(m => m.id !== sent.id), sent].sort((a, b) => a.created_at.localeCompare(b.created_at)))
      setBody('')
    }, '')
  }}><input className={inputClass} value={body} onChange={e => setBody(e.target.value)} maxLength={2000} disabled={!canSend} placeholder={canSend ? 'Nhập tin nhắn…' : 'Cuộc trò chuyện chỉ đọc'} /><button className={buttonClass} disabled={action.busy || !canSend || !body.trim()}>Gửi</button></form></div>
}

export function AdminUsers() {
  const { users, run } = useBackend()
  const [search, setSearch] = useState('')
  const action = useAction()
  return <Panel title="Quản lý người dùng"><Message {...action} /><input className={inputClass} placeholder="Tìm tên hoặc email…" value={search} onChange={e => setSearch(e.target.value)} /><div className="bg-card border border-border rounded-2xl overflow-x-auto"><table className="w-full text-sm"><thead><tr>{['Người dùng', 'Email', 'Vai trò', 'Trạng thái', 'Thao tác'].map(h => <th className="text-left p-4" key={h}>{h}</th>)}</tr></thead><tbody>{users.filter(u => `${u.full_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())).map(u => <tr key={u.id} className="border-t border-border"><td className="p-4">{u.full_name || u.username || '—'}</td><td className="p-4">{u.email}</td><td className="p-4">{u.role}</td><td className="p-4">{u.deleted_at ? 'Đã xóa' : u.banned_at ? 'Đã khóa' : 'Hoạt động'}</td><td className="p-4">{u.role !== 'admin' && !u.deleted_at && <button className={buttonClass} disabled={action.busy} onClick={() => void action.perform(async () => { await run(async () => { await checkedUpdate('profiles', { banned_at: u.banned_at ? null : new Date().toISOString(), ban_reason: u.banned_at ? null : 'Khóa bởi quản trị viên' }, 'id', u.id) }) })}>{u.banned_at ? 'Mở khóa' : 'Khóa tài khoản'}</button>}</td></tr>)}</tbody></table></div></Panel>
}

export function AdminApplications() {
  const { applications, run } = useBackend()
  const action = useAction()
  const [notes, setNotes] = useState<Record<string, string>>({})
  return <Panel title="Duyệt hồ sơ nhiếp ảnh gia"><Message {...action} />{!applications.some(a => a.status === 'pending') && <p>Không có hồ sơ chờ duyệt.</p>}{applications.filter(a => a.status === 'pending').map(a => <article key={a.user_id} className="bg-card border border-border rounded-2xl p-5 space-y-3"><h3 className="font-bold">{a.full_name}</h3><p className="text-sm">{a.bio}</p><p className="text-sm">{(a.work_locations || []).join(', ')} · {(a.selected_styles || []).join(', ')}</p>{a.proof_link && /^https:\/\//.test(a.proof_link) && <a href={a.proof_link} target="_blank" rel="noreferrer" className="text-primary underline text-sm">Xem minh chứng</a>}<input className={inputClass} value={notes[a.user_id] || ''} onChange={e => setNotes(n => ({ ...n, [a.user_id]: e.target.value }))} placeholder="Lý do từ chối (bắt buộc khi từ chối)" /><div className="flex gap-2">{[true, false].map(approve => <button key={String(approve)} className={buttonClass} disabled={action.busy} onClick={() => void action.perform(async () => {
    if (!approve && !notes[a.user_id]?.trim()) throw new Error('Vui lòng nhập lý do từ chối.')
    await run(async () => {
      const result = unwrap(await supabase.rpc('admin_set_application_status', { p_user_id: a.user_id, p_status: approve ? 'approved' : 'rejected', p_note: approve ? null : notes[a.user_id].trim() }))
      if (!result?.ok) throw new Error('Máy chủ chưa xác nhận kết quả duyệt.')
    })
  }, approve ? 'Đã duyệt hồ sơ.' : 'Đã từ chối hồ sơ.')}>{approve ? 'Duyệt hồ sơ' : 'Từ chối'}</button>)}</div></article>)}</Panel>
}

export function Dashboard({ admin = false }: { admin?: boolean }) {
  const { bookings, photographers, users, user, applications, loading, errors } = useBackend()
  if (loading) return <Panel title="Dashboard"><p>Đang tải dữ liệu…</p></Panel>
  if (Object.keys(errors).length) return <Panel title="Dashboard"><p>Chưa thể tổng hợp thống kê vì có dữ liệu tải không thành công. Hãy thử lại kết nối ở thông báo phía trên.</p></Panel>
  const completed = bookings.filter(b => b.status === 'completed')
  const total = completed.reduce((s, b) => s + Number(b.package_price || 0), 0)
  const items = admin ? [['Người dùng', users.length], ['Nhiếp ảnh gia', photographers.length], ['Đơn đặt lịch', bookings.length], ['Chờ duyệt', applications.filter(a => a.status === 'pending').length]] : [['Đơn đặt lịch', bookings.length], ['Chờ xác nhận', bookings.filter(b => b.status === 'pending').length], ['Hoàn thành', completed.length], [user?.role === 'photographer' ? 'Giá trị đơn hoàn thành' : 'Tổng giá trị đơn hoàn thành', money(total)]]
  return <Panel title={`Xin chào, ${user?.name || 'bạn'}`}>{admin && <AnalyticsPanel />}<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{items.map(([label, value]) => <div key={label} className="bg-card border border-border rounded-2xl p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl text-primary font-bold mt-2">{value}</p></div>)}</div><div className="bg-card border border-border rounded-2xl p-5"><h2 className="font-bold mb-3">Đặt lịch gần đây</h2>{!bookings.length && <p className="text-sm text-muted-foreground">Chưa có đặt lịch.</p>}{bookings.slice(0, 6).map(b => <div key={b.id} className="flex justify-between gap-3 py-3 border-b border-border last:border-0 text-sm"><span>{b.photographer_name} · {date(b.booking_date)}</span><span>{statusLabels[b.status] || b.status}</span></div>)}</div></Panel>
}

export function Unsupported({ title }: { title: string }) {
  return <Panel title={title}><div className="bg-card border border-border rounded-2xl p-6"><p className="text-sm text-muted-foreground">Backend hiện chưa cung cấp thao tác cho màn hình này.</p></div></Panel>
}
