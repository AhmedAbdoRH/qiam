import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Input } from "./ui/input";

type Severity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface Task {
  id: string;
  text: string;
  healed: boolean;
  severity: Severity;
}

// 10 light red shades (all intentionally light), ramping up with severity (1-10)
const SEVERITY_BACKGROUNDS: Record<Severity, string> = {
  1: "bg-white/5 border-white/10",
  2: "bg-red-950/10 border-red-900/15",
  3: "bg-red-950/15 border-red-900/20",
  4: "bg-red-950/20 border-red-900/25",
  5: "bg-red-950/25 border-red-900/30",
  6: "bg-red-950/30 border-red-900/35",
  7: "bg-red-950/35 border-red-900/40",
  8: "bg-red-950/40 border-red-900/45",
  9: "bg-red-950/45 border-red-900/50",
  10: "bg-red-950/50 border-red-900/55",
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
  // Backward-compat: old records may carry `completed: true` instead of `healed: true`
  healed: t.healed === true || t.completed === true,
  // Clamp severity into the supported 0-9 range (old records may carry 0-4)
  severity: (Math.max(0, Math.min(9, Number(t.severity ?? 0))) as Severity),
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
      healed: false,
      severity: 0,
    };
    save([...current, newTaskItem]);
    setNewTask("");
    onAddTask?.("");
  }, [newTask, save, onAddTask]);

  const toggleTask = useCallback((taskId: string) => {
    const current = tasksRef.current;
    save(current.map((task) =>
      task.id === taskId ? { ...task, healed: !task.healed } : task
    ));
  }, [save]);

  const cycleSeverity = useCallback((taskId: string) => {
    const current = tasksRef.current;
    const next = current.map((task) => {
      if (task.id !== taskId) return task;
      // Each tap advances to the next severity level (+1), wrapping 9 -> 0.
      // SEVERITY_DISPLAY then shows it as 1 -> 2 -> 3 -> ... -> 10 -> 1.
      const nextSev = ((task.severity + 1) % 10) as Severity;
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

  const handlePointerUp = useCallback(() => {
    endLongPress();
    longPressTriggered.current = false;
  }, [endLongPress]);

  // On touch devices the browser also fires synthetic mouse events after touch.
  // The intensity circle handles its own tap; the card itself only uses long-press.
  const lastTouchRef = useRef(0);

  const handleTouchStart = useCallback((taskId: string) => {
    lastTouchRef.current = Date.now();
    handlePointerDown(taskId);
  }, [handlePointerDown]);

  const handleTouchEnd = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);

  const handleMouseDown = useCallback((taskId: string) => {
    if (Date.now() - lastTouchRef.current < 500) return; // synthetic mouse after touch
    handlePointerDown(taskId);
  }, [handlePointerDown]);

  const handleMouseUp = useCallback(() => {
    if (Date.now() - lastTouchRef.current < 500) return; // synthetic mouse after touch
    handlePointerUp();
  }, [handlePointerUp]);

  const handleMouseLeave = useCallback(() => {
    if (Date.now() - lastTouchRef.current < 500) return; // synthetic mouse after touch
    endLongPress();
    longPressTriggered.current = false;
  }, [endLongPress]);

  return (
    <div className="space-y-3 relative">
      {/* Centered Action Menu Modal */}
      {actionMenuTaskId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setActionMenuTaskId(null)}>
          <div className="relative bg-background border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-4 min-w-[280px]" onClick={(e) => e.stopPropagation()}>
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
            onMouseDown={() => handleMouseDown(task.id)}
            onMouseUp={() => handleMouseUp()}
            onMouseLeave={handleMouseLeave}
            onTouchStart={() => handleTouchStart(task.id)}
            onTouchEnd={() => handleTouchEnd()}
            onTouchCancel={handleMouseLeave}
            className={`flex flex-col gap-2 w-full rounded-2xl border backdrop-blur-xl p-1 shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98] hover:shadow-xl select-none ${
              task.healed
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
                    task.healed
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/40 hover:border-muted-foreground/60'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(task.id);
                  }}
                >
                  {task.healed && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-[15px] font-bold tracking-wide transition-all duration-150 flex-1 leading-relaxed ${
                    task.healed ? "line-through text-foreground/40" : "text-foreground"
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
                {/* Intensity indicator (top-left in RTL = end of row) — hidden when healed */}
                {!task.healed && (
                  <div
                    className="relative -m-3 p-3 rounded-full cursor-pointer touch-manipulation flex items-center justify-center"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (Date.now() - lastTouchRef.current < 500) return;
                      cycleSeverity(task.id);
                    }}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      lastTouchRef.current = Date.now();
                      cycleSeverity(task.id);
                    }}
                    onTouchEnd={(e) => e.stopPropagation()}
                    onTouchCancel={(e) => e.stopPropagation()}
                    aria-label="زيادة شدة المعتقد"
                  >
                    <span
                      className="h-8 w-8 rounded-full bg-red-900/30 border border-red-900/40 text-sm font-semibold text-red-300/90 flex items-center justify-center leading-none flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {SEVERITY_DISPLAY[task.severity]}
                    </span>
                  </div>
                )}
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