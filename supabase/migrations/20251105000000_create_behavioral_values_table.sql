-- Create a table for storing behavioral values
CREATE TABLE public.behavioral_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  value_id TEXT NOT NULL,
  value_name TEXT NOT NULL,
  selected_feelings JSONB DEFAULT '[]'::jsonb,
  feeling_notes JSONB DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  balance_percentage INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, value_id)
);

-- Enable Row Level Security
ALTER TABLE public.behavioral_values ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own behavioral values" 
ON public.behavioral_values 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavioral values" 
ON public.behavioral_values 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own behavioral values" 
ON public.behavioral_values 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own behavioral values" 
ON public.behavioral_values 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_behavioral_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_behavioral_values_timestamp
BEFORE UPDATE ON public.behavioral_values
FOR EACH ROW
EXECUTE FUNCTION public.update_behavioral_values_updated_at();