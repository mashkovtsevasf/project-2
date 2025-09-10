import { Component, effect, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="app-container">
      <nav class="flex items-center justify-between gap-2" style="padding:10px 0; border-bottom:1px solid var(--border)">
        <div class="flex gap-2 wrap">
          <a routerLink="/" routerLinkActive="active">Dashboard</a>
          <a routerLink="/tasks" routerLinkActive="active">Tasks</a>
          <a routerLink="/tasks/create" routerLinkActive="active">Create Task</a>
          <a routerLink="/users" routerLinkActive="active">Users</a>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn" (click)="toggleTheme()">{{ theme() === 'dark' ? 'Light' : 'Dark' }} Mode</button>
        </div>
      </nav>
    </div>
  `
})
export class NavComponent {
  theme = signal<'light' | 'dark'>((localStorage.getItem('theme') as any) || 'light');

  constructor() {
    effect(() => {
      const t = this.theme();
      localStorage.setItem('theme', t);
      document.documentElement.classList.toggle('dark', t === 'dark');
    });
  }

  toggleTheme() { this.theme.update(v => v === 'dark' ? 'light' : 'dark'); }
}
