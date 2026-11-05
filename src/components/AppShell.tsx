import type { ReactNode } from 'react'
import { Building2, ClipboardList, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { navigate, type AppView } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/services/auth'

export function AppShell({
  view,
  children,
}: {
  view: AppView
  children: ReactNode
}) {
  const { profile } = useAuth()
  const objectsActive = view.name === 'objects' || view.name === 'object' || view.name === 'task'
  const myTasksActive = view.name === 'my-tasks'

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <button
              type="button"
              className="flex items-center gap-2 font-semibold"
              onClick={() => navigate({ name: 'objects' })}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-4" />
              </span>
              Objects and Tasks
            </button>
            <nav className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(objectsActive && 'bg-accent')}
                onClick={() => navigate({ name: 'objects' })}
              >
                <Building2 />
                Objects
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(myTasksActive && 'bg-accent')}
                onClick={() => navigate({ name: 'my-tasks' })}
              >
                <ClipboardList />
                My Tasks
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden text-right sm:block">
              <div className="font-medium">{profile?.full_name || profile?.email}</div>
              <div className="capitalize text-muted-foreground">{profile?.role}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              <LogOut />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
