-- Delete old data that was using session_id
DELETE FROM public.spiritual_values WHERE user_id IS NULL;

-- Update RLS policies to use user_id instead of session_id
DROP POLICY IF EXISTS "Anyone can view all values" ON public.spiritual_values;
DROP POLICY IF EXISTS "Anyone can insert values" ON public.spiritual_values;
DROP POLICY IF EXISTS "Anyone can update values" ON public.spiritual_values;
DROP POLICY IF EXISTS "Anyone can delete values" ON public.spiritual_values;

-- Make user_id required and not nullable
ALTER TABLE public.spiritual_values
ALTER COLUMN user_id SET NOT NULL;

-- Create new RLS policies for authenticated users
CREATE POLICY "Users can view their own values"
ON public.spiritual_values
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own values"
ON public.spiritual_values
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own values"
ON public.spiritual_values
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own values"
ON public.spiritual_values
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);