// Smart Model Router for OpenCode
// Automatically selects the most token-efficient model based on task complexity

export function selectModel(task: string): string {
  const taskLower = task.toLowerCase()
  
  // Simple UI/Styling tasks → Gemini 3 Flash (fast, cheap)
  const simplePatterns = [
    'css', 'style', 'color', 'padding', 'margin', 'font', 'ui', 'button',
    'icon', 'layout', 'responsive', 'theme', 'dark', 'light', 'hover',
    'animation', 'transition', 'border', 'background', 'text'
  ]
  
  if (simplePatterns.some(p => taskLower.includes(p))) {
    return 'google/antigravity-gemini-3-flash'
  }
  
  // Database/Simple features → Gemini 3 Flash
  const dbPatterns = [
    'table', 'column', 'field', 'add input', 'form', 'date picker',
    'checkbox', 'dropdown', 'select', 'save to', 'update'
  ]
  
  if (dbPatterns.some(p => taskLower.includes(p))) {
    return 'google/antigravity-gemini-3-flash'
  }
  
  // Complex architecture → Claude Opus 4.6
  const complexPatterns = [
    'architecture', 'refactor', 'redesign', 'complex', 'algorithm',
    'integration', 'multi', 'websocket', 'real-time', 'cache',
    'performance', 'optimization', 'security', 'auth'
  ]
  
  if (complexPatterns.some(p => taskLower.includes(p))) {
    return 'google/antigravity-claude-opus-4-6-thinking'
  }
  
  // Medium complexity → Claude Sonnet 4.5 (balanced)
  return 'google/antigravity-claude-sonnet-4-5'
}

// Token cost estimates (approximate per 1K tokens)
export const MODEL_COSTS = {
  'google/antigravity-gemini-3-flash': 0.15,      // Cheapest
  'google/antigravity-claude-sonnet-4-5': 0.80,   // Balanced
  'google/antigravity-claude-opus-4-6-thinking': 3.00  // Expensive
}

export function estimateSavings(task: string): string {
  const selected = selectModel(task)
  const expensive = 'google/antigravity-claude-opus-4-6-thinking'
  
  if (selected !== expensive) {
    const savings = ((MODEL_COSTS[expensive] - MODEL_COSTS[selected]) / MODEL_COSTS[expensive] * 100).toFixed(0)
    return `Using ${selected.split('/').pop()} saves ~${savings}% vs Opus`
  }
  return 'Task requires Opus (complex)'
}
