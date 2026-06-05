import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VALUES } from "@/types/value";

interface SovereignProps {
  embedded?: boolean;
  valuesData?: Record<string, { balancePercentage: number }>;
  calendarTasksProgress?: number[];
}

// 25 masculine sovereign values
const MASCULINE_VALUE_NAMES = [
  "القوة", "الهيمنة", "القهارية", "العظمة", "العزة", "القدر", "الولاية", "الملك",
  "المتانة", "الحكمة", "الرزق", "التعالي", "الواحدية", "الصمدية", "البصر", "الظهور",
  "التكبر", "الخلق", "القيومية", "الحق", "الأولية", "الكرامة", "التبيين", "البر", "الفتح",
];

const MASCULINE_VALUE_IDS = MASCULINE_VALUE_NAMES.map((name) =>
  VALUES.findIndex((v) => v === name).toString()
).filter((id) => id !== "-1");

const Sovereign = ({ embedded = false, valuesData, calendarTasksProgress }: SovereignProps) => {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [overallProgress, setOverallProgress] = useState(50);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate overall progress from calendar tasks or values data
  const progress = useMemo(() => {
    // Priority: use calendar tasks progress if available
    if (calendarTasksProgress && calendarTasksProgress.length > 0) {
      const totalProgress = calendarTasksProgress.reduce((sum, p) => sum + p, 0);
      return Math.round(totalProgress / calendarTasksProgress.length);
    }
    
    // Fallback: use values data
    if (!valuesData || Object.keys(valuesData).length === 0) return 50;
    
    const values = Object.values(valuesData);
    if (values.length === 0) return 50;
    
    const totalProgress = values.reduce((sum, v) => sum + (v.balancePercentage || 0), 0);
    return Math.round(totalProgress / values.length);
  }, [valuesData, calendarTasksProgress]);

  useEffect(() => {
    setOverallProgress(progress);
  }, [progress]);

  if (loading || !user) return null;

  return (
    <div className="w-full px-6 py-0" dir="ltr">
      <div className="mx-auto max-w-sm w-full">
        {/* Progress Bar */}
        <div className="pb-3 border-b border-white/10 w-full">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-indigo-500 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sovereign;
