-- Add session_title column to self_dialogue_messages
ALTER TABLE public.self_dialogue_messages 
ADD COLUMN IF NOT EXISTS session_title TEXT;
