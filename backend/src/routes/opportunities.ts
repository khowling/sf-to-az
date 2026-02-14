import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { opportunities, accounts } from '../db/schema.js';
import { eq, count, and, gte, lte, lt, notInArray, sql } from 'drizzle-orm';
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

// GET /api/opportunities/stats — aggregated counts/values by stage
router.get('/stats', async (req: Request, res: Response) => {
  const closeDateRange = req.query.closeDateRange as string | undefined;
  const conditions = [];

  if (closeDateRange) {
    const now = new Date();
    if (closeDateRange === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      conditions.push(gte(opportunities.closeDate, start), lte(opportunities.closeDate, end));
    } else if (closeDateRange === 'this_quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), qMonth, 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), qMonth + 3, 0).toISOString().slice(0, 10);
      conditions.push(gte(opportunities.closeDate, start), lte(opportunities.closeDate, end));
    } else if (closeDateRange === 'this_year') {
      const start = `${now.getFullYear()}-01-01`;
      const end = `${now.getFullYear()}-12-31`;
      conditions.push(gte(opportunities.closeDate, start), lte(opportunities.closeDate, end));
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.select({
    stage: opportunities.stage,
    count: count(),
    value: sql<string>`coalesce(sum(${opportunities.amount}), 0)`,
  }).from(opportunities).where(where).groupBy(opportunities.stage);
  res.json(rows);
});

// GET /api/opportunities
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 500));
  const offset = (page - 1) * limit;
  const stageFilter = req.query.stage as string | undefined;
  const amountMin = req.query.amountMin as string | undefined;
  const amountMax = req.query.amountMax as string | undefined;
  const closeDateRange = req.query.closeDateRange as string | undefined;

  const conditions = [];
  if (stageFilter) conditions.push(eq(opportunities.stage, stageFilter));
  if (amountMin) conditions.push(gte(opportunities.amount, amountMin));
  if (amountMax) conditions.push(lte(opportunities.amount, amountMax));
  if (closeDateRange) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    if (closeDateRange === 'this_week') {
      const day = today.getDay();
      const monday = new Date(yyyy, mm, dd - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      conditions.push(gte(opportunities.closeDate, fmt(monday)));
      conditions.push(lte(opportunities.closeDate, fmt(sunday)));
    } else if (closeDateRange === 'this_month') {
      const first = new Date(yyyy, mm, 1);
      const last = new Date(yyyy, mm + 1, 0);
      conditions.push(gte(opportunities.closeDate, fmt(first)));
      conditions.push(lte(opportunities.closeDate, fmt(last)));
    } else if (closeDateRange === 'this_quarter') {
      const qStart = Math.floor(mm / 3) * 3;
      const first = new Date(yyyy, qStart, 1);
      const last = new Date(yyyy, qStart + 3, 0);
      conditions.push(gte(opportunities.closeDate, fmt(first)));
      conditions.push(lte(opportunities.closeDate, fmt(last)));
    } else if (closeDateRange === 'this_year') {
      conditions.push(gte(opportunities.closeDate, `${yyyy}-01-01`));
      conditions.push(lte(opportunities.closeDate, `${yyyy}-12-31`));
    } else if (closeDateRange === 'overdue') {
      conditions.push(lt(opportunities.closeDate, fmt(today)));
      conditions.push(notInArray(opportunities.stage, ['Closed Won', 'Closed Lost']));
    }
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

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
