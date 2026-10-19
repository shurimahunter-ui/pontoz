import { connection } from 'next/server'
import { logout } from '@/app/actions/auth'
import Logo from '@/components/Logo'
import Nav from '@/components/Nav'
import { createClient } from '@/lib/supabase/server'

export const instant = false

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user!.id).single()

  return (
    <div className="shell">
      <header className="topbar">
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2"><Logo size={22} /><span className="font-bold">Ponto</span></div>
          <form action={logout} className="flex items-center gap-3">
            <span className="muted text-sm">{profile?.name}</span>
            <button className="btn btn-quiet">Sair</button>
          </form>
        </div>
        <Nav />
      </header>
      <div className="px-4 py-6">{children}</div>
    </div>
  )
}
