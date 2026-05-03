import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ListTodo, Plus, CheckCircle2, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export const CalendarTaskList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [tagTargetId, setTagTargetId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [localProgress, setLocalProgress] = useState<Record<string, number>>({});

  const { data: items = [] } = useQuery({
    queryKey: ['animaCalendar', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('anima_calendar')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map((c: any) => ({ id: c.id, title: c.title, progress: Number(c.progress), tags: c.tags || [] }));
    },
    enabled: !!user
  });

  const sorted = useMemo(() => [...items].sort((a, b) => a.progress - b.progress), [items]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['animaCalendar', user?.id] });

  const handleAdd = async () => {
    if (!newTitle.trim() || !user) return;
    const { error } = await supabase.from('anima_calendar').insert({ user_id: user.id, title: newTitle.trim(), progress: 0 });
    if (error) { toast.error('خطأ في إضافة عنصر التقويم'); return; }
    invalidate();
    setNewTitle("");
    setIsAdding(false);
    toast.success('تمت إضافة عنصر التقويم');
  };

  const handleProgress = async (id: string, progress: number) => {
    if (!user) return;
    await supabase.from('anima_calendar').update({ progress }).eq('id', id).eq('user_id', user.id);
    invalidate();
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await supabase.from('anima_calendar').delete().eq('id', id).eq('user_id', user.id);
    invalidate();
    toast.success('تم حذف عنصر التقويم');
  };

  const handleAddTag = async (id: string, tag: string) => {
    if (!tag.trim() || !user) return;
    const item = items.find((i: any) => i.id === id);
    if (!item) return;
    const updatedTags = [...((item as any).tags || []), tag.trim()];
    await supabase.from('anima_calendar').update({ tags: updatedTags } as any).eq('id', id).eq('user_id', user.id);
    invalidate();
    setNewTag("");
    setTagTargetId(null);
  };

  const handleDeleteTag = async (id: string, tagIndex: number) => {
    if (!user) return;
    const item = items.find((i: any) => i.id === id);
    if (!item) return;
    const currentTags = [...((item as any).tags || [])];
    currentTags.splice(tagIndex, 1);
    await supabase.from('anima_calendar').update({ tags: currentTags } as any).eq('id', id).eq('user_id', user.id);
    invalidate();
  };

  return (
    <div className="mb-6 w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-bold text-green-100">التذكية - تقويم</h2>
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
        {sorted.map((item: any) => (
          <div key={item.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${item.progress >= 9.5 ? "text-green-400" : "text-white/20"}`} />
                <span className="text-sm font-medium text-white/90">{item.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-lime-300 bg-green-500/10 px-2 py-0.5 rounded-full">{item.progress.toFixed(1)}</span>
                <button onClick={() => handleDelete(item.id)} className="text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <Slider
              value={[localProgress[item.id] ?? item.progress]}
              onValueChange={(val) => setLocalProgress(prev => ({ ...prev, [item.id]: val[0] }))}
              onValueCommit={(val) => { handleProgress(item.id, val[0]); setLocalProgress(prev => { const n = { ...prev }; delete n[item.id]; return n; }); }}
              max={10} min={0} step={0.1}
              className="w-full"
              rangeClassName="bg-gradient-to-r from-green-500 to-lime-400"
            />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {((item as any).tags || []).map((tag: string, idx: number) => (
                <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 cursor-pointer hover:border-red-400/30 hover:text-red-300 transition-all" onClick={() => handleDeleteTag(item.id, idx)}>
                  {tag}
                </span>
              ))}
              {tagTargetId === item.id ? (
                <form onSubmit={(e) => { e.preventDefault(); handleAddTag(item.id, newTag); }} className="flex gap-1">
                  <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="سمة..." className="text-[10px] w-16 px-1.5 py-0.5 rounded bg-white/5 border border-white/15 text-white/80 placeholder:text-white/20 focus:outline-none" autoFocus />
                  <button type="submit" className="text-[10px] text-lime-300 hover:text-lime-200">+</button>
                </form>
              ) : (
                <button onClick={() => setTagTargetId(item.id)} className="text-[10px] px-2 py-0.5 rounded-md border border-dashed border-white/10 text-white/30 hover:text-white/50 hover:border-white/20 transition-all">
                  + سمة
                </button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && !isAdding && (
          <p className="text-center py-4 text-xs text-white/20 italic">لا توجد عناصر تقويم حالياً</p>
        )}
      </div>
    </div>
  );
};
