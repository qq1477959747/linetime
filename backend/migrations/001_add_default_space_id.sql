-- Migration: Add default_space_id to users table
-- This allows users to set a default space for automatic redirect after login

-- Add default_space_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS default_space_id UUID REFERENCES spaces(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_default_space ON users(default_space_id);
