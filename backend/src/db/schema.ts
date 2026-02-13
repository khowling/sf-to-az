import { pgTable, uuid, text, varchar, timestamp, numeric, date, jsonb, boolean, integer } from 'drizzle-orm/pg-core';

// ─── Accounts ────────────────────────────────────────────────
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  industry: varchar('industry', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),
  customFields: jsonb('custom_fields').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Contacts ────────────────────────────────────────────────
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  customFields: jsonb('custom_fields').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Opportunities ───────────────────────────────────────────
export const opportunities = pgTable('opportunities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }),
  stage: varchar('stage', { length: 100 }).notNull().default('Prospecting'),
  closeDate: date('close_date'),
  customFields: jsonb('custom_fields').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Field Definitions ──────────────────────────────────────
export const fieldDefinitions = pgTable('field_definitions', {
  id: uuid('id').defaultRandom().primaryKey(),
  objectType: varchar('object_type', { length: 50 }).notNull(), // 'account' | 'contact' | 'opportunity'
  fieldName: varchar('field_name', { length: 100 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  fieldType: varchar('field_type', { length: 50 }).notNull(), // 'text' | 'number' | 'date' | 'picklist' | 'boolean' | 'lookup'
  required: boolean('required').default(false).notNull(),
  isCustom: boolean('is_custom').default(true).notNull(),
  options: jsonb('options').default([]), // for picklist values
  validations: jsonb('validations').default({}),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Page Layouts ────────────────────────────────────────────
export const pageLayouts = pgTable('page_layouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  objectType: varchar('object_type', { length: 50 }).notNull().unique(),
  sections: jsonb('sections').default([]).notNull(),
  // sections shape: [{ title: string, columns: number, fields: string[] }]
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
