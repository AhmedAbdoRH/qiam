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
  Scale,
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
  "الحق": Scale,
};

function getValueIcon(name: string): LucideIcon {
  return valueIconMap[name] ?? Star;
}

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
      className="group relative overflow-hidden rounded-lg p-3 min-h-[80px] transition-all duration-300 hover:scale-[1.02] active:scale-95 flex flex-row items-center justify-start gap-3"
      style={{
        background: `var(--gradient-card)`,
        boxShadow: `0 6px 20px rgba(0, 0, 0, 0.15)`,
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -bottom-8 -right-6 w-[180px] h-[120px] opacity-60 group-hover:opacity-75 transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse at center, ${withAlpha(accentColor, 0.25)} 0%, transparent 70%)`,
          }}
        />
      </div>
      
      <div className="relative z-10 flex items-center gap-3 flex-1">
        <div className="flex items-center justify-center w-8 h-8 shrink-0">
          <Icon className="w-4.5 h-4.5 text-white" strokeWidth={1.5} />
        </div>
        <h3 className="text-white font-medium text-xs md:text-sm leading-tight drop-shadow-md text-right">
          {name}
        </h3>
      </div>
      {isPinned && (
        <div className="absolute top-1.5 right-1.5 z-20">
          <Pin className="w-3 h-3 text-yellow-400 fill-yellow-400" />
        </div>
      )}
    </button>
  );
});

ValueCard.displayName = "ValueCard";
