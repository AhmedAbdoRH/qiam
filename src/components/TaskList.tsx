import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "./ui/input";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface TaskListProps {
  value: string;
  onChange: (value: string) => void;
}

export const TaskList = ({ value, onChange }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const lastSerializedValue = useRef<string | null>(null);

  const areTasksEqual = (a: Task[], b: Task[]) => {
    if (a.length !== b.length) return false;
    return a.every((task, index) => {
      const other = b[index];
      return (
        !!other &&
        task.id === other.id &&
        task.text === other.text &&
        task.completed === other.completed
      );
    });
  };

  // Parse tasks from the value string on initial load
  useEffect(() => {
    if (value === lastSerializedValue.current) {
      return;
    }

    lastSerializedValue.current = value;

    if (!value) {
      if (tasks.length) {
        setTasks([]);
      }
      return;
    }

    try {
      const parsedTasks = JSON.parse(value);
      if (Array.isArray(parsedTasks)) {
        if (!areTasksEqual(parsedTasks, tasks)) {
          setTasks(parsedTasks as Task[]);
        }
        return;
      }
    } catch (e) {
      // If parsing fails, treat the entire value as a single task
      if (value.trim() !== "") {
        const fallbackTask: Task[] = [{ id: Date.now().toString(), text: value, completed: false }];
        if (!areTasksEqual(fallbackTask, tasks)) {
          setTasks(fallbackTask);
        }
      }
      return;
    }

    // If value is not valid JSON array and empty, ensure tasks cleared
    if (tasks.length) {
      setTasks([]);
    }
  }, [value, tasks]);

  // Update the parent's value when tasks change
  useEffect(() => {
    const serialized = JSON.stringify(tasks);
    if (serialized === lastSerializedValue.current) {
      return;
    }

    lastSerializedValue.current = serialized;
    onChange(serialized);
  }, [tasks, onChange]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim() === "") return;
    
    setTasks([...tasks, { id: Date.now().toString(), text: newTask, completed: false }]);
    setNewTask("");
  };

  const toggleTask = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  return (
    <div className="space-y-2 mt-2">
      <form onSubmit={addTask} className="flex gap-2">
        <Input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="أضف ارتباط..."
          className="flex-1"
        />
        <Button type="submit" size="icon" variant="outline">
          <span className="text-xs">إضافة</span>
        </Button>
      </form>

      <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/30 group"
          >
            <div 
              className="flex items-center gap-2 flex-1 cursor-pointer"
              onClick={() => toggleTask(task.id)}
            >
              <span className="text-muted-foreground/70 mr-1">•</span>
              <span
                className={`text-sm ${
                  task.completed ? "line-through text-muted-foreground/80" : "text-foreground"
                }`}
              >
                {task.text}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(task.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

