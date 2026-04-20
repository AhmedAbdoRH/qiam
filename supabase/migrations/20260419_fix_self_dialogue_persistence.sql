-- Fix self_dialogue_messages table for proper persistence
-- This migration addresses:
-- 1. Correct chat_mode default values
-- 2. Ensure all RLS policies are properly set
-- 3. Add missing UPDATE policy with proper constraints

-- First, update the default value of chat_mode from 'anima_motherhood' to 'self'
ALTER TABLE public.self_dialogue_messages 
ALTER COLUMN chat_mode SET DEFAULT 'self';

-- Drop the old update policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can update their own messages" ON public.self_dialogue_messages;

-- Create a comprehensive UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Users can update their own messages" 
ON public.self_dialogue_messages 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure the INSERT policy is properly set
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.self_dialogue_messages;
CREATE POLICY "Users can insert their own messages" 
ON public.self_dialogue_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure the SELECT policy is properly set
DROP POLICY IF EXISTS "Users can view their own messages" ON public.self_dialogue_messages;
CREATE POLICY "Users can view their own messages" 
ON public.self_dialogue_messages 
FOR SELECT 
USING (auth.uid() = user_id);

-- Ensure the DELETE policy is properly set
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.self_dialogue_messages;
CREATE POLICY "Users can delete their own messages" 
ON public.self_dialogue_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add a constraint to ensure chat_mode only accepts valid values
ALTER TABLE public.self_dialogue_messages
ADD CONSTRAINT valid_chat_mode CHECK (chat_mode IN ('self', 'anima', 'nurturing'));

-- Create a composite index for better query performance
CREATE INDEX IF NOT EXISTS idx_self_dialogue_messages_user_chat_mode 
ON public.self_dialogue_messages(user_id, chat_mode, is_archived, created_at);

-- Add comment to document the table
COMMENT ON TABLE public.self_dialogue_messages IS 'Stores self-dialogue chat messages with proper RLS policies for user isolation';
COMMENT ON COLUMN public.self_dialogue_messages.chat_mode IS 'Chat mode: self (user), anima (AI persona), or nurturing (nurturing persona)';
