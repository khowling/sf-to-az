import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { fieldDefinitions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const fieldDefSchema = z.object({
  objectType: z.enum(['account', 'contact', 'opportunity']),
  fieldName: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Must be a valid identifier'),
  label: z.string().min(1),
  fieldType: z.enum(['text', 'number', 'date', 'picklist', 'boolean', 'lookup']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validations: z.record(z.string(), z.any()).optional(),
  sortOrder: z.number().int().optional(),
});

// GET /api/field-definitions?objectType=account
router.get('/', async (req: Request, res: Response) => {
  const { objectType } = req.query;
  let rows;
  if (objectType && typeof objectType === 'string') {
    rows = await db.select().from(fieldDefinitions)
      .where(eq(fieldDefinitions.objectType, objectType))
      .orderBy(fieldDefinitions.sortOrder);
  } else {
    rows = await db.select().from(fieldDefinitions).orderBy(fieldDefinitions.objectType, fieldDefinitions.sortOrder);
  }
  res.json(rows);
});

// POST /api/field-definitions
router.post('/', async (req: Request, res: Response) => {
  const parsed = fieldDefSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const [row] = await db.insert(fieldDefinitions).values({ ...parsed.data, isCustom: true }).returning();
  res.status(201).json(row);
});

// PUT /api/field-definitions/:id
router.put('/:id', async (req: Request, res: Response) => {
  const parsed = fieldDefSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const [row] = await db.update(fieldDefinitions)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(fieldDefinitions.id, req.params.id as string))
    .returning();
  if (!row) return res.status(404).json({ error: 'Field definition not found' });
  res.json(row);
});

// DELETE /api/field-definitions/:id
router.delete('/:id', async (req: Request, res: Response) => {
  // Only allow deleting custom fields
  const [existing] = await db.select().from(fieldDefinitions).where(eq(fieldDefinitions.id, req.params.id as string));
  if (!existing) return res.status(404).json({ error: 'Field definition not found' });
  if (!existing.isCustom) return res.status(400).json({ error: 'Cannot delete built-in fields' });
  await db.delete(fieldDefinitions).where(eq(fieldDefinitions.id, req.params.id as string));
  res.json({ success: true });
});

export default router;
