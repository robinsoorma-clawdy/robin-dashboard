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

  // Load data on mount + subscribe to real-time comments
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

    return () => {
      commentsChannel.unsubscribe()
    }
  }, [task.id, fetchComments])

  // Load activities when tab switches to history
  useEffect(() => {
    if (activeTab === 'history') {
      fetchTaskActivities()
    }
  }, [activeTab, fetchTaskActivities])

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
      // Real-time subscription will re-fetch, but also fetch immediately for fast UX
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
      work: '#58a6ff',
      project: '#a371f7',
      career: '#3fb950',
      finance: '#d29922',
      personal: '#8b949e',
    }
    return colors[cat] || '#6e7681'
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
      case 'task_created': return '✨'
      case 'task_moved': return '➡️'
      case 'task_completed': return '✅'
      case 'task_deleted': return '🗑️'
      case 'task_updated': return '✏️'
      default: return '📌'
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
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
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    color: '#fff',
                    backgroundColor: getCategoryColor(task.category),
                  }}
                >
                  {task.category}
                </span>
                <span
                  style={{
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
                  }}
                >
                  {task.priority || 'medium'}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    color: getStatusColor(task.status),
                    backgroundColor: `${getStatusColor(task.status)}15`,
                  }}
                >
                  {formatStatus(task.status)}
                </span>
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.4,
              }}>
                {task.title}
              </h2>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                padding: '6px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '18px',
                lineHeight: 1,
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)'
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              ✕
            </button>
          </div>

          {/* Description & metadata */}
          {task.description && (
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              lineHeight: 1.6,
              marginTop: '12px',
              marginBottom: 0,
            }}>
              {task.description}
            </p>
          )}

          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '12px',
            flexWrap: 'wrap',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}>
            <span>Created {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            {task.due_date && (
              <span style={{
                color: new Date(task.due_date) < new Date() ? 'var(--danger)' : 'var(--text-muted)',
              }}>
                Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            <span>by {task.created_by}</span>
          </div>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            gap: '0',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 24px',
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
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  backgroundColor: activeTab === tab.id ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600,
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
                padding: '16px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {commentsLoading ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '32px',
                    color: 'var(--text-muted)',
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid var(--bg-tertiary)',
                      borderTopColor: 'var(--accent)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 8px',
                    }} />
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                  }}>
                    <p style={{ fontSize: '28px', marginBottom: '8px' }}>💬</p>
                    <p>No comments yet. Start the discussion!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'var(--accent)',
                        fontWeight: 600,
                        flexShrink: 0,
                        marginTop: '2px',
                      }}>
                        {comment.created_by.charAt(0).toUpperCase()}
                      </div>

                      {/* Comment body */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}>
                            {comment.created_by}
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                            }}
                            title={new Date(comment.created_at).toLocaleString()}
                          >
                            {timeAgo(comment.created_at)}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          backgroundColor: 'var(--bg-tertiary)',
                          padding: '10px 14px',
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
                padding: '12px 24px 16px',
                borderTop: '1px solid var(--border-subtle)',
                flexShrink: 0,
              }}>
                <form onSubmit={submitComment} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
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
                        fontSize: '14px',
                        resize: 'none',
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)'
                      }}
                    />
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                    }}>
                      Cmd/Ctrl+Enter to submit
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: newComment.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: newComment.trim() ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: isSubmitting || !newComment.trim() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      marginBottom: '20px',
                      opacity: isSubmitting ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onMouseEnter={(e) => {
                      if (newComment.trim() && !isSubmitting) {
                        e.currentTarget.style.backgroundColor = 'var(--accent-hover)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = newComment.trim() ? 'var(--accent)' : 'var(--bg-tertiary)'
                    }}
                  >
                    {isSubmitting && (
                      <span style={{
                        display: 'inline-block',
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                      }} />
                    )}
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
              padding: '16px 24px',
            }}>
              {activitiesLoading ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: 'var(--text-muted)',
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid var(--bg-tertiary)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 8px',
                  }} />
                  Loading history...
                </div>
              ) : activities.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                }}>
                  <p style={{ fontSize: '28px', marginBottom: '8px' }}>📋</p>
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
                    left: '15px',
                    top: '20px',
                    bottom: '20px',
                    width: '2px',
                    backgroundColor: 'var(--border-subtle)',
                  }} />

                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '10px 0',
                        alignItems: 'flex-start',
                        position: 'relative',
                      }}
                    >
                      {/* Timeline dot */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: `${getActivityColor(activity.type)}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        flexShrink: 0,
                        zIndex: 1,
                        border: '2px solid var(--bg-secondary)',
                      }}>
                        {getActivityIcon(activity.type)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0, paddingTop: '4px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: getActivityColor(activity.type),
                          }}>
                            {getActivityLabel(activity.type)}
                          </span>
                          <span style={{
                            fontSize: '12px',
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
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}>
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-tertiary)',
                              fontSize: '12px',
                            }}>
                              {formatStatus(activity.from_status)}
                            </span>
                            <span>→</span>
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-tertiary)',
                              fontSize: '12px',
                            }}>
                              {formatStatus(activity.to_status)}
                            </span>
                          </div>
                        )}

                        {/* Created in status */}
                        {activity.type === 'task_created' && activity.to_status && !activity.from_status && (
                          <div style={{
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                          }}>
                            Added to{' '}
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-tertiary)',
                              fontSize: '12px',
                            }}>
                              {formatStatus(activity.to_status)}
                            </span>
                          </div>
                        )}

                        {/* Details */}
                        {activity.details && (
                          <div style={{
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            fontStyle: 'italic',
                          }}>
                            {activity.details}
                          </div>
                        )}

                        {/* User */}
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
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
