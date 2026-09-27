import { TaskRequirementInput } from '../recommendation/scoring.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ParsedNlpTask {
  title: string;
  category: string;
  description: string;
  requirements: TaskRequirementInput[];
}

/**
 * Natural Language Query Parser for TalentOS.
 * Converts plain English requests into structured requirement vectors.
 */
export async function parseNlpQuery(
  query: string,
  organizationId: string
): Promise<ParsedNlpTask> {
  const lower = query.toLowerCase();

  // Fetch available skills in this org to perform fuzzy vocabulary mapping
  const availableSkills = await prisma.skill.findMany({
    where: { organizationId },
    select: { name: true, category: true },
  });

  const requirements: TaskRequirementInput[] = [];
  let category = 'GENERAL_TASK';
  let title = query.length > 50 ? `${query.slice(0, 47)}...` : query;

  // 1. Detect Category Intent
  if (lower.includes('quiz') || lower.includes('olympiad') || lower.includes('competition')) {
    category = 'COMPETITION';
    requirements.push({
      requirementType: 'EXPERIENCE',
      targetName: 'COMPETITION',
      minScore: 75,
      weight: 8.0,
      importance: 'REQUIRED',
    });
  } else if (lower.includes('present') || lower.includes('keynote') || lower.includes('speech') || lower.includes('talk')) {
    category = 'PRESENTATION';
    requirements.push({
      requirementType: 'EXPERIENCE',
      targetName: 'PRESENTATION',
      minScore: 80,
      weight: 8.5,
      importance: 'REQUIRED',
    });
  } else if (lower.includes('lead') || lower.includes('manager') || lower.includes('captain') || lower.includes('head')) {
    category = 'PROJECT_LEAD';
    requirements.push({
      requirementType: 'SKILL',
      targetName: 'Team Leadership',
      minScore: 80,
      weight: 9.0,
      importance: 'REQUIRED',
    });
  }

  // 2. Map query keywords to Registered Skills
  for (const skill of availableSkills) {
    const skillNameLower = skill.name.toLowerCase();
    
    // Exact or partial word match
    if (lower.includes(skillNameLower)) {
      requirements.push({
        requirementType: 'SKILL',
        targetName: skill.name,
        minScore: 80,
        weight: 9.0,
        importance: 'REQUIRED',
      });
      continue;
    }

    // Synonym mappings
    if (
      (skillNameLower.includes('physics') && (lower.includes('physics') || lower.includes('science'))) ||
      (skillNameLower.includes('math') && (lower.includes('math') || lower.includes('calculus') || lower.includes('algebra'))) ||
      (skillNameLower.includes('chemistry') && (lower.includes('chemistry') || lower.includes('bio'))) ||
      (skillNameLower.includes('speaking') && (lower.includes('communication') || lower.includes('presentation') || lower.includes('orator'))) ||
      (skillNameLower.includes('debate') && (lower.includes('debate') || lower.includes('argumentation'))) ||
      (skillNameLower.includes('distributed') && (lower.includes('distributed') || lower.includes('backend') || lower.includes('cloud'))) ||
      (skillNameLower.includes('quiz') && lower.includes('quiz'))
    ) {
      // Avoid duplicate targets
      if (!requirements.some((r) => r.targetName === skill.name)) {
        requirements.push({
          requirementType: 'SKILL',
          targetName: skill.name,
          minScore: 78,
          weight: 8.5,
          importance: 'REQUIRED',
        });
      }
    }
  }

  // Fallback if no specific skills mapped: add overall benchmark
  if (requirements.length === 0) {
    requirements.push({
      requirementType: 'MIN_PERFORMANCE',
      targetName: 'Overall Academic / KPI Benchmark',
      minScore: 75,
      weight: 5.0,
      importance: 'REQUIRED',
    });
  }

  return {
    title: `Query: ${title}`,
    category,
    description: `Dynamic task generated from natural language query: "${query}"`,
    requirements,
  };
}
