-- Add feeling_tasks column to spiritual_values table
ALTER TABLE public.spiritual_values 
ADD COLUMN IF NOT EXISTS feeling_tasks jsonb DEFAULT '[]'::jsonb;