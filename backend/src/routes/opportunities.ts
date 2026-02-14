import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { opportunities, accounts } from '../db/schema.js';
import { eq, count, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const opportunitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  accountId: z.string().uuid('Valid account is required'),
  amount: z.union([z.string(), z.number()]).optional().nullable(),
  stage: z.string().min(1).default('Prospecting'),
  closeDate: z.string().optional().nullable(),
  customFields: z.record(z.string(), z.any()).optional(),
});

// GET /api/opportunities
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 500));
  const offset = (page - 1) * limit;
  const stageFilter = req.query.stage as string | undefined;
  const where = stageFilter ? eq(opportunities.stage, stageFilter) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: opportunities.id,
      name: opportunities.name,
      accountId: opportunities.accountId,
      accountName: accounts.name,
      amount: opportunities.amount,
      stage: opportunities.stage,
      closeDate: opportunities.closeDate,
      customFields: opportunities.customFields,
      createdAt: opportunities.createdAt,
      updatedAt: opportunities.updatedAt,
    })
      .from(opportunities)
      .leftJoin(accounts, eq(opportunities.accountId, accounts.id))
      .where(where)
      .orderBy(opportunities.name)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(opportunities).where(where),
  ]);

  res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// GET /api/opportunities/:id
router.get('/:id', async (req: Request, res: Response) => {
  const [row] = await db.select({
    id: opportunities.id,
    name: opportunities.name,
    accountId: opportunities.accountId,
    accountName: accounts.name,
    amount: opportunities.amount,
    stage: opportunities.stage,
    closeDate: opportunities.closeDate,
    customFields: opportunities.customFields,
    createdAt: opportunities.createdAt,
    updatedAt: opportunities.updatedAt,
  })
    .from(opportunities)
    .leftJoin(accounts, eq(opportunities.accountId, accounts.id))
    .where(eq(opportunities.id, req.params.id as string));
  if (!row) return res.status(404).json({ error: 'Opportunity not found' });
  res.json(row);
});

// POST /api/opportunities
router.post('/', async (req: Request, res: Response) => {
  const parsed = opportunitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  // Validate account exists
  const [account] = await db.select().from(accounts).where(eq(accounts.id, parsed.data.accountId));
  if (!account) return res.status(400).json({ error: { fieldErrors: { accountId: ['Account not found'] } } });
  const [row] = await db.insert(opportunities).values({
    ...parsed.data,
    amount: parsed.data.amount?.toString() ?? null,
  }).returning();
  res.status(201).json(row);
});

// PUT /api/opportunities/:id
router.put('/:id', async (req: Request, res: Response) => {
  const parsed = opportunitySchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (parsed.data.accountId) {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, parsed.data.accountId));
    if (!account) return res.status(400).json({ error: { fieldErrors: { accountId: ['Account not found'] } } });
  }
  const [row] = await db.update(opportunities).set({
    ...parsed.data,
    amount: parsed.data.amount?.toString(),
    updatedAt: new Date(),
  }).where(eq(opportunities.id, req.params.id as string)).returning();
  if (!row) return res.status(404).json({ error: 'Opportunity not found' });
  res.json(row);
});

// DELETE /api/opportunities/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const [row] = await db.delete(opportunities).where(eq(opportunities.id, req.params.id as string)).returning();
  if (!row) return res.status(404).json({ error: 'Opportunity not found' });
  res.json({ success: true });
});

export default router;
