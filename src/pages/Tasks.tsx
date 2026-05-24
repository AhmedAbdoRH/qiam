import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, ListTodo, Plus, CheckCircle2, Trash2, Minus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export interface FeelingTask {
  id: string;
  text: string;
  intensity: number;
}

const Tasks = () => {
  const [feelingTasks, setFeelingTasks] = useState<FeelingTask[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [sortedItems, setSortedItems] = useState<FeelingTask[]>([]);
  const [isReordering, setIsReordering] = useState(false);
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
      toast.error('خطأ في تحميل التطهير');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFeelingTasks();
    }
  }, [user, loadFeelingTasks]);

  const sorted = useMemo(() => [...feelingTasks].sort((a, b) => a.intensity - b.intensity), [feelingTasks]);

  // Delayed reordering with smooth animation
  useEffect(() => {
    if (isReordering) {
      const timer = setTimeout(() => {
        setSortedItems(sorted);
        setIsReordering(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setSortedItems(sorted);
    }
  }, [sorted, isReordering]);

  const handleTasksChange = useCallback(async (newTasks: FeelingTask[]) => {
    if (!user) return;
    
    try {
      console.log('=== Saving feeling tasks ===');
      const startTime = Date.now();
      
      await supabase
        .from("spiritual_values")
        .upsert([{
          user_id: user.id,
          value_id: "0",
          value_name: "التطهير",
          feeling_tasks: JSON.parse(JSON.stringify(newTasks)),
        }], { onConflict: 'user_id,value_id' });

      const duration = Date.now() - startTime;
      console.log(`Feeling tasks saved in ${duration}ms`);
      toast.success('تم حفظ التطهير');
    } catch (error) {
      console.error("Error saving feeling tasks:", error);
      toast.error('خطأ في حفظ التطهير');
    }
  }, [user]);

  const handleAdd = async () => {
    if (!newTitle.trim() || !user) return;
    const newTask: FeelingTask = {
      id: Date.now().toString(),
      text: newTitle.trim(),
      intensity: 5.0,
    };
    const updatedTasks = [...feelingTasks, newTask];
    setFeelingTasks(updatedTasks);
    await handleTasksChange(updatedTasks);
    setNewTitle("");
    setIsAdding(false);
    toast.success('تمت إضافة مهمة التطهير');
  };

  const handleProgress = async (id: string, intensity: number) => {
    const updatedTasks = feelingTasks.map((task) =>
      task.id === id ? { ...task, intensity } : task
    );
    setFeelingTasks(updatedTasks);
    setIsReordering(true);
    await handleTasksChange(updatedTasks);
  };

  const handleUpdateTitle = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const updatedTasks = feelingTasks.map((task) =>
      task.id === id ? { ...task, text: newTitle.trim() } : task
    );
    setFeelingTasks(updatedTasks);
    await handleTasksChange(updatedTasks);
    setEditingId(null);
    setEditingTitle("");
    toast.success('تم تحديث العنوان');
  };

  const handleDelete = async (id: string) => {
    const updatedTasks = feelingTasks.filter((task) => task.id !== id);
    setFeelingTasks(updatedTasks);
    await handleTasksChange(updatedTasks);
    toast.success('تم حذف مهمة التطهير');
  };

  const getIntensityColor = (intensity: number): string => {
    if (intensity <= 3) return "text-green-400";
    if (intensity <= 5) return "text-yellow-400";
    if (intensity <= 7) return "text-orange-400";
    return "text-red-400";
  };

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
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 w-full">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-bold text-green-100">التطهير</h2>
            </div>
            <button onClick={() => setIsAdding(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-lime-300 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {isAdding && (
            <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="mb-3 flex gap-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                placeholder="عنوان جديد..."
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-lime-300/40"
              />
              <button type="submit" className="px-3 py-2 rounded-lg bg-lime-500/20 border border-lime-300/30 text-lime-200 text-sm">إضافة</button>
              <button type="button" onClick={() => { setIsAdding(false); setNewTitle(""); }} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm">إلغاء</button>
            </form>
          )}

          <div className="space-y-4">
            {sortedItems.map((item: FeelingTask, index: number) => (
              <div 
                key={item.id} 
                className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all duration-500 ease-out hover:bg-white/8 active:bg-white/12 ${isReordering ? 'animate-pulse' : ''}`}
                style={{ 
                  transitionDelay: isReordering ? `${index * 50}ms` : '0ms',
                  transform: isReordering ? 'scale(0.98)' : 'scale(1)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <CheckCircle2 className={`w-4 h-4 ${item.intensity >= 9.5 ? "text-green-400" : "text-white/20"}`} />
                    {editingId === item.id ? (
                      <input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleUpdateTitle(item.id, editingTitle)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateTitle(item.id, editingTitle);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditingTitle("");
                          }
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1 rounded bg-white/10 border border-lime-300/40 text-sm text-white/90 focus:outline-none focus:border-lime-300/60"
                      />
                    ) : (
                      <span 
                        onClick={() => { setEditingId(item.id); setEditingTitle(item.text); }}
                        className="text-sm font-medium text-white/90 cursor-pointer hover:text-white/70 transition-colors"
                      >
                        {item.text}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleProgress(item.id, Math.max(0, item.intensity - 1))}
                      disabled={item.intensity <= 0}
                      className="p-1.5 rounded-lg bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-white/40 hover:text-white/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[2rem] text-center ${getIntensityColor(item.intensity)}`}>{item.intensity.toFixed(1)}</span>
                    <button 
                      onClick={() => handleProgress(item.id, Math.min(10, item.intensity + 1))}
                      disabled={item.intensity >= 10}
                      className="p-1.5 rounded-lg bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-white/40 hover:text-white/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-white/20 hover:text-red-400 active:text-red-500 transition-colors active:scale-95">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="px-1">
                  <Slider
                    value={[item.intensity]}
                    onValueChange={(val) => handleProgress(item.id, val[0])}
                    max={10} min={0} step={0.1}
                    className="w-full cursor-pointer"
                    rangeClassName="bg-gradient-to-r from-green-500 to-red-500"
                  />
                </div>
              </div>
            ))}
            {feelingTasks.length === 0 && !isAdding && (
              <p className="text-center py-4 text-xs text-white/20 italic">لا توجد مهام تطهير حالياً</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
