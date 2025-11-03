import { getBalanceColor } from "@/utils/balanceCalculator";

interface ValueCardProps {
  name: string;
  balancePercentage: number;
  onClick: () => void;
}

export const ValueCard = ({ name, balancePercentage, onClick }: ValueCardProps) => {
  const backgroundColor = getBalanceColor(balancePercentage);

  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-xl p-4 min-h-[100px] transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 balance-gradient"
      style={{
        background: `linear-gradient(135deg, ${backgroundColor}, ${backgroundColor}dd)`,
      }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
        <h3 className="text-white font-bold text-base md:text-lg text-center leading-tight drop-shadow-md">
          {name}
        </h3>
        <span className="text-white/90 text-sm font-medium drop-shadow-md">
          {balancePercentage}%
        </span>
      </div>
    </button>
  );
};
