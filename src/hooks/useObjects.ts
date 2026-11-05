import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '@/lib/utils'
import { fetchObject, fetchObjects } from '@/services/objects'
import type { ConstructionObject } from '@/types'

export function useObjects() {
  const [objects, setObjects] = useState<ConstructionObject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setObjects(await fetchObjects())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { objects, loading, error, reload }
}

export function useObject(id: string | undefined) {
  const [object, setObject] = useState<ConstructionObject | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      setObject(await fetchObject(id))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void reload()
  }, [reload])

  return { object, loading, error, reload }
}
