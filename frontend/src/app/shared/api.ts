import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  getDashboard() {
    return this.http.get<{ metrics: { total: number; completed: number; in_progress: number }, recent_activity: any[] }>(`/api/dashboard`);
  }

  getTasks(options: { filter?: 'All' | 'To Do' | 'In Progress' | 'Done'; search?: string; sort?: 'created_at' | 'priority'; order?: 'asc' | 'desc' } = {}) {
    let params = new HttpParams();
    if (options.filter && options.filter !== 'All') params = params.set('filter', options.filter);
    if (options.search && options.search.trim().length >= 3) params = params.set('search', options.search.trim());
    if (options.sort) params = params.set('sort', options.sort);
    if (options.order) params = params.set('order', options.order);
    return this.http.get<any[]>(`/api/tasks`, { params });
  }

  getTask(id: number) { return this.http.get<any>(`/api/tasks/${id}`); }
  createTask(payload: any) { return this.http.post<any>(`/api/tasks`, payload); }
  updateTask(id: number, payload: any) { return this.http.put<any>(`/api/tasks/${id}`, payload); }
  deleteTask(id: number) { return this.http.delete<void>(`/api/tasks/${id}`); }

  getUsers() { return this.http.get<any[]>(`/api/users`); }
  getUser(id: number) { return this.http.get<any>(`/api/users/${id}`); }
  createUser(payload: any) { return this.http.post<any>(`/api/users`, payload); }
  updateUser(id: number, payload: any) { return this.http.put<any>(`/api/users/${id}`, payload); }
  deleteUser(id: number) { return this.http.delete<void>(`/api/users/${id}`); }
}
