import { supabase } from './supabase'

type ActivityType = 'task_created' | 'task_moved' | 'task_completed' | 'task_deleted' | 'task_updated'

interface LogActivityParams {
  type: ActivityType
  task_id: string | null
  task_title: string
  from_status?: string
  to_status?: string
  details?: string
  created_by?: string
}

export async function logActivity({
  type,
  task_id,
  task_title,
  from_status,
  to_status,
  details,
  created_by = 'robin',
}: LogActivityParams): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert([
    {
      type,
      task_id,
      task_title,
      from_status: from_status || null,
      to_status: to_status || null,
      details: details || null,
      created_by,
    },
  ])

  if (error) {
    console.error('Error logging activity:', error)
  }
}

export async function fetchActivityLogs(limit = 50) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching activity logs:', error)
    return []
  }

  return data || []
}
