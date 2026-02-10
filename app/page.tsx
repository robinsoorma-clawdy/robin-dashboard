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

  useEffect(() => {
    fetchTasks()
    
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

  const categories = ['all', 'work', 'project', 'career', 'finance', 'personal']

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
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
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
        {/* Navigation */}
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
            {/* Filters */}
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
                    transition: 'border-color 0.2s',
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

            {/* Kanban Board */}
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

        {activeTab === 'activity' && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
              Recent Activity
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { time: '08:00', text: 'Daily self-audit completed', type: 'success' },
                { time: '07:00', text: 'Morning briefing delivered', type: 'info' },
                { time: 'Yesterday', text: 'Dashboard migrated to Vercel + Supabase', type: 'success' },
              ].map((activity, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid var(--${activity.type === 'success' ? 'success' : 'accent'})`
                }}>
                  <span style={{ 
                    color: 'var(--accent)', 
                    fontSize: '13px',
                    fontWeight: 500,
                    minWidth: '60px'
                  }}>{activity.time}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{activity.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
              Key Memories
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {[
                { icon: '💼', title: 'Work', items: ['SWE at bank in Perth', 'Promotion incoming (Feb 2026)', '$80k → ~$130k base'] },
                { icon: '🎯', title: 'Goals', items: ['Buy house late 2026', 'AWS certs (Cloud + Dev)', 'Launch recipe app'] },
                { icon: '🏠', title: 'Home Buying', items: ['Waiting for promotion', 'Saving deposit', 'Perth market research'] },
                { icon: '🤖', title: 'AI Stack', items: ['Clawdius (Kimi + Antigravity)', '5 Telegram groups', 'Daily briefings at 7am'] },
              ].map((card, i) => (
                <div key={i} style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <h3 style={{ 
                    color: 'var(--accent)', 
                    fontWeight: 600, 
                    marginBottom: '12px',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {card.icon} {card.title}
                  </h3>
                  <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '14px' }}>
                    {card.items.map((item, j) => (
                      <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--accent)', fontSize: '10px' }}>●</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
              Quick Notes
            </h2>
            <textarea
              style={{
                width: '100%',
                minHeight: '200px',
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
              placeholder="Type your notes here..."
            />
          </div>
        )}
      </main>
    </div>
  )
}
