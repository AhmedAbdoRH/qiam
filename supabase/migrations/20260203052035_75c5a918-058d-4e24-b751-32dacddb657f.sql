-- Create table for anima capabilities
CREATE TABLE public.anima_capabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_mode TEXT NOT NULL DEFAULT 'anima_motherhood',
  capability_text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anima_capabilities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own capabilities"
ON public.anima_capabilities
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own capabilities"
ON public.anima_capabilities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own capabilities"
ON public.anima_capabilities
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own capabilities"
ON public.anima_capabilities
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_anima_capabilities_user_mode ON public.anima_capabilities(user_id, chat_mode);