import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { accounts } from '../db/schema.js';
import { eq, count } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  industry: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  customFields: z.record(z.string(), z.any()).optional(),
});

// GET /api/accounts
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 500));
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(accounts).orderBy(accounts.name).limit(limit).offset(offset),
    db.select({ total: count() }).from(accounts),
  ]);

  res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// GET /api/accounts/:id
router.get('/:id', async (req: Request, res: Response) => {
  const [row] = await db.select().from(accounts).where(eq(accounts.id, req.params.id as string));
  if (!row) return res.status(404).json({ error: 'Account not found' });
  res.json(row);
});

// POST /api/accounts
router.post('/', async (req: Request, res: Response) => {
  const parsed = accountSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const [row] = await db.insert(accounts).values(parsed.data).returning();
  res.status(201).json(row);
});

// PUT /api/accounts/:id
router.put('/:id', async (req: Request, res: Response) => {
  const parsed = accountSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const [row] = await db.update(accounts).set({ ...parsed.data, updatedAt: new Date() }).where(eq(accounts.id, req.params.id as string)).returning();
  if (!row) return res.status(404).json({ error: 'Account not found' });
  res.json(row);
});

// DELETE /api/accounts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const [row] = await db.delete(accounts).where(eq(accounts.id, req.params.id as string)).returning();
  if (!row) return res.status(404).json({ error: 'Account not found' });
  res.json({ success: true });
});

export default router;
