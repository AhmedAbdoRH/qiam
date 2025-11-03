export const calculateBalance = (selectedFeelingsCount: number): number => {
  return Math.round(100 - (selectedFeelingsCount / 7) * 100);
};

export const getBalanceColor = (percentage: number): string => {
  let hue: number;
  if (percentage <= 50) {
    // Interpolate hue from red (0) to orange (30) for 0-50%
    hue = percentage * 0.6; // 0% -> 0 (red), 50% -> 30 (orange)
  } else {
    // Interpolate hue from orange (30) to green (120) for 50-100%
    hue = 30 + (percentage - 50) * 1.8; // 50% -> 30 (orange), 100% -> 120 (green)
  }

  // Keep saturation relatively constant for a vibrant look
  const saturation = 85; // You can adjust this value

  // Interpolate lightness from dark (30%) to normal (50%) based on percentage
  const lightness = 30 + (percentage / 100) * 20; // 0% -> 30%, 100% -> 50%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
