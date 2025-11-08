-- Add missing columns to spiritual_values table
ALTER TABLE public.spiritual_values 
ADD COLUMN IF NOT EXISTS positive_feelings jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Add missing columns to behavioral_values table
ALTER TABLE public.behavioral_values 
ADD COLUMN IF NOT EXISTS positive_feelings jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;