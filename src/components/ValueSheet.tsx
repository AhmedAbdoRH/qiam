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
import { Pin, PinOff, ArrowRight } from "lucide-react";
import { FEELINGS } from "@/types/value";
import { getBalanceColor } from "@/utils/balanceCalculator";
import { TaskList } from "./TaskList";

interface ValueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  valueName: string;
  selectedFeelings: string[];
  positiveFeelings?: string[];
  positiveFeelingDates?: Record<string, string>;
  feelingNotes: Record<string, string>;
  notes: string;
  balancePercentage: number;
  onUpdate: (selectedFeelings: string[], positiveFeelings: string[], positiveFeelingDates: Record<string, string>, feelingNotes: Record<string, string>, notes: string, balancePercentage: number) => void;
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
  positiveFeelingDates = {},
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
  const [localPositiveFeelingDates, setLocalPositiveFeelingDates] = useState<Record<string, string>>(positiveFeelingDates);
  const [localFeelingNotes, setLocalFeelingNotes] = useState<Record<string, string>>(feelingNotes);
  const [localNotes, setLocalNotes] = useState(notes);
  const [localBalancePercentage, setLocalBalancePercentage] = useState(balancePercentage);

  useEffect(() => {
    setLocalSelectedFeelings(selectedFeelings);
    setLocalPositiveFeelings(positiveFeelings || []);
    setLocalPositiveFeelingDates(positiveFeelingDates || {});
    setLocalFeelingNotes(feelingNotes);
    setLocalNotes(notes);
    setLocalBalancePercentage(balancePercentage);
  }, [selectedFeelings, positiveFeelings, positiveFeelingDates, feelingNotes, notes, balancePercentage, valueName]);

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
    let newPositiveFeelingDates = { ...localPositiveFeelingDates };
    
    if (currentState === null) {
      // First click: set to negative (red)
      newSelectedFeelings = [...newSelectedFeelings, feeling];
    } else if (currentState === 'negative') {
      // Second click: change from negative to positive (green) and add timestamp
      newSelectedFeelings = newSelectedFeelings.filter((f) => f !== feeling);
      newPositiveFeelings = [...newPositiveFeelings, feeling];
      newPositiveFeelingDates[feeling] = new Date().toISOString();
    } else {
      // Third click: remove selection and timestamp
      newPositiveFeelings = newPositiveFeelings.filter((f) => f !== feeling);
      delete newPositiveFeelingDates[feeling];
    }
    
    // Calculate new balance percentage
    const positiveCount = newPositiveFeelings.length;
    const negativeCount = newSelectedFeelings.length;
    const totalFeelings = FEELINGS.length; // 7 feelings

    let newBalancePercentage = 50; // Default to 50%
    if (totalFeelings > 0) {
      const balanceChangePerFeeling = 100 / totalFeelings; // ~14.3%
      newBalancePercentage = 50 + (positiveCount - negativeCount) * balanceChangePerFeeling;
    }
    
    // Ensure balance percentage is within 0-100
    newBalancePercentage = Math.max(0, Math.min(100, Math.round(newBalancePercentage)));

    setLocalSelectedFeelings(newSelectedFeelings);
    setLocalPositiveFeelings(newPositiveFeelings);
    setLocalPositiveFeelingDates(newPositiveFeelingDates);
    setLocalBalancePercentage(newBalancePercentage);
    // Save to database via onUpdate
    onUpdate(newSelectedFeelings, newPositiveFeelings, newPositiveFeelingDates, localFeelingNotes, localNotes, newBalancePercentage);
  }, [localSelectedFeelings, localPositiveFeelings, localPositiveFeelingDates, localFeelingNotes, localNotes, onUpdate, getFeelingState]);

  const handleFeelingNoteChange = useCallback((feeling: string, note: string) => {
    const newFeelingNotes = { ...localFeelingNotes, [feeling]: note };
    setLocalFeelingNotes(newFeelingNotes);
    onUpdate(localSelectedFeelings, localPositiveFeelings, localPositiveFeelingDates, newFeelingNotes, localNotes, localBalancePercentage);
  }, [localSelectedFeelings, localPositiveFeelings, localPositiveFeelingDates, localFeelingNotes, localNotes, localBalancePercentage, onUpdate]);

  const handleNotesChange = useCallback((value: string) => {
    setLocalNotes(value);
    onUpdate(localSelectedFeelings, localPositiveFeelings, localPositiveFeelingDates, localFeelingNotes, value, localBalancePercentage);
  }, [localSelectedFeelings, localPositiveFeelings, localPositiveFeelingDates, localFeelingNotes, localBalancePercentage, onUpdate]);

  const handleBalanceChange = useCallback((value: number[]) => {
    const newBalance = value[0];
    setLocalBalancePercentage(newBalance);
    onUpdate(localSelectedFeelings, localPositiveFeelings, localPositiveFeelingDates, localFeelingNotes, localNotes, newBalance);
  }, [localSelectedFeelings, localPositiveFeelings, localPositiveFeelingDates, localFeelingNotes, localNotes, onUpdate]);

  const balanceColor = getBalanceColor(localBalancePercentage);

  // Convert an HSL color string like "hsl(h, s%, l%)" to HSLA with given alpha
  const withAlpha = (hsl: string, alpha: number): string => {
    return hsl.startsWith("hsl(")
      ? hsl.replace("hsl(", "hsla(").replace(")", `, ${alpha})`)
      : hsl;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full md:w-[500px] lg:w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-3xl font-bold text-primary text-center mb-4">
            {valueName}
          </SheetTitle>
          <SheetDescription className="text-center text-muted-foreground">
            {/* Description content */}
          </SheetDescription>
        </SheetHeader>
        {valueId && onTogglePin && (
          <div className="absolute top-4 left-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePin}
              className="rounded-full bg-background/60 backdrop-blur-lg hover:bg-background/80"
            >
              {isPinned ? (
                <PinOff className="h-5 w-5 text-primary" />
              ) : (
                <Pin className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </div>
        )}
        <div className="p-4 space-y-6">
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

          <div className="space-y-3">
            {/* <h3 className="text-lg font-semibold text-foreground">المشاعر السلبية</h3> */}
            <div className="space-y-2">
              {FEELINGS.map((feeling) => (
                <div
                  key={feeling}
                  className="flex flex-row items-center gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3 flex-col items-start">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleFeelingToggle(feeling)}
                        className="relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card"
                      >
                        {(() => {
                          const feelingState = getFeelingState(feeling);
                          const isNegative = feelingState === 'negative';
                          const isPositive = feelingState === 'positive';
                          
                          if (isNegative) {
                            return (
                              <>
                                <div className="absolute inset-0 rounded-full border-2 border-destructive bg-destructive/10 shadow-lg shadow-destructive/20" />
                                <div className="relative w-3.5 h-3.5 rounded-full bg-destructive shadow-md" />
                              </>
                            );
                          }
                          
                          if (isPositive) {
                            return (
                              <>
                                <div className="absolute inset-0 rounded-full border-2 border-success bg-success/5 shadow-lg shadow-success/20" />
                                <div className="relative w-3.5 h-3.5 rounded-full bg-success shadow-md" />
                              </>
                            );
                          }
                          
                          return (
                            <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/30 bg-muted/20 hover:border-muted-foreground/50 hover:bg-muted/30" />
                          );
                        })()}
                      </button>
                      <div className="flex flex-col">
                        <Label
                          htmlFor={feeling}
                          className="text-base text-foreground cursor-pointer"
                          onClick={() => handleFeelingToggle(feeling)}
                        >
                          {feeling}
                        </Label>
                        {localPositiveFeelingDates[feeling] && (
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {new Date(localPositiveFeelingDates[feeling]).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              calendar: 'gregory'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
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
        <Button
          variant="ghost"
          onClick={onClose}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground rounded-full bg-background/30 backdrop-blur-lg"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </SheetContent>
    </Sheet>
  );
};
