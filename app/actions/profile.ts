'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const num = (k: string, min: number, max: number) => {
    const v = Number(String(formData.get(k)).replace(',', '.'))
    return Number.isFinite(v) && v >= min && v <= max ? v : null
  }
  const name = String(formData.get('name') ?? '').trim()
  const daily = num('daily_hours', 0.5, 24)
  const weekly = num('weekly_goal_hours', 0, 168)
  const timezone = String(formData.get('timezone') ?? '')

  try { new Intl.DateTimeFormat('pt-BR', { timeZone: timezone }) } catch { redirect('/profile?error=1') }
  if (!name || daily === null || weekly === null) redirect('/profile?error=1')

  await supabase
    .from('profiles')
    .update({ name, daily_hours: daily, weekly_goal_hours: weekly, timezone })
    .eq('id', user.id)
  redirect('/profile?saved=1')
}
