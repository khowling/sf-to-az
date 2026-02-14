import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { accounts, contacts, opportunities } from '../db/schema.js';

const router = Router();

// Helper to generate random data
const industries = [
  'Software & Cloud Computing', 'Investment Banking', 'Pharmaceuticals', 'Aerospace & Defense',
  'Commercial Real Estate', 'Digital Media & Entertainment', 'Cybersecurity', 'Renewable Energy',
  'Medical Devices', 'Supply Chain & Logistics', 'Insurance', 'Telecommunications', 'Automotive',
  'Food & Beverage', 'Professional Services', 'Biotechnology', 'E-Commerce',
  'Construction & Engineering', 'Hospitality & Tourism', 'Legal Services',
  'Agriculture & AgTech', 'Mining & Metals', 'Shipping & Maritime', 'Fashion & Apparel',
  'Consumer Electronics',
];
const stages = ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William',
  'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah',
  'Charles', 'Karen', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'Logan', 'Mia', 'Lucas', 'Amelia', 'Aiden', 'Harper', 'Elijah', 'Evelyn', 'Caden',
  'Abigail', 'Jackson', 'Emily', 'Sebastian', 'Ella', 'Mateo', 'Scarlett', 'Henry', 'Grace',
  'Owen', 'Chloe', 'Alexander', 'Priya', 'Wei', 'Yuki', 'Carlos', 'Fatima', 'Ahmed', 'Mei',
  'Raj', 'Aisha', 'Dmitri', 'Ingrid', 'Kwame', 'Chiara', 'Sven', 'Yara', 'Jin', 'Aaliyah',
  'Kenji', 'Nadia', 'Diego',
];
const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez',
  'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore',
  'Jackson', 'Martin', 'Chen', 'Patel', 'Kim', 'Nakamura', 'Mueller', 'O\'Brien', 'Svensson',
  'Costa', 'Dubois', 'Ivanov', 'Singh', 'Tanaka', 'Fernandez', 'Zhang', 'Okafor', 'Berg',
  'Reeves', 'Sharma', 'Novak', 'Ali', 'Park', 'Larsson', 'Rossi', 'Yamamoto', 'Santos', 'Weber',
  'Fischer', 'Johansson', 'Moreau', 'Gupta', 'Lee', 'Thompson', 'White', 'Harris', 'Clark',
  'Lewis', 'Walker', 'Hall', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green', 'Baker',
  'Adams', 'Nelson', 'Hill', 'Ramirez', 'Campbell',
];
const companyPrefixes = [
  'Apex', 'Vertex', 'Pinnacle', 'Quantum', 'Meridian', 'Catalyst', 'Nexus', 'Horizon',
  'Vanguard', 'Zenith', 'Atlas', 'Titan', 'Nova', 'Stellar', 'Cipher', 'Prism', 'Ascend',
  'Forge', 'Beacon', 'Crest', 'Pulse', 'Summit', 'Bridge', 'Core', 'Flux', 'Arc', 'Orion',
  'Vector', 'Helix', 'Omega',
];
const companySuffixes = [
  'Solutions', 'Systems', 'Technologies', 'Industries', 'Group', 'Corp', 'Enterprises',
  'Partners', 'Services', 'Associates', 'Labs', 'Dynamics', 'Ventures', 'Analytics', 'Consulting',
  'Digital', 'Capital', 'Innovations', 'Networks', 'Robotics', 'Biotech', 'Logistics', 'Media',
  'AI', 'Cloud', 'Health', 'Security', 'Platforms', 'Interactive', 'Automation',
];
const opportunityNames = [
  'Enterprise License Agreement', 'Cloud Migration Project', 'Digital Transformation Initiative',
  'Annual Maintenance Renewal', 'Platform Upgrade', 'Security Assessment', 'Data Analytics Suite',
  'Custom Integration', 'Managed Services Contract', 'Infrastructure Modernization',
  'Compliance Solution', 'Training Program', 'Proof of Concept', 'Strategic Partnership',
  'IoT Deployment', 'AI Implementation', 'DevOps Toolchain', 'ERP Migration',
  'CRM Implementation', 'Supply Chain Optimization', 'Cybersecurity Audit',
  'Marketing Automation', 'HR Platform Rollout', 'Financial Systems Upgrade',
  'Network Expansion', 'Mobile App Development', 'API Integration', 'Disaster Recovery Plan',
  'Sustainability Initiative', 'Workforce Analytics',
];

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
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const batchSize = 1000;
    const accountCount = Math.min(Number(req.body?.accounts) || 100000, 500000);
    const contactCount = Math.min(Number(req.body?.contacts) || 200000, 1000000);
    const opportunityCount = Math.min(Number(req.body?.opportunities) || 1000000, 5000000);

    console.log('Starting test data generation...');
    console.log(`Target: ${accountCount} accounts, ${contactCount} contacts, ${opportunityCount} opportunities`);

    // Generate accounts in batches
    console.log('Generating accounts...');
    const accountIds: string[] = [];
    const accountNames: string[] = [];
    for (let i = 0; i < accountCount; i += batchSize) {
      const batch = [];
      const batchNames: string[] = [];
      const currentBatchSize = Math.min(batchSize, accountCount - i);
      
      for (let j = 0; j < currentBatchSize; j++) {
        const accountName = `${generateAccountName()} ${i + j + 1}`;
        batchNames.push(accountName);
        batch.push({
          name: accountName,
          industry: randomElement(industries),
          phone: generatePhone(),
          website: `https://www.${accountName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          customFields: {},
        });
      }
      
      const inserted = await db.insert(accounts).values(batch).returning({ id: accounts.id });
      accountIds.push(...inserted.map(r => r.id));
      accountNames.push(...batchNames);
      
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
        const accountIndex = Math.floor(Math.random() * accountIds.length);
        
        batch.push({
          name: `${randomElement(opportunityNames)} - ${accountNames[accountIndex]}`,
          accountId: accountIds[accountIndex],
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
