import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET() {
  try {
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL
    
    if (!connectionString) {
      return NextResponse.json({ 
        error: 'No database URL found in environment variables' 
      }, { status: 500 })
    }

    // Test direct PostgreSQL connection
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    })

    // Try a simple query
    const result = await pool.query('SELECT NOW() as current_time, current_database() as database')
    
    // Check if Better Auth tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'users', 'session', 'account', 'verification')
      ORDER BY table_name
    `)

    await pool.end()

    return NextResponse.json({
      success: true,
      database: result.rows[0],
      tables: tablesResult.rows.map(r => r.table_name),
      connectionString: connectionString.replace(/:[^:@]*@/, ':****@') // Hide password
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}