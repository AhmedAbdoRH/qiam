-- Add behaviors column to behavioral_values table to store behaviors for each value independently
ALTER TABLE behavioral_values 
ADD COLUMN IF NOT EXISTS behaviors jsonb DEFAULT '[]'::jsonb;