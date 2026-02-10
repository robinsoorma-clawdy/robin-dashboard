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
  type: 'task_created' | 'task_moved' | 'task_completed'
  task_id: string
  task_title: string
  from_status?: string
  to_status?: string
  created_by: string
  created_at: string
}
