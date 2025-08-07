-- Find Five Database Schema
-- Run these commands in your Supabase SQL Editor

-- Create users table (if not using Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) CHECK (category IN ('delegate', 'automate', 'eliminate', 'personal')),
    confidence_score DECIMAL(3,2),
    duration_minutes INTEGER DEFAULT 15,
    voice_transcript TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own entries
CREATE POLICY "Users can manage own entries" 
    ON time_entries 
    FOR ALL 
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_created_at ON time_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_category ON time_entries(category);

-- Insert a demo user first (optional for development)
INSERT INTO users (id, email) VALUES 
    ('00000000-0000-0000-0000-000000000000', 'demo@findfive.app') 
ON CONFLICT (id) DO NOTHING;

-- Insert some sample data for development (optional)
INSERT INTO time_entries (user_id, task_name, description, category, confidence_score, duration_minutes, voice_transcript) VALUES
    ('00000000-0000-0000-0000-000000000000', 'Review quarterly reports', 'Going through Q3 financial reports and preparing summary', 'delegate', 0.85, 45, 'I need to review the quarterly reports for Q3'),
    ('00000000-0000-0000-0000-000000000000', 'Update customer database', 'Manually updating customer contact information from spreadsheet', 'automate', 0.92, 30, 'Updating customer database with new contact info'),
    ('00000000-0000-0000-0000-000000000000', 'Social media posting', 'Creating and scheduling social media posts for next week', 'delegate', 0.78, 25, 'Working on social media posts for the week'),
    ('00000000-0000-0000-0000-000000000000', 'Coffee break', 'Taking a break and having coffee with team', 'personal', 0.95, 15, 'Having coffee and chatting with the team')
ON CONFLICT DO NOTHING;