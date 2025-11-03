import { useState, useEffect } from "react";
import { ValueCard } from "@/components/ValueCard";
import { ValueSheet } from "@/components/ValueSheet";
import { VALUES, ValueData } from "@/types/value";
import { calculateBalance } from "@/utils/balanceCalculator";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const Index = () => {
  const [valuesData, setValuesData] = useLocalStorage<Record<string, ValueData>>(
    "spiritual-values",
    {}
  );
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

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

  const handleValueUpdate = (
    valueId: string,
    selectedFeelings: string[],
    feelingNotes: Record<string, string>,
    notes: string
  ) => {
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
  };

  const selectedValueData = selectedValue ? getValueData(selectedValue) : null;

  const sortedValues = VALUES.map((valueName, index) => ({
    index,
    valueName,
    valueData: getValueData(index.toString()),
  })).sort((a, b) => a.valueData.balancePercentage - b.valueData.balancePercentage);

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
          onUpdate={(selectedFeelings, feelingNotes, notes) =>
            handleValueUpdate(selectedValue!, selectedFeelings, feelingNotes, notes)
          }
        />
      )}
    </div>
  );
};

export default Index;
