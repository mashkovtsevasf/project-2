import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  role: z.enum(['Developer','Designer','QA','Manager'])
});

export const userUpdateSchema = userSchema.partial();

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  priority: z.enum(['Low','Medium','High']),
  assignee_id: z.number().int().positive(),
  due_date: z.string().date('Invalid date').optional().or(z.literal('')).transform(v => v === '' ? undefined : v)
});

export const taskUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  status: z.enum(['To Do','In Progress','Done']).optional(),
  priority: z.enum(['Low','Medium','High']).optional(),
  assignee_id: z.number().int().positive().optional(),
  due_date: z.string().date('Invalid date').optional().or(z.literal('')).transform(v => v === '' ? undefined : v)
});

export type UserInput = z.infer<typeof userSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
