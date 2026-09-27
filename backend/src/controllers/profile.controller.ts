import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, verifySubtreeAccess } from '../middleware/auth';
import { calculateTrajectory, deriveStrengthsAndDevelopmentAreas } from '../services/trajectory.service';

const prisma = new PrismaClient();

export async function getProfiles(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { organizationId, role, hierarchyNodeId } = req.user;
    const {
      search,
      nodeId,
      skill,
      minSkillScore,
      minPerformance,
      trajectoryTrend,
      activityCategory,
    } = req.query;

    const whereClause: any = {
      user: {
        organizationId,
      },
    };

    // Subtree Scoping for Manager
    if (role === 'MANAGER' && hierarchyNodeId) {
      const userNode = await prisma.hierarchyNode.findUnique({
        where: { id: hierarchyNodeId },
      });
      if (userNode) {
        whereClause.hierarchyNode = {
          OR: [
            { id: hierarchyNodeId },
            { path: { contains: hierarchyNodeId } },
          ],
        };
      }
    } else if (nodeId) {
      whereClause.hierarchyNodeId = String(nodeId);
    }

    // Text search by name, role, department
    if (search) {
      const q = String(search).toLowerCase();
      whereClause.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { titleRole: { contains: q } },
        { department: { contains: q } },
      ];
    }

    // Filter by skill
    if (skill) {
      whereClause.skillRecords = {
        some: {
          skill: {
            name: { contains: String(skill) },
          },
          ...(minSkillScore ? { proficiencyScore: { gte: Number(minSkillScore) } } : {}),
        },
      };
    }

    // Filter by activity category
    if (activityCategory) {
      whereClause.activities = {
        some: {
          category: String(activityCategory),
        },
      };
    }

    const profiles = await prisma.profile.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, email: true, role: true, status: true },
        },
        hierarchyNode: {
          select: { id: true, name: true, nodeType: true, path: true },
        },
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
          take: 3,
        },
        achievements: {
          orderBy: { date: 'desc' },
          take: 2,
        },
      },
      orderBy: { firstName: 'asc' },
    });

    // Compute trajectory and summary metrics
    const results = profiles.map((p) => {
      const trajectory = calculateTrajectory(p.performanceRecords);
      const { strengths, developmentAreas } = deriveStrengthsAndDevelopmentAreas(p.skillRecords, trajectory);

      return {
        id: p.id,
        userId: p.userId,
        fullName: `${p.firstName} ${p.lastName}`,
        firstName: p.firstName,
        lastName: p.lastName,
        avatarUrl: p.avatarUrl,
        titleRole: p.titleRole,
        department: p.department,
        joinedDate: p.joinedDate,
        contactEmail: p.contactEmail,
        status: p.status,
        userRole: p.user.role,
        hierarchyNode: p.hierarchyNode,
        skillsCount: p.skillRecords.length,
        activitiesCount: p.activities.length,
        achievementsCount: p.achievements.length,
        trajectory,
        strengths: strengths.slice(0, 3),
        developmentAreas: developmentAreas.slice(0, 2),
      };
    });

    // Post-filter by minimum performance or trajectory trend if requested
    let filtered = results;
    if (minPerformance) {
      const minVal = Number(minPerformance);
      filtered = filtered.filter((r) => r.trajectory.averageScore >= minVal);
    }
    if (trajectoryTrend) {
      filtered = filtered.filter((r) => r.trajectory.trendDirection === String(trajectoryTrend));
    }

    res.json({
      total: filtered.length,
      profiles: filtered,
    });
  } catch (error: any) {
    console.error('Error in getProfiles:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getProfileById(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { id } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, role: true, status: true, organizationId: true },
        },
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

    if (!profile || profile.user.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    // Permission check for MEMBER role: can only view own profile
    if (req.user.role === 'MEMBER' && req.user.profileId !== profile.id) {
      return res.status(403).json({ error: 'You only have permission to view your own profile.' });
    }

    // Subtree permission check for MANAGER
    if (req.user.role === 'MANAGER') {
      const hasAccess = await verifySubtreeAccess(req.user, profile.hierarchyNodeId);
      if (!hasAccess && req.user.profileId !== profile.id) {
        return res.status(403).json({ error: 'Profile is outside your permitted organizational branch.' });
      }
    }

    // Compute trajectory
    const trajectory = calculateTrajectory(profile.performanceRecords);

    // Compute dimension aggregates for Radar Chart
    const dimensionAverages: Record<string, { total: number; count: number }> = {};
    for (const s of profile.skillRecords) {
      const dimName = s.skill.dimension.name;
      if (!dimensionAverages[dimName]) {
        dimensionAverages[dimName] = { total: 0, count: 0 };
      }
      dimensionAverages[dimName].total += s.proficiencyScore;
      dimensionAverages[dimName].count += 1;
    }

    const radarData = Object.entries(dimensionAverages).map(([dimension, { total, count }]) => ({
      dimension,
      score: Math.round((total / count) * 10) / 10,
      fullMark: 100,
    }));

    // Strengths and Development Areas
    const { strengths, developmentAreas } = deriveStrengthsAndDevelopmentAreas(
      profile.skillRecords,
      trajectory
    );

    res.json({
      profile: {
        id: profile.id,
        userId: profile.userId,
        fullName: `${profile.firstName} ${profile.lastName}`,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
        titleRole: profile.titleRole,
        department: profile.department,
        joinedDate: profile.joinedDate,
        contactEmail: profile.contactEmail,
        bio: profile.bio,
        status: profile.status,
        userRole: profile.user.role,
        hierarchyNode: profile.hierarchyNode,
        skills: profile.skillRecords.map((sr) => ({
          id: sr.id,
          skillId: sr.skillId,
          name: sr.skill.name,
          category: sr.skill.category,
          dimensionName: sr.skill.dimension.name,
          proficiencyScore: sr.proficiencyScore,
          verifiedBy: sr.verifiedBy,
          lastAssessedAt: sr.lastAssessedAt,
        })),
        performanceRecords: profile.performanceRecords,
        activities: profile.activities,
        achievements: profile.achievements,
        trajectory,
        radarData,
        strengths,
        developmentAreas,
      },
    });
  } catch (error: any) {
    console.error('Error in getProfileById:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createPerson(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const {
      firstName,
      lastName,
      email,
      password,
      role = 'MEMBER',
      hierarchyNodeId,
      titleRole,
      department,
      bio,
    } = req.body;

    if (!firstName || !lastName || !email || !hierarchyNodeId || !titleRole) {
      return res.status(400).json({ error: 'Missing required person fields.' });
    }

    const node = await prisma.hierarchyNode.findUnique({
      where: { id: hierarchyNodeId },
    });

    if (!node || node.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Hierarchy node not found.' });
    }

    const hasAccess = await verifySubtreeAccess(req.user, hierarchyNodeId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Permission denied to add person outside your branch.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password || 'password123', 10);

    const newUser = await prisma.user.create({
      data: {
        organizationId: req.user.organizationId,
        email,
        passwordHash,
        role,
        profile: {
          create: {
            hierarchyNodeId,
            firstName,
            lastName,
            titleRole,
            department: department || node.name,
            contactEmail: email,
            bio,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    res.status(201).json({
      message: 'Person successfully registered.',
      profile: newUser.profile,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function addPerformanceRecord(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { category, title, scoreValue, gradeLetter, recordedDate, notes } = req.body;

    if (!category || !title || scoreValue === undefined || !recordedDate) {
      return res.status(400).json({ error: 'category, title, scoreValue, and recordedDate are required.' });
    }

    const record = await prisma.performanceRecord.create({
      data: {
        profileId: id,
        category,
        title,
        scoreValue: Number(scoreValue),
        gradeLetter,
        recordedDate: new Date(recordedDate),
        notes,
      },
    });

    res.status(201).json({ message: 'Performance record added.', record });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function addSkillRecord(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { skillId, skillName, dimensionName, proficiencyScore, verifiedBy } = req.body;

    if (proficiencyScore === undefined) {
      return res.status(400).json({ error: 'proficiencyScore is required.' });
    }

    let targetSkillId = skillId;

    // Auto-create skill if name provided
    if (!targetSkillId && skillName && dimensionName && req.user) {
      let dim = await prisma.capabilityDimension.findFirst({
        where: { organizationId: req.user.organizationId, name: dimensionName },
      });
      if (!dim) {
        dim = await prisma.capabilityDimension.create({
          data: { organizationId: req.user.organizationId, name: dimensionName },
        });
      }

      let s = await prisma.skill.findFirst({
        where: { organizationId: req.user.organizationId, name: skillName },
      });
      if (!s) {
        s = await prisma.skill.create({
          data: { organizationId: req.user.organizationId, dimensionId: dim.id, name: skillName, category: 'DOMAIN' },
        });
      }
      targetSkillId = s.id;
    }

    const skillRecord = await prisma.skillRecord.upsert({
      where: {
        profileId_skillId: {
          profileId: id,
          skillId: targetSkillId,
        },
      },
      update: {
        proficiencyScore: Number(proficiencyScore),
        verifiedBy,
        lastAssessedAt: new Date(),
      },
      create: {
        profileId: id,
        skillId: targetSkillId,
        proficiencyScore: Number(proficiencyScore),
        verifiedBy,
      },
    });

    res.status(201).json({ message: 'Skill record saved.', skillRecord });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function addActivity(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, category, role, result, performanceRating, date, description } = req.body;

    if (!name || !category || !role || !date) {
      return res.status(400).json({ error: 'name, category, role, and date are required.' });
    }

    const activity = await prisma.activity.create({
      data: {
        profileId: id,
        name,
        category,
        role,
        result,
        performanceRating: performanceRating ? Number(performanceRating) : null,
        date: new Date(date),
        description,
      },
    });

    res.status(201).json({ message: 'Activity recorded.', activity });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function addAchievement(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, category, level = 'REGIONAL', date, description, evidenceUrl } = req.body;

    if (!title || !category || !date) {
      return res.status(400).json({ error: 'title, category, and date are required.' });
    }

    const achievement = await prisma.achievement.create({
      data: {
        profileId: id,
        title,
        category,
        level,
        date: new Date(date),
        description,
        evidenceUrl,
      },
    });

    res.status(201).json({ message: 'Achievement recorded.', achievement });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
