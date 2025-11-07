import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getBalanceColor } from '@/utils/balanceCalculator';
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
  const [notes, setNotes] = useLocalStorage<Record<string, string>>('divinityNotes', {});
  const [currentNote, setCurrentNote] = useState('');
  
  // Initialize all divine names with 50% progress by default
  const [progress, setProgress] = useLocalStorage<Record<string, number>>(
    'divinityProgress',
    divineNames.reduce((acc, name) => ({ ...acc, [name]: 50 }), {})
  );
  
  const [currentProgress, setCurrentProgress] = useState(50);
  
  const handleOpenNote = (name: string) => {
    setSelectedName(name);
    setCurrentNote(notes[name] || '');
    setCurrentProgress(progress[name] ?? 50);
  };
  
  const handleSave = () => {
    if (selectedName) {
      const newNotes = { ...notes };
      if (currentNote.trim()) {
        newNotes[selectedName] = currentNote;
      } else {
        delete newNotes[selectedName];
      }
      setNotes(newNotes);
      
      // Ensure progress is always a number between 0 and 100
      const validatedProgress = Math.min(100, Math.max(0, currentProgress));
      const newProgress = { ...progress, [selectedName]: validatedProgress };
      setProgress(newProgress);
      
      setSelectedName(null);
    }
  };

  // Sort divine names based on their progress (lowest to highest, top to bottom)
  const sortedDivineNames = [...divineNames].sort((a, b) => {
    // Default to 50% if not set
    const progressA = progress[a] ?? 50;
    const progressB = progress[b] ?? 50;
    // Sort from lowest to highest progress (top to bottom)
    if (progressA < progressB) return -1;
    if (progressA > progressB) return 1;
    // If progress is equal, sort alphabetically (right to left)
    return a.localeCompare(b);
  });

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
          handleSave();
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
              onValueChange={(value) => setCurrentProgress(value[0])}
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
          
          <div className="px-6 py-6 h-[calc(100%-180px)] overflow-y-auto">
            <Textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="اكتب ملاحظاتك هنا..."
              className="h-full min-h-[200px] text-right text-base resize-none"
              dir="rtl"
            />
          </div>
          
          <SheetFooter className="flex flex-row justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentNote('');
                const newNotes = { ...notes };
                delete newNotes[selectedName!];
                setNotes(newNotes);
              }}
              disabled={!notes[selectedName!]}
              className="px-6 py-6 text-base"
            >
              حذف الملاحظة
            </Button>
            <Button
              onClick={() => {
                if (currentNote.trim()) {
                  setNotes({ ...notes, [selectedName!]: currentNote });
                } else {
                  const newNotes = { ...notes };
                  delete newNotes[selectedName!];
                  setNotes(newNotes);
                }
                setSelectedName(null);
              }}
              className="px-8 py-6 text-base"
            >
              حفظ
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
