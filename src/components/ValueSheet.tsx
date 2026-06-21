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
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Save, StickyNote, X, Download } from "lucide-react";
import { Pin, PinOff } from "lucide-react";
import { FEELINGS, ValueData } from "@/types/value";
import { getBalanceColor } from "@/utils/balanceCalculator";
import { TaskList } from "./TaskList";
import { Plus } from "lucide-react";

interface ValueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  valueName: string;
  feelingsBeingHealed: string[];
  feelingsHealed?: string[];
  feelingsHealedDates?: Record<string, string>;
  beliefs: Record<string, string>;
  notes: string;
  balancePercentage: number;
  onUpdate: (feelingsBeingHealed: string[], feelingsHealed: string[], feelingsHealedDates: Record<string, string>, beliefs: Record<string, string>, notes: string, balancePercentage: number) => void;
  valueId?: string;
  isPinned?: boolean;
  onTogglePin?: () => void;
  valueData?: ValueData;
}

export const ValueSheet = ({
  isOpen,
  onClose,
  valueName,
  feelingsBeingHealed,
  feelingsHealed = [],
  feelingsHealedDates = {},
  beliefs,
  notes,
  balancePercentage,
  onUpdate,
  valueId,
  isPinned = false,
  onTogglePin,
  valueData,
}: ValueSheetProps) => {
  const [localFeelingsBeingHealed, setLocalFeelingsBeingHealed] = useState<string[]>(feelingsBeingHealed);
  const [localFeelingsHealed, setLocalFeelingsHealed] = useState<string[]>(feelingsHealed);
  const [localFeelingsHealedDates, setLocalFeelingsHealedDates] = useState<Record<string, string>>(feelingsHealedDates);
  const [localBeliefs, setLocalBeliefs] = useState<Record<string, string>>(beliefs);
  const [localNotes, setLocalNotes] = useState(notes);
  const [localBalancePercentage, setLocalBalancePercentage] = useState(balancePercentage);
  const [activeAddFeeling, setActiveAddFeeling] = useState<string | null>(null);
  const [showNotesForm, setShowNotesForm] = useState(false);

  // Ref to track latest state for callbacks
  const latestRef = useRef({
    localFeelingsBeingHealed,
    localFeelingsHealed,
    localFeelingsHealedDates,
    localBeliefs,
    localNotes,
    localBalancePercentage,
  });
  latestRef.current = {
    localFeelingsBeingHealed,
    localFeelingsHealed,
    localFeelingsHealedDates,
    localBeliefs,
    localNotes,
    localBalancePercentage,
  };

  useEffect(() => {
    setLocalFeelingsBeingHealed(feelingsBeingHealed);
    setLocalFeelingsHealed(feelingsHealed || []);
    setLocalFeelingsHealedDates(feelingsHealedDates || {});
    setLocalBeliefs(beliefs);
    setLocalNotes(notes);
    setLocalBalancePercentage(balancePercentage);
  }, [isOpen, feelingsBeingHealed, feelingsHealed, feelingsHealedDates, beliefs, notes, balancePercentage, valueName]);

  // Save all data at once when closing the sheet (both button click + backdrop/cross click)
  const handleClose = useCallback(() => {
    const latest = latestRef.current;
    onUpdate(
      latest.localFeelingsBeingHealed,
      latest.localFeelingsHealed,
      latest.localFeelingsHealedDates,
      latest.localBeliefs,
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
    if (latest.localFeelingsBeingHealed.includes(feeling)) return 'negative';
    if (latest.localFeelingsHealed.includes(feeling)) return 'positive';
    return null;
  }, []);

  const handleFeelingToggle = useCallback((feeling: string) => {
    const latest = latestRef.current;
    let newBeingHealed = [...latest.localFeelingsBeingHealed];
    let newHealed = [...latest.localFeelingsHealed];
    let newDates = { ...latest.localFeelingsHealedDates };

    const currentState = latest.localFeelingsBeingHealed.includes(feeling) ? 'negative' : 
                         latest.localFeelingsHealed.includes(feeling) ? 'positive' : null;

    if (currentState === null) {
      newBeingHealed = [...newBeingHealed, feeling];
    } else if (currentState === 'negative') {
      newBeingHealed = newBeingHealed.filter((f) => f !== feeling);
      newHealed = [...newHealed, feeling];
      newDates[feeling] = new Date().toISOString();
    } else {
      newHealed = newHealed.filter((f) => f !== feeling);
      delete newDates[feeling];
    }

    const positiveCount = newHealed.length;
    const negativeCount = newBeingHealed.length;
    const totalFeelings = 7;
    const balanceChangePerFeeling = 50 / totalFeelings;
    let newBalance = 50 + (positiveCount - negativeCount) * balanceChangePerFeeling;
    newBalance = Math.max(0, Math.min(100, Math.round(newBalance)));

    setLocalFeelingsBeingHealed(newBeingHealed);
    setLocalFeelingsHealed(newHealed);
    setLocalFeelingsHealedDates(newDates);
    setLocalBalancePercentage(newBalance);
  }, []);

  // Update local state only — save to DB happens when sheet closes (handleClose)
  const handleFeelingNoteChange = useCallback((feeling: string, note: string) => {
    setLocalBeliefs(prev => ({ ...prev, [feeling]: note }));
  }, []);

  const persistFeelingNote = useCallback((feeling: string, note: string) => {
    const latest = latestRef.current;
    const nextBeliefs = { ...latest.localBeliefs, [feeling]: note };
    setLocalBeliefs(nextBeliefs);
    onUpdate(
      latest.localFeelingsBeingHealed,
      latest.localFeelingsHealed,
      latest.localFeelingsHealedDates,
      nextBeliefs,
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

  const handleDownloadValue = useCallback(() => {
    const source = valueData ?? {
      id: valueId ?? "",
      name: valueName,
      feelingsBeingHealed: localFeelingsBeingHealed,
      feelingsHealed: localFeelingsHealed,
      feelingsHealedDates: localFeelingsHealedDates,
      beliefs: localBeliefs,
      notes: localNotes,
      balancePercentage: localBalancePercentage,
      isPinned,
    };

    // Parse belief lists from beliefs (each value is a JSON-stringified Task[])
    const parseTasks = (raw: string) => {
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const beliefsByFeeling = FEELINGS.map((feeling) => {
      const tasks = parseTasks(source.beliefs[feeling] || "");
      const state =
        source.feelingsBeingHealed.includes(feeling)
          ? "جاري العلاج"
          : (source.feelingsHealed || []).includes(feeling)
          ? "تم علاجه"
          : "غير مُفعّل";
      return {
        feeling,
        state,
        positive_date: source.feelingsHealedDates?.[feeling] || null,
        beliefs: tasks.map((t: any) => ({
            text: t.text || "",
            severity: t.severity ?? 0,
            healed: t.healed === true || t.completed === true,
          })),
      };
    });

    const payload = {
      value_id: source.id,
      value_name: source.name,
      balance_percentage: source.balancePercentage,
      is_pinned: !!source.isPinned,
      feelings_being_healed: source.feelingsBeingHealed,
      feelings_healed: source.feelingsHealed || [],
      notes: source.notes || "",
      exported_at: new Date().toISOString(),
      beliefs_by_feeling: beliefsByFeeling,
    };

    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = source.name.replace(/\s+/g, "_");
      a.href = url;
      a.download = `value_${safeName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("تم تحميل بيانات القيمة");
    } catch (err) {
      toast.error("تعذر تحميل الملف");
      console.error(err);
    }
  }, [valueData, valueId, valueName, localFeelingsBeingHealed, localFeelingsHealed, localFeelingsHealedDates, localBeliefs, localNotes, localBalancePercentage, isPinned]);

  const balanceColor = getBalanceColor(localBalancePercentage);

  const withAlpha = (hsl: string, alpha: number): string => {
    return hsl.startsWith("hsl(")
      ? hsl.replace("hsl(", "hsla(").replace(")", `, ${alpha})`)
      : hsl;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent className="w-full md:w-[500px] lg:w-[700px] overflow-y-auto px-3">
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
        <div className="absolute top-4 right-4 z-50">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDownloadValue}
            title="تحميل كل ما يخص هذه القيمة"
            className="rounded-full bg-background/60 backdrop-blur-lg hover:bg-background/80"
          >
            <Download className="h-5 w-5 text-primary" />
          </Button>
        </div>
        <div className="space-y-6">
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
                  className="flex flex-col gap-3 rounded-lg"
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
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={feeling}
                          className="text-lg font-semibold text-foreground cursor-pointer truncate"
                          onClick={() => handleFeelingToggle(feeling)}
                        >
                          {feeling}
                        </Label>
                      </div>
                      {localFeelingsHealedDates[feeling] && (
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {new Date(localFeelingsHealedDates[feeling]).toLocaleDateString('en-US', {
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
                      value={localBeliefs[feeling] || ""}
                      onChange={(value) => handleFeelingNoteChange(feeling, value)}
                      onPersist={(value) => persistFeelingNote(feeling, value)}
                      showAddForm={activeAddFeeling === feeling}
                      onAddTask={(action) => {
                        if (action === "show") {
                          setActiveAddFeeling(feeling);
                        } else {
                          setActiveAddFeeling(null);
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="notes" className="text-lg font-semibold text-foreground">
                ملاحظات وتأملات
              </Label>
              {!localNotes && !showNotesForm && (
                <button
                  type="button"
                  onClick={() => setShowNotesForm(true)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  إضافة ملاحظة
                </button>
              )}
            </div>
            <div>
              {!localNotes && (
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={() => setShowNotesForm(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleNotesChange(e.currentTarget.textContent || "")}
                className="text-base text-foreground leading-loose whitespace-pre-wrap outline-none"
                style={{ direction: "rtl", lineHeight: "2" }}
              >
                {localNotes}
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="fixed bottom-0 left-0 right-0 md:left-[calc(50%-250px)] lg:left-[calc(50%-350px)] md:max-w-[500px] lg:max-w-[700px] text-white bg-white/10 backdrop-blur-xl border-t border-white/20 px-8 py-4 h-16 text-lg font-semibold shadow-2xl flex items-center justify-center gap-2 transition-all duration-200 hover:bg-white/15 z-50"
        >
          <Save className="h-5 w-5" />
          حفظ
        </button>
      </SheetContent>
    </Sheet>
  );
};
