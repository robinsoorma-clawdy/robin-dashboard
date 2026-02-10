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
    
    // Subscribe to real-time changes
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
        <p className="text-text-secondary">Loading dashboard...</p>
      </div>
    )
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
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
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
          <div className="bg-bg-secondary rounded-xl p-6 border border-[var(--border)]">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-bg-tertiary rounded-lg">
                <span className="text-accent">08:00</span>
                <span>Daily self-audit completed</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-bg-tertiary rounded-lg">
                <span className="text-accent">07:00</span>
                <span>Morning briefing delivered</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="bg-bg-secondary rounded-xl p-6 border border-[var(--border)]">
            <h2 className="text-xl font-semibold mb-4">Key Memories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-bg-tertiary p-4 rounded-lg">
                <h3 className="text-accent font-medium mb-2">💼 Work</h3>
                <ul className="space-y-1 text-text-secondary">
                  <li>SWE at bank in Perth</li>
                  <li>Promotion incoming (Feb 2026)</li>
                  <li>$80k → ~$130k base</li>
                </ul>
              </div>
              <div className="bg-bg-tertiary p-4 rounded-lg">
                <h3 className="text-accent font-medium mb-2">🎯 Goals</h3>
                <ul className="space-y-1 text-text-secondary">
                  <li>Buy house late 2026</li>
                  <li>AWS certs (Cloud + Dev)</li>
                  <li>Launch recipe app</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-bg-secondary rounded-xl p-6 border border-[var(--border)]">
            <h2 className="text-xl font-semibold mb-4">Quick Notes</h2>
            <textarea
              className="w-full h-32 bg-bg-tertiary border border-[var(--border)] rounded-lg p-4 text-text-primary resize-none focus:outline-none focus:border-accent"
              placeholder="Type a note..."
            />
          </div>
        )}
      </main>
    </div>
  )
}
