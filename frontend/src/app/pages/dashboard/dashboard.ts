import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h2>Dashboard</h2>
    <div style="display:flex; gap:16px; margin: 12px 0">
      <div style="padding:12px; border:1px solid #ddd; border-radius:6px">Total Tasks: <strong>{{ metrics?.total ?? 0 }}</strong></div>
      <div style="padding:12px; border:1px solid #ddd; border-radius:6px">Completed: <strong>{{ metrics?.completed ?? 0 }}</strong></div>
      <div style="padding:12px; border:1px solid #ddd; border-radius:6px">In Progress: <strong>{{ metrics?.in_progress ?? 0 }}</strong></div>
    </div>

    <button routerLink="/tasks/create">Create New Task</button>

    <h3 style="margin-top:20px">Recent Activity</h3>
    <div *ngIf="recent?.length === 0">No recent activity</div>
    <ul>
      <li *ngFor="let a of recent">
        <span>[{{ a.timestamp }}]</span>
        <strong>{{ a.task_title }}</strong>
        — {{ a.action }} by {{ a.user_name || 'System' }}
      </li>
    </ul>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  metrics: { total: number; completed: number; in_progress: number } | null = null;
  recent: any[] = [];
  private timer?: any;

  ngOnInit(): void {
    this.load();
    this.timer = setInterval(() => this.load(), 5000);
  }
  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  private load() {
    this.api.getDashboard().subscribe(({ metrics, recent_activity }) => {
      this.metrics = metrics; this.recent = recent_activity || [];
    });
  }
}
