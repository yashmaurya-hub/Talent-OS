import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'talentos_dev_super_secret_jwt_key_2026_change_in_production';

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  profileId?: string;
  hierarchyNodeId?: string;
  hierarchyNodePath?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Validates JWT Bearer token and attaches user session context.
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Fetch user and profile context to verify active status
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: {
          include: {
            hierarchyNode: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User account is inactive or not found.' });
    }

    req.user = {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
      profileId: user.profile?.id,
      hierarchyNodeId: user.profile?.hierarchyNodeId,
      hierarchyNodePath: user.profile?.hierarchyNode?.path,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

/**
 * Restricts access based on user role (e.g. ['SUPER_ADMIN', 'HEAD']).
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' lacks permission for this resource. Required: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Enforces hierarchical subtree scoping.
 * A user can only access nodes that belong to their subtree, unless they are SUPER_ADMIN or HEAD.
 */
export async function verifySubtreeAccess(
  user: AuthenticatedUser,
  targetNodeId: string
): Promise<boolean> {
  // SUPER_ADMIN and HEAD have full organization-wide visibility
  if (user.role === 'SUPER_ADMIN' || user.role === 'HEAD') {
    return true;
  }

  if (!user.hierarchyNodeId) {
    return false;
  }

  // Same node is permitted
  if (user.hierarchyNodeId === targetNodeId) {
    return true;
  }

  // Check if target node is a descendant of the user's hierarchy node
  const targetNode = await prisma.hierarchyNode.findUnique({
    where: { id: targetNodeId },
  });

  if (!targetNode || targetNode.organizationId !== user.organizationId) {
    return false;
  }

  // Materialized path contains ancestor IDs
  return targetNode.path.includes(user.hierarchyNodeId);
}
