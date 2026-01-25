-- Ensure divine_names table exists with correct schema
CREATE TABLE IF NOT EXISTS public.divine_names (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  divine_name TEXT NOT NULL,
  notes TEXT,
  progress INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, divine_name)
);

-- Enable RLS
ALTER TABLE public.divine_names ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors
DROP POLICY IF EXISTS "Users can view their own divine names" ON public.divine_names;
DROP POLICY IF EXISTS "Users can insert their own divine names" ON public.divine_names;
DROP POLICY IF EXISTS "Users can update their own divine names" ON public.divine_names;
DROP POLICY IF EXISTS "Users can delete their own divine names" ON public.divine_names;

-- Create policies
CREATE POLICY "Users can view their own divine names" 
ON public.divine_names 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own divine names" 
ON public.divine_names 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own divine names" 
ON public.divine_names 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own divine names" 
ON public.divine_names 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index
CREATE INDEX IF NOT EXISTS idx_divine_names_user_id ON public.divine_names(user_id);
CREATE INDEX IF NOT EXISTS idx_divine_names_name ON public.divine_names(divine_name);
