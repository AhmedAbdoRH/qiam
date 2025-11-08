-- Add positive_feelings column to spiritual_values table
ALTER TABLE public.spiritual_values 
ADD COLUMN IF NOT EXISTS positive_feelings JSONB DEFAULT '[]'::jsonb;

-- Add is_pinned column to spiritual_values table
ALTER TABLE public.spiritual_values 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Add positive_feelings column to behavioral_values table
ALTER TABLE public.behavioral_values 
ADD COLUMN IF NOT EXISTS positive_feelings JSONB DEFAULT '[]'::jsonb;

-- Add is_pinned column to behavioral_values table
ALTER TABLE public.behavioral_values 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

