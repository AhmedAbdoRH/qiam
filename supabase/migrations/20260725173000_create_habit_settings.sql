-- Habit custom labels (per user)
CREATE TABLE IF NOT EXISTS public.habit_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.habit_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own habit settings"
  ON public.habit_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit settings"
  ON public.habit_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit settings"
  ON public.habit_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit settings"
  ON public.habit_settings FOR DELETE
  USING (auth.uid() = user_id);
