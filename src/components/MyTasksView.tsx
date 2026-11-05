import { TaskList } from '@/components/TaskList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useMyTasks } from '@/hooks/useTasks'

export function MyTasksView() {
  const { user, profile } = useAuth()
  const { tasks, loading, error } = useMyTasks(user?.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
        <p className="text-sm text-muted-foreground">
          {profile?.role === 'manager'
            ? 'Managers see an empty personal queue unless they are also assigned as an executor.'
            : 'Only tasks assigned to you.'}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Assigned work</CardTitle>
          <CardDescription>Open a task to take the next allowed action.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Loading your tasks…</p>
          ) : (
            <TaskList tasks={tasks} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
