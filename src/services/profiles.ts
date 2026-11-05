import { supabase } from '@/services/supabase'
import type { Profile } from '@/types'

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as Profile
}

export async function fetchExecutors() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'executor')
    .order('full_name')

  if (error) throw error
  return (data ?? []) as Profile[]
}
