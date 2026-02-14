import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { contacts, accounts } from '../db/schema.js';
import { eq, count } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  accountId: z.string().uuid().optional().nullable(),
  customFields: z.record(z.string(), z.any()).optional(),
});

// GET /api/contacts
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 500));
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      phone: contacts.phone,
      accountId: contacts.accountId,
      accountName: accounts.name,
      customFields: contacts.customFields,
      createdAt: contacts.createdAt,
      updatedAt: contacts.updatedAt,
    })
      .from(contacts)
      .leftJoin(accounts, eq(contacts.accountId, accounts.id))
      .orderBy(contacts.lastName)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(contacts),
  ]);

  res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// GET /api/contacts/:id
router.get('/:id', async (req: Request, res: Response) => {
  const [row] = await db.select({
    id: contacts.id,
    firstName: contacts.firstName,
    lastName: contacts.lastName,
    email: contacts.email,
    phone: contacts.phone,
    accountId: contacts.accountId,
    accountName: accounts.name,
    customFields: contacts.customFields,
    createdAt: contacts.createdAt,
    updatedAt: contacts.updatedAt,
  })
    .from(contacts)
    .leftJoin(accounts, eq(contacts.accountId, accounts.id))
    .where(eq(contacts.id, req.params.id as string));
  if (!row) return res.status(404).json({ error: 'Contact not found' });
  res.json(row);
});

// POST /api/contacts
router.post('/', async (req: Request, res: Response) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const [row] = await db.insert(contacts).values(parsed.data).returning();
  res.status(201).json(row);
});

// PUT /api/contacts/:id
router.put('/:id', async (req: Request, res: Response) => {
  const parsed = contactSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const [row] = await db.update(contacts).set({ ...parsed.data, updatedAt: new Date() }).where(eq(contacts.id, req.params.id as string)).returning();
  if (!row) return res.status(404).json({ error: 'Contact not found' });
  res.json(row);
});

// DELETE /api/contacts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const [row] = await db.delete(contacts).where(eq(contacts.id, req.params.id as string)).returning();
  if (!row) return res.status(404).json({ error: 'Contact not found' });
  res.json({ success: true });
});

export default router;
