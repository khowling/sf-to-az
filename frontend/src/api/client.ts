const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw body;
  }
  return res.json();
}

// ─── Accounts ─────────────────────────────────────────────
import type { Account, Contact, Opportunity, FieldDefinition, PageLayout } from '../types';

export const accountsApi = {
  list: () => request<Account[]>('/accounts'),
  get: (id: string) => request<Account>(`/accounts/${id}`),
  create: (data: Partial<Account>) => request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Account>) => request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/accounts/${id}`, { method: 'DELETE' }),
};

// ─── Contacts ─────────────────────────────────────────────
export const contactsApi = {
  list: () => request<Contact[]>('/contacts'),
  get: (id: string) => request<Contact>(`/contacts/${id}`),
  create: (data: Partial<Contact>) => request<Contact>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Contact>) => request<Contact>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/contacts/${id}`, { method: 'DELETE' }),
};

// ─── Opportunities ────────────────────────────────────────
export const opportunitiesApi = {
  list: () => request<Opportunity[]>('/opportunities'),
  get: (id: string) => request<Opportunity>(`/opportunities/${id}`),
  create: (data: Partial<Opportunity>) => request<Opportunity>('/opportunities', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Opportunity>) => request<Opportunity>(`/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/opportunities/${id}`, { method: 'DELETE' }),
};

// ─── Field Definitions ───────────────────────────────────
export const fieldDefsApi = {
  list: (objectType?: string) => request<FieldDefinition[]>(`/field-definitions${objectType ? `?objectType=${objectType}` : ''}`),
  create: (data: Partial<FieldDefinition>) => request<FieldDefinition>('/field-definitions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<FieldDefinition>) => request<FieldDefinition>(`/field-definitions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/field-definitions/${id}`, { method: 'DELETE' }),
};

// ─── Page Layouts ─────────────────────────────────────────
export const pageLayoutsApi = {
  get: (objectType: string) => request<PageLayout | null>(`/page-layouts?objectType=${objectType}`),
  update: (objectType: string, sections: PageLayout['sections']) =>
    request<PageLayout>(`/page-layouts/${objectType}`, { method: 'PUT', body: JSON.stringify({ sections }) }),
};

// ─── Test Data Generation ───────────────────────────────
export const testDataApi = {
  generate: () => request<{ success: boolean; message: string; stats: { accounts: number; contacts: number; opportunities: number; durationSeconds: number } }>('/test-data/generate', { method: 'POST' }),
};
