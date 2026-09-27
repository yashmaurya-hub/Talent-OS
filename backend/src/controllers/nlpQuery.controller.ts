import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { parseNlpQuery } from '../services/ai/nlpQuery.service';
import { evaluateCandidatesForTask } from '../services/recommendation/scoring.service';
import { generateCandidateExplanation } from '../services/ai/explanation.service';

const prisma = new PrismaClient();

export async function handleNlpQuery(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { query } = req.body;
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ error: 'Query must be at least 3 characters long.' });
    }

    const { organizationId } = req.user;

    // 1. Parse natural language query into structured requirements
    const parsedTask = await parseNlpQuery(query.trim(), organizationId);

    // 2. Fetch all active candidate profiles in this organization
    const profiles = await prisma.profile.findMany({
      where: {
        user: {
          organizationId,
          status: 'ACTIVE',
        },
      },
      include: {
        hierarchyNode: true,
        skillRecords: {
          include: {
            skill: {
              include: { dimension: true },
            },
          },
        },
        performanceRecords: {
          orderBy: { recordedDate: 'asc' },
        },
        activities: {
          orderBy: { date: 'desc' },
        },
        achievements: {
          orderBy: { date: 'desc' },
        },
      },
    });

    const candidateInputs = profiles.map((p) => ({
      id: p.id,
      fullName: `${p.firstName} ${p.lastName}`,
      firstName: p.firstName,
      lastName: p.lastName,
      titleRole: p.titleRole,
      department: p.department,
      skillRecords: p.skillRecords,
      performanceRecords: p.performanceRecords,
      activities: p.activities,
      achievements: p.achievements,
    }));

    // 3. Evaluate deterministic suitability
    const evaluationResults = evaluateCandidatesForTask(candidateInputs, parsedTask.requirements);

    // 4. Edge Case Check: Do NOT force a recommendation if no strong match exists
    const topCandidate = evaluationResults[0];
    if (!topCandidate || topCandidate.suitabilityScore < 45) {
      return res.json({
        query,
        parsedTask,
        hasStrongMatch: false,
        message: 'No strong match found with the available data.',
        candidates: [],
      });
    }

    // 5. Generate AI grounded explanations for top candidates
    const enrichedCandidates = await Promise.all(
      evaluationResults.slice(0, 5).map(async (ev) => {
        const matchingProfile = profiles.find((p) => p.id === ev.profileId)!;

        const aiExplanation = await generateCandidateExplanation({
          candidateName: `${matchingProfile.firstName} ${matchingProfile.lastName}`,
          taskTitle: parsedTask.title,
          suitabilityScore: ev.suitabilityScore,
          rank: ev.rank,
          evidenceItems: ev.evidenceList.map((e) => ({
            factorName: e.factorName,
            factorScore: e.factorScore,
            rawEvidenceSummary: e.rawEvidenceSummary,
          })),
          missingDataNotes: ev.missingDataNotes,
          strengths: ev.strengthsSummary,
          growthAreas: ev.growthAreasSummary,
        });

        return {
          id: ev.profileId,
          rank: ev.rank,
          suitabilityScore: ev.suitabilityScore,
          matchPercentage: ev.matchPercentage,
          aiExplanation,
          missingDataNotes: ev.missingDataNotes,
          strengths: ev.strengthsSummary,
          growthAreas: ev.growthAreasSummary,
          profile: {
            id: matchingProfile.id,
            fullName: `${matchingProfile.firstName} ${matchingProfile.lastName}`,
            titleRole: matchingProfile.titleRole,
            department: matchingProfile.department,
            avatarUrl: matchingProfile.avatarUrl,
            hierarchyNode: matchingProfile.hierarchyNode,
          },
          evidence: ev.evidenceList,
        };
      })
    );

    res.json({
      query,
      parsedTask,
      hasStrongMatch: true,
      message: `Found ${enrichedCandidates.length} suitable candidates.`,
      candidates: enrichedCandidates,
    });
  } catch (error: any) {
    console.error('NLP Query error:', error);
    res.status(500).json({ error: error.message });
  }
}
