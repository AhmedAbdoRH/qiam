
CREATE TABLE public.ahmed_page_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ahmed_page_cards TO authenticated;
GRANT ALL ON public.ahmed_page_cards TO service_role;
ALTER TABLE public.ahmed_page_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ahmed_page_cards select" ON public.ahmed_page_cards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own ahmed_page_cards insert" ON public.ahmed_page_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ahmed_page_cards update" ON public.ahmed_page_cards FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own ahmed_page_cards delete" ON public.ahmed_page_cards FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.ahmed_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ahmed_messages TO authenticated;
GRANT ALL ON public.ahmed_messages TO service_role;
ALTER TABLE public.ahmed_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ahmed_messages select" ON public.ahmed_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own ahmed_messages insert" ON public.ahmed_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ahmed_messages update" ON public.ahmed_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own ahmed_messages delete" ON public.ahmed_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
