export const calculateBalance = (selectedFeelingsCount: number): number => {
  return Math.round(100 - (selectedFeelingsCount / 7) * 100);
};

export const getBalanceColor = (percentage: number): string => {
  if (percentage >= 80) {
    return "hsl(120, 60%, 45%)"; // Green
  } else if (percentage >= 60) {
    return "hsl(85, 70%, 45%)"; // Yellow-Green
  } else if (percentage >= 40) {
    return "hsl(50, 100%, 50%)"; // Yellow
  } else if (percentage >= 20) {
    return "hsl(25, 100%, 50%)"; // Orange
  } else {
    return "hsl(0, 85%, 50%)"; // Red
  }
};
