import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { db } from './db/index.js';
import { fieldDefinitions, pageLayouts } from './db/schema.js';
import { eq, and, count } from 'drizzle-orm';
import accountRoutes from './routes/accounts.js';
import contactRoutes from './routes/contacts.js';
import opportunityRoutes from './routes/opportunities.js';
import fieldDefinitionRoutes from './routes/fieldDefinitions.js';
import pageLayoutRoutes from './routes/pageLayouts.js';
import testDataRoutes from './routes/testData.js';

import searchRoutes from './routes/search.js';

// Ensure standard field definitions and page layouts exist
async function ensureStandardFields() {
  const standardFields = [
    { objectType: 'account', fieldName: 'name', label: 'Account Name', fieldType: 'text', required: true, isCustom: false, sortOrder: 1 },
    { objectType: 'account', fieldName: 'industry', label: 'Industry', fieldType: 'picklist', required: false, isCustom: false, sortOrder: 2, options: ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Other'] },
    { objectType: 'account', fieldName: 'phone', label: 'Phone', fieldType: 'text', required: false, isCustom: false, sortOrder: 3 },
    { objectType: 'account', fieldName: 'website', label: 'Website', fieldType: 'text', required: false, isCustom: false, sortOrder: 4 },
    { objectType: 'account', fieldName: 'country', label: 'Country', fieldType: 'text', required: false, isCustom: false, sortOrder: 5 },
    { objectType: 'contact', fieldName: 'firstName', label: 'First Name', fieldType: 'text', required: true, isCustom: false, sortOrder: 1 },
    { objectType: 'contact', fieldName: 'lastName', label: 'Last Name', fieldType: 'text', required: true, isCustom: false, sortOrder: 2 },
    { objectType: 'contact', fieldName: 'email', label: 'Email', fieldType: 'text', required: false, isCustom: false, sortOrder: 3 },
    { objectType: 'contact', fieldName: 'phone', label: 'Phone', fieldType: 'text', required: false, isCustom: false, sortOrder: 4 },
    { objectType: 'contact', fieldName: 'accountId', label: 'Account', fieldType: 'lookup', required: false, isCustom: false, sortOrder: 5 },
    { objectType: 'opportunity', fieldName: 'name', label: 'Opportunity Name', fieldType: 'text', required: true, isCustom: false, sortOrder: 1 },
    { objectType: 'opportunity', fieldName: 'accountId', label: 'Account', fieldType: 'lookup', required: true, isCustom: false, sortOrder: 2 },
    { objectType: 'opportunity', fieldName: 'amount', label: 'Amount', fieldType: 'number', required: false, isCustom: false, sortOrder: 3 },
    { objectType: 'opportunity', fieldName: 'stage', label: 'Stage', fieldType: 'picklist', required: true, isCustom: false, sortOrder: 4, options: ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] },
    { objectType: 'opportunity', fieldName: 'closeDate', label: 'Close Date', fieldType: 'date', required: false, isCustom: false, sortOrder: 5 },
  ];

  for (const field of standardFields) {
    const [existing] = await db.select({ n: count() }).from(fieldDefinitions)
      .where(and(eq(fieldDefinitions.objectType, field.objectType), eq(fieldDefinitions.fieldName, field.fieldName)));
    if (existing.n === 0) {
      await db.insert(fieldDefinitions).values(field);
    }
  }

  const standardLayouts: { objectType: string; sections: { title: string; columns: number; fields: string[] }[] }[] = [
    { objectType: 'account', sections: [{ title: 'Account Information', columns: 2, fields: ['name', 'industry', 'phone', 'website', 'country'] }] },
    { objectType: 'contact', sections: [{ title: 'Contact Information', columns: 2, fields: ['firstName', 'lastName', 'email', 'phone', 'accountId'] }] },
    { objectType: 'opportunity', sections: [{ title: 'Opportunity Information', columns: 2, fields: ['name', 'accountId', 'amount', 'stage', 'closeDate'] }] },
  ];

  for (const layout of standardLayouts) {
    const [existing] = await db.select({ n: count() }).from(pageLayouts)
      .where(eq(pageLayouts.objectType, layout.objectType));
    if (existing.n === 0) {
      await db.insert(pageLayouts).values(layout);
    }
  }

  console.log('✅ Standard fields ensured');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/search', searchRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/field-definitions', fieldDefinitionRoutes);
app.use('/api/page-layouts', pageLayoutRoutes);
app.use('/api/test-data', testDataRoutes);

// Serve frontend static files in production
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
ensureStandardFields().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to ensure standard fields:', err);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (standard fields may be missing)`);
  });
});
