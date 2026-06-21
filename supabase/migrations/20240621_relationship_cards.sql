-- Create relationship_cards table
CREATE TABLE IF NOT EXISTS public.relationship_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_phone TEXT,
  contact_messenger TEXT,
  level TEXT NOT NULL DEFAULT 'B' CHECK (level IN ('A+', 'A', 'B', 'C')),
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.relationship_cards ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own cards
CREATE POLICY "Users can view their own relationship cards"
  ON public.relationship_cards FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: users can insert their own cards
CREATE POLICY "Users can insert their own relationship cards"
  ON public.relationship_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own cards
CREATE POLICY "Users can update their own relationship cards"
  ON public.relationship_cards FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: users can delete their own cards
CREATE POLICY "Users can delete their own relationship cards"
  ON public.relationship_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.handle_relationship_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_relationship_cards_updated
  BEFORE UPDATE ON public.relationship_cards
  FOR EACH ROW EXECUTE FUNCTION public.handle_relationship_cards_updated_at();
