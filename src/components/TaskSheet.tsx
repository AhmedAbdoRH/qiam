import { useState, useEffect } from "react";
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

interface Behavior {
  id: string;
  name: string;
  progress: number;
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
  const [newBehaviorName, setNewBehaviorName] = useState(""); // New state for new behavior name

  useEffect(() => {
    setLocalBehaviors(behaviors);
  }, [behaviors]);

  useEffect(() => {
    setLocalOverallBalance(overallBalancePercentage);
  }, [overallBalancePercentage]);

  const handleProgressChange = (behaviorId: string, newProgress: number[]) => {
    const updatedBehaviors = localBehaviors.map((behavior) =>
      behavior.id === behaviorId ? { ...behavior, progress: newProgress[0] } : behavior
    );
    setLocalBehaviors(updatedBehaviors);
    onUpdateBehaviors(updatedBehaviors);
  };

  const handleOverallBalanceChange = (newPercentage: number[]) => {
    setLocalOverallBalance(newPercentage[0]);
    onUpdateOverallBalancePercentage(newPercentage[0]);
  };

const handleAddBehavior = () => {
    if (newBehaviorName.trim() === "") return; // Prevent adding empty behaviors

    const newBehavior: Behavior = {
      id: Math.random().toString(36).substring(2, 9), // Simple unique ID
      name: newBehaviorName,
      progress: 0,
    };

    const updatedBehaviors = [...localBehaviors, newBehavior];
    setLocalBehaviors(updatedBehaviors);
    onUpdateBehaviors(updatedBehaviors);
    setNewBehaviorName(""); // Clear input field
  };

  const handleDeleteBehavior = (behaviorId: string) => {
    const updatedBehaviors = localBehaviors.filter(behavior => behavior.id !== behaviorId);
    setLocalBehaviors(updatedBehaviors);
    onUpdateBehaviors(updatedBehaviors);
  };

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
            <div key={behavior.id} className="space-y-2 border-b pb-4 mb-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={`behavior-${behavior.id}`} className="text-lg font-semibold flex-grow text-yellow-500">
                  {behavior.name} ({behavior.progress}%)
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteBehavior(behavior.id)}
                  className="ml-2 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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