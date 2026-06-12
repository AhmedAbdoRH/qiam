import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, ArrowRight, Star, Edit2, Save, X, Flame, HeartHandshake, Brain, Zap, Plus, Trash2, ListTodo, CheckCircle2, Send } from "lucide-react";
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

interface AnimaProps {
  embedded?: boolean;
}

const Anima = ({ embedded = false }: AnimaProps) => {
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

  // Ahmed state
  const [ahmedSelectedCard, setAhmedSelectedCard] = useState<AnimaCard | null>(null);
  const [isEditingAhmedCard, setIsEditingAhmedCard] = useState(false);
  const [editingAhmedCard, setEditingAhmedCard] = useState<AnimaCard | null>(null);
  const [newAhmedMessage, setNewAhmedMessage] = useState("");

  // Tasks State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Calendar State
  const [isAddingCalendarItem, setIsAddingCalendarItem] = useState(false);
  const [newCalendarItemTitle, setNewCalendarItemTitle] = useState("");

  const [_showSexualWishes, _setShowSexualWishes] = useState(true);

  const [newNote, setNewNote] = useState("");
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
      return (data || []).map(w => ({ id: w.id, title: w.title, completed: w.completed, progress: Number((w as any).progress || 0) }));
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
      return (data || []).map(w => ({ id: w.id, title: w.title, completed: w.completed, progress: Number((w as any).progress || 0) }));
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

  // Ahmed queries
  const { data: ahmedCards = [] } = useQuery({
    queryKey: ['ahmedPageCards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ahmed_page_cards' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return ((data || []) as any[]).map((c: any) => ({ id: c.id, title: c.title, description: c.description, emoji: c.emoji, order_index: c.order_index }));
    },
    enabled: !!user
  });

  const { data: ahmedMessages = [] } = useQuery({
    queryKey: ['ahmedMessages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ahmed_messages' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map((m: any) => ({ id: m.id, text: m.text, timestamp: new Date(m.created_at).getTime(), likes: m.likes }));
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

  const sortedWishes = useMemo(() => {
    return [...localWishes].sort((a, b) => a.progress - b.progress);
  }, [localWishes]);

  const sortedSexualWishes = useMemo(() => {
    return [...localSexualWishes].sort((a, b) => a.progress - b.progress);
  }, [localSexualWishes]);

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
  };

  // Tag Handlers
  const handleAddTag = async (type: 'task' | 'calendar', id: string, tag: string) => {
    if (!tag.trim() || !user) return;
    const table = type === 'task' ? 'anima_tasks' : 'anima_calendar';
    const items = type === 'task' ? localTasks : localCalendarItems;
    const item = items.find((i: any) => i.id === id);
    if (!item) return;
    const currentTags = (item as any).tags || [];
    const updatedTags = [...currentTags, tag.trim()];
    await supabase.from(table).update({ tags: updatedTags } as any).eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: [type === 'task' ? 'animaTasks' : 'animaCalendar', user.id] });
    setNewTag("");
    setTagTarget(null);
  };

  const handleDeleteTag = async (type: 'task' | 'calendar', id: string, tagIndex: number) => {
    if (!user) return;
    const items = type === 'task' ? localTasks : localCalendarItems;
    const item = items.find((i: any) => i.id === id);
    if (!item) return;
    const currentTags = [...((item as any).tags || [])];
    currentTags.splice(tagIndex, 1);
    const table = type === 'task' ? 'anima_tasks' : 'anima_calendar';
    await supabase.from(table).update({ tags: currentTags } as any).eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: [type === 'task' ? 'animaTasks' : 'animaCalendar', user.id] });
  };

  // Sweet Notes from database
  const { data: sweetNotesData = [] } = useQuery({
    queryKey: ['animaNotes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('anima_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;
    const { error } = await supabase.from('anima_notes').insert({ user_id: user.id, content: newNote.trim() });
    if (error) { toast.error('خطأ في إضافة الملاحظة'); return; }
    queryClient.invalidateQueries({ queryKey: ['animaNotes', user.id] });
    setNewNote("");
    toast.success('تمت إضافة الملاحظة');
  };

  const handleDeleteNote = async (id: string) => {
    if (!user) return;
    await supabase.from('anima_notes').delete().eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaNotes', user.id] });
    toast.success('تم حذف الملاحظة');
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
    const { error } = await supabase.from('anima_sexual_wishes').insert({ user_id: user.id, title: wish.trim(), progress: 0 });
    if (error) { toast.error('خطأ'); return; }
    queryClient.invalidateQueries({ queryKey: ['animaSexualWishes', user.id] });
    setNewSexualWish("");
    setIsAddingSexualWish(false);
    toast.success('تمت إضافة الأمنية');
  };

  const handleToggleSexualWishCompleted = async (id: string) => {
    if (!user) return;
    const wish = localSexualWishes.find(w => w.id === id);
    if (!wish) return;
    await supabase.from('anima_sexual_wishes').update({ completed: !wish.completed }).eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaSexualWishes', user.id] });
  };

  const handleUpdateSexualWishProgress = async (id: string, progress: number) => {
    if (!user) return;
    await supabase.from('anima_sexual_wishes').update({ progress, completed: progress >= 9.5 } as any).eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaSexualWishes', user.id] });
  };

  const handleDeleteSexualWish = async (id: string) => {
    if (!user) return;
    await supabase.from('anima_sexual_wishes').delete().eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['animaSexualWishes', user.id] });
    toast.success('تم حذف الأمنية');
  };

  // Wish Handlers
  const handleAddLocalWish = async (wish: string) => {
    if (!wish.trim() || !user) return;
    const { error } = await supabase.from('anima_wishes').insert({ user_id: user.id, title: wish.trim(), progress: 0 });
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

  const handleUpdateWishProgress = async (id: string, progress: number) => {
    if (!user) return;
    await supabase.from('anima_wishes').update({ progress, completed: progress >= 9.5 } as any).eq('id', id).eq('user_id', user.id);
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
  const ahmedCardsToDisplay = ahmedCards.length > 0 ? ahmedCards : defaultCards;

  // Ahmed handlers
  const handleAddAhmedCard = async (card: AnimaCard) => {
    if (!user) return;
    const { error } = await supabase.from('ahmed_page_cards' as any).insert({
      user_id: user.id, title: card.title, description: card.description, emoji: card.emoji, order_index: ahmedCards.length
    });
    if (error) { toast.error('خطأ'); return; }
    queryClient.invalidateQueries({ queryKey: ['ahmedPageCards', user.id] });
    setIsEditingAhmedCard(false);
    setEditingAhmedCard(null);
    toast.success('تمت إضافة البطاقة');
  };

  const handleUpdateAhmedCard = async (card: AnimaCard) => {
    if (!user) return;
    await supabase.from('ahmed_page_cards' as any).update({
      title: card.title, description: card.description, emoji: card.emoji
    }).eq('id', card.id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['ahmedPageCards', user.id] });
    setIsEditingAhmedCard(false);
    setAhmedSelectedCard(null);
    toast.success('تم تحديث البطاقة');
  };

  const handleDeleteAhmedCard = async (id: string) => {
    if (!user) return;
    await supabase.from('ahmed_page_cards' as any).delete().eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['ahmedPageCards', user.id] });
    toast.success('تم حذف البطاقة');
  };

  const handleAddAhmedMessage = async () => {
    if (!newAhmedMessage.trim() || !user) return;
    const { error } = await supabase.from('ahmed_messages' as any).insert({ user_id: user.id, text: newAhmedMessage.trim() });
    if (error) { toast.error('خطأ'); return; }
    queryClient.invalidateQueries({ queryKey: ['ahmedMessages', user.id] });
    setNewAhmedMessage("");
    toast.success('تمت إضافة الرسالة');
  };

  const handleToggleAhmedLike = async (id: string) => {
    if (!user) return;
    const msg = ahmedMessages.find((m: any) => m.id === id);
    if (!msg) return;
    await supabase.from('ahmed_messages' as any).update({ likes: msg.likes + 1 }).eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['ahmedMessages', user.id] });
  };

  const handleDeleteAhmedMessage = async (id: string) => {
    if (!user) return;
    await supabase.from('ahmed_messages' as any).delete().eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['ahmedMessages', user.id] });
    toast.success('تم حذف الرسالة');
  };

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

  if (loading || !user) return null;

  return (
    <div className={`${embedded ? 'min-h-0 overflow-visible' : 'min-h-screen overflow-hidden'} relative`} dir="rtl">
      <div className="fixed inset-0 anima-bg" />
      <div className="fixed top-1/4 right-1/4 w-64 h-64 rounded-full anima-orb anima-orb-pink" />
      <div className="fixed bottom-1/3 left-1/4 w-48 h-48 rounded-full anima-orb anima-orb-purple" />
      <div className="fixed top-1/2 left-1/2 w-32 h-32 rounded-full anima-orb anima-orb-rose" />

      <div className={`relative z-10 flex flex-col items-center ${embedded ? 'justify-start min-h-0' : 'justify-center min-h-screen'} px-6 py-0`}>
        <div className={`mx-auto max-w-sm w-full transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

          {/* Header */}
          <div className="flex flex-col items-center mb-0 -mt-6">
            <div className="relative mb-0">
              <div className="absolute rounded-full" style={{
                inset: `-${Math.round((qualityRating + pressDuration) * 4)}px`,
                background: `radial-gradient(circle, rgba(236, 72, 153, ${0.08 + (qualityRating / 10) * 0.55 + pressDuration * 0.08}), transparent 70%)`,
                filter: `blur(${12 + qualityRating * 2 + pressDuration * 3}px)`,
                opacity: Math.max(0.08, (qualityRating + pressDuration) / 10),
                transition: 'all 0.1s ease',
              }} />
              <div
                className="relative w-16 h-16 rounded-full bg-gradient-to-br from-pink-400/30 to-purple-500/30 backdrop-blur-xl border border-pink-300/30 flex items-center justify-center anima-pulse cursor-pointer active:scale-95 transition-transform"
              >
                <Heart className="h-8 w-8 block text-pink-300 fill-pink-300/40 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quality Slider */}
          <div className="mt-4 mb-2 pb-3 border-b border-white/10 w-full">
            <Slider
              value={[qualityRating]}
              onValueChange={(val) => { setQualityRating(val[0]); updateQualityRatingMutation.mutate(val[0]); }}
              max={10} min={0} step={0.1}
              className="w-full"
              rangeClassName="bg-gradient-to-r from-pink-500 to-rose-400"
            />
          </div>





        </div>
      </div>

      {/* Sheets (Wishes, Tasks, Cards) */}
      <div>
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

        {/* Ahmed Card Sheets */}
        <Sheet open={!!ahmedSelectedCard && !isEditingAhmedCard} onOpenChange={(open) => !open && setAhmedSelectedCard(null)}>
          <SheetContent side="bottom" className="rounded-t-3xl bg-black/95 border-t border-white/10">
            <SheetHeader className="text-right px-6 pt-6"><div className="flex items-center justify-between"><SheetTitle>{ahmedSelectedCard?.emoji} {ahmedSelectedCard?.title}</SheetTitle><Button variant="ghost" size="icon" onClick={() => {
              setEditingAhmedCard({ ...ahmedSelectedCard! });
              setIsEditingAhmedCard(true);
            }}><Edit2 className="w-5 h-5" /></Button></div></SheetHeader>
            <div className="px-6 py-6 text-right text-white/80 text-sm leading-relaxed">{ahmedSelectedCard?.description}</div>
          </SheetContent>
        </Sheet>

        <Sheet open={isEditingAhmedCard} onOpenChange={(open) => !open && setIsEditingAhmedCard(false)}>
          <SheetContent side="bottom" className="rounded-t-3xl bg-black/95 border-t border-white/10">
            <SheetHeader className="text-right px-6 pt-6"><SheetTitle>تعديل البطاقة</SheetTitle></SheetHeader>
            <div className="px-6 py-6 space-y-4">
              <Input value={editingAhmedCard?.title || ''} onChange={(e) => setEditingAhmedCard({ ...editingAhmedCard!, title: e.target.value })} placeholder="العنوان" className="bg-white/10 text-right" dir="rtl" />
              <Textarea value={editingAhmedCard?.description || ''} onChange={(e) => setEditingAhmedCard({ ...editingAhmedCard!, description: e.target.value })} placeholder="الوصف" className="bg-white/10 text-right resize-none" dir="rtl" />
            </div>
            <SheetFooter className="px-6 pb-6 gap-3">
              <Button variant="ghost" onClick={() => setIsEditingAhmedCard(false)} className="flex-1">إلغاء</Button>
              <Button
                onClick={() => {
                  if (!editingAhmedCard) return;
                  if (editingAhmedCard.id.startsWith('temp-')) {
                    handleAddAhmedCard(editingAhmedCard);
                  } else {
                    handleUpdateAhmedCard(editingAhmedCard);
                  }
                }}
                className="flex-1 bg-blue-500"
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