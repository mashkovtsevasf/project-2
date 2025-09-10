import { db, runMigrations } from './index';

async function exec(sql: string, params: any[] = []) {
  return new Promise<void>((resolve, reject) => {
    db.run(sql, params, (err) => err ? reject(err) : resolve());
  });
}

async function get<T = any>(sql: string, params: any[] = []) {
  return new Promise<T | undefined>((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row as T));
  });
}

async function main() {
  await runMigrations();
  await exec('PRAGMA foreign_keys = OFF');
  await exec('DELETE FROM task_history');
  await exec('DELETE FROM tasks');
  await exec('DELETE FROM users');
  await exec('PRAGMA foreign_keys = ON');

  // Insert exactly 4 users
  const users = [
    ['John Developer','john@company.com','Developer'],
    ['Sarah Designer','sarah@company.com','Designer'],
    ['Mike QA','mike@company.com','QA'],
    ['Lisa Manager','lisa@company.com','Manager']
  ];
  for (const u of users) {
    await exec('INSERT INTO users (name, email, role) VALUES (?,?,?)', u);
  }

  // Fetch user ids
  const john = await get<{ id: number }>('SELECT id FROM users WHERE email = ?', ['john@company.com']);
  const sarah = await get<{ id: number }>('SELECT id FROM users WHERE email = ?', ['sarah@company.com']);
  const mike = await get<{ id: number }>('SELECT id FROM users WHERE email = ?', ['mike@company.com']);
  const lisa = await get<{ id: number }>('SELECT id FROM users WHERE email = ?', ['lisa@company.com']);
  if (!john || !sarah || !mike || !lisa) throw new Error('User IDs not found after insert');

  // Helper to insert task and history
  async function insertTask(
    title: string,
    description: string | null,
    status: 'To Do' | 'In Progress' | 'Done',
    priority: 'Low' | 'Medium' | 'High',
    assigneeId: number,
    dueDate: string | null
  ) {
    await exec(
      'INSERT INTO tasks (title, description, status, priority, assignee_id, due_date) VALUES (?,?,?,?,?,?)',
      [title, description, status, priority, assigneeId, dueDate]
    );
    const row = await get<{ id: number }>('SELECT last_insert_rowid() as id');
    const taskId = row!.id;
    await exec(
      'INSERT INTO task_history (task_id, user_id, action, to_status, note) VALUES (?,?,?,?,?)',
      [taskId, null, 'created', status, 'Seeded task created']
    );
    if (status === 'In Progress') {
      await exec('INSERT INTO task_history (task_id, user_id, action, from_status, to_status, note) VALUES (?,?,?,?,?,?)', [taskId, null, 'status_changed', 'To Do', 'In Progress', 'Moved to In Progress']);
    }
    if (status === 'Done') {
      await exec('INSERT INTO task_history (task_id, user_id, action, from_status, to_status, note) VALUES (?,?,?,?,?,?)', [taskId, null, 'status_changed', 'To Do', 'Done', 'Completed']);
      await exec('INSERT INTO task_history (task_id, user_id, action, from_status, to_status, note) VALUES (?,?,?,?,?,?)', [taskId, null, 'completed', 'To Do', 'Done', 'Task completed']);
    }
  }

  const today = new Date();
  const plusDays = (n: number) => new Date(today.getTime() + n*24*60*60*1000).toISOString().slice(0,10);

  // Exactly 8 tasks as specified
  await insertTask('Setup project structure', null, 'To Do', 'High', john.id, plusDays(3));
  await insertTask('Design login page mockup', null, 'In Progress', 'Medium', sarah.id, plusDays(5));
  await insertTask('Write user authentication tests', null, 'To Do', 'High', mike.id, plusDays(7));
  await insertTask('Review sprint planning', null, 'Done', 'Low', lisa.id, plusDays(2));
  await insertTask('Implement user registration API', null, 'In Progress', 'High', john.id, plusDays(10));
  await insertTask('Create color palette and typography guide', null, 'Done', 'Medium', sarah.id, plusDays(4));
  await insertTask('Setup automated testing pipeline', null, 'To Do', 'Medium', mike.id, plusDays(12));
  await insertTask('Prepare quarterly review presentation', null, 'In Progress', 'Low', lisa.id, plusDays(8));

  console.log('Sample users and exactly 8 specified tasks loaded.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); }); 