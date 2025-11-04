import { useState, useEffect } from "react";
import { ValueCard } from "@/components/ValueCard";
import { ValueSheet } from "@/components/ValueSheet";
import { VALUES, ValueData } from "@/types/value";
import { supabase } from "@/integrations/supabase/client";

// Generate or retrieve a unique session ID for this browser
const getSessionId = () => {
  let sessionId = localStorage.getItem("session-id");
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    localStorage.setItem("session-id", sessionId);
  }
  return sessionId;
};

const Index = () => {
  const [valuesData, setValuesData] = useState<Record<string, ValueData>>({});
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionId = getSessionId();

  // Load values from database
  useEffect(() => {
    loadValuesData();
  }, []);

  const loadValuesData = async () => {
    try {
      const { data, error } = await supabase
        .from("spiritual_values")
        .select("*")
        .eq("session_id", sessionId);

      if (error) throw error;

      if (data) {
        const formattedData: Record<string, ValueData> = {};
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

          formattedData[item.value_id] = {
            id: item.value_id,
            name: item.value_name,
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
      setLoading(false);
    }
  };

  const getValueData = (valueId: string): ValueData => {
    return (
      valuesData[valueId] || {
        id: valueId,
        name: VALUES[parseInt(valueId)],
        selectedFeelings: [],
        feelingNotes: {},
        notes: "",
        balancePercentage: 100,
      }
    );
  };

  const handleValueUpdate = async (
    valueId: string,
    selectedFeelings: string[],
    feelingNotes: Record<string, string>,
    notes: string,
    balancePercentage: number
  ) => {
    const newValueData = {
      id: valueId,
      name: VALUES[parseInt(valueId)],
      selectedFeelings,
      feelingNotes,
      notes,
      balancePercentage,
    };

    // Update local state
    setValuesData({
      ...valuesData,
      [valueId]: newValueData,
    });

    // Update database
    try {
      const { error } = await supabase
        .from("spiritual_values")
        .upsert({
          session_id: sessionId,
          value_id: valueId,
          value_name: VALUES[parseInt(valueId)],
          selected_feelings: selectedFeelings,
          feeling_notes: feelingNotes,
          notes: notes,
          balance_percentage: balancePercentage,
        }, {
          onConflict: "session_id,value_id"
        });

      if (error) {
        console.error("Error saving value:", error);
      } else {
        console.log("Data saved successfully:", valueId);
      }
    } catch (error) {
      console.error("Error saving value:", error);
    }
  };

  const selectedValueData = selectedValue ? getValueData(selectedValue) : null;

  // Sort values with "الألوهية" always first
  const sortedValues = VALUES.map((valueName, index) => ({
    index,
    valueName,
    valueData: getValueData(index.toString()),
  })).sort((a, b) => {
    // "الألوهية" is always first (index 0)
    if (a.index === 0) return -1;
    if (b.index === 0) return 1;
    // Sort the rest by balance percentage
    return a.valueData.balancePercentage - b.valueData.balancePercentage;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">جاري التحميل...</div>
      </div>
    );
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
            />
          ))}
        </div>
      </div>

      {selectedValueData && (
        <ValueSheet
          isOpen={selectedValue !== null}
          onClose={() => setSelectedValue(null)}
          valueName={selectedValueData.name}
          selectedFeelings={selectedValueData.selectedFeelings}
          feelingNotes={selectedValueData.feelingNotes}
          notes={selectedValueData.notes}
          balancePercentage={selectedValueData.balancePercentage}
          onUpdate={(selectedFeelings, feelingNotes, notes, balancePercentage) =>
            handleValueUpdate(selectedValue!, selectedFeelings, feelingNotes, notes, balancePercentage)
          }
        />
      )}
    </div>
  );
};

export default Index;
