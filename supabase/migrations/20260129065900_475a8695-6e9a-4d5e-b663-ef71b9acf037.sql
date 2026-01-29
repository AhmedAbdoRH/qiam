-- Add missing columns to self_dialogue_messages table
ALTER TABLE public.self_dialogue_messages 
ADD COLUMN IF NOT EXISTS archive_session_id uuid NULL,
ADD COLUMN IF NOT EXISTS session_title text NULL;

-- Create index for faster archive queries
CREATE INDEX IF NOT EXISTS idx_self_dialogue_archive_session 
ON public.self_dialogue_messages(archive_session_id) 
WHERE archive_session_id IS NOT NULL;

-- Create divine_name_monologues table for storing monologues related to divine names
CREATE TABLE IF NOT EXISTS public.divine_name_monologues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  divine_name text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on divine_name_monologues
ALTER TABLE public.divine_name_monologues ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for divine_name_monologues
CREATE POLICY "Users can view their own monologues"
ON public.divine_name_monologues FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monologues"
ON public.divine_name_monologues FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monologues"
ON public.divine_name_monologues FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monologues"
ON public.divine_name_monologues FOR DELETE
USING (auth.uid() = user_id);