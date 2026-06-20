import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";

interface AnimusProps {
  embedded?: boolean;
}

const Animus = ({ embedded = false }: AnimusProps) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [qualityRating, setQualityRating] = useState(5.0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  // Optional quality rating (reuses animus_quality_rating table if present)
  const { data: ratingData } = useQuery({
    queryKey: ['animusQualityRating', user?.id],
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
    enabled: !!user,
  });

  useEffect(() => {
    if (ratingData && 'balance_rating' in ratingData) {
      setQualityRating((ratingData as any).balance_rating ?? 5.0);
    } else if (ratingData && 'rating' in ratingData) {
      setQualityRating((ratingData as any).rating ?? 5.0);
    }
  }, [ratingData]);

  if (loading || !user) return null;

  return (
    <div className={`${embedded ? 'min-h-0 overflow-visible' : 'min-h-screen overflow-hidden'} relative`} dir="rtl">
      <div className="relative z-10 flex flex-col items-center justify-start px-6 py-0">
        <div className={`mx-auto max-w-sm w-full transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

          {/* Header */}
          <div className="flex flex-col items-center mb-0 -mt-6">
            <div className="relative mb-0">
              <div className="absolute rounded-full" style={{
                inset: `-${Math.round((qualityRating) * 4)}px`,
                background: `radial-gradient(circle, rgba(59, 130, 246, ${0.08 + (qualityRating / 10) * 0.55}), transparent 70%)`,
                filter: `blur(${12 + qualityRating * 2}px)`,
                opacity: Math.max(0.08, qualityRating / 10),
                transition: 'all 0.1s ease',
              }} />
              <div
                className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-500/30 backdrop-blur-xl border border-blue-300/30 flex items-center justify-center animus-pulse cursor-pointer active:scale-95 transition-transform"
              >
                <Shield className="h-8 w-8 block text-blue-300 fill-blue-300/40 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Slider for quality rating (mirrors Anima) */}
          <div className="mt-4 mb-2 pb-3 border-b border-white/10 w-full">
            <Slider
              value={[qualityRating]}
              onValueChange={(val) => setQualityRating(val[0])}
              max={10} min={0} step={0.1}
              className="w-full"
              rangeClassName="bg-gradient-to-r from-blue-500 to-indigo-400"
            />
          </div>

        </div>
      </div>

      <style>{`
        .animus-pulse { animation: animus-pulse-anim 6s ease-in-out infinite; }
        @keyframes animus-pulse-anim { 0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(59,130,246,0.1); } 50% { transform: scale(1.03); box-shadow: 0 0 30px rgba(59,130,246,0.2); } }
        [role="slider"] { display: none !important; }
        .relative.w-full.touch-none.select-none.flex.items-center [data-orientation="horizontal"] { border-radius: 9999px !important; overflow: hidden; }
        [data-orientation="horizontal"] > span { border-radius: 9999px !important; }
      `}</style>
    </div>
  );
};

export default Animus;
