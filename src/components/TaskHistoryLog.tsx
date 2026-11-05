import { StatusBadge } from '@/components/StatusBadge'
import { Separator } from '@/components/ui/separator'
import { formatDateTime } from '@/lib/utils'
import type { TaskHistoryWithActor } from '@/types'

export function TaskHistoryLog({ history }: { history: TaskHistoryWithActor[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No history yet.</p>
  }

  return (
    <ol className="space-y-4">
      {history.map((entry, index) => (
        <li key={entry.id} className="space-y-2">
          {index > 0 ? <Separator /> : null}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {entry.old_status ? <StatusBadge status={entry.old_status} /> : null}
            <span className="text-muted-foreground">{entry.old_status ? '→' : 'Created as'}</span>
            <StatusBadge status={entry.new_status} />
          </div>
          <p className="text-sm">
            {entry.actor?.full_name || entry.actor?.email || 'System'}
            {entry.actor?.role ? ` · ${entry.actor.role}` : ''}
            <span className="text-muted-foreground"> · {formatDateTime(entry.created_at)}</span>
          </p>
          {entry.comment ? (
            <p className="rounded-md bg-muted px-3 py-2 text-sm">{entry.comment}</p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
