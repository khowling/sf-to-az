import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { accounts, contacts, opportunities } from '../db/schema.js';
import { ilike, or, eq, count } from 'drizzle-orm';

const router = Router();

// GET /api/search?q=term&limit=100
router.get('/', async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 100));

  if (!q) {
    return res.json({
      accounts: { data: [], total: 0 },
      contacts: { data: [], total: 0 },
      opportunities: { data: [], total: 0 },
    });
  }

  const pattern = `%${q}%`;

  const accountWhere = or(ilike(accounts.name, pattern), ilike(accounts.industry, pattern));
  const contactWhere = or(ilike(contacts.firstName, pattern), ilike(contacts.lastName, pattern), ilike(contacts.email, pattern));
  const oppWhere = or(ilike(opportunities.name, pattern), ilike(opportunities.stage, pattern));

  const [acctRows, [{ total: acctTotal }], contRows, [{ total: contTotal }], oppRows, [{ total: oppTotal }]] = await Promise.all([
    db.select().from(accounts).where(accountWhere).orderBy(accounts.name).limit(limit),
    db.select({ total: count() }).from(accounts).where(accountWhere),
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
      .where(contactWhere)
      .orderBy(contacts.lastName)
      .limit(limit),
    db.select({ total: count() }).from(contacts).where(contactWhere),
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
      .where(oppWhere)
      .orderBy(opportunities.name)
      .limit(limit),
    db.select({ total: count() }).from(opportunities).where(oppWhere),
  ]);

  res.json({
    accounts: { data: acctRows, total: acctTotal },
    contacts: { data: contRows, total: contTotal },
    opportunities: { data: oppRows, total: oppTotal },
  });
});

export default router;
