import { useMemo, useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, Target, Flame, Copy, History } from "lucide-react";
import { toast } from "sonner";

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

const getYesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateISO(d);
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

const formatShortDate = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
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

const calcAverage = (scores: Scores) => {
  const values = HABIT_ITEMS.map((h) => scores[h.key] ?? 0);
  return values.reduce((a, b) => a + b, 0) / HABIT_ITEMS.length;
};

const formatScore = (v: number) => `${Number(v).toFixed(1)}/10`;

const formatDayText = (dateIso: string, scores: Scores, includeTitle = true) => {
  const lines = HABIT_ITEMS.map((h) => {
    const v = scores[h.key] ?? 0;
    return `• ${h.label}: ${formatScore(v)}`;
  });
  const avg = calcAverage(scores);
  const body = [
    `📅 ${formatArabicDate(dateIso)}`,
    `المتوسط: ${formatScore(avg)}`,
    "────────────",
    ...lines,
  ];
  if (includeTitle) {
    return ["التقرير اليومي للعادات الأكثر فاعلية", "", ...body].join("\n");
  }
  return body.join("\n");
};

export const DailyHabitsTracker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => getYesterdayISO());
  const [copying, setCopying] = useState(false);
  const todayISO = formatDateISO(new Date());
  const yesterdayISO = getYesterdayISO();
  const isToday = selectedDate === todayISO;
  const isYesterday = selectedDate === yesterdayISO;

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
  const average = useMemo(() => calcAverage(scores), [scores]);
  const filledCount = useMemo(
    () => HABIT_ITEMS.filter((h) => (scores[h.key] ?? 0) > 0).length,
    [scores]
  );

  const saveScore = useCallback(
    async (key: HabitKey, value: number) => {
      if (!user) return;
      const nextScores = { ...scores, [key]: Math.round(value * 10) / 10 };

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

  const copyToClipboard = async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMsg);
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  const handleCopyToday = async () => {
    const text = formatDayText(selectedDate, scores, true);
    await copyToClipboard(text, "تم نسخ تقييمات اليوم");
  };

  const handleCopyFullHistory = async () => {
    if (!user) return;
    setCopying(true);
    try {
      const { data, error } = await (supabase as any)
        .from("daily_habits")
        .select("habit_date, scores")
        .eq("user_id", user.id)
        .order("habit_date", { ascending: false });

      if (error) throw error;

      const rows = (data || []) as { habit_date: string; scores: Scores }[];

      if (rows.length === 0) {
        toast.info("لا يوجد سجل بعد");
        return;
      }

      const sections = rows.map((row) => formatDayText(row.habit_date, row.scores || {}, false));
      const header = [
        "التقرير اليومي للعادات الأكثر فاعلية",
        "",
        `عدد الأيام: ${rows.length}`,
        `تاريخ النسخ: ${formatArabicDate(todayISO)}`,
        "",
      ].join("\n");

      const fullText = header + sections.join("\n\n════════════════════════\n\n");
      await copyToClipboard(fullText, `تم نسخ السجل الكامل (${rows.length} يوم)`);
    } catch {
      toast.error("تعذر تحميل السجل");
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="mb-5 w-full" dir="rtl">
      {/* Header: title + avg + copy actions */}
      <div className="flex items-center justify-between gap-2 mb-2.5 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Target className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-xs font-semibold text-cyan-200/90 truncate">تتبع العادات اليومي</h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyToday}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/70 hover:text-white transition-all active:scale-95"
            title="نسخ تقييمات اليوم"
          >
            <Copy className="w-3 h-3" />
            <span className="hidden sm:inline">اليوم</span>
          </button>
          <button
            type="button"
            onClick={handleCopyFullHistory}
            disabled={copying}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/70 hover:text-white transition-all active:scale-95 disabled:opacity-40"
            title="نسخ السجل بالكامل"
          >
            <History className="w-3 h-3" />
            <span className="hidden sm:inline">{copying ? "..." : "السجل"}</span>
          </button>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold ${getScoreBg(average)}`}
          >
            <Flame className={`w-3 h-3 ${getScoreColor(average)}`} />
            <span className={getScoreColor(average)}>{average.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Compact date navigator */}
      <div className="flex items-center justify-between mb-2.5 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5">
        <button
          onClick={() => shiftDate(1)}
          disabled={isToday}
          className="p-1.5 rounded-lg bg-transparent hover:bg-white/10 text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
          aria-label="اليوم التالي"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className="text-center flex-1 flex items-center justify-center gap-2">
          <p className="text-xs font-medium text-white/90">{formatShortDate(selectedDate)}</p>
          {isToday && (
            <span className="text-[9px] text-cyan-300/80 bg-cyan-500/10 px-1.5 py-0.5 rounded-full">
              اليوم
            </span>
          )}
          {isYesterday && (
            <span className="text-[9px] text-amber-300/80 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
              أمس
            </span>
          )}
        </div>

        <button
          onClick={() => shiftDate(-1)}
          className="p-1.5 rounded-lg bg-transparent hover:bg-white/10 text-white/60 transition-all active:scale-95"
          aria-label="اليوم السابق"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Thin progress bar — fills from right to left (RTL) */}
      <div className="mb-2.5 flex items-center gap-2 px-0.5" dir="rtl">
        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden flex justify-end">
          <div
            className={`h-full rounded-full bg-gradient-to-l ${getBarGradient(average)} transition-all duration-500`}
            style={{ width: `${(average / 10) * 100}%` }}
          />
        </div>
        <span className="text-[9px] text-white/35 whitespace-nowrap">
          {filledCount}/{HABIT_ITEMS.length}
        </span>
      </div>

      {/* Compact habits list — single-line rows */}
      <div className="space-y-1.5">
        {isLoading ? (
          <div className="text-center py-4 text-[10px] text-white/30">جاري التحميل...</div>
        ) : (
          HABIT_ITEMS.map((habit) => {
            const value = scores[habit.key] ?? 0;
            return (
              <div
                key={habit.key}
                className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 transition-all hover:bg-white/8"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm shrink-0 leading-none" aria-hidden>
                    {habit.icon}
                  </span>
                  <span className="text-xs font-medium text-white/85 flex-1 truncate leading-tight">
                    {habit.label}
                  </span>
                  <span
                    className={`text-[11px] font-mono font-bold min-w-[2.4rem] text-center px-1.5 py-0.5 rounded-md border ${getScoreBg(value)} ${getScoreColor(value)}`}
                  >
                    {value.toFixed(1)}
                  </span>
                </div>

                <div className="relative" dir="ltr">
                  <div
                    className="absolute inset-x-0 h-1.5 rounded-full opacity-20 top-1/2 -translate-y-1/2"
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
