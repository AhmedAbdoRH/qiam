import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRelationshipCards, RelationshipLevel } from "@/hooks/useRelationshipCards";
import { RelationshipCardComponent } from "@/components/RelationshipCard";
import { Plus, X, Users, Heart, Sparkles } from "lucide-react";

const LEVELS: RelationshipLevel[] = ["A+", "A", "B", "C"];

const levelConfig: Record<RelationshipLevel, { label: string; desc: string; color: string }> = {
  "A+": { label: "A+", desc: "أقرب الناس إليك", color: "text-amber-300 border-amber-400/40 bg-amber-400/10" },
  "A":  { label: "A",  desc: "علاقة وثيقة",     color: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" },
  "B":  { label: "B",  desc: "علاقة جيدة",       color: "text-blue-300 border-blue-400/40 bg-blue-400/10" },
  "C":  { label: "C",  desc: "معرفة",             color: "text-slate-300 border-slate-400/40 bg-slate-400/10" },
};

const Relationships = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { cards, loading: cardsLoading, addCard, updateCard, deleteCard, addTask, toggleTask, deleteTask, moveCard, uploadAvatar, removeAvatar } =
    useRelationshipCards();

  const [fabOpen, setFabOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newMessenger, setNewMessenger] = useState("");
  const [newLevel, setNewLevel] = useState<RelationshipLevel>("A");

  // Auth redirect
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addCard({
      name: newName.trim(),
      contact_phone: newPhone.trim() || undefined,
      contact_messenger: newMessenger.trim() || undefined,
      level: newLevel,
    });
    setNewName("");
    setNewPhone("");
    setNewMessenger("");
    setNewLevel("A");
    setFabOpen(false);
  };

  if (loading || cardsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
          <p className="text-white/40 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const cardsByLevel: Record<RelationshipLevel, typeof cards> = {
    "A+": cards.filter((c) => c.level === "A+")
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    "A":  cards.filter((c) => c.level === "A")
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    "B":  cards.filter((c) => c.level === "B")
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    "C":  cards.filter((c) => c.level === "C")
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">

      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-amber-500/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] left-[-15%] w-80 h-80 bg-blue-500/5 rounded-full blur-[80px]" />
        <div className="absolute top-[40%] left-[40%] w-64 h-64 bg-emerald-500/4 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pt-6 pb-32">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">العلاقات</h1>
              <p className="text-white/40 text-xs mt-0.5">
                {cards.length} {cards.length === 1 ? "شخص" : "أشخاص"} في دائرتك
              </p>
            </div>
          </div>

          {/* Level summary pills */}
          {cards.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {LEVELS.map((lvl) => {
                const count = cardsByLevel[lvl].length;
                if (count === 0) return null;
                const cfg = levelConfig[lvl];
                return (
                  <span
                    key={lvl}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${cfg.color}`}
                  >
                    <span className="font-black">{lvl}</span>
                    <span className="opacity-70">·</span>
                    <span>{count}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty state */}
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
              <Users className="w-9 h-9 text-white/20" />
            </div>
            <h3 className="text-white/50 font-semibold text-base mb-2">لا توجد علاقات بعد</h3>
            <p className="text-white/25 text-sm max-w-[220px]">
              اضغط على زر + لإضافة أول شخص في دائرتك
            </p>
            <div className="flex items-center gap-1 mt-4 text-white/20 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ابدأ بالأقرب إليك</span>
            </div>
          </div>
        )}

        {/* Cards grouped by level */}
        {LEVELS.map((level) => {
          const group = cardsByLevel[level];
          if (group.length === 0) return null;
          const cfg = levelConfig[level];

          return (
            <div key={level} className="mb-8">
              {/* Group header */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-white/30 text-xs">{cfg.desc}</span>
                <div className="flex-1 h-px bg-white/6" />
                <span className="text-white/20 text-xs">{group.length}</span>
              </div>

              {/* Cards grid */}
              <div className="space-y-3">
                {group.map((card, idx) => (
                  <RelationshipCardComponent
                    key={card.id}
                    card={card}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < group.length - 1}
                    onDelete={deleteCard}
                    onUpdateCard={updateCard}
                    onAddTask={addTask}
                    onToggleTask={toggleTask}
                    onDeleteTask={deleteTask}
                    onMove={moveCard}
                    onUploadAvatar={uploadAvatar}
                    onRemoveAvatar={removeAvatar}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB Modal Overlay */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setFabOpen(false); }}
        >
          <div className="w-full max-w-lg mx-4 mb-6 rounded-3xl bg-[#0c0c0f]/95 border border-white/12 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <h2 className="text-white font-semibold text-base">إضافة شخص جديد</h2>
              </div>
              <button
                onClick={() => setFabOpen(false)}
                className="p-1.5 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-4 space-y-4">

              {/* Name */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-1.5 block">الاسم *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  placeholder="اسم الشخص..."
                  className="w-full px-3.5 py-3 rounded-xl bg-white/5 border border-white/12 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-1.5 block">رقم الهاتف</label>
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="للاتصال والواتساب..."
                  type="tel"
                  className="w-full px-3.5 py-3 rounded-xl bg-white/5 border border-white/12 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Messenger */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-1.5 block">Messenger</label>
                <input
                  value={newMessenger}
                  onChange={(e) => setNewMessenger(e.target.value)}
                  placeholder="اسم المستخدم أو الرابط..."
                  className="w-full px-3.5 py-3 rounded-xl bg-white/5 border border-white/12 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Level selector */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-2 block">مستوى العلاقة</label>
                <div className="grid grid-cols-4 gap-2">
                  {LEVELS.map((lvl) => {
                    const cfg = levelConfig[lvl];
                    return (
                      <button
                        key={lvl}
                        onClick={() => setNewLevel(lvl)}
                        className={`
                          py-3 rounded-xl border text-sm font-black transition-all duration-200
                          ${newLevel === lvl
                            ? `${cfg.color} scale-105 shadow-lg`
                            : "bg-white/4 border-white/10 text-white/40 hover:bg-white/8"
                          }
                        `}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
                <p className="text-white/25 text-xs mt-1.5 text-center">
                  {levelConfig[newLevel].desc}
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-5 pb-5">
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                إضافة للدائرة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button — bottom left (RTL = يسار = شمال) */}
      <button
        onClick={() => setFabOpen(true)}
        className="
          fixed bottom-24 left-5 z-50
          w-14 h-14 rounded-full
          bg-white/10 hover:bg-white/15 active:bg-white/20
          border border-white/20 hover:border-white/35
          backdrop-blur-xl
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          flex items-center justify-center
          transition-all duration-300
          hover:scale-110 active:scale-95
          group
        "
        aria-label="إضافة شخص جديد"
      >
        <Plus
          className="w-6 h-6 text-white transition-transform duration-300 group-hover:rotate-90"
        />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-30" />
      </button>
    </div>
  );
};

export default Relationships;
