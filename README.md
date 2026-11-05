# Objects and Tasks

A production-ready mini-CRM for construction objects and a strict task workflow. The browser talks only to Supabase. There is no local backend.

## Stack

- Vite, React, TypeScript
- Tailwind CSS and shadcn/ui
- Supabase Auth, Postgres, and Row Level Security

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**.
3. Paste and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

That script creates `profiles`, `objects`, `tasks`, and `task_history`, the status state machine (triggers), append-only history, and RLS.

## 2. Create test users

In **Authentication → Users**, add two users (auto-confirm emails):

| Email | Password | Role after promotion |
| --- | --- | --- |
| `manager@example.com` | `password123` | manager |
| `executor@example.com` | `password123` | executor |

New users always land as **executor**. Promote the manager in the SQL Editor:

```sql
update public.profiles
set role = 'manager'
where email = 'manager@example.com';
```

## 3. Configure the app

```bash
cp .env.example .env
```

Set the two values from **Project Settings → API**:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 4. Run locally

```bash
npm install
npm run dev
```

Open the printed local URL, sign in as the manager, create an object and a task assigned to the executor, then sign in as the executor to move the task through the workflow.

## Workflow (enforced in Postgres)

| From | To | Who | Comment |
| --- | --- | --- | --- |
| _(create)_ | New | Manager | optional |
| New | In Progress | Assigned executor | optional |
| In Progress | In Review | Assigned executor | optional |
| In Review | Accepted | Manager | optional |
| In Review | Needs Revision | Manager | **required** |
| Needs Revision | In Progress | Assigned executor | optional |

Illegal transitions and a missing revision comment are rejected by database triggers, not only the UI.

## Access rules

- **Managers** can read and write objects, tasks, and profiles.
- **Executors** see only objects they have tasks on, and can update only the status of their assigned tasks.
- **Task history** is written by triggers. The API cannot update or delete it.

Status changes from the app go through the `transition_task` RPC so comments are stored with the history row.
