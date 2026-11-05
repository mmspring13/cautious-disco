import type { TaskStatus, UserRole } from '@/types'

export type TaskAction = {
  to: TaskStatus
  label: string
  description: string
  variant: 'default' | 'secondary' | 'destructive'
  requiresComment: boolean
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  in_review: 'In Review',
  accepted: 'Accepted',
  needs_revision: 'Needs Revision',
}

export function getAllowedActions(
  role: UserRole | undefined,
  status: TaskStatus,
  isAssignee: boolean,
): TaskAction[] {
  if (role === 'executor' && isAssignee) {
    if (status === 'new') {
      return [
        {
          to: 'in_progress',
          label: 'Start work',
          description: 'Move this task from New to In Progress.',
          variant: 'default',
          requiresComment: false,
        },
      ]
    }
    if (status === 'in_progress') {
      return [
        {
          to: 'in_review',
          label: 'Submit for review',
          description: 'Send this task to a manager for review.',
          variant: 'default',
          requiresComment: false,
        },
      ]
    }
    if (status === 'needs_revision') {
      return [
        {
          to: 'in_progress',
          label: 'Resume work',
          description: 'Return this task to In Progress after revision notes.',
          variant: 'default',
          requiresComment: false,
        },
      ]
    }
  }

  if (role === 'manager' && status === 'in_review') {
    return [
      {
        to: 'accepted',
        label: 'Accept',
        description: 'Mark this task as accepted.',
        variant: 'default',
        requiresComment: false,
      },
      {
        to: 'needs_revision',
        label: 'Request revision',
        description: 'Send the task back with a required comment.',
        variant: 'destructive',
        requiresComment: true,
      },
    ]
  }

  return []
}
