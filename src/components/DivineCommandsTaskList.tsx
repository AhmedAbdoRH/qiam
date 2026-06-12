import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ListTodo, Plus, CheckCircle2, Trash2, Minus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export const DivineCommandsTaskList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [sortedItems, setSortedItems] = useState<any[]>([]);
  const [isReordering, setIsReordering] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ['divineCommandsTasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('divine_commands_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map((c: any) => ({ id: c.id, title: c.title, progress: Number(c.progress) }));
    },
    enabled: !!user
  });

  const sorted = useMemo(() => [...items].sort((a, b) => a.progress - b.progress), [items]);

  useEffect(() => {
    if (isReordering) {
      const t = setTimeout(() => { setSortedItems(sorted); setIsReordering(false); }, 1500);
      return () => clearTimeout(t);
    } else {
      setSortedItems(sorted);
    }
  }, [sorted, isReordering]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['divineCommandsTasks', user?.id] });

  const handleAdd = async () => {
    if (!newTitle.trim() || !user) return;
    const { error } = await (supabase as any).from('divine_commands_tasks').insert({ user_id: user.id, title: newTitle.trim(), progress: 0 });
    if (error) { toast.error('خطأ في إضافة المهمة'); return; }
    invalidate();
    setNewTitle("");
    setIsAdding(false);
    toast.success('تمت إضافة المهمة');
  };

  const handleProgress = async (id: string, progress: number) => {
    if (!user) return;
    queryClient.setQueryData(['divineCommandsTasks', user.id], (old: any) => {
      if (!old) return old;
      return old.map((item: any) => item.id === id ? { ...item, progress } : item);
    });
    setIsReordering(true);
    await (supabase as any).from('divine_commands_tasks').update({ progress }).eq('id', id).eq('user_id', user.id);
    invalidate();
  };

  const handleUpdateTitle = async (id: string, t: string) => {
    if (!user || !t.trim()) return;
    queryClient.setQueryData(['divineCommandsTasks', user.id], (old: any) => {
      if (!old) return old;
      return old.map((item: any) => item.id === id ? { ...item, title: t.trim() } : item);
    });
    await (supabase as any).from('divine_commands_tasks').update({ title: t.trim() }).eq('id', id).eq('user_id', user.id);
    invalidate();
    setEditingId(null);
    setEditingTitle("");
    toast.success('تم تحديث العنوان');
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await (supabase as any).from('divine_commands_tasks').delete().eq('id', id).eq('user_id', user.id);
    invalidate();
    toast.success('تم حذف المهمة');
  };

  return (
    <div className="mb-6 w-full" dir="rtl">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-amber-300" />
          <h3 className="text-sm font-medium text-amber-200/80">تنفيذ الأوامر والنواهي الإلهية</h3>
        </div>
        <button onClick={() => setIsAdding(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-amber-200 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="mb-3 flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            placeholder="أمر أو نهي جديد..."
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-amber-300/40"
          />
          <button type="submit" className="px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-300/30 text-amber-100 text-sm">إضافة</button>
          <button type="button" onClick={() => { setIsAdding(false); setNewTitle(""); }} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm">إلغاء</button>
        </form>
      )}

      <div className="space-y-4">
        {sortedItems.map((item: any, index: number) => (
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
                <CheckCircle2 className={`w-4 h-4 ${item.progress >= 9.5 ? "text-amber-300" : "text-white/20"}`} />
                {editingId === item.id ? (
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleUpdateTitle(item.id, editingTitle)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateTitle(item.id, editingTitle);
                      else if (e.key === 'Escape') { setEditingId(null); setEditingTitle(""); }
                    }}
                    autoFocus
                    className="flex-1 px-2 py-1 rounded bg-white/10 border border-amber-300/40 text-sm text-white/90 focus:outline-none focus:border-amber-300/60"
                  />
                ) : (
                  <span
                    onClick={() => { setEditingId(item.id); setEditingTitle(item.title); }}
                    className="text-sm font-medium text-white/90 cursor-pointer hover:text-white/70 transition-colors"
                  >
                    {item.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleProgress(item.id, Math.min(10, item.progress + 1))}
                  disabled={item.progress >= 10}
                  className="p-1.5 rounded-lg bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-white/40 hover:text-white/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold text-amber-200 bg-amber-500/10 px-2 py-0.5 rounded-full min-w-[2rem] text-center">{item.progress.toFixed(0)}</span>
                <button
                  onClick={() => handleProgress(item.id, Math.max(0, item.progress - 1))}
                  disabled={item.progress <= 0}
                  className="p-1.5 rounded-lg bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-white/40 hover:text-white/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-white/20 hover:text-red-400 active:text-red-500 transition-colors active:scale-95">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="px-1">
              <Slider
                value={[item.progress]}
                onValueChange={(val) => handleProgress(item.id, val[0])}
                max={10} min={0} step={1}
                className="w-full cursor-pointer"
                rangeClassName="bg-gradient-to-r from-amber-500 to-yellow-400"
              />
            </div>
          </div>
        ))}
        {items.length === 0 && !isAdding && (
          <p className="text-center py-4 text-xs text-white/20 italic">لا توجد أوامر أو نواهي بعد</p>
        )}
      </div>
    </div>
  );
};
