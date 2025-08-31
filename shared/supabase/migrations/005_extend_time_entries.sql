-- Find Five V2 - Extend TimeEntry Schema
-- Add 9 new V2 fields to the existing time_entries table for enhanced task tracking

-- Add the 9 new V2 fields to time_entries table
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id);

ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5);

ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS task_mode VARCHAR(20) CHECK (task_mode IN ('proactive', 'reactive'));

ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS enjoyment VARCHAR(20) CHECK (enjoyment IN ('like', 'neutral', 'dislike'));

ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) CHECK (task_type IN ('personal', 'work', 'both'));

ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) CHECK (frequency IN ('daily', 'regular', 'infrequent'));

ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ;

ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS recording_delay_minutes INTEGER CHECK (recording_delay_minutes >= 0);

ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) CHECK (urgency IN ('urgent', 'not_urgent'));

ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS importance VARCHAR(20) CHECK (importance IN ('important', 'not_important'));

-- Add indexes for performance on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_time_entries_session_id ON time_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_mode ON time_entries(task_mode);
CREATE INDEX IF NOT EXISTS idx_time_entries_recorded_at ON time_entries(recorded_at);
CREATE INDEX IF NOT EXISTS idx_time_entries_urgency_importance ON time_entries(urgency, importance);

-- Add helpful comments
COMMENT ON COLUMN time_entries.session_id IS 'Links time entry to a specific tracking session';
COMMENT ON COLUMN time_entries.energy_level IS 'Energy level when performing task (1-5 scale)';
COMMENT ON COLUMN time_entries.task_mode IS 'Whether task was proactive or reactive';
COMMENT ON COLUMN time_entries.enjoyment IS 'User enjoyment level for the task';
COMMENT ON COLUMN time_entries.task_type IS 'Classification of task scope';
COMMENT ON COLUMN time_entries.frequency IS 'How often this type of task occurs';
COMMENT ON COLUMN time_entries.recorded_at IS 'When the time entry was actually recorded';
COMMENT ON COLUMN time_entries.recording_delay_minutes IS 'Minutes between task completion and recording';
COMMENT ON COLUMN time_entries.urgency IS 'Eisenhower Matrix urgency classification';
COMMENT ON COLUMN time_entries.importance IS 'Eisenhower Matrix importance classification';