import { useState } from "react";
import { Button } from "./ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";

export interface FeelingTask {
  id: string;
  text: string;
  intensity: number; // 0.0 to 10.0
}

interface FeelingTaskListProps {
  tasks: FeelingTask[];
  onTasksChange: (tasks: FeelingTask[]) => void;
}

const getIntensityColor = (intensity: number): string => {
  // 0 = green, 10 = red
  if (intensity <= 3) {
    return "bg-green-500";
  } else if (intensity <= 5) {
    return "bg-yellow-500";
  } else if (intensity <= 7) {
    return "bg-orange-500";
  } else {
    return "bg-red-500";
  }
};

const getSliderBackground = (intensity: number): string => {
  // Create gradient based on intensity position
  const percentage = intensity * 10;
  return `linear-gradient(to right, hsl(142, 76%, 36%) 0%, hsl(48, 96%, 53%) 50%, hsl(0, 84%, 60%) 100%)`;
};

export const FeelingTaskList = ({ tasks, onTasksChange }: FeelingTaskListProps) => {
  const [newTask, setNewTask] = useState("");

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim() === "") return;
    
    const newTaskItem: FeelingTask = {
      id: Date.now().toString(),
      text: newTask,
      intensity: 5.0,
    };
    
    onTasksChange([...tasks, newTaskItem]);
    setNewTask("");
  };

  const updateIntensity = (taskId: string, intensity: number) => {
    onTasksChange(
      tasks.map((task) =>
        task.id === taskId ? { ...task, intensity } : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    onTasksChange(tasks.filter((task) => task.id !== taskId));
  };

  return (
    <div className="bg-card rounded-xl p-4 mb-6 border border-border/50 shadow-sm">
      <h3 className="text-sm font-medium text-foreground mb-3">قائمة المهام</h3>
      
      <form onSubmit={addTask} className="flex gap-2 mb-4">
        <Input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="أضف مهمة جديدة..."
          className="flex-1 text-right"
          dir="rtl"
        />
        <Button type="submit" size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          إضافة
        </Button>
      </form>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            لا توجد مهام بعد
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-background/50 rounded-lg p-3 border border-border/30"
            >
              <div className="flex items-center justify-between mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-foreground flex-1 text-right mr-2">
                  {task.text}
                </span>
              </div>
              
              <div className="flex items-center gap-3" dir="ltr">
                <span className="text-xs font-mono text-muted-foreground w-8">
                  0.0
                </span>
                <div className="flex-1 relative">
                  <div 
                    className="absolute inset-0 h-2 rounded-full opacity-30 top-1/2 -translate-y-1/2"
                    style={{
                      background: 'linear-gradient(to right, hsl(142, 76%, 36%), hsl(48, 96%, 53%), hsl(0, 84%, 60%))'
                    }}
                  />
                  <Slider
                    value={[task.intensity]}
                    onValueChange={(value) => updateIntensity(task.id, value[0])}
                    max={10}
                    min={0}
                    step={0.1}
                    className="relative z-10"
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-8">
                  10.0
                </span>
                <div className="flex items-center gap-1.5 min-w-16 justify-end">
                  <span 
                    className={`w-3 h-3 rounded-full ${getIntensityColor(task.intensity)}`}
                  />
                  <span className="text-sm font-mono font-semibold" style={{
                    color: task.intensity <= 3 ? 'hsl(142, 76%, 36%)' : 
                           task.intensity <= 5 ? 'hsl(48, 96%, 40%)' :
                           task.intensity <= 7 ? 'hsl(25, 95%, 53%)' : 
                           'hsl(0, 84%, 60%)'
                  }}>
                    {task.intensity.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
