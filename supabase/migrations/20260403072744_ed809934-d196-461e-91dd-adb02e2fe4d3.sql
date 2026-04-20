
ALTER TABLE public.anima_tasks ADD COLUMN tags jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.anima_calendar ADD COLUMN tags jsonb DEFAULT '[]'::jsonb;
