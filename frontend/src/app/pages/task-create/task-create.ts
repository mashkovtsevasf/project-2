import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../shared/api';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h2>Create Task</h2>

    <form [formGroup]="form" (ngSubmit)="submit()" novalidate style="display:grid; gap:12px; max-width:520px;">
      <label>
        Title
        <input type="text" formControlName="title" maxlength="100" required />
        <div style="color:#c00" *ngIf="submitted && titleInvalid">Title is required (1-100 characters).</div>
      </label>

      <label>
        Description (optional)
        <textarea formControlName="description" maxlength="500" rows="4"></textarea>
        <div style="font-size:12px; color:#666">{{ (form.value.description?.length || 0) }}/500</div>
      </label>

      <label>
        Priority
        <select formControlName="priority" required>
          <option value="" disabled>Select priority</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <div style="color:#c00" *ngIf="submitted && form.controls['priority'].invalid">Priority is required.</div>
      </label>

      <label>
        Assignee
        <select formControlName="assignee_id" required>
          <option value="" disabled>Select assignee</option>
          <option *ngFor="let u of users" [value]="u.id">{{ u.name }} ({{ u.role }})</option>
        </select>
        <div style="color:#c00" *ngIf="submitted && form.controls['assignee_id'].invalid">Assignee is required.</div>
      </label>

      <label>
        Due Date (optional)
        <input type="date" formControlName="due_date" [attr.min]="today" />
        <div style="color:#c00" *ngIf="submitted && dateInvalid">Due date cannot be in the past.</div>
      </label>

      <div style="display:flex; gap:8px; margin-top:8px;">
        <button type="submit">Create Task</button>
        <button type="button" (click)="cancel()">Cancel</button>
      </div>

      <div *ngIf="successMessage" style="color:#0a0">{{ successMessage }}</div>
      <div *ngIf="errorMessage" style="color:#c00">{{ errorMessage }}</div>
    </form>
  `
})
export class TaskCreateComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  users: any[] = [];
  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    description: [''],
    priority: ['', Validators.required],
    assignee_id: [null, Validators.required],
    due_date: ['']
  });

  submitted = false;
  successMessage = '';
  errorMessage = '';
  today = new Date().toISOString().slice(0, 10);

  ngOnInit(): void { this.loadUsers(); }

  get titleInvalid() {
    const c = this.form.controls['title'];
    return c.invalid && (c.errors?.['required'] || c.errors?.['maxlength'] || c.errors?.['minlength']);
  }

  get dateInvalid() {
    const v = this.form.value.due_date as string | null;
    if (!v) return false;
    return v < this.today;
  }

  loadUsers() {
    this.api.getUsers().subscribe(u => this.users = u || []);
  }

  submit() {
    this.submitted = true;
    this.successMessage = ''; this.errorMessage = '';

    if (this.dateInvalid) return;
    if (this.form.invalid) return;

    const payload = { ...this.form.value };
    if (!payload.description) delete (payload as any).description;
    if (!payload.due_date) delete (payload as any).due_date;

    this.api.createTask(payload).subscribe({
      next: () => {
        this.successMessage = 'Task created successfully! Redirecting...';
        setTimeout(() => this.router.navigate(['/tasks']), 800);
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to create task';
      }
    });
  }

  cancel() { this.router.navigate(['/tasks']); }
}
