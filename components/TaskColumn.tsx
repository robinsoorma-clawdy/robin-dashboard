'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Task } from '@/lib/types'

interface TaskColumnProps {
  title: string
  status: 'todo' | 'in_progress' | 'done'
  tasks: Task[]
  onTaskAdded: () => void
}

export default function TaskColumn({ title, status, tasks, onTaskAdded }: TaskColumnProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [category, setCategory] = useState('work')

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const { error } = await supabase.from('tasks').insert([
      {
        title: newTaskTitle,
        status,
        category,
        created_by: 'robin',
      },
    ])

    if (error) {
      console.error('Error adding task:', error)
    } else {
      setNewTaskTitle('')
      setShowAddForm(false)
      onTaskAdded()
    }
  }

  const moveTask = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (error) {
      console.error('Error moving task:', error)
    } else {
      onTaskAdded()
    }
  }

  const categoryColors: Record<string, string> = {
    work: '#58a6ff',
    project: '#a371f7',
    career: '#238636',
    finance: '#d29922',
    personal: '#6e7681',
  }

  const columnStyle = {
    backgroundColor: '#161b22',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #30363d',
  }

  return (
    <div style={columnStyle}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>{title}</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              backgroundColor: '#21262d',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #30363d',
              cursor: 'pointer',
            }}
            onClick={() => {
              const nextStatus =
                status === 'todo'
                  ? 'in_progress'
                  : status === 'in_progress'
                  ? 'done'
                  : 'todo'
              moveTask(task.id, nextStatus)
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: categoryColors[task.category] || '#6e7681',
                marginBottom: '8px',
              }}
            >
              {task.category}
            </span>
            <p style={{ 
              textDecoration: status === 'done' ? 'line-through' : 'none',
              opacity: status === 'done' ? 0.6 : 1,
            }}>
              {task.title}
            </p>
            {task.due_date && (
              <p style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: '8px' }}>Due: {task.due_date}</p>
            )}
          </div>
        ))}
      </div>

      {status !== 'done' && (
        <>
          {showAddForm ? (
            <form onSubmit={addTask} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                style={{
                  width: '100%',
                  backgroundColor: '#21262d',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  color: '#c9d1d9',
                }}
                autoFocus
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#21262d',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  color: '#c9d1d9',
                }}
              >
                <option value="work">Work</option>
                <option value="project">Project</option>
                <option value="career">Career</option>
                <option value="finance">Finance</option>
                <option value="personal">Personal</option>
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: '#58a6ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    flex: 1,
                    backgroundColor: '#21262d',
                    color: '#c9d1d9',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: '100%',
                border: '2px dashed #30363d',
                borderRadius: '8px',
                padding: '8px',
                color: '#8b949e',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              + Add Task
            </button>
          )}
        </>
      )}
    </div>
  )
}
