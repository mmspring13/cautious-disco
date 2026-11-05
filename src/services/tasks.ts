import { supabase } from '@/services/supabase'
import type { Task, TaskHistoryWithActor, TaskStatus, TaskWithRelations } from '@/types'

const taskSelect = `
  *,
  object:objects!object_id(id, name, address),
  executor:profiles!executor_id(id, full_name, email),
  author:profiles!author_id(id, full_name, email)
`

export async function fetchTasksForObject(objectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(taskSelect)
    .eq('object_id', objectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as TaskWithRelations[]
}

export async function fetchMyTasks(executorId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(taskSelect)
    .eq('executor_id', executorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as TaskWithRelations[]
}

export async function fetchTask(id: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(taskSelect)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as TaskWithRelations
}

export async function fetchTaskHistory(taskId: string) {
  const { data, error } = await supabase
    .from('task_history')
    .select(
      `
      *,
      actor:profiles(id, full_name, email, role)
    `,
    )
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as TaskHistoryWithActor[]
}

export async function createTask(input: {
  title: string
  description: string
  object_id: string
  executor_id: string
  author_id: string
}) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description,
      object_id: input.object_id,
      executor_id: input.executor_id,
      author_id: input.author_id,
      status: 'new',
    })
    .select()
    .single()

  if (error) throw error
  return data as Task
}

export async function transitionTask(
  taskId: string,
  status: TaskStatus,
  comment?: string,
) {
  const { data, error } = await supabase.rpc('transition_task', {
    p_task_id: taskId,
    p_new_status: status,
    p_comment: comment ?? null,
  })

  if (error) throw error
  return data as Task
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}
