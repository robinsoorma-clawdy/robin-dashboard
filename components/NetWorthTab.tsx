'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { NetWorthEntry, NetWorthCategory } from '@/lib/types'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts'

const CATEGORIES: { value: NetWorthCategory; label: string; color: string }[] = [
  { value: 'salary', label: 'Salary', color: '#c9a84c' },
  { value: 'super', label: 'Super', color: '#8b7355' },
  { value: 'investments', label: 'Investments', color: '#e2a336' },
  { value: 'cash', label: 'Cash', color: '#34d399' },
  { value: 'crypto', label: 'Crypto', color: '#d4a574' },
  { value: 'property', label: 'Property', color: '#e8485f' },
  { value: 'other', label: 'Other', color: '#5c584f' },
]

export default function NetWorthTab() {
  const [entries, setEntries] = useState<NetWorthEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'cash' as NetWorthCategory,
    amount: '',
    notes: ''
  })

  useEffect(() => {
    fetchEntries()
    
    const subscription = supabase
      .channel('net_worth_entries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'net_worth_entries' }, fetchEntries)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('net_worth_entries')
      .select('*')
      .order('date', { ascending: true })
    
    if (error) {
      console.error('Error fetching net worth entries:', error)
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }

  const seedData = async () => {
    setIsSubmitting(true)
    const today = new Date().toISOString().split('T')[0]
    const seedEntries = [
      { date: today, category: 'salary', amount: 80000, notes: 'Current annual salary', created_by: 'robin' },
      { date: today, category: 'super', amount: 35000, notes: 'Superannuation balance', created_by: 'robin' },
      { date: today, category: 'investments', amount: 15000, notes: 'Stock portfolio', created_by: 'robin' },
      { date: today, category: 'cash', amount: 25000, notes: 'Savings accounts', created_by: 'robin' },
      { date: today, category: 'crypto', amount: 5000, notes: 'Crypto holdings', created_by: 'robin' },
    ]

    const { error } = await supabase
      .from('net_worth_entries')
      .insert(seedEntries)

    if (error) {
      console.error('Error seeding data:', error)
      alert('Error seeding data. Check console.')
    } else {
      fetchEntries()
    }
    setIsSubmitting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || isSubmitting) return
    
    setIsSubmitting(true)
    
    if (editingId) {
      const { error } = await supabase
        .from('net_worth_entries')
        .update({
          date: formData.date,
          category: formData.category,
          amount: parseFloat(formData.amount),
          notes: formData.notes,
        })
        .eq('id', editingId)

      if (error) {
        console.error('Error updating entry:', error)
      } else {
        setEditingId(null)
        setFormData({
          ...formData,
          amount: '',
          notes: ''
        })
        fetchEntries()
      }
    } else {
      const { error } = await supabase
        .from('net_worth_entries')
        .insert({
          date: formData.date,
          category: formData.category,
          amount: parseFloat(formData.amount),
          notes: formData.notes,
          created_by: 'robin'
        })

      if (error) {
        console.error('Error adding entry:', error)
      } else {
        setFormData({
          ...formData,
          amount: '',
          notes: ''
        })
        fetchEntries()
      }
    }
    setIsSubmitting(false)
  }

  const handleEdit = (entry: NetWorthEntry) => {
    setEditingId(entry.id)
    setFormData({
      date: entry.date,
      category: entry.category,
      amount: entry.amount.toString(),
      notes: entry.notes || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('net_worth_entries')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting entry:', error)
    } else {
      fetchEntries()
    }
  }

  const chartData = useMemo(() => {
    const groupedByDate: Record<string, any> = {}
    
    entries.forEach(entry => {
      const date = entry.date
      if (!groupedByDate[date]) {
        groupedByDate[date] = { date, total: 0 }
        CATEGORIES.forEach(cat => { groupedByDate[date][cat.value] = 0 })
      }
      groupedByDate[date][entry.category] = (groupedByDate[date][entry.category] || 0) + Number(entry.amount)
    })

    const sortedDates = Object.keys(groupedByDate).sort()
    const result = sortedDates.map(date => {
      const data = groupedByDate[date]
      let total = 0
      CATEGORIES.forEach(cat => {
        total += data[cat.value] || 0
      })
      return { ...data, total }
    })

    return result
  }, [entries])

  const breakdown = useMemo(() => {
    const latestByCategory: Record<string, number> = {}
    
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    const categoriesFound = new Set()
    sortedEntries.forEach(entry => {
      if (!categoriesFound.has(entry.category)) {
        latestByCategory[entry.category] = Number(entry.amount)
        categoriesFound.add(entry.category)
      }
    })

    const total = Object.values(latestByCategory).reduce((sum, val) => sum + val, 0)
    
    return CATEGORIES.map(cat => ({
      ...cat,
      amount: latestByCategory[cat.value] || 0,
      percentage: total > 0 ? ((latestByCategory[cat.value] || 0) / total) * 100 : 0
    })).filter(c => c.amount > 0 || c.value === 'cash')
  }, [entries])

  const currentTotal = breakdown.reduce((sum, item) => sum + item.amount, 0)

  const percentageChange = useMemo(() => {
    if (chartData.length < 2) return null
    const current = chartData[chartData.length - 1].total
    const previous = chartData[chartData.length - 2].total
    if (previous === 0) return null
    return ((current - previous) / previous) * 100
  }, [chartData])

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    width: '100%',
  }

  if (loading) {
    return (
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '64px' }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '1.5px solid var(--bg-tertiary)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <span style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px'
      }}>
        {/* Big Number — Editorial style */}
        <div className="animate-fade-in-up" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Geometric corner */}
          <div style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '32px', height: '1px', background: 'var(--accent)', opacity: 0.25 }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '1px', height: '32px', background: 'var(--accent)', opacity: 0.25 }} />
          </div>

          <p style={{ 
            fontSize: '10px', 
            color: 'var(--text-muted)', 
            marginBottom: '12px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.16em',
            fontWeight: 500,
          }}>
            Current Net Worth
          </p>
          <div className="animate-fade-in-up" style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: '48px', 
            fontWeight: 400, 
            fontStyle: 'italic',
            color: 'var(--accent)',
            marginBottom: '12px',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            ${currentTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>

          {/* Gold divider */}
          <div style={{ width: '40px', height: '1px', background: 'var(--accent)', marginBottom: '12px', opacity: 0.4 }} />

          {percentageChange !== null ? (
            <div style={{ 
              fontSize: '12px', 
              color: percentageChange >= 0 ? 'var(--success)' : 'var(--danger)', 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.02em',
            }}>
              <span>{percentageChange >= 0 ? '\u25B2' : '\u25BC'}</span>
              <span>{percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}% vs previous</span>
            </div>
          ) : (
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-muted)', 
              fontWeight: 400,
              fontStyle: 'italic',
            }}>
              No previous data to compare
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="animate-fade-in-up" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          border: '1px solid var(--border)',
          height: '300px',
          boxShadow: 'var(--shadow-sm)',
          animationDelay: '0.08s',
          animationFillMode: 'backwards',
        }}>
          <h3 style={{ 
            fontSize: '10px', 
            fontWeight: 500, 
            marginBottom: '20px', 
            color: 'var(--text-muted)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
            Growth Over Time
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.20}/>
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(201, 168, 76, 0.06)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#5c584f" 
                fontSize={10}
                fontFamily="var(--font-body)"
                tickFormatter={(str) => {
                  const d = new Date(str)
                  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                }}
              />
              <YAxis 
                stroke="#5c584f" 
                fontSize={10}
                fontFamily="var(--font-body)"
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-elevated)', 
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-lg)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-body)',
                }}
                itemStyle={{ color: '#c9a84c' }}
                formatter={(value: number | undefined) => {
                  if (value === undefined) return ['', 'Total Net Worth']
                  return [`$${value.toLocaleString()}`, 'Total Net Worth']
                }}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#c9a84c" 
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {/* Category Breakdown */}
        <div className="animate-fade-in-up" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          animationDelay: '0.12s',
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
            Category Breakdown
          </h3>
          {/* Gold divider */}
          <div style={{ width: '32px', height: '1px', background: 'var(--accent)', marginBottom: '24px', opacity: 0.4 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {breakdown.map((item, i) => (
              <div key={item.value} className="animate-fade-in-up" style={{
                animationDelay: `${0.12 + i * 0.06}s`,
                animationFillMode: 'backwards',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 400 }}>
                    <div style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      backgroundColor: item.color,
                    }} />
                    {item.label}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '12px', fontFamily: 'var(--font-body)' }}>
                    ${item.amount.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({item.percentage.toFixed(1)}%)</span>
                  </span>
                </div>
                <div style={{ 
                  height: '3px', 
                  backgroundColor: 'var(--bg-tertiary)', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div className="progress-bar-fill" style={{ 
                    width: `${item.percentage}%`, 
                    height: '100%', 
                    backgroundColor: item.color,
                    borderRadius: '2px',
                    transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Entry Form */}
        <div className="animate-fade-in-up" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          animationDelay: '0.16s',
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
            {editingId ? 'Edit Entry' : 'New Entry'}
          </h3>
          {/* Gold divider */}
          <div style={{ width: '32px', height: '1px', background: 'var(--accent)', marginBottom: '24px', opacity: 0.4 }} />

          {entries.length === 0 && (
            <button 
              onClick={seedData}
              disabled={isSubmitting}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                color: 'var(--accent)',
                border: '1px dashed var(--border-accent)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                marginBottom: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.3s ease',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-body)',
              }}
            >
              Initialize with Seed Data
            </button>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Date</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as NetWorthCategory })}
                  style={inputStyle}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Amount ($)</label>
              <input 
                type="number" 
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Notes</label>
              <input 
                type="text" 
                placeholder="Optional notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                style={inputStyle}
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                marginTop: '4px',
                fontSize: '12px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transition: 'opacity 0.2s, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {isSubmitting ? 'Saving...' : (editingId ? 'Update Entry' : 'Add Entry')}
            </button>
            {editingId && (
              <button 
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setFormData({ ...formData, amount: '', notes: '' })
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 400,
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.04em',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="animate-fade-in-up" style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        animationDelay: '0.2s',
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
          Recent Entries
        </h3>
        {/* Gold divider */}
        <div style={{ width: '32px', height: '1px', background: 'var(--accent)', marginBottom: '24px', opacity: 0.4 }} />

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Notes</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...entries].reverse().slice(0, 10).map(entry => {
                const catInfo = CATEGORIES.find(c => c.value === entry.category)
                return (
                  <tr key={entry.id} style={{ 
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-tertiary)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                  }}
                  >
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      <span style={{ 
                        padding: '3px 10px', 
                        borderRadius: '20px', 
                        border: `1px solid ${catInfo?.color}30`,
                        color: catInfo?.color,
                        fontSize: '10px',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}>
                        {entry.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ${Number(entry.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: entry.notes ? 'normal' : 'italic' }}>
                      {entry.notes || '\u2014'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button 
                          onClick={() => handleEdit(entry)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'all 0.2s ease',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-body)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-subtle)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(entry.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'all 0.2s ease',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-body)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--danger-subtle)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {entries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
              No entries found. Start by adding your first entry above.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
