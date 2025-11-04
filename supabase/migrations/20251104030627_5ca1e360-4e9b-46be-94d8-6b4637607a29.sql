-- Add unique constraint for upsert to work properly
ALTER TABLE public.spiritual_values 
ADD CONSTRAINT spiritual_values_session_value_unique 
UNIQUE (session_id, value_id);