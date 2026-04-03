import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, ArrowRight, Star, Edit2, Save, X, Flame, HeartHandshake, Brain, Zap, Plus, Trash2, ListTodo, CheckCircle2, Send } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, ReferenceLine } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface AnimaTask {
  id: string;
  title: string;
  progress: number;
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
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [selectedCard, setSelectedCard] = useState<AnimaCard | null>(null);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<AnimaCard | null>(null);
  const [animaMessage, setAnimaMessage] = useState(() => "");
  const [isLiked, setIsLiked] = useState(() => false);
  const [qualityRating, setQualityRating] = useState(5.0);
  const [isExiting, setIsExiting] = useState(false);
  const [cardMounted, setCardMounted] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [pressDuration, setPressDuration] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const [pressStartTime, setPressStartTime] = useState<number | null>(null);
  const [fadeOutTimer, setFadeOutTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [isAddingWish, setIsAddingWish] = useState(false);
  const [newWish, setNewWish] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showMilestones, setShowMilestones] = useState(true);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(false);
  const [isAddingSexualWish, setIsAddingSexualWish] = useState(false);
  const [newSexualWish, setNewSexualWish] = useState("");
  
  // Tasks State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Calendar State
  const [isAddingCalendarItem, setIsAddingCalendarItem] = useState(false);
  const [newCalendarItemTitle, setNewCalendarItemTitle] = useState("");

  const [_showSexualWishes, _setShowSexualWishes] = useState(true);
  const [sweetNotes, setSweetNotes] = useState("");
  const [newTag, setNewTag] = useState("");
  const [tagTarget, setTagTarget] = useState<{ type: 'task' | 'calendar'; id: string } | null>(null);

  // Database queries for all data
  const { data: animaMessages = [] } = useQuery({
    queryKey: ['animaMessages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('anima_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(m => ({ id: m.id, text: m.text, timestamp: new Date(m.created_at).getTime(), likes: m.likes }));
    },
    enabled: !!user
  });

  const { data: localTasks = [] } = useQuery({
    queryKey: ['animaTasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('anima_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(t => ({ id: t.id, title: t.title, progress: Number(t.progress), tags: (t as any).tags || [] }));
    },
    enabled: !!user
  });

  const { data: localCalendarItems = [] } = useQuery({
    queryKey: ['animaCalendar', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('anima_calendar')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(c => ({ id: c.id, title: c.title, progress: Number(c.progress), tags: (c as any).tags || [] }));
    },
    enabled: !!user
  });

  const { data: localWishes = [] } = useQuery({
    queryKey: ['animaWishes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('anima_wishes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(w => ({ id: w.id, title: w.title, completed: w.completed }));
    },
    enabled: !!user
  });

  const { data: localSexualWishes = [] } = useQuery({
    queryKey: ['animaSexualWishes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('anima_sexual_wishes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(w => ({ id: w.id, title: w.title, completed: w.completed }));
    },
    enabled: !!user
  });

  const { data: localCards = [] } = useQuery({
    queryKey: ['animaPageCards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('anima_page_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return (data || []).map(c => ({ id: c.id, title: c.title, description: c.description, emoji: c.emoji, order_index: c.order_index }));
    },
    enabled: !!user
  });

  // Sorted Tasks Logic (Lowest progress first)
  const sortedTasks = useMemo(() => {
    return [...localTasks].sort((a, b) => a.progress - b.progress);
  }, [localTasks]);

  // Sorted Calendar Items Logic (Lowest progress first)
  const sortedCalendarItems = useMemo(() => {
    return [...localCalendarItems].sort((a, b) => a.progress - b.progress);
  }, [localCalendarItems]);

  const handleHeartStart = () => {
    const startTime = Date.now();
    setPressStartTime(startTime);
    setIsPressing(true);
    if (fadeOutTimer) clearInterval(fadeOutTimer as unknown as number);
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setPressDuration(Math.min(elapsed / 100, 10));
    }, 50);
    setLongPressTimer(timer);
  };

  const handleHeartEnd = () => {
    if (longPressTimer) {
      clearInterval(longPressTimer as unknown as number);
      setLongPressTimer(null);
    }
    setIsPressing(false);
    setPressStartTime(null);
    
    // Fade out over 60 seconds
    const maxDuration = pressDuration;
    const fadeStartTime = Date.now();
    const fadeDuration = 60000; // 60 seconds
    
    if (fadeOutTimer) clearInterval(fadeOutTimer as unknown as number);
    const fadeTimer = setInterval(() => {
      const elapsed = Date.now() - fadeStartTime;
      const progress = Math.min(elapsed / fadeDuration, 1);
      setPressDuration(Math.max(0, maxDuration * (1 - progress)));
      
      if (progress >= 1) {
        clearInterval(fadeTimer);
        setFadeOutTimer(null);
      }
    }, 50);
    setFadeOutTimer(fadeTimer);
  };

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cleanup fade out timer on unmount
  useEffect(() => {
    return () => {
      if (fadeOutTimer) clearInterval(fadeOutTimer as unknown as number);
    };
  }, [fadeOutTimer]);

  // Database Queries (dbCards removed - using localCards from anima_page_cards)

  const { data: ratingData } = useQuery({
    queryKey: ['animaQualityRating', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('anima_quality_rating')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

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

  // Task Handlers
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !user) return;
    const { error } = await supabase.from('anima_tasks').insert({ user_id: user.id, title: newTaskTitle.trim(), progress: 0 });
    if (error) { toast.error('خطأ في إضافة المهمة'); return; }
    queryClient.invalidateQueries({ queryKey: ['animaTasks', user.id] });
    setNewTaskTitle("");
    setIsAddingTask(false);
    toast.success('تمت إضافة المهمة');
  };

  const handleUpdateTaskProgress = async (id: string, progress: number) => {
    if (!user) return;
    await supabase.from('anima_tasks').update({ progress }).eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaTasks', user.id] });
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    await supabase.from('anima_tasks').delete().eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaTasks', user.id] });
    toast.success('تم حذف المهمة');
  };

  // Calendar Handlers
  const handleAddCalendarItem = async () => {
    if (!newCalendarItemTitle.trim() || !user) return;
    const { error } = await supabase.from('anima_calendar').insert({ user_id: user.id, title: newCalendarItemTitle.trim(), progress: 0 });
    if (error) { toast.error('خطأ في إضافة عنصر التقويم'); return; }
    queryClient.invalidateQueries({ queryKey: ['animaCalendar', user.id] });
    setNewCalendarItemTitle("");
    setIsAddingCalendarItem(false);
    toast.success('تمت إضافة عنصر التقويم');
  };

  const handleUpdateCalendarProgress = async (id: string, progress: number) => {
    if (!user) return;
    await supabase.from('anima_calendar').update({ progress }).eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaCalendar', user.id] });
  };

  const handleDeleteCalendarItem = async (id: string) => {
    if (!user) return;
    await supabase.from('anima_calendar').delete().eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaCalendar', user.id] });
    toast.success('تم حذف عنصر التقويم');
  };

  // Sexual Wish Handlers
  const handleAddSexualWish = async (wish: string) => {
    if (!wish.trim() || !user) return;
    const { error } = await supabase.from('anima_sexual_wishes').insert({ user_id: user.id, title: wish.trim() });
    if (error) { toast.error('خطأ'); return; }
    queryClient.invalidateQueries({ queryKey: ['animaSexualWishes', user.id] });
    setNewSexualWish("");
    setIsAddingSexualWish(false);
    toast.success('تمت إضافة الأمنية الجنسية');
  };

  const handleToggleSexualWishCompleted = async (id: string) => {
    if (!user) return;
    const wish = localSexualWishes.find(w => w.id === id);
    if (!wish) return;
    await supabase.from('anima_sexual_wishes').update({ completed: !wish.completed }).eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaSexualWishes', user.id] });
  };

  const handleDeleteSexualWish = async (id: string) => {
    if (!user) return;
    await supabase.from('anima_sexual_wishes').delete().eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaSexualWishes', user.id] });
    toast.success('تم حذف الأمنية الجنسية');
  };

  // Wish Handlers
  const handleAddLocalWish = async (wish: string) => {
    if (!wish.trim() || !user) return;
    const { error } = await supabase.from('anima_wishes').insert({ user_id: user.id, title: wish.trim() });
    if (error) { toast.error('خطأ'); return; }
    queryClient.invalidateQueries({ queryKey: ['animaWishes', user.id] });
    setNewWish("");
    setIsAddingWish(false);
    toast.success('تمت إضافة الأمنية');
  };

  const handleToggleWishCompleted = async (id: string) => {
    if (!user) return;
    const wish = localWishes.find(w => w.id === id);
    if (!wish) return;
    await supabase.from('anima_wishes').update({ completed: !wish.completed }).eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaWishes', user.id] });
  };

  const handleDeleteLocalWish = async (id: string) => {
    if (!user) return;
    await supabase.from('anima_wishes').delete().eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaWishes', user.id] });
    toast.success('تم حذف الأمنية');
  };

  const handleAddLocalCard = async (card: AnimaCard) => {
    if (!user) return;
    const { error } = await supabase.from('anima_page_cards').insert({
      user_id: user.id, title: card.title, description: card.description, emoji: card.emoji, order_index: localCards.length
    });
    if (error) { toast.error('خطأ'); return; }
    queryClient.invalidateQueries({ queryKey: ['animaPageCards', user.id] });
    setIsEditingCard(false);
    setEditingCard(null);
    toast.success('تمت إضافة البطاقة');
  };

  const handleUpdateLocalCard = async (card: AnimaCard) => {
    if (!user) return;
    await supabase.from('anima_page_cards').update({
      title: card.title, description: card.description, emoji: card.emoji
    }).eq('id', card.id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaPageCards', user.id] });
    setIsEditingCard(false);
    setSelectedCard(null);
    toast.success('تم تحديث البطاقة');
  };

  const handleDeleteLocalCard = async (id: string) => {
    if (!user) return;
    await supabase.from('anima_page_cards').delete().eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaPageCards', user.id] });
    toast.success('تم حذف البطاقة');
  };

  const handleAddMessage = async () => {
    if (!newMessage.trim() || !user) return;
    const { error } = await supabase.from('anima_messages').insert({ user_id: user.id, text: newMessage.trim() });
    if (error) { toast.error('خطأ'); return; }
    queryClient.invalidateQueries({ queryKey: ['animaMessages', user.id] });
    setNewMessage("");
    toast.success('تمت إضافة الرسالة');
  };

  const handleToggleLike = async (id: string) => {
    if (!user) return;
    const msg = animaMessages.find(m => m.id === id);
    if (!msg) return;
    await supabase.from('anima_messages').update({ likes: msg.likes + 1 }).eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaMessages', user.id] });
  };

  const handleDeleteMessage = async (id: string) => {
    if (!user) return;
    await supabase.from('anima_messages').delete().eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaMessages', user.id] });
    toast.success('تم حذف الرسالة');
  };

  const handleMilestoneClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      setCurrentMilestoneIndex((prev) => (prev + 1) % latestMilestones.length);
      setIsExiting(false);
    }, 1000);
  };

  // Mutation for database updates
  const updateQualityRatingMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (!user) throw new Error('No user');
      const { error } = await supabase.from('anima_quality_rating').upsert({
        user_id: user.id,
        rating,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animaQualityRating', user?.id] })
  });

  const cardsToDisplay = localCards.length > 0 ? localCards : defaultCards;

  useEffect(() => {
    if (ratingData && 'balance_rating' in ratingData) {
      setQualityRating((ratingData as any).balance_rating ?? 5.0);
    } else if (ratingData && 'rating' in ratingData) {
      setQualityRating((ratingData as any).rating ?? 5.0);
    }
  }, [ratingData]);

  // Milestone Auto-advance
  useEffect(() => {
    if (latestMilestones.length === 0) return;
    // Reset to first milestone when autoplay is disabled
    if (!isAutoPlayEnabled) {
      setCurrentMilestoneIndex(0);
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentMilestoneIndex((prev) => (prev + 1) % latestMilestones.length);
    }, 14000);
    return () => clearInterval(interval);
  }, [latestMilestones.length, isAutoPlayEnabled]);

  useEffect(() => {
    setIsEntering(false);
    setCardMounted(false);
    const enterTimer = setTimeout(() => setIsEntering(true), 50);
    const mountTimer = setTimeout(() => {
      setCardMounted(true);
      setIsEntering(false);
    }, 600);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(mountTimer);
    };
  }, [currentMilestoneIndex]);

  const parseMilestone = (message: string) => {
    const content = message.replace('__MILESTONE__', '');
    const parts = content.split('|');
    const isSacredFmt = parts.length > 5;
    
    return {
      title: parts[0] || 'جماع',
      rating: parts[1] || '-',
      notes: isSacredFmt ? '' : (parts[2] || ''),
      type: isSacredFmt ? (parts[5] || 'normal') : (parts[3] || 'normal'),
      intention: isSacredFmt ? (parts[6] || '') : (parts[4] || '')
    };
  };

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'sacred': return <Flame className="w-3.5 h-3.5 text-transparent fill-transparent" style={{ filter: 'drop-shadow(0 0 8px rgba(255,140,0,0.8))' }} />;
      case 'heart': return <HeartHandshake className="w-3.5 h-3.5 text-pink-500" />;
      case 'imaginary': return <Brain className="w-3.5 h-3.5 text-purple-500" />;
      case 'nursing': return <span className="text-amber-700 text-[10px]">💧</span>;
      case 'normal': return <Zap className="w-3.5 h-3.5 text-blue-500" />;
      default: return <Zap className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getTimeDifference = (date: Date) => {
    const diffMs = new Date().getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'منذ قليل';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${Math.floor(diffMs / 86400000)} يوم`;
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      <div className="fixed inset-0 anima-bg" />
      <div className="fixed top-1/4 right-1/4 w-64 h-64 rounded-full anima-orb anima-orb-pink" />
      <div className="fixed bottom-1/3 left-1/4 w-48 h-48 rounded-full anima-orb anima-orb-purple" />
      <div className="fixed top-1/2 left-1/2 w-32 h-32 rounded-full anima-orb anima-orb-rose" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className={`max-w-sm w-full transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-4">
              <div className="absolute rounded-full" style={{
                inset: `-${Math.round((qualityRating + pressDuration) * 4)}px`,
                background: `radial-gradient(circle, rgba(236, 72, 153, ${0.08 + (qualityRating / 10) * 0.55 + pressDuration * 0.08}), transparent 70%)`,
                filter: `blur(${12 + qualityRating * 2 + pressDuration * 3}px)`,
                opacity: Math.max(0.08, (qualityRating + pressDuration) / 10),
                transition: 'all 0.1s ease',
              }} />
              <div 
                className="relative w-40 h-40 rounded-full bg-gradient-to-br from-pink-400/30 to-purple-500/30 backdrop-blur-xl border border-pink-300/30 flex items-center justify-center anima-pulse cursor-pointer active:scale-95 transition-transform"
              >
                <Heart className="h-20 w-20 text-pink-300 fill-pink-300/40 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quality Slider */}
          <div className="mb-6 pb-3 border-b border-white/10 w-full">
            <Slider
              value={[qualityRating]}
              onValueChange={(val) => { setQualityRating(val[0]); updateQualityRatingMutation.mutate(val[0]); }}
              max={10} min={0} step={0.1}
              className="w-full"
              rangeClassName="bg-gradient-to-r from-pink-500 to-rose-400"
            />
          </div>

          {/* Cards Section (صفات الانيما) */}
          <div className="relative mb-8">
            <div className="grid grid-cols-2 gap-3">
              {cardsToDisplay.map((item, i) => (
                <div key={item.id} className="group relative">
                  <button 
                    onClick={() => {
                      setSelectedCard(item);
                      setEditingCard({ ...item });
                      setIsEditingCard(true);
                    }}
                    className="w-full flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-pink-400/30 transition-all text-center anima-float-card"
                  >
                    <h3 className="text-[13px] font-medium text-pink-100/90">{item.title}</h3>
                  </button>
                  {localCards.find(c => c.id === item.id) && (
                    <button
                      onClick={() => handleDeleteLocalCard(item.id)}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-red-500/80 hover:bg-red-600 text-white transition-all duration-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => {
            setEditingCard({ id: `temp-${Date.now()}`, emoji: "✨", title: "بطاقة جديدة", description: "", order_index: cardsToDisplay.length });
            setIsEditingCard(true);
          }} className="w-full mb-8 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5 text-white/40 hover:text-white/60 transition-all">
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">إضافة بطاقة</span>
          </button>

          {/* Messages Section */}
          <div className="mb-6 w-full">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-medium text-pink-200/80"></h3>
              </div>
            </div>
            
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {animaMessages.length > 0 ? (
                animaMessages.map((msg) => (
                  <div key={msg.id} className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-3 text-right hover:border-pink-400/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-white/90 leading-relaxed flex-1">{msg.text}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button 
                          onClick={() => handleToggleLike(msg.id)}
                          className={`p-1 rounded transition-all flex items-center gap-0.5 ${msg.likes > 0 ? "text-pink-400 bg-pink-500/10" : "text-white/20 hover:text-pink-400"}`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${msg.likes > 0 ? "fill-current" : ""}`} />
                          <span className="text-[10px] font-medium">{msg.likes}</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-3 text-xs text-white/20">لا توجد رسائل حالياً</p>
              )}
            </div>

            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddMessage();
                  }
                }}
                placeholder="اكتب رسالة من الأنيما..."
                className="flex-1 resize-none bg-white/5 border border-white/10 backdrop-blur-xl rounded-lg p-3 text-white/90 placeholder:text-white/20 text-sm focus:outline-none focus:border-pink-400/30 text-right"
                rows={2}
              />
              <button
                onClick={handleAddMessage}
                disabled={!newMessage.trim()}
                className="p-3 rounded-lg bg-pink-500/20 border border-pink-400/30 hover:bg-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-pink-300"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Section - التذكية - تقويم */}
          <div className="mb-8 w-full">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold text-green-100">التذكية - تقويم</h2>
              </div>
              <button onClick={() => setIsAddingCalendarItem(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-lime-300 transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {sortedCalendarItems.map((item) => (
                <div key={item.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${item.progress >= 9.5 ? "text-green-400" : "text-white/20"}`} />
                      <span className="text-sm font-medium text-white/90">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-lime-300 bg-green-500/10 px-2 py-0.5 rounded-full">{item.progress.toFixed(1)}</span>
                      <button onClick={() => handleDeleteCalendarItem(item.id)} className="text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <Slider
                    value={[item.progress]}
                    onValueChange={(val) => handleUpdateCalendarProgress(item.id, val[0])}
                    max={10} min={0} step={0.1}
                    className="w-full"
                    rangeClassName="bg-gradient-to-r from-green-500 to-lime-400"
                  />
                </div>
              ))}
              {localCalendarItems.length === 0 && (
                <p className="text-center py-4 text-xs text-white/20 italic">لا توجد عناصر تقويم حالياً</p>
              )}
            </div>
          </div>

          {/* Treatment Section - التذكية - الشفاء */}
          <div className="mb-8 w-full">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-blue-100">التذكية - الشفاء</h2>
              </div>
              <button onClick={() => setIsAddingTask(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-blue-300 transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {sortedTasks.map((task) => (
                <div key={task.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${task.progress >= 9.5 ? "text-green-400" : "text-white/20"}`} />
                      <span className="text-sm font-medium text-white/90">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full">{task.progress.toFixed(1)}</span>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <Slider
                    value={[task.progress]}
                    onValueChange={(val) => handleUpdateTaskProgress(task.id, val[0])}
                    max={10} min={0} step={0.1}
                    className="w-full"
                    rangeClassName="bg-gradient-to-r from-blue-500 to-cyan-400"
                  />
                </div>
              ))}
              {localTasks.length === 0 && (
                <p className="text-center py-4 text-xs text-white/20 italic">لا توجد مهام نشطة حالياً</p>
              )}
            </div>
          </div>

          {/* Wishes Section - أمنيات الأنيما */}
          <div className="mb-8 w-full">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
                <h2 className="text-lg font-bold text-pink-100">أمنيات الأنيما</h2>
              </div>
              <button onClick={() => setIsAddingWish(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-pink-300">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {localWishes.map((wish) => (
                <div key={wish.id} className={`group relative backdrop-blur-xl border rounded-2xl p-4 transition-all ${wish.completed ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10 hover:border-pink-500/30"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm leading-relaxed flex-1 ${
                      wish.completed
                        ? "text-white/50 line-through"
                        : "text-white/90"
                    }`}>{wish.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleWishCompleted(wish.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          wish.completed
                            ? "bg-green-500 border-green-500"
                            : "border-white/20 hover:border-green-400"
                        }`}
                      >
                        {wish.completed && <span className="text-white text-xs font-bold">✓</span>}
                      </button>
                      <button onClick={() => handleDeleteLocalWish(wish.id)} className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {localWishes.length === 0 && (
                <p className="text-center py-4 text-xs text-white/20 italic">لا توجد أمنيات حالياً</p>
              )}
            </div>
          </div>

          {/* Regular Wish Dialog */}
          {isAddingWish && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setIsAddingWish(false); }}>
              <div className="bg-[#1a1a2e] border border-white/15 rounded-2xl p-6 w-[90vw] max-w-[380px] flex flex-col gap-3 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-center text-sm font-semibold text-white/80 mb-4">إضافة أمنية جديدة</h3>
                <textarea
                    value={newWish}
                    onChange={(e) => setNewWish(e.target.value)}
                    placeholder="اكتب الأمنية..."
                    className="flex-1 resize-none bg-white/5 border border-white/10 backdrop-blur-xl rounded-lg p-3 text-white/90 placeholder:text-white/20 text-sm focus:outline-none focus:border-pink-400/30 text-right"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { handleAddLocalWish(newWish); setIsAddingWish(false); }}
                      disabled={!newWish.trim()}
                      className="flex-1 p-3 rounded-lg bg-pink-500/20 border border-pink-400/30 hover:bg-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-pink-300"
                    >
                      إضافة أمنية
                    </button>
                    <button
                      onClick={() => setIsAddingWish(false)}
                      className="p-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white/60 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* امنيات احمد من الانيما */}
          <div className="mb-8 w-full">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                <h2 className="text-lg font-bold text-amber-100">امنيات احمد من الانيما</h2>
              </div>
              <button 
                onClick={() => {
                  const wish = prompt('اكتب الأمنية:');
                  if (wish && wish.trim()) {
                    handleAddSexualWish(wish.trim());
                  }
                }}
                className="p-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/20 text-amber-300 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {localSexualWishes.map((wish) => (
                <div key={wish.id} className={`group relative backdrop-blur-xl border rounded-2xl p-4 transition-all ${wish.completed ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-500/5 border-amber-400/20 hover:border-amber-500/30"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm leading-relaxed flex-1 ${
                      wish.completed
                        ? "text-white/50 line-through"
                        : "text-white/90"
                    }`}>{wish.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleSexualWishCompleted(wish.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          wish.completed
                            ? "bg-amber-500 border-amber-500"
                            : "border-amber-400/30 hover:border-amber-400"
                        }`}
                      >
                        {wish.completed && <span className="text-white text-xs font-bold">✓</span>}
                      </button>
                      <button onClick={() => handleDeleteSexualWish(wish.id)} className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {localSexualWishes.length === 0 && (
                <p className="text-center py-4 text-xs text-white/20 italic">لا توجد أمنيات حالياً</p>
              )}
            </div>

            {/* Sexual Wish Dialog */}
            {isAddingSexualWish && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setIsAddingSexualWish(false); }}>
                <div className="bg-[#1a1a2e] border border-white/15 rounded-2xl p-6 w-[90vw] max-w-[380px] flex flex-col gap-3 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="text-center text-sm font-semibold text-white/80 mb-4">إضافة أمنية جديدة</h3>
                  <textarea
                    value={newSexualWish}
                    onChange={(e) => setNewSexualWish(e.target.value)}
                    placeholder="اكتب الأمنية..."
                    className="flex-1 resize-none bg-white/5 border border-white/10 backdrop-blur-xl rounded-lg p-3 text-white/90 placeholder:text-white/20 text-sm focus:outline-none focus:border-amber-400/30 text-right"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { handleAddSexualWish(newSexualWish); }}
                      disabled={!newSexualWish.trim()}
                      className="flex-1 p-3 rounded-lg bg-amber-500/20 border border-amber-400/30 hover:bg-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-amber-300"
                    >
                      إضافة أمنية
                    </button>
                    <button
                      onClick={() => setIsAddingSexualWish(false)}
                      className="p-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white/60 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chart Section */}
          {latestMilestones.length > 1 && (
            <div className="mt-20 w-full h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(() => {
                  const filtered = [...latestMilestones]
                    .reverse()
                    .filter((m) => {
                      const daysAgo = Math.floor((Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24));
                      return daysAgo <= 7;
                    });
                  
                  const earliestDate = filtered.length > 0 ? new Date(filtered[0].created_at) : new Date();
                  const dayStart = new Date(earliestDate);
                  dayStart.setHours(0, 0, 0, 0);
                  const dayStartMs = dayStart.getTime();

                  return filtered.map((m, i) => {
                    const milestone = parseMilestone(m.message);
                    const hoursSinceDayStart = (new Date(m.created_at).getTime() - dayStartMs) / (1000 * 60 * 60);

                    return {
                      val: parseFloat(milestone.rating) || 0,
                      timePosition: hoursSinceDayStart,
                      index: i,
                      title: milestone.title,
                      rating: milestone.rating,
                      notes: milestone.notes,
                      type: milestone.type,
                      intention: milestone.intention,
                      date: new Date(m.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
                      time: new Date(m.created_at).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true }),
                      timeAgo: getTimeDifference(new Date(m.created_at)),
                      dayName: new Date(m.created_at).toLocaleDateString('ar-EG', { weekday: 'short' }),
                      dayStartMs,
                    };
                  });
                })()}
                  >
                  <defs><linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="rgba(239,68,68,0.1)"/><stop offset="100%" stopColor="rgba(239,68,68,0.8)"/></linearGradient><linearGradient id="sacredGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="rgba(255,140,0,0.4)"/><stop offset="50%" stopColor="rgba(255,69,0,0.6)"/><stop offset="100%" stopColor="rgba(255,0,0,0.8)"/></linearGradient></defs>
                  <YAxis hide domain={[5, 10]} />
                  <XAxis 
                    dataKey="timePosition" 
                    domain={[0, 'dataMax + 2']}
                    type="number"
                    ticks={[0, 24, 48, 72, 96, 120, 144, 168]}
                    tickFormatter={(value) => {
                      const filtered = [...latestMilestones]
                        .reverse()
                        .filter((m) => Math.floor((Date.now() - new Date(m.created_at).getTime()) / 86400000) <= 7);
                      if (filtered.length === 0) return '';
                      const earliest = new Date(filtered[0].created_at);
                      earliest.setHours(0, 0, 0, 0);
                      const tickDate = new Date(earliest.getTime() + value * 3600000);
                      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                      return days[tickDate.getDay()];
                    }}
                    tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 9 }}
                    interval={0}
                  />
                  <Tooltip content={({ active, payload }) => (active && payload?.[0] ? 
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-lg text-[10px] text-red-100 space-y-1">
                      <div className="font-bold text-white">{payload[0].payload.title}</div>
                      <div>التقييم: {payload[0].payload.rating}</div>
                      {payload[0].payload.intention && <div>النية: {payload[0].payload.intention}</div>}
                      {payload[0].payload.notes && <div>الملاحظات: {payload[0].payload.notes}</div>}
                      <div className="text-[9px] text-white/60">{payload[0].payload.date} - {payload[0].payload.time}</div>
                    </div> 
                    : null)} 
                  />
                  <ReferenceLine y={10} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <ReferenceLine x={0} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                  <ReferenceLine x={24} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                  <ReferenceLine x={48} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                  <ReferenceLine x={72} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                  <ReferenceLine x={96} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                  <ReferenceLine x={120} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                  <ReferenceLine x={144} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                  <ReferenceLine x={168} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                  <Line 
                    type="monotone" 
                    dataKey="val" 
                    stroke="url(#lineG)"  
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      
                      const iconType = payload.type;
                      const iconColor = 
                        iconType === 'sacred' ? '#ef4444' :
                        iconType === 'heart' ? '#f472b6' :
                        iconType === 'imaginary' ? '#a855f7' :
                        iconType === 'normal' ? '#3b82f6' :
                        iconType === 'nursing' ? '#d97706' :
                        '#6b7280';
                      
                      return (
                        <g key={`dot-${cx}-${cy}`}>
                          <g transform={`translate(${cx - 3}, ${cy - 3})`}>
                            {iconType === 'sacred' && <circle cx="3" cy="3" r="2.0" fill="url(#sacredGradient)" />}
                            {iconType === 'heart' && <circle cx="3" cy="3" r="2.0" fill={iconColor} />}
                            {iconType === 'imaginary' && <circle cx="3" cy="3" r="2.0" fill={iconColor} />}
                            {iconType === 'normal' && <circle cx="3" cy="3" r="2.0" fill={iconColor} />}
                            {iconType === 'nursing' && <circle cx="3" cy="3" r="2.0" fill={iconColor} />}
                            {!['sacred', 'heart', 'imaginary', 'normal', 'nursing'].includes(iconType) && <circle cx="3" cy="3" r="2.0" fill={iconColor} />}
                          </g>
                        </g>
                      );
                    }}
                    animationDuration={3000} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Milestones Vertical List */}
          {showMilestones && latestMilestones.length > 0 && (
            <div className="mt-12 w-full space-y-4">
              <div className="space-y-3">
                {latestMilestones.map((m) => {
                  const milestone = parseMilestone(m.message);
                  return (
                    <div key={m.id} className="w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-600/10 via-rose-500/8 to-orange-500/5 backdrop-blur-xl border border-pink-400/15 p-4 text-right hover:border-pink-400/30 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getMilestoneIcon(milestone.type)}
                          <h3 className="text-sm font-bold text-white">{milestone.title}</h3>
                        </div>
                        <span className="text-2xl font-black text-transparent bg-gradient-to-r from-pink-300 to-rose-400 bg-clip-text leading-none">{milestone.rating}</span>
                      </div>
                      {milestone.intention && (
                        <div className="pt-2 border-t border-white/10 text-xs text-white/80 font-medium">
                          <span className="text-pink-300/60 ml-1">النية:</span>
                          {milestone.intention}
                        </div>
                      )}
                      {milestone.notes && (
                        <div className="pt-1.5 text-xs text-yellow-100/70 italic leading-relaxed">
                          {milestone.notes}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-2 text-[9px] text-white/30 border-t border-white/5 pt-2">
                        <span>{new Date(m.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                        <span className="opacity-50">•</span>
                        <span>{new Date(m.created_at).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sheets (Wishes, Tasks, Cards) */}
      <div>
        <Sheet open={isAddingWish} onOpenChange={setIsAddingWish}>
          <SheetContent side="bottom" className="rounded-t-3xl bg-black/95 border-t border-white/10">
            <SheetHeader className="text-right px-6 pt-6"><SheetTitle>أمنية جديدة</SheetTitle></SheetHeader>
            <div className="px-6 py-4"><Textarea value={newWish} onChange={(e) => setNewWish(e.target.value)} placeholder="ماذا تتمنى الأنيما؟" className="bg-white/5 border-white/10 text-right" dir="rtl" /></div>
            <SheetFooter className="px-6 pb-8 gap-3">
              <Button variant="ghost" onClick={() => setIsAddingWish(false)} className="flex-1">إلغاء</Button>
              <Button onClick={() => handleAddLocalWish(newWish)} disabled={!newWish.trim()} className="flex-1 bg-pink-500">إضافة</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet open={isAddingTask} onOpenChange={setIsAddingTask}>
          <SheetContent side="bottom" className="rounded-t-3xl bg-black/95 border-t border-white/10">
            <SheetHeader className="text-right px-6 pt-6"><SheetTitle>مهمة أنيما جديدة</SheetTitle></SheetHeader>
            <div className="px-6 py-4"><Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="اسم المهمة..." className="bg-white/5 border-white/10 text-right" dir="rtl" /></div>
            <SheetFooter className="px-6 pb-8 gap-3">
              <Button variant="ghost" onClick={() => setIsAddingTask(false)} className="flex-1">إلغاء</Button>
              <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()} className="flex-1 bg-blue-600">إضافة المهمة</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet open={isAddingCalendarItem} onOpenChange={setIsAddingCalendarItem}>
          <SheetContent side="bottom" className="rounded-t-3xl bg-black/95 border-t border-white/10">
            <SheetHeader className="text-right px-6 pt-6"><SheetTitle>عنصر تقويم جديد</SheetTitle></SheetHeader>
            <div className="px-6 py-4"><Input value={newCalendarItemTitle} onChange={(e) => setNewCalendarItemTitle(e.target.value)} placeholder="اسم عنصر التقويم..." className="bg-white/5 border-white/10 text-right" dir="rtl" /></div>
            <SheetFooter className="px-6 pb-8 gap-3">
              <Button variant="ghost" onClick={() => setIsAddingCalendarItem(false)} className="flex-1">إلغاء</Button>
              <Button onClick={handleAddCalendarItem} disabled={!newCalendarItemTitle.trim()} className="flex-1 bg-green-600">إضافة عنصر</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet open={!!selectedCard && !isEditingCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
          <SheetContent side="bottom" className="rounded-t-3xl bg-black/95 border-t border-white/10">
            <SheetHeader className="text-right px-6 pt-6"><div className="flex items-center justify-between"><SheetTitle>{selectedCard?.emoji} {selectedCard?.title}</SheetTitle><Button variant="ghost" size="icon" onClick={() => {
              setEditingCard({ ...selectedCard! });
              setIsEditingCard(true);
            }}><Edit2 className="w-5 h-5" /></Button></div></SheetHeader>
            <div className="px-6 py-6 text-right text-white/80 text-sm leading-relaxed">{selectedCard?.description}</div>
          </SheetContent>
        </Sheet>

        <Sheet open={isEditingCard} onOpenChange={(open) => !open && setIsEditingCard(false)}>
          <SheetContent side="bottom" className="rounded-t-3xl bg-black/95 border-t border-white/10">
            <SheetHeader className="text-right px-6 pt-6"><SheetTitle>تعديل البطاقة</SheetTitle></SheetHeader>
            <div className="px-6 py-6 space-y-4">
              <Input value={editingCard?.title || ''} onChange={(e) => setEditingCard({ ...editingCard!, title: e.target.value })} placeholder="العنوان" className="bg-white/10 text-right" dir="rtl" />
              <Textarea value={editingCard?.description || ''} onChange={(e) => setEditingCard({ ...editingCard!, description: e.target.value })} placeholder="الوصف" className="bg-white/10 text-right resize-none" dir="rtl" />
            </div>
            <SheetFooter className="px-6 pb-6 gap-3">
              <Button variant="ghost" onClick={() => setIsEditingCard(false)} className="flex-1">إلغاء</Button>
              <Button 
                onClick={() => {
                  if (!editingCard) return;
                  if (editingCard.id.startsWith('temp-')) {
                    handleAddLocalCard(editingCard);
                  } else {
                    handleUpdateLocalCard(editingCard);
                  }
                }} 
                className="flex-1 bg-pink-500"
              >
                حفظ
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <style>{`
        .anima-bg { background: linear-gradient(135deg, hsl(330,40%,8%) 0%, hsl(280,35%,10%) 30%, hsl(320,30%,7%) 60%, hsl(270,40%,9%) 100%); background-size: 400% 400%; animation: anima-gradient 15s ease infinite; }
        @keyframes anima-gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .anima-orb { filter: blur(80px); animation: anima-orb-drift 12s ease-in-out infinite; }
        .anima-orb-pink { background: radial-gradient(circle, hsl(330,60%,40%) 0%, transparent 70%); opacity: 0.2; }
        .anima-orb-purple { background: radial-gradient(circle, hsl(270,50%,40%) 0%, transparent 70%); opacity: 0.15; animation-delay: -4s; }
        .anima-orb-rose { background: radial-gradient(circle, hsl(350,50%,45%) 0%, transparent 70%); opacity: 0.12; animation-delay: -8s; }
        @keyframes anima-orb-drift { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-20px) scale(1.1); } 66% { transform: translate(-20px,15px) scale(0.9); } }
        .anima-pulse { animation: anima-pulse-anim 6s ease-in-out infinite; }
        @keyframes anima-pulse-anim { 0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(236,72,153,0.1); } 50% { transform: scale(1.03); box-shadow: 0 0 30px rgba(236,72,153,0.2); } }
        .anima-float-card { animation: anima-card-float 8s ease-in-out infinite; }
        @keyframes anima-card-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        [role="slider"] { display: none !important; }
        .relative.w-full.touch-none.select-none.flex.items-center [data-orientation="horizontal"] { border-radius: 9999px !important; overflow: hidden; }
        [data-orientation="horizontal"] > span { border-radius: 9999px !important; }
      `}</style>
    </div>
  );
};

export default Anima;