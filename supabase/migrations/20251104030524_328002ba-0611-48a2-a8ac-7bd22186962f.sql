-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own values" ON public.spiritual_values;
DROP POLICY IF EXISTS "Users can insert their own values" ON public.spiritual_values;
DROP POLICY IF EXISTS "Users can update their own values" ON public.spiritual_values;
DROP POLICY IF EXISTS "Users can delete their own values" ON public.spiritual_values;

-- Add session_id column to replace user_id
ALTER TABLE public.spiritual_values 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Make user_id nullable since we won't use it anymore
ALTER TABLE public.spiritual_values 
ALTER COLUMN user_id DROP NOT NULL;

-- Create new RLS policies that don't require authentication
CREATE POLICY "Anyone can view all values" 
ON public.spiritual_values 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert values" 
ON public.spiritual_values 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update values" 
ON public.spiritual_values 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete values" 
ON public.spiritual_values 
FOR DELETE 
USING (true);