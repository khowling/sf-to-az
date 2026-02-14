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

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const accountsApi = {
  list: (page = 1, limit = 500, filters?: { industry?: string; country?: string }) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.industry) params.set('industry', filters.industry);
    if (filters?.country) params.set('country', filters.country);
    return request<PaginatedResponse<Account>>(`/accounts?${params}`);
  },
  distinctValues: () => request<{ industries: string[]; countries: string[] }>('/accounts/distinct-values'),
  get: (id: string) => request<Account>(`/accounts/${id}`),
  create: (data: Partial<Account>) => request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Account>) => request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/accounts/${id}`, { method: 'DELETE' }),
};

// ─── Contacts ─────────────────────────────────────────────
export const contactsApi = {
  list: (page = 1, limit = 500) => request<PaginatedResponse<Contact>>(`/contacts?page=${page}&limit=${limit}`),
  get: (id: string) => request<Contact>(`/contacts/${id}`),
  create: (data: Partial<Contact>) => request<Contact>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Contact>) => request<Contact>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/contacts/${id}`, { method: 'DELETE' }),
};

// ─── Opportunities ────────────────────────────────────────
export const opportunitiesApi = {
  list: (page = 1, limit = 500, filters?: { stage?: string; amountMin?: number; amountMax?: number; closeDateRange?: string }) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.stage) params.set('stage', filters.stage);
    if (filters?.amountMin != null) params.set('amountMin', String(filters.amountMin));
    if (filters?.amountMax != null) params.set('amountMax', String(filters.amountMax));
    if (filters?.closeDateRange) params.set('closeDateRange', filters.closeDateRange);
    return request<PaginatedResponse<Opportunity>>(`/opportunities?${params}`);
  },
  get: (id: string) => request<Opportunity>(`/opportunities/${id}`),
  create: (data: Partial<Opportunity>) => request<Opportunity>('/opportunities', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Opportunity>) => request<Opportunity>(`/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/opportunities/${id}`, { method: 'DELETE' }),
};

// ─── Search ───────────────────────────────────────────────
export const searchApi = {
  query: (q: string, limit = 100) => request<{
    accounts: { data: Account[]; total: number };
    contacts: { data: Contact[]; total: number };
    opportunities: { data: Opportunity[]; total: number };
  }>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`),
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
  themes: () => request<string[]>('/test-data/themes'),
  generate: (params?: { accounts?: number; contacts?: number; opportunities?: number; theme?: string; password?: string }) => request<{ success: boolean; message: string; stats: { accounts: number; contacts: number; opportunities: number; durationSeconds: number } }>('/test-data/generate', { method: 'POST', body: JSON.stringify(params ?? {}), headers: { 'Content-Type': 'application/json' } }),
};
