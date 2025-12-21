-- Create self_dialogue_messages table for storing self-dialogue chat messages
CREATE TABLE public.self_dialogue_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('me', 'myself')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.self_dialogue_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own messages" 
ON public.self_dialogue_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" 
ON public.self_dialogue_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.self_dialogue_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_self_dialogue_messages_user_id ON public.self_dialogue_messages(user_id);
CREATE INDEX idx_self_dialogue_messages_created_at ON public.self_dialogue_messages(created_at);