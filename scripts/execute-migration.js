const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const sql = `-- Create a table for storing spiritual balance values
CREATE TABLE IF NOT EXISTS public.spiritual_values (
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
ALTER TABLE public.spiritual_values ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to allow re-running the script
DROP POLICY IF EXISTS "Users can view their own values" ON public.spiritual_values;
DROP POLICY IF EXISTS "Users can insert their own values" ON public.spiritual_values;
DROP POLICY IF EXISTS "Users can update their own values" ON public.spiritual_values;
DROP POLICY IF EXISTS "Users can delete their own values" ON public.spiritual_values;

-- Create policies for user access
CREATE POLICY "Users can view their own values" 
ON public.spiritual_values 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own values" 
ON public.spiritual_values 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own values" 
ON public.spiritual_values 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own values" 
ON public.spiritual_values 
FOR DELETE 
USING (auth.uid() = user_id);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_spiritual_values_timestamp ON public.spiritual_values;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.update_spiritual_values_updated_at();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_spiritual_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_spiritual_values_timestamp
BEFORE UPDATE ON public.spiritual_values
FOR EACH ROW
EXECUTE FUNCTION public.update_spiritual_values_updated_at();`;

async function runMigration() {
  try {
    console.log('Executing migration...');
    console.log('[v0] Sending SQL to Supabase endpoint');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    const data = await response.text();
    console.log('[v0] Response status:', response.status);
    
    if (!response.ok) {
      console.error('Error response:', data);
      process.exit(1);
    }
    
    console.log('✓ Migration completed successfully!');
    console.log('✓ spiritual_values table created');
    console.log('✓ Row Level Security policies applied');
    console.log('✓ Automatic timestamp trigger set up');
    
  } catch (err) {
    console.error('Error executing migration:', err.message);
    process.exit(1);
  }
}

runMigration();
