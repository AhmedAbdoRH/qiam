import React from "react";
import { getBalanceColor } from "@/utils/balanceCalculator";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Anchor,
  ArrowUp,
  ArrowUpCircle,
  ArrowUpRight,
  Award,
  Book,
  Brain,
  CheckCircle,
  ChevronsUp,
  Circle,
  CircleDot,
  Coins,
  Crown,
  Diamond,
  Eye,
  Feather,
  Flower,
  Gem,
  Gift,
  GraduationCap,
  Hammer,
  Hand,
  Heart,
  HeartPulse,
  Hourglass,
  Infinity,
  Key,
  Leaf,
  Lightbulb,
  Lock,
  Mic,
  Moon,
  Palette,
  Pin,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Stars,
  Sun,
  Target,
  ThumbsUp,
  Trophy,
  Unlock,
  Wand2,
  Zap,
  ExternalLink,
} from "lucide-react";

const valueIconMap: Record<string, LucideIcon> = {
  "الألوهية": Star,
  "القوة": Shield,
  "المتانة": Anchor,
  "الحكمة": Book,
  "العزة": Award,
  "القهارية": Target,
  "الهيمنة": Zap,
  "العظمة": Diamond,
  "القدر": Hourglass,
  "البراءة": Feather,
  "الصمدية": Gem,
  "السلام": Flower,
  "التعالي": ArrowUp,
  "الرحيمية": Heart,
  "الغنى": Coins,
  "المغفرة": Unlock,
  "الحمد": Sparkles,
  "اللطف": Leaf,
  "الأولية": Key,
  "الكِبر": ChevronsUp,
  "التكبر": ArrowUpRight,
  "الكرامة": Trophy,
  "الظهور": Sun,
  "الولاية": ShieldCheck,
  "الرحمانية": HeartPulse,
  "الواحدية": Circle,
  "الرزق": Gift,
  "الخبرة": GraduationCap,
  "الخلق": Hammer,
  "الغفارية": Hand,
  "التصور": Brain,
  "الفتح": ExternalLink,
  "القداسة": Wand2,
  "العلو": ArrowUpCircle,
  "التبيين": Search,
  "الملك": Crown,
  "البر": ThumbsUp,
  "القيومية": Infinity,
  "الجبر": Lock,
  "التوبة": RotateCcw,
  "الآخرية": Moon,
  "السمع": Mic,
  "الوهابية": Stars,
  "البطون": CircleDot,
  "البصر": Eye,
  "الود": Smile,
  "الأمن": CheckCircle,
  "الحياة": Activity,
  "العلم": Lightbulb,
  "الخلاقية": Palette,
};

function getValueIcon(name: string): LucideIcon {
  return valueIconMap[name] ?? Star;
}

// Convert an HSL color string like "hsl(h, s%, l%)" to HSLA with given alpha
function withAlpha(hsl: string, alpha: number): string {
  return hsl.startsWith("hsl(")
    ? hsl.replace("hsl(", "hsla(").replace(")", `, ${alpha})`)
    : hsl;
}

interface ValueCardProps {
  name: string;
  balancePercentage: number;
  onClick: () => void;
  isPinned?: boolean;
}

export const ValueCard = React.memo(({ name, balancePercentage, onClick, isPinned = false }: ValueCardProps) => {
  const accentColor = getBalanceColor(balancePercentage);
  const Icon = getValueIcon(name);

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl p-5 min-h-[140px] transition-all duration-300 hover:scale-[1.03] active:scale-95"
      style={{
        background: `var(--gradient-card)`,
        boxShadow: `0 20px 60px rgba(0, 0, 0, 0.25)`,
      }}
    >
      {/* Optimized glow effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -bottom-16 -right-12 w-[320px] h-[220px] opacity-75 group-hover:opacity-90 transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse at center, ${withAlpha(accentColor, 0.35)} 0%, transparent 75%)`,
          }}
        />
        <div 
          className="absolute inset-0 border border-transparent rounded-2xl transition-shadow duration-300"
          style={{
            boxShadow: `inset 0 0 18px ${withAlpha(accentColor, 0.3)}`,
          }}
        />
        {isPinned && (
          <div className="absolute top-3 right-3 z-20">
            <Pin className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          </div>
        )}
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
        <div className="flex items-center justify-center w-14 h-14">
          <Icon className="w-8 h-8 text-white" strokeWidth={1.2} />
        </div>
        <h3 className="text-white font-bold text-base md:text-xl text-center leading-tight drop-shadow-lg">
          {name}
        </h3>
      </div>
    </button>
  );
});

ValueCard.displayName = "ValueCard";
