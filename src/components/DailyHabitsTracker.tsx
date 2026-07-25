import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, Target, Flame } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const HABIT_ITEMS = [
  { key: "sleep", label: "النوم السليم", icon: "🌙" },
  { key: "eating", label: "نظام الأكل الصحي", icon: "🥗" },
  { key: "exercise", label: "الرياضة / الجيم", icon: "💪" },
  { key: "chastity", label: "حفظ الفرج", icon: "🛡️" },
  { key: "intimacy", label: "التواصل الحميمي", icon: "💞" },
  { key: "work", label: "الالتزام بوقت العمل", icon: "⏱️" },
  { key: "silence", label: "الصمت وعدم الكلام الخفيف", icon: "🤫" },
  { key: "quran", label: "ورد القرآن والأذكار", icon: "📖" },
  { key: "mindfulness", label: "الحضور الذهني", icon: "🧘" },
  { key: "purification", label: "جلسة تطهير شعور كاملة", icon: "✨" },
] as const;

type HabitKey = (typeof HABIT_ITEMS)[number]["key"];
type Scores = Partial<Record<HabitKey, number>>;

const formatDateISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatArabicDate = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getScoreColor = (score: number): string => {
  if (score >= 8) return "text-emerald-400";
  if (score >= 6) return "text-lime-400";
  if (score >= 4) return "text-amber-400";
  if (score >= 2) return "text-orange-400";
  return "text-red-400";
};

const getScoreBg = (score: number): string => {
  if (score >= 8) return "bg-emerald-500/15 border-emerald-500/30";
  if (score >= 6) return "bg-lime-500/15 border-lime-500/30";
  if (score >= 4) return "bg-amber-500/15 border-amber-500/30";
  if (score >= 2) return "bg-orange-500/15 border-orange-500/30";
  return "bg-red-500/15 border-red-500/30";
};

const getBarGradient = (score: number): string => {
  if (score >= 8) return "from-emerald-600 to-emerald-400";
  if (score >= 6) return "from-lime-600 to-lime-400";
  if (score >= 4) return "from-amber-600 to-amber-400";
  if (score >= 2) return "from-orange-600 to-orange-400";
  return "from-red-600 to-red-400";
};

export const DailyHabitsTracker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => formatDateISO(new Date()));
  const todayISO = formatDateISO(new Date());
  const isToday = selectedDate === todayISO;

  const { data: record, isLoading } = useQuery({
    queryKey: ["dailyHabits", user?.id, selectedDate],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("daily_habits")
        .select("*")
        .eq("user_id", user.id)
        .eq("habit_date", selectedDate)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; scores: Scores } | null;
    },
    enabled: !!user,
  });

  const scores: Scores = record?.scores || {};

  const average = useMemo(() => {
    const values = HABIT_ITEMS.map((h) => scores[h.key] ?? 0);
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / HABIT_ITEMS.length;
  }, [scores]);

  const filledCount = useMemo(
    () => HABIT_ITEMS.filter((h) => (scores[h.key] ?? 0) > 0).length,
    [scores]
  );

  const saveScore = useCallback(
    async (key: HabitKey, value: number) => {
      if (!user) return;
      const nextScores = { ...scores, [key]: Math.round(value * 10) / 10 };

      // Optimistic update
      queryClient.setQueryData(["dailyHabits", user.id, selectedDate], (old: any) => {
        if (old) return { ...old, scores: nextScores };
        return { id: "temp", scores: nextScores };
      });

      try {
        if (record?.id && record.id !== "temp") {
          const { error } = await (supabase as any)
            .from("daily_habits")
            .update({ scores: nextScores, updated_at: new Date().toISOString() })
            .eq("id", record.id)
            .eq("user_id", user.id);
          if (error) throw error;
        } else {
          const { data, error } = await (supabase as any)
            .from("daily_habits")
            .upsert(
              {
                user_id: user.id,
                habit_date: selectedDate,
                scores: nextScores,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,habit_date" }
            )
            .select("*")
            .single();
          if (error) throw error;
          queryClient.setQueryData(["dailyHabits", user.id, selectedDate], data);
        }
      } catch {
        toast.error("تعذر حفظ التقييم");
        queryClient.invalidateQueries({ queryKey: ["dailyHabits", user.id, selectedDate] });
      }
    },
    [user, scores, selectedDate, record, queryClient]
  );

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + delta);
    const next = formatDateISO(d);
    if (next > todayISO) return;
    setSelectedDate(next);
  };

  return (
    <div className="mb-8 w-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-cyan-200/90 tracking-wide">
            تتبع العادات اليومي
          </h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${getScoreBg(average)}`}>
          <Flame className={`w-3.5 h-3.5 ${getScoreColor(average)}`} />
          <span className={getScoreColor(average)}>{average.toFixed(1)}</span>
          <span className="text-white/40 font-normal">/ 10</span>
        </div>
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-between mb-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2.5">
        <button
          onClick={() => shiftDate(1)}
          disabled={isToday}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
          aria-label="اليوم التالي"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="text-center flex-1">
          <p className="text-sm font-medium text-white/90">{formatArabicDate(selectedDate)}</p>
          {isToday && (
            <span className="text-[10px] text-cyan-300/80 bg-cyan-500/10 px-2 py-0.5 rounded-full mt-0.5 inline-block">
              اليوم
            </span>
          )}
        </div>

        <button
          onClick={() => shiftDate(-1)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-all active:scale-95"
          aria-label="اليوم السابق"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Progress summary */}
      <div className="mb-4 flex items-center gap-3 px-1">
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-l ${getBarGradient(average)} transition-all duration-500`}
            style={{ width: `${(average / 10) * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-white/40 whitespace-nowrap">
          {filledCount} / {HABIT_ITEMS.length} بنود
        </span>
      </div>

      {/* Habits list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-white/30">جاري التحميل...</div>
        ) : (
          HABIT_ITEMS.map((habit, index) => {
            const value = scores[habit.key] ?? 0;
            return (
              <div
                key={habit.key}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:bg-white/8 hover:border-white/15"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="text-base shrink-0" aria-hidden>
                      {habit.icon}
                    </span>
                    <span className="text-sm font-medium text-white/90 truncate">
                      {habit.label}
                    </span>
                  </div>
                  <div
                    className={`min-w-[3.25rem] text-center text-sm font-mono font-bold px-2 py-0.5 rounded-lg border ${getScoreBg(value)} ${getScoreColor(value)}`}
                  >
                    {value.toFixed(1)}
                  </div>
                </div>

                <div className="flex items-center gap-2" dir="ltr">
                  <button
                    type="button"
                    onClick={() => saveScore(habit.key, Math.max(0, value - 0.5))}
                    disabled={value <= 0}
                    className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90 text-lg leading-none"
                  >
                    −
                  </button>

                  <div className="flex-1 relative px-1">
                    <div
                      className="absolute inset-x-1 h-2 rounded-full opacity-25 top-1/2 -translate-y-1/2"
                      style={{
                        background:
                          "linear-gradient(to right, hsl(0, 84%, 55%), hsl(48, 96%, 50%), hsl(142, 70%, 40%))",
                      }}
                    />
                    <Slider
                      value={[value]}
                      onValueChange={(val) => saveScore(habit.key, val[0])}
                      max={10}
                      min={0}
                      step={0.1}
                      className="relative z-10 w-full cursor-pointer"
                      rangeClassName={`bg-gradient-to-r ${getBarGradient(value)}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => saveScore(habit.key, Math.min(10, value + 0.5))}
                    disabled={value >= 10}
                    className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90 text-lg leading-none"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer tip */}
      <p className="text-center text-[10px] text-white/25 mt-4 px-2">
        قيّم كل بند من 0.0 إلى 10.0 — التقييم يُحفظ تلقائياً لكل يوم
      </p>
    </div>
  );
};
