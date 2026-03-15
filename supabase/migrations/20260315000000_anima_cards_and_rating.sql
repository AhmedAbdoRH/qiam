-- Create table for anima cards (customizable info cards)
CREATE TABLE public.anima_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for anima relationship quality rating
CREATE TABLE public.anima_quality_rating (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.anima_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anima_quality_rating ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anima_cards
CREATE POLICY "Users can view their own anima cards"
ON public.anima_cards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own anima cards"
ON public.anima_cards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anima cards"
ON public.anima_cards
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anima cards"
ON public.anima_cards
FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for anima_quality_rating
CREATE POLICY "Users can view their own anima rating"
ON public.anima_quality_rating
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own anima rating"
ON public.anima_quality_rating
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anima rating"
ON public.anima_quality_rating
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_anima_cards_user ON public.anima_cards(user_id);
CREATE INDEX idx_anima_quality_rating_user ON public.anima_quality_rating(user_id);
