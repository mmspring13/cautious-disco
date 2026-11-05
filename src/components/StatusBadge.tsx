import { Badge } from '@/components/ui/badge'
import { TASK_STATUS_LABELS } from '@/lib/task-machine'
import type { TaskStatus } from '@/types'

const variants: Record<
  TaskStatus,
  'muted' | 'info' | 'warning' | 'success' | 'destructive'
> = {
  new: 'muted',
  in_progress: 'info',
  in_review: 'warning',
  accepted: 'success',
  needs_revision: 'destructive',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={variants[status]}>{TASK_STATUS_LABELS[status]}</Badge>
}
