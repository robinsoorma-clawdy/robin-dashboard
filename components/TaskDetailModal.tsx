'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, Activity, TaskComment } from '@/lib/types'
import { fetchActivityLogs } from '@/lib/activity'

interface TaskDetailModalProps {
  task: Task
  onClose: () => void
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments')
  const [comments, setComments] = useState<TaskComment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Fetch comments for this task
  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
    } else {
      setComments(data || [])
    }
    setCommentsLoading(false)
  }, [task.id])

  // Fetch activity logs for this task
  const fetchTaskActivities = useCallback(async () => {
    setActivitiesLoading(true)
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching task activities:', error)
    } else {
      setActivities((data as Activity[]) || [])
    }
    setActivitiesLoading(false)
  }, [task.id])

    // Load data on mount + subscribe to real-time comments & activities
    useEffect(() => {
      fetchComments()

      const commentsChannel = supabase
        .channel(`task_comments_${task.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_comments',
            filter: `task_id=eq.${task.id}`,
          },
          () => {
            fetchComments()
          }
        )
        .subscribe()

      const activitiesChannel = supabase
        .channel(`task_activities_${task.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'activity_logs',
            filter: `task_id=eq.${task.id}`,
          },
          () => {
            if (activeTab === 'history') {
              fetchTaskActivities()
            } else {
              fetchTaskActivities()
            }
          }
        )
        .subscribe()

      return () => {
        commentsChannel.unsubscribe()
        activitiesChannel.unsubscribe()
      }
    }, [task.id, fetchComments, fetchTaskActivities, activeTab])

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (commentsEndRef.current && activeTab === 'comments') {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments.length, activeTab])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newComment.trim()
    if (!trimmed) return

    setIsSubmitting(true)
    const { error } = await supabase.from('task_comments').insert([
      {
        task_id: task.id,
        content: trimmed,
        created_by: 'robin',
      },
    ])

    if (error) {
      console.error('Error adding comment:', error)
    } else {
      setNewComment('')
      fetchComments()
    }
    setIsSubmitting(false)
    commentInputRef.current?.focus()
  }

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submitComment(e as unknown as React.FormEvent)
    }
  }

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      work: '#c9a84c',
      project: '#8b7355',
      career: '#34d399',
      finance: '#e2a336',
      personal: '#9a9486',
    }
    return colors[cat] || '#9a9486'
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'var(--danger)'
      case 'medium': return 'var(--warning)'
      case 'low': return 'var(--success)'
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

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'todo': return 'var(--text-secondary)'
      case 'in_progress': return 'var(--accent)'
      case 'done': return 'var(--success)'
      default: return 'var(--text-secondary)'
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created': return '+'
      case 'task_moved': return '\u2192'
      case 'task_completed': return '\u2713'
      case 'task_deleted': return '\u00D7'
      case 'task_updated': return '\u2022'
      default: return '\u2022'
    }
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'task_created': return 'Created'
      case 'task_moved': return 'Moved'
      case 'task_completed': return 'Completed'
      case 'task_deleted': return 'Deleted'
      case 'task_updated': return 'Updated'
      default: return type
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_created': return 'var(--accent)'
      case 'task_moved': return 'var(--warning)'
      case 'task_completed': return 'var(--success)'
      case 'task_deleted': return 'var(--danger)'
      case 'task_updated': return 'var(--text-secondary)'
      default: return 'var(--text-muted)'
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '700px',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
          overflow: 'hidden',
        }}
      >
        {/* Gold accent bar */}
        <div
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)',
            flexShrink: 0,
            opacity: 0.6,
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: '24px 28px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '9px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: getCategoryColor(task.category),
                    border: `1px solid ${getCategoryColor(task.category)}30`,
                  }}
                >
                  {task.category}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '9px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: getPriorityColor(task.priority || 'medium'),
                    border: '1px solid currentColor',
                    opacity: 0.7,
                  }}
                >
                  {task.priority || 'medium'}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '9px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: getStatusColor(task.status),
                    border: `1px solid currentColor`,
                    opacity: 0.7,
                  }}
                >
                  {formatStatus(task.status)}
                </span>
              </div>

              {/* Title — Editorial serif */}
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
              }}>
                {task.title}
              </h2>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '14px',
                lineHeight: 1,
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                flexShrink: 0,
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent)'
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.transform = 'rotate(90deg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'rotate(0deg)'
              }}
            >
              {'\u2715'}
            </button>
          </div>

          {/* Description & metadata */}
          {task.description && (
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '13px',
              lineHeight: 1.6,
              letterSpacing: '-0.01em',
              marginTop: '14px',
              marginBottom: 0,
              fontStyle: 'italic',
            }}>
              {task.description}
            </p>
          )}

          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '14px',
            flexWrap: 'wrap',
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}>
            <span>Created {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            {task.due_date && (() => {
              const now = new Date()
              const due = new Date(task.due_date)
              const isOverdue = due < now
              const isNearDue = !isOverdue && (due.getTime() - now.getTime()) < 24 * 60 * 60 * 1000
              const color = isOverdue ? 'var(--danger)' : isNearDue ? 'var(--warning)' : 'var(--text-muted)'
              
              return (
                <span style={{ color, fontWeight: isOverdue || isNearDue ? 600 : 400 }}>
                  Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )
            })()}
            <span>by {task.created_by}</span>
          </div>
        </div>

        {/* Tab bar — Editorial underline style */}
        <div
          style={{
            display: 'flex',
            gap: '0',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 28px',
            flexShrink: 0,
          }}
        >
          {([
            { id: 'comments' as const, label: 'Comments', count: comments.length },
            { id: 'history' as const, label: 'History', count: activities.length },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 18px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 500,
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'color 0.3s ease, border-color 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-body)',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  backgroundColor: 'transparent',
                  color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '10px',
                  fontWeight: 400,
                  transition: 'all 0.2s ease',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Comments tab */}
          {activeTab === 'comments' && (
            <>
              {/* Comments list */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '18px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}>
                {commentsLoading ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '1.5px solid var(--bg-tertiary)',
                      borderTopColor: 'var(--accent)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 10px',
                    }} />
                    Loading
                  </div>
                ) : comments.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '48px 20px',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    fontStyle: 'italic',
                  }}>
                    <p>No comments yet. Start the discussion.</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="animate-fade-in-up"
                      style={{
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'flex-start',
                      }}
                    >
                      {/* Avatar — monogram */}
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: '1px solid var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        color: 'var(--accent)',
                        fontWeight: 500,
                        flexShrink: 0,
                        marginTop: '2px',
                        fontFamily: 'var(--font-display)',
                        fontStyle: 'italic',
                      }}>
                        {comment.created_by.charAt(0).toUpperCase()}
                      </div>

                      {/* Comment body */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '6px',
                        }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.01em',
                          }}>
                            {comment.created_by}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                            }}
                            title={new Date(comment.created_at).toLocaleString()}
                          >
                            {timeAgo(comment.created_at)}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                          letterSpacing: '-0.01em',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          backgroundColor: 'var(--bg-tertiary)',
                          padding: '12px 16px',
                          borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                        }}>
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment input */}
              <div style={{
                padding: '14px 28px 18px',
                borderTop: '1px solid var(--border-subtle)',
                flexShrink: 0,
              }}>
                <form onSubmit={submitComment} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <textarea
                      ref={commentInputRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={handleCommentKeyDown}
                      placeholder="Add a comment..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        resize: 'none',
                        fontFamily: 'var(--font-body)',
                        lineHeight: 1.5,
                        letterSpacing: '-0.01em',
                        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
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
                    <div style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                      letterSpacing: '0.04em',
                    }}>
                      Cmd/Ctrl+Enter to submit
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    style={{
                      padding: '10px 20px',
                      background: newComment.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: newComment.trim() ? 'var(--bg-primary)' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: isSubmitting || !newComment.trim() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                      marginBottom: '22px',
                      opacity: isSubmitting ? 0.7 : 1,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {isSubmitting ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* History tab */}
          {activeTab === 'history' && (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px 28px',
            }}>
              {activitiesLoading ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '1.5px solid var(--bg-tertiary)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 10px',
                  }} />
                  Loading
                </div>
              ) : activities.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  fontStyle: 'italic',
                }}>
                  <p>No history for this task yet.</p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0',
                  position: 'relative',
                }}>
                  {/* Timeline line */}
                  <div style={{
                    position: 'absolute',
                    left: '11px',
                    top: '20px',
                    bottom: '20px',
                    width: '1px',
                    backgroundColor: 'var(--border)',
                  }} />

                  {activities.map((activity, i) => (
                    <div
                      key={activity.id}
                      className="animate-fade-in-up"
                      style={{
                        display: 'flex',
                        gap: '14px',
                        padding: '10px 0',
                        alignItems: 'flex-start',
                        position: 'relative',
                        animationDelay: `${i * 0.04}s`,
                        animationFillMode: 'backwards',
                      }}
                    >
                      {/* Timeline dot — text icon */}
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: `1px solid ${getActivityColor(activity.type)}`,
                        backgroundColor: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        flexShrink: 0,
                        zIndex: 1,
                        color: getActivityColor(activity.type),
                        fontWeight: 600,
                      }}>
                        {getActivityIcon(activity.type)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: getActivityColor(activity.type),
                            letterSpacing: '0.02em',
                          }}>
                            {getActivityLabel(activity.type)}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                          }}
                            title={new Date(activity.created_at).toLocaleString()}
                          >
                            {timeAgo(activity.created_at)}
                          </span>
                        </div>

                        {/* Status change */}
                        {activity.from_status && activity.to_status && (
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}>
                            <span style={{
                              padding: '1px 8px',
                              borderRadius: '20px',
                              border: '1px solid var(--border)',
                              fontSize: '10px',
                              letterSpacing: '0.04em',
                            }}>
                              {formatStatus(activity.from_status)}
                            </span>
                            <span style={{ color: 'var(--accent)', fontSize: '12px' }}>{'\u2192'}</span>
                            <span style={{
                              padding: '1px 8px',
                              borderRadius: '20px',
                              border: '1px solid var(--border)',
                              fontSize: '10px',
                              letterSpacing: '0.04em',
                            }}>
                              {formatStatus(activity.to_status)}
                            </span>
                          </div>
                        )}

                        {/* Created in status */}
                        {activity.type === 'task_created' && activity.to_status && !activity.from_status && (
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                          }}>
                            Added to{' '}
                            <span style={{
                              padding: '1px 8px',
                              borderRadius: '20px',
                              border: '1px solid var(--border)',
                              fontSize: '10px',
                              letterSpacing: '0.04em',
                            }}>
                              {formatStatus(activity.to_status)}
                            </span>
                          </div>
                        )}

                        {/* Details */}
                        {activity.details && (
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            fontStyle: 'italic',
                          }}>
                            {activity.details}
                          </div>
                        )}

                        {/* User */}
                        <div style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                          letterSpacing: '0.04em',
                        }}>
                          by {activity.created_by}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
