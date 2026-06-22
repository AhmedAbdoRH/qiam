import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ValueCard } from "@/components/ValueCard";
import { ValueSheet } from "@/components/ValueSheet";
import { VALUES, ValueData, DEFAULT_BALANCE_PERCENTAGES } from "@/types/value";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadComprehensiveReport, downloadMasculineValuesReport, downloadAllValuesReport } from "@/utils/reportGenerator";
import Anima from "./Anima";
import Animus from "./Animus";
import { MASCULINE_VALUE_NAMES } from "./Behavioral";

const HIDDEN_VALUE_NAMES = new Set(MASCULINE_VALUE_NAMES);

const MASCULINE_VALUE_IDS = MASCULINE_VALUE_NAMES.map((name) =>
  VALUES.findIndex((v) => v === name).toString()
).filter((id) => id !== "-1");


const Index = () => {
  const [valuesData, setValuesData] = useState<Record<string, ValueData>>({});
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const getValueData = useCallback((valueId: string): ValueData => {
    if (valuesData[valueId]) {
      return valuesData[valueId];
    }
    
    const valueIndex = parseInt(valueId);
    const valueName = !isNaN(valueIndex) && valueIndex >= 0 && valueIndex < VALUES.length 
      ? VALUES[valueIndex] 
      : "Unknown Value";
    
    return {
      id: valueId,
      name: valueName,
      feelingsBeingHealed: [],
      beliefs: {},
      feelingsHealed: [],
      feelingsHealedDates: {},
      notes: "",
      balancePercentage: DEFAULT_BALANCE_PERCENTAGES[valueName] || 50,
      isPinned: false,
    };
  }, [valuesData]);
  
  // Pinned values - loaded from database
  const pinnedValues = useMemo(() => {
    const pinned = new Set<string>();
    Object.values(valuesData).forEach(value => {
      if (value.isPinned) {
        pinned.add(value.id);
      }
    });
    return pinned;
  }, [valuesData]);
  
  const togglePin = useCallback(async (valueId: string) => {
    if (!user) return;
    
    const currentValue = getValueData(valueId);
    const newPinnedState = !currentValue.isPinned;
    
    // Update local state immediately
    setValuesData(prev => ({
      ...prev,
      [valueId]: {
        ...prev[valueId],
        isPinned: newPinnedState,
      },
    }));
    
    // Update database
    try {
        await supabase
        .from("spiritual_values")
        .upsert({
          user_id: user.id,
          value_id: valueId,
          value_name: currentValue.name,
          feelings_being_healed: currentValue.feelingsBeingHealed,
          feelings_healed: currentValue.feelingsHealed || [],
          feelings_healed_dates: currentValue.feelingsHealedDates || {},
          beliefs: currentValue.beliefs,
          notes: currentValue.notes,
          balance_percentage: currentValue.balancePercentage,
          is_pinned: newPinnedState,
        }, { onConflict: 'user_id,value_id' });
    } catch (error) {
      console.error("Error updating pin status:", error);
      // Revert on error
      setValuesData(prev => ({
        ...prev,
        [valueId]: {
          ...prev[valueId],
          isPinned: !newPinnedState,
        },
      }));
    }
  }, [user, getValueData]);

  const loadValuesData = useCallback(async () => {
    if (!user) return;

    try {
      console.log('=== Loading values data ===');
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from("spiritual_values")
        .select("*")
        .eq("user_id", user.id);

      const duration = Date.now() - startTime;
      console.log(`Values data loaded in ${duration}ms`);

      if (error) throw error;

      if (data) {
        const formattedData: Record<string, ValueData> = {};
        
        data.forEach((item) => {
          if (!item.value_id || typeof item.value_id !== 'string' || item.value_id.trim() === '') {
            return;
          }
          
          const feelingsBeingHealed = Array.isArray(item.feelings_being_healed)
            ? (item.feelings_being_healed as string[])
            : [];
          
          const beliefs = 
            item.beliefs && 
            typeof item.beliefs === "object" && 
            !Array.isArray(item.beliefs)
              ? (item.beliefs as Record<string, string>)
              : {};

          const feelingsHealed = Array.isArray(item.feelings_healed)
            ? (item.feelings_healed as string[])
            : [];

          const feelingsHealedDates = 
            item.feelings_healed_dates && 
            typeof item.feelings_healed_dates === "object" && 
            !Array.isArray(item.feelings_healed_dates)
              ? (item.feelings_healed_dates as Record<string, string>)
              : {};

          const valueIndex = parseInt(item.value_id);
          const valueName = !isNaN(valueIndex) && valueIndex >= 0 && valueIndex < VALUES.length 
            ? VALUES[valueIndex] 
            : "Unknown Value";

          formattedData[item.value_id] = {
            id: item.value_id,
            name: valueName,
            feelingsBeingHealed,
            beliefs,
            feelingsHealed,
            feelingsHealedDates,
            notes: item.notes || "",
            balancePercentage: item.balance_percentage || 50,
            isPinned: item.is_pinned || false,
          };
        });
        setValuesData(formattedData);
      }
    } catch (error) {
      console.error("Error loading values:", error);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadValuesData();
    }
  }, [user, loadValuesData]);

  const handleValueUpdate = useCallback(async (
    valueId: string,
    feelingsBeingHealed: string[],
    feelingsHealed: string[],
    feelingsHealedDates: Record<string, string>,
    beliefs: Record<string, string>,
    notes: string,
    balancePercentage: number
  ) => {
    const valueIndex = parseInt(valueId);
    const valueName = !isNaN(valueIndex) && valueIndex >= 0 && valueIndex < VALUES.length ? VALUES[valueIndex] : "Unknown Value";
    
    // Keep existing isPinned from current state
    const currentIsPinned = valuesData[valueId]?.isPinned || false;
    
    // Update local state immediately
    setValuesData(prev => ({
      ...prev,
      [valueId]: {
        id: valueId,
        name: valueName,
        feelingsBeingHealed,
        feelingsHealed,
        feelingsHealedDates,
        beliefs,
        notes,
        balancePercentage,
        isPinned: currentIsPinned,
      },
    }));

    // Save to DB
    if (!user) return;

    try {
      console.log('=== Saving value data ===');
      console.log('Value:', valueName);
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from("spiritual_values")
        .upsert({
          user_id: user.id,
          value_id: valueId,
          value_name: valueName,
          feelings_being_healed: feelingsBeingHealed,
          feelings_healed: feelingsHealed || [],
          feelings_healed_dates: feelingsHealedDates || {},
          beliefs: beliefs,
          notes: notes,
          balance_percentage: balancePercentage,
          is_pinned: currentIsPinned,
        }, { onConflict: 'user_id,value_id' })
        .select();

      const duration = Date.now() - startTime;
      console.log(`Value data saved in ${duration}ms`);

      if (error) {
        console.error("❌ Upsert error:", valueName, error.message);
        toast.error(`فشل حفظ ${valueName}`);
      } else {
        console.log("✅ Saved to DB:", valueName, data);
        toast.success(`تم حفظ ${valueName} في قاعدة البيانات`);
      }
    } catch (error) {
      console.error("❌ Unexpected error:", valueName, error);
      toast.error(`خطأ غير متوقع في حفظ ${valueName}`);
    }
  }, [user, valuesData]);

  const handleDownloadReport = useCallback(async () => {
    if (user) {
      await downloadComprehensiveReport(user.id, user.email || undefined);
    }
  }, [user]);

  const selectedValueData = useMemo(
    () => selectedValue ? getValueData(selectedValue) : null, 
    [selectedValue, getValueData]
  );

  const sortedValues = useMemo(() => {
    const allValues = VALUES
      .map((valueName, index) => ({
        index,
        valueName,
        valueData: getValueData(index.toString()),
      }))
      .filter(({ valueName }) => !HIDDEN_VALUE_NAMES.has(valueName));

    const pinned = allValues.filter(v => pinnedValues.has(v.index.toString()));
    const unpinned = allValues.filter(v => !pinnedValues.has(v.index.toString()));
    
    const sortByProgress = (arr: typeof allValues) => 
      [...arr].sort((a, b) => a.valueData.balancePercentage - b.valueData.balancePercentage);
    
    return [...sortByProgress(pinned), ...sortByProgress(unpinned)];
  }, [getValueData, pinnedValues]);

  // Masculine values list (sourced from MASCULINE_VALUE_IDS)
  const sortedMasculineValues = useMemo(() => {
    const allValues = MASCULINE_VALUE_IDS.map((id) => ({
      id,
      valueName: VALUES[parseInt(id)],
      valueData: getValueData(id),
    }));

    const pinned = allValues.filter(v => pinnedValues.has(v.id));
    const unpinned = allValues.filter(v => !pinnedValues.has(v.id));

    const sortByProgress = (arr: typeof allValues) =>
      [...arr].sort((a, b) => a.valueData.balancePercentage - b.valueData.balancePercentage);

    return [...sortByProgress(pinned), ...sortByProgress(unpinned)];
  }, [getValueData, pinnedValues]);

  const handleDownloadMasculineReport = useCallback(async () => {
    if (user) {
      await downloadMasculineValuesReport(user.id, user.email || undefined);
    }
  }, [user]);

  const handleDownloadAllValuesReport = useCallback(async () => {
    if (user) {
      // Markdown export (matches the styling of the other reports)
      await downloadAllValuesReport(user.id, user.email || undefined);
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
    <div className="min-h-screen bg-background pt-10 px-2 pb-2 md:pt-16 md:px-4 md:pb-4">
      <div className="max-w-7xl mx-auto">
        {/* أيقونتا الأنوثة والذكورة جنباً إلى جنب بالأعلى */}
        <div className="mb-2 border-b border-white/10 pb-2 flex flex-col items-center justify-center">
          <div className="flex flex-row items-start justify-center gap-6 md:gap-12 w-full">
            <Anima embedded />
            <Animus embedded />
          </div>
        </div>

        {/* كروت القيم الذكورية بالأعلى */}
        {sortedMasculineValues.length > 0 && (
          <div className="mb-4">
            <h2 className="text-center text-sm md:text-base font-semibold text-muted-foreground mb-3" dir="rtl">
              القيم الذكورية
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
              {sortedMasculineValues.map(({ id, valueName, valueData }) => (
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
        )}

        {/* كروت القيم الأنثوية */}
        <h2 className="text-center text-sm md:text-base font-semibold text-muted-foreground mb-3" dir="rtl">
          القيم الأنثوية
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
          {sortedValues.map(({ index, valueName, valueData }) => (
            <ValueCard
              key={index}
              name={valueName}
              balancePercentage={valueData.balancePercentage}
              onClick={() => setSelectedValue(index.toString())}
              isPinned={pinnedValues.has(index.toString())}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-4">
        <Button
          onClick={handleDownloadReport}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          تحميل التقرير الشامل
        </Button>
        <Button
          onClick={handleDownloadMasculineReport}
          variant="default"
          size="sm"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          تحميل تقرير القيم الذكورية
        </Button>
      </div>


      {selectedValueData && (
        <ValueSheet
          isOpen={!!selectedValueData}
          valueName={selectedValueData.name}
          feelingsBeingHealed={selectedValueData.feelingsBeingHealed}
          feelingsHealed={selectedValueData.feelingsHealed}
          feelingsHealedDates={selectedValueData.feelingsHealedDates}
          beliefs={selectedValueData.beliefs}
          notes={selectedValueData.notes}
          balancePercentage={selectedValueData.balancePercentage}
          onClose={() => setSelectedValue(null)}
          onUpdate={(feelingsBeingHealed, feelingsHealed, feelingsHealedDates, beliefs, notes, balancePercentage) => {
            handleValueUpdate(
              selectedValueData.id,
              feelingsBeingHealed,
              feelingsHealed,
              feelingsHealedDates,
              beliefs,
              notes,
              balancePercentage
            );
          }}
          valueId={selectedValueData.id}
          isPinned={pinnedValues.has(selectedValueData.id)}
          onTogglePin={() => togglePin(selectedValueData.id)}
          valueData={selectedValueData}
        />
      )}

      {/* زر دائري ثابت بالأسفل لتحميل تقرير كل القيم */}
      <button
        onClick={handleDownloadAllValuesReport}
        title="تحميل تقرير كل القيم"
        className="fixed bottom-20 left-4 z-40 w-12 h-12 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95"
      >
        <Download className="w-5 h-5" />
      </button>

    </div>
  );
};

export default Index;
