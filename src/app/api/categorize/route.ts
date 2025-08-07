import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json()
    
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required and must be a string' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const prompt = `
Analyze this task description and categorize it for business optimization:

Task: "${transcript}"

Categorize into one of these categories:
- "delegate": Tasks that could be assigned to team members or assistants
- "automate": Repetitive tasks that could be automated with software/tools
- "eliminate": Low-value tasks that could be removed entirely
- "personal": Personal activities, breaks, or necessary but non-business tasks

Respond with valid JSON only:
{
  "taskName": "Clean, concise task title (max 50 chars)",
  "description": "Brief description of what the task involves",
  "category": "delegate|automate|eliminate|personal", 
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this category was chosen"
}

Rules:
- Be decisive - choose the most likely category
- Confidence should be 0.1-1.0
- Keep descriptions concise but informative
- Focus on business value and optimization potential`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a business efficiency expert. Analyze tasks and categorize them for delegation, automation, elimination, or as personal activities. Always respond with valid JSON only.'
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    })

    const content = response.choices[0].message.content?.trim()
    
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse the JSON response
    const result = JSON.parse(content)
    
    // Validate the response structure
    if (!result.taskName || !result.category || typeof result.confidence !== 'number') {
      throw new Error('Invalid response structure from OpenAI')
    }

    // Validate category
    const validCategories = ['delegate', 'automate', 'eliminate', 'personal']
    if (!validCategories.includes(result.category)) {
      result.category = 'personal' // fallback
    }

    // Ensure confidence is within range
    result.confidence = Math.max(0.1, Math.min(1.0, result.confidence))

    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Categorization error:', error)
    
    // Return a fallback response instead of failing completely
    const { transcript } = await request.json().catch(() => ({ transcript: 'Unknown task' }))
    
    return NextResponse.json({
      taskName: transcript?.charAt(0)?.toUpperCase() + transcript?.slice(1) || 'Unknown task',
      description: transcript || 'Task description not available',
      category: 'personal',
      confidence: 0.3,
      reasoning: 'Fallback categorization due to processing error'
    })
  }
}