-- Add verses_link column to divine_names
ALTER TABLE public.divine_names 
ADD COLUMN IF NOT EXISTS verses_link TEXT;
