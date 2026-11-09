import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { backendConfigured, errorMessage, supabase, unwrap } from './supabase'
import { buildServiceOptions } from './model'
import type { ServiceOption } from './model'

export type Row = Record<string, any>
export type Photographer = Row & {
  id: number; name: string; avatar: string; specialty: string; rating: number; reviews: number;
  location: string; price: number; verified: boolean; tags: string[]; bio: string; portfolio: string[];
  completedJobs: number; responseTime: string; packages: ServiceOption[];
}
export type User = { id: string; email: string; name: string; role: 'client' | 'photographer' | 'admin' }
export const avatar = '/avatar.svg'

export function mapPhotographer(p: Row): Photographer {
  const packages = buildServiceOptions(p)
  return { ...p, id: Number(p.id), name: p.name || 'Nhiếp ảnh gia', avatar: p.avatar || avatar,
    specialty: p.specialty || '', location: p.location || '', bio: p.bio || '', tags: [...new Set([...(p.tags || []), ...(p.shooting_styles || []), p.specialty].filter(Boolean))],
    portfolio: [...new Set([...(p.portfolio || []), ...(p.standalone_pins || []), ...(p.boards || []).flatMap((b: Row) => b.pins || [])])],
    packages, price: packages.length ? Math.min(...packages.map((x) => x.price)) : Number(p.price || 0),
    rating: Number(p.rating || 0), reviews: Number(p.review_count || 0), completedJobs: Number(p.completed_deals ?? p.bookings ?? 0),
    verified: p.verified === true, responseTime: p.response_time || 'Chưa có dữ liệu' }
}

type State = {
  user: User | null; profile: Row | null; session: Session | null; authLoading: boolean; loading: boolean;
  photographers: Photographer[]; photographersLoaded: boolean; bookings: Row[]; pins: number[]; notifications: Row[]; users: Row[]; applications: Row[];
  errors: Record<string, string>; recovery: boolean;
  refresh: () => Promise<void>; login: (email: string, password: string, captchaToken?: string) => Promise<void>; logout: () => Promise<void>;
  run: <T>(task: () => Promise<T>) => Promise<T>; togglePin: (id: number) => Promise<void>;
}
const Context = createContext<State | null>(null)
export function useBackend() {
  const value = useContext(Context)
  if (!value) throw new Error('BackendProvider missing')
  return value
}

export function BackendProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Row | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [photographersLoaded, setPhotographersLoaded] = useState(false)
  const [bookings, setBookings] = useState<Row[]>([])
  const [pins, setPins] = useState<number[]>([])
  const [notifications, setNotifications] = useState<Row[]>([])
  const [users, setUsers] = useState<Row[]>([])
  const [applications, setApplications] = useState<Row[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [recovery, setRecovery] = useState(false)
  const authVersion = useRef(0)
  const dataVersion = useRef(0)

  useEffect(() => {
    let live = true
    async function receive(next: Session | null) {
      const version = ++authVersion.current
      setSession(next); setProfile(null); setAuthLoading(true)
      setBookings([]); setPins([]); setNotifications([]); setUsers([]); setApplications([])
      ++dataVersion.current
      if (!next) { setAuthLoading(false); return }
      try {
        let row: Row | null = null
        for (let attempt = 0; attempt < 3; attempt++) {
          row = unwrap(await supabase.from('profiles').select('*').eq('id', next.user.id).maybeSingle())
          if (row) break
          await new Promise(resolve => setTimeout(resolve, 400))
        }
        if (!row) throw new Error('Chưa có hồ sơ trong bảng profiles. Kiểm tra trigger tạo hồ sơ của Supabase.')
        if (row.banned_at || row.deleted_at) { await supabase.auth.signOut(); throw new Error('Tài khoản đã bị khóa hoặc đã xóa.') }
        if (live && version === authVersion.current) {
          setProfile(row); setErrors(previous => { const nextErrors = { ...previous }; delete nextErrors.auth; return nextErrors })
        }
      } catch (error) {
        if (live && version === authVersion.current) setErrors(previous => ({ ...previous, auth: errorMessage(error) }))
      } finally { if (live && version === authVersion.current) setAuthLoading(false) }
    }
    // Defer database queries out of the auth callback to avoid holding the auth lock.
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (!live) return
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event !== 'TOKEN_REFRESHED') setTimeout(() => { if (live) void receive(next) }, 0)
      else setSession(next)
    })
    return () => { live = false; ++authVersion.current; data.subscription.unsubscribe() }
  }, [])

  const uid = session?.user.id
  const role = profile?.role

  useEffect(() => {
    const update = () => {
      if (uid) void supabase.from('profiles').select('*').eq('id', uid).single().then(({ data, error }) => {
        if (!error) {
          if (data.banned_at || data.deleted_at) void supabase.auth.signOut()
          else setProfile(data)
        }
      })
    }
    window.addEventListener('memento-profile-updated', update)
    return () => window.removeEventListener('memento-profile-updated', update)
  }, [uid])
  const refresh = useCallback(async () => {
    const version = ++dataVersion.current
    setLoading(true)
    const nextErrors: Record<string, string> = {}
    if (!backendConfigured) nextErrors.config = 'Chưa cấu hình Supabase. Điền .env.local theo .env.example.'
    const read = async (name: string, query: PromiseLike<any>, commit: (rows: Row[], success: boolean) => void) => {
      try {
        const data = unwrap(await query) as Row[]
        if (version === dataVersion.current) commit(data || [], true)
      } catch (error) {
        nextErrors[name] = errorMessage(error)
        if (version === dataVersion.current) commit([], false)
      }
    }
    const publicPhotographers = async () => {
      const rows = unwrap(await supabase.from('photographers').select('id,user_id,name,location,price,rating,bookings,specialty,avatar,cover,portfolio,bio,tags,packages,boards,standalone_pins,work_locations,shooting_styles,experience_years,equipment,languages,work_model,price_groups,rental_boards,rental_pins,skill_rental,skill_makeup,skill_edit').order('id'))
      const stats = unwrap(await supabase.rpc('get_photographers_stats')) as Row[]
      const excluded = unwrap(await supabase.from('profiles').select('id').or('banned_at.not.is.null,deleted_at.not.is.null,role.eq.admin'))
      const excludedIds = new Set(excluded.map(p => p.id))
      const byId = new Map((stats || []).map(s => [Number(s.photographer_id), s]))
      return { data: rows.filter(p => !excludedIds.has(p.user_id)).map(p => ({ ...p, ...(byId.get(Number(p.id)) || {}) })), error: null }
    }
    const tasks = [read('Danh sách thợ', publicPhotographers(), (rows, success) => {
      setPhotographers(rows.map(mapPhotographer))
      setPhotographersLoaded(success)
    })]
    if (uid && profile) {
      let bookingQuery = supabase.from('bookings').select('*').order('created_at', { ascending: false })
      if (role !== 'admin') bookingQuery = bookingQuery.or(`client_id.eq.${uid},photographer_user_id.eq.${uid}`)
      tasks.push(read('Đặt lịch', bookingQuery, setBookings))
      tasks.push(read('Yêu thích', supabase.from('pinned_photographers').select('photographer_id').eq('user_id', uid), rows => setPins(rows.map(r => Number(r.photographer_id)))))
      tasks.push(read('Thông báo', supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(100), setNotifications))
      if (role === 'admin') {
        tasks.push(read('Người dùng', supabase.from('profiles').select('*').order('created_at', { ascending: false }), setUsers))
        tasks.push(read('Hồ sơ chờ duyệt', supabase.from('photographer_applications').select('*').order('submitted_at', { ascending: false }), setApplications))
      }
    }
    await Promise.allSettled(tasks)
    if (version !== dataVersion.current) return
    setErrors(previous => ({ ...(previous.auth ? { auth: previous.auth } : {}), ...nextErrors }))
    setLoading(false)
  }, [uid, role, profile])

  useEffect(() => { void refresh(); return () => { ++dataVersion.current } }, [refresh])
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 300) }
    const ch = supabase.channel(`memento:${uid || 'public'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photographers' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photographer_reviews' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, schedule)
    if (uid) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, schedule)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pinned_photographers', filter: `user_id=eq.${uid}` }, schedule)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` }, () => window.dispatchEvent(new Event('memento-profile-updated')))
    }
    if (role === 'admin') {
      ch.on('postgres_changes', { event: '*', schema: 'public', table: 'photographer_applications' }, schedule)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, schedule)
    }
    ch.subscribe()
    const focus = () => void refresh()
    // Realtime depends on the server publication. Re-sync visible tabs even when
    // a table has not been enabled for postgres_changes on the deployed project.
    const poll = setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, 30000)
    window.addEventListener('focus', focus)
    return () => { clearTimeout(timer); clearInterval(poll); window.removeEventListener('focus', focus); void supabase.removeChannel(ch) }
  }, [uid, role, refresh])

  const user: User | null = session && profile ? { id: session.user.id, email: session.user.email || '',
    name: profile.full_name || profile.username || session.user.email || 'Thành viên',
    role: role === 'admin' ? 'admin' : role === 'photographer' ? 'photographer' : 'client' } : null
  const run = async <T,>(task: () => Promise<T>) => { const result = await task(); await refresh(); return result }
  return <Context.Provider value={{ session, profile, user, authLoading, loading, photographers, photographersLoaded, bookings, pins, notifications, users, applications, errors, recovery,
    refresh, run,
    login: async (email, password, captchaToken) => { unwrap(await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } })) },
    logout: async () => { unwrap(await supabase.auth.signOut()); setRecovery(false) },
    togglePin: async id => {
      if (!uid) throw new Error('Vui lòng đăng nhập để lưu yêu thích.')
      await run(async () => {
        if (pins.includes(id)) unwrap(await supabase.from('pinned_photographers').delete().eq('user_id', uid).eq('photographer_id', id))
        else unwrap(await supabase.from('pinned_photographers').upsert({ user_id: uid, photographer_id: id }, { onConflict: 'user_id,photographer_id', ignoreDuplicates: true }))
      })
    },
  }}>{children}</Context.Provider>
}

export function BackendStatus() {
  const { errors, loading, refresh, session, user, authLoading } = useBackend()
  return <div className="max-w-7xl mx-auto px-6" aria-live="polite">
    {loading && <p className="text-sm text-muted-foreground py-2">Đang tải dữ liệu Supabase…</p>}
    {Object.entries(errors).map(([name, message]) => <div key={name} role="alert" className="my-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex justify-between gap-3"><span>{name}: {message}</span><button onClick={() => errors.auth ? window.location.reload() : void refresh()}>Thử lại</button></div>)}
    {session && !user && !authLoading && <p className="text-sm py-2">Đã có phiên đăng nhập nhưng chưa tải được quyền tài khoản.</p>}
  </div>
}
