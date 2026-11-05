import { supabase } from '@/services/supabase'
import type { ConstructionObject } from '@/types'

export async function fetchObjects() {
  const { data, error } = await supabase
    .from('objects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ConstructionObject[]
}

export async function fetchObject(id: string) {
  const { data, error } = await supabase
    .from('objects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ConstructionObject
}

export async function createObject(input: { name: string; address: string }) {
  const { data, error } = await supabase
    .from('objects')
    .insert({ name: input.name, address: input.address })
    .select()
    .single()

  if (error) throw error
  return data as ConstructionObject
}

export async function deleteObject(id: string) {
  const { error } = await supabase.from('objects').delete().eq('id', id)
  if (error) throw error
}
