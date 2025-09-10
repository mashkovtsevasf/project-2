import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ApiService } from '../../shared/api';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <a routerLink="/tasks">Back to List</a>
    <h2>Task Detail</h2>

    <div *ngIf="!task">Loading...</div>

    <ng-container *ngIf="task">
      <div *ngIf="!editMode">
        <p><strong>Task ID:</strong> {{ task.id }}</p>
        <p><strong>Title:</strong> {{ task.title }}</p>
        <p><strong>Description:</strong> {{ task.description || '—' }}</p>
        <p><strong>Status:</strong> {{ task.status }}</p>
        <p><strong>Priority:</strong> {{ task.priority }}</p>
        <p><strong>Assignee:</strong> {{ task.assignee_name || task.assignee_id }}</p>
        <p><strong>Due Date:</strong> {{ task.due_date || '—' }}</p>
        <p><strong>Created:</strong> {{ task.created_at }}</p>
        <p><strong>Updated:</strong> {{ task.updated_at }}</p>

        <div style="display:flex; gap:8px; margin:10px 0;">
          <button (click)="toggleEdit()">Edit</button>
          <button (click)="confirmDelete()">Delete Task</button>
        </div>
      </div>

      <form *ngIf="editMode" [formGroup]="form" (ngSubmit)="save()" style="display:grid; gap:12px; max-width:520px;">
        <label>Title <input type="text" formControlName="title" maxlength="100" required /></label>
        <div style="color:#c00" *ngIf="submitted && form.controls['title'].invalid">Title 1–100 chars required.</div>

        <label>Description <textarea formControlName="description" maxlength="500" rows="4"></textarea></label>
        <div style="font-size:12px; color:#666">{{ (form.value.description?.length || 0) }}/500</div>

        <label>Status
          <select formControlName="status">
            <option>To Do</option>
            <option>In Progress</option>
            <option>Done</option>
          </select>
        </label>

        <label>Priority
          <select formControlName="priority" required>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>

        <label>Assignee
          <select formControlName="assignee_id" required>
            <option *ngFor="let u of users" [value]="u.id">{{ u.name }} ({{ u.role }})</option>
          </select>
        </label>

        <label>Due Date <input type="date" formControlName="due_date" [attr.min]="today" /></label>

        <div style="display:flex; gap:8px;">
          <button type="submit">Save</button>
          <button type="button" (click)="cancelEdit()">Cancel</button>
        </div>
        <div *ngIf="errorMessage" style="color:#c00">{{ errorMessage }}</div>
      </form>

      <h3 style="margin-top:20px">History</h3>
      <ul>
        <li *ngFor="let h of history">[{{ h.timestamp }}] {{ h.action }} <ng-container *ngIf="h.from_status || h.to_status">({{ h.from_status || '—' }} → {{ h.to_status || '—' }})</ng-container> by {{ h.user_name || 'System' }}</li>
      </ul>
    </ng-container>
  `
})
export class TaskDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  task: any;
  history: any[] = [];
  users: any[] = [];
  editMode = false;
  submitted = false;
  errorMessage = '';
  today = new Date().toISOString().slice(0, 10);

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    description: [''],
    status: ['To Do'],
    priority: ['Medium', Validators.required],
    assignee_id: [null, Validators.required],
    due_date: ['']
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
    this.api.getUsers().subscribe(u => this.users = u || []);
  }

  load(id: number) {
    this.api.getTask(id).subscribe(data => {
      this.task = data;
      this.history = (data?.history || []).slice();
      this.patchForm();
    });
  }

  patchForm() {
    if (!this.task) return;
    this.form.patchValue({
      title: this.task.title,
      description: this.task.description || '',
      status: this.task.status,
      priority: this.task.priority,
      assignee_id: this.task.assignee_id,
      due_date: this.task.due_date || ''
    });
  }

  toggleEdit() { this.editMode = true; this.submitted = false; this.errorMessage = ''; this.patchForm(); }
  cancelEdit() { this.editMode = false; this.submitted = false; this.errorMessage = ''; this.patchForm(); }

  save() {
    this.submitted = true; this.errorMessage = '';
    if (this.form.invalid) return;
    const payload = { ...this.form.value };
    if (!payload.description) delete (payload as any).description;
    if (!payload.due_date) delete (payload as any).due_date;
    this.api.updateTask(this.task.id, payload).subscribe({
      next: (updated) => { this.task = updated; this.editMode = false; this.load(this.task.id); },
      error: (err) => { this.errorMessage = err?.error?.error || 'Failed to save'; }
    });
  }

  confirmDelete() {
    const title = this.task?.title || '';
    const ok = window.confirm(`Delete task "${title}"? This cannot be undone.`);
    if (!ok) return;
    this.api.deleteTask(this.task.id).subscribe({
      next: () => this.router.navigate(['/tasks']),
      error: (err) => { this.errorMessage = err?.error?.error || 'Delete failed'; }
    });
  }
}
