import { StatusBadge } from '@/components/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { navigate } from '@/lib/navigation'
import { formatDateTime } from '@/lib/utils'
import type { TaskWithRelations } from '@/types'

export function TaskList({ tasks }: { tasks: TaskWithRelations[] }) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No tasks to show yet.</p>
    )
  }

  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          className="text-left"
          onClick={() => navigate({ name: 'task', id: task.id })}
        >
          <Card className="transition-colors hover:bg-accent/40">
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>{task.title}</CardTitle>
                <CardDescription>
                  {task.object?.name ? `${task.object.name} · ` : ''}
                  {task.executor?.full_name || task.executor?.email || 'Unassigned'}
                  {' · '}
                  {formatDateTime(task.created_at)}
                </CardDescription>
              </div>
              <StatusBadge status={task.status} />
            </CardHeader>
            {task.description ? (
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {task.description}
                </p>
              </CardContent>
            ) : null}
          </Card>
        </button>
      ))}
    </div>
  )
}
