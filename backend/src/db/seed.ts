import { db } from './index.js';
import { fieldDefinitions, pageLayouts } from './schema.js';
import 'dotenv/config';

async function seed() {
  console.log('Seeding field definitions...');

  // Clear existing data
  await db.delete(fieldDefinitions);
  await db.delete(pageLayouts);

  // ─── Account field definitions ─────────────────────────────
  await db.insert(fieldDefinitions).values([
    { objectType: 'account', fieldName: 'name', label: 'Account Name', fieldType: 'text', required: true, isCustom: false, sortOrder: 1 },
    { objectType: 'account', fieldName: 'industry', label: 'Industry', fieldType: 'picklist', required: false, isCustom: false, sortOrder: 2, options: ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Other'] },
    { objectType: 'account', fieldName: 'phone', label: 'Phone', fieldType: 'text', required: false, isCustom: false, sortOrder: 3 },
    { objectType: 'account', fieldName: 'website', label: 'Website', fieldType: 'text', required: false, isCustom: false, sortOrder: 4 },
  ]);

  // ─── Contact field definitions ─────────────────────────────
  await db.insert(fieldDefinitions).values([
    { objectType: 'contact', fieldName: 'firstName', label: 'First Name', fieldType: 'text', required: true, isCustom: false, sortOrder: 1 },
    { objectType: 'contact', fieldName: 'lastName', label: 'Last Name', fieldType: 'text', required: true, isCustom: false, sortOrder: 2 },
    { objectType: 'contact', fieldName: 'email', label: 'Email', fieldType: 'text', required: false, isCustom: false, sortOrder: 3 },
    { objectType: 'contact', fieldName: 'phone', label: 'Phone', fieldType: 'text', required: false, isCustom: false, sortOrder: 4 },
    { objectType: 'contact', fieldName: 'accountId', label: 'Account', fieldType: 'lookup', required: false, isCustom: false, sortOrder: 5 },
  ]);

  // ─── Opportunity field definitions ─────────────────────────
  await db.insert(fieldDefinitions).values([
    { objectType: 'opportunity', fieldName: 'name', label: 'Opportunity Name', fieldType: 'text', required: true, isCustom: false, sortOrder: 1 },
    { objectType: 'opportunity', fieldName: 'accountId', label: 'Account', fieldType: 'lookup', required: true, isCustom: false, sortOrder: 2 },
    { objectType: 'opportunity', fieldName: 'amount', label: 'Amount', fieldType: 'number', required: false, isCustom: false, sortOrder: 3 },
    { objectType: 'opportunity', fieldName: 'stage', label: 'Stage', fieldType: 'picklist', required: true, isCustom: false, sortOrder: 4, options: ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] },
    { objectType: 'opportunity', fieldName: 'closeDate', label: 'Close Date', fieldType: 'date', required: false, isCustom: false, sortOrder: 5 },
  ]);

  // ─── Page Layouts ──────────────────────────────────────────
  await db.insert(pageLayouts).values([
    {
      objectType: 'account',
      sections: [
        { title: 'Account Information', columns: 2, fields: ['name', 'industry', 'phone', 'website'] },
      ],
    },
    {
      objectType: 'contact',
      sections: [
        { title: 'Contact Information', columns: 2, fields: ['firstName', 'lastName', 'email', 'phone', 'accountId'] },
      ],
    },
    {
      objectType: 'opportunity',
      sections: [
        { title: 'Opportunity Information', columns: 2, fields: ['name', 'accountId', 'amount', 'stage', 'closeDate'] },
      ],
    },
  ]);

  console.log('✅ Seed complete');
  process.exit(0);
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
