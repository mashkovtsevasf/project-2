import express from 'express';
import { dbGet, dbAll, dbRun } from '../db';
import { userSchema, userUpdateSchema } from '../utils/validation';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const users = await dbAll<any>(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              (SELECT COUNT(1) FROM tasks t WHERE t.assignee_id = u.id) as assigned_tasks
       FROM users u
       ORDER BY u.created_at DESC`
    );
    res.json(users);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = await dbGet<any>(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              (SELECT COUNT(1) FROM tasks t WHERE t.assignee_id = u.id) as assigned_tasks
       FROM users u WHERE u.id = ?`, [id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = userSchema.parse(req.body);
    const result = await dbRun('INSERT INTO users (name, email, role) VALUES (?,?,?)', [parsed.name, parsed.email, parsed.role]);
    const created = await dbGet('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (e: any) {
    if (e?.code === 'SQLITE_CONSTRAINT' || e?.message?.includes('UNIQUE')) {
      e.status = 400; e.message = 'Email already exists';
    }
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const parsed = userUpdateSchema.parse(req.body);
    const fields: string[] = [];
    const params: any[] = [];
    if (parsed.name !== undefined) { fields.push('name = ?'); params.push(parsed.name); }
    if (parsed.email !== undefined) { fields.push('email = ?'); params.push(parsed.email); }
    if (parsed.role !== undefined) { fields.push('role = ?'); params.push(parsed.role); }

    if (fields.length === 0) return res.json(await dbGet('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]));

    params.push(id);
    await dbRun(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    const updated = await dbGet('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
    res.json(updated);
  } catch (e: any) {
    if (e?.code === 'SQLITE_CONSTRAINT' || e?.message?.includes('UNIQUE')) {
      e.status = 400; e.message = 'Email already exists';
    }
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const countRow = await dbGet<{ c: number }>('SELECT COUNT(*) as c FROM tasks WHERE assignee_id = ?', [id]);
    if ((countRow?.c || 0) > 0) return res.status(400).json({ error: 'Cannot delete user with assigned tasks' });
    const result = await dbRun('DELETE FROM users WHERE id = ?', [id]);
    if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
