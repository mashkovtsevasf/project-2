import express from 'express';
import { dbAll, dbGet, dbRun } from '../db';
import { taskCreateSchema, taskUpdateSchema } from '../utils/validation';

const router = express.Router();

// List with filter/search/sort
router.get('/', async (req, res, next) => {
  try {
    const filter = String(req.query.filter || 'All');
    const search = String(req.query.search || '').trim();
    const sort = String(req.query.sort || 'created_at'); // 'created_at' | 'priority'
    const order = (String(req.query.order || 'desc').toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (['To Do','In Progress','Done'].includes(filter)) {
      whereClauses.push('status = ?');
      params.push(filter);
    }
    if (search.length >= 3) {
      whereClauses.push('LOWER(title) LIKE ?');
      params.push(`%${search.toLowerCase()}%`);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sortMap: Record<string, string> = {
      created_at: 't.created_at',
      priority: "CASE priority WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 END"
    };
    const sortColumn = sortMap[sort] || 'created_at';

    const tasks = await dbAll<any>(
      `SELECT t.id, t.title, t.status, t.priority, t.assignee_id, u.name as assignee_name, t.created_at
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       ${whereSql}
       ORDER BY ${sortColumn} ${order}, t.id DESC`
      , params
    );
    res.json(tasks);
  } catch (e) { next(e); }
});

// Get one with history
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const task = await dbGet<any>(
      `SELECT t.*, u.name as assignee_name
       FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = ?`, [id]
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const history = await dbAll<any>(
      `SELECT th.*, uu.name as user_name
       FROM task_history th LEFT JOIN users uu ON uu.id = th.user_id
       WHERE th.task_id = ? ORDER BY th.timestamp DESC`, [id]
    );
    res.json({ ...task, history });
  } catch (e) { next(e); }
});

// Create
router.post('/', async (req, res, next) => {
  try {
    const parsed = taskCreateSchema.parse({
      ...req.body,
      assignee_id: Number(req.body.assignee_id || req.body.assigneeId)
    });

    const user = await dbGet('SELECT id FROM users WHERE id = ?', [parsed.assignee_id]);
    if (!user) return res.status(400).json({ error: 'Assignee not found' });

    const result = await dbRun(
      `INSERT INTO tasks (title, description, status, priority, assignee_id, due_date)
       VALUES (?,?,?,?,?,?)`,
      [parsed.title, parsed.description ?? null, 'To Do', parsed.priority, parsed.assignee_id, parsed.due_date ?? null]
    );
    const task = await dbGet<any>('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
    await dbRun(
      `INSERT INTO task_history (task_id, user_id, action, to_status, note)
       VALUES (?,?,?,?,?)`,
      [task.id, null, 'created', 'To Do', 'Task created']
    );
    res.status(201).json(task);
  } catch (e) { next(e); }
});

// Update (edit mode)
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await dbGet<any>('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const parsed = taskUpdateSchema.parse({
      ...req.body,
      assignee_id: req.body.assignee_id !== undefined ? Number(req.body.assignee_id) : undefined
    });

    if (parsed.assignee_id !== undefined) {
      const u = await dbGet('SELECT id FROM users WHERE id = ?', [parsed.assignee_id]);
      if (!u) return res.status(400).json({ error: 'Assignee not found' });
    }

    const fields: string[] = [];
    const params: any[] = [];
    let statusChanged = false;
    let fromStatus: string | null = null;
    let toStatus: string | null = null;

    if (parsed.title !== undefined) { fields.push('title = ?'); params.push(parsed.title); }
    if (parsed.description !== undefined) { fields.push('description = ?'); params.push(parsed.description ?? null); }
    if (parsed.status !== undefined) { fields.push('status = ?'); params.push(parsed.status); statusChanged = parsed.status !== existing.status; fromStatus = existing.status; toStatus = parsed.status; }
    if (parsed.priority !== undefined) { fields.push('priority = ?'); params.push(parsed.priority); }
    if (parsed.assignee_id !== undefined) { fields.push('assignee_id = ?'); params.push(parsed.assignee_id); }
    if (parsed.due_date !== undefined) { fields.push('due_date = ?'); params.push(parsed.due_date ?? null); }

    fields.push("updated_at = datetime('now')");

    if (fields.length === 0) return res.json(existing);

    params.push(id);
    await dbRun(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);
    const updated = await dbGet<any>('SELECT * FROM tasks WHERE id = ?', [id]);

    await dbRun(
      `INSERT INTO task_history (task_id, user_id, action, from_status, to_status, note)
       VALUES (?,?,?,?,?,?)`,
      [id, null, statusChanged ? 'status_changed' : 'updated', fromStatus, toStatus, 'Task updated']
    );

    if (updated.status === 'Done' && existing.status !== 'Done') {
      await dbRun(`INSERT INTO task_history (task_id, user_id, action, from_status, to_status, note) VALUES (?,?,?,?,?,?)`, [id, null, 'completed', existing.status, 'Done', 'Task completed']);
    }

    res.json(updated);
  } catch (e) { next(e); }
});

// Delete
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    await dbRun('DELETE FROM tasks WHERE id = ?', [id]);
    await dbRun('INSERT INTO task_history (task_id, user_id, action, note) VALUES (?,?,?,?)', [id, null, 'deleted', 'Task deleted']);
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
