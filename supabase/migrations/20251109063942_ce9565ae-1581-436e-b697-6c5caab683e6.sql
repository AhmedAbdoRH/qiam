-- Add positive_feeling_dates column to spiritual_values table
ALTER TABLE public.spiritual_values 
ADD COLUMN IF NOT EXISTS positive_feeling_dates jsonb DEFAULT '{}'::jsonb;

-- Add positive_feeling_dates column to behavioral_values table
ALTER TABLE public.behavioral_values 
ADD COLUMN IF NOT EXISTS positive_feeling_dates jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.spiritual_values.positive_feeling_dates IS 'Stores dates when feelings were marked as positive (green)';
COMMENT ON COLUMN public.behavioral_values.positive_feeling_dates IS 'Stores dates when feelings were marked as positive (green)';