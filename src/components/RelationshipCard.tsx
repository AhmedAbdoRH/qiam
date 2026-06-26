import { useState, useRef } from "react";
import { Phone, MessageCircle, Trash2, ChevronDown, ChevronUp, Plus, X, Check, Pencil, ArrowUp, ArrowDown, Camera, Loader2 } from "lucide-react";
import { RelationshipCard as CardType, RelationshipLevel, IhsanTask } from "@/hooks/useRelationshipCards";

interface Props {
  card: CardType;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDelete: (id: string) => void;
  onUpdateCard: (id: string, updates: Partial<Pick<CardType, "name" | "contact_phone" | "contact_messenger" | "level">>) => void;
  onAddTask: (cardId: string, title: string) => void;
  onToggleTask: (cardId: string, taskId: string) => void;
  onDeleteTask: (cardId: string, taskId: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onUploadAvatar: (cardId: string, file: File) => Promise<string | null>;
  onRemoveAvatar: (cardId: string) => void;
}

const LEVELS: RelationshipLevel[] = ["A+", "A", "B", "C"];

const levelConfig: Record<RelationshipLevel, { label: string; gradient: string; glow: string; badge: string; textColor: string }> = {
  "A+": {
    label: "A+",
    gradient: "from-amber-500/20 via-yellow-400/10 to-orange-500/5",
    glow: "shadow-[0_0_30px_rgba(251,191,36,0.15)]",
    badge: "bg-amber-400/20 border-amber-400/40 text-amber-300",
    textColor: "text-amber-300",
  },
  "A": {
    label: "A",
    gradient: "from-emerald-500/20 via-teal-400/10 to-cyan-500/5",
    glow: "shadow-[0_0_30px_rgba(52,211,153,0.15)]",
    badge: "bg-emerald-400/20 border-emerald-400/40 text-emerald-300",
    textColor: "text-emerald-300",
  },
  "B": {
    label: "B",
    gradient: "from-blue-500/20 via-indigo-400/10 to-violet-500/5",
    glow: "shadow-[0_0_30px_rgba(99,102,241,0.15)]",
    badge: "bg-blue-400/20 border-blue-400/40 text-blue-300",
    textColor: "text-blue-300",
  },
  "C": {
    label: "C",
    gradient: "from-slate-500/20 via-zinc-400/10 to-gray-500/5",
    glow: "shadow-[0_0_20px_rgba(148,163,184,0.08)]",
    badge: "bg-slate-400/20 border-slate-400/40 text-slate-300",
    textColor: "text-slate-300",
  },
};

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const RelationshipCardComponent = ({
  card,
  canMoveUp,
  canMoveDown,
  onDelete,
  onUpdateCard,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onMove,
  onUploadAvatar,
  onRemoveAvatar,
}: Props) => {
  const [tasksOpen, setTasksOpen] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [editingLevel, setEditingLevel] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(card.name);
  const [editPhone, setEditPhone] = useState(card.contact_phone || "");
  const [editMessenger, setEditMessenger] = useState(card.contact_messenger || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);

  const cfg = levelConfig[card.level];
  const completedCount = card.tasks.filter((t) => t.completed).length;
  const totalTasks = card.tasks.length;

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    onUpdateCard(card.id, {
      name: editName.trim(),
      contact_phone: editPhone.trim() || null,
      contact_messenger: editMessenger.trim() || null,
    });
    setEditMode(false);
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    onAddTask(card.id, newTask.trim());
    setNewTask("");
    setAddingTask(false);
  };

  const handlePhone = () => {
    if (card.contact_phone) window.open(`tel:${card.contact_phone}`);
  };

  const handleWhatsApp = () => {
    if (card.contact_phone) {
      const num = card.contact_phone.replace(/\D/g, "");
      window.open(`https://wa.me/${num}`);
    }
  };

  const handleMessenger = () => {
    if (card.contact_messenger) window.open(`https://m.me/${card.contact_messenger}`);
  };

  return (
    <div
      className={`
        relative rounded-2xl border border-white/10 backdrop-blur-xl
        bg-gradient-to-br ${cfg.gradient}
        ${cfg.glow}
        transition-all duration-500 ease-out
        hover:border-white/20 hover:scale-[1.02]
        group overflow-hidden cursor-pointer
      `}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Background shimmer effect */}
      <div className="absolute inset-0 bg-white/[0.02] rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent rounded-2xl pointer-events-none" />

      {/* Card content */}
      <div className="relative p-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2.5 mb-2">
          {/* Avatar + Name */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Avatar with optional image upload */}
            <div className="relative group/avatar shrink-0">
              <div
                className={`
                  w-9 h-9 rounded-lg flex items-center justify-center
                  text-xs font-bold overflow-hidden
                  ${cfg.badge} border
                `}
              >
                {card.avatar_url ? (
                  <img
                    src={card.avatar_url}
                    alt={card.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget.style.display = "none"); }}
                  />
                ) : (
                  <span>{getInitials(card.name)}</span>
                )}
              </div>
              {/* Camera button overlay */}
              {expanded && !editMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={avatarUploading}
                  className={`
                    absolute inset-0 rounded-lg flex items-center justify-center
                    bg-black/60 text-white opacity-0 group-hover/avatar:opacity-100
                    transition-opacity
                    ${avatarUploading ? "opacity-100" : ""}
                  `}
                  aria-label="تغيير الصورة"
                  title="تغيير الصورة"
                >
                  {avatarUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              {/* Remove avatar button - shown only when avatar exists and expanded */}
              {expanded && !editMode && card.avatar_url && !avatarUploading && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveAvatar(card.id); }}
                  className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity shadow-lg"
                  aria-label="حذف الصورة"
                  title="حذف الصورة"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAvatarUploading(true);
                  try {
                    await onUploadAvatar(card.id, file);
                  } finally {
                    setAvatarUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              {editMode ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    placeholder="الاسم"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-semibold focus:outline-none focus:border-white/40"
                  />
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="رقم الهاتف"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs focus:outline-none focus:border-white/40"
                  />
                  <input
                    value={editMessenger}
                    onChange={(e) => setEditMessenger(e.target.value)}
                    placeholder="Messenger (اسم أو رابط)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs focus:outline-none focus:border-white/40"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                      className="flex-1 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-all"
                    >
                      حفظ
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditMode(false); }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 text-xs transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-white font-semibold text-sm truncate">{card.name}</p>
                  {(card.contact_phone || card.contact_messenger) && (
                    <p className="text-white/40 text-xs truncate mt-0.5">
                      {card.contact_phone || card.contact_messenger}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Collapsed view: show contact icons instead of level/control buttons */}
            {!expanded && !editMode && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handlePhone(); }}
                  disabled={!card.contact_phone}
                  className="p-2 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/15 transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white/50"
                  aria-label="اتصال"
                  title="اتصال"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleMessenger(); }}
                  disabled={!card.contact_messenger}
                  className="p-2 rounded-lg text-blue-300/70 hover:text-blue-200 hover:bg-blue-500/15 transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-blue-300/70"
                  aria-label="Messenger"
                  title="Messenger"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleWhatsApp(); }}
                  disabled={!card.contact_phone}
                  className="p-2 rounded-lg text-green-300/70 hover:text-green-200 hover:bg-green-500/15 transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-green-300/70"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.564 4.14 1.546 5.868L0 24l6.293-1.52A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 01-5.025-1.37l-.36-.213-3.735.902.944-3.632-.236-.375A9.844 9.844 0 012.118 12C2.118 6.52 6.52 2.118 12 2.118S21.882 6.52 21.882 12 17.48 21.882 12 21.882z"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Expanded view: show level badge */}
            {expanded && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingLevel(!editingLevel); }}
                  className={`
                    px-2.5 py-1 rounded-lg border text-xs font-black tracking-wide
                    ${cfg.badge} transition-all hover:scale-105 active:scale-95
                  `}
                >
                  {card.level}
                </button>
                {editingLevel && (
                  <div className="absolute top-full left-0 mt-1 z-20 flex flex-col gap-1 p-1.5 rounded-xl bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl">
                    {LEVELS.map((lvl) => {
                      const c = levelConfig[lvl];
                      return (
                        <button
                          key={lvl}
                          onClick={(e) => { e.stopPropagation(); onUpdateCard(card.id, { level: lvl }); setEditingLevel(false); }}
                          className={`
                            px-4 py-1.5 rounded-lg text-xs font-black border
                            ${c.badge} hover:scale-105 transition-all
                            ${card.level === lvl ? "ring-1 ring-white/30" : ""}
                          `}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Move up/down buttons (vertical stack) - shown only when expanded */}
            {expanded && !editMode && (
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onMove(card.id, "up"); }}
                  disabled={!canMoveUp}
                  className="p-1 rounded-md text-white/30 hover:text-white/80 hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white/30"
                  aria-label="نقل للأعلى"
                  title="نقل للأعلى"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMove(card.id, "down"); }}
                  disabled={!canMoveDown}
                  className="p-1 rounded-md text-white/30 hover:text-white/80 hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white/30"
                  aria-label="نقل للأسفل"
                  title="نقل للأسفل"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Edit button - shown only when expanded */}
            {expanded && !editMode && (
              <button
                onClick={(e) => { e.stopPropagation(); 
                  setEditName(card.name);
                  setEditPhone(card.contact_phone || "");
                  setEditMessenger(card.contact_messenger || "");
                  setEditMode(true);
                }}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}

            {/* Delete - shown only when expanded */}
            {expanded && confirmDelete ? (
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                  className="p-1.5 rounded-lg bg-red-500/30 border border-red-500/50 text-red-300 hover:bg-red-500/50 transition-all text-xs"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                  className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : expanded ? (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Conditional body - only shown when expanded */}
        {expanded && (
          <>
            {/* Contact Buttons */}
            {!editMode && (
              <div className="flex gap-1.5 mb-2">
                <button
                  onClick={handlePhone}
                  disabled={!card.contact_phone}
                  className={`
                    flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg
                    border text-xs font-medium transition-all duration-200
                    ${card.contact_phone
                      ? "bg-white/5 border-white/15 text-white/80 hover:bg-white/12 hover:border-white/25 active:scale-95"
                      : "bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed"
                    }
                  `}
                >
                  <Phone className="w-3 h-3" />
                  <span>اتصال</span>
                </button>

                <button
                  onClick={handleMessenger}
                  disabled={!card.contact_messenger}
                  className={`
                    flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg
                    border text-xs font-medium transition-all duration-200
                    ${card.contact_messenger
                      ? "bg-blue-500/10 border-blue-500/25 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/40 active:scale-95"
                      : "bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed"
                    }
                  `}
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>Messenger</span>
                </button>

                <button
                  onClick={handleWhatsApp}
                  disabled={!card.contact_phone}
                  className={`
                    flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg
                    border text-xs font-medium transition-all duration-200
                    ${card.contact_phone
                      ? "bg-green-500/10 border-green-500/25 text-green-300 hover:bg-green-500/20 hover:border-green-500/40 active:scale-95"
                      : "bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed"
                    }
                  `}
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.564 4.14 1.546 5.868L0 24l6.293-1.52A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 01-5.025-1.37l-.36-.213-3.735.902.944-3.632-.236-.375A9.844 9.844 0 012.118 12C2.118 6.52 6.52 2.118 12 2.118S21.882 6.52 21.882 12 17.48 21.882 12 21.882z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>
              </div>
            )}

            {/* Ihsan Tasks Section */}
            {!editMode && (
              <div className="border-t border-white/8 pt-2">
                <button
                  onClick={() => setTasksOpen(!tasksOpen)}
                  className="w-full flex items-center justify-between group/tasks py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white/60 group-hover/tasks:text-white/80 transition-colors">
                      مهام الإحسان
                    </span>
                    {totalTasks > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.badge} font-medium`}>
                        {completedCount}/{totalTasks}
                      </span>
                    )}
                  </div>
                  {tasksOpen
                    ? <ChevronUp className="w-3 h-3 text-white/40" />
                    : <ChevronDown className="w-3 h-3 text-white/40" />
                  }
                </button>

                {/* Progress bar */}
                {totalTasks > 0 && !tasksOpen && (
                  <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${cfg.textColor.replace("text", "bg")}`}
                      style={{ width: `${(completedCount / totalTasks) * 100}%`, opacity: 0.6 }}
                    />
                  </div>
                )}

                {tasksOpen && (
                  <div className="mt-2 space-y-1.5">
                    {card.tasks.length === 0 && !addingTask && (
                      <p className="text-white/20 text-xs text-center py-2 italic">لا توجد مهام بعد</p>
                    )}

                    {card.tasks.map((task: IhsanTask) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2.5 group/task"
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleTask(card.id, task.id); }}
                          className={`
                            w-4 h-4 rounded-md border flex items-center justify-center shrink-0
                            transition-all duration-200 active:scale-90
                            ${task.completed
                              ? `${cfg.badge} border-current`
                              : "border-white/20 bg-white/5 hover:border-white/40"
                            }
                          `}
                        >
                          {task.completed && <Check className="w-2.5 h-2.5" />}
                        </button>
                        <span
                          className={`flex-1 text-xs transition-all ${
                            task.completed ? "line-through text-white/30" : "text-white/70"
                          }`}
                        >
                          {task.title}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteTask(card.id, task.id); }}
                          className="opacity-0 group-hover/task:opacity-100 text-white/20 hover:text-red-400 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {addingTask ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleAddTask(); }}
                        className="flex gap-2 mt-2"
                      >
                        <input
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          autoFocus
                          placeholder="مهمة جديدة..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white/90 text-xs placeholder:text-white/25 focus:outline-none focus:border-white/30"
                        />
                        <button
                          type="submit"
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all active:scale-95 ${cfg.badge}`}
                        >
                          إضافة
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddingTask(false); setNewTask(""); }}
                          className="px-2 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setAddingTask(true)}
                        className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mt-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>إضافة مهمة</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};