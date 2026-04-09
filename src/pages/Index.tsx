import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ValueCard } from "@/components/ValueCard";
import { ValueSheet } from "@/components/ValueSheet";
import { FeelingTaskList, FeelingTask } from "@/components/FeelingTaskList";
import { SelfDialogueChat } from "@/components/SelfDialogueChat";
import { ChatWidget } from "@/components/ChatWidget";
import { VALUES, ValueData } from "@/types/value";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
  const [valuesData, setValuesData] = useState<Record<string, ValueData>>({});
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [feelingTasks, setFeelingTasks] = useState<FeelingTask[]>([]);
  const [monologueOpen, setMonologueOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

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
      balancePercentage: 50,
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

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Load values from database
  const loadValuesData = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("spiritual_values")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      if (data) {
        const formattedData: Record<string, ValueData> = {};
        let loadedTasks: FeelingTask[] = [];
        
        data.forEach((item) => {
          if (!item.value_id || typeof item.value_id !== 'string' || item.value_id.trim() === '') {
            return;
          }
          
          // Load feeling tasks from first record found
          if (loadedTasks.length === 0 && item.feeling_tasks) {
            const tasks = item.feeling_tasks as unknown;
            if (Array.isArray(tasks)) {
              loadedTasks = tasks as FeelingTask[];
            }
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
          const valueName = !isNaN(valueIndex) && valueIndex >= 0 && valueIndex < VALUES.length ? VALUES[valueIndex] : "Unknown Value";
          formattedData[item.value_id] = {
            id: item.value_id,
            name: valueName,
            selectedFeelings,
            positiveFeelings,
            positiveFeelingDates,
            feelingNotes,
            notes: item.notes || "",
            balancePercentage: item.balance_percentage || 50,
            isPinned: item.is_pinned || false,
          };
        });
        setValuesData(formattedData);
        setFeelingTasks(loadedTasks);
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
    const currentValue = getValueData(valueId);
    const newValueData = {
      id: valueId,
      name: valueName,
      selectedFeelings,
      positiveFeelings,
      positiveFeelingDates,
      feelingNotes,
      notes,
      balancePercentage,
      isPinned: currentValue.isPinned || false,
    };

    // Update local state
    setValuesData(prev => ({
      ...prev,
      [valueId]: newValueData,
    }));

    // Update database
    if (!user) return;
    
    console.log("positiveFeelingDates being sent to Supabase:", positiveFeelingDates);

    try {
      await supabase
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
          is_pinned: currentValue.isPinned || false,
        }, { onConflict: 'user_id,value_id' });
    } catch (error) {
      console.error("Unexpected error during Supabase upsert:", error);
    }
  }, [user, getValueData]);

  const handleTasksChange = useCallback(async (newTasks: FeelingTask[]) => {
    setFeelingTasks(newTasks);
    
    if (!user) return;
    
    // Save to first value record
    try {
      await supabase
        .from("spiritual_values")
        .upsert([{
          user_id: user.id,
          value_id: "0",
          value_name: VALUES[0],
          feeling_tasks: JSON.parse(JSON.stringify(newTasks)),
          selected_feelings: valuesData["0"]?.selectedFeelings || [],
          positive_feelings: valuesData["0"]?.positiveFeelings || [],
          positive_feeling_dates: valuesData["0"]?.positiveFeelingDates || {},
          feeling_notes: valuesData["0"]?.feelingNotes || {},
          notes: valuesData["0"]?.notes || "",
          balance_percentage: valuesData["0"]?.balancePercentage || 50,
          is_pinned: valuesData["0"]?.isPinned || false,
        }], { onConflict: 'user_id,value_id' });
    } catch (error) {
      console.error("Error saving feeling tasks:", error);
    }
  }, [user, valuesData]);

  const selectedValueData = useMemo(
    () => selectedValue ? getValueData(selectedValue) : null,
    [selectedValue, getValueData]
  );

  // Sort values: pinned first, then by balance percentage
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
        
        <FeelingTaskList 
          tasks={feelingTasks} 
          onTasksChange={handleTasksChange} 
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
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

      {/* Self Dialogue Chat */}
      <SelfDialogueChat onLongPress={() => setMonologueOpen(true)} />

      {/* مناجاة - triggered by long press */}
      <ChatWidget externalOpen={monologueOpen} onExternalClose={() => setMonologueOpen(false)} />
    </div>
  );
};

export default Index;
