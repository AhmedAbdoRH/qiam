
CREATE TABLE public.divine_commands_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  progress NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.divine_commands_tasks TO authenticated;
GRANT ALL ON public.divine_commands_tasks TO service_role;

ALTER TABLE public.divine_commands_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own divine_commands_tasks" ON public.divine_commands_tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own divine_commands_tasks" ON public.divine_commands_tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own divine_commands_tasks" ON public.divine_commands_tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own divine_commands_tasks" ON public.divine_commands_tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_divine_commands_tasks_updated_at
  BEFORE UPDATE ON public.divine_commands_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_spiritual_values_updated_at();
