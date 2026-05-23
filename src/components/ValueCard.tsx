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
      className="group relative overflow-hidden rounded-xl p-4 min-h-[110px] transition-all duration-300 hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center"
      style={{
        background: `var(--gradient-card)`,
        boxShadow: `0 10px 30px rgba(0, 0, 0, 0.2)`,
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -bottom-12 -right-8 w-[220px] h-[160px] opacity-70 group-hover:opacity-85 transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse at center, ${withAlpha(accentColor, 0.3)} 0%, transparent 70%)`,
          }}
        />
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2 text-center">
        <div className="flex items-center justify-center w-10 h-10">
          <Icon className="w-6 h-6 text-white" strokeWidth={1.3} />
        </div>
        <h3 className="text-white font-semibold text-sm md:text-base leading-tight drop-shadow-md">
          {name}
        </h3>
      </div>
      {isPinned && (
        <div className="absolute top-2 right-2 z-20">
          <Pin className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
        </div>
      )}
    </button>
  );
});

ValueCard.displayName = "ValueCard";
