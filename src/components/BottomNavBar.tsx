import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Target, BrickWall, Sparkles } from "lucide-react";

const BottomNavBar = () => {
  const location = useLocation();

  const navItems = [
    {
      name: "الشعور",
      path: "/",
      icon: Target,
    },
    {
      name: "العمل",
      path: "/behavioral",
      icon: BrickWall,
    },
    {
      name: "الايمان",
      path: "/divinity",
      icon: Sparkles,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/50">
      <nav className="flex justify-around items-center max-w-md mx-auto px-6 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 py-3 px-6 rounded-2xl transition-all duration-300 ease-out group",
                isActive 
                  ? "scale-105" 
                  : "scale-100 hover:scale-105"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-in fade-in zoom-in duration-300" />
              )}
              
              {/* Icon with glow effect */}
              <div className={cn(
                "relative transition-all duration-300",
                isActive ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "text-muted-foreground"
              )}>
                <Icon 
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "w-6 h-6" : "w-5 h-5"
                  )} 
                />
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-xs font-medium transition-all duration-300 relative z-10",
                isActive 
                  ? "text-primary font-semibold" 
                  : "text-muted-foreground group-hover:text-foreground"
              )}>
                {item.name}
              </span>
              
              {/* Active dot indicator */}
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full animate-in zoom-in duration-300" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNavBar;