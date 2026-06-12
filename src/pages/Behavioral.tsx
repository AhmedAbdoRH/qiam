import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ValueCard } from "@/components/ValueCard";
import { ValueSheet } from "@/components/ValueSheet";
import { SelfDialogueChat } from "@/components/SelfDialogueChat";
import { ChatWidget } from "@/components/ChatWidget";
import { CalendarTaskList } from "@/components/CalendarTaskList";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadComprehensiveReport } from "@/utils/reportGenerator";
import { VALUES, ValueData, DEFAULT_BALANCE_PERCENTAGES } from "@/types/value";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sovereign from "./Sovereign";


// 25 masculine sovereign values displayed on this page (sourced from spiritual_values)
export const MASCULINE_VALUE_NAMES = [
  "القوة",
  "الهيمنة",
  "القهارية",
  "العظمة",
  "العزة",
  "القدر",
  "الولاية",
  "الملك",
  "المتانة",
  "الحكمة",
  "الرزق",
  "التعالي",
  "الواحدية",
  "الصمدية",
  "البصر",
  "الظهور",
  "التكبر",
  "الخلق",
  "القيومية",
  "الحق",
  "الأولية",
  "الكرامة",
  "التبيين",
  "البر",
  "الفتح",
];

const MASCULINE_VALUE_IDS = MASCULINE_VALUE_NAMES.map((name) =>
  VALUES.findIndex((v) => v === name).toString()
).filter((id) => id !== "-1");

const Behavioral = () => {
  const [valuesData, setValuesData] = useState<Record<string, ValueData>>({});
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [monologueOpen, setMonologueOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Fetch calendar tasks data for progress bar
  const { data: calendarItems = [] } = useQuery({
    queryKey: ['animaCalendar', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('anima_calendar')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map((c: any) => ({ id: c.id, title: c.title, progress: Number(c.progress) }));
    },
    enabled: !!user
  });

  const calendarTasksProgress = useMemo(() => {
    return calendarItems.map(item => Number(item.progress));
  }, [calendarItems]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const getValueData = useCallback((valueId: string): ValueData => {
    if (valuesData[valueId]) return valuesData[valueId];
    const valueIndex = parseInt(valueId);
    const valueName = VALUES[valueIndex] || "Unknown Value";
    return {
      id: valueId,
      name: valueName,
      selectedFeelings: [],
      feelingNotes: {},
      positiveFeelings: [],
      positiveFeelingDates: {},
      notes: "",
      balancePercentage: DEFAULT_BALANCE_PERCENTAGES[valueName] || 50,
      isPinned: false,
    };
  }, [valuesData]);

  const pinnedValues = useMemo(() => {
    const pinned = new Set<string>();
    Object.values(valuesData).forEach((v) => {
      if (v.isPinned) pinned.add(v.id);
    });
    return pinned;
  }, [valuesData]);

  const loadValuesData = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("spiritual_values")
        .select("*")
        .eq("user_id", user.id)
        .in("value_id", MASCULINE_VALUE_IDS);
      if (error) throw error;
      if (data) {
        const formatted: Record<string, ValueData> = {};
        data.forEach((item) => {
          if (!item.value_id) return;
          const idx = parseInt(item.value_id);
          formatted[item.value_id] = {
            id: item.value_id,
            name: VALUES[idx] || "Unknown",
            selectedFeelings: Array.isArray(item.selected_feelings) ? (item.selected_feelings as string[]) : [],
            feelingNotes: (item.feeling_notes && typeof item.feeling_notes === "object" && !Array.isArray(item.feeling_notes)) ? item.feeling_notes as Record<string, string> : {},
            positiveFeelings: Array.isArray(item.positive_feelings) ? (item.positive_feelings as string[]) : [],
            positiveFeelingDates: (item.positive_feeling_dates && typeof item.positive_feeling_dates === "object" && !Array.isArray(item.positive_feeling_dates)) ? item.positive_feeling_dates as Record<string, string> : {},
            notes: item.notes || "",
            balancePercentage: item.balance_percentage || 50,
            isPinned: item.is_pinned || false,
          };
        });
        setValuesData(formatted);
      }
    } catch (e) {
      console.error("Error loading masculine values:", e);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadValuesData();
  }, [user, loadValuesData]);

  const togglePin = useCallback(async (valueId: string) => {
    if (!user) return;
    const current = getValueData(valueId);
    const newPinned = !current.isPinned;
    setValuesData((prev) => ({ ...prev, [valueId]: { ...current, isPinned: newPinned } }));
    await supabase.from("spiritual_values").upsert({
      user_id: user.id,
      value_id: valueId,
      value_name: current.name,
      selected_feelings: current.selectedFeelings,
      positive_feelings: current.positiveFeelings || [],
      positive_feeling_dates: current.positiveFeelingDates || {},
      feeling_notes: current.feelingNotes,
      notes: current.notes,
      balance_percentage: current.balancePercentage,
      is_pinned: newPinned,
    }, { onConflict: "user_id,value_id" });
  }, [user, getValueData]);

  const handleValueUpdate = useCallback(async (
    valueId: string,
    selectedFeelings: string[],
    positiveFeelings: string[],
    positiveFeelingDates: Record<string, string>,
    feelingNotes: Record<string, string>,
    notes: string,
    balancePercentage: number
  ) => {
    const idx = parseInt(valueId);
    const valueName = VALUES[idx] || "Unknown";
    const currentPinned = valuesData[valueId]?.isPinned || false;
    setValuesData((prev) => ({
      ...prev,
      [valueId]: { id: valueId, name: valueName, selectedFeelings, positiveFeelings, positiveFeelingDates, feelingNotes, notes, balancePercentage, isPinned: currentPinned },
    }));
    if (!user) return;
    await supabase.from("spiritual_values").upsert({
      user_id: user.id,
      value_id: valueId,
      value_name: valueName,
      selected_feelings: selectedFeelings,
      positive_feelings: positiveFeelings || [],
      positive_feeling_dates: positiveFeelingDates || {},
      feeling_notes: feelingNotes,
      notes,
      balance_percentage: balancePercentage,
      is_pinned: currentPinned,
    }, { onConflict: "user_id,value_id" });
  }, [user, valuesData]);

  const sortedValues = useMemo(() => {
    const all = MASCULINE_VALUE_IDS.map((id) => ({
      id,
      valueName: VALUES[parseInt(id)],
      valueData: getValueData(id),
    }));
    const pinned = all.filter((v) => pinnedValues.has(v.id));
    const unpinned = all.filter((v) => !pinnedValues.has(v.id));
    const byProgress = (arr: typeof all) => [...arr].sort((a, b) => a.valueData.balancePercentage - b.valueData.balancePercentage);
    return [...byProgress(pinned), ...byProgress(unpinned)];
  }, [getValueData, pinnedValues]);

  const selectedValueData = selectedValue ? getValueData(selectedValue) : null;

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">جاري التحميل...</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-center text-xl md:text-2xl font-bold text-foreground mb-6" dir="rtl">
          الذات السيادية الذكورية
        </h1>

        {/* شريط إجمالي التقدم */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <Sovereign embedded calendarTasksProgress={calendarTasksProgress} />
        </div>

        {/* قائمة التذكيرية (Reminders List) */}
        <section className="mb-6" dir="rtl">
          <CalendarTaskList />
        </section>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
          {sortedValues.map(({ id, valueName, valueData }) => (
            <ValueCard
              key={id}
              name={valueName}
              balancePercentage={valueData.balancePercentage}
              onClick={() => setSelectedValue(id)}
              isPinned={pinnedValues.has(id)}
            />
          ))}
        </div>
      </div>

      <div className="pb-32" />

      {selectedValueData && (
        <ValueSheet
          isOpen={!!selectedValueData}
          valueName={selectedValueData.name}
          selectedFeelings={selectedValueData.selectedFeelings}
          positiveFeelings={selectedValueData.positiveFeelings}
          positiveFeelingDates={selectedValueData.positiveFeelingDates}
          feelingNotes={selectedValueData.feelingNotes}
          notes={selectedValueData.notes}
          balancePercentage={selectedValueData.balancePercentage}
          onClose={() => setSelectedValue(null)}
          onUpdate={(sf, pf, pfd, fn, n, bp) => handleValueUpdate(selectedValueData.id, sf, pf, pfd, fn, n, bp)}
          valueId={selectedValueData.id}
          isPinned={pinnedValues.has(selectedValueData.id)}
          onTogglePin={() => togglePin(selectedValueData.id)}
        />
      )}

      <SelfDialogueChat onLongPress={() => setMonologueOpen(true)} />
      <ChatWidget externalOpen={monologueOpen} onExternalClose={() => setMonologueOpen(false)} />
    </div>
  );
};

export default Behavioral;
