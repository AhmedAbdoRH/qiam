import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const BottomNavBar = () => {
  const location = useLocation();

  const navItems = [
    {
      name: "شعوريا",
      path: "/",
    },
    {
      name: "سلوكيا",
      path: "/behavioral",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-200 dark:border-gray-700 py-3 px-4 shadow-lg rounded-t-lg">
      <nav className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex-1 text-center py-2 px-4 rounded-md text-sm font-medium transition-colors",
              location.pathname === item.path
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default BottomNavBar;