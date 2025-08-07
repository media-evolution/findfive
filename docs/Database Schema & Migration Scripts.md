# Find Five Database Schema & Migration Scripts

## Database Setup

Using PostgreSQL with Supabase. These scripts include Row Level Security (RLS) policies for multi-tenant security.

## Initial Setup Script

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- Create custom types
CREATE TYPE task_category AS ENUM ('delegate', 'automate', 'eliminate', 'personal');
CREATE TYPE input_method AS ENUM ('voice', 'text', 'quick_select');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'responded');
CREATE TYPE webhook_event AS ENUM ('entry.created', 'entry.updated', 'entry.deleted', 'pattern.detected', 'daily.summary');
```

## Migration 001: Core User Tables

```sql
-- Migration: 001_create_users_table.sql
-- Description: Create users and authentication tables

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255),
    full_name VARCHAR(255),
    company VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    email_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_created_at (created_at)
);

-- User preferences table
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notification_interval INTEGER DEFAULT 60 CHECK (notification_interval >= 15),
    work_start_time TIME DEFAULT '09:00:00',
    work_end_time TIME DEFAULT '17:00:00',
    work_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
    voice_enabled BOOLEAN DEFAULT true,
    auto_categorize BOOLEAN DEFAULT true,
    notification_sound BOOLEAN DEFAULT true,
    daily_summary BOOLEAN DEFAULT true,
    weekly_report BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auth tokens table (for refresh tokens)
CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_auth_tokens_user_id (user_id),
    INDEX idx_auth_tokens_expires_at (expires_at)
);

-- Magic links table
CREATE TABLE magic_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_magic_links_token (token),
    INDEX idx_magic_links_expires_at (expires_at)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);
```

## Migration 002: Time Entries Tables

```sql
-- Migration: 002_create_time_entries_table.sql
-- Description: Create time tracking entries and related tables

-- Time entries table
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    category task_category,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    input_method input_method DEFAULT 'text',
    voice_transcript TEXT,
    ai_reasoning TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for common queries
    INDEX idx_time_entries_user_id (user_id),
    INDEX idx_time_entries_recorded_at (user_id, recorded_at DESC),
    INDEX idx_time_entries_category (user_id, category),
    INDEX idx_time_entries_created_at (created_at DESC),
    INDEX idx_time_entries_task_search USING gin (task_name gin_trgm_ops)
);

-- Task patterns table (for ML/insights)
CREATE TABLE task_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_name VARCHAR(255) NOT NULL,
    pattern_description TEXT,
    frequency INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,
    average_daily_minutes INTEGER DEFAULT 0,
    suggested_category task_category,
    suggested_action TEXT,
    confidence_score DECIMAL(3,2),
    first_seen DATE,
    last_seen DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_task_patterns_user_id (user_id),
    INDEX idx_task_patterns_frequency (frequency DESC),
    UNIQUE(user_id, pattern_name)
);

-- Task templates (for quick select)
CREATE TABLE task_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    category task_category,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_task_templates_user_id (user_id),
    INDEX idx_task_templates_usage (user_id, usage_count DESC)
);

-- Enable Row Level Security
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own time entries" ON time_entries
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own patterns" ON task_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own templates" ON task_templates
    FOR ALL USING (auth.uid() = user_id);
```

## Migration 003: Notifications Tables

```sql
-- Migration: 003_create_notifications_table.sql
-- Description: Create push notifications and scheduling tables

-- Push notification subscriptions
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_push_subscriptions_user_id (user_id),
    UNIQUE(user_id, endpoint)
);

-- Notification queue
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'time_entry',
    payload JSONB,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    status notification_status DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_notification_queue_scheduled (scheduled_for, status),
    INDEX idx_notification_queue_user_id (user_id, scheduled_for)
);

-- Notification pause periods
CREATE TABLE notification_pauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paused_until TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_notification_pauses_user_id (user_id),
    INDEX idx_notification_pauses_active (user_id, paused_until)
);

-- Enable Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_pauses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notification_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own pauses" ON notification_pauses
    FOR ALL USING (auth.uid() = user_id);
```

## Migration 004: Analytics Tables

```sql
-- Migration: 004_create_analytics_table.sql
-- Description: Create analytics and reporting tables

-- Daily aggregates (materialized for performance)
CREATE TABLE daily_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_entries INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    delegate_minutes INTEGER DEFAULT 0,
    automate_minutes INTEGER DEFAULT 0,
    eliminate_minutes INTEGER DEFAULT 0,
    personal_minutes INTEGER DEFAULT 0,
    completion_rate DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_daily_aggregates_user_date (user_id, date DESC),
    UNIQUE(user_id, date)
);

-- Weekly insights
CREATE TABLE weekly_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_minutes INTEGER DEFAULT 0,
    potential_savings_minutes INTEGER DEFAULT 0,
    top_delegatable_tasks JSONB,
    top_automatable_tasks JSONB,
    recommendations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_weekly_insights_user_week (user_id, week_start DESC),
    UNIQUE(user_id, week_start)
);

-- Enable Row Level Security
ALTER TABLE daily_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own aggregates" ON daily_aggregates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON weekly_insights
    FOR SELECT USING (auth.uid() = user_id);
```

## Migration 005: Webhooks Tables

```sql
-- Migration: 005_create_webhooks_table.sql
-- Description: Create webhook subscriptions

CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events webhook_event[] NOT NULL,
    active BOOLEAN DEFAULT true,
    failure_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_webhooks_user_id (user_id),
    INDEX idx_webhooks_active (active)
);

-- Webhook logs
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event webhook_event NOT NULL,
    payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_webhook_logs_webhook_id (webhook_id),
    INDEX idx_webhook_logs_created_at (created_at DESC)
);

-- Enable Row Level Security
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own webhooks" ON webhooks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own webhook logs" ON webhook_logs
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM webhooks WHERE id = webhook_logs.webhook_id)
    );
```

## Database Functions & Triggers

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_patterns_updated_at BEFORE UPDATE ON task_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate daily aggregates
CREATE OR REPLACE FUNCTION calculate_daily_aggregates(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_aggregates (
        user_id, date, total_entries, total_minutes,
        delegate_minutes, automate_minutes, eliminate_minutes, personal_minutes
    )
    SELECT 
        p_user_id,
        p_date,
        COUNT(*) as total_entries,
        COALESCE(SUM(duration_minutes), 0) as total_minutes,
        COALESCE(SUM(CASE WHEN category = 'delegate' THEN duration_minutes ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN category = 'automate' THEN duration_minutes ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN category = 'eliminate' THEN duration_minutes ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN category = 'personal' THEN duration_minutes ELSE 0 END), 0)
    FROM time_entries
    WHERE user_id = p_user_id 
        AND DATE(recorded_at) = p_date
        AND deleted_at IS NULL
    ON CONFLICT (user_id, date) DO UPDATE SET
        total_entries = EXCLUDED.total_entries,
        total_minutes = EXCLUDED.total_minutes,
        delegate_minutes = EXCLUDED.delegate_minutes,
        automate_minutes = EXCLUDED.automate_minutes,
        eliminate_minutes = EXCLUDED.eliminate_minutes,
        personal_minutes = EXCLUDED.personal_minutes,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update aggregates on entry change
CREATE OR REPLACE FUNCTION update_aggregates_on_entry_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM calculate_daily_aggregates(NEW.user_id, DATE(NEW.recorded_at));
    END IF;
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.recorded_at != NEW.recorded_at) THEN
        PERFORM calculate_daily_aggregates(OLD.user_id, DATE(OLD.recorded_at));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_aggregates_on_time_entry_change
    AFTER INSERT OR UPDATE OR DELETE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_aggregates_on_entry_change();

-- Function to identify task patterns
CREATE OR REPLACE FUNCTION identify_task_patterns(p_user_id UUID)
RETURNS TABLE(
    task_pattern VARCHAR,
    frequency INTEGER,
    total_minutes INTEGER,
    suggested_category task_category
) AS $$
BEGIN
    RETURN QUERY
    WITH task_groups AS (
        SELECT 
            LOWER(task_name) as task_pattern,
            COUNT(*) as frequency,
            SUM(duration_minutes) as total_minutes,
            MODE() WITHIN GROUP (ORDER BY category) as suggested_category
        FROM time_entries
        WHERE user_id = p_user_id
            AND recorded_at >= NOW() - INTERVAL '30 days'
            AND deleted_at IS NULL
        GROUP BY LOWER(task_name)
        HAVING COUNT(*) >= 3
    )
    SELECT * FROM task_groups
    ORDER BY frequency DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to get next notification time
CREATE OR REPLACE FUNCTION get_next_notification_time(p_user_id UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    v_preferences user_preferences%ROWTYPE;
    v_paused_until TIMESTAMP WITH TIME ZONE;
    v_next_time TIMESTAMP WITH TIME ZONE;
    v_current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Get user preferences
    SELECT * INTO v_preferences FROM user_preferences WHERE user_id = p_user_id;
    
    -- Check if notifications are paused
    SELECT paused_until INTO v_paused_until
    FROM notification_pauses
    WHERE user_id = p_user_id AND paused_until > v_current_time
    ORDER BY paused_until DESC
    LIMIT 1;
    
    IF v_paused_until IS NOT NULL THEN
        v_current_time := v_paused_until;
    END IF;
    
    -- Calculate next notification time based on interval
    v_next_time := v_current_time + (v_preferences.notification_interval || ' minutes')::INTERVAL;
    
    -- Adjust for work hours
    IF EXTRACT(hour FROM v_next_time) < EXTRACT(hour FROM v_preferences.work_start_time) THEN
        v_next_time := DATE(v_next_time) + v_preferences.work_start_time;
    ELSIF EXTRACT(hour FROM v_next_time) >= EXTRACT(hour FROM v_preferences.work_end_time) THEN
        v_next_time := DATE(v_next_time + INTERVAL '1 day') + v_preferences.work_start_time;
    END IF;
    
    -- Adjust for work days (1=Monday, 7=Sunday)
    WHILE EXTRACT(ISODOW FROM v_next_time)::INTEGER != ANY(v_preferences.work_days) LOOP
        v_next_time := v_next_time + INTERVAL '1 day';
    END LOOP;
    
    RETURN v_next_time;
END;
$$ LANGUAGE plpgsql;
```

## Performance Indexes

```sql
-- Additional performance indexes
CREATE INDEX idx_time_entries_user_date_category 
    ON time_entries(user_id, DATE(recorded_at), category);

CREATE INDEX idx_time_entries_task_name_trgm 
    ON time_entries USING gin (task_name gin_trgm_ops);

CREATE INDEX idx_notification_queue_pending 
    ON notification_queue(scheduled_for) 
    WHERE status = 'pending';

CREATE INDEX idx_daily_aggregates_recent 
    ON daily_aggregates(user_id, date DESC) 
    WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Create partial indexes for soft deletes
CREATE INDEX idx_time_entries_not_deleted 
    ON time_entries(user_id, recorded_at DESC) 
    WHERE deleted_at IS NULL;
```

## Database Maintenance Scripts

```sql
-- Vacuum and analyze script (run weekly)
VACUUM ANALYZE time_entries;
VACUUM ANALYZE daily_aggregates;
VACUUM ANALYZE notification_queue;

-- Archive old notifications (run monthly)
DELETE FROM notification_queue 
WHERE status IN ('sent', 'delivered', 'failed') 
    AND created_at < NOW() - INTERVAL '90 days';

-- Clean up expired tokens
DELETE FROM auth_tokens WHERE expires_at < NOW();
DELETE FROM magic_links WHERE expires_at < NOW() AND used_at IS NULL;

-- Rebuild daily aggregates (if needed)
CREATE OR REPLACE FUNCTION rebuild_all_aggregates()
RETURNS VOID AS $$
DECLARE
    v_user RECORD;
    v_date DATE;
BEGIN
    FOR v_user IN SELECT DISTINCT user_id FROM time_entries LOOP
        FOR v_date IN 
            SELECT DISTINCT DATE(recorded_at) as date 
            FROM time_entries 
            WHERE user_id = v_user.user_id 
        LOOP
            PERFORM calculate_daily_aggregates(v_user.user_id, v_date);
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Backup Strategy

```sql
-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backups;

-- Function to backup user data
CREATE OR REPLACE FUNCTION backup_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Create backup tables with timestamp
    EXECUTE format('CREATE TABLE backups.time_entries_%s AS 
        SELECT * FROM time_entries WHERE user_id = %L',
        to_char(NOW(), 'YYYYMMDD_HH24MISS'), p_user_id);
    
    EXECUTE format('CREATE TABLE backups.task_patterns_%s AS 
        SELECT * FROM task_patterns WHERE user_id = %L',
        to_char(NOW(), 'YYYYMMDD_HH24MISS'), p_user_id);
END;
$$ LANGUAGE plpgsql;
```

## Sample Data for Testing

```sql
-- Insert test user
INSERT INTO users (email, full_name, company, timezone)
VALUES ('test@example.com', 'Test User', 'Test Company', 'America/New_York');

-- Insert user preferences
INSERT INTO user_preferences (user_id, notification_interval, work_start_time, work_end_time)
SELECT id, 30, '09:00:00', '17:00:00' FROM users WHERE email = 'test@example.com';

-- Insert sample time entries
INSERT INTO time_entries (user_id, task_name, description, category, duration_minutes, input_method)
SELECT 
    u.id,
    'Email Campaign Review',
    'Reviewing Q2 email marketing campaigns',
    'delegate',
    30,
    'voice'
FROM users u WHERE email = 'test@example.com';

-- Insert more varied entries
WITH test_user AS (SELECT id FROM users WHERE email = 'test@example.com')
INSERT INTO time_entries (user_id, task_name, category, duration_minutes, recorded_at)
SELECT 
    tu.id,
    task_name,
    category::task_category,
    duration,
    NOW() - (interval '1 day' * days_ago)
FROM test_user tu,
    (VALUES 
        ('Financial Report Analysis', 'personal', 60, 0),
        ('Data Entry - Client List', 'automate', 45, 0),
        ('Status Meeting', 'eliminate', 30, 1),
        ('Email Responses', 'delegate', 90, 1),
        ('Strategic Planning', 'personal', 120, 2)
    ) AS sample_data(task_name, category, duration, days_ago);
```