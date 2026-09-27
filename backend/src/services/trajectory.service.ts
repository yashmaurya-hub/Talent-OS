export interface PerformanceRecordInput {
  scoreValue: number;
  recordedDate: Date | string;
  category?: string;
  title?: string;
}

export interface TrajectoryCalculationResult {
  growthRateSlope: number;
  consistencyScore: number;
  trendDirection: 'SURGING' | 'STEADY_IMPROVEMENT' | 'CONSISTENT' | 'FLUCTUATING' | 'DECLINING';
  averageScore: number;
  standardDeviation: number;
  sampleCount: number;
}

/**
 * Calculates deterministic trajectory metrics across longitudinal performance records.
 * Uses Ordinary Least Squares (OLS) linear regression for growth slope
 * and Coefficient of Variation for consistency score.
 */
export function calculateTrajectory(records: PerformanceRecordInput[]): TrajectoryCalculationResult {
  if (!records || records.length === 0) {
    return {
      growthRateSlope: 0,
      consistencyScore: 50,
      trendDirection: 'CONSISTENT',
      averageScore: 0,
      standardDeviation: 0,
      sampleCount: 0,
    };
  }

  // Sort chronologically ascending
  const sorted = [...records].sort(
    (a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime()
  );

  const n = sorted.length;
  const scores = sorted.map((r) => r.scoreValue);
  const sum = scores.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;

  if (n === 1) {
    return {
      growthRateSlope: 0,
      consistencyScore: 100,
      trendDirection: 'CONSISTENT',
      averageScore: Math.round(mean * 10) / 10,
      standardDeviation: 0,
      sampleCount: 1,
    };
  }

  // Linear Regression Slope
  // x = 1, 2, ..., n
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = scores[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;

  // Standard deviation & Coefficient of Variation (CV)
  const variance = scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;

  // Consistency Score: 0 - 100. Lower CV = higher consistency
  // If CV is 0 (identical scores), consistency is 100.
  // If CV is 0.25 (25% variance), consistency is approx 75.
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 * (1 - cv))));

  // Trend Categorization
  let trendDirection: TrajectoryCalculationResult['trendDirection'] = 'CONSISTENT';

  if (slope >= 3.5) {
    trendDirection = 'SURGING';
  } else if (slope >= 1.0) {
    trendDirection = 'STEADY_IMPROVEMENT';
  } else if (slope <= -2.0) {
    trendDirection = 'DECLINING';
  } else if (cv > 0.15) {
    trendDirection = 'FLUCTUATING';
  } else {
    trendDirection = 'CONSISTENT';
  }

  return {
    growthRateSlope: Math.round(slope * 100) / 100,
    consistencyScore,
    trendDirection,
    averageScore: Math.round(mean * 10) / 10,
    standardDeviation: Math.round(stdDev * 100) / 100,
    sampleCount: n,
  };
}

/**
 * Derives factual strengths and development areas strictly from stored records.
 * Will NOT fabricate attributes.
 */
export function deriveStrengthsAndDevelopmentAreas(
  skills: { skill: { name: string }; proficiencyScore: number }[],
  trajectory: TrajectoryCalculationResult
): { strengths: string[]; developmentAreas: string[] } {
  const strengths: string[] = [];
  const developmentAreas: string[] = [];

  // Skills inspection
  for (const item of skills) {
    if (item.proficiencyScore >= 85) {
      strengths.push(`High proficiency in ${item.skill.name} (${Math.round(item.proficiencyScore)}%)`);
    } else if (item.proficiencyScore <= 65) {
      developmentAreas.push(`Skill development required in ${item.skill.name} (${Math.round(item.proficiencyScore)}%)`);
    }
  }

  // Trajectory inspection
  if (trajectory.growthRateSlope >= 2.0) {
    strengths.push(`Accelerated learning trajectory (+${trajectory.growthRateSlope} slope)`);
  } else if (trajectory.growthRateSlope <= -2.0) {
    developmentAreas.push(`Declining performance trajectory (${trajectory.growthRateSlope} slope)`);
  }

  if (trajectory.consistencyScore >= 85 && trajectory.sampleCount >= 2) {
    strengths.push(`High reliability and steady consistency (${trajectory.consistencyScore}%)`);
  } else if (trajectory.consistencyScore < 60 && trajectory.sampleCount >= 2) {
    developmentAreas.push(`Performance consistency fluctuates across terms (${trajectory.consistencyScore}%)`);
  }

  return { strengths, developmentAreas };
}
