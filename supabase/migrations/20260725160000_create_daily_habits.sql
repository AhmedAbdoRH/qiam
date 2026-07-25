-- Daily Habits Tracker
CREATE TABLE IF NOT EXISTS public.daily_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_date DATE NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, habit_date)
);

ALTER TABLE public.daily_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily habits"
  ON public.daily_habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily habits"
  ON public.daily_habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily habits"
  ON public.daily_habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily habits"
  ON public.daily_habits FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_habits_user_date
  ON public.daily_habits (user_id, habit_date DESC);
