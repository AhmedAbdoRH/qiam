import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Input } from "./ui/input";

type Severity = 0 | 1 | 2 | 3;

interface Task {
  id: string;
  text: string;
  completed: boolean;
  severity: Severity;
}

const SEVERITY_BACKGROUNDS: Record<Severity, string> = {
  0: "bg-white/5 border-white/10",
  1: "bg-red-500/10 border-red-500/15",
  2: "bg-red-500/5 border-red-500/10",
  3: "bg-red-500/8 border-red-500/12",
};

interface TaskListProps {
  value: string;
  onChange: (value: string) => void;
  onPersist?: (value: string) => void;
  showAddForm?: boolean;
  onAddTask?: (text: string) => void;
}

const normalizeTask = (t: any): Task => ({
  id: t.id || String(Date.now()),
  text: t.text || "",
  completed: t.completed === true,
  severity: (t.severity !== undefined && t.severity !== null ? Number(t.severity) : 0) as Severity,
});

export const TaskList = ({ value, onChange, onPersist, showAddForm = false, onAddTask }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const tasksRef = useRef<Task[]>([]);
  const serializedRef = useRef<string>("");
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [actionMenuTaskId, setActionMenuTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setTasks([]);
      tasksRef.current = [];
      serializedRef.current = "";
      return;
    }
    const trimmedVal = value.trim();
    if (trimmedVal === serializedRef.current) return;
    let parsed: Task[] = [];
    try {
      const p = JSON.parse(value);
      if (Array.isArray(p)) parsed = p.map(normalizeTask);
      else if (p) parsed = [normalizeTask({ text: trimmedVal })];
    } catch {
      if (trimmedVal) parsed = [normalizeTask({ text: trimmedVal })];
    }
    setTasks(parsed);
    tasksRef.current = parsed;
  }, [value]);

  useEffect(() => {
    if (showAddForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddForm]);

  const save = useCallback((next: Task[]) => {
    tasksRef.current = next;
    setTasks(next);
    const serialized = JSON.stringify(next);
    serializedRef.current = serialized;
    onChange(serialized);
    onPersist?.(serialized);
  }, [onChange, onPersist]);

  const addTask = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim() === "") return;
    const current = tasksRef.current;
    const newTaskItem: Task = {
      id: String(Date.now()),
      text: newTask.trim(),
      completed: false,
      severity: 0,
    };
    save([...current, newTaskItem]);
    setNewTask("");
    onAddTask?.("");
  }, [newTask, save, onAddTask]);

  const toggleTask = useCallback((taskId: string) => {
    const current = tasksRef.current;
    save(current.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  }, [save]);

  const cycleSeverity = useCallback((taskId: string) => {
    const current = tasksRef.current;
    const next = current.map((task) => {
      if (task.id !== taskId) return task;
      const nextSev = ((task.severity + 1) % 4) as Severity;
      return { ...task, severity: nextSev };
    });
    save(next);
  }, [save]);

  const deleteTask = useCallback((taskId: string) => {
    const current = tasksRef.current;
    save(current.filter((task) => task.id !== taskId));
    setActionMenuTaskId(null);
  }, [save]);

  const startEdit = useCallback((taskId: string) => {
    const current = tasksRef.current;
    const task = current.find(t => t.id === taskId);
    if (!task) return;
    setEditingTaskId(taskId);
    setEditingText(task.text);
    setActionMenuTaskId(null);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingText.trim() === "" || !editingTaskId) return;
    const current = tasksRef.current;
    save(current.map((task) =>
      task.id === editingTaskId ? { ...task, text: editingText.trim() } : task
    ));
    setEditingTaskId(null);
    setEditingText("");
  }, [editingText, editingTaskId, save]);

  const showActionMenu = useCallback((taskId: string) => {
    setActionMenuTaskId(taskId);
  }, []);

  const startLongPress = useCallback((taskId: string) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      showActionMenu(taskId);
    }, 600);
  }, [showActionMenu]);

  const endLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback((taskId: string) => {
    startLongPress(taskId);
  }, [startLongPress]);

  const handlePointerUp = useCallback((taskId: string) => {
    endLongPress();
    if (!longPressTriggered.current) {
      cycleSeverity(taskId);
    }
    longPressTriggered.current = false;
  }, [endLongPress, cycleSeverity]);

  const handlePointerLeave = useCallback(() => {
    endLongPress();
    longPressTriggered.current = false;
  }, [endLongPress]);

  return (
    <div className="space-y-3 relative">
      {/* Centered Action Menu Modal */}
      {actionMenuTaskId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActionMenuTaskId(null)} />
          <div className="relative bg-background border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-4 min-w-[280px]">
            <p className="text-center text-lg font-semibold text-foreground mb-2">اختر إجراء</p>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-3 py-6 text-base"
              onClick={() => startEdit(actionMenuTaskId)}
            >
              <Pencil className="h-5 w-5" />
              تعديل النص
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full flex items-center gap-3 py-6 text-base"
              onClick={() => deleteTask(actionMenuTaskId)}
            >
              <Trash2 className="h-5 w-5" />
              حذف المعتقد
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setActionMenuTaskId(null)}
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={addTask} className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="أضف ارتباط..."
            className="flex-1"
          />
          <Button type="submit" size="icon" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => onAddTask?.("")}>
            <span className="text-xs">إلغاء</span>
          </Button>
        </form>
      )}

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onMouseDown={() => handlePointerDown(task.id)}
            onMouseUp={() => handlePointerUp(task.id)}
            onMouseLeave={handlePointerLeave}
            onTouchStart={() => handlePointerDown(task.id)}
            onTouchEnd={() => handlePointerUp(task.id)}
            onTouchCancel={handlePointerLeave}
            className={`flex flex-col gap-2 w-full rounded-2xl border backdrop-blur-xl p-1 shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98] hover:shadow-xl select-none ${
              task.completed 
                ? 'bg-black/30 border-white/5' 
                : SEVERITY_BACKGROUNDS[task.severity]
            }`}
          >
            {editingTaskId === task.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEdit();
                }}
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="flex-1 text-[15px] font-bold"
                  autoFocus
                />
                <Button type="submit" size="icon" variant="outline" className="h-7 w-7">
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setEditingTaskId(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-150 flex-shrink-0 mx-1 ${
                    task.completed
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/40 hover:border-muted-foreground/60'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(task.id);
                  }}
                >
                  {task.completed && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-[15px] font-bold tracking-wide transition-all duration-150 flex-1 leading-relaxed ${
                    task.completed ? "line-through text-foreground/40" : "text-foreground"
                  }`}
                >
                  {task.text}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 hover:opacity-100 transition-opacity duration-150 active:scale-95 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {!showAddForm && (
          <button
            type="button"
            onClick={() => onAddTask?.("show")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">أضف ارتباط</span>
          </button>
        )}
      </div>
    </div>
  );
};