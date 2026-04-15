export function calculateMinSellingPrice(
  costPrice: number,
  ecoTax: number,
  marginPercentage: number
): number {
  if (!costPrice || costPrice <= 0) return 0;
  const totalCost = costPrice + (ecoTax || 0);
  return totalCost * (1 + marginPercentage / 100);
}
