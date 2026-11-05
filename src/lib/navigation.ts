export type AppView =
  | { name: 'objects' }
  | { name: 'object'; id: string }
  | { name: 'task'; id: string }
  | { name: 'my-tasks' }

export function parseHash(hash: string): AppView {
  const path = hash.replace(/^#/, '') || '/objects'
  const parts = path.split('/').filter(Boolean)

  if (parts[0] === 'my-tasks') return { name: 'my-tasks' }
  if (parts[0] === 'objects' && parts[1]) return { name: 'object', id: parts[1] }
  if (parts[0] === 'tasks' && parts[1]) return { name: 'task', id: parts[1] }
  return { name: 'objects' }
}

export function viewToHash(view: AppView) {
  if (view.name === 'object') return `#/objects/${view.id}`
  if (view.name === 'task') return `#/tasks/${view.id}`
  if (view.name === 'my-tasks') return '#/my-tasks'
  return '#/objects'
}

export function navigate(view: AppView) {
  window.location.hash = viewToHash(view)
}
