// Supabase Query Optimizer
// Reduces multiple round-trips by batching queries

import { supabase } from './supabase'

// Batch fetch tasks with activity count in single query
export async function getTasksWithStats() {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      activity_count:activity_logs(count)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
  
  return tasks || []
}

// Single query to update task and log activity
export async function moveTaskWithLog(
  taskId: string, 
  newStatus: string, 
  oldStatus: string,
  taskTitle: string
) {
  // Use transaction via RPC for atomic update
  const { data, error } = await supabase.rpc('move_task_and_log', {
    p_task_id: taskId,
    p_new_status: newStatus,
    p_old_status: oldStatus,
    p_task_title: taskTitle
  })
  
  if (error) {
    // Fallback to separate queries
    await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId)
    
    await supabase
      .from('activity_logs')
      .insert({
        type: newStatus === 'done' ? 'task_completed' : 'task_moved',
        task_id: taskId,
        task_title: taskTitle,
        from_status: oldStatus,
        to_status: newStatus
      })
  }
  
  return !error
}

// Subscribe to multiple tables at once
export function createMultiChannel(callbacks: {
  onTaskChange?: () => void
  onActivityChange?: () => void
  onNoteChange?: () => void
}) {
  const channel = supabase.channel('dashboard-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
      callbacks.onTaskChange?.()
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
      callbacks.onActivityChange?.()
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
      callbacks.onNoteChange?.()
    })
    .subscribe()
  
  return channel
}

// Cache for repeated queries
const queryCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function cachedQuery(key: string, queryFn: () => Promise<any>) {
  const cached = queryCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  const data = await queryFn()
  queryCache.set(key, { data, timestamp: Date.now() })
  return data
}

export function invalidateCache(key?: string) {
  if (key) {
    queryCache.delete(key)
  } else {
    queryCache.clear()
  }
}
