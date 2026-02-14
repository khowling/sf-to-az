// Shared types matching backend schema

export interface Account {
  id: string;
  name: string;
  industry: string | null;
  phone: string | null;
  website: string | null;
  country?: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  accountId: string | null;
  accountName?: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  name: string;
  accountId: string;
  accountName?: string | null;
  amount: string | null;
  stage: string;
  closeDate: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FieldDefinition {
  id: string;
  objectType: 'account' | 'contact' | 'opportunity';
  fieldName: string;
  label: string;
  fieldType: 'text' | 'number' | 'date' | 'picklist' | 'boolean' | 'lookup';
  required: boolean;
  isCustom: boolean;
  options: string[];
  validations: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageLayoutSection {
  title: string;
  columns: number;
  fields: string[];
}

export interface PageLayout {
  id: string;
  objectType: string;
  sections: PageLayoutSection[];
  createdAt: string;
  updatedAt: string;
}

export type ObjectType = 'account' | 'contact' | 'opportunity';
