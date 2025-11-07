import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ValueCard } from "@/components/ValueCard";
import { TaskSheet } from "@/components/TaskSheet"; // New import
import { VALUES, ValueData } from "@/types/value";
import { BEHAVIORAL_VALUES } from "@/types/behavioralValue";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const areArraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
};

const areRecordsEqual = (a: Record<string, string>, b: Record<string, string>) => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => a[key] === b[key]);
};

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

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Load values from database
  useEffect(() => {
    if (user) {
      loadValuesData();
    }
  }, [user]);

  const loadValuesData = async () => {
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
          // Parse selected_feelings safely
          const selectedFeelings = Array.isArray(item.selected_feelings)
            ? (item.selected_feelings as string[])
            : [];
          
          // Parse feeling_notes safely
          const feelingNotes = 
            item.feeling_notes && 
            typeof item.feeling_notes === "object" && 
            !Array.isArray(item.feeling_notes)
              ? (item.feeling_notes as Record<string, string>)
              : {};

          // Parse behaviors safely
          const behaviors = Array.isArray(item.behaviors)
            ? (item.behaviors as unknown as Behavior[])
            : [];

          formattedData[item.value_id] = {
            id: item.value_id,
            name: BEHAVIORAL_VALUES[parseInt(item.value_id)],
            selectedFeelings,
            feelingNotes,
            notes: item.notes || "",
            balancePercentage: item.balance_percentage || 100,
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
  };

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
      feelingNotes: {},
      notes: "",
      balancePercentage: 100,
    };
  }, [valuesData]);

  const handleValueUpdate = useCallback(async (
    valueId: string,
    selectedFeelings: string[],
    feelingNotes: Record<string, string>,
    notes: string,
    balancePercentage: number
  ) => {
    const newValueData = {
      id: valueId,
      name: BEHAVIORAL_VALUES[parseInt(valueId)],
      selectedFeelings,
      feelingNotes,
      notes,
      balancePercentage,
    };

    const existingValue = valuesData[valueId];
    const existingFeelings = existingValue?.selectedFeelings ?? [];
    const existingFeelingNotes = existingValue?.feelingNotes ?? {};
    const hasChanges =
      !existingValue ||
      existingValue.notes !== notes ||
      existingValue.balancePercentage !== balancePercentage ||
      !areArraysEqual(existingFeelings, selectedFeelings) ||
      !areRecordsEqual(existingFeelingNotes, feelingNotes);

    if (!hasChanges) {
      return;
    }

    // Update local state
    setValuesData((prev) => ({
      ...prev,
      [valueId]: newValueData,
    }));

    // Update database
    if (!user) {
      console.error("Attempted to save value without a logged-in user.");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("behavioral_values")
        .upsert({
          user_id: user.id,
          value_id: valueId,
          value_name: BEHAVIORAL_VALUES[parseInt(valueId)],
          selected_feelings: selectedFeelings,
          feeling_notes: feelingNotes,
          notes: notes,
          balance_percentage: balancePercentage,
        }, { onConflict: 'user_id,value_id' });

      if (error) {
        console.error("Error saving value to Supabase:", error);
      }
    } catch (error) {
      console.error("Unexpected error during Supabase upsert:", error);
    }
  }, [user, valuesData]);

  const handleUpdateBehaviors = useCallback(async (updatedBehaviors: Behavior[]) => {
    if (!selectedBehavioralValueForTasks || !user) return;
    
    const valueIndex = BEHAVIORAL_VALUES.findIndex(v => v === selectedBehavioralValueForTasks);
    if (valueIndex === -1) return;
    
    const valueId = valueIndex.toString();
    const existingBehaviors = behaviorsByValue[valueId] ?? [];
    const serializedExisting = JSON.stringify(existingBehaviors);
    const serializedUpdated = JSON.stringify(updatedBehaviors);

    if (serializedExisting === serializedUpdated) {
      return;
    }
    
    // Update local state
    setBehaviorsByValue((prev) => ({
      ...prev,
      [valueId]: updatedBehaviors,
    }));
    
    // Save to database
    try {
      const { error } = await supabase
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

      if (error) {
        console.error("Error saving behaviors:", error);
      }
    } catch (error) {
      console.error("Unexpected error saving behaviors:", error);
    }
  }, [selectedBehavioralValueForTasks, user, behaviorsByValue]);

  const handleUpdateOverallBalancePercentage = useCallback((newPercentage: number) => {
    if (selectedBehavioralValueForTasks) {
      const valueIndex = BEHAVIORAL_VALUES.findIndex(v => v === selectedBehavioralValueForTasks);
      if (valueIndex !== -1) {
        const valueId = valueIndex.toString();
        const currentData = getValueData(valueId);
        handleValueUpdate(
          valueId,
          currentData.selectedFeelings,
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

  // Sort values by balance percentage
  const sortedValues = useMemo(
    () =>
      BEHAVIORAL_VALUES.map((valueName, index) => ({
        index,
        valueName,
        valueData: getValueData(index.toString()),
      })).sort(
        (a, b) => a.valueData.balancePercentage - b.valueData.balancePercentage
      ),
    [getValueData]
  );

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
      />
    </div>
  );
};

export default Behavioral;