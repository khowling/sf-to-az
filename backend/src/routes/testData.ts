import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { accounts, contacts, opportunities } from '../db/schema.js';

const router = Router();

// Industry-themed seed data
const industryThemes: Record<string, {
  industries: string[];
  companyPrefixes: string[];
  companySuffixes: string[];
  opportunityNames: string[];
}> = {
  'Technology': {
    industries: ['Software & Cloud Computing', 'Cybersecurity', 'AI & Machine Learning', 'Data Analytics', 'DevOps & Infrastructure', 'SaaS Platforms', 'Quantum Computing', 'Edge Computing', 'Blockchain & Web3'],
    companyPrefixes: ['Apex', 'Cipher', 'Quantum', 'Nexus', 'Helix', 'Vertex', 'Flux', 'Nova', 'Prism', 'Vector', 'Neural', 'Byte', 'Logic', 'Pixel', 'Stack'],
    companySuffixes: ['Labs', 'AI', 'Cloud', 'Systems', 'Digital', 'Platforms', 'Technologies', 'Software', 'Networks', 'Security', 'Data', 'Code', 'Compute', 'Dev', 'IO'],
    opportunityNames: ['Cloud Migration Project', 'AI Implementation', 'DevOps Toolchain', 'Platform Upgrade', 'Security Assessment', 'Data Analytics Suite', 'API Integration', 'SaaS License Agreement', 'Infrastructure Modernization', 'Kubernetes Deployment', 'CI/CD Pipeline Setup', 'Zero Trust Architecture', 'Data Lake Implementation', 'ML Model Training Platform', 'Edge Computing Rollout'],
  },
  'Healthcare': {
    industries: ['Pharmaceuticals', 'Medical Devices', 'Biotechnology', 'Healthcare IT', 'Telemedicine', 'Clinical Research', 'Digital Health', 'Genomics', 'Health Insurance'],
    companyPrefixes: ['Vital', 'Medix', 'Cura', 'Helio', 'BioNova', 'Pulse', 'Genix', 'Astra', 'Viva', 'Thera', 'Omni', 'Neuro', 'Cardio', 'Pharma', 'Wellness'],
    companySuffixes: ['Health', 'Biotech', 'Medical', 'Therapeutics', 'Diagnostics', 'Genomics', 'Pharma', 'Sciences', 'Care', 'Wellness', 'Clinical', 'Devices', 'Life', 'Bio', 'Med'],
    opportunityNames: ['EHR System Upgrade', 'Clinical Trial Management', 'Telehealth Platform', 'Patient Portal Deployment', 'HIPAA Compliance Audit', 'Lab Information System', 'Drug Discovery Platform', 'Remote Patient Monitoring', 'Medical Imaging Solution', 'Pharmacy Automation', 'Genomic Sequencing Service', 'Population Health Analytics', 'Regulatory Submission System', 'Care Coordination Platform', 'Revenue Cycle Optimization'],
  },
  'Financial Services': {
    industries: ['Investment Banking', 'Insurance', 'Wealth Management', 'FinTech', 'Payments & Processing', 'Commercial Banking', 'Private Equity', 'RegTech', 'Cryptocurrency'],
    companyPrefixes: ['Pinnacle', 'Meridian', 'Vanguard', 'Sterling', 'Atlas', 'Titan', 'Summit', 'Crest', 'Capital', 'Forge', 'Crown', 'Liberty', 'Equity', 'Trust', 'Harbor'],
    companySuffixes: ['Capital', 'Financial', 'Advisors', 'Partners', 'Investments', 'Wealth', 'Holdings', 'Banking', 'Securities', 'Fund', 'Asset', 'Venture', 'Trust', 'Group', 'Finance'],
    opportunityNames: ['Risk Management Platform', 'Trading System Upgrade', 'Regulatory Compliance Suite', 'Payment Gateway Integration', 'Fraud Detection System', 'Portfolio Analytics Dashboard', 'KYC/AML Solution', 'Digital Banking Platform', 'Insurance Claims Automation', 'Wealth Management Portal', 'Blockchain Settlement System', 'Credit Scoring Engine', 'Anti-Money Laundering Audit', 'Robo-Advisor Platform', 'Real-Time Payments Infrastructure'],
  },
  'Manufacturing': {
    industries: ['Automotive', 'Aerospace & Defense', 'Consumer Electronics', 'Industrial Equipment', 'Chemical Manufacturing', 'Precision Engineering', 'Robotics & Automation', 'Semiconductor', 'Packaging'],
    companyPrefixes: ['Forge', 'Titan', 'Apex', 'Core', 'Arc', 'Steel', 'Precision', 'Dynamic', 'Atlas', 'Omega', 'Iron', 'Alloy', 'Macro', 'Ultra', 'Turbo'],
    companySuffixes: ['Industries', 'Manufacturing', 'Engineering', 'Robotics', 'Automation', 'Dynamics', 'Fabrication', 'Systems', 'Components', 'Precision', 'Works', 'Foundry', 'Assembly', 'Motors', 'Machining'],
    opportunityNames: ['ERP Migration', 'Supply Chain Optimization', 'IoT Deployment', 'Predictive Maintenance System', 'Quality Management Solution', 'Digital Twin Implementation', 'MES Platform Upgrade', 'Warehouse Automation', 'Inventory Management System', 'Production Line Modernization', 'SCADA System Upgrade', 'Fleet Management Solution', 'Sustainability Initiative', 'Robotic Process Automation', 'Smart Factory Rollout'],
  },
  'Mixed (All Industries)': {
    industries: ['Software & Cloud Computing', 'Investment Banking', 'Pharmaceuticals', 'Aerospace & Defense', 'Commercial Real Estate', 'Digital Media & Entertainment', 'Cybersecurity', 'Renewable Energy', 'Medical Devices', 'Supply Chain & Logistics', 'Insurance', 'Telecommunications', 'Automotive', 'Food & Beverage', 'Professional Services', 'Biotechnology', 'E-Commerce', 'Construction & Engineering', 'Hospitality & Tourism', 'Legal Services', 'Agriculture & AgTech', 'Consumer Electronics'],
    companyPrefixes: ['Apex', 'Vertex', 'Pinnacle', 'Quantum', 'Meridian', 'Catalyst', 'Nexus', 'Horizon', 'Vanguard', 'Zenith', 'Atlas', 'Titan', 'Nova', 'Stellar', 'Cipher', 'Prism', 'Ascend', 'Forge', 'Beacon', 'Crest', 'Pulse', 'Summit', 'Bridge', 'Core', 'Flux', 'Arc', 'Orion', 'Vector', 'Helix', 'Omega'],
    companySuffixes: ['Solutions', 'Systems', 'Technologies', 'Industries', 'Group', 'Corp', 'Enterprises', 'Partners', 'Services', 'Associates', 'Labs', 'Dynamics', 'Ventures', 'Analytics', 'Consulting', 'Digital', 'Capital', 'Innovations', 'Networks', 'Robotics', 'Biotech', 'Logistics', 'Media', 'AI', 'Cloud', 'Health', 'Security', 'Platforms', 'Interactive', 'Automation'],
    opportunityNames: ['Enterprise License Agreement', 'Cloud Migration Project', 'Digital Transformation Initiative', 'Annual Maintenance Renewal', 'Platform Upgrade', 'Security Assessment', 'Data Analytics Suite', 'Custom Integration', 'Managed Services Contract', 'Infrastructure Modernization', 'Compliance Solution', 'Training Program', 'Proof of Concept', 'Strategic Partnership', 'IoT Deployment', 'AI Implementation', 'DevOps Toolchain', 'ERP Migration', 'CRM Implementation', 'Supply Chain Optimization', 'Cybersecurity Audit', 'Marketing Automation', 'HR Platform Rollout', 'Financial Systems Upgrade', 'Network Expansion', 'Mobile App Development', 'API Integration', 'Disaster Recovery Plan', 'Sustainability Initiative', 'Workforce Analytics'],
  },
};

const availableThemes = Object.keys(industryThemes);

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

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAccountName(theme: typeof industryThemes[string]): string {
  return `${randomElement(theme.companyPrefixes)} ${randomElement(theme.companySuffixes)}`;
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

// GET /api/test-data/themes
router.get('/themes', (_req: Request, res: Response) => {
  res.json(availableThemes);
});

// POST /api/test-data/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const batchSize = 1000;
    const accountCount = Math.min(Number(req.body?.accounts) || 100000, 500000);
    const contactCount = Math.min(Number(req.body?.contacts) || 200000, 1000000);
    const opportunityCount = Math.min(Number(req.body?.opportunities) || 1000000, 5000000);
    const themeName = req.body?.theme || 'Mixed (All Industries)';
    const theme = industryThemes[themeName] || industryThemes['Mixed (All Industries)'];

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
        const accountName = `${generateAccountName(theme)} ${i + j + 1}`;
        batchNames.push(accountName);
        batch.push({
          name: accountName,
          industry: randomElement(theme.industries),
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
          name: `${randomElement(theme.opportunityNames)} - ${accountNames[accountIndex]}`,
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
