import { useState } from "react";
import { ValueCard } from "@/components/ValueCard";
import { ValueSheet } from "@/components/ValueSheet";
import { VALUES, ValueData } from "@/types/value";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { calculateBalance } from "@/utils/balanceCalculator";

const Index = () => {
  const [valuesData, setValuesData] = useLocalStorage<Record<string, ValueData>>(
    "spiritual-balance",
    {}
  );
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const getValueData = (valueId: string): ValueData => {
    return (
      valuesData[valueId] || {
        id: valueId,
        name: VALUES[parseInt(valueId)],
        selectedFeelings: [],
        notes: "",
        balancePercentage: 100,
      }
    );
  };

  const handleValueUpdate = (
    valueId: string,
    selectedFeelings: string[],
    notes: string
  ) => {
    const balancePercentage = calculateBalance(selectedFeelings.length);
    setValuesData({
      ...valuesData,
      [valueId]: {
        id: valueId,
        name: VALUES[parseInt(valueId)],
        selectedFeelings,
        notes,
        balancePercentage,
      },
    });
  };

  const selectedValueData = selectedValue ? getValueData(selectedValue) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <header className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          مقياس الاتزان الروحي والنفسي
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          اضغط على أي قيمة لتقييم اتزانك الروحي والنفسي
        </p>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {VALUES.map((valueName, index) => {
            const valueData = getValueData(index.toString());
            return (
              <ValueCard
                key={index}
                name={valueName}
                balancePercentage={valueData.balancePercentage}
                onClick={() => setSelectedValue(index.toString())}
              />
            );
          })}
        </div>
      </main>

      {selectedValueData && (
        <ValueSheet
          isOpen={selectedValue !== null}
          onClose={() => setSelectedValue(null)}
          valueName={selectedValueData.name}
          selectedFeelings={selectedValueData.selectedFeelings}
          notes={selectedValueData.notes}
          onUpdate={(selectedFeelings, notes) =>
            handleValueUpdate(selectedValue!, selectedFeelings, notes)
          }
        />
      )}
    </div>
  );
};

export default Index;
