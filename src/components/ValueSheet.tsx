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
import { Slider } from "@/components/ui/slider";
import { FEELINGS } from "@/types/value";
import { getBalanceColor } from "@/utils/balanceCalculator";

interface ValueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  valueName: string;
  selectedFeelings: string[];
  feelingNotes: Record<string, string>;
  notes: string;
  balancePercentage: number;
  onUpdate: (selectedFeelings: string[], feelingNotes: Record<string, string>, notes: string, balancePercentage: number) => void;
}

export const ValueSheet = ({
  isOpen,
  onClose,
  valueName,
  selectedFeelings,
  feelingNotes,
  notes,
  balancePercentage,
  onUpdate,
}: ValueSheetProps) => {
  const [localSelectedFeelings, setLocalSelectedFeelings] = useState<string[]>(selectedFeelings);
  const [localFeelingNotes, setLocalFeelingNotes] = useState<Record<string, string>>(feelingNotes);
  const [localNotes, setLocalNotes] = useState(notes);
  const [localBalancePercentage, setLocalBalancePercentage] = useState(balancePercentage);

  useEffect(() => {
    setLocalSelectedFeelings(selectedFeelings);
    setLocalFeelingNotes(feelingNotes);
    setLocalNotes(notes);
    setLocalBalancePercentage(balancePercentage);
  }, [selectedFeelings, feelingNotes, notes, balancePercentage, valueName]);

  const handleFeelingToggle = (feeling: string) => {
    const newSelectedFeelings = localSelectedFeelings.includes(feeling)
      ? localSelectedFeelings.filter((f) => f !== feeling)
      : [...localSelectedFeelings, feeling];
    
    setLocalSelectedFeelings(newSelectedFeelings);
    onUpdate(newSelectedFeelings, localFeelingNotes, localNotes, localBalancePercentage);
  };

  const handleFeelingNoteChange = (feeling: string, note: string) => {
    const newFeelingNotes = { ...localFeelingNotes, [feeling]: note };
    setLocalFeelingNotes(newFeelingNotes);
    onUpdate(localSelectedFeelings, newFeelingNotes, localNotes, localBalancePercentage);
  };

  const handleNotesChange = (value: string) => {
    setLocalNotes(value);
    onUpdate(localSelectedFeelings, localFeelingNotes, value, localBalancePercentage);
  };

  const handleBalanceChange = (value: number[]) => {
    const newBalance = value[0];
    setLocalBalancePercentage(newBalance);
    onUpdate(localSelectedFeelings, localFeelingNotes, localNotes, newBalance);
  };

  const balanceColor = getBalanceColor(localBalancePercentage);

  // Convert an HSL color string like "hsl(h, s%, l%)" to HSLA with given alpha
  const withAlpha = (hsl: string, alpha: number): string => {
    return hsl.startsWith("hsl(")
      ? hsl.replace("hsl(", "hsla(").replace(")", `, ${alpha})`)
      : hsl;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[75vh] rounded-t-3xl bg-card border-t border-border overflow-y-auto p-0"
      >
        {/* Balance percentage slider */}
          <Slider
            value={[localBalancePercentage]}
            onValueChange={handleBalanceChange}
            max={100}
            min={0}
            step={1}
            className="w-full"
            rangeClassName="bg-[--slider-color]"
            style={{
              // @ts-ignore
              '--slider-color': balanceColor,
              background: `linear-gradient(90deg, ${withAlpha(balanceColor, 0.3)} 0%, ${withAlpha(balanceColor, 0.6)} ${localBalancePercentage}%, ${withAlpha(balanceColor, 0.1)} ${localBalancePercentage}%, ${withAlpha(balanceColor, 0.05)} 100%)`,
            } as React.CSSProperties}
          />

        <div className="pt-6">
          <div className="space-y-2">
            {/* <h3 className="text-lg font-semibold text-foreground">المشاعر السلبية</h3> */}
            <div className="space-y-2">
              {FEELINGS.map((feeling) => (
                <div
                  key={feeling}
                  className="flex flex-row items-center gap-3 p-3 rounded-lg bg-secondary/50"
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
                    className="min-h-[60px] text-sm bg-background/50 border-border text-foreground placeholder:text-muted-foreground resize-none flex-1"
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
