import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ValueCard } from "@/components/ValueCard";
import { ValueSheet } from "@/components/ValueSheet";
import { VALUES, ValueData } from "@/types/value";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";

const Index = () => {
  const [valuesData, setValuesData] = useState<Record<string, ValueData>>({});
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Pinned values state
  const [pinnedValuesArray, setPinnedValuesArray] = useLocalStorage<string[]>(
    'spiritualValuesPinned',
    []
  );
  const pinnedValues = useMemo(() => new Set(pinnedValuesArray), [pinnedValuesArray]);
  
  const togglePin = useCallback((valueId: string) => {
    setPinnedValuesArray(prev => {
      const newArray = [...prev];
      const index = newArray.indexOf(valueId);
      if (index > -1) {
        newArray.splice(index, 1);
      } else {
        newArray.push(valueId);
      }
      return newArray;
    });
  }, [setPinnedValuesArray]);

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

          const valueIndex = parseInt(item.value_id);
          const valueName = !isNaN(valueIndex) && valueIndex >= 0 && valueIndex < VALUES.length ? VALUES[valueIndex] : "Unknown Value";
          formattedData[item.value_id] = {
            id: item.value_id,
            name: valueName,
            selectedFeelings,
            feelingNotes,
            notes: item.notes || "",
            balancePercentage: item.balance_percentage || 100,
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
    const valueIndex = parseInt(valueId);
    const valueName = !isNaN(valueIndex) && valueIndex >= 0 && valueIndex < VALUES.length ? VALUES[valueIndex] : "Unknown Value";
    const newValueData = {
      id: valueId,
      name: valueName,
      selectedFeelings,
      feelingNotes,
      notes,
      balancePercentage,
    };

    // Update local state
    setValuesData(prev => ({
      ...prev,
      [valueId]: newValueData,
    }));

    // Update database
    if (!user) return;
    
    try {
      await supabase
        .from("spiritual_values")
        .upsert({
          user_id: user.id,
          value_id: valueId,
          value_name: valueName,
          selected_feelings: selectedFeelings,
          feeling_notes: feelingNotes,
          notes: notes,
          balance_percentage: balancePercentage,
        }, { onConflict: 'user_id,value_id' });
    } catch (error) {
      console.error("Unexpected error during Supabase upsert:", error);
    }
  }, [user]);

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
          feelingNotes={selectedValueData.feelingNotes}
          notes={selectedValueData.notes}
          balancePercentage={selectedValueData.balancePercentage}
          onClose={() => setSelectedValue(null)}
          onUpdate={(selectedFeelings, feelingNotes, notes, balancePercentage) =>
            handleValueUpdate(
              selectedValueData.id,
              selectedFeelings,
              feelingNotes,
              notes,
              balancePercentage
            )
          }
          valueId={selectedValueData.id}
          isPinned={pinnedValues.has(selectedValueData.id)}
          onTogglePin={() => togglePin(selectedValueData.id)}
        />
      )}
    </div>
  );
};

export default Index;
