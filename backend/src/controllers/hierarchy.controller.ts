import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, verifySubtreeAccess } from '../middleware/auth';

const prisma = new PrismaClient();

interface TreeNode {
  id: string;
  name: string;
  nodeType: string;
  depth: number;
  parentId: string | null;
  path: string;
  memberCount: number;
  children: TreeNode[];
}

export async function getHierarchyTree(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { organizationId, role, hierarchyNodeId } = req.user;

    // Fetch all nodes and member counts for this organization
    const nodes = await prisma.hierarchyNode.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { profiles: true },
        },
      },
      orderBy: [{ depth: 'asc' }, { name: 'asc' }],
    });

    if (nodes.length === 0) {
      return res.json({ tree: null, nodes: [] });
    }

    // Map into lookup dictionary
    const nodeMap = new Map<string, TreeNode>();
    for (const n of nodes) {
      nodeMap.set(n.id, {
        id: n.id,
        name: n.name,
        nodeType: n.nodeType,
        depth: n.depth,
        parentId: n.parentId,
        path: n.path,
        memberCount: n._count.profiles,
        children: [],
      });
    }

    // Build hierarchical tree
    const rootNodes: TreeNode[] = [];
    for (const n of nodes) {
      const current = nodeMap.get(n.id)!;
      if (n.parentId && nodeMap.has(n.parentId)) {
        nodeMap.get(n.parentId)!.children.push(current);
      } else {
        rootNodes.push(current);
      }
    }

    // If MANAGER role, return their subtree as the primary view
    if (role === 'MANAGER' && hierarchyNodeId && nodeMap.has(hierarchyNodeId)) {
      return res.json({
        tree: nodeMap.get(hierarchyNodeId),
        allNodes: nodes,
        scoped: true,
      });
    }

    res.json({
      tree: rootNodes[0] || null,
      allRoots: rootNodes,
      allNodes: nodes,
      scoped: false,
    });
  } catch (error: any) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createNode(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { name, nodeType, parentId } = req.body;
    if (!name || !nodeType) {
      return res.status(400).json({ error: 'Node name and nodeType are required.' });
    }

    let depth = 0;
    let path = `/${req.user.organizationId}`;

    if (parentId) {
      const parentNode = await prisma.hierarchyNode.findUnique({
        where: { id: parentId },
      });

      if (!parentNode || parentNode.organizationId !== req.user.organizationId) {
        return res.status(404).json({ error: 'Parent hierarchy node not found in this organization.' });
      }

      // Verify subtree access if caller is MANAGER
      const hasAccess = await verifySubtreeAccess(req.user, parentId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'You do not have permission to add nodes outside your subtree.' });
      }

      depth = parentNode.depth + 1;
      path = `${parentNode.path}/${parentNode.id}`;
    }

    const newNode = await prisma.hierarchyNode.create({
      data: {
        organizationId: req.user.organizationId,
        parentId: parentId || null,
        name,
        nodeType,
        depth,
        path,
      },
    });

    res.status(201).json({
      message: 'Hierarchy node created successfully.',
      node: newNode,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateNode(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { id } = req.params;
    const { name, nodeType } = req.body;

    const existingNode = await prisma.hierarchyNode.findUnique({
      where: { id },
    });

    if (!existingNode || existingNode.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Hierarchy node not found.' });
    }

    const hasAccess = await verifySubtreeAccess(req.user, id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Permission denied to modify node outside your subtree.' });
    }

    const updated = await prisma.hierarchyNode.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingNode.name,
        nodeType: nodeType !== undefined ? nodeType : existingNode.nodeType,
      },
    });

    res.json({ message: 'Hierarchy node updated.', node: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteNode(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { id } = req.params;

    const node = await prisma.hierarchyNode.findUnique({
      where: { id },
      include: {
        children: true,
        profiles: true,
      },
    });

    if (!node || node.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Node not found.' });
    }

    if (node.profiles.length > 0) {
      return res.status(400).json({
        error: `Cannot delete node '${node.name}'. It contains ${node.profiles.length} member profiles. Reassign them first.`,
      });
    }

    if (node.children.length > 0) {
      return res.status(400).json({
        error: `Cannot delete node '${node.name}'. It contains ${node.children.length} child sub-nodes. Reassign or remove children first.`,
      });
    }

    await prisma.hierarchyNode.delete({ where: { id } });

    res.json({ message: `Node '${node.name}' successfully deleted.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
