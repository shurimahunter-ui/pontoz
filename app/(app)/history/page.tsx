import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { durationMs, fmtDay, fmtTime, formatHM, groupByDay, hoursToMs, totalMs, type Entry } from '@/lib/hours'

export const instant = false

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await connection()
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('timezone, daily_hours').eq('id', user.id).single()
  const tz: string = profile!.timezone
  const now = new Date()

  const iso = /^\d{4}-\d{2}-\d{2}$/
  const from = sp.from && iso.test(sp.from) ? sp.from : new Date(now.getTime() - 30 * 864e5).toLocaleDateString('en-CA', { timeZone: tz })
  const to = sp.to && iso.test(sp.to) ? sp.to : now.toLocaleDateString('en-CA', { timeZone: tz })

  const { data } = await supabase
    .from('time_entries')
    .select('id, clock_in, clock_out')
    .gte('clock_in', new Date(`${from}T00:00:00Z`).toISOString())
    .lt('clock_in', new Date(new Date(`${to}T00:00:00Z`).getTime() + 2 * 864e5).toISOString())
    .order('clock_in', { ascending: false })
    .limit(500)

  const days = groupByDay((data ?? []) as Entry[], tz).filter(([k]) => k >= from && k <= to)
  const daily = hoursToMs(Number(profile!.daily_hours))

  return (
    <main className="space-y-4">
      <h1>Histórico</h1>
      <form className="flex flex-wrap items-end gap-3">
        <label className="label">De <input type="date" name="from" defaultValue={from} className="field" /></label>
        <label className="label">Até <input type="date" name="to" defaultValue={to} className="field" /></label>
        <button className="btn btn-quiet" style={{ padding: '0.65rem 1rem' }}>Filtrar</button>
      </form>

      {days.length === 0 && <p className="muted">Nenhum registro neste período.</p>}

      {days.map(([key, entries]) => {
        const total = totalMs(entries, now)
        const diff = total - daily
        return (
          <section key={key} className="card">
            <div className="flex items-baseline justify-between">
              <h2 className="capitalize">{fmtDay(key)}</h2>
              <span className="num font-bold">
                {formatHM(total)} <span className="muted font-normal">({diff >= 0 ? '+' : '−'}{formatHM(Math.abs(diff))})</span>
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {entries.slice().reverse().map((e) => (
                <li key={e.id} className="num flex justify-between">
                  <span>{fmtTime(e.clock_in, tz)} – {e.clock_out ? fmtTime(e.clock_out, tz) : 'em aberto'}</span>
                  <span className="muted">{formatHM(durationMs(e, now))}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </main>
  )
}
