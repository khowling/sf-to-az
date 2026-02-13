import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { pageLayouts } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const sectionSchema = z.object({
  title: z.string().min(1),
  columns: z.number().int().min(1).max(3).default(2),
  fields: z.array(z.string()),
});

const layoutSchema = z.object({
  objectType: z.enum(['account', 'contact', 'opportunity']),
  sections: z.array(sectionSchema),
});

// GET /api/page-layouts?objectType=account
router.get('/', async (req: Request, res: Response) => {
  const { objectType } = req.query;
  if (objectType && typeof objectType === 'string') {
    const [row] = await db.select().from(pageLayouts).where(eq(pageLayouts.objectType, objectType));
    return res.json(row || null);
  }
  const rows = await db.select().from(pageLayouts);
  res.json(rows);
});

// PUT /api/page-layouts/:objectType
router.put('/:objectType', async (req: Request, res: Response) => {
  const parsed = layoutSchema.safeParse({ ...req.body, objectType: req.params.objectType });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const [existing] = await db.select().from(pageLayouts).where(eq(pageLayouts.objectType, parsed.data.objectType));
  let row;
  if (existing) {
    [row] = await db.update(pageLayouts)
      .set({ sections: parsed.data.sections, updatedAt: new Date() })
      .where(eq(pageLayouts.objectType, parsed.data.objectType))
      .returning();
  } else {
    [row] = await db.insert(pageLayouts).values(parsed.data).returning();
  }
  res.json(row);
});

export default router;
