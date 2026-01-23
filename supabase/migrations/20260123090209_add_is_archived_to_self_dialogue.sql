-- Add is_archived column to self_dialogue_messages
ALTER TABLE public.self_dialogue_messages 
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;

-- Add index for is_archived to speed up filtering
CREATE INDEX idx_self_dialogue_messages_is_archived ON public.self_dialogue_messages(is_archived);

-- Update RLS policies to include the new column (though existing ones should work fine, 
-- we ensure the user can update the is_archived status)
CREATE POLICY "Users can update their own messages" 
ON public.self_dialogue_messages 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
