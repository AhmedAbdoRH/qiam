import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

  // Ref to track latest state for callbacks
  const latestRef = useRef({
    localSelectedFeelings,
    localPositiveFeelings,
    localPositiveFeelingDates,
    localFeelingNotes,
    localNotes,
    localBalancePercentage,
  });
  latestRef.current = {
    localSelectedFeelings,
    localPositiveFeelings,
    localPositiveFeelingDates,
    localFeelingNotes,
    localNotes,
    localBalancePercentage,
  };

  useEffect(() => {
    setLocalSelectedFeelings(selectedFeelings);
    setLocalPositiveFeelings(positiveFeelings || []);
    setLocalPositiveFeelingDates(positiveFeelingDates || {});
    setLocalFeelingNotes(feelingNotes);
    setLocalNotes(notes);
    setLocalBalancePercentage(balancePercentage);
  }, [isOpen, selectedFeelings, positiveFeelings, positiveFeelingDates, feelingNotes, notes, balancePercentage, valueName]);

  // Save all data at once when closing the sheet (both button click + backdrop/cross click)
  const handleClose = useCallback(() => {
    const latest = latestRef.current;
    onUpdate(
      latest.localSelectedFeelings,
      latest.localPositiveFeelings,
      latest.localPositiveFeelingDates,
      latest.localFeelingNotes,
      latest.localNotes,
      latest.localBalancePercentage
    );
    // Delay close slightly to avoid flicker - let state update settle first
    requestAnimationFrame(() => {
      onClose();
    });
  }, [onUpdate, onClose]);

  // Get feeling state
  const getFeelingState = useCallback((feeling: string): 'negative' | 'positive' | null => {
    const latest = latestRef.current;
    if (latest.localSelectedFeelings.includes(feeling)) return 'negative';
    if (latest.localPositiveFeelings.includes(feeling)) return 'positive';
    return null;
  }, []);

  const handleFeelingToggle = useCallback((feeling: string) => {
    const latest = latestRef.current;
    let newSelected = [...latest.localSelectedFeelings];
    let newPositive = [...latest.localPositiveFeelings];
    let newDates = { ...latest.localPositiveFeelingDates };

    const currentState = latest.localSelectedFeelings.includes(feeling) ? 'negative' : 
                         latest.localPositiveFeelings.includes(feeling) ? 'positive' : null;

    if (currentState === null) {
      newSelected = [...newSelected, feeling];
    } else if (currentState === 'negative') {
      newSelected = newSelected.filter((f) => f !== feeling);
      newPositive = [...newPositive, feeling];
      newDates[feeling] = new Date().toISOString();
    } else {
      newPositive = newPositive.filter((f) => f !== feeling);
      delete newDates[feeling];
    }

    const positiveCount = newPositive.length;
    const negativeCount = newSelected.length;
    const totalFeelings = 7;
    const balanceChangePerFeeling = 50 / totalFeelings;
    let newBalance = 50 + (positiveCount - negativeCount) * balanceChangePerFeeling;
    newBalance = Math.max(0, Math.min(100, Math.round(newBalance)));

    setLocalSelectedFeelings(newSelected);
    setLocalPositiveFeelings(newPositive);
    setLocalPositiveFeelingDates(newDates);
    setLocalBalancePercentage(newBalance);
  }, []);

  // Update local state only — save to DB happens when sheet closes (handleClose)
  const handleFeelingNoteChange = useCallback((feeling: string, note: string) => {
    setLocalFeelingNotes(prev => ({ ...prev, [feeling]: note }));
  }, []);

  const persistFeelingNote = useCallback((feeling: string, note: string) => {
    const latest = latestRef.current;
    const nextNotes = { ...latest.localFeelingNotes, [feeling]: note };
    setLocalFeelingNotes(nextNotes);
    onUpdate(
      latest.localSelectedFeelings,
      latest.localPositiveFeelings,
      latest.localPositiveFeelingDates,
      nextNotes,
      latest.localNotes,
      latest.localBalancePercentage
    );
    toast.success("تم حفظ الارتباط");
  }, [onUpdate]);

  const handleNotesChange = useCallback((value: string) => {
    setLocalNotes(value);
  }, []);

  const handleBalanceChange = useCallback((value: number[]) => {
    setLocalBalancePercentage(value[0]);
  }, []);

  const balanceColor = getBalanceColor(localBalancePercentage);

  const withAlpha = (hsl: string, alpha: number): string => {
    return hsl.startsWith("hsl(")
      ? hsl.replace("hsl(", "hsla(").replace(")", `, ${alpha})`)
      : hsl;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
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
            <div className="space-y-2">
              {FEELINGS.map((feeling) => (
                <div
                  key={feeling}
                  className="flex flex-col gap-3 p-4 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleFeelingToggle(feeling)}
                      className="relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card flex-shrink-0"
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
                    <div className="flex flex-col flex-1">
                      <Label
                        htmlFor={feeling}
                        className="text-lg font-semibold text-foreground cursor-pointer"
                        onClick={() => handleFeelingToggle(feeling)}
                      >
                        {feeling}
                      </Label>
                      {localPositiveFeelingDates[feeling] && (
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {new Date(localPositiveFeelingDates[feeling]).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full pt-2 border-t border-border/30">
                    <TaskList
                      value={localFeelingNotes[feeling] || ""}
                      onChange={(value) => handleFeelingNoteChange(feeling, value)}
                      onPersist={(value) => persistFeelingNote(feeling, value)}
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
          onClick={handleClose}
          className="fixed bottom-0 left-0 right-0 text-white bg-white/10 backdrop-blur-xl border-t border-white/20 px-8 py-4 h-16 text-lg font-semibold shadow-2xl"
        >
     حفظ
        </Button>
      </SheetContent>
    </Sheet>
  );
};