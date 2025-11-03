import { getBalanceColor } from "@/utils/balanceCalculator";
import type { LucideIcon } from "lucide-react";
import {
  Star,
  Crown,
  Shield,
  Unlock,
  Key,
  Sun,
  Moon,
  Sparkles,
  Feather,
  Gem,
  Anchor,
  Book,
  GraduationCap,
  Hammer,
  Target,
  Trophy,
  Eye,
  Heart,
  Brain,
  Infinity,
  Gift,
  Mic,
  ShieldCheck,
  RotateCcw,
  Circle,
} from "lucide-react";

const valueIconMap: Record<string, LucideIcon> = {
  "الألوهية": Sun,
  "القوة": Shield,
  "المتانة": Anchor,
  "الحكمة": Book,
  "العزة": Crown,
  "القهارية": Target,
  "الهيمنة": Shield,
  "العظمة": Crown,
  "القدر": Infinity,
  "البراءة": Feather,
  "الصمدية": Gem,
  "السلام": Heart,
  "التعالي": Crown,
  "الرحيمية": Heart,
  "الغنى": Gem,
  "المغفرة": Unlock,
  "الحمد": Sparkles,
  "اللطف": Feather,
  "الأولية": Key,
  "الكِبر": Crown,
  "التكبر": Crown,
  "الكرامة": Trophy,
  "الظهور": Sun,
  "الولاية": ShieldCheck,
  "الرحمانية": Heart,
  "الواحدية": Star,
  "الرزق": Gift,
  "الخبرة": GraduationCap,
  "الخلق": Hammer,
  "الغفارية": Unlock,
  "التصور": Brain,
  "الفتح": Key,
  "القداسة": Sparkles,
  "العلو": Sun,
  "التبيين": Eye,
  "الملك": Crown,
  "البر": Heart,
  "القيومية": Infinity,
  "الجبر": Shield,
  "التوبة": RotateCcw,
  "الآخرية": Moon,
  "السمع": Mic,
  "الوهابية": Gift,
  "البطون": Circle,
  "البصر": Eye,
  "الود": Heart,
  "الأمن": ShieldCheck,
  "الحياة": Sun,
  "العلم": GraduationCap,
  "الخلاقية": Hammer,
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
      className="group relative overflow-hidden rounded-2xl p-5 min-h-[140px] transition-all duration-500 hover:scale-[1.03] active:95"
      style={{
        background: `var(--gradient-card)`,
        boxShadow: `0 20px 60px rgba(0, 0, 0, 0.25)`,
      }}
    >
      {/* Subtle bottom-side accent glow overlays */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-50 group-hover:opacity-70"
        style={{
          background: `radial-gradient(160px 90px at 88% 100%, ${withAlpha(accentColor, 0.20)} 0%, transparent 70%),
                      linear-gradient(to top, ${withAlpha(accentColor, 0.10)} 0%, transparent 55%)`,
        }}
      />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
        <div
          className="flex items-center justify-center w-14 h-14"
        >
          <Icon className="w-8 h-8 text-white" />
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
