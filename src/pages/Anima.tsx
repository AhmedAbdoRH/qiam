import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, ArrowRight, Star, Edit2, Save, X, Flame, HeartHandshake, Brain, Zap, Plus, Trash2, Copy } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, ReferenceLine } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

interface AnimaCard {
  id: string;
  title: string;
  description: string;
  emoji: string;
  order_index: number;
}

const defaultCards: AnimaCard[] = [
  { id: "1", emoji: "", title: "إشباع عاطفي", description: "", order_index: 0 },
  { id: "2", emoji: "", title: "إشباع جنسي", description: "", order_index: 1 },
  { id: "3", emoji: "", title: "قبول تام", description: "", order_index: 2 },
  { id: "4", emoji: "", title: "حب غير مشروط", description: "", order_index: 3 },
  { id: "5", emoji: "", title: "تسليم واستسلام", description: "", order_index: 4 },
  { id: "6", emoji: "", title: "رعاية حنون", description: "", order_index: 5 },
];

const Anima = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedCard, setSelectedCard] = useState<AnimaCard | null>(null);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<AnimaCard | null>(null);
  const [animaMessage, setAnimaMessage] = useState(() => localStorage.getItem("anima_message") || "");
  const [isLiked, setIsLiked] = useState(() => localStorage.getItem("anima_liked") === "true");
  const [qualityRating, setQualityRating] = useState(() => parseFloat(localStorage.getItem("anima_quality_rating") || "5.0"));
  const [isExiting, setIsExiting] = useState(false);
  const [cardMounted, setCardMounted] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isAddingWish, setIsAddingWish] = useState(false);
  const [newWish, setNewWish] = useState("");
  
  // Local Storage Keys
  const CARDS_KEY = "anima_local_cards";
  const WISHES_KEY = "anima_local_wishes";
  const RATING_KEY = "anima_quality_rating";

  const [localCards, setLocalCards] = useState<AnimaCard[]>(() => {
    const saved = localStorage.getItem(CARDS_KEY);
    return saved ? JSON.parse(saved) : defaultCards;
  });

  const [localWishes, setLocalWishes] = useState<{id: string, title: string}[]>(() => {
    const saved = localStorage.getItem(WISHES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(CARDS_KEY, JSON.stringify(localCards));
  }, [localCards]);

  useEffect(() => {
    localStorage.setItem(WISHES_KEY, JSON.stringify(localWishes));
  }, [localWishes]);

  useEffect(() => {
    localStorage.setItem(RATING_KEY, qualityRating.toString());
  }, [qualityRating]);

  useEffect(() => {
    localStorage.setItem("anima_message", animaMessage);
  }, [animaMessage]);

  useEffect(() => {
    localStorage.setItem("anima_liked", isLiked.toString());
  }, [isLiked]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleHeartStart = () => {
    const timer = setTimeout(() => navigate(-1), 800);
    setLongPressTimer(timer);
  };

  const handleHeartEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Fetch milestones from Supabase (still needed for the chart)
  const { data: latestMilestones = [] } = useQuery({
    queryKey: ['latestMilestones', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('self_dialogue_messages')
        .select('*')
        .eq('user_id', user.id)
        .like('message', '%__MILESTONE__%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const [currentMilestoneIndex, setCurrentMilestoneIndex] = useState(0);

  const handleAddLocalWish = (wish: string) => {
    if (!wish.trim()) return;
    const newWishObj = { id: `wish-${Date.now()}`, title: wish.trim() };
    setLocalWishes(prev => [newWishObj, ...prev]);
    setNewWish("");
    setIsAddingWish(false);
    toast.success('تمت إضافة الأمنية محلياً');
  };

  const handleDeleteLocalWish = (id: string) => {
    setLocalWishes(prev => prev.filter(w => w.id !== id));
    toast.success('تم حذف الأمنية');
  };

  const handleSaveCard = (card: AnimaCard) => {
    if (card.id.startsWith('temp-')) {
      setLocalCards(prev => [...prev, { ...card, id: `card-${Date.now()}` }]);
    } else {
      setLocalCards(prev => prev.map(c => c.id === card.id ? card : c));
    }
    setIsEditingCard(false);
    setSelectedCard(null);
    toast.success('تم حفظ التعديلات محلياً');
  };

  const handleDeleteCard = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
      setLocalCards(prev => prev.filter(c => c.id !== id));
      setIsEditingCard(false);
      setSelectedCard(null);
      toast.success('تم حذف البطاقة');
    }
  };

  const parseMilestone = (msg: string) => {
    const content = msg.replace('__MILESTONE__', '');
    const parts = content.split('|');
    return {
      title: parts[0] || 'جماع',
      rating: parts[1] || '0',
      notes: parts[2] || '',
      type: parts[3] || 'normal',
      intention: parts[4] || ''
    };
  };

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'sacred': return <Flame className="w-4 h-4 text-amber-400" />;
      case 'heart': return <HeartHandshake className="w-4 h-4 text-pink-400" />;
      case 'imaginary': return <Brain className="w-4 h-4 text-purple-400" />;
      default: return <Zap className="w-4 h-4 text-blue-400" />;
    }
  };

  useEffect(() => {
    if (latestMilestones.length === 0) return;
    const interval = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentMilestoneIndex((prev) => (prev + 1) % latestMilestones.length);
        setIsExiting(false);
      }, 3000);
    }, 14000);
    return () => clearInterval(interval);
  }, [latestMilestones.length]);

  useEffect(() => {
    setCardMounted(false);
    const timer = setTimeout(() => setCardMounted(true), 50);
    return () => clearTimeout(timer);
  }, [currentMilestoneIndex]);

  return (
    <div className="min-h-screen bg-[#0a0508] text-white overflow-x-hidden font-sans selection:bg-pink-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 pt-12 pb-24 flex flex-col items-center">
        {/* Breathing Logo */}
        <div 
          className="relative mb-12 cursor-pointer group"
          onMouseDown={handleHeartStart}
          onMouseUp={handleHeartEnd}
          onMouseLeave={handleHeartEnd}
          onTouchStart={handleHeartStart}
          onTouchEnd={handleHeartEnd}
        >
          <div className="absolute inset-0 bg-pink-500/20 blur-2xl rounded-full anima-pulse-slow" />
          <div className="relative w-24 h-24 flex items-center justify-center bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl transition-transform duration-700 group-hover:scale-110">
            <Heart className="w-10 h-10 text-pink-500 fill-pink-500/20 anima-pulse-slow" />
          </div>
        </div>

        {/* Anima Message Card */}
        <div className="w-full mb-12 group">
          <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl transition-all duration-500 hover:bg-white/10 hover:border-pink-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-[11px] font-bold tracking-widest text-pink-300/80 uppercase">رسالة من الأنيما</span>
              </div>
              <button 
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2 rounded-full transition-all duration-500 ${isLiked ? 'bg-pink-500/20 text-pink-500 scale-110' : 'bg-white/5 text-white/20 hover:text-pink-400'}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
            <Textarea 
              value={animaMessage}
              onChange={(e) => setAnimaMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="w-full bg-transparent border-none text-white text-right placeholder:text-white/10 focus:ring-0 resize-none min-h-[100px] text-sm leading-relaxed"
              dir="rtl"
            />
          </div>
        </div>

        {/* Milestones Carousel */}
        {latestMilestones.length > 0 && (
          <div className="w-full mb-12 h-[120px]">
            {(() => {
              const milestone = parseMilestone(latestMilestones[currentMilestoneIndex].message);
              const date = new Date(latestMilestones[currentMilestoneIndex].created_at);
              const timeDiff = date.toLocaleDateString('ar-EG', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
              
              return (
                <div 
                  key={currentMilestoneIndex}
                  className={`relative overflow-hidden rounded-lg bg-gradient-to-br from-pink-600/15 via-rose-500/12 to-orange-500/8 backdrop-blur-lg border border-pink-400/20 text-right group`}
                  style={{ 
                    opacity: !isExiting && cardMounted ? 1 : 0,
                    transition: 'opacity 3000ms ease-in-out'
                  }}
                  dir="rtl"
                >
                  <div className="relative p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          {getMilestoneIcon(milestone.type)}
                          <h3 className="text-sm font-bold text-white leading-tight">{milestone.title}</h3>
                        </div>
                        <p className="text-[11px] text-pink-200 mt-0.5">{timeDiff}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-black text-transparent bg-gradient-to-r from-pink-300 to-rose-400 bg-clip-text leading-none">
                          {milestone.rating}
                        </span>
                      </div>
                    </div>
                    {milestone.intention && (
                      <div className="pt-1.5 border-t border-white/20">
                        <p className="text-xs text-white/85 leading-relaxed font-medium">{milestone.intention}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {localCards.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setSelectedCard(item)}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-pink-400/30 transition-all duration-500 group cursor-pointer text-center anima-float-card"
              style={{ animationDelay: `${i * 0.5}s` }}
              dir="rtl"
            >
              <h3 className="text-[13px] font-medium text-pink-100/90 group-hover:text-white transition-colors">{item.title}</h3>
            </button>
          ))}
        </div>
        
        {/* Add New Card Button */}
        <div className="mt-4 w-full">
          <button
            onClick={() => {
              setEditingCard({ id: `temp-${Date.now()}`, emoji: "✨", title: "بطاقة جديدة", description: "", order_index: localCards.length });
              setIsEditingCard(true);
            }}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all duration-500 group cursor-pointer text-center"
            dir="rtl"
          >
            <Plus className="w-5 h-5 text-white/40 group-hover:text-white/60" />
            <span className="text-sm font-medium text-white/40 group-hover:text-white/60">إضافة بطاقة</span>
          </button>
        </div>

        {/* Anima Wishes Section */}
        <div className="mt-16 w-full">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
              <h2 className="text-lg font-bold text-pink-100">أمنيات الأنيما مني</h2>
            </div>
            <button onClick={() => setIsAddingWish(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-pink-300 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {localWishes.map((wish) => (
              <div key={wish.id} className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/10 hover:border-pink-500/30" dir="rtl">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-white/90 leading-relaxed flex-1">{wish.title}</p>
                  <button onClick={() => handleDeleteLocalWish(wish.id)} className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Section */}
        {latestMilestones.length > 1 && (
          <div className="mt-20 w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...latestMilestones].reverse().slice(6).map((m, i) => {
                const milestone = parseMilestone(m.message);
                return { 
                  val: parseFloat(milestone.rating) || 0,
                  date: new Date(m.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
                  title: milestone.title,
                  intention: milestone.intention,
                  notes: milestone.notes,
                  id: i 
                };
              })}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(244, 114, 182, 0.1)" />
                    <stop offset="100%" stopColor="rgba(244, 114, 182, 0.8)" />
                  </linearGradient>
                </defs>
                <YAxis hide domain={[0, 12]} />
                <XAxis hide />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-xl text-[10px] text-pink-100 shadow-2xl max-w-[200px] flex flex-col gap-1.5" dir="rtl">
                        <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-1">
                          <span className="font-bold text-pink-300">{data.title}</span>
                          <span className="text-[9px] text-white/40">{data.date}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">التقييم:</span>
                          <span className="font-bold text-white">{data.val}</span>
                        </div>
                        {data.intention && <div className="text-white/80 mt-1 border-t border-white/5 pt-1">النية: {data.intention}</div>}
                        {data.notes && <div className="text-white/40 italic mt-0.5">ملاحظات: {data.notes}</div>}
                      </div>
                    );
                  }
                  return null;
                }} />
                <ReferenceLine y={10} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="val" stroke="url(#lineGradient)" strokeWidth={3} dot={{ r: 4, fill: '#db2777', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#f472b6', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quality Rating Slider */}
        <div className="mt-12 w-full max-w-xs">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="text-[11px] font-bold tracking-widest text-white/30 uppercase">توازن الأنيما</span>
            <span className="text-lg font-black text-pink-500">{qualityRating.toFixed(1)}</span>
          </div>
          <Slider 
            value={[qualityRating]} 
            onValueChange={([v]) => setQualityRating(v)} 
            max={10} 
            step={0.1} 
            className="w-full" 
          />
        </div>
      </div>

      {/* Edit Card Sheet */}
      <Sheet open={!!selectedCard || isEditingCard} onOpenChange={(open) => { if (!open) { setSelectedCard(null); setIsEditingCard(false); setEditingCard(null); } }}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl bg-black/95 backdrop-blur-2xl border-t border-white/10">
          <SheetHeader className="text-right px-6 pt-6 pb-4" dir="rtl">
            <SheetTitle className="text-xl font-bold">تعديل البطاقة</SheetTitle>
          </SheetHeader>
          <div className="px-6 py-4 space-y-4">
            <Input 
              value={editingCard?.title || selectedCard?.title || ""} 
              onChange={(e) => {
                if (selectedCard) setSelectedCard({ ...selectedCard, title: e.target.value });
                if (editingCard) setEditingCard({ ...editingCard, title: e.target.value });
              }}
              placeholder="عنوان البطاقة"
              className="bg-white/5 border-white/10 text-white text-right"
              dir="rtl"
            />
          </div>
          <SheetFooter className="px-6 pb-8 gap-3">
            <Button variant="ghost" onClick={() => { setSelectedCard(null); setIsEditingCard(false); }} className="flex-1 text-white/50">إلغاء</Button>
            <Button onClick={() => handleSaveCard((editingCard || selectedCard)!)} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white">حفظ</Button>
            {(selectedCard || editingCard) && !editingCard?.id.startsWith('temp-') && (
              <Button variant="destructive" onClick={() => handleDeleteCard((selectedCard || editingCard)!.id)} className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30">حذف</Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <style>{`
        @keyframes anima-pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .anima-pulse-slow { animation: anima-pulse-slow 6s ease-in-out infinite; }
        @keyframes anima-float-card {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .anima-float-card { animation: anima-float-card 8s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Anima;
