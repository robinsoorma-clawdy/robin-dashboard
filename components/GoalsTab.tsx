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
    { name: 'Cash', amount: 25000, color: 'var(--success)', icon: null, letter: 'C' },
    { name: 'Super', amount: 10000, color: 'var(--accent)', icon: null, letter: 'S' },
    { name: 'Stocks', amount: 5000, color: 'var(--warning)', note: 'Not to be touched', icon: null, letter: 'I' },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview Card — Editorial Hero */}
      <div className="animate-fade-in-up" style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Geometric corner accent */}
        <div style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          pointerEvents: 'none',
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '32px', height: '1px', background: 'var(--accent)', opacity: 0.25 }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '1px', height: '32px', background: 'var(--accent)', opacity: 0.25 }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Section eyebrow */}
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '8px',
          }}>
            House Acquisition
          </p>

          <h2 style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: '28px', 
            fontWeight: 400, 
            fontStyle: 'italic',
            marginBottom: '32px', 
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}>
            Buying Progress
          </h2>

          {/* Progress Bar */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '10px' }}>
                Current: <strong style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', letterSpacing: '-0.01em', textTransform: 'none' }}>${(currentSavings / 1000).toFixed(0)}k</strong>
              </span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '10px' }}>
                Target: <strong style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', letterSpacing: '-0.01em', textTransform: 'none' }}>${(finalTarget / 1000).toFixed(0)}k</strong>
              </span>
            </div>
            
            <div style={{ 
              height: '4px', 
              backgroundColor: 'var(--bg-tertiary)', 
              borderRadius: '2px', 
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div className="progress-bar-fill" style={{ 
                width: `${progressPercentage}%`, 
                height: '100%', 
                background: 'var(--accent)',
                borderRadius: '2px',
                transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
              }} />
              
              {/* Milestone Marker */}
              <div style={{ 
                position: 'absolute', 
                left: `${milestonePercentage}%`, 
                top: '-4px', 
                width: '1px', 
                height: '12px', 
                backgroundColor: 'var(--success)',
                zIndex: 2,
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-18px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  fontSize: '9px',
                  color: 'var(--success)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  MIN GOAL
                </div>
              </div>
            </div>
            
            <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 400, letterSpacing: '0.02em' }}>
              {progressPercentage >= milestonePercentage 
                ? "Minimum deposit milestone reached" 
                : `${((milestoneTarget - currentSavings) / 1000).toFixed(0)}k away from first milestone`}
            </p>
          </div>

          {/* Breakdown and Timeline Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Source Breakdown */}
            <div>
              <h3 style={{ 
                fontSize: '10px', 
                fontWeight: 500, 
                marginBottom: '16px', 
                color: 'var(--text-muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}>
                Source Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sources.map((source, i) => (
                  <div key={source.name} className="animate-fade-in-up" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '14px',
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'border-color 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    animationDelay: `${i * 0.08}s`,
                    animationFillMode: 'backwards',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-accent)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                  >
                    {/* Letter monogram instead of emoji */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: `1px solid ${source.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      color: source.color,
                      flexShrink: 0,
                      opacity: 0.9,
                    }}>
                      {source.letter}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{source.name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: source.color, fontFamily: 'var(--font-body)' }}>${(source.amount / 1000).toFixed(1)}k</span>
                      </div>
                      {source.note && (
                        <span style={{ fontSize: '10px', color: 'var(--danger)', fontWeight: 400, opacity: 0.8, letterSpacing: '0.02em' }}>
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
              padding: '28px', 
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Subtle pattern */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(201, 168, 76, 0.015) 20px, rgba(201, 168, 76, 0.015) 21px)',
                pointerEvents: 'none',
              }} />

              <h3 style={{ 
                fontSize: '10px', 
                fontWeight: 500, 
                marginBottom: '8px', 
                color: 'var(--text-muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                position: 'relative',
              }}>
                Estimated Timeline
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px', fontWeight: 400, position: 'relative' }}>
                Based on <strong style={{ color: 'var(--text-secondary)' }}>${monthlySavings}/mo</strong> savings rate
              </p>
              <div className="animate-fade-in-up" style={{ 
                fontFamily: 'var(--font-display)',
                fontSize: '42px', 
                fontWeight: 400, 
                fontStyle: 'italic',
                color: 'var(--accent)',
                marginBottom: '6px',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                position: 'relative',
              }}>
                {monthsToFinal}
              </div>
              <p style={{ 
                fontSize: '10px', 
                color: 'var(--text-muted)', 
                fontWeight: 500, 
                letterSpacing: '0.12em', 
                textTransform: 'uppercase',
                position: 'relative',
                marginBottom: '8px',
              }}>
                Months
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, position: 'relative' }}>
                {targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Milestones Checklist */}
        <div className="animate-fade-in-up" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          animationDelay: '0.1s',
          animationFillMode: 'backwards',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ 
              fontFamily: 'var(--font-display)',
              fontSize: '20px', 
              fontWeight: 400, 
              fontStyle: 'italic',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}>
              Key Milestones
            </h3>
            <span style={{
              fontSize: '10px',
              fontWeight: 500,
              color: 'var(--accent)',
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid var(--border-accent)',
              letterSpacing: '0.06em',
            }}>
              {completedMilestones}/{milestones.length}
            </span>
          </div>

          {/* Gold divider */}
          <div style={{ width: '32px', height: '1px', background: 'var(--accent)', marginBottom: '20px', opacity: 0.4 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {milestones.map((m, i) => (
              <div key={m.id} className="animate-fade-in-up" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '14px',
                padding: '10px 8px',
                borderRadius: 'var(--radius-sm)',
                transition: 'background-color 0.2s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                animationDelay: `${i * 0.06}s`,
                animationFillMode: 'backwards',
                cursor: 'default',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: `1.5px solid ${m.completed ? 'var(--accent)' : 'var(--text-muted)'}`,
                  backgroundColor: m.completed ? 'var(--accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: m.completed ? 'var(--bg-primary)' : 'transparent',
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                  fontWeight: 700,
                }}>
                  {m.completed && '\u2713'}
                </div>
                <span style={{ 
                  fontSize: '13px', 
                  color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: m.completed ? 'line-through' : 'none',
                  fontWeight: m.completed ? 400 : 500,
                  letterSpacing: '-0.01em',
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
          padding: '28px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          animationDelay: '0.15s',
          animationFillMode: 'backwards',
        }}>
          <h3 style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: '20px', 
            fontWeight: 400, 
            fontStyle: 'italic',
            marginBottom: '8px', 
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Contributing Tasks
          </h3>

          {/* Gold divider */}
          <div style={{ width: '32px', height: '1px', background: 'var(--accent)', marginBottom: '20px', opacity: 0.4 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {relatedTasks.length > 0 ? (
              relatedTasks.map((task, i) => (
                <div key={task.id} className="hover-lift animate-fade-in-up" style={{ 
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  animationDelay: `${i * 0.06}s`,
                  animationFillMode: 'backwards',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, letterSpacing: '-0.01em' }}>{task.title}</span>
                    <span style={{ 
                      fontSize: '9px', 
                      padding: '3px 10px', 
                      borderRadius: '20px',
                      border: `1px solid ${task.status === 'done' ? 'var(--success)' : 'var(--accent)'}`,
                      color: task.status === 'done' ? 'var(--success)' : 'var(--accent)',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      letterSpacing: '0.08em',
                      flexShrink: 0,
                      marginLeft: '12px',
                    }}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {task.category}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '32px', fontStyle: 'italic' }}>
                No active tasks linked to this goal yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
