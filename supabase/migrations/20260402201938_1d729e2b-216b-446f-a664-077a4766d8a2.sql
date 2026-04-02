
-- Anima Page Cards
CREATE TABLE public.anima_page_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.anima_page_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own anima cards" ON public.anima_page_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own anima cards" ON public.anima_page_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own anima cards" ON public.anima_page_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own anima cards" ON public.anima_page_cards FOR DELETE USING (auth.uid() = user_id);

-- Anima Quality Rating
CREATE TABLE public.anima_quality_rating (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  rating NUMERIC(4,1) NOT NULL DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.anima_quality_rating ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quality rating" ON public.anima_quality_rating FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quality rating" ON public.anima_quality_rating FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quality rating" ON public.anima_quality_rating FOR UPDATE USING (auth.uid() = user_id);

-- Anima Messages
CREATE TABLE public.anima_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.anima_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own anima messages" ON public.anima_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own anima messages" ON public.anima_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own anima messages" ON public.anima_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own anima messages" ON public.anima_messages FOR DELETE USING (auth.uid() = user_id);

-- Anima Tasks
CREATE TABLE public.anima_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  progress NUMERIC(4,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.anima_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own anima tasks" ON public.anima_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own anima tasks" ON public.anima_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own anima tasks" ON public.anima_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own anima tasks" ON public.anima_tasks FOR DELETE USING (auth.uid() = user_id);

-- Anima Calendar
CREATE TABLE public.anima_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  progress NUMERIC(4,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.anima_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own anima calendar" ON public.anima_calendar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own anima calendar" ON public.anima_calendar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own anima calendar" ON public.anima_calendar FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own anima calendar" ON public.anima_calendar FOR DELETE USING (auth.uid() = user_id);

-- Anima Wishes
CREATE TABLE public.anima_wishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.anima_wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own anima wishes" ON public.anima_wishes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own anima wishes" ON public.anima_wishes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own anima wishes" ON public.anima_wishes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own anima wishes" ON public.anima_wishes FOR DELETE USING (auth.uid() = user_id);

-- Anima Sexual Wishes
CREATE TABLE public.anima_sexual_wishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.anima_sexual_wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sexual wishes" ON public.anima_sexual_wishes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sexual wishes" ON public.anima_sexual_wishes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sexual wishes" ON public.anima_sexual_wishes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sexual wishes" ON public.anima_sexual_wishes FOR DELETE USING (auth.uid() = user_id);
