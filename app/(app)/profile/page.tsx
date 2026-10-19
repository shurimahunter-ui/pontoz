import { redirect } from 'next/navigation'
import { updateProfile } from '@/app/actions/profile'
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <main className="space-y-4">
      <h1>Perfil</h1>
      <form action={updateProfile} className="card space-y-4">
        {sp.saved && <p role="status" className="ok">Alterações salvas.</p>}
        {sp.error && <p role="alert" className="err">Confira os valores: jornada entre 0,5 e 24 h e meta até 168 h.</p>}
        <label className="label">Nome
          <input name="name" defaultValue={p.name} required className="field" />
        </label>
        <label className="label">Jornada diária (horas)
          <input name="daily_hours" type="number" step="0.25" inputMode="decimal" defaultValue={Number(p.daily_hours)} required className="field" />
        </label>
        <label className="label">Meta semanal (horas)
          <input name="weekly_goal_hours" type="number" step="0.5" inputMode="decimal" defaultValue={Number(p.weekly_goal_hours)} required className="field" />
        </label>
        <label className="label">Fuso horário
          <input name="timezone" defaultValue={p.timezone} required className="field" />
        </label>
        <button className="btn">Salvar alterações</button>
      </form>
    </main>
  )
}
