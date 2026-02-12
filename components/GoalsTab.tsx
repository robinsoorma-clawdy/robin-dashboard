'use client'

import { Task } from '@/lib/types'

interface GoalsTabProps {
  tasks: Task[]
}

export default function GoalsTab({ tasks }: GoalsTabProps) {
  const currentSavings = 40000
  const milestoneTarget = 40000
  const finalTarget = 80000
  
  const sources = [
    { name: 'Cash', amount: 25000, color: 'var(--success)', icon: '💵' },
    { name: 'Super', amount: 10000, color: 'var(--accent)', icon: '🏦' },
    { name: 'Stocks', amount: 5000, color: 'var(--warning)', note: 'Not to be touched', icon: '📊' },
  ]

  const milestones = [
    { id: 1, label: 'Get pre-approval', completed: true },
    { id: 2, label: 'Find a buyer agent', completed: false },
    { id: 3, label: 'Attend 5+ inspections', completed: true },
    { id: 4, label: 'Shortlist 3 suburbs', completed: true },
    { id: 5, label: 'Submit first offer', completed: false },
    { id: 6, label: 'Finalize mortgage', completed: false },
  ]

  const relatedTasks = tasks.filter(task => 
    task.title.toLowerCase().includes('house') || 
    task.title.toLowerCase().includes('buying') ||
    task.description?.toLowerCase().includes('house') ||
    task.category === 'finance'
  )

  const progressPercentage = (currentSavings / finalTarget) * 100
  const milestonePercentage = (milestoneTarget / finalTarget) * 100

  const monthlySavings = 2500
  const remainingToFinal = finalTarget - currentSavings
  const monthsToFinal = Math.ceil(remainingToFinal / monthlySavings)
  
  const targetDate = new Date()
  targetDate.setMonth(targetDate.getMonth() + monthsToFinal)

  const completedMilestones = milestones.filter(m => m.completed).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overview Card */}
      <div className="animate-fade-in-up" style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(56, 139, 253, 0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            marginBottom: '24px', 
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '20px' }}>🏠</span> House Buying Progress
          </h2>

          {/* Progress Bar */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                Current: <strong style={{ color: 'var(--text-primary)' }}>${(currentSavings / 1000).toFixed(0)}k</strong>
              </span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                Target: <strong style={{ color: 'var(--text-primary)' }}>${(finalTarget / 1000).toFixed(0)}k</strong>
              </span>
            </div>
            
            <div style={{ 
              height: '20px', 
              backgroundColor: 'var(--bg-tertiary)', 
              borderRadius: '10px', 
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}>
              <div className="progress-bar-fill" style={{ 
                width: `${progressPercentage}%`, 
                height: '100%', 
                background: 'var(--gradient-brand)',
                borderRadius: '10px',
                transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
              
              {/* Milestone Marker */}
              <div style={{ 
                position: 'absolute', 
                left: `${milestonePercentage}%`, 
                top: 0, 
                width: '2px', 
                height: '100%', 
                backgroundColor: 'var(--success)',
                zIndex: 2,
                boxShadow: '0 0 6px rgba(63, 185, 80, 0.3)',
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-22px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  fontSize: '9px',
                  color: 'var(--success)',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}>
                  MIN GOAL (40k)
                </div>
              </div>
            </div>
            
            <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 500 }}>
              {progressPercentage >= milestonePercentage 
                ? "Minimum deposit milestone reached!" 
                : `${((milestoneTarget - currentSavings) / 1000).toFixed(0)}k away from first milestone`}
            </p>
          </div>

          {/* Breakdown and Timeline Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Source Breakdown */}
            <div>
              <h3 style={{ 
                fontSize: '13px', 
                fontWeight: 700, 
                marginBottom: '14px', 
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Source Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sources.map(source => (
                  <div key={source.name} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    transition: 'border-color 0.2s',
                  }}>
                    <span style={{ fontSize: '16px' }}>{source.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{source.name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: source.color }}>${(source.amount / 1000).toFixed(1)}k</span>
                      </div>
                      {source.note && (
                        <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 500, opacity: 0.9 }}>
                          {source.note}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Estimation */}
            <div style={{ 
              padding: '22px', 
              background: 'linear-gradient(135deg, var(--accent-subtle) 0%, var(--accent-2-subtle) 100%)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-accent)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
            }}>
              <h3 style={{ 
                fontSize: '13px', 
                fontWeight: 700, 
                marginBottom: '8px', 
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Estimated Timeline
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 500 }}>
                Based on <strong style={{ color: 'var(--text-secondary)' }}>${monthlySavings}/mo</strong> savings rate
              </p>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: 800, 
                background: 'var(--gradient-brand)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '4px',
                letterSpacing: '-0.03em',
              }}>
                {monthsToFinal} Months
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                {targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Milestones Checklist */}
        <div className="animate-fade-in-up" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          animationDelay: '0.1s',
          animationFillMode: 'backwards',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ 
              fontSize: '15px', 
              fontWeight: 700, 
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}>
              Key Milestones
            </h3>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent)',
              padding: '3px 10px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-subtle)',
              letterSpacing: '0.02em',
            }}>
              {completedMilestones}/{milestones.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {milestones.map(m => (
              <div key={m.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '10px 8px',
                borderRadius: 'var(--radius-sm)',
                transition: 'background-color 0.15s',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: `2px solid ${m.completed ? 'var(--success)' : 'var(--border)'}`,
                  backgroundColor: m.completed ? 'var(--success)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: '#fff',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  boxShadow: m.completed ? '0 0 8px rgba(63, 185, 80, 0.2)' : 'none',
                }}>
                  {m.completed && '✓'}
                </div>
                <span style={{ 
                  fontSize: '13px', 
                  color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: m.completed ? 'line-through' : 'none',
                  fontWeight: m.completed ? 400 : 500,
                }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Tasks */}
        <div className="animate-fade-in-up" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          animationDelay: '0.15s',
          animationFillMode: 'backwards',
        }}>
          <h3 style={{ 
            fontSize: '15px', 
            fontWeight: 700, 
            marginBottom: '18px', 
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Contributing Tasks
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {relatedTasks.length > 0 ? (
              relatedTasks.map(task => (
                <div key={task.id} className="hover-lift" style={{ 
                  padding: '14px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{task.title}</span>
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '3px 8px', 
                      borderRadius: '10px',
                      backgroundColor: task.status === 'done' ? 'var(--success-subtle)' : 'var(--accent-subtle)',
                      color: task.status === 'done' ? 'var(--success)' : 'var(--accent)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                      marginLeft: '8px',
                    }}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                    {task.category}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                No active tasks linked to this goal yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
