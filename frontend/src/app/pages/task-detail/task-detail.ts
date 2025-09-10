import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ApiService, ToastService } from '../../shared/api';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <a routerLink="/tasks">Back to List</a>
    <h2 class="m-0">Task Detail</h2>

    <div *ngIf="!task">Loading...</div>

    <ng-container *ngIf="task">
      <div *ngIf="!editMode" class="surface mt-3 fade-in" style="padding:16px;">
        <p><strong>Task ID:</strong> {{ task.id }}</p>
        <p><strong>Title:</strong> {{ task.title }}</p>
        <p><strong>Description:</strong> {{ task.description || '—' }}</p>
        <p><strong>Status:</strong> {{ task.status }}</p>
        <p><strong>Priority:</strong> {{ task.priority }}</p>
        <p><strong>Assignee:</strong> {{ task.assignee_name || task.assignee_id }}</p>
        <p><strong>Due Date:</strong> {{ task.due_date || '—' }}</p>
        <p><strong>Created:</strong> {{ task.created_at }}</p>
        <p><strong>Updated:</strong> {{ task.updated_at }}</p>

        <div class="flex gap-2 mt-2">
          <button class="btn" (click)="toggleEdit()">Edit</button>
          <button class="btn danger" (click)="confirmDelete()">Delete Task</button>
        </div>
      </div>

      <form *ngIf="editMode" [formGroup]="form" (ngSubmit)="save()" class="surface mt-3 slide-up" style="display:grid; gap:12px; max-width:620px; padding:16px;">
        <label>Title <input type="text" formControlName="title" maxlength="100" required /></label>
        <div style="color:var(--danger)" *ngIf="submitted && form.controls['title'].invalid">Title 1–100 chars required.</div>

        <label>Description <textarea formControlName="description" maxlength="500" rows="4"></textarea></label>
        <div style="font-size:12px; color:var(--muted)">{{ (form.value.description?.length || 0) }}/500</div>

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

        <div class="flex gap-2">
          <button type="submit" class="btn primary">Save</button>
          <button type="button" class="btn" (click)="cancelEdit()">Cancel</button>
        </div>
        <div *ngIf="errorMessage" style="color:var(--danger)">{{ errorMessage }}</div>
      </form>

      <div class="surface mt-3" style="padding:16px;">
        <h3 class="m-0">History</h3>
        <ul>
          <li *ngFor="let h of history">[{{ h.timestamp }}] {{ h.action }} <ng-container *ngIf="h.from_status || h.to_status">({{ h.from_status || '—' }} → {{ h.to_status || '—' }})</ng-container> by {{ h.user_name || 'System' }}</li>
        </ul>
      </div>
    </ng-container>
  `
})
export class TaskDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

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
      next: (updated) => { this.task = updated; this.editMode = false; this.load(this.task.id); this.toast.show('success', 'Task saved'); },
      error: (err) => { this.errorMessage = err?.error?.error || 'Failed to save'; this.toast.show('error', this.errorMessage); }
    });
  }

  confirmDelete() {
    const title = this.task?.title || '';
    const ok = window.confirm(`Delete task "${title}"? This cannot be undone.`);
    if (!ok) return;
    this.api.deleteTask(this.task.id).subscribe({
      next: () => { this.toast.show('success', 'Task deleted'); this.router.navigate(['/tasks']); },
      error: (err) => { this.errorMessage = err?.error?.error || 'Delete failed'; this.toast.show('error', this.errorMessage); }
    });
  }
}
