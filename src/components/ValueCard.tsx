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
      className="group relative overflow-hidden rounded-2xl p-5 min-h-[120px] transition-all duration-500 hover:scale-[1.08] hover:shadow-2xl active:scale-95 border-2"
      style={{
        background: `linear-gradient(145deg, ${backgroundColor}ee, ${backgroundColor})`,
        borderColor: backgroundColor,
        boxShadow: `0 8px 32px ${backgroundColor}40`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
        <h3 className="text-white font-bold text-base md:text-xl text-center leading-tight drop-shadow-lg">
          {name}
        </h3>
        <div className="flex items-center gap-2">
          <div 
            className="px-4 py-1.5 rounded-full font-bold text-sm backdrop-blur-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            <span className="text-white drop-shadow-md">{balancePercentage}%</span>
          </div>
        </div>
      </div>
    </button>
  );
};
