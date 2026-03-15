import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, ArrowRight, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const floatingHearts = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 6 + Math.random() * 6,
  size: 10 + Math.random() * 18,
  opacity: 0.1 + Math.random() * 0.25,
}));

const Anima = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* Animated gradient background */}
      <div className="fixed inset-0 anima-bg" />

      {/* Floating particles */}
      {floatingHearts.map((h) => (
        <div
          key={h.id}
          className="fixed pointer-events-none anima-float-heart"
          style={{
            left: `${h.left}%`,
            bottom: "-30px",
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.duration}s`,
            fontSize: `${h.size}px`,
            opacity: h.opacity,
          }}
        >
          ♡
        </div>
      ))}

      {/* Soft glowing orbs */}
      <div className="fixed top-1/4 right-1/4 w-64 h-64 rounded-full anima-orb anima-orb-pink" />
      <div className="fixed bottom-1/3 left-1/4 w-48 h-48 rounded-full anima-orb anima-orb-purple" />
      <div className="fixed top-1/2 left-1/2 w-32 h-32 rounded-full anima-orb anima-orb-rose" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300"
        >
          <ArrowRight className="h-5 w-5" />
        </button>

        {/* Main card */}
        <div
          className={`max-w-sm w-full transition-all duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Glowing heart icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 anima-icon-glow rounded-full" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-pink-400/30 to-purple-500/30 backdrop-blur-xl border border-pink-300/30 flex items-center justify-center anima-pulse">
                <Heart className="h-9 w-9 text-pink-300 fill-pink-300/40" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-purple-300/70 anima-sparkle" />
              <Star className="absolute -bottom-1 -left-2 h-4 w-4 text-pink-300/60 anima-sparkle-delayed" />
            </div>
          </div>

          {/* Title */}
          <h1
            className={`text-3xl font-bold text-center mb-3 bg-gradient-to-l from-pink-300 via-purple-300 to-pink-200 bg-clip-text text-transparent transition-all duration-1000 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            الأنيما
          </h1>

          <p
            className={`text-center text-sm text-pink-200/60 mb-10 leading-relaxed transition-all duration-1000 delay-400 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            المساحة الداخلية للتواصل مع الذات الأنثوية
          </p>

          {/* Info cards */}
          <div className="space-y-3">
            {[
              { icon: "💗", title: "الحب الذاتي", desc: "تغذية العلاقة مع الذات الداخلية" },
              { icon: "🌸", title: "الحنان", desc: "استكشاف مشاعر الرعاية والاحتواء" },
              { icon: "✨", title: "الإلهام", desc: "الاتصال بالطاقة الإبداعية الأنثوية" },
              { icon: "🌙", title: "الحدس", desc: "الإنصات للصوت الداخلي العميق" },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-pink-400/30 transition-all duration-500 group cursor-default ${
                  mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
                }`}
                style={{ transitionDelay: `${600 + i * 150}ms` }}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-pink-100">{item.title}</h3>
                  <p className="text-xs text-purple-200/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .anima-bg {
          background: linear-gradient(135deg, 
            hsl(330, 40%, 8%) 0%, 
            hsl(280, 35%, 10%) 30%, 
            hsl(320, 30%, 7%) 60%, 
            hsl(270, 40%, 9%) 100%
          );
          background-size: 400% 400%;
          animation: anima-gradient 15s ease-in-out infinite;
        }
        @keyframes anima-gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .anima-float-heart {
          position: fixed;
          color: hsl(330, 60%, 70%);
          animation: anima-float-up linear infinite;
        }
        @keyframes anima-float-up {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }

        .anima-orb {
          filter: blur(80px);
          animation: anima-orb-drift 12s ease-in-out infinite;
        }
        .anima-orb-pink {
          background: radial-gradient(circle, hsl(330, 60%, 40%) 0%, transparent 70%);
          opacity: 0.2;
        }
        .anima-orb-purple {
          background: radial-gradient(circle, hsl(270, 50%, 40%) 0%, transparent 70%);
          opacity: 0.15;
          animation-delay: -4s;
        }
        .anima-orb-rose {
          background: radial-gradient(circle, hsl(350, 50%, 45%) 0%, transparent 70%);
          opacity: 0.12;
          animation-delay: -8s;
        }
        @keyframes anima-orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 15px) scale(0.9); }
        }

        .anima-pulse {
          animation: anima-pulse-anim 3s ease-in-out infinite;
        }
        @keyframes anima-pulse-anim {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(236, 72, 153, 0.15); }
          50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(236, 72, 153, 0.3); }
        }

        .anima-icon-glow {
          background: radial-gradient(circle, rgba(236, 72, 153, 0.3), transparent 70%);
          filter: blur(20px);
          animation: anima-pulse-anim 3s ease-in-out infinite;
        }

        .anima-sparkle {
          animation: anima-sparkle-anim 2s ease-in-out infinite;
        }
        .anima-sparkle-delayed {
          animation: anima-sparkle-anim 2s ease-in-out 1s infinite;
        }
        @keyframes anima-sparkle-anim {
          0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(20deg); }
        }
      `}</style>
    </div>
  );
};

export default Anima;
