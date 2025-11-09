import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ValueCard } from "@/components/ValueCard";
import { TaskSheet } from "@/components/TaskSheet";
import { VALUES, ValueData } from "@/types/value";
import { BEHAVIORAL_VALUES } from "@/types/behavioralValue";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface SubTask {
  id: string;
  name: string;
  progress: number;
}

interface Behavior {
  id: string;
  name: string;
  progress: number;
  subTasks?: SubTask[];
}

const Behavioral = () => {
  const [valuesData, setValuesData] = useState<Record<string, ValueData>>({});
  const [selectedBehavioralValueForTasks, setSelectedBehavioralValueForTasks] = useState<string | null>(null);
  const [behaviorsByValue, setBehaviorsByValue] = useState<Record<string, Behavior[]>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const getValueData = useCallback((valueId: string): ValueData => {
    if (valuesData[valueId]) {
      return valuesData[valueId];
    }
    
    const valueIndex = parseInt(valueId);
    const valueName = !isNaN(valueIndex) && valueIndex >= 0 && valueIndex < BEHAVIORAL_VALUES.length 
      ? BEHAVIORAL_VALUES[valueIndex] 
      : "Unknown Value";
    
    return {
      id: valueId,
      name: valueName,
      selectedFeelings: [],
      positiveFeelings: [],
      positiveFeelingDates: {},
      feelingNotes: {},
      notes: "",
      balancePercentage: 50,
      isPinned: false,
    };
  }, [valuesData]);
  
  // Pinned values - loaded from database
  const pinnedValues = useMemo(() => {
    const pinned = new Set<string>();
    Object.values(valuesData).forEach(value => {
      if (value.isPinned) {
        pinned.add(value.name);
      }
    });
    return pinned;
  }, [valuesData]);
  
  const togglePin = useCallback(async (valueName: string) => {
    if (!user) return;
    
    const valueIndex = BEHAVIORAL_VALUES.findIndex(v => v === valueName);
    if (valueIndex === -1) return;
    
    const valueId = valueIndex.toString();
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
        .from("behavioral_values")
        .upsert({
          user_id: user.id,
          value_id: valueId,
          value_name: valueName,
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

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const loadValuesData = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("behavioral_values")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      if (data) {
        const formattedData: Record<string, ValueData> = {};
        const formattedBehaviors: Record<string, Behavior[]> = {};
        
        data.forEach((item) => {
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

          const behaviors = Array.isArray(item.behaviors)
            ? (item.behaviors as unknown as Behavior[])
            : [];

          formattedData[item.value_id] = {
            id: item.value_id,
            name: BEHAVIORAL_VALUES[parseInt(item.value_id)],
            selectedFeelings,
            positiveFeelings,
            positiveFeelingDates,
            feelingNotes,
            notes: item.notes || "",
            balancePercentage: item.balance_percentage || 50,
            isPinned: item.is_pinned || false,
          };
          
          formattedBehaviors[item.value_id] = behaviors;
        });
        setValuesData(formattedData);
        setBehaviorsByValue(formattedBehaviors);
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
    const currentValue = getValueData(valueId);
    const newValueData = {
      id: valueId,
      name: BEHAVIORAL_VALUES[parseInt(valueId)],
      selectedFeelings,
      positiveFeelings,
      positiveFeelingDates,
      feelingNotes,
      notes,
      balancePercentage,
      isPinned: currentValue.isPinned || false,
    };

    setValuesData(prev => ({
      ...prev,
      [valueId]: newValueData,
    }));

    if (!user) return;
    
    try {
      await supabase
        .from("behavioral_values")
        .upsert({
          user_id: user.id,
          value_id: valueId,
          value_name: BEHAVIORAL_VALUES[parseInt(valueId)],
          selected_feelings: selectedFeelings,
          positive_feelings: positiveFeelings || [],
          positive_feeling_dates: positiveFeelingDates || {},
          feeling_notes: feelingNotes,
          notes: notes,
          balance_percentage: balancePercentage,
          is_pinned: currentValue.isPinned || false,
        }, { onConflict: 'user_id,value_id' });
    } catch (error) {
      console.error("Unexpected error during Supabase upsert:", error);
    }
  }, [user, getValueData]);

  const handleUpdateBehaviors = useCallback(async (updatedBehaviors: Behavior[]) => {
    if (!selectedBehavioralValueForTasks || !user) return;
    
    const valueIndex = BEHAVIORAL_VALUES.findIndex(v => v === selectedBehavioralValueForTasks);
    if (valueIndex === -1) return;
    
    const valueId = valueIndex.toString();
    
    setBehaviorsByValue(prev => ({
      ...prev,
      [valueId]: updatedBehaviors,
    }));
    
    try {
      await supabase
        .from("behavioral_values")
        .upsert(
          {
            user_id: user.id,
            value_id: valueId,
            value_name: BEHAVIORAL_VALUES[valueIndex],
            behaviors: updatedBehaviors as any,
          },
          { onConflict: 'user_id,value_id' }
        );
    } catch (error) {
      console.error("Unexpected error saving behaviors:", error);
    }
  }, [selectedBehavioralValueForTasks, user]);

  const handleUpdateOverallBalancePercentage = useCallback((newPercentage: number) => {
    if (selectedBehavioralValueForTasks) {
      const valueIndex = BEHAVIORAL_VALUES.findIndex(v => v === selectedBehavioralValueForTasks);
      if (valueIndex !== -1) {
        const valueId = valueIndex.toString();
        const currentData = getValueData(valueId);
        handleValueUpdate(
          valueId,
          currentData.selectedFeelings,
          currentData.positiveFeelings || [],
          currentData.positiveFeelingDates || {},
          currentData.feelingNotes,
          currentData.notes,
          newPercentage
        );
      }
    }
  }, [selectedBehavioralValueForTasks, getValueData, handleValueUpdate]);

  const currentOverallBalancePercentage = useMemo(() => {
    if (!selectedBehavioralValueForTasks) return 100;
    const valueIndex = BEHAVIORAL_VALUES.findIndex(v => v === selectedBehavioralValueForTasks);
    if (valueIndex === -1) return 100;
    const valueId = valueIndex.toString();
    return getValueData(valueId).balancePercentage;
  }, [selectedBehavioralValueForTasks, getValueData]);

  const sortedValues = useMemo(() => {
    const allValues = BEHAVIORAL_VALUES.map((valueName, index) => ({
      index,
      valueName,
      valueData: getValueData(index.toString()),
    }));
    
    const pinned = allValues.filter(v => pinnedValues.has(v.valueName));
    const unpinned = allValues.filter(v => !pinnedValues.has(v.valueName));
    
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


        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
          {sortedValues.map(({ index, valueName, valueData }) => (
            <ValueCard
              key={index}
              name={valueName}
              balancePercentage={valueData.balancePercentage}
              onClick={() => setSelectedBehavioralValueForTasks(valueName)}
              isPinned={pinnedValues.has(valueName)}
            />
          ))}
        </div>
      </div>



{/* Sign out button in footer */}
      <div className="flex justify-center mt-8">
        <Button
          onClick={signOut}
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </Button>
      </div>

      <TaskSheet
        isOpen={!!selectedBehavioralValueForTasks}
        onClose={() => setSelectedBehavioralValueForTasks(null)}
        valueName={selectedBehavioralValueForTasks || ""}
        behaviors={
          selectedBehavioralValueForTasks
            ? behaviorsByValue[BEHAVIORAL_VALUES.findIndex(v => v === selectedBehavioralValueForTasks).toString()] || []
            : []
        }
        onUpdateBehaviors={handleUpdateBehaviors}
        overallBalancePercentage={currentOverallBalancePercentage}
        onUpdateOverallBalancePercentage={handleUpdateOverallBalancePercentage}
        isPinned={selectedBehavioralValueForTasks ? pinnedValues.has(selectedBehavioralValueForTasks) : false}
        onTogglePin={() => selectedBehavioralValueForTasks && togglePin(selectedBehavioralValueForTasks)}
      />
    </div>
  );
};

export default Behavioral;