import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { clockIn, clockOut } from '@/app/actions/punch'
import { createClient } from '@/lib/supabase/server'
import { dayKey, dayStart, fmtDay, fmtTime, formatHM, hoursToMs, totalMs, weekMs, weekStart, type Entry } from '@/lib/hours'

export const instant = false

export default async function HomePage() {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const tz: string = profile.timezone
  const now = new Date()
  const weekStartAt = weekStart(now, tz)
  const start = weekStartAt.toISOString()

  const { data } = await supabase
    .from('time_entries')
    .select('id, clock_in, clock_out')
    .or(`clock_in.gte.${start},clock_out.is.null,clock_out.gt.${start}`)
    .order('clock_in', { ascending: false })
  const entries = (data ?? []) as Entry[]

  const open = entries.find((e) => !e.clock_out)
  const done = weekMs(entries, now, tz)
  const goal = hoursToMs(Number(profile.weekly_goal_hours))
  const pct = goal ? Math.min(100, Math.round((done / goal) * 100)) : 0
  const firstDay = dayKey(weekStartAt, tz)
  const firstDayUtc = new Date(`${firstDay}T00:00:00Z`)
  const chartDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstDayUtc)
    date.setUTCDate(date.getUTCDate() + index)
    const key = date.toISOString().slice(0, 10)
    const nextDate = new Date(date)
    nextDate.setUTCDate(nextDate.getUTCDate() + 1)
    const nextKey = nextDate.toISOString().slice(0, 10)
    const from = dayStart(key, tz)
    const to = dayStart(nextKey, tz)

    return { key, total: totalMs(entries, now, from, to) }
  })
  const chartMax = Math.max(
    Number(profile.daily_hours),
    ...chartDays.map(({ total }) => total / 3_600_000),
    1,
  )
  const today = dayKey(now, tz)

  return (
    <main className="space-y-6">
      <section className="space-y-4">
        <h1>{open ? `Em expediente desde ${fmtTime(open.clock_in, tz)}` : 'Fora do expediente'}</h1>
        <form action={open ? clockOut : clockIn}>
          <button className={`btn ${open ? 'btn-outline' : ''}`}>{open ? 'Registrar saída' : 'Registrar entrada'}</button>
        </form>
      </section>

      <section className="card space-y-3">
        <div className="flex items-baseline justify-between">
          <h2>Esta semana</h2>
          <span className="num font-bold">{formatHM(done)} <span className="muted font-normal">de {formatHM(goal)}</span></span>
        </div>
        <div className="bar" role="progressbar" aria-label="Meta semanal" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${pct}%` }} />
        </div>
        <p className="muted text-sm">
          {done >= goal ? 'Meta atingida.' : `Faltam ${formatHM(goal - done)}.`} Jornada diária: {Number(profile.daily_hours)}h.
        </p>
      </section>

      <section className="card chart-card" aria-labelledby="daily-chart-heading">
        <div className="chart-heading">
          <div>
            <h2 id="daily-chart-heading">Horas por dia</h2>
            <p className="muted text-sm">Esta semana · meta diária de {Number(profile.daily_hours)}h</p>
          </div>
        </div>
        <div
          className="daily-chart"
          role="list"
          aria-label={`Horas trabalhadas por dia nesta semana. Meta diária: ${Number(profile.daily_hours)} horas.`}
        >
          {chartDays.map(({ key, total }) => (
            <div
              className={`chart-day${key === today ? ' chart-day-today' : ''}`}
              key={key}
              role="listitem"
              aria-label={`${fmtDay(key)}: ${formatHM(total)}`}
              aria-current={key === today ? 'date' : undefined}
            >
              <span className="chart-value num">{formatHM(total)}</span>
              <div className="chart-track" aria-hidden="true">
                <div
                  className="chart-bar"
                  style={{ height: `${Math.min(100, (total / 3_600_000 / chartMax) * 100)}%` }}
                />
              </div>
              <span className="chart-label">{fmtDay(key).split(',')[0]}</span>
              <span className="chart-date num">{key.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
