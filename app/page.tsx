'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, Activity } from '@/lib/types'
import TaskColumn from '@/components/TaskColumn'
import Header from '@/components/Header'
import TaskDetailModal from '@/components/TaskDetailModal'
import GoalsTab from '@/components/GoalsTab'
import NetWorthTab from '@/components/NetWorthTab'
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
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
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
            width: '36px',
            height: '36px',
            border: '3px solid var(--bg-tertiary)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', letterSpacing: '0.02em' }}>Loading...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'goals', label: 'Goals', icon: '🏠' },
    { id: 'networth', label: 'Net Worth', icon: '📈' },
    { id: 'activity', label: 'Activity', icon: '📊' },
    { id: 'memory', label: 'Memory', icon: '🧠' },
    { id: 'notes', label: 'Notes', icon: '📝' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Header />
      
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 20px' }}>
        {/* Premium Tab Navigation */}
        <nav style={{ 
          display: 'flex', 
          gap: '4px', 
          marginBottom: '32px',
          flexWrap: 'wrap',
          padding: '4px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          width: 'fit-content',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 2px 8px rgba(56, 139, 253, 0.3)' : 'none',
                  letterSpacing: '0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ fontSize: '14px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Tab content with fade-in */}
        <div className="animate-fade-in" key={activeTab}>
          {activeTab === 'tasks' && (
            <>
              {/* Search & Filter Bar */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '28px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px' }}>
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
                      fontSize: '13px',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
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
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
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

              {/* Kanban Board */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
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

          {activeTab === 'networth' && (
            <NetWorthTab />
          )}

          {activeTab === 'notes' && (
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}>
                  Quick Notes
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {noteSaving && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>
                      Saving...
                    </span>
                  )}
                  {noteLastSaved && !noteSaving && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>
                      Saved {noteLastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <button
                    onClick={saveNotes}
                    disabled={noteSaving}
                    style={{
                      padding: '8px 20px',
                      background: 'var(--gradient-brand)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: noteSaving ? 'not-allowed' : 'pointer',
                      opacity: noteSaving ? 0.7 : 1,
                      transition: 'opacity 0.2s, transform 0.15s',
                      boxShadow: '0 2px 8px rgba(56, 139, 253, 0.25)',
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
                  padding: '18px',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'
                }}
              />
              <p style={{ 
                color: 'var(--text-muted)', 
                fontSize: '12px', 
                marginTop: '12px',
                fontStyle: 'italic',
                letterSpacing: '0.01em',
              }}>
                Notes are saved automatically when you click away or hit the Save button
              </p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border)',
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.02em',
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
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: activitiesLoading ? 'not-allowed' : 'pointer',
                    opacity: activitiesLoading ? 0.7 : 1,
                    transition: 'all 0.2s',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}
                >
                  {activitiesLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {activitiesLoading && activities.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px',
                  color: 'var(--text-muted)',
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    border: '2px solid var(--bg-tertiary)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 12px',
                  }} />
                  <span style={{ fontSize: '13px' }}>Loading activity...</span>
                </div>
              ) : activities.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}>
                  <p style={{ fontSize: '28px', marginBottom: '12px', opacity: 0.6 }}>📊</p>
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
                          padding: '12px 10px',
                          borderRadius: 'var(--radius-md)',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          backgroundColor: `${getColor()}12`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}>
                          {getIcon()}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              color: getColor(),
                              padding: '2px 8px',
                              borderRadius: '10px',
                              backgroundColor: `${getColor()}12`,
                            }}>
                              {getLabel()}
                            </span>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {activity.task_title}
                            </span>
                          </div>

                          {activity.from_status && activity.to_status && (
                            <div style={{
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              marginTop: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}>
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-elevated)',
                                fontSize: '11px',
                              }}>
                                {formatStatus(activity.from_status)}
                              </span>
                              <span style={{ opacity: 0.5 }}>→</span>
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-elevated)',
                                fontSize: '11px',
                              }}>
                                {formatStatus(activity.to_status)}
                              </span>
                            </div>
                          )}

                          {activity.type === 'task_created' && activity.to_status && !activity.from_status && (
                            <div style={{
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              marginTop: '4px',
                            }}>
                              Added to{' '}
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-elevated)',
                                fontSize: '11px',
                              }}>
                                {formatStatus(activity.to_status)}
                              </span>
                            </div>
                          )}

                          {activity.type === 'task_deleted' && activity.from_status && (
                            <div style={{
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              marginTop: '4px',
                            }}>
                              Removed from{' '}
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-elevated)',
                                fontSize: '11px',
                              }}>
                                {formatStatus(activity.from_status)}
                              </span>
                            </div>
                          )}

                          {activity.details && (
                            <div style={{
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              marginTop: '4px',
                              fontStyle: 'italic',
                            }}>
                              {activity.details}
                            </div>
                          )}
                        </div>

                        <div style={{
                          fontSize: '11px',
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
              padding: '28px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: 700, 
                marginBottom: '24px', 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}>
                Key Memories
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {[
                  { icon: '💼', title: 'Work', items: ['SWE at bank in Perth', 'Promotion incoming (Feb 2026)', '$80k → ~$130k base'], accent: 'var(--accent)' },
                  { icon: '🎯', title: 'Goals', items: ['Buy house late 2026', 'AWS certs (Cloud + Dev)', 'Launch recipe app'], accent: 'var(--accent-2)' },
                  { icon: '🏠', title: 'Home Buying', items: ['$40k deposit saved (cash + super)', 'Waiting for promotion', 'Perth market research'], accent: 'var(--success)' },
                  { icon: '🤖', title: 'AI Stack', items: ['Clawdius (Kimi + Antigravity)', '5 Telegram groups', 'Daily briefings at 7am'], accent: 'var(--warning)' },
                ].map((card, i) => (
                  <div key={i} className="hover-lift animate-fade-in-up" style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '22px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    animationDelay: `${i * 0.08}s`,
                    animationFillMode: 'backwards',
                  }}>
                    <h3 style={{ 
                      color: card.accent, 
                      fontWeight: 700, 
                      marginBottom: '14px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      letterSpacing: '-0.01em',
                    }}>
                      <span style={{ fontSize: '18px' }}>{card.icon}</span> {card.title}
                    </h3>
                    <ul style={{ color: 'var(--text-secondary)', lineHeight: 2, fontSize: '13px', listStyle: 'none' }}>
                      {card.items.map((item, j) => (
                        <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ 
                            color: card.accent, 
                            fontSize: '6px',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: card.accent,
                            flexShrink: 0,
                            opacity: 0.7,
                          }}>
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
