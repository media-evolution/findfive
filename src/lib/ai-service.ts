export interface CategoryResult {
  taskName: string
  description: string
  category: 'delegate' | 'automate' | 'eliminate' | 'personal'
  confidence: number
  reasoning: string
}

const CATEGORIZATION_CACHE = new Map<string, CategoryResult>()

export async function categorizeTask(transcript: string): Promise<CategoryResult> {
  // Check cache first
  const cacheKey = transcript.toLowerCase().trim()
  if (CATEGORIZATION_CACHE.has(cacheKey)) {
    return CATEGORIZATION_CACHE.get(cacheKey)!
  }

  try {
    const response = await fetch('/api/categorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transcript })
    })

    if (!response.ok) {
      throw new Error(`Categorization failed: ${response.statusText}`)
    }

    const result: CategoryResult = await response.json()
    
    // Cache the result
    CATEGORIZATION_CACHE.set(cacheKey, result)
    
    return result
  } catch (error) {
    console.error('Categorization error:', error)
    
    // Fallback to simple keyword-based categorization
    return getSimpleCategory(transcript)
  }
}

function getSimpleCategory(transcript: string): CategoryResult {
  const text = transcript.toLowerCase()
  
  // Simple keyword-based categorization as fallback
  let category: 'delegate' | 'automate' | 'eliminate' | 'personal' = 'personal'
  let confidence = 0.3
  let reasoning = 'Fallback categorization based on keywords'
  
  if (text.includes('meeting') || text.includes('call') || text.includes('email') || 
      text.includes('report') || text.includes('presentation')) {
    category = 'delegate'
    confidence = 0.6
    reasoning = 'Contains communication/documentation keywords that could be delegated'
  } else if (text.includes('data entry') || text.includes('update') || text.includes('copy') || 
             text.includes('format') || text.includes('organize')) {
    category = 'automate'
    confidence = 0.7
    reasoning = 'Contains repetitive task keywords that could be automated'
  } else if (text.includes('break') || text.includes('coffee') || text.includes('lunch') || 
             text.includes('chat') || text.includes('personal')) {
    category = 'personal'
    confidence = 0.8
    reasoning = 'Contains personal activity keywords'
  }
  
  return {
    taskName: transcript.charAt(0).toUpperCase() + transcript.slice(1),
    description: transcript,
    category,
    confidence,
    reasoning
  }
}

export function clearCategorizationCache() {
  CATEGORIZATION_CACHE.clear()
}