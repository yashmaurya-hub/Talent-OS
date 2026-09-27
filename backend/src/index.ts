import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.routes';
import hierarchyRoutes from './routes/hierarchy.routes';
import profileRoutes from './routes/profile.routes';
import taskRoutes from './routes/task.routes';
import analyticsRoutes from './routes/analytics.routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root & Health check
app.get('/api/health', async (_req, res) => {
  try {
    const orgCount = await prisma.organization.count();
    const userCount = await prisma.user.count();
    const taskCount = await prisma.task.count();
    const profileCount = await prisma.profile.count();
    const recordsCount = await prisma.performanceRecord.count();
    const recRunCount = await prisma.recommendationRun.count();

    res.json({
      status: 'healthy',
      system: 'TalentOS Human Potential Intelligence Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        stats: {
          organizations: orgCount,
          users: userCount,
          profiles: profileCount,
          performanceRecords: recordsCount,
          tasks: taskCount,
          recommendationRuns: recRunCount,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      database: {
        connected: false,
        error: error.message,
      },
    });
  }
});

// Global 404 handler
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred',
  });
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to SQLite/Prisma database');
    app.listen(PORT, () => {
      console.log(`🚀 TalentOS Core Engine running on http://localhost:${PORT}`);
      console.log(`📡 Health endpoint: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database or start server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, prisma };
