-- Create divine_name_monologues table
CREATE TABLE public.divine_name_monologues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  divine_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.divine_name_monologues ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own monologues" 
ON public.divine_name_monologues 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monologues" 
ON public.divine_name_monologues 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monologues" 
ON public.divine_name_monologues 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index
CREATE INDEX idx_divine_name_monologues_user_id ON public.divine_name_monologues(user_id);
CREATE INDEX idx_divine_name_monologues_divine_name ON public.divine_name_monologues(divine_name);
