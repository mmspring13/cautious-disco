import { ArrowLeft, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { TaskActions } from '@/components/TaskActions'
import { TaskHistoryLog } from '@/components/TaskHistoryLog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'
import { useTask } from '@/hooks/useTasks'
import { navigate } from '@/lib/navigation'
import { formatDateTime, getErrorMessage } from '@/lib/utils'
import { deleteTask } from '@/services/tasks'

export function TaskDetailView({ taskId }: { taskId: string }) {
  const { profile, user } = useAuth()
  const { task, history, loading, error, reload } = useTask(taskId)
  const isManager = profile?.role === 'manager'

  async function handleDelete() {
    if (!task) return
    if (!confirm('Delete this task? History will be removed with it.')) return
    try {
      await deleteTask(task.id)
      navigate({ name: 'object', id: task.object_id })
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading task…</p>
  if (error || !task) {
    return <p className="text-sm text-destructive">{error || 'Task not found.'}</p>
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ name: 'object', id: task.object_id })}
      >
        <ArrowLeft />
        Back to object
      </Button>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-2xl">{task.title}</CardTitle>
              <StatusBadge status={task.status} />
            </div>
            <CardDescription>
              {task.object?.name}
              {task.object?.address ? ` · ${task.object.address}` : ''}
            </CardDescription>
          </div>
          {isManager ? (
            <Button variant="outline" onClick={() => void handleDelete()}>
              <Trash2 />
              Delete
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6">{task.description || 'No description.'}</p>
          <Separator />
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Executor</dt>
              <dd>{task.executor?.full_name || task.executor?.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Author</dt>
              <dd>{task.author?.full_name || task.author?.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDateTime(task.created_at)}</dd>
            </div>
          </dl>
          <Separator />
          <TaskActions
            task={task}
            role={profile?.role}
            userId={user?.id}
            onChanged={() => void reload()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Immutable status changes recorded by the database.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="log">
            <TabsList>
              <TabsTrigger value="log">Timeline</TabsTrigger>
            </TabsList>
            <TabsContent value="log" className="pt-4">
              <TaskHistoryLog history={history} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
