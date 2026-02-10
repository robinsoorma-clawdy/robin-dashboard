export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  category: 'work' | 'project' | 'career' | 'finance' | 'personal'
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
  created_by: string
  created_at: string
  updated_at?: string
}

export interface Activity {
  id: string
  type: 'task_created' | 'task_moved' | 'task_completed' | 'task_deleted' | 'task_updated'
  task_id: string | null
  task_title: string
  from_status?: string
  to_status?: string
  details?: string
  created_by: string
  created_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  content: string
  created_by: string
  created_at: string
  updated_at?: string
}
