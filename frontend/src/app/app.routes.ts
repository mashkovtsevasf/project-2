import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
  { path: 'tasks', loadComponent: () => import('./pages/tasks-list/tasks-list').then(m => m.TasksListComponent) },
  { path: 'tasks/create', loadComponent: () => import('./pages/task-create/task-create').then(m => m.TaskCreateComponent) },
  { path: 'tasks/:id', loadComponent: () => import('./pages/task-detail/task-detail').then(m => m.TaskDetailComponent) },
  { path: 'users', loadComponent: () => import('./pages/users/users').then(m => m.UsersComponent) }
];
