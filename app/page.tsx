'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, Activity } from '@/lib/types'
import TaskColumn from '@/components/TaskColumn'
import Header from '@/components/Header'
import TaskDetailModal from '@/components/TaskDetailModal'
import GoalsTab from '@/components/GoalsTab'
import { logActivity, fetchActivityLogs } from '@/lib/activity'

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  // Notes state
  const [noteContent, setNoteContent] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteLastSaved, setNoteLastSaved] = useState<Date | null>(null)

  // Activity state
  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchNotes()
    
    const tasksSubscription = supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()

    const activitySubscription = supabase
      .channel('activity_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
        if (activeTab === 'activity') {
          loadActivities()
        }
      })
      .subscribe()

    return () => {
      tasksSubscription.unsubscribe()
      activitySubscription.unsubscribe()
    }
  }, [activeTab])

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching tasks:', error)
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notes:', error)
    } else if (data) {
      setNoteContent(data.content || '')
      setNoteLastSaved(new Date(data.updated_at))
    }
  }

  const loadActivities = async () => {
    setActivitiesLoading(true)
    const data = await fetchActivityLogs(50)
    setActivities(data)
    setActivitiesLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivities()
    }
  }, [activeTab])

  const saveNotes = async () => {
    setNoteSaving(true)
    
    const { error } = await supabase
      .from('notes')
      .upsert({ 
        content: noteContent,
        updated_by: 'clawdius',
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving notes:', error)
    } else {
      setNoteLastSaved(new Date())
    }
    setNoteSaving(false)
  }

  const handleDragStart = useCallback((task: Task) => {
    setDraggedTask(task)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault()
    setDragOverColumn(status)
  }, [])

  const moveTask = useCallback(async (task: Task, newStatus: string) => {
    const oldStatus = task.status
    if (oldStatus === newStatus) return

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', task.id)

    if (error) {
      console.error('Error moving task:', error)
    } else {
      const activityType = newStatus === 'done' ? 'task_completed' : 'task_moved'
      await logActivity({
        type: activityType,
        task_id: task.id,
        task_title: task.title,
        from_status: oldStatus,
        to_status: newStatus,
      })
      fetchTasks()
    }
  }, [fetchTasks])

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    setDragOverColumn(null)
    
    if (!draggedTask) return
    await moveTask(draggedTask, newStatus)
    setDraggedTask(null)
  }, [draggedTask, moveTask])

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.category === filter
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const todoTasks = filteredTasks.filter(t => t.status === 'todo')
  const progressTasks = filteredTasks.filter(t => t.status === 'in_progress')
  const doneTasks = filteredTasks.filter(t => t.status === 'done')

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--bg-tertiary)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    backgroundColor: isActive ? 'var(--accent)' : 'transparent',
    color: isActive ? '#fff' : 'var(--text-secondary)',
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Header />
      
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px' }}>
        <nav style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          flexWrap: 'wrap',
          padding: '4px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          width: 'fit-content'
        }}>
          {[
            { id: 'tasks', label: '📋 Tasks' },
            { id: 'goals', label: '🏠 Goals' },
            { id: 'activity', label: '📊 Activity' },
            { id: 'memory', label: '🧠 Memory' },
            { id: 'notes', label: '📝 Notes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={tabButtonStyle(activeTab === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'tasks' && (
          <>
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginBottom: '24px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 16px 10px 40px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
                <span style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}>🔍</span>
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Categories</option>
                <option value="work">Work</option>
                <option value="project">Project</option>
                <option value="career">Career</option>
                <option value="finance">Finance</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              alignItems: 'start'
            }}>
              <TaskColumn
                title="To Do"
                status="todo"
                tasks={todoTasks}
                count={todoTasks.length}
                onTaskAdded={fetchTasks}
                onTaskClick={setSelectedTask}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onMoveTask={moveTask}
                isDragOver={dragOverColumn === 'todo'}
                draggedTask={draggedTask}
              />
              <TaskColumn
                title="In Progress"
                status="in_progress"
                tasks={progressTasks}
                count={progressTasks.length}
                onTaskAdded={fetchTasks}
                onTaskClick={setSelectedTask}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onMoveTask={moveTask}
                isDragOver={dragOverColumn === 'in_progress'}
                draggedTask={draggedTask}
              />
              <TaskColumn
                title="Done"
                status="done"
                tasks={doneTasks}
                count={doneTasks.length}
                onTaskAdded={fetchTasks}
                onTaskClick={setSelectedTask}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onMoveTask={moveTask}
                isDragOver={dragOverColumn === 'done'}
                draggedTask={draggedTask}
              />
            </div>
          </>
        )}

        {activeTab === 'goals' && (
          <GoalsTab tasks={tasks} />
        )}

        {activeTab === 'notes' && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Quick Notes
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {noteSaving && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    Saving...
                  </span>
                )}
                {noteLastSaved && !noteSaving && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    Saved {noteLastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  onClick={saveNotes}
                  disabled={noteSaving}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: noteSaving ? 'not-allowed' : 'pointer',
                    opacity: noteSaving ? 0.7 : 1
                  }}
                >
                  Save
                </button>
              </div>
            </div>

            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              onBlur={saveNotes}
              placeholder="Type your notes here..."
              style={{
                width: '100%',
                minHeight: '400px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                color: 'var(--text-primary)',
                resize: 'vertical',
                fontSize: '14px',
                lineHeight: 1.6,
                fontFamily: 'inherit'
              }}
            />
            <p style={{ 
              color: 'var(--text-muted)', 
              fontSize: '13px', 
              marginTop: '12px',
              fontStyle: 'italic'
            }}>
              Notes are saved automatically when you click away or hit the Save button
            </p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                Recent Activity
              </h2>
              <button
                onClick={loadActivities}
                disabled={activitiesLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: activitiesLoading ? 'not-allowed' : 'pointer',
                  opacity: activitiesLoading ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {activitiesLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {activitiesLoading && activities.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--text-muted)',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid var(--bg-tertiary)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px',
                }} />
                Loading activity...
              </div>
            ) : activities.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--text-muted)',
                fontSize: '14px',
              }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>📊</p>
                <p>No activity yet. Create, move, or delete tasks to see activity here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {activities.map((activity) => {
                  const getIcon = () => {
                    switch (activity.type) {
                      case 'task_created': return '✨'
                      case 'task_moved': return '➡️'
                      case 'task_completed': return '✅'
                      case 'task_deleted': return '🗑️'
                      case 'task_updated': return '✏️'
                      default: return '📌'
                    }
                  }

                  const getLabel = () => {
                    switch (activity.type) {
                      case 'task_created': return 'Created'
                      case 'task_moved': return 'Moved'
                      case 'task_completed': return 'Completed'
                      case 'task_deleted': return 'Deleted'
                      case 'task_updated': return 'Updated'
                      default: return activity.type
                    }
                  }

                  const getColor = () => {
                    switch (activity.type) {
                      case 'task_created': return 'var(--accent)'
                      case 'task_moved': return 'var(--warning)'
                      case 'task_completed': return 'var(--success)'
                      case 'task_deleted': return 'var(--danger)'
                      case 'task_updated': return 'var(--text-secondary)'
                      default: return 'var(--text-muted)'
                    }
                  }

                  const formatStatus = (s: string) => {
                    switch (s) {
                      case 'todo': return 'To Do'
                      case 'in_progress': return 'In Progress'
                      case 'done': return 'Done'
                      default: return s
                    }
                  }

                  const timeAgo = (dateStr: string) => {
                    const now = new Date()
                    const date = new Date(dateStr)
                    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

                    if (seconds < 60) return 'just now'
                    const minutes = Math.floor(seconds / 60)
                    if (minutes < 60) return `${minutes}m ago`
                    const hours = Math.floor(minutes / 60)
                    if (hours < 24) return `${hours}h ago`
                    const days = Math.floor(hours / 24)
                    if (days < 7) return `${days}d ago`
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }

                  return (
                    <div
                      key={activity.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 8px',
                        borderRadius: 'var(--radius-md)',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: `${getColor()}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}>
                        {getIcon()}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                            color: getColor(),
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: `${getColor()}15`,
                          }}>
                            {getLabel()}
                          </span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {activity.task_title}
                          </span>
                        </div>

                        {/* Status change details */}
                        {activity.from_status && activity.to_status && (
                          <div style={{
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}>
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-tertiary)',
                              fontSize: '12px',
                            }}>
                              {formatStatus(activity.from_status)}
                            </span>
                            <span>→</span>
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-tertiary)',
                              fontSize: '12px',
                            }}>
                              {formatStatus(activity.to_status)}
                            </span>
                          </div>
                        )}

                        {/* Created-in status for new tasks */}
                        {activity.type === 'task_created' && activity.to_status && !activity.from_status && (
                          <div style={{
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                          }}>
                            Added to{' '}
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-tertiary)',
                              fontSize: '12px',
                            }}>
                              {formatStatus(activity.to_status)}
                            </span>
                          </div>
                        )}

                        {/* Deleted-from status */}
                        {activity.type === 'task_deleted' && activity.from_status && (
                          <div style={{
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                          }}>
                            Removed from{' '}
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-tertiary)',
                              fontSize: '12px',
                            }}>
                              {formatStatus(activity.from_status)}
                            </span>
                          </div>
                        )}

                        {/* Details */}
                        {activity.details && (
                          <div style={{
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            fontStyle: 'italic',
                          }}>
                            {activity.details}
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                        title={new Date(activity.created_at).toLocaleString()}
                      >
                        {timeAgo(activity.created_at)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'memory' && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border)',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <p>Coming soon...</p>
          </div>
        )}
      </main>

      {selectedTask && (
        <TaskDetailModal
          task={tasks.find(t => t.id === selectedTask.id) || selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
