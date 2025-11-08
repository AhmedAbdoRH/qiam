import React, { useState, useEffect, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Pin, PinOff } from "lucide-react";
import { FEELINGS } from "@/types/value";
import { getBalanceColor } from "@/utils/balanceCalculator";
import { TaskList } from "./TaskList";

interface ValueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  valueName: string;
  selectedFeelings: string[];
  positiveFeelings?: string[];
  feelingNotes: Record<string, string>;
  notes: string;
  balancePercentage: number;
  onUpdate: (selectedFeelings: string[], positiveFeelings: string[], feelingNotes: Record<string, string>, notes: string, balancePercentage: number) => void;
  valueId?: string;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export const ValueSheet = ({
  isOpen,
  onClose,
  valueName,
  selectedFeelings,
  positiveFeelings = [],
  feelingNotes,
  notes,
  balancePercentage,
  onUpdate,
  valueId,
  isPinned = false,
  onTogglePin,
}: ValueSheetProps) => {
  const [localSelectedFeelings, setLocalSelectedFeelings] = useState<string[]>(selectedFeelings);
  const [localPositiveFeelings, setLocalPositiveFeelings] = useState<string[]>(positiveFeelings);
  const [localFeelingNotes, setLocalFeelingNotes] = useState<Record<string, string>>(feelingNotes);
  const [localNotes, setLocalNotes] = useState(notes);
  const [localBalancePercentage, setLocalBalancePercentage] = useState(balancePercentage);

  useEffect(() => {
    setLocalSelectedFeelings(selectedFeelings);
    setLocalPositiveFeelings(positiveFeelings || []);
    setLocalFeelingNotes(feelingNotes);
    setLocalNotes(notes);
    setLocalBalancePercentage(balancePercentage);
  }, [selectedFeelings, positiveFeelings, feelingNotes, notes, balancePercentage, valueName]);

  // Get feeling state: null (unselected), 'negative' (red), 'positive' (green)
  const getFeelingState = useCallback((feeling: string): 'negative' | 'positive' | null => {
    if (localSelectedFeelings.includes(feeling)) return 'negative';
    if (localPositiveFeelings.includes(feeling)) return 'positive';
    return null;
  }, [localSelectedFeelings, localPositiveFeelings]);

  const handleFeelingToggle = useCallback((feeling: string) => {
    const currentState = getFeelingState(feeling);
    
    let newSelectedFeelings = [...localSelectedFeelings];
    let newPositiveFeelings = [...localPositiveFeelings];
    
    if (currentState === null) {
      // First click: set to negative (red)
      newSelectedFeelings = [...newSelectedFeelings, feeling];
    } else if (currentState === 'negative') {
      // Second click: change from negative to positive (green)
      newSelectedFeelings = newSelectedFeelings.filter((f) => f !== feeling);
      newPositiveFeelings = [...newPositiveFeelings, feeling];
    } else {
      // Third click: remove selection
      newPositiveFeelings = newPositiveFeelings.filter((f) => f !== feeling);
    }
    
    setLocalSelectedFeelings(newSelectedFeelings);
    setLocalPositiveFeelings(newPositiveFeelings);
    // Save to database via onUpdate
    onUpdate(newSelectedFeelings, newPositiveFeelings, localFeelingNotes, localNotes, localBalancePercentage);
  }, [localSelectedFeelings, localPositiveFeelings, localFeelingNotes, localNotes, localBalancePercentage, onUpdate, getFeelingState]);

  const handleFeelingNoteChange = useCallback((feeling: string, note: string) => {
    const newFeelingNotes = { ...localFeelingNotes, [feeling]: note };
    setLocalFeelingNotes(newFeelingNotes);
    onUpdate(localSelectedFeelings, localPositiveFeelings, newFeelingNotes, localNotes, localBalancePercentage);
  }, [localSelectedFeelings, localPositiveFeelings, localFeelingNotes, localNotes, localBalancePercentage, onUpdate]);

  const handleNotesChange = useCallback((value: string) => {
    setLocalNotes(value);
    onUpdate(localSelectedFeelings, localPositiveFeelings, localFeelingNotes, value, localBalancePercentage);
  }, [localSelectedFeelings, localPositiveFeelings, localFeelingNotes, localBalancePercentage, onUpdate]);

  const handleBalanceChange = useCallback((value: number[]) => {
    const newBalance = value[0];
    setLocalBalancePercentage(newBalance);
    onUpdate(localSelectedFeelings, localPositiveFeelings, localFeelingNotes, localNotes, newBalance);
  }, [localSelectedFeelings, localPositiveFeelings, localFeelingNotes, localNotes, onUpdate]);

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
        {valueId && onTogglePin && (
          <div className="absolute top-4 left-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePin}
            >
              {isPinned ? (
                <Pin className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ) : (
                <PinOff className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>
          </div>
        )}
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
                    <div className="relative">
                      {(() => {
                        const feelingState = getFeelingState(feeling);
                        const isChecked = feelingState !== null;
                        const isPositive = feelingState === 'positive';
                        const isNegative = feelingState === 'negative';
                        
                        return (
                          <>
                            <Checkbox
                              id={feeling}
                              checked={isChecked}
                              onCheckedChange={() => handleFeelingToggle(feeling)}
                              className={`h-5 w-5 rounded-full border-2 ${
                                isNegative
                                  ? 'border-destructive data-[state=checked]:border-destructive data-[state=checked]:bg-destructive/10'
                                  : isPositive
                                  ? 'border-green-500 data-[state=checked]:border-green-500 data-[state=checked]:bg-green-500/10'
                                  : 'border-muted-foreground/40'
                              }`}
                            />
                            {isNegative && (
                              <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-destructive" />
                            )}
                            {isPositive && (
                              <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-green-500" />
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <Label
                      htmlFor={feeling}
                      className="text-base text-foreground cursor-pointer flex-1"
                    >
                      {feeling}
                    </Label>
                  </div>
                  <div className="flex-1">
                    <TaskList
                      value={localFeelingNotes[feeling] || ""}
                      onChange={(value) => handleFeelingNoteChange(feeling, value)}
                    />
                  </div>
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
