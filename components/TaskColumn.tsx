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

  /* ---- Shared input styling ---- */
  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'inherit',
    transition: 'border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  }

  const selectBase: React.CSSProperties = {
    ...inputBase,
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238b949e' fill='none' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '32px',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    lineHeight: 1,
  }

  const btnPrimary: React.CSSProperties = {
    flex: 1,
    background: 'var(--gradient-brand)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    letterSpacing: '-0.01em',
  }

  const btnSecondary: React.CSSProperties = {
    flex: 1,
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '-0.01em',
  }

  return (
    <div
      onDragOver={(e) => onDragOver(e, status)}
      onDrop={(e) => onDrop(e, status)}
      style={{
        backgroundColor: isDragOver ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        border: `1px solid ${isDragOver ? 'var(--accent)' : 'var(--border)'}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isDragOver ? 'var(--shadow-glow)' : 'none',
      }}
    >
      {/* Column Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Left accent line instead of dot */}
          <div style={{
            width: '3px',
            height: '16px',
            borderRadius: '2px',
            backgroundColor: getColumnColor(),
            flexShrink: 0,
          }} />
          <h3 style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}>
            {title}
          </h3>
          <span style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-muted)',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 700,
            minWidth: '20px',
            textAlign: 'center',
            lineHeight: '16px',
            letterSpacing: '0',
          }}>
            {count}
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: 1,
        marginBottom: '12px',
      }}>
        {tasks.length === 0 && !showAddForm && (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '12px',
            letterSpacing: '0.02em',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(22, 27, 34, 0.5)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {isDragOver ? 'Drop here' : 'No tasks'}
          </div>
        )}

        {tasks.map((task) => {
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
                    borderTop: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    opacity: isSaving ? 0.6 : 1,
                    pointerEvents: isSaving ? 'none' : 'auto',
                    transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Gradient accent border-top */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'var(--gradient-brand)',
                  }} />

                  {/* Validation Error */}
                  {validationError && (
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--danger-subtle)',
                      border: '1px solid rgba(248, 81, 73, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--danger)',
                      fontSize: '12px',
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
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
                      onMouseEnter={(e) => {
                        if (!isSaving) e.currentTarget.style.boxShadow = 'var(--shadow-glow)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      {isSaving && (
                        <span style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
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
                          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                          e.currentTarget.style.color = 'var(--text-primary)'
                          e.currentTarget.style.borderColor = 'var(--border-accent)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                        e.currentTarget.style.borderColor = 'var(--border)'
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
                    letterSpacing: '0.02em',
                    marginTop: '-4px',
                  }}>
                    Esc to cancel · ⌘/Ctrl+Enter to save
                  </div>
                </div>
              ) : (
                /* ---- Normal Task Card ---- */
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
                  className="task-card animate-slide-in"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'grab',
                    boxShadow: draggedTask?.id === task.id ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                    opacity: draggedTask?.id === task.id ? 0.5 : 1,
                    position: 'relative',
                    transform: `translateX(${translateX}px)`,
                    zIndex: swipingTaskId === task.id ? 10 : 1,
                  }}
                >
                  {/* Drag Handle Indicator */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    opacity: 0.25,
                  }}>
                    {[0, 1].map((row) => (
                      <div key={row} style={{ display: 'flex', gap: '2px' }}>
                        {[0, 1].map((col) => (
                          <div key={col} style={{
                            width: '3px',
                            height: '3px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--text-muted)',
                          }} />
                        ))}
                      </div>
                    ))}
                  </div>

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
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: categoryColors[task.category] || '#6e7681',
                      backgroundColor: `${categoryColors[task.category] || '#6e7681'}18`,
                      lineHeight: '18px',
                    }}>
                      {task.category}
                    </span>
                    
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: getPriorityColor(task.priority || 'medium'),
                      backgroundColor: `${getPriorityColor(task.priority || 'medium')}`.replace('var(', '').replace(')', '') === 'var(--text-muted)' 
                        ? 'rgba(72, 79, 88, 0.15)'
                        : undefined,
                      lineHeight: '18px',
                    }}
                    // Priority badge uses the semantic subtle vars
                    >
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: getPriorityColor(task.priority || 'medium'),
                        backgroundColor: task.priority === 'high'
                          ? 'var(--danger-subtle)'
                          : task.priority === 'low'
                            ? 'var(--success-subtle)'
                            : 'var(--warning-subtle)',
                        lineHeight: '18px',
                        margin: '-2px -8px',
                      }}>
                        {task.priority || 'medium'}
                      </span>
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
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      marginBottom: '8px',
                      letterSpacing: '-0.005em',
                    }}>
                      {task.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        letterSpacing: '0',
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
                            fontSize: '11px',
                            color: color,
                            fontWeight: isOverdue || isNearDue ? 600 : 400,
                            letterSpacing: '-0.01em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.8 }}>
                              <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12.5c-3.03 0-5.5-2.47-5.5-5.5S4.97 2.5 8 2.5s5.5 2.47 5.5 5.5-2.47 5.5-5.5 5.5zm.5-9H7v4.5l3.94 2.36.56-.92L8.5 8.25V4.5z" fill="currentColor"/>
                            </svg>
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
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
              {/* Gradient accent top */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'var(--gradient-brand)',
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
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
                    setNewTaskDueDate('')
                  }}
                  style={btnSecondary}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                    e.currentTarget.style.borderColor = 'var(--border-accent)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                    e.currentTarget.style.borderColor = 'var(--border)'
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
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                letterSpacing: '0.01em',
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
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
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
