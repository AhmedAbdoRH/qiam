import React, { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SubTask {
  id: string;
  name: string;
  progress: number;
}

interface Behavior {
  id: string;
  name: string;
  progress: number;
  subTasks?: SubTask[];
}

interface TaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  valueName: string; // The behavioral value this task sheet is associated with
  behaviors: Behavior[];
  onUpdateBehaviors: (updatedBehaviors: Behavior[]) => void;
  overallBalancePercentage: number; // New prop for overall balance
  onUpdateOverallBalancePercentage: (newPercentage: number) => void; // New prop for updating overall balance
}

const getProgressBarColorClass = (percentage: number) => {
  if (percentage < 20) {
    return "bg-balance-low";
  } else if (percentage < 40) {
    return "bg-balance-medium";
  } else {
    return "bg-balance-high";
  }
};

export const TaskSheet = ({
  isOpen,
  onClose,
  valueName,
  behaviors,
  onUpdateBehaviors,
  overallBalancePercentage,
  onUpdateOverallBalancePercentage,
}: TaskSheetProps) => {
  const [localBehaviors, setLocalBehaviors] = useState<Behavior[]>(behaviors);
  const [localOverallBalance, setLocalOverallBalance] = useState(overallBalancePercentage);
  const [newBehaviorName, setNewBehaviorName] = useState("");
  const [expandedBehaviors, setExpandedBehaviors] = useState<Set<string>>(new Set());
  const [newSubTaskNames, setNewSubTaskNames] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalBehaviors(behaviors);
  }, [behaviors]);

  useEffect(() => {
    setLocalOverallBalance(overallBalancePercentage);
  }, [overallBalancePercentage]);

  const handleProgressChange = useCallback((behaviorId: string, newProgress: number[]) => {
    const updatedBehaviors = localBehaviors.map((behavior) =>
      behavior.id === behaviorId ? { ...behavior, progress: newProgress[0] } : behavior
    );
    setLocalBehaviors(updatedBehaviors);
    onUpdateBehaviors(updatedBehaviors);
  }, [localBehaviors, onUpdateBehaviors]);

  const handleOverallBalanceChange = useCallback((newPercentage: number[]) => {
    setLocalOverallBalance(newPercentage[0]);
    onUpdateOverallBalancePercentage(newPercentage[0]);
  }, [onUpdateOverallBalancePercentage]);

  const handleAddBehavior = useCallback(() => {
    if (newBehaviorName.trim() === "") return;

    const newBehavior: Behavior = {
      id: Math.random().toString(36).substring(2, 9),
      name: newBehaviorName,
      progress: 0,
    };

    const updatedBehaviors = [...localBehaviors, newBehavior];
    setLocalBehaviors(updatedBehaviors);
    onUpdateBehaviors(updatedBehaviors);
    setNewBehaviorName("");
  }, [newBehaviorName, localBehaviors, onUpdateBehaviors]);

  const handleDeleteBehavior = useCallback((behaviorId: string) => {
    const updatedBehaviors = localBehaviors.filter(behavior => behavior.id !== behaviorId);
    setLocalBehaviors(updatedBehaviors);
    onUpdateBehaviors(updatedBehaviors);
  }, [localBehaviors, onUpdateBehaviors]);

  const toggleBehaviorExpand = useCallback((behaviorId: string) => {
    const newExpanded = new Set(expandedBehaviors);
    if (newExpanded.has(behaviorId)) {
      newExpanded.delete(behaviorId);
    } else {
      newExpanded.add(behaviorId);
    }
    setExpandedBehaviors(newExpanded);
  }, [expandedBehaviors]);

  const handleAddSubTask = useCallback((behaviorId: string) => {
    const subTaskName = newSubTaskNames[behaviorId]?.trim();
    if (!subTaskName) return;

    const newSubTask: SubTask = {
      id: Math.random().toString(36).substring(2, 9),
      name: subTaskName,
      progress: 0,
    };

    const updatedBehaviors = localBehaviors.map((behavior) =>
      behavior.id === behaviorId
        ? { ...behavior, subTasks: [...(behavior.subTasks || []), newSubTask] }
        : behavior
    );
    setLocalBehaviors(updatedBehaviors);
    onUpdateBehaviors(updatedBehaviors);
    setNewSubTaskNames({ ...newSubTaskNames, [behaviorId]: "" });
  }, [newSubTaskNames, localBehaviors, onUpdateBehaviors]);

  const handleSubTaskProgressChange = useCallback((behaviorId: string, subTaskId: string, newProgress: number[]) => {
    const updatedBehaviors = localBehaviors.map((behavior) =>
      behavior.id === behaviorId
        ? {
            ...behavior,
            subTasks: behavior.subTasks?.map((subTask) =>
              subTask.id === subTaskId ? { ...subTask, progress: newProgress[0] } : subTask
            ),
          }
        : behavior
    );
    setLocalBehaviors(updatedBehaviors);
    onUpdateBehaviors(updatedBehaviors);
  }, [localBehaviors, onUpdateBehaviors]);

  const handleDeleteSubTask = useCallback((behaviorId: string, subTaskId: string) => {
    const updatedBehaviors = localBehaviors.map((behavior) =>
      behavior.id === behaviorId
        ? {
            ...behavior,
            subTasks: behavior.subTasks?.filter((subTask) => subTask.id !== subTaskId),
          }
        : behavior
    );
    setLocalBehaviors(updatedBehaviors);
    onUpdateBehaviors(updatedBehaviors);
  }, [localBehaviors, onUpdateBehaviors]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[75vh] rounded-t-3xl bg-card border-t border-border overflow-y-auto p-0"
      >
                  {/* Overall Balance Percentage Slider */}
          <div className="space-y-2 border-b pb-4 mb-4">
            <Label htmlFor="overall-balance" className="text-lg font-semibold text-white">

            </Label>
            <Slider
              id="overall-balance"
              value={[localOverallBalance]}
              onValueChange={handleOverallBalanceChange}
              max={100}
              min={0}
              step={1}
              rangeClassName={getProgressBarColorClass(localOverallBalance)}
              className="w-full"
            />
          </div>
        <SheetHeader className="px-4 py-2">
          <SheetTitle className="text-center">سلوكيات {valueName}</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-6">



          {localBehaviors.map((behavior) => (
            <div key={behavior.id} className="space-y-3 border-b pb-6 mb-6 bg-card/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor={`behavior-${behavior.id}`} className="text-lg font-semibold flex-grow text-primary">
                  {behavior.name} ({behavior.progress}%)
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleBehaviorExpand(behavior.id)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {expandedBehaviors.has(behavior.id) ? "▼" : "◀"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteBehavior(behavior.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Slider
                id={`behavior-${behavior.id}`}
                value={[behavior.progress]}
                onValueChange={(newProgress) => handleProgressChange(behavior.id, newProgress)}
                max={100}
                min={0}
                step={1}
                rangeClassName={getProgressBarColorClass(behavior.progress)}
                className="w-full"
              />
              
              {/* Sub-tasks section */}
              {expandedBehaviors.has(behavior.id) && (
                <div className="mt-4 mr-6 space-y-3">
                  {behavior.subTasks?.map((subTask) => (
                    <div key={subTask.id} className="space-y-2 bg-background/50 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-muted-foreground flex-grow">
                          {subTask.name} ({subTask.progress}%)
                        </Label>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSubTask(behavior.id, subTask.id)}
                          className="h-6 w-6 text-destructive/70 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Slider
                        value={[subTask.progress]}
                        onValueChange={(newProgress) => handleSubTaskProgressChange(behavior.id, subTask.id, newProgress)}
                        max={100}
                        min={0}
                        step={1}
                        rangeClassName={getProgressBarColorClass(subTask.progress)}
                        className="w-full"
                      />
                    </div>
                  ))}
                  
                  {/* Add new sub-task */}
                  <div className="flex w-full items-center space-x-2 pt-2">
                    <Input
                      type="text"
                      placeholder="مهمة فرعية جديدة"
                      value={newSubTaskNames[behavior.id] || ""}
                      onChange={(e) => setNewSubTaskNames({ ...newSubTaskNames, [behavior.id]: e.target.value })}
                      className="flex-grow text-sm"
                    />
                    <Button onClick={() => handleAddSubTask(behavior.id)} size="sm">إضافة</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {/* Add new behavior section */}
          <div className="flex w-full items-center space-x-2 pt-4">
            <Input
              type="text"
              placeholder="اسم السلوك الجديد"
              value={newBehaviorName}
              onChange={(e) => setNewBehaviorName(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={handleAddBehavior}>إضافة</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
