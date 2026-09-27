import { calculateTrajectory } from '../trajectory.service';

export interface EvaluatedEvidence {
  factorName: string;
  factorScore: number;
  weight: number;
  rawEvidenceSummary: string;
  recordSource?: string;
}

export interface CandidateEvaluationResult {
  profileId: string;
  suitabilityScore: number; // 0 - 100
  matchPercentage: number;
  rank: number;
  evidenceList: EvaluatedEvidence[];
  missingDataNotes: string[];
  strengthsSummary: string[];
  growthAreasSummary: string[];
  deterministicExplanation: string;
}

export interface TaskRequirementInput {
  id?: string;
  requirementType: string; // SKILL, DIMENSION, MIN_PERFORMANCE, EXPERIENCE, ACTIVITY_CATEGORY
  targetName: string;
  minScore: number;
  weight: number;
  importance: string; // REQUIRED, PREFERRED, BONUS
}

export interface CandidateProfileInput {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  titleRole: string;
  department: string;
  skillRecords: {
    skillId: string;
    proficiencyScore: number;
    verifiedBy?: string | null;
    skill: {
      name: string;
      category: string;
      dimension: {
        name: string;
      };
    };
  }[];
  performanceRecords: {
    id: string;
    category: string;
    title: string;
    scoreValue: number;
    gradeLetter?: string | null;
    recordedDate: Date;
    notes?: string | null;
  }[];
  activities: {
    id: string;
    name: string;
    category: string;
    role: string;
    result?: string | null;
    performanceRating?: number | null;
    date: Date;
    description?: string | null;
  }[];
  achievements: {
    id: string;
    title: string;
    category: string;
    level: string;
    date: Date;
    description?: string | null;
  }[];
}

/**
 * Deterministic Multi-Factor Suitability Recommendation Algorithm.
 * Matches Task Requirements against Candidate Profile records with zero hallucination.
 */
export function evaluateCandidatesForTask(
  candidates: CandidateProfileInput[],
  requirements: TaskRequirementInput[]
): CandidateEvaluationResult[] {
  if (!candidates || candidates.length === 0) {
    return [];
  }

  const evaluations: CandidateEvaluationResult[] = [];

  for (const candidate of candidates) {
    const evidenceList: EvaluatedEvidence[] = [];
    const missingDataNotes: string[] = [];
    const strengthsSummary: string[] = [];
    const growthAreasSummary: string[] = [];

    let totalWeightedScore = 0;
    let totalWeight = 0;
    let confidenceMultiplier = 1.0;

    // 1. Evaluate explicit task requirements
    for (const req of requirements) {
      const weight = req.weight || 5.0;
      totalWeight += weight;

      if (req.requirementType === 'SKILL') {
        const matchedSkill = candidate.skillRecords.find(
          (sr) => sr.skill.name.toLowerCase() === req.targetName.toLowerCase()
        );

        if (matchedSkill) {
          const score = matchedSkill.proficiencyScore;
          totalWeightedScore += score * weight;

          evidenceList.push({
            factorName: `Skill: ${matchedSkill.skill.name}`,
            factorScore: Math.round(score * 10) / 10,
            weight,
            rawEvidenceSummary: `Assessed at ${Math.round(score)}% proficiency${
              matchedSkill.verifiedBy ? ` (Verified by ${matchedSkill.verifiedBy})` : ''
            }`,
            recordSource: `SkillRecord:${matchedSkill.skillId}`,
          });

          if (score >= 85) {
            strengthsSummary.push(`Strong mastery in ${matchedSkill.skill.name} (${Math.round(score)}%)`);
          } else if (score < req.minScore) {
            growthAreasSummary.push(`Score in ${matchedSkill.skill.name} (${Math.round(score)}%) is below preferred threshold of ${req.minScore}%`);
          }
        } else {
          // Explicit missing data handling
          missingDataNotes.push(`${req.targetName} skill assessment is unavailable for this candidate.`);
          confidenceMultiplier *= 0.85; // Confidence penalty for unknown data
          totalWeightedScore += 35 * weight; // Conservative baseline

          evidenceList.push({
            factorName: `Skill: ${req.targetName} (Missing)`,
            factorScore: 35,
            weight,
            rawEvidenceSummary: `No verified records found for ${req.targetName}. Evaluated with confidence discount.`,
          });
        }
      } else if (req.requirementType === 'EXPERIENCE' || req.requirementType === 'ACTIVITY_CATEGORY') {
        const matchedActivities = candidate.activities.filter(
          (a) => a.category.toLowerCase() === req.targetName.toLowerCase() ||
                 a.name.toLowerCase().includes(req.targetName.toLowerCase())
        );

        const count = matchedActivities.length;
        if (count > 0) {
          const avgRating = matchedActivities.reduce((acc, a) => acc + (a.performanceRating || 80), 0) / count;
          const experienceScore = Math.min(100, Math.round(avgRating * 0.7 + Math.min(count, 3) * 10));

          totalWeightedScore += experienceScore * weight;
          const sample = matchedActivities[0];

          evidenceList.push({
            factorName: `Track Record: ${req.targetName}`,
            factorScore: experienceScore,
            weight,
            rawEvidenceSummary: `${count} recorded event(s), including '${sample.name}' (${sample.result || sample.role})`,
            recordSource: `Activity:${sample.id}`,
          });

          strengthsSummary.push(`Proven track record in ${req.targetName} (${count} events)`);
        } else {
          missingDataNotes.push(`No prior ${req.targetName} experience records found.`);
          confidenceMultiplier *= 0.88;
          totalWeightedScore += 30 * weight;

          evidenceList.push({
            factorName: `Track Record: ${req.targetName} (None)`,
            factorScore: 30,
            weight,
            rawEvidenceSummary: `Zero recorded activities under category '${req.targetName}'.`,
          });
        }
      } else if (req.requirementType === 'MIN_PERFORMANCE') {
        const perfAverage =
          candidate.performanceRecords.length > 0
            ? candidate.performanceRecords.reduce((acc, p) => acc + p.scoreValue, 0) / candidate.performanceRecords.length
            : 0;

        totalWeightedScore += perfAverage * weight;
        evidenceList.push({
          factorName: 'Overall Performance Benchmark',
          factorScore: Math.round(perfAverage * 10) / 10,
          weight,
          rawEvidenceSummary: `Historical record average of ${Math.round(perfAverage)}% across ${candidate.performanceRecords.length} assessments.`,
        });
      }
    }

    // 2. Trajectory & Growth Momentum adjustment
    const trajectory = calculateTrajectory(candidate.performanceRecords);
    let momentumBonus = 0;

    if (trajectory.growthRateSlope >= 2.0) {
      momentumBonus += 0.05; // 5% bonus for rapid positive growth
      strengthsSummary.push(`Surging performance trajectory (+${trajectory.growthRateSlope} slope)`);
      evidenceList.push({
        factorName: 'Upward Trajectory Momentum',
        factorScore: Math.min(100, 75 + trajectory.growthRateSlope * 5),
        weight: 3.0,
        rawEvidenceSummary: `Demonstrates accelerated progress with positive growth slope of +${trajectory.growthRateSlope}.`,
      });
    } else if (trajectory.growthRateSlope <= -2.0) {
      momentumBonus -= 0.05;
      growthAreasSummary.push(`Recent performance trajectory shows downward trend (${trajectory.growthRateSlope})`);
    }

    // Consistency Bonus
    if (trajectory.consistencyScore >= 90 && trajectory.sampleCount >= 2) {
      momentumBonus += 0.03;
      evidenceList.push({
        factorName: 'High Consistency & Composure',
        factorScore: trajectory.consistencyScore,
        weight: 2.0,
        rawEvidenceSummary: `Exceptional stability score of ${trajectory.consistencyScore}% across ${trajectory.sampleCount} recorded terms.`,
      });
    }

    // Normalize base score
    const rawAverage = totalWeight > 0 ? totalWeightedScore / totalWeight : 50;
    const finalSuitability = Math.max(
      10,
      Math.min(100, Math.round(rawAverage * confidenceMultiplier * (1 + momentumBonus) * 10) / 10)
    );

    // Build clear deterministic explanation text
    const keyPoints: string[] = [];
    if (evidenceList.length > 0) {
      const topEvidence = [...evidenceList].sort((a, b) => b.factorScore - a.factorScore).slice(0, 3);
      for (const ev of topEvidence) {
        keyPoints.push(`• ${ev.factorName}: ${ev.rawEvidenceSummary}`);
      }
    }
    if (missingDataNotes.length > 0) {
      keyPoints.push(`• Note: ${missingDataNotes[0]}`);
    }

    const deterministicExplanation = `${candidate.fullName} achieved a suitability score of ${finalSuitability}% based on verified records:\n${keyPoints.join('\n')}`;

    evaluations.push({
      profileId: candidate.id,
      suitabilityScore: finalSuitability,
      matchPercentage: Math.min(100, Math.round(finalSuitability)),
      rank: 1, // Will be set after sorting
      evidenceList,
      missingDataNotes,
      strengthsSummary,
      growthAreasSummary,
      deterministicExplanation,
    });
  }

  // Sort descending by suitability score
  evaluations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  // Assign ranks
  evaluations.forEach((item, index) => {
    item.rank = index + 1;
  });

  return evaluations;
}
