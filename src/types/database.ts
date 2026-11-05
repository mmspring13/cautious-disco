export type UserRole = 'manager' | 'executor'

export type TaskStatus =
  | 'new'
  | 'in_progress'
  | 'in_review'
  | 'accepted'
  | 'needs_revision'

export type Profile = {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
}

export type ConstructionObject = {
  id: string
  name: string
  address: string
  created_by: string | null
  created_at: string
}

export type Task = {
  id: string
  title: string
  description: string
  object_id: string
  executor_id: string
  author_id: string
  status: TaskStatus
  created_at: string
}

export type TaskHistoryEntry = {
  id: string
  task_id: string
  actor_id: string | null
  old_status: TaskStatus | null
  new_status: TaskStatus
  comment: string | null
  created_at: string
}

export type TaskWithRelations = Task & {
  object: Pick<ConstructionObject, 'id' | 'name' | 'address'> | null
  executor: Pick<Profile, 'id' | 'full_name' | 'email'> | null
  author: Pick<Profile, 'id' | 'full_name' | 'email'> | null
}

export type TaskHistoryWithActor = TaskHistoryEntry & {
  actor: Pick<Profile, 'id' | 'full_name' | 'email' | 'role'> | null
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          id: string
          email: string
          full_name?: string
          role?: UserRole
          created_at?: string
        }
        Update: Partial<Profile>
        Relationships: []
      }
      objects: {
        Row: ConstructionObject
        Insert: {
          id?: string
          name: string
          address?: string
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<Omit<ConstructionObject, 'id'>>
        Relationships: [
          {
            foreignKeyName: 'objects_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: Task
        Insert: {
          id?: string
          title: string
          description?: string
          object_id: string
          executor_id: string
          author_id?: string
          status?: TaskStatus
          created_at?: string
        }
        Update: Partial<Omit<Task, 'id'>>
        Relationships: [
          {
            foreignKeyName: 'tasks_object_id_fkey'
            columns: ['object_id']
            isOneToOne: false
            referencedRelation: 'objects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_executor_id_fkey'
            columns: ['executor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      task_history: {
        Row: TaskHistoryEntry
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: 'task_history_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_history_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      transition_task: {
        Args: {
          p_task_id: string
          p_new_status: TaskStatus
          p_comment?: string | null
        }
        Returns: Task
      }
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      is_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      task_status: TaskStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
