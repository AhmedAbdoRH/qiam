-- Add archive_session_id column to self_dialogue_messages
ALTER TABLE public.self_dialogue_messages 
ADD COLUMN archive_session_id UUID;

-- Create index for faster session-based lookups
CREATE INDEX idx_self_dialogue_messages_archive_session_id ON public.self_dialogue_messages(archive_session_id);
