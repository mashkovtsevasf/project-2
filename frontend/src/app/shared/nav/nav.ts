import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav style="display:flex; gap:12px; padding:10px; border-bottom:1px solid #ddd">
      <a routerLink="/" routerLinkActive="active">Dashboard</a>
      <a routerLink="/tasks" routerLinkActive="active">Tasks</a>
      <a routerLink="/tasks/create" routerLinkActive="active">Create Task</a>
      <a routerLink="/users" routerLinkActive="active">Users</a>
    </nav>
  `
})
export class NavComponent {}
