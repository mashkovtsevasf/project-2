import express from 'express';
import cors from 'cors';
import path from 'path';
import { db, runMigrations, seedIfEmpty } from '../db';
import tasksRouter from '../routes/tasks';
import usersRouter from '../routes/users';
import { errorHandler } from '../middleware/error';
import { notFound } from '../middleware/notFound';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Dashboard metrics
app.get('/api/dashboard', async (_req, res, next) => {
  try {
    const totalRow = await new Promise<any>((resolve, reject) => db.get('SELECT COUNT(*) as c FROM tasks', [], (e, r) => e ? reject(e) : resolve(r)));
    const doneRow = await new Promise<any>((resolve, reject) => db.get("SELECT COUNT(*) as c FROM tasks WHERE status = 'Done'", [], (e, r) => e ? reject(e) : resolve(r)));
    const inProgressRow = await new Promise<any>((resolve, reject) => db.get("SELECT COUNT(*) as c FROM tasks WHERE status = 'In Progress'", [], (e, r) => e ? reject(e) : resolve(r)));
    const activity = await new Promise<any[]>((resolve, reject) => db.all(
      `SELECT th.task_id, t.title as task_title, th.action, u.name as user_name, th.timestamp
       FROM task_history th
       LEFT JOIN tasks t ON t.id = th.task_id
       LEFT JOIN users u ON u.id = th.user_id
       ORDER BY th.timestamp DESC
       LIMIT 5`, [], (e, r) => e ? reject(e) : resolve(r))
    );
    res.json({
      metrics: {
        total: totalRow?.c || 0,
        completed: doneRow?.c || 0,
        in_progress: inProgressRow?.c || 0
      },
      recent_activity: activity
    });
  } catch (e) { next(e); }
});

app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function start() {
  await runMigrations();
  await seedIfEmpty();

  // Serve Angular build if exists (placeholder path)
  const angularDist = path.join(process.cwd(), 'frontend', 'dist');
  app.use(express.static(angularDist));
  app.get(/^\/(?!api).*$/, (req, res, next) => {
    // Only handle non-API routes
    return res.sendFile(path.join(angularDist, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
