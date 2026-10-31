import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Re-fetch read models when Postgres publishes a change, or on return to the tab.
export function useTableVersion(table: string) {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const update = () => { clearTimeout(timer); timer = setTimeout(() => setVersion(v => v + 1), 200) }
    const channel = supabase.channel(`read:${table}:${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, update)
      .subscribe()
    window.addEventListener('focus', update)
    return () => { clearTimeout(timer); window.removeEventListener('focus', update); void supabase.removeChannel(channel) }
  }, [table])
  return version
}
