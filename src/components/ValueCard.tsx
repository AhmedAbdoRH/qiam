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
}

export const ValueCard = ({ name, balancePercentage, onClick }: ValueCardProps) => {
  const accentColor = getBalanceColor(balancePercentage);
  const Icon = getValueIcon(name);

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl p-5 min-h-[140px] transition-all duration-500 hover:scale-[1.03] active:scale-95"
      style={{
        background: `var(--gradient-card)`,
        boxShadow: `0 20px 60px rgba(0, 0, 0, 0.25)`,
      }}
    >
      {/* Enhanced dynamic glow effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Main glow layer */}
        <div
          className="absolute -bottom-16 -right-12 w-[320px] h-[220px] opacity-60 group-hover:opacity-80 glow-anim"
          style={{
            background: `radial-gradient(ellipse at center, ${withAlpha(accentColor, 0.25)} 0%, transparent 75%)`,
            willChange: "transform, opacity",
            transition: 'opacity 0.4s ease-in-out',
          }}
        />
        
        {/* Secondary subtle glow */}
        <div
          className="absolute -top-8 -left-8 w-[200px] h-[200px] opacity-30 group-hover:opacity-50 glow-anim"
          style={{
            background: `radial-gradient(ellipse at center, ${withAlpha(accentColor, 0.15)} 0%, transparent 80%)`,
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
            boxShadow: `inset 0 0 18px ${withAlpha(accentColor, 0.2)}`,
            transition: 'box-shadow 0.4s ease-in-out',
          }}
        />
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
        <div
          className="flex items-center justify-center w-14 h-14"
        >
          <Icon className="w-8 h-8 text-white" strokeWidth={1.2} />
        </div>
        <h3 className="text-white font-bold text-base md:text-xl text-center leading-tight drop-shadow-lg">
          {name}
        </h3>
        {/* <div className="flex items-center gap-2">
          <div 
            className="px-3 py-1 rounded-md font-bold text-sm"
            style={{
              background: accentColor,
              boxShadow: `0 4px 12px ${accentColor}30`,
            }}
          >
            <span className="text-white drop-shadow-md">{balancePercentage}%</span>
          </div>
        </div> */}
      </div>
    </button>
  );
};
