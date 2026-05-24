import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FeelingTaskList, FeelingTask } from "@/components/FeelingTaskList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

const Tasks = () => {
  const [feelingTasks, setFeelingTasks] = useState<FeelingTask[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const loadFeelingTasks = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('=== Loading feeling tasks ===');
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from("spiritual_values")
        .select("feeling_tasks")
        .eq("user_id", user.id)
        .eq("value_id", "0")
        .single();

      const duration = Date.now() - startTime;
      console.log(`Feeling tasks loaded in ${duration}ms`);

      if (error) {
        console.error("Error loading feeling tasks:", error);
        if (error.code === 'PGRST116') {
          // No rows found, set empty tasks
          setFeelingTasks([]);
        } else {
          throw error;
        }
      } else if (data && data.feeling_tasks) {
        const tasks = data.feeling_tasks as unknown;
        if (Array.isArray(tasks)) {
          setFeelingTasks(tasks as FeelingTask[]);
        }
      } else {
        setFeelingTasks([]);
      }
    } catch (error) {
      console.error("Error loading feeling tasks:", error);
      toast.error('خطأ في تحميل المهام');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFeelingTasks();
    }
  }, [user, loadFeelingTasks]);

  const handleTasksChange = useCallback(async (newTasks: FeelingTask[]) => {
    setFeelingTasks(newTasks);
    
    if (!user) return;
    
    try {
      console.log('=== Saving feeling tasks ===');
      const startTime = Date.now();
      
      await supabase
        .from("spiritual_values")
        .upsert([{
          user_id: user.id,
          value_id: "0",
          value_name: "المهام",
          feeling_tasks: JSON.parse(JSON.stringify(newTasks)),
        }], { onConflict: 'user_id,value_id' });

      const duration = Date.now() - startTime;
      console.log(`Feeling tasks saved in ${duration}ms`);
      toast.success('تم حفظ المهام');
    } catch (error) {
      console.error("Error saving feeling tasks:", error);
      toast.error('خطأ في حفظ المهام');
    }
  }, [user]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">المهام</h1>
          <Button
            onClick={() => navigate('/feelings')}
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
        
        <FeelingTaskList 
          tasks={feelingTasks} 
          onTasksChange={handleTasksChange} 
        />
      </div>
    </div>
  );
};

export default Tasks;
