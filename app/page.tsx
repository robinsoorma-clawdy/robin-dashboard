'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Task } from '@/lib/types'
import TaskColumn from '@/components/TaskColumn'
import Header from '@/components/Header'

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')

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

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const progressTasks = tasks.filter(t => t.status === 'in_progress')
  const doneTasks = tasks.filter(t => t.status === 'done')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: '#8b949e' }}>Loading dashboard...</p>
      </div>
    )
  }

  const tabButtonStyle = (isActive: boolean) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: isActive ? '#58a6ff' : '#161b22',
    color: isActive ? '#fff' : '#8b949e',
  })

  const cardStyle = {
    backgroundColor: '#161b22',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #30363d',
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <nav className="flex gap-2 mb-8 flex-wrap">
          {[
            { id: 'tasks', label: '📋 Task Board' },
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TaskColumn
              title="🎯 To Do"
              status="todo"
              tasks={todoTasks}
              onTaskAdded={fetchTasks}
            />
            <TaskColumn
              title="⚡ In Progress"
              status="in_progress"
              tasks={progressTasks}
              onTaskAdded={fetchTasks}
            />
            <TaskColumn
              title="✅ Done"
              status="done"
              tasks={doneTasks}
              onTaskAdded={fetchTasks}
            />
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={cardStyle}>
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', backgroundColor: '#21262d', borderRadius: '8px' }}>
                <span style={{ color: '#58a6ff' }}>08:00</span>
                <span>Daily self-audit completed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', backgroundColor: '#21262d', borderRadius: '8px' }}>
                <span style={{ color: '#58a6ff' }}>07:00</span>
                <span>Morning briefing delivered</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div style={cardStyle}>
            <h2 className="text-xl font-semibold mb-4">Key Memories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div style={{ backgroundColor: '#21262d', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ color: '#58a6ff', fontWeight: 500, marginBottom: '8px' }}>💼 Work</h3>
                <ul style={{ color: '#8b949e', lineHeight: 1.6 }}>
                  <li>SWE at bank in Perth</li>
                  <li>Promotion incoming (Feb 2026)</li>
                  <li>$80k → ~$130k base</li>
                </ul>
              </div>
              <div style={{ backgroundColor: '#21262d', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ color: '#58a6ff', fontWeight: 500, marginBottom: '8px' }}>🎯 Goals</h3>
                <ul style={{ color: '#8b949e', lineHeight: 1.6 }}>
                  <li>Buy house late 2026</li>
                  <li>AWS certs (Cloud + Dev)</li>
                  <li>Launch recipe app</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div style={cardStyle}>
            <h2 className="text-xl font-semibold mb-4">Quick Notes</h2>
            <textarea
              style={{
                width: '100%',
                height: '128px',
                backgroundColor: '#21262d',
                border: '1px solid #30363d',
                borderRadius: '8px',
                padding: '16px',
                color: '#c9d1d9',
                resize: 'none',
              }}
              placeholder="Type a note..."
            />
          </div>
        )}
      </main>
    </div>
  )
}
