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
    { name: 'Cash', amount: 25000, color: 'var(--success)' },
    { name: 'Super', amount: 10000, color: 'var(--accent)' },
    { name: 'Stocks', amount: 5000, color: 'var(--warning)', note: 'Not to be touched' },
  ]

  const milestones = [
    { id: 1, label: 'Get pre-approval', completed: true },
    { id: 2, label: 'Find a buyer agent', completed: false },
    { id: 3, label: 'Attend 5+ inspections', completed: true },
    { id: 4, label: 'Shortlist 3 suburbs', completed: true },
    { id: 5, label: 'Submit first offer', completed: false },
    { id: 6, label: 'Finalize mortgage', completed: false },
  ]

  // Filter tasks related to house buying
  const relatedTasks = tasks.filter(task => 
    task.title.toLowerCase().includes('house') || 
    task.title.toLowerCase().includes('buying') ||
    task.description?.toLowerCase().includes('house') ||
    task.category === 'finance'
  )

  const progressPercentage = (currentSavings / finalTarget) * 100
  const milestonePercentage = (milestoneTarget / finalTarget) * 100

  // Timeline estimation
  const monthlySavings = 2500
  const remainingToMilestone = Math.max(0, milestoneTarget - currentSavings)
  const remainingToFinal = finalTarget - currentSavings
  const monthsToFinal = Math.ceil(remainingToFinal / monthlySavings)
  
  const targetDate = new Date()
  targetDate.setMonth(targetDate.getMonth() + monthsToFinal)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview Card */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
          🏠 House Buying Progress
        </h2>

        {/* Progress Bar Container */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Current: <strong>${(currentSavings / 1000).toFixed(0)}k</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>Target: <strong>${(finalTarget / 1000).toFixed(0)}k</strong></span>
          </div>
          
          <div style={{ 
            height: '24px', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: '12px', 
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--border)'
          }}>
            {/* Progress Fill */}
            <div style={{ 
              width: `${progressPercentage}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--accent), #a371f7)',
              borderRadius: '12px',
              transition: 'width 1s ease-out'
            }} />
            
            {/* Milestone Marker */}
            <div style={{ 
              position: 'absolute', 
              left: `${milestonePercentage}%`, 
              top: 0, 
              width: '2px', 
              height: '100%', 
              backgroundColor: 'var(--success)',
              zIndex: 2
            }}>
              <div style={{ 
                position: 'absolute', 
                top: '-20px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                fontSize: '10px',
                color: 'var(--success)',
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}>
                MIN GOAL (40k)
              </div>
            </div>
          </div>
          
          <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            {progressPercentage >= milestonePercentage 
              ? "🎉 Minimum deposit milestone reached!" 
              : `Keep going! You are ${((milestoneTarget - currentSavings) / 1000).toFixed(0)}k away from your first milestone.`}
          </p>
        </div>

        {/* Breakdown and Timeline Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Source Breakdown */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
              💰 Source Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sources.map(source => (
                <div key={source.name} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: source.color 
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{source.name}</span>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>${(source.amount / 1000).toFixed(1)}k</span>
                    </div>
                    {source.note && (
                      <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 500 }}>
                        ⚠️ {source.note}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Estimation */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: 'var(--accent-subtle)', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--accent)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
              📅 Estimated Timeline
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Based on <strong>${monthlySavings}/mo</strong> savings rate
            </p>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
              {monthsToFinal} Months
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
              Estimated Goal Date: {targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Milestones Checklist */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            🏁 Key Milestones
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {milestones.map(m => (
              <div key={m.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '8px 0',
                borderBottom: '1px solid var(--border-subtle)',
                opacity: m.completed ? 0.7 : 1
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: `2px solid ${m.completed ? 'var(--success)' : 'var(--border)'}`,
                  backgroundColor: m.completed ? 'var(--success)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#fff'
                }}>
                  {m.completed && '✓'}
                </div>
                <span style={{ 
                  fontSize: '14px', 
                  color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: m.completed ? 'line-through' : 'none'
                }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Tasks */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            🔗 Contributing Tasks
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {relatedTasks.length > 0 ? (
              relatedTasks.map(task => (
                <div key={task.id} style={{ 
                  padding: '12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{task.title}</span>
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '2px 6px', 
                      borderRadius: '10px',
                      backgroundColor: task.status === 'done' ? 'var(--success-subtle)' : 'var(--accent-subtle)',
                      color: task.status === 'done' ? 'var(--success)' : 'var(--accent)',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    Category: {task.category}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No active tasks linked to this goal yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
