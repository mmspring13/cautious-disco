import { ArrowLeft, MapPin, Trash2 } from 'lucide-react'
import { TaskFormDialog } from '@/components/TaskFormDialog'
import { TaskList } from '@/components/TaskList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useObject } from '@/hooks/useObjects'
import { useObjectTasks } from '@/hooks/useTasks'
import { navigate } from '@/lib/navigation'
import { getErrorMessage } from '@/lib/utils'
import { deleteObject } from '@/services/objects'

export function ObjectDetailView({ objectId }: { objectId: string }) {
  const { profile } = useAuth()
  const { object, loading, error } = useObject(objectId)
  const tasks = useObjectTasks(objectId)
  const isManager = profile?.role === 'manager'

  async function handleDelete() {
    if (!confirm('Delete this object and all of its tasks?')) return
    try {
      await deleteObject(objectId)
      navigate({ name: 'objects' })
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading object…</p>
  if (error || !object) {
    return <p className="text-sm text-destructive">{error || 'Object not found.'}</p>
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'objects' })}>
        <ArrowLeft />
        All objects
      </Button>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{object.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {object.address || 'No address'}
            </CardDescription>
          </div>
          {isManager ? (
            <div className="flex gap-2">
              <TaskFormDialog objectId={object.id} onCreated={() => void tasks.reload()} />
              <Button variant="outline" onClick={() => void handleDelete()}>
                <Trash2 />
                Delete
              </Button>
            </div>
          ) : null}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Work assigned on this object.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.error ? (
            <p className="text-sm text-destructive">{tasks.error}</p>
          ) : tasks.loading ? (
            <p className="text-sm text-muted-foreground">Loading tasks…</p>
          ) : (
            <TaskList tasks={tasks.tasks} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
