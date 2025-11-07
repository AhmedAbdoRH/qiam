-- Create divine_names table for storing progress and notes
CREATE TABLE public.divine_names (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  divine_name TEXT NOT NULL,
  progress INTEGER DEFAULT 50 CHECK (progress >= 0 AND progress <= 100),
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, divine_name)
);

-- Enable RLS
ALTER TABLE public.divine_names ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Trigger for updated_at
CREATE TRIGGER update_divine_names_updated_at
BEFORE UPDATE ON public.divine_names
FOR EACH ROW
EXECUTE FUNCTION public.update_spiritual_values_updated_at();