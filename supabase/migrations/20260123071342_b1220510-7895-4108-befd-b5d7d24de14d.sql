-- Add is_archived column to self_dialogue_messages table
ALTER TABLE public.self_dialogue_messages 
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;