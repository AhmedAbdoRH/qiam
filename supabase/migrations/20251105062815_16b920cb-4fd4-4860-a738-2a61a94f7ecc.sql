-- Create behavioral_values table
CREATE TABLE IF NOT EXISTS public.behavioral_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  value_id TEXT NOT NULL,
  value_name TEXT NOT NULL,
  selected_feelings JSONB DEFAULT '[]'::jsonb,
  feeling_notes JSONB DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT ''::text,
  balance_percentage INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, value_id)
);

-- Enable Row Level Security
ALTER TABLE public.behavioral_values ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own behavioral values"
ON public.behavioral_values
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavioral values"
ON public.behavioral_values
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own behavioral values"
ON public.behavioral_values
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own behavioral values"
ON public.behavioral_values
FOR DELETE
USING (auth.uid() = user_id);