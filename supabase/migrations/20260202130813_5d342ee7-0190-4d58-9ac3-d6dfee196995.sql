-- Add chat_mode column to self_dialogue_messages table
ALTER TABLE public.self_dialogue_messages 
ADD COLUMN chat_mode text NOT NULL DEFAULT 'anima_motherhood';

-- Add index for faster queries by mode
CREATE INDEX idx_self_dialogue_messages_chat_mode 
ON public.self_dialogue_messages(user_id, chat_mode, is_archived);