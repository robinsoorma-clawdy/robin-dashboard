export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  category: 'work' | 'project' | 'career' | 'finance' | 'personal'
  due_date?: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface Activity {
  id: string
  action: string
  timestamp: string
  metadata?: Record<string, any>
}
