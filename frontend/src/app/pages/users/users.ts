import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h2>Users</h2>

    <form [formGroup]="addForm" (ngSubmit)="addUser()" style="display:flex; gap:8px; flex-wrap: wrap; align-items: end;">
      <label>Name<br><input type="text" formControlName="name" maxlength="50" required /></label>
      <label>Email<br>
        <input type="email" formControlName="email" required />
        <div style="color:#c00; font-size:12px" *ngIf="addSubmitted && addForm.controls['email'].invalid">Enter a valid email.</div>
      </label>
      <label>Role<br>
        <select formControlName="role" required>
          <option value="" disabled>Select role</option>
          <option>Developer</option>
          <option>Designer</option>
          <option>QA</option>
          <option>Manager</option>
        </select>
      </label>
      <button type="submit">Add New User</button>
    </form>

    <table border="1" cellpadding="6" cellspacing="0" style="margin-top:12px; width:100%; max-width:900px;">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Number of Assigned Tasks</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let u of users">
          <td>
            <ng-container *ngIf="editId !== u.id; else editName">
              {{ u.name }}
            </ng-container>
            <ng-template #editName>
              <input [formControl]="editForm.controls['name']" maxlength="50" />
              <div style="color:#c00; font-size:12px" *ngIf="editSubmitted && editForm.controls['name'].invalid">Name is required (1-50 chars).</div>
            </ng-template>
          </td>
          <td>
            <ng-container *ngIf="editId !== u.id; else editEmail">
              {{ u.email }}
            </ng-container>
            <ng-template #editEmail>
              <input [formControl]="editForm.controls['email']" type="email" />
              <div style="color:#c00; font-size:12px" *ngIf="editSubmitted && editForm.controls['email'].invalid">Enter a valid email.</div>
            </ng-template>
          </td>
          <td>
            <ng-container *ngIf="editId !== u.id; else editRole">
              {{ u.role }}
            </ng-container>
            <ng-template #editRole>
              <select [formControl]="editForm.controls['role']">
                <option>Developer</option>
                <option>Designer</option>
                <option>QA</option>
                <option>Manager</option>
              </select>
              <div style="color:#c00; font-size:12px" *ngIf="editSubmitted && editForm.controls['role'].invalid">Role is required.</div>
            </ng-template>
          </td>
          <td>{{ u.assigned_tasks }}</td>
          <td>
            <ng-container *ngIf="editId !== u.id; else editActions">
              <button (click)="startEdit(u)">Edit</button>
              <button (click)="deleteUser(u)" [disabled]="u.assigned_tasks > 0">Delete</button>
            </ng-container>
            <ng-template #editActions>
              <button (click)="saveEdit(u)">Save</button>
              <button (click)="cancelEdit()">Cancel</button>
            </ng-template>
          </td>
        </tr>
      </tbody>
    </table>

    <div *ngIf="errorMessage" style="color:#c00">{{ errorMessage }}</div>
  `
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  users: any[] = [];

  addForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required]
  });
  addSubmitted = false;

  editId: number | null = null;
  editForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required]
  });
  editSubmitted = false;

  errorMessage = '';

  ngOnInit(): void { this.load(); }

  load() {
    this.api.getUsers().subscribe(list => this.users = list || []);
  }

  addUser() {
    this.addSubmitted = true; this.errorMessage = '';
    if (this.addForm.invalid) return;
    this.api.createUser(this.addForm.value).subscribe({
      next: () => { this.addForm.reset(); this.addSubmitted = false; this.load(); },
      error: (err) => { this.errorMessage = err?.error?.error || 'Failed to add user'; }
    });
  }

  startEdit(u: any) {
    this.editId = u.id;
    this.editSubmitted = false;
    this.editForm.setValue({ name: u.name, email: u.email, role: u.role });
  }

  cancelEdit() { this.editId = null; }

  saveEdit(u: any) {
    this.errorMessage = '';
    this.editSubmitted = true;
    if (this.editForm.invalid) return;
    const payload: any = {};
    const val = this.editForm.value;
    if (val.name && val.name !== u.name) payload.name = val.name;
    if (val.email && val.email !== u.email) payload.email = val.email;
    if (val.role && val.role !== u.role) payload.role = val.role;
    if (Object.keys(payload).length === 0) { this.editId = null; return; }
    this.api.updateUser(u.id, payload).subscribe({
      next: () => { this.editId = null; this.load(); },
      error: (err) => { this.errorMessage = err?.error?.error || 'Failed to save user'; }
    });
  }

  deleteUser(u: any) {
    if (u.assigned_tasks > 0) { this.errorMessage = 'Cannot delete user with assigned tasks'; return; }
    const ok = window.confirm(`Delete user ${u.name}?`);
    if (!ok) return;
    this.api.deleteUser(u.id).subscribe({
      next: () => this.load(),
      error: (err) => { this.errorMessage = err?.error?.error || 'Failed to delete user'; }
    });
  }
}
