import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../shared/api';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h2>Tasks</h2>
    <div style="display:flex; gap:12px; align-items: center; margin: 8px 0; flex-wrap: wrap;">
      <label>
        Filter:
        <select [(ngModel)]="filter" (change)="load()">
          <option>All</option>
          <option>To Do</option>
          <option>In Progress</option>
          <option>Done</option>
        </select>
      </label>
      <label>
        Search title:
        <input [(ngModel)]="search" (input)="onSearchChange()" placeholder="Type at least 3 characters" />
      </label>
      <label>
        Sort by:
        <select [(ngModel)]="sort" (change)="load()">
          <option value="created_at">Created Date</option>
          <option value="priority">Priority</option>
        </select>
      </label>
      <label>
        Order:
        <select [(ngModel)]="order" (change)="load()">
          <option value="desc">DESC</option>
          <option value="asc">ASC</option>
        </select>
      </label>

      <button routerLink="/tasks/create">Create New Task</button>
    </div>

    <div *ngIf="tasks.length === 0">No tasks found</div>
    <table *ngIf="tasks.length > 0" border="1" cellpadding="6" cellspacing="0">
      <thead>
        <tr>
          <th>Task ID</th>
          <th>Title</th>
          <th>Status</th>
          <th (click)="setSort('priority')" style="cursor:pointer">Priority</th>
          <th>Assignee</th>
          <th (click)="setSort('created_at')" style="cursor:pointer">Created Date</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let t of tasks" (click)="goDetail(t.id)" style="cursor:pointer">
          <td>{{ t.id }}</td>
          <td>{{ t.title }}</td>
          <td>{{ t.status }}</td>
          <td>{{ t.priority }}</td>
          <td>{{ t.assignee_name || t.assignee_id }}</td>
          <td>{{ t.created_at }}</td>
        </tr>
      </tbody>
    </table>
  `
})
export class TasksListComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  tasks: any[] = [];
  filter: 'All' | 'To Do' | 'In Progress' | 'Done' = 'All';
  search = '';
  sort: 'created_at' | 'priority' = 'created_at';
  order: 'asc' | 'desc' = 'desc';
  private searchTimeout?: any;

  ngOnInit(): void { this.load(); }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(), 300);
  }

  setSort(col: 'created_at' | 'priority') {
    if (this.sort === col) {
      this.order = this.order === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort = col; this.order = 'desc';
    }
    this.load();
  }

  load() {
    this.api.getTasks({ filter: this.filter, search: this.search, sort: this.sort, order: this.order }).subscribe(list => {
      this.tasks = list || [];
    });
  }

  goDetail(id: number) { this.router.navigate(['/tasks', id]); }
}
