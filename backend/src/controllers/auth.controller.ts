import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'talentos_dev_super_secret_jwt_key_2026_change_in_production';

export async function register(req: Request, res: Response) {
  try {
    const {
      organizationName,
      organizationType,
      email,
      password,
      firstName,
      lastName,
      titleRole,
      department,
    } = req.body;

    if (!organizationName || !organizationType || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All required registration fields must be provided.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create Organization, root hierarchy node, Head User, and Profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          type: organizationType,
        },
      });

      // Default root hierarchy node
      const rootNode = await tx.hierarchyNode.create({
        data: {
          organizationId: org.id,
          name: organizationType === 'SCHOOL' || organizationType === 'COLLEGE' ? 'Office of the Principal / Dean' : 'Executive Leadership',
          nodeType: 'ADMINISTRATION',
          depth: 0,
          path: `/${org.id}`,
        },
      });

      // Default baseline capability dimensions
      const defaultDims = [
        { name: 'Core Domain Expertise', weight: 1.0, description: 'Core functional skills and technical knowledge' },
        { name: 'Communication & Influence', weight: 0.9, description: 'Verbal articulation, presentation, and clarity' },
        { name: 'Leadership & Initiative', weight: 0.85, description: 'Guiding others, ownership, and problem solving' },
        { name: 'Creativity & Innovation', weight: 0.8, description: 'Novel approaches and adaptive thinking' },
        { name: 'Consistency & Reliability', weight: 0.9, description: 'Steady follow-through and dependability' },
      ];

      for (const dim of defaultDims) {
        await tx.capabilityDimension.create({
          data: {
            organizationId: org.id,
            name: dim.name,
            weight: dim.weight,
            description: dim.description,
          },
        });
      }

      // Root Head User
      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email,
          passwordHash,
          role: 'HEAD',
          status: 'ACTIVE',
        },
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          hierarchyNodeId: rootNode.id,
          firstName,
          lastName,
          titleRole: titleRole || (organizationType === 'SCHOOL' ? 'Principal' : 'Chief Executive'),
          department: department || 'Executive Leadership',
          contactEmail: email,
        },
      });

      return { org, user, profile, rootNode };
    });

    const token = jwt.sign(
      { userId: result.user.id, organizationId: result.org.id, role: result.user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Organization and Head account successfully created.',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        organizationId: result.org.id,
        organizationName: result.org.name,
        organizationType: result.org.type,
        profile: result.profile,
        hierarchyNode: result.rootNode,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        profile: {
          include: {
            hierarchyNode: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, organizationId: user.organizationId, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        organizationType: user.organization.type,
        profile: user.profile,
        hierarchyNode: user.profile?.hierarchyNode,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        organization: {
          include: {
            capabilityDimensions: true,
          },
        },
        profile: {
          include: {
            hierarchyNode: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization: user.organization,
        profile: user.profile,
        hierarchyNode: user.profile?.hierarchyNode,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getDemoAccounts(_req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      include: {
        organization: true,
        profile: true,
      },
      take: 8,
    });

    const demoList = users.map((u) => ({
      email: u.email,
      name: `${u.profile?.firstName} ${u.profile?.lastName}`,
      role: u.role,
      title: u.profile?.titleRole,
      orgName: u.organization.name,
      orgType: u.organization.type,
      password: 'password123',
    }));

    res.json({ demoAccounts: demoList });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
