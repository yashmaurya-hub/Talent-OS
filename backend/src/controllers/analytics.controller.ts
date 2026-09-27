import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateTrajectory } from '../services/trajectory.service';

const prisma = new PrismaClient();

export async function getOverview(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { organizationId } = req.user;

    // 1. Fetch organization info & dimensions
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        capabilityDimensions: {
          include: {
            skills: {
              include: {
                records: true,
              },
            },
          },
        },
      },
    });

    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    // 2. Headcounts
    const [totalPeople, totalTasks, openTasks, completedTasks] = await Promise.all([
      prisma.profile.count({ where: { user: { organizationId } } }),
      prisma.task.count({ where: { organizationId } }),
      prisma.task.count({ where: { organizationId, status: 'OPEN' } }),
      prisma.task.count({ where: { organizationId, status: 'COMPLETED' } }),
    ]);

    // 3. Profiles with records for trajectory analysis
    const profiles = await prisma.profile.findMany({
      where: { user: { organizationId } },
      include: {
        performanceRecords: {
          orderBy: { recordedDate: 'asc' },
        },
        skillRecords: {
          include: {
            skill: true,
          },
        },
        achievements: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });

    // 4. Calculate individual trajectories
    const analyzedProfiles = profiles.map((p) => {
      const trajectory = calculateTrajectory(p.performanceRecords);
      return {
        id: p.id,
        fullName: `${p.firstName} ${p.lastName}`,
        titleRole: p.titleRole,
        department: p.department,
        trajectory,
      };
    });

    // Top surging talent (highest positive slope)
    const surgingTalent = [...analyzedProfiles]
      .filter((p) => p.trajectory.sampleCount >= 2 && p.trajectory.growthRateSlope > 0)
      .sort((a, b) => b.trajectory.growthRateSlope - a.trajectory.growthRateSlope)
      .slice(0, 4);

    // Highly consistent talent
    const consistentTalent = [...analyzedProfiles]
      .filter((p) => p.trajectory.sampleCount >= 2)
      .sort((a, b) => b.trajectory.consistencyScore - a.trajectory.consistencyScore)
      .slice(0, 4);

    // 5. Capability Dimension Averages for Radar Chart
    const dimensionAverages = org.capabilityDimensions.map((dim) => {
      let totalScore = 0;
      let count = 0;
      for (const skill of dim.skills) {
        for (const rec of skill.records) {
          totalScore += rec.proficiencyScore;
          count += 1;
        }
      }
      return {
        dimension: dim.name,
        averageScore: count > 0 ? Math.round((totalScore / count) * 10) / 10 : 70,
        fullMark: 100,
      };
    });

    // 6. Skill strengths vs development areas across the entire org
    const skillStats: { name: string; avg: number; count: number }[] = [];
    for (const dim of org.capabilityDimensions) {
      for (const skill of dim.skills) {
        if (skill.records.length > 0) {
          const avg = skill.records.reduce((acc, r) => acc + r.proficiencyScore, 0) / skill.records.length;
          skillStats.push({ name: skill.name, avg: Math.round(avg * 10) / 10, count: skill.records.length });
        }
      }
    }

    const topSkills = [...skillStats].sort((a, b) => b.avg - a.avg).slice(0, 5);
    const attentionSkills = [...skillStats].sort((a, b) => a.avg - b.avg).slice(0, 3);

    // 7. Recent Achievements across the organization
    const recentAchievements = await prisma.achievement.findMany({
      where: { profile: { user: { organizationId } } },
      include: {
        profile: {
          select: { firstName: true, lastName: true, department: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 6,
    });

    res.json({
      organization: {
        id: org.id,
        name: org.name,
        type: org.type,
      },
      stats: {
        totalPeople,
        totalTasks,
        openTasks,
        completedTasks,
      },
      dimensionAverages,
      surgingTalent,
      consistentTalent,
      topSkills,
      attentionSkills,
      recentAchievements: recentAchievements.map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        level: a.level,
        date: a.date,
        personName: `${a.profile.firstName} ${a.profile.lastName}`,
        department: a.profile.department,
      })),
    });
  } catch (error: any) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: error.message });
  }
}
