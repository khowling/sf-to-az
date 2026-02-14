import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { accounts, contacts, opportunities } from '../db/schema.js';

const router = Router();

// Helper to generate random data
const industries = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Consulting', 'Real Estate', 'Energy', 'Transportation'];
const stages = ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const companyPrefixes = ['Global', 'National', 'United', 'Premier', 'Advanced', 'Dynamic', 'Strategic', 'Innovative', 'Professional', 'Elite'];
const companySuffixes = ['Solutions', 'Systems', 'Technologies', 'Industries', 'Group', 'Corp', 'Enterprises', 'Partners', 'Services', 'Associates'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAccountName(): string {
  return `${randomElement(companyPrefixes)} ${randomElement(companySuffixes)}`;
}

function generatePhone(): string {
  return `+1-${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`;
}

function generateEmail(firstName: string, lastName: string, accountName: string): string {
  const domain = accountName.toLowerCase().replace(/[^a-z]/g, '');
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}.com`;
}

function generateCloseDate(): string {
  const today = new Date();
  const daysOffset = randomInt(-180, 365); // -6 months to +1 year
  const date = new Date(today.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

// POST /api/test-data/generate
router.post('/generate', async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const batchSize = 1000;
    const accountCount = 100000;
    const contactCount = 200000;
    const opportunityCount = 1000000;

    console.log('Starting test data generation...');
    console.log(`Target: ${accountCount} accounts, ${contactCount} contacts, ${opportunityCount} opportunities`);

    // Generate accounts in batches
    console.log('Generating accounts...');
    const accountIds: string[] = [];
    for (let i = 0; i < accountCount; i += batchSize) {
      const batch = [];
      const currentBatchSize = Math.min(batchSize, accountCount - i);
      
      for (let j = 0; j < currentBatchSize; j++) {
        batch.push({
          name: `${generateAccountName()} ${i + j + 1}`,
          industry: randomElement(industries),
          phone: generatePhone(),
          website: `https://www.company${i + j + 1}.com`,
          customFields: {},
        });
      }
      
      const inserted = await db.insert(accounts).values(batch).returning({ id: accounts.id });
      accountIds.push(...inserted.map(r => r.id));
      
      if ((i + batchSize) % 10000 === 0 || i + batchSize >= accountCount) {
        console.log(`  Accounts: ${Math.min(i + batchSize, accountCount)}/${accountCount}`);
      }
    }

    // Generate contacts in batches
    console.log('Generating contacts...');
    const contactIds: string[] = [];
    const CONTACT_ACCOUNT_PROBABILITY = 0.9; // 90% of contacts have associated accounts
    for (let i = 0; i < contactCount; i += batchSize) {
      const batch = [];
      const currentBatchSize = Math.min(batchSize, contactCount - i);
      
      for (let j = 0; j < currentBatchSize; j++) {
        const firstName = randomElement(firstNames);
        const lastName = randomElement(lastNames);
        const accountId = randomElement(accountIds);
        
        batch.push({
          firstName,
          lastName,
          email: generateEmail(firstName, lastName, `company${i + j}`),
          phone: generatePhone(),
          accountId: Math.random() < CONTACT_ACCOUNT_PROBABILITY ? accountId : null,
          customFields: {},
        });
      }
      
      const inserted = await db.insert(contacts).values(batch).returning({ id: contacts.id });
      contactIds.push(...inserted.map(r => r.id));
      
      if ((i + batchSize) % 10000 === 0 || i + batchSize >= contactCount) {
        console.log(`  Contacts: ${Math.min(i + batchSize, contactCount)}/${contactCount}`);
      }
    }

    // Generate opportunities in batches
    console.log('Generating opportunities...');
    for (let i = 0; i < opportunityCount; i += batchSize) {
      const batch = [];
      const currentBatchSize = Math.min(batchSize, opportunityCount - i);
      
      for (let j = 0; j < currentBatchSize; j++) {
        const stage = randomElement(stages);
        const amount = randomInt(5000, 500000);
        
        batch.push({
          name: `Opportunity ${i + j + 1}`,
          accountId: randomElement(accountIds),
          amount: amount.toString(),
          stage,
          closeDate: generateCloseDate(),
          customFields: {},
        });
      }
      
      await db.insert(opportunities).values(batch);
      
      if ((i + batchSize) % 50000 === 0 || i + batchSize >= opportunityCount) {
        console.log(`  Opportunities: ${Math.min(i + batchSize, opportunityCount)}/${opportunityCount}`);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ Test data generation complete in ${duration}s`);

    res.json({
      success: true,
      message: 'Test data generated successfully',
      stats: {
        accounts: accountCount,
        contacts: contactCount,
        opportunities: opportunityCount,
        durationSeconds: duration,
      },
    });
  } catch (error) {
    console.error('Test data generation failed:', error);
    res.status(500).json({ error: 'Failed to generate test data', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
