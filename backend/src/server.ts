import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function start() {
  try {
    await prisma.$connect();
    app.listen(env.PORT, () => {
      console.log(`GUL SAZ POS API running on http://localhost:${env.PORT}`);
      console.log(`Health check: http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
