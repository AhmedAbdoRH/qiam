import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FEELINGS } from "@/types/value";
import { calculateBalance, getBalanceColor } from "@/utils/balanceCalculator";

interface ValueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  valueName: string;
  selectedFeelings: string[];
  notes: string;
  onUpdate: (selectedFeelings: string[], notes: string) => void;
}

export const ValueSheet = ({
  isOpen,
  onClose,
  valueName,
  selectedFeelings,
  notes,
  onUpdate,
}: ValueSheetProps) => {
  const [localSelectedFeelings, setLocalSelectedFeelings] = useState<string[]>(selectedFeelings);
  const [localNotes, setLocalNotes] = useState(notes);

  useEffect(() => {
    setLocalSelectedFeelings(selectedFeelings);
    setLocalNotes(notes);
  }, [selectedFeelings, notes, valueName]);

  const handleFeelingToggle = (feeling: string) => {
    const newSelectedFeelings = localSelectedFeelings.includes(feeling)
      ? localSelectedFeelings.filter((f) => f !== feeling)
      : [...localSelectedFeelings, feeling];
    
    setLocalSelectedFeelings(newSelectedFeelings);
    onUpdate(newSelectedFeelings, localNotes);
  };

  const handleNotesChange = (value: string) => {
    setLocalNotes(value);
    onUpdate(localSelectedFeelings, value);
  };

  const balancePercentage = calculateBalance(localSelectedFeelings.length);
  const balanceColor = getBalanceColor(balancePercentage);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[75vh] rounded-t-3xl bg-card border-t border-border overflow-y-auto"
      >
        <SheetHeader className="text-right mb-6">
          <SheetTitle className="text-2xl font-bold text-foreground">
            {valueName}
          </SheetTitle>
          <SheetDescription className="text-right">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold text-lg mt-2"
              style={{ backgroundColor: balanceColor }}
            >
              <span>نسبة الاتزان: {balancePercentage}%</span>
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">المشاعر السلبية</h3>
            <div className="space-y-3">
              {FEELINGS.map((feeling) => (
                <div
                  key={feeling}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <Checkbox
                    id={feeling}
                    checked={localSelectedFeelings.includes(feeling)}
                    onCheckedChange={() => handleFeelingToggle(feeling)}
                    className="border-2 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                  />
                  <Label
                    htmlFor={feeling}
                    className="text-base text-foreground cursor-pointer flex-1"
                  >
                    {feeling}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="notes" className="text-lg font-semibold text-foreground">
              ملاحظات وتأملات
            </Label>
            <Textarea
              id="notes"
              value={localNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="اكتب ملاحظاتك وتأملاتك هنا..."
              className="min-h-[120px] text-base bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
