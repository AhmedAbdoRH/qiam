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
  onPersist?: (value: string) => void;
}

export const TaskList = ({ value, onChange, onPersist }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const lastSerialized = useRef<string>("");

  // Parse tasks from the value string when it changes externally
  useEffect(() => {
    if (value === lastSerialized.current) return;
    if (!value) {
      setTasks([]);
      lastSerialized.current = "";
      return;
    }
    try {
      const parsedTasks = JSON.parse(value);
      if (Array.isArray(parsedTasks)) {
        setTasks(parsedTasks);
      } else if (value.trim() !== "") {
        setTasks([{ id: Date.now().toString(), text: value, completed: false }]);
      }
    } catch {
      if (value.trim() !== "") {
        setTasks([{ id: Date.now().toString(), text: value, completed: false }]);
      }
    }
    lastSerialized.current = value;
  }, [value]);

  const updateTasks = (next: Task[], persist = false) => {
    setTasks(next);
    const serialized = JSON.stringify(next);
    lastSerialized.current = serialized;
    onChange(serialized);
    if (persist) onPersist?.(serialized);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim() === "") return;
    updateTasks([...tasks, { id: Date.now().toString(), text: newTask, completed: false }], true);
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
