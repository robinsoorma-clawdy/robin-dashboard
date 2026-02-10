'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Task } from '@/lib/types'

interface TaskColumnProps {
  title: string
  status: 'todo' | 'in_progress' | 'done'
  tasks: Task[]
  count: number
  onTaskAdded: () => void
  onDragStart: (task: Task) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, status: string) => void
  onDrop: (e: React.DragEvent, status: string) => void
  isDragOver: boolean
  draggedTask: Task | null
}

export default function TaskColumn({
  title,
  status,
  tasks,
  count,
  onTaskAdded,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragOver,
  draggedTask,
}: TaskColumnProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [category, setCategory] = useState('work')
  const [priority, setPriority] = useState('medium')

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const { error } = await supabase.from('tasks').insert([
      {
        title: newTaskTitle,
        description: newTaskDesc,
        status,
        category,
        priority,
        created_by: 'robin',
      },
    ])

    if (error) {
      console.error('Error adding task:', error)
    } else {
      setNewTaskTitle('')
      setNewTaskDesc('')
      setShowAddForm(false)
      onTaskAdded()
    }
  }

  const deleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this task?')) return
    
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) {
      console.error('Error deleting task:', error)
    } else {
      onTaskAdded()
    }
  }

  const getColumnColor = () => {
    switch (status) {
      case 'todo': return 'var(--text-secondary)'
      case 'in_progress': return 'var(--accent)'
      case 'done': return 'var(--success)'
      default: return 'var(--text-secondary)'
    }
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'var(--danger)'
      case 'medium': return 'var(--warning)'
      case 'low': return 'var(--success)'
      default: return 'var(--text-muted)'
    }
  }

  const categoryColors: Record<string, string> = {
    work: '#58a6ff',
    project: '#a371f7',
    career: '#3fb950',
    finance: '#d29922',
    personal: '#8b949e',
  }

  return (
    <div
      onDragOver={(e) => onDragOver(e, status)}
      onDrop={(e) => onDrop(e, status)}
      style={{
        backgroundColor: isDragOver ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: `2px solid ${isDragOver ? 'var(--accent)' : 'var(--border)'}`,
        transition: 'all 0.2s ease',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Column Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: getColumnColor()
          }} />
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </h3>
          <span style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            minWidth: '24px',
            textAlign: 'center'
          }}>
            {count}
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        flex: 1,
        marginBottom: '16px'
      }}>
        {tasks.length === 0 && !showAddForm && (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '14px',
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-tertiary)'
          }}>
            {isDragOver ? 'Drop here' : 'No tasks'}
          </div>
        )}

        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={() => onDragStart(task)}
            onDragEnd={onDragEnd}
            className="task-card animate-slide-in"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              cursor: 'grab',
              transition: 'all 0.2s ease',
              boxShadow: draggedTask?.id === task.id ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
              opacity: draggedTask?.id === task.id ? 0.5 : 1,
              position: 'relative',
            }}
          >
            {/* Drag Handle Indicator */}
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              gap: '2px',
              opacity: 0.3
            }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--text-muted)'
                }} />
              ))}
            </div>

            {/* Category & Priority */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '10px',
              flexWrap: 'wrap'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                color: '#fff',
                backgroundColor: categoryColors[task.category] || '#6e7681',
              }}>
                {task.category}
              </span>
              
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                color: getPriorityColor(task.priority || 'medium'),
                backgroundColor: `${getPriorityColor(task.priority || 'medium')}20`,
              }}>
                {task.priority || 'medium'}
              </span>
            </div>

            {/* Task Title */}
            <p style={{ 
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.5,
              marginBottom: task.description ? '8px' : '0',
              paddingRight: '24px'
            }}>
              {task.title}
            </p>

            {/* Description */}
            {task.description && (
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '13px',
                lineHeight: 1.5,
                marginBottom: '12px'
              }}>
                {task.description}
              </p>
            )}

            {/* Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: 'var(--accent)',
                  fontWeight: 600
                }}>
                  R
                </div>
                {task.due_date && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: new Date(task.due_date) < new Date() ? 'var(--danger)' : 'var(--text-muted)'
                  }}>
                    📅 {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => deleteTask(task.id, e)}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  transition: 'all 0.2s',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--danger)'
                  e.currentTarget.style.backgroundColor = 'var(--danger-subtle)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Task */}
      {status !== 'done' && (
        <>
          {showAddForm ? (
            <form 
              onSubmit={addTask} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                animation: 'slideIn 0.2s ease-out'
              }}
            >
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  transition: 'border-color 0.2s',
                }}
                autoFocus
              />

              <textarea
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                placeholder="Add details (optional)..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="work">💼 Work</option>
                  <option value="project">🚀 Project</option>
                  <option value="career">📈 Career</option>
                  <option value="finance">💰 Finance</option>
                  <option value="personal">🏠 Personal</option>
                </select>

                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent)'
                  }}
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewTaskTitle('')
                    setNewTaskDesc('')
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
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
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent)'
                e.currentTarget.style.backgroundColor = 'var(--accent-subtle)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span style={{ fontSize: '18px' }}>+</span>
              Add a task
            </button>
          )}
        </>
      )}
    </div>
  )
}
