import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Target, BrickWall, Sparkles, CheckSquare } from "lucide-react";

const BottomNavBar = () => {
  const location = useLocation();

  const navItems = [
    {
      name: "الأنوثة",
      path: "/feelings",
      icon: Target,
    },
    {
      name: "الذات السيادية",
      path: "/",
      icon: BrickWall,
    },
    {
      name: "الطفل الداخلي",
      path: "/tasks",
      icon: CheckSquare,
    },
    {
      name: "الايمان",
      path: "/divinity",
      icon: Sparkles,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/50">
      <nav className="flex justify-around items-center max-w-md mx-auto px-3 py-0">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex items-center justify-center py-0.5 px-2 rounded-xl transition-all duration-300 ease-out group",
                isActive 
                  ? "scale-110" 
                  : "scale-100 hover:scale-110"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-xl animate-in fade-in zoom-in duration-300" />
              )}
              
              {/* Icon with glow effect */}
              <div className={cn(
                "relative transition-all duration-300",
                isActive ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "text-muted-foreground"
              )}>
                <Icon 
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "w-5 h-5" : "w-4 h-4"
                  )} 
                />
              </div>
              
              {/* Active dot indicator */}
              {isActive && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full animate-in zoom-in duration-300" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNavBar;
