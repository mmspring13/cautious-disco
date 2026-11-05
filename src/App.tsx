import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { AuthScreen } from '@/components/AuthScreen'
import { MyTasksView } from '@/components/MyTasksView'
import { ObjectDetailView } from '@/components/ObjectDetailView'
import { ObjectsView } from '@/components/ObjectsView'
import { TaskDetailView } from '@/components/TaskDetailView'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { parseHash, type AppView } from '@/lib/navigation'
import { hasSupabaseConfig } from '@/services/supabase'

function MissingConfig() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Supabase is not configured</CardTitle>
          <CardDescription>
            Copy `.env.example` to `.env` and set the two required variables, then restart the
            dev server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-sm">
          <p>VITE_SUPABASE_URL</p>
          <p>VITE_SUPABASE_ANON_KEY</p>
        </CardContent>
      </Card>
    </div>
  )
}

function AuthenticatedApp() {
  const [view, setView] = useState<AppView>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setView(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <AppShell view={view}>
      {view.name === 'objects' ? <ObjectsView /> : null}
      {view.name === 'object' ? <ObjectDetailView objectId={view.id} /> : null}
      {view.name === 'task' ? <TaskDetailView taskId={view.id} /> : null}
      {view.name === 'my-tasks' ? <MyTasksView /> : null}
    </AppShell>
  )
}

function Gate() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading session…
      </div>
    )
  }

  if (!session) return <AuthScreen />
  return <AuthenticatedApp />
}

export default function App() {
  if (!hasSupabaseConfig) return <MissingConfig />

  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
