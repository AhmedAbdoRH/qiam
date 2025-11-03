import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ValueCard } from "@/components/ValueCard";
import { ValueSheet } from "@/components/ValueSheet";
import { VALUES, ValueData } from "@/types/value";
import { calculateBalance } from "@/utils/balanceCalculator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [valuesData, setValuesData] = useState<Record<string, ValueData>>({});
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadValuesData();
    }
  }, [user]);

  const loadValuesData = async () => {
    if (!user) return;
    
    setDataLoading(true);
    const { data, error } = await supabase
      .from("spiritual_values")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      toast.error("خطأ في تحميل البيانات");
      setDataLoading(false);
      return;
    }

    const dataMap: Record<string, ValueData> = {};
    data?.forEach((item) => {
      const selectedFeelings = Array.isArray(item.selected_feelings) 
        ? (item.selected_feelings as string[])
        : [];
      
      const feelingNotes = typeof item.feeling_notes === 'object' && 
                          item.feeling_notes !== null && 
                          !Array.isArray(item.feeling_notes)
        ? item.feeling_notes as Record<string, string>
        : {};

      dataMap[item.value_id] = {
        id: item.value_id,
        name: item.value_name,
        selectedFeelings,
        feelingNotes,
        notes: item.notes || "",
        balancePercentage: item.balance_percentage || 100,
      };
    });

    setValuesData(dataMap);
    setDataLoading(false);
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
    notes: string
  ) => {
    if (!user) return;

    const balancePercentage = calculateBalance(selectedFeelings.length);
    const newValueData = {
      id: valueId,
      name: VALUES[parseInt(valueId)],
      selectedFeelings,
      feelingNotes,
      notes,
      balancePercentage,
    };

    setValuesData({
      ...valuesData,
      [valueId]: newValueData,
    });

    const { error } = await supabase.from("spiritual_values").upsert({
      user_id: user.id,
      value_id: valueId,
      value_name: VALUES[parseInt(valueId)],
      selected_feelings: selectedFeelings,
      feeling_notes: feelingNotes,
      notes,
      balance_percentage: balancePercentage,
    });

    if (error) {
      toast.error("خطأ في حفظ البيانات");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const selectedValueData = selectedValue ? getValueData(selectedValue) : null;

  const sortedValues = VALUES.map((valueName, index) => ({
    index,
    valueName,
    valueData: getValueData(index.toString()),
  })).sort((a, b) => a.valueData.balancePercentage - b.valueData.balancePercentage);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground text-xl">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-6">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="text-foreground"
          >
            تسجيل الخروج
          </Button>
        </div>

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
          onUpdate={(selectedFeelings, feelingNotes, notes) =>
            handleValueUpdate(selectedValue!, selectedFeelings, feelingNotes, notes)
          }
        />
      )}
    </div>
  );
};

export default Index;
