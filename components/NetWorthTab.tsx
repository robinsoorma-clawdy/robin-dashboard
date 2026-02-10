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
  BarChart,
  Bar,
  Cell
} from 'recharts'

const CATEGORIES: { value: NetWorthCategory; label: string; color: string }[] = [
  { value: 'salary', label: 'Salary', color: 'var(--accent)' },
  { value: 'super', label: 'Super', color: '#a371f7' },
  { value: 'investments', label: 'Investments', color: 'var(--warning)' },
  { value: 'cash', label: 'Cash', color: 'var(--success)' },
  { value: 'crypto', label: 'Crypto', color: '#f7931a' },
  { value: 'property', label: 'Property', color: '#f85149' },
  { value: 'other', label: 'Other', color: 'var(--text-muted)' },
]

export default function NetWorthTab() {
  const [entries, setEntries] = useState<NetWorthEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
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
    // Scroll to form
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

  // Process data for the chart
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

    // Calculate running total for each date (assuming entries are point-in-time snapshots)
    // Actually, usually net worth entries are "current balance at this date".
    // If we have multiple entries for the same category on the same date, we sum them.
    // To show a true timeline, we should probably take the LATEST balance of each category for each date.
    
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

  // Get current breakdown (latest entries for each category)
  const breakdown = useMemo(() => {
    const latestByCategory: Record<string, number> = {}
    
    // Sort entries by date desc to find the most recent ones
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
    })).filter(c => c.amount > 0 || c.value === 'cash') // Always show cash
  }, [entries])

  const currentTotal = breakdown.reduce((sum, item) => sum + item.amount, 0)

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading Net Worth data...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Section: Big Number & Chart */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px'
      }}>
        {/* Big Number Display */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Current Net Worth
          </h3>
          <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            ${currentTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: 'var(--success)', 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>▲</span>
            <span>Steady Growth</span>
          </div>
        </div>

        {/* Chart */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          border: '1px solid var(--border)',
          height: '300px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Growth Over Time
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="var(--text-muted)" 
                fontSize={12}
                tickFormatter={(str) => {
                  const d = new Date(str)
                  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                }}
              />
              <YAxis 
                stroke="var(--text-muted)" 
                fontSize={12}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-elevated)', 
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)'
                }}
                itemStyle={{ color: 'var(--accent)' }}
                formatter={(value: number | undefined) => {
                  if (value === undefined) return ['', 'Total Net Worth']
                  return [`$${value.toLocaleString()}`, 'Total Net Worth']
                }}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="var(--accent)" 
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                strokeWidth={3}
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
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
            Category Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {breakdown.map(item => (
              <div key={item.value}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    ${item.amount.toLocaleString()} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div style={{ 
                  height: '8px', 
                  backgroundColor: 'var(--bg-tertiary)', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${item.percentage}%`, 
                    height: '100%', 
                    backgroundColor: item.color,
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Entry Form */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
            Add New Entry
          </h3>
          {entries.length === 0 && (
            <button 
              onClick={seedData}
              disabled={isSubmitting}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--accent)',
                border: '1px dashed var(--accent)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                marginBottom: '16px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🌱 Initialize with Seed Data
            </button>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as NetWorthCategory })}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Amount ($)</label>
              <input 
                type="number" 
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                required
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Notes</label>
              <input 
                type="text" 
                placeholder="Optional notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '10px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                marginTop: '8px'
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
                  padding: '8px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Recent Entries List */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        border: '1px solid var(--border)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
          Recent Entries
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>Notes</th>
                <th style={{ textAlign: 'right', padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...entries].reverse().slice(0, 10).map(entry => (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{new Date(entry.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '10px', 
                      backgroundColor: `${CATEGORIES.find(c => c.value === entry.category)?.color}20`,
                      color: CATEGORIES.find(c => c.value === entry.category)?.color,
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {entry.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600 }}>
                    ${Number(entry.amount).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {entry.notes || '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        onClick={() => handleEdit(entry)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          fontSize: '13px',
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
                          fontSize: '13px',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              No entries found. Start by adding your first entry above.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
