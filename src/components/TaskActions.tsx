import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getAllowedActions, type TaskAction } from '@/lib/task-machine'
import { getErrorMessage } from '@/lib/utils'
import { transitionTask } from '@/services/tasks'
import type { Task, UserRole } from '@/types'

export function TaskActions({
  task,
  role,
  userId,
  onChanged,
}: {
  task: Task
  role: UserRole | undefined
  userId: string | undefined
  onChanged: () => void
}) {
  const actions = getAllowedActions(role, task.status, userId === task.executor_id)
  const [pending, setPending] = useState<TaskAction | null>(null)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function runAction(action: TaskAction, nextComment?: string) {
    setBusy(true)
    setError(null)
    try {
      await transitionTask(task.id, action.to, nextComment)
      setPending(null)
      setComment('')
      onChanged()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function handleClick(action: TaskAction) {
    setError(null)
    if (action.requiresComment) {
      setPending(action)
      return
    }
    void runAction(action)
  }

  if (actions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No actions are available for your role in this status.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.to}
            variant={action.variant}
            disabled={busy}
            onClick={() => handleClick(action)}
          >
            {action.label}
          </Button>
        ))}
      </div>
      {error && !pending ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Dialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending?.label}</DialogTitle>
            <DialogDescription>{pending?.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="revision-comment">Comment (required)</Label>
            <Textarea
              id="revision-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Describe what needs to change"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy || comment.trim().length === 0}
              onClick={() => pending && void runAction(pending, comment.trim())}
            >
              {busy ? 'Saving…' : 'Request revision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
