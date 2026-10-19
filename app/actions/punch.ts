'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function clockIn() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  // clock_in usa now() do banco; o índice único impede duas sessões abertas
  await supabase.from('time_entries').insert({ user_id: user.id })
  revalidatePath('/', 'layout')
}

export async function clockOut() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('time_entries')
    .update({ clock_out: new Date().toISOString() }) // horário do servidor, não do navegador
    .eq('user_id', user.id)
    .is('clock_out', null)
  revalidatePath('/', 'layout')
}
