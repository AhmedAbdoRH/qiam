CREATE TABLE public.sovereign_shadows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sovereign_shadows TO authenticated;
GRANT ALL ON public.sovereign_shadows TO service_role;
ALTER TABLE public.sovereign_shadows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own shadows" ON public.sovereign_shadows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shadows" ON public.sovereign_shadows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shadows" ON public.sovereign_shadows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shadows" ON public.sovereign_shadows FOR DELETE USING (auth.uid() = user_id);