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
    work: 'bg-accent',
    project: 'bg-purple-500',
    career: 'bg-green-500',
    finance: 'bg-yellow-500',
    personal: 'bg-gray-500',
  }

  return (
    <div className="bg-bg-secondary rounded-xl p-4 border border-[var(--border)]">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      <div className="space-y-3 mb-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-bg-tertiary p-4 rounded-lg border border-[var(--border)] hover:border-accent transition-colors cursor-pointer"
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
              className={`inline-block px-2 py-1 rounded text-xs font-medium text-white mb-2 ${
                categoryColors[task.category] || 'bg-gray-500'
              }`}
            >
              {task.category}
            </span>
            <p className={status === 'done' ? 'line-through opacity-60' : ''}>{task.title}</p>
            {task.due_date && (
              <p className="text-xs text-text-secondary mt-2">Due: {task.due_date}</p>
            )}
          </div>
        ))}
      </div>

      {status !== 'done' && (
        <>
          {showAddForm ? (
            <form onSubmit={addTask} className="space-y-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full bg-bg-tertiary border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                autoFocus
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-bg-tertiary border border-[var(--border)] rounded px-3 py-2 text-sm"
              >
                <option value="work">Work</option>
                <option value="project">Project</option>
                <option value="career">Career</option>
                <option value="finance">Finance</option>
                <option value="personal">Personal</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-accent text-white rounded px-3 py-2 text-sm hover:bg-accent-hover transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-bg-tertiary rounded px-3 py-2 text-sm hover:bg-bg-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full border-2 border-dashed border-[var(--border)] rounded-lg py-2 text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              + Add Task
            </button>
          )}
        </>
      )}
    </div>
  )
}
