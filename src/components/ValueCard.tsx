import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ValueCardProps {
  name: string;
  balancePercentage: number;
  onClick: () => void;
}

export const ValueCard = ({ name, balancePercentage, onClick }: ValueCardProps) => {
  const getBalanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBalanceBg = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500/10";
    if (percentage >= 50) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
        "flex flex-col items-center justify-center gap-3 min-h-[120px]",
        getBalanceBg(balancePercentage)
      )}
    >
      <h3 className="text-base md:text-lg font-semibold text-center text-foreground">
        {name}
      </h3>
      <div className={cn("text-2xl font-bold", getBalanceColor(balancePercentage))}>
        {balancePercentage}%
      </div>
    </Card>
  );
};
