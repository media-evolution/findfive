-- Find Five MVP Database Schema
-- Run these commands in your Supabase SQL Editor

-- Option 1: Simple approach without foreign key constraint (for MVP)
-- Create time_entries table without user FK constraint
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Use TEXT instead of UUID for MVP simplicity
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) CHECK (category IN ('delegate', 'automate', 'eliminate', 'personal')),
    confidence_score DECIMAL(3,2),
    duration_minutes INTEGER DEFAULT 15,
    voice_transcript TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_created_at ON time_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_category ON time_entries(category);

-- Insert some sample data for development
INSERT INTO time_entries (user_id, task_name, description, category, confidence_score, duration_minutes, voice_transcript) VALUES
    ('demo-user', 'Review quarterly reports', 'Going through Q3 financial reports and preparing summary', 'delegate', 0.85, 45, 'I need to review the quarterly reports for Q3'),
    ('demo-user', 'Update customer database', 'Manually updating customer contact information from spreadsheet', 'automate', 0.92, 30, 'Updating customer database with new contact info'),
    ('demo-user', 'Social media posting', 'Creating and scheduling social media posts for next week', 'delegate', 0.78, 25, 'Working on social media posts for the week'),
    ('demo-user', 'Coffee break', 'Taking a break and having coffee with team', 'personal', 0.95, 15, 'Having coffee and chatting with the team'),
    ('demo-user', 'Email management', 'Going through and responding to emails', 'delegate', 0.70, 35, 'Processing emails from this morning'),
    ('demo-user', 'Data backup', 'Running daily data backup process', 'automate', 0.95, 20, 'Manual data backup again')
ON CONFLICT (id) DO NOTHING;

-- For production, you can later add proper user management with:
-- CREATE TABLE users (...) and ALTER TABLE time_entries ADD FOREIGN KEY...