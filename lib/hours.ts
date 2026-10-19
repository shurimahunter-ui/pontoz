// Funções puras de cálculo de horas. Tudo em UTC no banco; fuso só para agrupar/exibir.
export type Entry = { id: string; clock_in: string; clock_out: string | null }

const HOUR = 3_600_000
const DAY = 24 * HOUR

function parts(d: Date, tz: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(d).map((x) => [x.type, x.value])
  )
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second }
}

function offsetMs(d: Date, tz: string) {
  const p = parts(d, tz)
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(d.getTime() / 1000) * 1000
}

/** Segunda-feira 00:00 (no fuso informado), como instante UTC. */
export function weekStart(now: Date, tz: string): Date {
  const p = parts(now, tz)
  const dow = (new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay() + 6) % 7 // seg=0
  const localMidnight = Date.UTC(p.y, p.m - 1, p.d - dow)
  return new Date(localMidnight - offsetMs(new Date(localMidnight), tz))
}

/** 00:00 no fuso informado, como instante UTC. */
export function dayStart(key: string, tz: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  const localMidnight = Date.UTC(year, month - 1, day)
  let timestamp = localMidnight

  for (let attempt = 0; attempt < 2; attempt += 1) {
    timestamp = localMidnight - offsetMs(new Date(timestamp), tz)
  }

  return new Date(timestamp)
}

/** 'YYYY-MM-DD' no fuso informado. */
export function dayKey(iso: string | Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso))
}

/** Duração de uma sessão em ms; sessão aberta conta até `now`. */
export function durationMs(e: Entry, now: Date): number {
  const end = e.clock_out ? new Date(e.clock_out).getTime() : now.getTime()
  return Math.max(0, end - new Date(e.clock_in).getTime())
}

/** Soma das sessões dentro de [from, to), cortando o que ultrapassa os limites. */
export function totalMs(entries: Entry[], now: Date, from?: Date, to?: Date): number {
  return entries.reduce((sum, e) => {
    const s = Math.max(new Date(e.clock_in).getTime(), from?.getTime() ?? -Infinity)
    const end = e.clock_out ? new Date(e.clock_out).getTime() : now.getTime()
    const f = Math.min(end, to?.getTime() ?? Infinity)
    return sum + Math.max(0, f - s)
  }, 0)
}

export const weekMs = (entries: Entry[], now: Date, tz: string) => {
  const start = weekStart(now, tz)
  return totalMs(entries, now, start, new Date(start.getTime() + 7 * DAY))
}

/** Agrupa por dia (mais recente primeiro). */
export function groupByDay(entries: Entry[], tz: string) {
  const map = new Map<string, Entry[]>()
  for (const e of entries) {
    const k = dayKey(e.clock_in, tz)
    map.set(k, [...(map.get(k) ?? []), e])
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
}

/** 8h05 */
export function formatHM(ms: number): string {
  const min = Math.round(ms / 60_000)
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`
}

export const hoursToMs = (h: number) => h * HOUR

export const fmtTime = (iso: string, tz: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit' })

export const fmtDay = (key: string) =>
  new Date(key + 'T12:00:00Z').toLocaleDateString('pt-BR', {
    timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit',
  })
