-- Find Five V2 Database Schema Evolution
-- Add new tables for session-based tracking, leave records, interruptions, and user preferences

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table - Track 5/7/14/30 day tracking periods
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('5_days', '7_days', '14_days', '30_days')),
    start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_end_date DATE,
    status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT sessions_dates_valid CHECK (planned_end_date >= start_date),
    CONSTRAINT sessions_actual_end_valid CHECK (actual_end_date IS NULL OR actual_end_date >= start_date)
);

-- Leave records table - Days users take off during sessions
CREATE TABLE IF NOT EXISTS public.leave_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    leave_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure no duplicate leave dates per session
    UNIQUE(session_id, leave_date)
);

-- Interruptions table - Track interruptions with source and impact
CREATE TABLE IF NOT EXISTS public.interruptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL CHECK (source IN ('self', 'email', 'phone', 'team', 'client', 'other')),
    impact VARCHAR(10) NOT NULL CHECK (impact IN ('low', 'medium', 'high')),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    description TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure occurred_at is reasonable (not in future, not too old)
    CONSTRAINT interruptions_occurred_at_valid CHECK (occurred_at <= NOW() AND occurred_at >= NOW() - INTERVAL '1 year')
);

-- User preferences table - Move from localStorage to database
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id TEXT PRIMARY KEY REFERENCES public."user"(id) ON DELETE CASCADE,
    notification_interval INTEGER DEFAULT 60 CHECK (notification_interval >= 5 AND notification_interval <= 1440),
    work_start_time TIME DEFAULT '09:00:00',
    work_end_time TIME DEFAULT '17:00:00',
    work_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5] CHECK (
        array_length(work_days, 1) > 0 AND 
        array_length(work_days, 1) <= 7 AND
        work_days <@ ARRAY[1,2,3,4,5,6,7]
    ),
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    voice_enabled BOOLEAN DEFAULT true,
    auto_categorize BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure work times are logical
    CONSTRAINT work_hours_valid CHECK (work_end_time > work_start_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_dates ON public.sessions(start_date, planned_end_date);

CREATE INDEX IF NOT EXISTS idx_leave_records_session_id ON public.leave_records(session_id);
CREATE INDEX IF NOT EXISTS idx_leave_records_date ON public.leave_records(leave_date);

CREATE INDEX IF NOT EXISTS idx_interruptions_session_id ON public.interruptions(session_id);
CREATE INDEX IF NOT EXISTS idx_interruptions_occurred_at ON public.interruptions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_interruptions_source ON public.interruptions(source);

-- Add triggers for updated_at columns
CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions table
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own sessions" ON public.sessions
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own sessions" ON public.sessions
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own sessions" ON public.sessions
    FOR DELETE USING (user_id = auth.uid()::text);

-- RLS Policies for leave_records table
CREATE POLICY "Users can view own leave records" ON public.leave_records
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM public.sessions WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create leave records for own sessions" ON public.leave_records
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM public.sessions WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own leave records" ON public.leave_records
    FOR UPDATE USING (
        session_id IN (
            SELECT id FROM public.sessions WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own leave records" ON public.leave_records
    FOR DELETE USING (
        session_id IN (
            SELECT id FROM public.sessions WHERE user_id = auth.uid()::text
        )
    );

-- RLS Policies for interruptions table
CREATE POLICY "Users can view own interruptions" ON public.interruptions
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM public.sessions WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create interruptions for own sessions" ON public.interruptions
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM public.sessions WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own interruptions" ON public.interruptions
    FOR UPDATE USING (
        session_id IN (
            SELECT id FROM public.sessions WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own interruptions" ON public.interruptions
    FOR DELETE USING (
        session_id IN (
            SELECT id FROM public.sessions WHERE user_id = auth.uid()::text
        )
    );

-- RLS Policies for user_preferences table
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (user_id = auth.uid()::text);

-- Add helpful functions for session management
CREATE OR REPLACE FUNCTION public.get_active_session(p_user_id TEXT)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id 
        FROM public.sessions 
        WHERE user_id = p_user_id 
        AND status = 'active' 
        ORDER BY created_at DESC 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate session progress
CREATE OR REPLACE FUNCTION public.calculate_session_progress(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
    session_record public.sessions%ROWTYPE;
    days_total INTEGER;
    days_elapsed INTEGER;
    days_remaining INTEGER;
    leave_days INTEGER;
    working_days INTEGER;
    progress_percentage NUMERIC;
BEGIN
    -- Get session details
    SELECT * INTO session_record FROM public.sessions WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Session not found');
    END IF;
    
    -- Calculate total days in session
    days_total := session_record.planned_end_date - session_record.start_date + 1;
    
    -- Calculate days elapsed
    days_elapsed := LEAST(
        CURRENT_DATE - session_record.start_date + 1,
        days_total
    );
    
    -- Count leave days
    SELECT COUNT(*) INTO leave_days
    FROM public.leave_records 
    WHERE session_id = p_session_id;
    
    -- Calculate working days and progress
    working_days := days_elapsed - leave_days;
    days_remaining := days_total - days_elapsed;
    progress_percentage := CASE 
        WHEN days_total > 0 THEN ROUND((working_days::NUMERIC / days_total::NUMERIC) * 100, 2)
        ELSE 0
    END;
    
    RETURN jsonb_build_object(
        'session_id', p_session_id,
        'days_total', days_total,
        'days_elapsed', days_elapsed,
        'days_remaining', days_remaining,
        'leave_days', leave_days,
        'working_days', working_days,
        'progress_percentage', progress_percentage,
        'status', session_record.status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_active_session(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_session_progress(UUID) TO authenticated;