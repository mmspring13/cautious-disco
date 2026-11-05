import { MapPin } from 'lucide-react'
import { ObjectFormDialog } from '@/components/ObjectFormDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useObjects } from '@/hooks/useObjects'
import { navigate } from '@/lib/navigation'

export function ObjectsView() {
  const { profile } = useAuth()
  const { objects, loading, error, reload } = useObjects()
  const isManager = profile?.role === 'manager'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Objects</h1>
          <p className="text-sm text-muted-foreground">
            Construction sites and the work attached to them.
          </p>
        </div>
        {isManager ? <ObjectFormDialog onCreated={() => void reload()} /> : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading objects…</p>
      ) : objects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No objects yet</CardTitle>
            <CardDescription>
              {isManager
                ? 'Create the first construction object to start assigning tasks.'
                : 'You will see objects here once a manager assigns you a task.'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {objects.map((object) => (
            <button
              key={object.id}
              type="button"
              className="text-left"
              onClick={() => navigate({ name: 'object', id: object.id })}
            >
              <Card className="h-full transition-colors hover:bg-accent/40">
                <CardHeader>
                  <CardTitle>{object.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {object.address || 'No address'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Open to view tasks</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
