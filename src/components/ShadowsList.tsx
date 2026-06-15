import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Shadow {
  id: string;
  content: string;
}

export const ShadowsList = () => {
  const { user } = useAuth();
  const [shadows, setShadows] = useState<Shadow[]>([]);
  const [newShadow, setNewShadow] = useState("");

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("sovereign_shadows")
      .select("id, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) return;
    setShadows((data || []) as Shadow[]);
  };

  useEffect(() => {
    load();
  }, [user]);

  const addShadow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newShadow.trim()) return;
    const text = newShadow.trim();
    setNewShadow("");
    const { data, error } = await supabase
      .from("sovereign_shadows")
      .insert({ user_id: user.id, content: text })
      .select("id, content")
      .single();
    if (error) {
      toast.error("تعذر حفظ الملاحظة");
      return;
    }
    setShadows((prev) => [...prev, data as Shadow]);
    toast.success("تمت إضافة الظل");
  };

  const deleteShadow = async (id: string) => {
    setShadows((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("sovereign_shadows").delete().eq("id", id);
  };

  return (
    <section className="mb-6" dir="rtl">
      <h2 className="text-lg font-semibold text-foreground mb-3">الظلال</h2>
      <div className="rounded-xl bg-secondary/40 border border-border p-4 space-y-3">
        <form onSubmit={addShadow} className="flex gap-2">
          <Input
            value={newShadow}
            onChange={(e) => setNewShadow(e.target.value)}
            placeholder="أضف ملاحظة ظل..."
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="sm">
            إضافة
          </Button>
        </form>
        <ul className="space-y-2">
          {shadows.map((s) => (
            <li
              key={s.id}
              className="group flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-secondary/50 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <span className="flex-1 text-base text-foreground">{s.content}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteShadow(s.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </li>
          ))}
          {shadows.length === 0 && (
            <li className="text-sm text-muted-foreground text-center py-2">لا توجد ظلال بعد</li>
          )}
        </ul>
      </div>
    </section>
  );
};
