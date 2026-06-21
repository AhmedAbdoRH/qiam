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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationship_cards TO authenticated;
GRANT ALL ON public.relationship_cards TO service_role;

ALTER TABLE public.relationship_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own relationship cards"
  ON public.relationship_cards FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own relationship cards"
  ON public.relationship_cards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationship cards"
  ON public.relationship_cards FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationship cards"
  ON public.relationship_cards FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_relationship_cards_user ON public.relationship_cards(user_id);