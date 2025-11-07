import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { getBalanceColor } from '@/utils/balanceCalculator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';

// Convert an HSL color string to HSLA with given alpha
const withAlpha = (hsl: string, alpha: number): string => {
  if (hsl.startsWith('hsl(')) {
    return hsl.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
  }
  return hsl;
};

const divineNames = [
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
] as const;

export default function Divinity() {
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [currentNote, setCurrentNote] = useState('');
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [currentProgress, setCurrentProgress] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('divine_names')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        const notesMap: Record<string, string> = {};
        const progressMap: Record<string, number> = {};

        data?.forEach((item) => {
          notesMap[item.divine_name] = item.notes || '';
          progressMap[item.divine_name] = item.progress || 50;
        });

        setNotes(notesMap);
        setProgress(progressMap);
      } catch (error) {
        console.error('Error fetching divine names:', error);
      }
    };

    fetchData();
  }, []);
  
  const handleOpenNote = useCallback((name: string) => {
    setSelectedName(name);
    setCurrentNote(notes[name] || '');
    setCurrentProgress(progress[name] ?? 50);
  }, [notes, progress]);

  const handleNoteChange = useCallback((value: string) => {
    setCurrentNote(value);
  }, []);

  const handleProgressChange = useCallback((value: number[]) => {
    setCurrentProgress(value[0]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedName) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('divine_names')
        .upsert({
          user_id: user.id,
          divine_name: selectedName,
          notes: currentNote,
          progress: currentProgress
        }, {
          onConflict: 'user_id,divine_name'
        });

      setNotes(prev => ({ ...prev, [selectedName]: currentNote }));
      setProgress(prev => ({ ...prev, [selectedName]: currentProgress }));

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ التغييرات بنجاح'
      });
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حفظ التغييرات',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [selectedName, currentNote, currentProgress, toast]);

  const handleDeleteNote = useCallback(async () => {
    if (!selectedName) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('divine_names')
        .delete()
        .eq('user_id', user.id)
        .eq('divine_name', selectedName);

      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[selectedName];
        return newNotes;
      });
      setProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[selectedName];
        return newProgress;
      });
      setCurrentNote('');
      setCurrentProgress(50);
      setSelectedName(null);

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الملاحظة بنجاح'
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف الملاحظة',
        variant: 'destructive'
      });
    }
  }, [selectedName, toast]);

  // Sort divine names based on their progress (lowest to highest, top to bottom)
  const sortedDivineNames = useMemo(() => 
    [...divineNames].sort((a, b) => {
      const progressA = progress[a] ?? 50;
      const progressB = progress[b] ?? 50;
      if (progressA < progressB) return -1;
      if (progressA > progressB) return 1;
      return a.localeCompare(b);
    }), [progress]);

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
              className="group relative overflow-hidden rounded-2xl p-5 min-h-[140px] transition-all duration-500 hover:scale-[1.03] active:scale-95 w-full text-right"
              style={{
                background: 'var(--gradient-card)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Main glow layer */}
                <div
                  className="absolute -bottom-16 -right-12 w-[320px] h-[220px] opacity-60 group-hover:opacity-80 glow-anim"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.25) 0%, transparent 75%)',
                    willChange: "transform, opacity",
                    transition: 'opacity 0.4s ease-in-out',
                  }}
                />
                
                {/* Secondary subtle glow */}
                <div
                  className="absolute -top-8 -left-8 w-[200px] h-[200px] opacity-30 group-hover:opacity-50 glow-anim"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, transparent 80%)',
                    animationDelay: '2s',
                    animationDuration: '15s',
                    willChange: "transform, opacity",
                    transition: 'opacity 0.4s ease-in-out',
                  }}
                />
                
                {/* Edge glow */}
                <div 
                  className="absolute inset-0 border border-transparent rounded-2xl"
                  style={{
                    boxShadow: 'inset 0 0 18px rgba(99, 102, 241, 0.2)',
                    transition: 'box-shadow 0.4s ease-in-out',
                  }}
                />
                
                {/* Note indicator dot */}
                {notes[name] && (
                  <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-white" />
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
          setSelectedName(null);
        }
      }}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0 overflow-hidden">
          <SheetHeader className="text-right px-6 pt-6 pb-4 border-b border-border/20">
            <SheetTitle className="text-2xl font-bold">{selectedName}</SheetTitle>
          </SheetHeader>
          
          <div className="px-6 py-4 bg-gradient-to-r from-background/50 to-background border-b border-border/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">مستوى التقدم</span>
              <div className="flex items-center gap-2">
                <span 
                  className="text-sm font-medium w-10 text-center"
                  style={{ color: getBalanceColor(currentProgress) }}
                >
                  {currentProgress}%
                </span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getBalanceColor(currentProgress) }} />
              </div>
            </div>
            <Slider
              value={[currentProgress]}
              onValueChange={handleProgressChange}
              max={100}
              min={0}
              step={1}
              className="w-full group"
              style={{
                '--slider-color': getBalanceColor(currentProgress),
                '--slider-track-color': 'rgba(255, 255, 255, 0.05)',
                '--slider-thumb-color': 'hsl(0, 0%, 100%)',
                '--slider-thumb-hover-color': 'hsl(0, 0%, 100%)',
                '--slider-thumb-active-color': 'hsl(0, 0%, 100%)',
              } as React.CSSProperties}
            />
          </div>
          
          <div className="px-6 py-6 h-[calc(100%-280px)] overflow-y-auto">
            <Textarea
              value={currentNote}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="اكتب ملاحظاتك هنا..."
              className="h-full min-h-[200px] text-right text-base resize-none"
              dir="rtl"
            />
          </div>
          
          <SheetFooter className="px-6 py-4 border-t border-border/10 flex-row gap-2 justify-between">
            <Button
              onClick={handleDeleteNote}
              disabled={!notes[selectedName!] && !currentNote}
              variant="ghost"
              className="text-destructive hover:text-destructive/80"
            >
              حذف
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[100px]"
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
