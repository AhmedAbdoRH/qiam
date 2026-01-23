-- Add UPDATE policy for self_dialogue_messages table
CREATE POLICY "Users can update their own messages" 
ON public.self_dialogue_messages 
FOR UPDATE 
USING (auth.uid() = user_id);