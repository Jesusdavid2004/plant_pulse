export const HEALTH_CONDITIONS = [
  'HEALTHY',
  'UNDERWATERED',
  'OVERWATERED',
  'SUNBURN',
  'LOW_LIGHT',
  'NUTRIENT_DEFICIENCY',
  'PESTS',
  'FUNGAL_DISEASE',
  'UNKNOWN',
] as const;

export const SEVERITIES = ['NONE', 'MILD', 'MODERATE', 'SEVERE'] as const;

export type HealthCondition = (typeof HEALTH_CONDITIONS)[number];
export type Severity = (typeof SEVERITIES)[number];
export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface HealthAssessment {
  score: number;
  status: HealthStatus;
}

const HEALTHY_SCORE = 92;
const UNKNOWN_CONDITION_SCORE = 78;
const MAX_SCORE = 100;
const MIN_SCORE = 0;
const HEALTHY_THRESHOLD = 70;
const WARNING_THRESHOLD = 40;

const SEVERITY_PENALTY: Record<Severity, number> = {
  NONE: 0,
  MILD: 20,
  MODERATE: 45,
  SEVERE: 70,
};

function baseScore(condition: HealthCondition): number {
  if (condition === 'UNKNOWN') return UNKNOWN_CONDITION_SCORE;
  return HEALTHY_SCORE;
}

export function statusForScore(score: number): HealthStatus {
  if (score >= HEALTHY_THRESHOLD) return 'healthy';
  if (score >= WARNING_THRESHOLD) return 'warning';
  return 'critical';
}

export function assessHealth(condition: HealthCondition, severity: Severity): HealthAssessment {
  const penalty = condition === 'HEALTHY' ? 0 : SEVERITY_PENALTY[severity];
  const score = Math.max(MIN_SCORE, Math.min(MAX_SCORE, baseScore(condition) - penalty));
  return { score, status: statusForScore(score) };
}
