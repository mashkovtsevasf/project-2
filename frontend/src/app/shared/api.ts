import { Injectable, Component, inject, signal, computed } from '@angular/core';
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

// Toasts
export type ToastType = 'success' | 'error';
export interface Toast { id: number; type: ToastType; message: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private items = signal<Toast[]>([]);
  list = computed(() => this.items());
  private id = 1;

  show(type: ToastType, message: string, timeoutMs = 2400) {
    const t = { id: this.id++, type, message };
    this.items.update(arr => [t, ...arr]);
    setTimeout(() => this.dismiss(t.id), timeoutMs);
  }

  dismiss(id: number) { this.items.update(arr => arr.filter(t => t.id !== id)); }
}

@Component({
  selector: 'app-toasts',
  standalone: true,
  template: `
    <div class="toast-container">
      <div class="toast" [class.success]="t.type==='success'" [class.error]="t.type==='error'" *ngFor="let t of service.list()">
        {{ t.message }}
      </div>
    </div>
  `
})
export class ToastsComponent { constructor(public service: ToastService) {} }
