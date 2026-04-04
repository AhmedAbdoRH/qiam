
ALTER TABLE public.anima_wishes ADD COLUMN progress numeric NOT NULL DEFAULT 0;
ALTER TABLE public.anima_sexual_wishes ADD COLUMN progress numeric NOT NULL DEFAULT 0;

CREATE TABLE public.anima_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.anima_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own anima notes" ON public.anima_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own anima notes" ON public.anima_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own anima notes" ON public.anima_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own anima notes" ON public.anima_notes FOR DELETE USING (auth.uid() = user_id);
