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
import { downloadComprehensiveReport } from "@/utils/reportGenerator";
import Anima from "./Anima";
import { MASCULINE_VALUE_NAMES } from "./Behavioral";

const HIDDEN_VALUE_NAMES = new Set(MASCULINE_VALUE_NAMES);


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
      selectedFeelings: [],
      feelingNotes: {},
      positiveFeelings: [],
      positiveFeelingDates: {},
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
          selected_feelings: currentValue.selectedFeelings,
          positive_feelings: currentValue.positiveFeelings || [],
          positive_feeling_dates: currentValue.positiveFeelingDates || {},
          feeling_notes: currentValue.feelingNotes,
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
          
          const selectedFeelings = Array.isArray(item.selected_feelings)
            ? (item.selected_feelings as string[])
            : [];
          
          const feelingNotes = 
            item.feeling_notes && 
            typeof item.feeling_notes === "object" && 
            !Array.isArray(item.feeling_notes)
              ? (item.feeling_notes as Record<string, string>)
              : {};

          const positiveFeelings = Array.isArray(item.positive_feelings)
            ? (item.positive_feelings as string[])
            : [];

          const positiveFeelingDates = 
            item.positive_feeling_dates && 
            typeof item.positive_feeling_dates === "object" && 
            !Array.isArray(item.positive_feeling_dates)
              ? (item.positive_feeling_dates as Record<string, string>)
              : {};

          const valueIndex = parseInt(item.value_id);
          const valueName = !isNaN(valueIndex) && valueIndex >= 0 && valueIndex < VALUES.length 
            ? VALUES[valueIndex] 
            : "Unknown Value";

          formattedData[item.value_id] = {
            id: item.value_id,
            name: valueName,
            selectedFeelings,
            feelingNotes,
            positiveFeelings,
            positiveFeelingDates,
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
    selectedFeelings: string[],
    positiveFeelings: string[],
    positiveFeelingDates: Record<string, string>,
    feelingNotes: Record<string, string>,
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
        selectedFeelings,
        positiveFeelings,
        positiveFeelingDates,
        feelingNotes,
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
          selected_feelings: selectedFeelings,
          positive_feelings: positiveFeelings || [],
          positive_feeling_dates: positiveFeelingDates || {},
          feeling_notes: feelingNotes,
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
    const allValues = VALUES.map((valueName, index) => ({
      index,
      valueName,
      valueData: getValueData(index.toString()),
    }));

    const pinned = allValues.filter(v => pinnedValues.has(v.index.toString()));
    const unpinned = allValues.filter(v => !pinnedValues.has(v.index.toString()));
    
    const sortByProgress = (arr: typeof allValues) => 
      [...arr].sort((a, b) => a.valueData.balancePercentage - b.valueData.balancePercentage);
    
    return [...sortByProgress(pinned), ...sortByProgress(unpinned)];
  }, [getValueData, pinnedValues]);

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
      <div className="max-w-7xl mx-auto">
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

      <div className="flex justify-center mt-8 pb-32">
        <Button
          onClick={handleDownloadReport}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          تحميل التقرير الشامل
        </Button>
      </div>

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
          onUpdate={(selectedFeelings, positiveFeelings, positiveFeelingDates, feelingNotes, notes, balancePercentage) => {
            handleValueUpdate(
              selectedValueData.id,
              selectedFeelings,
              positiveFeelings,
              positiveFeelingDates,
              feelingNotes,
              notes,
              balancePercentage
            );
          }}
          valueId={selectedValueData.id}
          isPinned={pinnedValues.has(selectedValueData.id)}
          onTogglePin={() => togglePin(selectedValueData.id)}
        />
      )}

    </div>
  );
};

export default Index;
