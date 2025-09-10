export type UserRole = 'Developer' | 'Designer' | 'QA' | 'Manager';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string; // ISO string
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: number;
  due_date?: string | null; // ISO date (YYYY-MM-DD)
  created_at: string;
  updated_at: string;
}

export type TaskAction = 'created' | 'updated' | 'status_changed' | 'completed' | 'deleted';

export interface TaskHistory {
  id: number;
  task_id: number;
  user_id?: number | null;
  action: TaskAction;
  from_status?: TaskStatus | null;
  to_status?: TaskStatus | null;
  timestamp: string;
  note?: string | null;
}

export interface RecentActivityItem {
  task_id: number;
  task_title: string;
  action: TaskAction;
  user_name: string | null;
  timestamp: string;
}
