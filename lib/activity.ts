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

// Store activities in memory since the activities table has different schema
const activityCache: any[] = []

export async function logActivity({
  type,
  task_id,
  task_title,
  from_status,
  to_status,
  details,
  created_by = 'robin',
}: LogActivityParams): Promise<void> {
  // Add to local cache since Supabase activities table has different schema
  activityCache.unshift({
    id: crypto.randomUUID(),
    type,
    task_id,
    task_title,
    from_status: from_status || null,
    to_status: to_status || null,
    details: details || null,
    created_by,
    created_at: new Date().toISOString(),
  })
  
  // Keep only last 100 activities
  if (activityCache.length > 100) {
    activityCache.pop()
  }
}

export async function fetchActivityLogs(limit = 50) {
  return activityCache.slice(0, limit)
}
