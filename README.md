# Task Manager (Angular + Express + SQLite)

Multi-page web app implementing Tasks and Users management.

## Tech Stack
- Backend: Node.js, Express (TypeScript), SQLite (`sqlite3`)
- Frontend: Angular (standalone components, TypeScript)
- Validation: `zod`

## Requirements
- Node.js 20+ (tested with 23, recommended LTS 20/22)
- npm 8+

## Install
```bash
# from project root
npm install
cd frontend && npm install && cd ..
```

## Development
Run backend and frontend in two terminals (or start backend first, then Angular):
```bash
# Terminal 1 (backend, port 3000)
npm run dev

# Terminal 2 (frontend, port 4200)
cd frontend
npm start
```
- Frontend dev server proxies `/api` to `http://localhost:3000`.

## Database
SQLite database file lives at `data/app.db`.

Migrations run automatically on server start. To load sample data (exactly 4 users + sample tasks):
```bash
npm run seed
```

## Scripts
- `npm run dev`: Start Express with nodemon + ts-node
- `npm run build`: Type-check and transpile TS to `dist/`
- `npm start`: Run compiled server from `dist/`
- `npm run seed`: Reset DB and seed 4 users + sample tasks
- `npm run lint`: Lint backend TS
- `cd frontend && npm start`: Start Angular dev server
- `cd frontend && npm run build`: Build Angular app to `frontend/dist/frontend`

## App Pages (Frontend)
- Dashboard: metrics (total, completed, in-progress), recent activity (last 5), Create Task button
- Task List: table (ID, Title, Status, Priority, Assignee, Created Date), filter (All/To Do/In Progress/Done), search (≥3 chars, title), sort (Created Date, Priority), "No tasks found", rows navigate to detail
- Create Task: validated form (Title 1–100, Description ≤500 with counter, Priority 3 options, Assignee from users, Due Date not in past); success message + redirect to list; Cancel returns to list
- Task Detail: read-only view → edit mode (Title, Description, Status [To Do/In Progress/Done], Priority, Assignee, Due Date), history (newest first), Delete with confirmation, Back to List
- Users: table (Name, Email, Role, Number of Assigned Tasks), Add New User (validated), inline edit (validated), Cannot delete if tasks assigned

## API (selected)
Base URL: `http://localhost:3000/api`

- `GET /dashboard` → `{ metrics: { total, completed, in_progress }, recent_activity: [...] }`
- `GET /tasks?filter=&search=&sort=&order=` → list tasks
- `POST /tasks` → create task
- `GET /tasks/:id` → task with history
- `PUT /tasks/:id` → update task (status changes recorded)
- `DELETE /tasks/:id` → delete task (history logged)
- `GET /users` → users with `assigned_tasks` count
- `POST /users`, `PUT /users/:id`, `DELETE /users/:id` (blocked if user has assigned tasks)

## Validation Rules
- User: `name` 1–50, `email` valid, `role` ∈ {Developer, Designer, QA, Manager}
- Task: `title` 1–100, `description` ≤500, `priority` ∈ {Low, Medium, High}, `status` ∈ {To Do, In Progress, Done}, `assignee_id` must exist, `due_date` ≥ today (frontend-enforced)

## Build for Production
```bash
# backend build
npm run build

# frontend build
cd frontend && npm run build

# serve compiled backend (you can configure static serving of frontend/dist if desired)
cd .. && npm start
```

## Notes
- Backend serves static files from `frontend/dist` if present; during dev, use Angular dev server.
- Recent activity shows: task title, action (created/updated/completed), user (if available), timestamp.
