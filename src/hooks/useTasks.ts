import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '@/lib/utils'
import { fetchExecutors } from '@/services/profiles'
import {
  fetchMyTasks,
  fetchTask,
  fetchTaskHistory,
  fetchTasksForObject,
} from '@/services/tasks'
import type { TaskHistoryWithActor, TaskWithRelations } from '@/types'

export function useObjectTasks(objectId: string | undefined) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [loading, setLoading] = useState(Boolean(objectId))
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!objectId) return
    setLoading(true)
    setError(null)
    try {
      setTasks(await fetchTasksForObject(objectId))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [objectId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { tasks, loading, error, reload }
}

export function useMyTasks(executorId: string | undefined) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [loading, setLoading] = useState(Boolean(executorId))
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!executorId) return
    setLoading(true)
    setError(null)
    try {
      setTasks(await fetchMyTasks(executorId))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [executorId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { tasks, loading, error, reload }
}

export function useTask(id: string | undefined) {
  const [task, setTask] = useState<TaskWithRelations | null>(null)
  const [history, setHistory] = useState<TaskHistoryWithActor[]>([])
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [nextTask, nextHistory] = await Promise.all([
        fetchTask(id),
        fetchTaskHistory(id),
      ])
      setTask(nextTask)
      setHistory(nextHistory)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void reload()
  }, [reload])

  return { task, history, loading, error, reload }
}

export function useExecutors() {
  const [executors, setExecutors] = useState<
    { id: string; full_name: string; email: string }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchExecutors()
      .then((rows) => {
        if (active) setExecutors(rows)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { executors, loading }
}
