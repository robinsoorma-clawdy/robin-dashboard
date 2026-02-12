'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Task } from '@/lib/types'
import { logActivity } from '@/lib/activity'

interface TaskColumnProps {
  title: string
  status: 'todo' | 'in_progress' | 'done'
  tasks: Task[]
  count: number
  onTaskAdded: () => void
  onTaskClick: (task: Task) => void
  onDragStart: (task: Task) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, status: string) => void
  onDrop: (e: React.DragEvent, status: string) => void
  onMoveTask: (task: Task, newStatus: 'todo' | 'in_progress' | 'done') => void
  isDragOver: boolean
  draggedTask: Task | null
}

export default function TaskColumn({
  title,
  status,
  tasks,
  count,
  onTaskAdded,
  onTaskClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onMoveTask,
  isDragOver,
  draggedTask,
}: TaskColumnProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [category, setCategory] = useState('work')
  const [priority, setPriority] = useState('medium')
  
  // Edit mode state
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCategory, setEditCategory] = useState('work')
  const [editPriority, setEditPriority] = useState('medium')
  const [editDueDate, setEditDueDate] = useState('')
  const [editStatus, setEditStatus] = useState<'todo' | 'in_progress' | 'done'>('todo')
  const [isSaving, setIsSaving] = useState(false)
  const [validationError, setValidationError] = useState('')

  // Mobile swipe state
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null)
  const [swipingTaskId, setSwipingTaskId] = useState<string | null>(null)

  const editFormRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  // Click outside to cancel editing
  useEffect(() => {
    if (!editingTask) return

    const handleClickOutside = (e: MouseEvent) => {
      if (editFormRef.current && !editFormRef.current.contains(e.target as Node)) {
        cancelEdit()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [editingTask])

  // Keyboard shortcuts: Escape to cancel, Cmd/Ctrl+Enter to save
  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && editingTask) {
      e.preventDefault()
      saveEdit(editingTask)
    }
  }, [editingTask, editTitle, editDesc, editCategory, editPriority, editDueDate, editStatus])

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const { data, error } = await supabase.from('tasks').insert([
      {
        title: newTaskTitle,
        description: newTaskDesc,
        status,
        category,
        priority,
        due_date: newTaskDueDate || null,
        created_by: 'robin',
      },
    ]).select()

    if (error) {
      console.error('Error adding task:', error)
    } else {
      const createdTask = data?.[0]
      await logActivity({
        type: 'task_created',
        task_id: createdTask?.id || null,
        task_title: newTaskTitle,
        to_status: status,
      })
      setNewTaskTitle('')
      setNewTaskDesc('')
      setNewTaskDueDate('')
      setShowAddForm(false)
      onTaskAdded()
    }
  }

  const deleteTask = async (taskId: string, taskTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this task?')) return
    
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) {
      console.error('Error deleting task:', error)
    } else {
      await logActivity({
        type: 'task_deleted',
        task_id: taskId,
        task_title: taskTitle,
        from_status: status,
      })
      onTaskAdded()
    }
  }

  const startEditing = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTask(task.id)
    setEditTitle(task.title)
    setEditDesc(task.description || '')
    setEditCategory(task.category)
    setEditPriority(task.priority || 'medium')
    setEditDueDate(task.due_date || '')
    setEditStatus(task.status)
    setValidationError('')
  }

  const cancelEdit = () => {
    setEditingTask(null)
    setEditTitle('')
    setEditDesc('')
    setEditCategory('work')
    setEditPriority('medium')
    setEditDueDate('')
    setEditStatus('todo')
    setIsSaving(false)
    setValidationError('')
  }

  // Mobile swipe handlers
  const handleTouchStart = (e: React.TouchEvent, taskId: string) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchCurrentX(e.touches[0].clientX)
    setSwipingTaskId(taskId)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX !== null) {
      setTouchCurrentX(e.touches[0].clientX)
    }
  }

  const handleTouchEnd = (task: Task) => {
    if (touchStartX !== null && touchCurrentX !== null) {
      const diff = touchCurrentX - touchStartX
      if (Math.abs(diff) > 100) {
        if (diff > 100) {
          // Swipe right -> move forward
          if (status === 'todo') onMoveTask(task, 'in_progress')
          else if (status === 'in_progress') onMoveTask(task, 'done')
        } else {
          // Swipe left -> move backward
          if (status === 'done') onMoveTask(task, 'in_progress')
          else if (status === 'in_progress') onMoveTask(task, 'todo')
        }
      }
    }
    setTouchStartX(null)
    setTouchCurrentX(null)
    setSwipingTaskId(null)
  }

  const saveEdit = async (taskId: string) => {
    const trimmedTitle = editTitle.trim()
    if (!trimmedTitle) {
      setValidationError('Task title is required')
      return
    }

    setIsSaving(true)
    setValidationError('')

    // Find the current task to detect status changes
    const currentTask = tasks.find(t => t.id === taskId)
    const oldStatus = currentTask?.status

    const { error } = await supabase
      .from('tasks')
      .update({
        title: trimmedTitle,
        description: editDesc,
        category: editCategory,
        priority: editPriority,
        due_date: editDueDate || null,
        status: editStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    if (error) {
      console.error('Error updating task:', error)
      setValidationError('Failed to save changes. Please try again.')
      setIsSaving(false)
    } else {
      // Log status change or update
      if (oldStatus && oldStatus !== editStatus) {
        const activityType = editStatus === 'done' ? 'task_completed' : 'task_moved'
        await logActivity({
          type: activityType,
          task_id: taskId,
          task_title: trimmedTitle,
          from_status: oldStatus,
          to_status: editStatus,
        })
      } else if (
        currentTask && (
          currentTask.title !== trimmedTitle ||
          currentTask.description !== editDesc ||
          currentTask.priority !== editPriority ||
          currentTask.category !== editCategory ||
          currentTask.due_date !== (editDueDate || null)
        )
      ) {
        await logActivity({
          type: 'task_updated',
          task_id: taskId,
          task_title: trimmedTitle,
          details: 'Updated task details'
        })
      }
      cancelEdit()
      onTaskAdded()
    }
  }

  const getColumnAccent = () => {
    switch (status) {
      case 'todo': return 'var(--text-muted)'
      case 'in_progress': return 'var(--accent)'
      case 'done': return 'var(--success)'
      default: return 'var(--text-muted)'
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
    work: '#c9a84c',
    project: '#8b7355',
    career: '#34d399',
    finance: '#e2a336',
    personal: '#9a9486',
  }

  /* ---- Shared input styling ---- */
  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
    outline: 'none',
  }

  const selectBase: React.CSSProperties = {
    ...inputBase,
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239a9486' fill='none' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '32px',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    lineHeight: 1,
  }

  const btnPrimary: React.CSSProperties = {
    flex: 1,
    background: 'var(--accent)',
    color: 'var(--bg-primary)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '9px 16px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    fontFamily: 'var(--font-body)',
  }

  const btnSecondary: React.CSSProperties = {
    flex: 1,
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '9px 16px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
    letterSpacing: '0.04em',
    fontFamily: 'var(--font-body)',
  }

  return (
    <div
      onDragOver={(e) => onDragOver(e, status)}
      onDrop={(e) => onDrop(e, status)}
      style={{
        backgroundColor: isDragOver ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: `1px solid ${isDragOver ? 'var(--accent)' : 'var(--border)'}`,
        transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isDragOver ? 'var(--shadow-glow)' : 'none',
      }}
    >
      {/* Column Header — Editorial */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Vertical gold accent line */}
          <div style={{
            width: '2px',
            height: '14px',
            borderRadius: '1px',
            backgroundColor: getColumnAccent(),
            flexShrink: 0,
          }} />
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}>
            {title}
          </h3>
          <span style={{
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            padding: '2px 0',
            fontSize: '11px',
            fontWeight: 400,
            letterSpacing: '0',
            fontFamily: 'var(--font-body)',
          }}>
            {count}
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flex: 1,
        marginBottom: '12px',
      }}>
        {tasks.length === 0 && !showAddForm && (
          <div style={{
            padding: '36px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(15, 15, 20, 0.5)',
            transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            {isDragOver ? 'Drop here' : 'No tasks'}
          </div>
        )}

        {tasks.map((task, taskIndex) => {
          const translateX = swipingTaskId === task.id && touchStartX !== null && touchCurrentX !== null
            ? touchCurrentX - touchStartX
            : 0

          return (
            <div key={task.id}>
              {editingTask === task.id ? (
                /* ---- Inline Edit Form ---- */
                <div
                  ref={editFormRef}
                  onKeyDown={handleEditKeyDown}
                  className="animate-slide-in"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    opacity: isSaving ? 0.6 : 1,
                    pointerEvents: isSaving ? 'none' : 'auto',
                    transition: 'opacity 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Gold accent top */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'var(--accent)',
                  }} />

                  {/* Validation Error */}
                  {validationError && (
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--danger-subtle)',
                      border: '1px solid rgba(232, 72, 95, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--danger)',
                      fontSize: '12px',
                      fontWeight: 400,
                    }}>
                      {validationError}
                    </div>
                  )}

                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => {
                      setEditTitle(e.target.value)
                      if (validationError) setValidationError('')
                    }}
                    placeholder="Task title"
                    style={{
                      ...inputBase,
                      fontWeight: 500,
                      borderColor: validationError && !editTitle.trim() ? 'var(--danger)' : undefined,
                    }}
                    autoFocus
                  />

                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    style={{
                      ...inputBase,
                      resize: 'none',
                    }}
                  />

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      style={{ ...selectBase, flex: 1 }}
                    >
                      <option value="work">Work</option>
                      <option value="project">Project</option>
                      <option value="career">Career</option>
                      <option value="finance">Finance</option>
                      <option value="personal">Personal</option>
                    </select>

                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      style={{ ...selectBase, flex: 1 }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Due Date and Status */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={labelStyle}>
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        style={{
                          ...inputBase,
                          colorScheme: 'dark',
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={labelStyle}>
                        Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as 'todo' | 'in_progress' | 'done')}
                        style={selectBase}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => saveEdit(task.id)}
                      disabled={isSaving}
                      style={{
                        ...btnPrimary,
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        opacity: isSaving ? 0.7 : 1,
                      }}
                    >
                      {isSaving && (
                        <span style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          border: '1.5px solid rgba(8,8,10,0.3)',
                          borderTopColor: 'var(--bg-primary)',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite',
                        }} />
                      )}
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={isSaving}
                      style={{
                        ...btnSecondary,
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSaving) {
                          e.currentTarget.style.borderColor = 'var(--border-accent)'
                          e.currentTarget.style.color = 'var(--text-primary)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }}
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Keyboard shortcut hint */}
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    letterSpacing: '0.04em',
                    marginTop: '-4px',
                  }}>
                    Esc to cancel &middot; Cmd/Ctrl+Enter to save
                  </div>
                </div>
              ) : (
                /* ---- Normal Task Card — Luxury Editorial ---- */
                <div
                  draggable
                  onDragStart={() => {
                    isDraggingRef.current = true
                    onDragStart(task)
                  }}
                  onDragEnd={() => {
                    onDragEnd()
                    // Reset after a short delay so the click event doesn't fire
                    setTimeout(() => { isDraggingRef.current = false }, 0)
                  }}
                  onClick={() => {
                    if (!isDraggingRef.current) {
                      onTaskClick(task)
                    }
                  }}
                  onTouchStart={(e) => handleTouchStart(e, task.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(task)}
                  className="task-card animate-fade-in-up"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'grab',
                    boxShadow: draggedTask?.id === task.id ? 'var(--shadow-lg)' : 'none',
                    opacity: draggedTask?.id === task.id ? 0.4 : 1,
                    position: 'relative',
                    transform: `translateX(${translateX}px)`,
                    zIndex: swipingTaskId === task.id ? 10 : 1,
                    animationDelay: `${taskIndex * 0.04}s`,
                    animationFillMode: 'backwards',
                  }}
                >
                  {/* Category & Priority */}
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontSize: '9px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: categoryColors[task.category] || '#9a9486',
                      border: `1px solid ${categoryColors[task.category] || '#9a9486'}30`,
                      lineHeight: '18px',
                    }}>
                      {task.category}
                    </span>
                    
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontSize: '9px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: getPriorityColor(task.priority || 'medium'),
                      border: `1px solid currentColor`,
                      opacity: 0.7,
                      lineHeight: '18px',
                    }}>
                      {task.priority || 'medium'}
                    </span>
                  </div>

                  {/* Task Title */}
                  <p style={{
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    lineHeight: 1.5,
                    marginBottom: task.description ? '4px' : '0',
                    paddingRight: '20px',
                    letterSpacing: '-0.01em',
                  }}>
                    {task.title}
                  </p>

                  {/* Description */}
                  {task.description && (
                    <p style={{
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      marginBottom: '8px',
                      fontStyle: 'italic',
                    }}>
                      {task.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '1px solid var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        color: 'var(--accent)',
                        fontWeight: 500,
                        fontFamily: 'var(--font-display)',
                        fontStyle: 'italic',
                      }}>
                        R
                      </div>
                      {task.due_date && (() => {
                        const now = new Date()
                        const due = new Date(task.due_date)
                        const isOverdue = due < now
                        const isNearDue = !isOverdue && (due.getTime() - now.getTime()) < 24 * 60 * 60 * 1000
                        const color = isOverdue ? 'var(--danger)' : isNearDue ? 'var(--warning)' : 'var(--text-muted)'
                        
                        return (
                          <span style={{
                            fontSize: '10px',
                            color: color,
                            fontWeight: isOverdue || isNearDue ? 600 : 400,
                            letterSpacing: '0.02em',
                          }}>
                            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )
                      })()}
                    </div>

                    <div style={{ display: 'flex', gap: '2px' }}>
                      {/* Edit Button */}
                      <button
                        onClick={(e) => startEditing(task, e)}
                        style={{
                          padding: '4px 6px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--accent)'
                          e.currentTarget.style.backgroundColor = 'var(--accent-subtle)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-muted)'
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L3.463 11.098a.25.25 0 00-.064.108l-.631 2.208 2.208-.63a.25.25 0 00.108-.064l8.61-8.61a.25.25 0 000-.355l-1.086-1.086z"/>
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => deleteTask(task.id, task.title, e)}
                        style={{
                          padding: '4px 6px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
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
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19a1.75 1.75 0 001.741-1.575l.66-6.6a.75.75 0 00-1.492-.15l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Task */}
      {status !== 'done' && (
        <>
          {showAddForm ? (
            <form
              onSubmit={addTask}
              className="animate-fade-in-up"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Gold accent top */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'var(--accent)',
              }} />

              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                style={{
                  ...inputBase,
                  fontWeight: 500,
                }}
                autoFocus
              />

              <textarea
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                placeholder="Add details (optional)..."
                rows={2}
                style={{
                  ...inputBase,
                  resize: 'none',
                }}
              />
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ ...selectBase, flex: 1 }}
                >
                  <option value="work">Work</option>
                  <option value="project">Project</option>
                  <option value="career">Career</option>
                  <option value="finance">Finance</option>
                  <option value="personal">Personal</option>
                </select>

                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ ...selectBase, flex: 1 }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  style={{
                    ...inputBase,
                    colorScheme: 'dark',
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="submit"
                  style={btnPrimary}
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewTaskTitle('')
                    setNewTaskDesc('')
                    setNewTaskDueDate('')
                  }}
                  style={btnSecondary}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-accent)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
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
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 500,
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-body)',
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
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M7.25 1a.75.75 0 011.5 0v6.25H15a.75.75 0 010 1.5H8.75V15a.75.75 0 01-1.5 0V8.75H1a.75.75 0 010-1.5h6.25V1z"/>
              </svg>
              Add a task
            </button>
          )}
        </>
      )}
    </div>
  )
}
