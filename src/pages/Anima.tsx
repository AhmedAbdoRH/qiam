import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, ArrowRight, Star, Edit2, Save, X, Flame, HeartHandshake, Brain, Zap, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

  // Removed floating hearts configuration

interface AnimaCard {
  id: string;
  title: string;
  description: string;
  emoji: string;
  order_index: number;
}

const defaultCards: AnimaCard[] = [
  { id: "1", emoji: "🍑", title: "جماعٌ مُقدس", description: "", order_index: 0 },
  { id: "2", emoji: "💫", title: "قبولٌ مُطلق", description: "", order_index: 1 },
  { id: "3", emoji: "🍼", title: "إرواءٌ حقيقي", description: "", order_index: 2 },
  { id: "4", emoji: "🏳️", title: "استسلامٌ مَهيب", description: "", order_index: 3 },
  { id: "5", emoji: "🤎", title: "راعيةٌ حنونة", description: "", order_index: 4 },
];

const Anima = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [selectedCard, setSelectedCard] = useState<AnimaCard | null>(null);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<AnimaCard | null>(null);
  const [qualityRating, setQualityRating] = useState(5.0);
  const [isExiting, setIsExiting] = useState(false);
  const [cardMounted, setCardMounted] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch anima cards from database
  const { data: dbCards = [] } = useQuery({
    queryKey: ['animaCards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('anima_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch quality rating from database
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

  // Fetch latest 3 milestones (آخر 3 جماعات)
  const { data: latestMilestones = [] } = useQuery({
    queryKey: ['latestMilestones', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('self_dialogue_messages')
        .select('*')
        .eq('user_id', user.id)
        .like('message', '%__MILESTONE__%')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return (data || []).reverse(); // Show oldest first
    },
    enabled: !!user
  });

  const [currentMilestoneIndex, setCurrentMilestoneIndex] = useState(0);

  // Update quality rating in database
  const updateQualityRatingMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (!user) throw new Error('No user');
      const { error } = await supabase
        .from('anima_quality_rating')
        .upsert({
          user_id: user.id,
          rating,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animaQualityRating', user?.id] });
      toast.success('تم حفظ التقييم');
    },
    onError: () => {
      toast.error('حدث خطأ في حفظ التقييم');
    }
  });

  // Update card in database
  const updateCardMutation = useMutation({
    mutationFn: async (card: AnimaCard) => {
      if (!user) throw new Error('No user');
      
      if (card.id.startsWith('temp-')) {
        // This is a new card
        const { error } = await supabase
          .from('anima_cards')
          .insert({
            user_id: user.id,
            title: card.title,
            description: card.description,
            emoji: card.emoji,
            order_index: card.order_index
          });
        if (error) throw error;
      } else {
        // Update existing card
        const { error } = await supabase
          .from('anima_cards')
          .update({
            title: card.title,
            description: card.description,
            emoji: card.emoji,
            updated_at: new Date().toISOString()
          })
          .eq('id', card.id)
          .eq('user_id', user.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animaCards', user?.id] });
      toast.success('تم حفظ التعديلات');
      setIsEditingCard(false);
      setSelectedCard(null);
    },
    onError: () => {
      toast.error('حدث خطأ في حفظ التعديلات');
    }
  });

  // Get cards to display - use database cards if available, otherwise use defaults
  const cardsToDisplay = dbCards.length > 0 ? dbCards : defaultCards;

  // Set quality rating from database on load
  useEffect(() => {
    if (ratingData) {
      setQualityRating(ratingData.balance_rating ?? 5.0);
    } else if (latestMilestones.length > 0) {
      // If no rating in database, calculate average from latest 3 milestones
      const ratings = latestMilestones
        .map(m => {
          const content = m.message.replace('__MILESTONE__', '');
          const parts = content.split('|');
          const rating = parseInt(parts[1]);
          return isNaN(rating) ? 0 : rating;
        })
        .filter(r => r > 0);
      
      if (ratings.length > 0) {
        const sum = ratings.reduce((a, b) => a + b, 0);
        const average = sum / ratings.length; // This gives us decimal average (like 8.5)
        setQualityRating(Math.min(Math.max(average, 0), 10)); // Ensure between 0-10
      }
    }
  }, [ratingData, latestMilestones]);

  // Auto-advance milestones every 14 seconds (3 exit + 3 enter + 8 display)
  useEffect(() => {
    if (latestMilestones.length === 0) return;
    
    const interval = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentMilestoneIndex((prev) => (prev + 1) % latestMilestones.length);
        setIsExiting(false);
      }, 3000); // اختفاء في 3 ثواني
    }, 14000); // الدورة الكاملة: 3 اختفاء + 3 ظهور + 8 عرض

    return () => clearInterval(interval);
  }, [latestMilestones.length]);

  // Reset card mount animation when card changes
  useEffect(() => {
    setCardMounted(false);
    const timer = setTimeout(() => {
      setCardMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [currentMilestoneIndex]);

  const handleEditCard = (card: AnimaCard) => {
    setEditingCard({ ...card });
    setIsEditingCard(true);
  };

  const handleSaveCard = () => {
    if (editingCard) {
      updateCardMutation.mutate(editingCard);
    }
  };

  // Parse milestone data
  const parseMilestone = (message: string) => {
    const content = message.replace('__MILESTONE__', '');
    const parts = content.split('|');
    const isSacredFmt = parts.length > 8;
    
    return {
      title: parts[0] || 'جماع',
      rating: parts[1] || '-',
      notes: isSacredFmt ? '' : (parts[2] || ''),
      type: isSacredFmt ? (parts[8] || 'normal') : (parts[3] || 'normal'),
      intention: isSacredFmt ? (parts[9] || '') : (parts[4] || '')
    };
  };

  // Get icon for milestone type
  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'sacred':
        return <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />;
      case 'heart':
        return <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />;
      case 'imaginary':
        return <Brain className="w-3.5 h-3.5 text-purple-400" />;
      case 'normal':
      default:
        return <Zap className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  // Calculate time difference
  const getTimeDifference = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);
    const diffMonths = Math.floor(diffMs / 2592000000);

    if (diffMins < 1) return 'منذ قليل';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    if (diffWeeks < 4) return `منذ ${diffWeeks} أسبوع`;
    return `منذ ${diffMonths} شهر`;
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* Animated gradient background */}
      <div className="fixed inset-0 anima-bg" />

      {/* Floating particles removed */}

      {/* Soft glowing orbs */}
      <div className="fixed top-1/4 right-1/4 w-64 h-64 rounded-full anima-orb anima-orb-pink" />
      <div className="fixed bottom-1/3 left-1/4 w-48 h-48 rounded-full anima-orb anima-orb-purple" />
      <div className="fixed top-1/2 left-1/2 w-32 h-32 rounded-full anima-orb anima-orb-rose" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300"
        >
          <ArrowRight className="h-5 w-5" />
        </button>

        {/* Main card */}
        <div
          className={`max-w-sm w-full transition-all duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Glowing heart icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div
                className="absolute rounded-full"
                style={{
                  inset: `-${Math.round(qualityRating * 4)}px`,
                  background: `radial-gradient(circle, rgba(236, 72, 153, ${0.08 + (qualityRating / 10) * 0.55}), transparent 70%)`,
                  filter: `blur(${12 + qualityRating * 2}px)`,
                  opacity: Math.max(0.08, qualityRating / 10),
                  transition: 'all 0.4s ease',
                }}
              />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-pink-400/30 to-purple-500/30 backdrop-blur-xl border border-pink-300/30 flex items-center justify-center anima-pulse">
                <Heart className="h-14 w-14 text-pink-300 fill-pink-300/40" />
              </div>
              {/* Sparkles and Star removed */}
            </div>
          </div>

          {/* Title */}
          <h1
            className={`text-3xl font-bold text-center mb-3 text-pink-300 transition-all duration-1000 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            الأنيما
          </h1>

          <p
            className={`text-center text-sm text-pink-200/60 mb-10 leading-relaxed transition-all duration-1000 delay-400 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            المساحة الداخلية للذات الأنثوية
          </p>

          {/* Quality Rating Section */}
          <div className="mb-4 pb-3 border-b border-white/10">
            <div className="flex justify-center mb-3">
              <span className="text-2xl font-black text-transparent bg-gradient-to-r from-pink-300 to-rose-400 bg-clip-text">{Math.round(qualityRating * 10)}%</span>
            </div>
            <Slider
              value={[qualityRating]}
              onValueChange={(value) => {
                setQualityRating(value[0]);
                updateQualityRatingMutation.mutate(value[0]);
              }}
              max={10}
              min={0}
              step={0.1}
              className="w-full"
              rangeClassName="bg-gradient-to-r from-pink-500 to-rose-400"
            />
          </div>

          {/* Latest 3 Milestones Section */}
          {latestMilestones.length > 0 && (
            <div className="mb-6">
              {(() => {
                const currentMilestone = latestMilestones[currentMilestoneIndex];
                const milestone = parseMilestone(currentMilestone.message);
                const date = new Date(currentMilestone.created_at);
                const timeDiff = getTimeDifference(date);
                
                return (
                  <>
                    <div
                      key={currentMilestoneIndex}
                      className={`relative overflow-hidden rounded-lg bg-gradient-to-br from-pink-600/15 via-rose-500/12 to-orange-500/8 backdrop-blur-lg border border-pink-400/20 text-right group hover:border-pink-300/30 hover:from-pink-600/20 hover:via-rose-500/15`}
                      style={{ 
                        opacity: !isExiting && cardMounted ? 1 : 0,
                        transition: isExiting ? 'opacity 3000ms ease-in-out' : 'opacity 3000ms ease-in-out'
                      }}
                      dir="rtl"
                    >
                      {/* Animated glow effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-transparent" />
                      </div>

                      {/* Content */}
                      <div className="relative p-2.5 space-y-1.5">
                        {/* Header with title and rating */}
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

                        {/* Intention */}
                        {milestone.intention && (
                          <div className="pt-1.5 border-t border-white/20">
                            <p className="text-xs text-white/85 leading-relaxed font-medium">{milestone.intention}</p>
                          </div>
                        )}

                        {/* Notes */}
                        {milestone.notes && (
                          <div className="pt-1">
                            <p className="text-xs text-yellow-100/80 line-clamp-2 font-medium">{milestone.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            {cardsToDisplay.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setSelectedCard(item)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-pink-400/30 transition-all duration-500 group cursor-pointer text-center ${
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${600 + i * 150}ms` }}
                dir="rtl"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{item.emoji}</span>
                <h3 className="text-sm font-semibold text-pink-100">{item.title}</h3>
              </button>
            ))}
          </div>
          
          {/* Add New Card Button - Full Width */}
          <div className="mt-4">
            <button
              onClick={() => {
                const newCard: AnimaCard = {
                  id: `temp-${Date.now()}`,
                  emoji: "✨",
                  title: "بطاقة جديدة",
                  description: "",
                  order_index: cardsToDisplay.length
                };
                setEditingCard(newCard);
                setIsEditingCard(true);
              }}
              className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all duration-500 group cursor-pointer text-center ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${600 + cardsToDisplay.length * 150}ms` }}
              dir="rtl"
            >
              <Plus className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors duration-300" />
              <span className="text-sm font-medium text-white/40 group-hover:text-white/60">إضافة بطاقة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Card Details Sheet */}
      <Sheet open={!!selectedCard && !isEditingCard} onOpenChange={(open) => {
        if (!open) setSelectedCard(null);
      }}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl bg-black/95 backdrop-blur-2xl border-t border-white/10">
          <SheetHeader className="text-right px-6 pt-6 pb-4" dir="rtl">
            <div className="flex items-center justify-between gap-4">
              <SheetTitle className="text-2xl font-bold flex-1">{selectedCard?.emoji} {selectedCard?.title}</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  handleEditCard(selectedCard!);
                }}
                className="shrink-0 hover:bg-white/5 rounded-full"
              >
                <Edit2 className="w-5 h-5 text-white/60" />
              </Button>
            </div>
          </SheetHeader>
          <div className="px-6 py-6 text-right" dir="rtl">
            <p className="text-white/80 text-sm leading-relaxed">{selectedCard?.description}</p>
          </div>
          <SheetFooter className="px-6 pb-6">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedCard(null)}
              className="w-full text-white/50 hover:text-white"
            >
              إغلاق
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Card Sheet */}
      <Sheet open={isEditingCard} onOpenChange={(open) => {
        if (!open) {
          setIsEditingCard(false);
          setEditingCard(null);
        }
      }}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl bg-black/95 backdrop-blur-2xl border-t border-white/10">
          <SheetHeader className="text-right px-6 pt-6 pb-4" dir="rtl">
            <SheetTitle className="text-2xl font-bold">تعديل البطاقة</SheetTitle>
          </SheetHeader>
          
          <div className="px-6 py-6 space-y-5">
            {/* Emoji Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/60">الرمز</label>
              <Input
                value={editingCard?.emoji || ''}
                onChange={(e) => setEditingCard({ ...editingCard!, emoji: e.target.value })}
                placeholder="أدخل الرمز أو الإيموجي"
                maxLength={2}
                className="text-center text-2xl bg-white/10 border-white/20 text-white h-14 focus:border-primary/50"
              />
            </div>

            {/* Title Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/60">العنوان</label>
              <Input
                value={editingCard?.title || ''}
                onChange={(e) => setEditingCard({ ...editingCard!, title: e.target.value })}
                placeholder="أدخل العنوان"
                className="bg-white/10 border-white/20 text-white text-right focus:border-primary/50"
                dir="rtl"
              />
            </div>
          </div>

          <SheetFooter className="px-6 pb-6 gap-3">
            <Button 
              variant="ghost" 
              onClick={() => {
                setIsEditingCard(false);
                setEditingCard(null);
              }}
              className="flex-1 text-white/50 hover:text-white"
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveCard}
              disabled={updateCardMutation.isPending}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ التعديلات
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <style>{`
        .anima-bg {
          background: linear-gradient(135deg, 
            hsl(330, 40%, 8%) 0%, 
            hsl(280, 35%, 10%) 30%, 
            hsl(320, 30%, 7%) 60%, 
            hsl(270, 40%, 9%) 100%
          );
          background-size: 400% 400%;
          animation: anima-gradient 15s ease-in-out infinite;
        }
        @keyframes anima-gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .anima-float-heart {
          position: fixed;
          color: hsl(330, 60%, 70%);
          animation: anima-float-up linear infinite;
        }
        @keyframes anima-float-up {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }

        .anima-orb {
          filter: blur(80px);
          animation: anima-orb-drift 12s ease-in-out infinite;
        }
        .anima-orb-pink {
          background: radial-gradient(circle, hsl(330, 60%, 40%) 0%, transparent 70%);
          opacity: 0.2;
        }
        .anima-orb-purple {
          background: radial-gradient(circle, hsl(270, 50%, 40%) 0%, transparent 70%);
          opacity: 0.15;
          animation-delay: -4s;
        }
        .anima-orb-rose {
          background: radial-gradient(circle, hsl(350, 50%, 45%) 0%, transparent 70%);
          opacity: 0.12;
          animation-delay: -8s;
        }
        @keyframes anima-orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 15px) scale(0.9); }
        }

        .anima-pulse {
          animation: anima-pulse-anim 6s ease-in-out infinite;
        }
        @keyframes anima-pulse-anim {
          0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(236, 72, 153, 0.1); }
          50% { transform: scale(1.03); box-shadow: 0 0 30px rgba(236, 72, 153, 0.2); }
        }

        /* anima-icon-glow is now dynamic via inline styles */

        .anima-sparkle {
          animation: anima-sparkle-anim 2s ease-in-out infinite;
        }
        .anima-sparkle-delayed {
          animation: anima-sparkle-anim 2s ease-in-out 1s infinite;
        }
        @keyframes anima-sparkle-anim {
          0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(20deg); }
        }
      `}</style>
    </div>
  );
};

export default Anima;
