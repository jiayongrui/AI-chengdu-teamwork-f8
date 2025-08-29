// 新增统一评分计算工具
export function calculateWeightedScore(
  scores: Record<string, number>,
  weights: Record<string, number>
): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const [key, score] of Object.entries(scores)) {
    const weight = weights[key] || 0;
    weightedSum += score * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 20) : 0;
}