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
  feelingNotes: Record<string, string>;
  notes: string;
  onUpdate: (selectedFeelings: string[], feelingNotes: Record<string, string>, notes: string) => void;
}

export const ValueSheet = ({
  isOpen,
  onClose,
  valueName,
  selectedFeelings,
  feelingNotes,
  notes,
  onUpdate,
}: ValueSheetProps) => {
  const [localSelectedFeelings, setLocalSelectedFeelings] = useState<string[]>(selectedFeelings);
  const [localFeelingNotes, setLocalFeelingNotes] = useState<Record<string, string>>(feelingNotes);
  const [localNotes, setLocalNotes] = useState(notes);

  useEffect(() => {
    setLocalSelectedFeelings(selectedFeelings);
    setLocalFeelingNotes(feelingNotes);
    setLocalNotes(notes);
  }, [selectedFeelings, feelingNotes, notes, valueName]);

  const handleFeelingToggle = (feeling: string) => {
    const newSelectedFeelings = localSelectedFeelings.includes(feeling)
      ? localSelectedFeelings.filter((f) => f !== feeling)
      : [...localSelectedFeelings, feeling];
    
    setLocalSelectedFeelings(newSelectedFeelings);
    onUpdate(newSelectedFeelings, localFeelingNotes, localNotes);
  };

  const handleFeelingNoteChange = (feeling: string, note: string) => {
    const newFeelingNotes = { ...localFeelingNotes, [feeling]: note };
    setLocalFeelingNotes(newFeelingNotes);
    onUpdate(localSelectedFeelings, newFeelingNotes, localNotes);
  };

  const handleNotesChange = (value: string) => {
    setLocalNotes(value);
    onUpdate(localSelectedFeelings, localFeelingNotes, value);
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
            <div className="space-y-4">
              {FEELINGS.map((feeling) => (
                <div
                  key={feeling}
                  className="space-y-2 p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
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
                  <Textarea
                    value={localFeelingNotes[feeling] || ""}
                    onChange={(e) => handleFeelingNoteChange(feeling, e.target.value)}
                    placeholder={`ملاحظات عن ${feeling}...`}
                    className="min-h-[60px] text-sm bg-background/50 border-border text-foreground placeholder:text-muted-foreground resize-none"
                  />
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
