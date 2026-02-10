'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Task } from '@/lib/types'
import TaskColumn from '@/components/TaskColumn'
import Header from '@/components/Header'

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Notes state
  const [noteContent, setNoteContent] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteLastSaved, setNoteLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    fetchTasks()
    fetchNotes()
    
    const subscription = supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    setDragOverColumn(null)
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', draggedTask.id)

    if (error) {
      console.error('Error moving task:', error)
    } else {
      fetchTasks()
    }
    setDraggedTask(null)
  }, [draggedTask])

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
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragOver={dragOverColumn === 'todo'}
                draggedTask={draggedTask}
              />
              <TaskColumn
                title="In Progress"
                status="in_progress"
                tasks={progressTasks}
                count={progressTasks.length}
                onTaskAdded={fetchTasks}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragOver={dragOverColumn === 'in_progress'}
                draggedTask={draggedTask}
              />
              <TaskColumn
                title="Done"
                status="done"
                tasks={doneTasks}
                count={doneTasks.length}
                onTaskAdded={fetchTasks}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragOver={dragOverColumn === 'done'}
                draggedTask={draggedTask}
              />
            </div>
          </>
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

        {(activeTab === 'activity' || activeTab === 'memory') && (
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
    </div>
  )
}
