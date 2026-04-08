import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getBalanceColor } from '@/utils/balanceCalculator';
import { ChatWidget } from '@/components/ChatWidget';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { MessageCircle, Send, History, Trash2, BookOpen, Edit2, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Convert an HSL color string to HSLA with given alpha
const withAlpha = (hsl: string, alpha: number): string => {
  if (hsl.startsWith('hsl(')) {
    return hsl.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
  }
  return hsl;
};

const divineNames: string[] = [
  'الرحمن', 'الرحيم', 'العلم', 'الحكيم', 'التواب',
  'السميع', 'العزيز', 'الحي', 'القيوم', 'العلي',
  'العظيم', 'الوهاب', 'الغني', 'الغفور', 'القوي',
  'اللطيف', 'الكبير', 'القهار', 'البصير', 'الخالق',
  'الحميد', 'العدل', 'القدير', 'الفتاح', 'الغفار',
  'الحق', 'الملك', 'البر', 'الرزاق', 'المتين',
  'الأول', 'الآخر', 'الولي', 'الطاهر', 'الباطن',
  'القدوس', 'السلام', 'المؤمن', 'المهيمن', 'الجبار',
  'المتكبر', 'الخالق', 'البارئ', 'المصور', 'الودود',
  'الصمد'
];

export default function Divinity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch existing divine names data from Supabase
  const { data: dbData } = useQuery({
    queryKey: ['divineNamesData', user?.id],
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase
        .from('divine_names')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      return (data || []).reduce((acc: any, item) => ({
        ...acc,
        [item.divine_name]: item
      }), {});
    },
    enabled: !!user
  });

  // Local storage used ONLY for fallback/persistence until DB load
  const [notes, setNotes] = useLocalStorage<Record<string, string>>('divinityNotes', {});
  const [progress, setProgress] = useLocalStorage<Record<string, number>>(
    'divinityProgress',
    divineNames.reduce((acc, name) => ({ ...acc, [name]: 50 }), {})
  );

  // Sync state with Database data when it loads
  useEffect(() => {
    if (dbData && Object.keys(dbData).length > 0) {
      const newNotes: Record<string, string> = { ...notes };
      const newProgress: Record<string, number> = { ...progress };
      const newLinks: Record<string, string> = { ...versesLinks };
      let changed = false;

      Object.values(dbData).forEach((item: any) => {
        if (newNotes[item.divine_name] !== (item.notes || '')) {
          newNotes[item.divine_name] = item.notes || '';
          changed = true;
        }
        if (newProgress[item.divine_name] !== (item.progress ?? 50)) {
          newProgress[item.divine_name] = item.progress ?? 50;
          changed = true;
        }
        if (newLinks[item.divine_name] !== (item.verses_link || '')) {
          newLinks[item.divine_name] = item.verses_link || '';
          changed = true;
        }
      });

      if (changed) {
        setNotes(newNotes);
        setProgress(newProgress);
        setVersesLinks(newLinks);
      }
    }
  }, [dbData]);

  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState('');
  const [monologues, setMonologues] = useState<any[]>([]);
  const [newMonologue, setNewMonologue] = useState('');
  const [loadingMonologues, setLoadingMonologues] = useState(false);
  const monologueScrollRef = useRef<HTMLDivElement>(null);

  const [versesLinks, setVersesLinks] = useLocalStorage<Record<string, string>>('divinityVersesLinks', {});
  const [currentLink, setCurrentLink] = useState('');
  const [isEditingLink, setIsEditingLink] = useState(false);

  // Auto-scroll monologues to bottom
  useEffect(() => {
    if (monologueScrollRef.current) {
      const viewport = monologueScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [monologues]);

  // Pinned names state
  const [pinnedNamesArray, setPinnedNamesArray] = useLocalStorage<string[]>(
    'divinityPinnedNames',
    []
  );
  const pinnedNames = useMemo(() => new Set(pinnedNamesArray), [pinnedNamesArray]);

  const togglePin = useCallback((name: string) => {
    setPinnedNamesArray(prev => {
      const newArray = [...prev];
      const index = newArray.indexOf(name);
      if (index > -1) {
        newArray.splice(index, 1);
      } else {
        newArray.push(name);
      }
      return newArray;
    });
  }, [setPinnedNamesArray]);

  const [currentProgress, setCurrentProgress] = useState(50);

  const loadMonologues = useCallback(async (name: string) => {
    if (!user) return;
    setLoadingMonologues(true);
    try {
      const { data, error } = await supabase
        .from('divine_name_monologues')
        .select('*')
        .eq('user_id', user.id)
        .eq('divine_name', name)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMonologues(data || []);
    } catch (err) {
      console.error('Error loading monologues:', err);
    } finally {
      setLoadingMonologues(false);
    }
  }, [user]);

  const handleOpenNote = useCallback((name: string) => {
    setSelectedName(name);
    setCurrentNote(notes[name] || '');
    setCurrentProgress(progress[name] ?? 50);
    setCurrentLink(versesLinks[name] || '');
    setIsEditingLink(false);
    loadMonologues(name);
    setNewMonologue('');
  }, [notes, progress, versesLinks, loadMonologues]);

  const handleSendMonologue = async () => {
    if (!newMonologue.trim() || !user || !selectedName) return;

    const messageText = newMonologue.trim();
    setNewMonologue('');

    try {
      const { data, error } = await supabase
        .from('divine_name_monologues')
        .insert({
          user_id: user.id,
          divine_name: selectedName,
          message: messageText
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMonologues(prev => [...prev, data]);
      }
    } catch (err) {
      console.error('Error sending monologue:', err);
      toast.error('حدث خطأ أثناء إرسال الرسالة');
      setNewMonologue(messageText);
    }
  };

  const handleDeleteMonologue = async (id: string) => {
    if (!window.confirm('هل تريد حذف هذه الرسالة؟')) return;

    try {
      const { error } = await supabase
        .from('divine_name_monologues')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMonologues(prev => prev.filter(m => m.id !== id));
      toast.success('تم حذف الرسالة');
    } catch (err) {
      console.error('Error deleting monologue:', err);
      toast.error('حدث خطأ أثناء حذف الرسالة');
    }
  };

  const handleSave = useCallback(async () => {
    if (selectedName && user) {
      const validatedProgress = Math.min(100, Math.max(0, currentProgress));

      // Update Local State for immediate feedback
      setNotes(prev => ({ ...prev, [selectedName]: currentNote }));
      setProgress(prev => ({ ...prev, [selectedName]: validatedProgress }));
      setVersesLinks(prev => ({ ...prev, [selectedName]: currentLink }));

      try {
        const { error } = await supabase
          .from('divine_names')
          .upsert({
            user_id: user.id,
            divine_name: selectedName,
            notes: currentNote.trim() || null,
            progress: validatedProgress,
            verses_link: currentLink.trim() || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id, divine_name' });

        if (error) throw error;

        // Invalidate query to refresh data from server
        queryClient.invalidateQueries({ queryKey: ['divineNamesData', user.id] });
        toast.success(`تم حفظ تعديلات ${selectedName} بنجاح`);
      } catch (err) {
        console.error('Error saving to DB:', err);
        toast.error('حدث خطأ أثناء الحفظ في قاعدة البيانات');
      }

      setSelectedName(null);
    }
  }, [selectedName, currentNote, currentProgress, user, queryClient, setNotes, setProgress]);

  // Sort divine names: pinned first, then by progress (lowest to highest)
  const sortedDivineNames = useMemo(() => {
    const pinned = divineNames.filter(name => pinnedNames.has(name));
    const unpinned = divineNames.filter(name => !pinnedNames.has(name));

    const sortFn = (a: string, b: string) => {
      const progressA = progress[a] ?? 50;
      const progressB = progress[b] ?? 50;
      if (progressA !== progressB) return progressA - progressB;
      return a.localeCompare(b);
    };

    return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)];
  }, [progress, pinnedNames]);

  return (
    <div className="container mx-auto px-4 pb-24 pt-6">
      <div className="flex items-center justify-center gap-3 mb-8">
        <Sparkles className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-center text-foreground">أسماء الله الحسنى</h1>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)] w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-6 justify-items-end" dir="rtl">
          {sortedDivineNames.map((name, index) => (
            <button
              key={index}
              onClick={() => handleOpenNote(name)}
              className="group relative overflow-hidden rounded-2xl p-5 min-h-[140px] transition-all duration-300 hover:scale-[1.03] active:scale-95 w-full text-right"
              style={{
                background: 'var(--gradient-card)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Optimized glow effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  className="absolute -bottom-16 -right-12 w-[320px] h-[220px] opacity-75 group-hover:opacity-90 transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.35) 0%, transparent 75%)',
                  }}
                />

                <div
                  className="absolute inset-0 border border-transparent rounded-2xl transition-shadow duration-300"
                  style={{
                    boxShadow: 'inset 0 0 18px rgba(99, 102, 241, 0.3)',
                  }}
                />

                {notes[name] && (
                  <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-white" />
                )}
                {pinnedNames.has(name) && (
                  <div className="absolute top-3 right-3 z-20">
                    <Pin className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
                <h3 className="text-white font-bold text-base md:text-xl leading-tight drop-shadow-lg">
                  {name}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Notes Sheet */}
      <Sheet open={!!selectedName} onOpenChange={(open) => {
        if (!open) {
          handleSave();
        }
      }}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 overflow-hidden bg-black/95 backdrop-blur-2xl border-t border-white/10">
          <SheetHeader className="text-right px-6 pt-6 pb-2 border-b border-white/5 bg-white/5">
            <div className="flex flex-col gap-4" dir="rtl">
              <div className="flex items-center justify-between gap-4">
                <SheetTitle className="text-2xl font-bold flex-1 text-right text-white leading-none">{selectedName}</SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => selectedName && togglePin(selectedName)}
                  className="shrink-0 hover:bg-white/5 rounded-full"
                >
                  {selectedName && pinnedNames.has(selectedName) ? (
                    <Pin className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ) : (
                    <PinOff className="w-5 h-5 text-white/40" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2 pb-2">
                {isEditingLink ? (
                  <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-right-2 duration-200">
                    <Input
                      value={currentLink}
                      onChange={(e) => setCurrentLink(e.target.value)}
                      placeholder="ضع رابط الآيات والذكر هنا..."
                      className="h-9 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      dir="ltr"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => setIsEditingLink(false)}
                      className="h-9 px-4 text-xs bg-primary hover:bg-primary/80"
                    >
                      تم
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 animate-in fade-in duration-300">
                    {currentLink ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = currentLink.startsWith('http') ? currentLink : `https://${currentLink}`;
                            window.open(url, '_blank');
                          }}
                          className="h-9 bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 gap-2 rounded-xl transition-all active:scale-95"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">الآيات والذكر</span>
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsEditingLink(true)}
                          className="h-9 w-9 text-white/20 hover:text-white/60 hover:bg-white/5 rounded-xl"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingLink(true)}
                        className="h-9 text-[11px] text-white/30 border border-dashed border-white/10 hover:bg-white/5 hover:border-white/20 rounded-xl px-4 transition-all"
                      >
                        إضافة رابط الآيات والذكر +
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </SheetHeader>

          <Tabs defaultValue="monologue" className="w-full h-full flex flex-col" dir="rtl">
            <div className="px-6 py-2 border-b border-white/5 bg-white/5">
              <TabsList className="w-full flex bg-transparent gap-2 p-0">
                <TabsTrigger
                  value="monologue"
                  className="flex-1 py-2 rounded-xl border border-transparent data-[state=active]:bg-white/10 data-[state=active]:border-white/10 data-[state=active]:text-white text-white/50 transition-all gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>مناجاة</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="flex-1 py-2 rounded-xl border border-transparent data-[state=active]:bg-white/10 data-[state=active]:border-white/10 data-[state=active]:text-white text-white/50 transition-all gap-2"
                >
                  <History className="w-4 h-4" />
                  <span>ملاحظة وحفظ</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="monologue" className="flex-1 flex flex-col min-h-0 m-0">
              <ScrollArea className="flex-1 px-4 py-6" ref={monologueScrollRef}>
                <div className="flex flex-col gap-3">
                  {monologues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-5">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }}>
                        <MessageCircle className="w-10 h-10 text-blue-400/30" />
                      </div>
                      <p className="text-sm text-white/25 font-light">ابدأ مناجاتك مع الله بهذا الاسم...</p>
                    </div>
                  ) : (
                    monologues.map((m, i) => (
                      <div key={m.id} className="flex justify-start group/msg animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 30}ms` }}>
                        <div className="rounded-2xl rounded-tr-sm p-4 max-w-[88%] relative border border-white/[0.06]" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.04) 100%)' }}>
                          <p className="text-white/90 text-[13px] leading-[1.8] whitespace-pre-wrap">{m.message}</p>
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.04] gap-4">
                            <span className="text-[10px] text-white/20 font-light tracking-wide">
                              {new Date(m.created_at).toLocaleString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMonologue(m.id)}
                              className="h-6 w-6 rounded-full opacity-0 group-hover/msg:opacity-60 hover:opacity-100 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="px-4 py-4 border-t border-white/[0.06]" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%)' }}>
                <div className="flex gap-2.5 items-end">
                  <Textarea
                    value={newMonologue}
                    onChange={(e) => setNewMonologue(e.target.value)}
                    placeholder="اكتب مناجاتك هنا..."
                    className="min-h-[52px] max-h-[140px] bg-white/[0.04] border-white/[0.08] text-white text-right text-[13px] rounded-2xl resize-none placeholder:text-white/20 focus:border-blue-500/30 focus:bg-white/[0.06] transition-all duration-200"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMonologue();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMonologue}
                    disabled={!newMonologue.trim()}
                    className="shrink-0 h-[52px] w-[52px] rounded-2xl border-0 text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-20 disabled:hover:scale-100"
                    style={{
                      background: newMonologue.trim()
                        ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)'
                        : 'rgba(59,130,246,0.15)',
                      boxShadow: newMonologue.trim()
                        ? '0 8px 30px rgba(37,99,235,0.4), 0 0 20px rgba(59,130,246,0.2)'
                        : 'none'
                    }}
                  >
                    <Send className="w-5 h-5 rotate-180" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 flex flex-col min-h-0 m-0 overflow-y-auto">
              <div className="px-6 py-6 bg-white/5 border-b border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-white/60">مستوى الحفظ واليقين</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-lg font-bold w-12 text-center"
                      style={{ color: getBalanceColor(currentProgress) }}
                    >
                      {currentProgress}%
                    </span>
                    <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: getBalanceColor(currentProgress) }} />
                  </div>
                </div>
                <Slider
                  value={[currentProgress]}
                  onValueChange={(value) => setCurrentProgress(value[0])}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex-1 p-6 flex flex-col gap-4">
                <label className="text-sm font-medium text-white/60">ملاحظات وخواطر</label>
                <Textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="ما الذي يلهمه هذا الاسم في قلبك؟"
                  className="flex-1 min-h-[250px] bg-white/5 border-white/10 text-white text-right text-lg rounded-2xl p-4 resize-none focus:border-primary/50 transition-all"
                  dir="rtl"
                />
              </div>

              <div className="p-6 mt-auto flex flex-col gap-3">
                <Button
                  onClick={handleSave}
                  className="w-full py-7 text-lg font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white"
                  style={{ background: 'linear-gradient(135deg, #8B4513 0%, #5D2E0C 100%)' }}
                >
                  حفظ التعديلات
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setCurrentNote('');
                    // handleSave will be called when opening and closing, 
                    // but we might want to trigger it here too.
                  }}
                  className="w-full py-4 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                >
                  مسح الملاحظة
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Chat Widget - only on Divinity page */}
      <ChatWidget />
    </div>
  );
}
