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

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    })

    // Check if V2 tables exist
    const tablesResult = await pool.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name IN ('sessions', 'leave_records', 'interruptions', 'user_preferences')
      ORDER BY table_name, ordinal_position
    `)

    // Check if functions exist
    const functionsResult = await pool.query(`
      SELECT 
        routine_name,
        routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN ('get_active_session', 'calculate_session_progress')
    `)

    // Check RLS policies
    const policiesResult = await pool.query(`
      SELECT 
        tablename,
        policyname,
        cmd,
        qual
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN ('sessions', 'leave_records', 'interruptions', 'user_preferences')
      ORDER BY tablename, policyname
    `)

    await pool.end()

    // Group columns by table
    const tables: Record<string, any[]> = {}
    tablesResult.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = []
      }
      tables[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES'
      })
    })

    return NextResponse.json({
      success: true,
      tables,
      functions: functionsResult.rows,
      policies: policiesResult.rows,
      summary: {
        tables_found: Object.keys(tables),
        functions_found: functionsResult.rows.map(f => f.routine_name),
        policies_count: policiesResult.rows.length
      }
    })
  } catch (error) {
    console.error('V2 Schema test error:', error)
    return NextResponse.json({ 
      error: 'V2 Schema test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}