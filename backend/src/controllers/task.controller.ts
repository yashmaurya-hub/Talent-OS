import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { evaluateCandidatesForTask } from '../services/recommendation/scoring.service';

const prisma = new PrismaClient();

export async function getTasks(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const tasks = await prisma.task.findMany({
      where: { organizationId: req.user.organizationId },
      include: {
        creator: {
          select: {
            profile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        requirements: true,
        recommendationRuns: {
          orderBy: { runAt: 'desc' },
          take: 1,
          include: {
            _count: {
              select: { candidates: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      targetDate: t.targetDate,
      status: t.status,
      createdAt: t.createdAt,
      creatorName: t.creator.profile ? `${t.creator.profile.firstName} ${t.creator.profile.lastName}` : 'Administrator',
      requirementsCount: t.requirements.length,
      requirements: t.requirements,
      lastRunAt: t.recommendationRuns[0]?.runAt || null,
      candidatesRecommendedCount: t.recommendationRuns[0]?._count.candidates || 0,
    }));

    res.json({ tasks: formatted });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getTaskById(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        requirements: true,
        recommendationRuns: {
          orderBy: { runAt: 'desc' },
          take: 1,
          include: {
            candidates: {
              orderBy: { rank: 'asc' },
              include: {
                profile: {
                  include: {
                    hierarchyNode: true,
                  },
                },
                evidenceList: true,
              },
            },
          },
        },
      },
    });

    if (!task || task.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const latestRun = task.recommendationRuns[0] || null;

    res.json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        targetDate: task.targetDate,
        status: task.status,
        createdAt: task.createdAt,
        requirements: task.requirements,
        latestRun: latestRun
          ? {
              id: latestRun.id,
              runAt: latestRun.runAt,
              candidates: latestRun.candidates.map((c) => ({
                id: c.id,
                rank: c.rank,
                suitabilityScore: c.suitabilityScore,
                matchPercentage: c.matchPercentage,
                aiExplanation: c.aiExplanation,
                missingDataNotes: c.missingDataNotes ? JSON.parse(c.missingDataNotes) : [],
                strengths: c.strengthsSummary ? JSON.parse(c.strengthsSummary) : [],
                growthAreas: c.growthAreasSummary ? JSON.parse(c.growthAreasSummary) : [],
                profile: {
                  id: c.profile.id,
                  fullName: `${c.profile.firstName} ${c.profile.lastName}`,
                  titleRole: c.profile.titleRole,
                  department: c.profile.department,
                  avatarUrl: c.profile.avatarUrl,
                  hierarchyNode: c.profile.hierarchyNode,
                },
                evidence: c.evidenceList,
              })),
            }
          : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { title, description, category, targetDate, requirements } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'title, description, and category are required.' });
    }

    const task = await prisma.task.create({
      data: {
        organizationId: req.user.organizationId,
        createdById: req.user.id,
        title,
        description,
        category,
        targetDate: targetDate ? new Date(targetDate) : null,
        requirements: {
          create: (requirements || []).map((r: any) => ({
            requirementType: r.requirementType || 'SKILL',
            targetName: r.targetName,
            minScore: Number(r.minScore || 70),
            weight: Number(r.weight || 5),
            importance: r.importance || 'REQUIRED',
          })),
        },
      },
      include: {
        requirements: true,
      },
    });

    res.status(201).json({ message: 'Task created.', task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function recommendForTask(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { requirements: true },
    });

    if (!task || task.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (task.requirements.length === 0) {
      return res.status(400).json({ error: 'Task must have at least one requirement to compute recommendations.' });
    }

    // Fetch candidate profiles in this organization with their complete records
    const profiles = await prisma.profile.findMany({
      where: {
        user: {
          organizationId: req.user.organizationId,
          status: 'ACTIVE',
        },
      },
      include: {
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

    // Run deterministic mathematical evaluation
    const evaluationResults = evaluateCandidatesForTask(candidateInputs, task.requirements);

    // Save Recommendation Run and Candidates to database
    const savedRun = await prisma.$transaction(async (tx) => {
      const run = await tx.recommendationRun.create({
        data: {
          taskId: task.id,
          organizationId: req.user!.organizationId,
          methodologyNotes: 'Deterministic Multi-Factor Weighted Proximity Engine',
        },
      });

      for (const ev of evaluationResults) {
        const candidateRecord = await tx.recommendationCandidate.create({
          data: {
            recommendationRunId: run.id,
            profileId: ev.profileId,
            rank: ev.rank,
            suitabilityScore: ev.suitabilityScore,
            matchPercentage: ev.matchPercentage,
            aiExplanation: ev.deterministicExplanation,
            missingDataNotes: JSON.stringify(ev.missingDataNotes),
            strengthsSummary: JSON.stringify(ev.strengthsSummary),
            growthAreasSummary: JSON.stringify(ev.growthAreasSummary),
          },
        });

        // Insert evidence items
        if (ev.evidenceList.length > 0) {
          await tx.recommendationEvidence.createMany({
            data: ev.evidenceList.map((e) => ({
              candidateId: candidateRecord.id,
              factorName: e.factorName,
              factorScore: e.factorScore,
              weight: e.weight,
              rawEvidenceSummary: e.rawEvidenceSummary,
              recordSource: e.recordSource || null,
            })),
          });
        }
      }

      await tx.task.update({
        where: { id: task.id },
        data: { status: 'RECOMMENDED' },
      });

      return run;
    });

    // Re-fetch formatted candidates
    const finalRun = await prisma.recommendationRun.findUnique({
      where: { id: savedRun.id },
      include: {
        candidates: {
          orderBy: { rank: 'asc' },
          include: {
            profile: {
              include: { hierarchyNode: true },
            },
            evidenceList: true,
          },
        },
      },
    });

    res.json({
      message: 'Recommendations successfully generated.',
      runId: savedRun.id,
      taskTitle: task.title,
      candidates: finalRun?.candidates.map((c) => ({
        id: c.id,
        rank: c.rank,
        suitabilityScore: c.suitabilityScore,
        matchPercentage: c.matchPercentage,
        aiExplanation: c.aiExplanation,
        missingDataNotes: c.missingDataNotes ? JSON.parse(c.missingDataNotes) : [],
        strengths: c.strengthsSummary ? JSON.parse(c.strengthsSummary) : [],
        growthAreas: c.growthAreasSummary ? JSON.parse(c.growthAreasSummary) : [],
        profile: {
          id: c.profile.id,
          fullName: `${c.profile.firstName} ${c.profile.lastName}`,
          titleRole: c.profile.titleRole,
          department: c.profile.department,
          avatarUrl: c.profile.avatarUrl,
          hierarchyNode: c.profile.hierarchyNode,
        },
        evidence: c.evidenceList,
      })),
    });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: error.message });
  }
}
