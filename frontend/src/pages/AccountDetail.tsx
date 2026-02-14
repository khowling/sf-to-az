import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi, contactsApi, opportunitiesApi, fieldDefsApi } from '../api/client';
import RecordForm from '../components/RecordForm';
import RecordTable from '../components/RecordTable';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import type { FieldDefinition } from '../types';

const builtInFields: FieldDefinition[] = [
  { id: '_name', objectType: 'account', fieldName: 'name', label: 'Name', fieldType: 'text', required: true, isCustom: false, options: [], validations: {}, sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: '_industry', objectType: 'account', fieldName: 'industry', label: 'Industry', fieldType: 'text', required: false, isCustom: false, options: [], validations: {}, sortOrder: 1, createdAt: '', updatedAt: '' },
  { id: '_phone', objectType: 'account', fieldName: 'phone', label: 'Phone', fieldType: 'text', required: false, isCustom: false, options: [], validations: {}, sortOrder: 2, createdAt: '', updatedAt: '' },
  { id: '_website', objectType: 'account', fieldName: 'website', label: 'Website', fieldType: 'text', required: false, isCustom: false, options: [], validations: {}, sortOrder: 3, createdAt: '', updatedAt: '' },
];

const contactBuiltIn: FieldDefinition[] = [
  { id: '_fn', objectType: 'contact', fieldName: 'firstName', label: 'First Name', fieldType: 'text', required: true, isCustom: false, options: [], validations: {}, sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: '_ln', objectType: 'contact', fieldName: 'lastName', label: 'Last Name', fieldType: 'text', required: true, isCustom: false, options: [], validations: {}, sortOrder: 1, createdAt: '', updatedAt: '' },
  { id: '_email', objectType: 'contact', fieldName: 'email', label: 'Email', fieldType: 'text', required: false, isCustom: false, options: [], validations: {}, sortOrder: 2, createdAt: '', updatedAt: '' },
  { id: '_phone', objectType: 'contact', fieldName: 'phone', label: 'Phone', fieldType: 'text', required: false, isCustom: false, options: [], validations: {}, sortOrder: 3, createdAt: '', updatedAt: '' },
  { id: '_acct', objectType: 'contact', fieldName: 'accountId', label: 'Account', fieldType: 'lookup', required: false, isCustom: false, options: [], validations: {}, sortOrder: 4, createdAt: '', updatedAt: '' },
];

const oppBuiltIn: FieldDefinition[] = [
  { id: '_name', objectType: 'opportunity', fieldName: 'name', label: 'Name', fieldType: 'text', required: true, isCustom: false, options: [], validations: {}, sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: '_acct', objectType: 'opportunity', fieldName: 'accountId', label: 'Account', fieldType: 'lookup', required: true, isCustom: false, options: [], validations: {}, sortOrder: 1, createdAt: '', updatedAt: '' },
  { id: '_amount', objectType: 'opportunity', fieldName: 'amount', label: 'Amount', fieldType: 'number', required: false, isCustom: false, options: [], validations: {}, sortOrder: 2, createdAt: '', updatedAt: '' },
  { id: '_stage', objectType: 'opportunity', fieldName: 'stage', label: 'Stage', fieldType: 'picklist', required: true, isCustom: false, options: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'], validations: {}, sortOrder: 3, createdAt: '', updatedAt: '' },
  { id: '_close', objectType: 'opportunity', fieldName: 'closeDate', label: 'Close Date', fieldType: 'date', required: false, isCustom: false, options: [], validations: {}, sortOrder: 4, createdAt: '', updatedAt: '' },
];

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'details' | 'related'>('details');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showOppModal, setShowOppModal] = useState(false);
  const [contactForm, setContactForm] = useState<Record<string, unknown>>({});
  const [oppForm, setOppForm] = useState<Record<string, unknown>>({});
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [oppErrors, setOppErrors] = useState<Record<string, string>>({});

  const { data: account, isLoading } = useQuery({ queryKey: ['accounts', id], queryFn: () => accountsApi.get(id!) });
  const { data: customFields = [] } = useQuery({ queryKey: ['fieldDefs', 'account'], queryFn: () => fieldDefsApi.list('account') });
  const { data: contactsRes } = useQuery({ queryKey: ['contacts'], queryFn: () => contactsApi.list() });
  const { data: oppsRes } = useQuery({ queryKey: ['opportunities'], queryFn: () => opportunitiesApi.list() });

  const allFields = [...builtInFields, ...customFields.filter((f) => f.isCustom)];
  const relatedContacts = (contactsRes?.data ?? []).filter((c) => c.accountId === id);
  const relatedOpps = (oppsRes?.data ?? []).filter((o) => o.accountId === id);

  const updateMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const { name, industry, phone, website, ...rest } = data;
      return accountsApi.update(id!, { name: name as string, industry: industry as string, phone: phone as string, website: website as string, customFields: rest });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); setEditing(false); toast.success('Account updated'); },
    onError: () => toast.error('Failed to update account'),
  });

  const deleteMut = useMutation({
    mutationFn: () => accountsApi.delete(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); navigate('/accounts'); toast.success('Account deleted'); },
    onError: () => toast.error('Failed to delete account'),
  });

  const createContactMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const { firstName, lastName, email, phone, ...rest } = data;
      return contactsApi.create({ firstName: firstName as string, lastName: lastName as string, email: email as string, phone: phone as string, accountId: id, customFields: rest });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); setShowContactModal(false); setContactForm({}); toast.success('Contact created'); },
    onError: () => toast.error('Failed to create contact'),
  });

  const createOppMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const { name, amount, stage, closeDate, ...rest } = data;
      return opportunitiesApi.create({ name: name as string, accountId: id!, amount: amount != null ? String(amount) : null, stage: stage as string, closeDate: closeDate as string, customFields: rest });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['opportunities'] }); setShowOppModal(false); setOppForm({}); toast.success('Opportunity created'); },
    onError: () => toast.error('Failed to create opportunity'),
  });

  const startEdit = () => {
    if (!account) return;
    const vals: Record<string, unknown> = { name: account.name, industry: account.industry, phone: account.phone, website: account.website };
    if (account.customFields) Object.assign(vals, account.customFields);
    setEditValues(vals);
    setEditing(true);
    setErrors({});
  };

  const handleSave = () => {
    const errs: Record<string, string> = {};
    allFields.forEach((f) => { if (f.required && !editValues[f.fieldName]) errs[f.fieldName] = 'Required'; });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    updateMut.mutate(editValues);
  };

  const handleSaveContact = () => {
    const errs: Record<string, string> = {};
    contactBuiltIn.forEach((f) => { if (f.required && !contactForm[f.fieldName]) errs[f.fieldName] = 'Required'; });
    if (Object.keys(errs).length) { setContactErrors(errs); return; }
    createContactMut.mutate(contactForm);
  };

  const handleSaveOpp = () => {
    const errs: Record<string, string> = {};
    const oppFieldsNoAcct = oppBuiltIn.filter((f) => f.fieldName !== 'accountId');
    oppFieldsNoAcct.forEach((f) => { if (f.required && !oppForm[f.fieldName]) errs[f.fieldName] = 'Required'; });
    if (Object.keys(errs).length) { setOppErrors(errs); return; }
    createOppMut.mutate(oppForm);
  };

  if (isLoading || !account) return <p className="text-gray-400">Loading…</p>;

  const highlights = [
    { label: 'Phone', value: account.phone },
    { label: 'Website', value: account.website },
    { label: 'Industry', value: account.industry },
  ];

  const contactFieldsNoAcct = contactBuiltIn.filter((f) => f.fieldName !== 'accountId');

  return (
    <div>
      {/* Header */}
      <div className="mb-6 rounded-lg bg-white px-6 py-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Account</p>
            <h1 className="text-2xl font-bold text-gray-900 truncate">{account.name}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={startEdit} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Edit</button>
            <button onClick={() => { if (confirm('Delete this account?')) deleteMut.mutate(); }} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">Delete</button>
          </div>
        </div>
        <div className="mt-4 flex gap-8">
          {highlights.map((h) => (
            <div key={h.label}>
              <p className="text-xs font-medium text-gray-500 truncate">{h.label}</p>
              <p className="text-sm text-gray-900 truncate">{h.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex gap-4">
            <button
              onClick={() => setTab('details')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${tab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >Details</button>
            <button
              onClick={() => setTab('related')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${tab === 'related' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >Related</button>
          </nav>
        </div>

        {tab === 'details' && (
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
            {editing ? (
              <>
                <RecordForm fields={allFields} values={editValues} onChange={(k, v) => setEditValues((p) => ({ ...p, [k]: v }))} errors={errors} />
                <div className="mt-4 flex gap-2">
                  <button onClick={handleSave} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Save</button>
                  <button onClick={() => setEditing(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Cancel</button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {allFields.map((f) => {
                  const val = ['name', 'industry', 'phone', 'website'].includes(f.fieldName)
                    ? (account as unknown as Record<string, unknown>)[f.fieldName]
                    : account.customFields?.[f.fieldName];
                  return (
                    <div key={f.fieldName}>
                      <p className="text-xs font-medium text-gray-500">{f.label}</p>
                      <div className="mt-1">
                        {f.fieldType === 'boolean' ? (
                          <input type="checkbox" checked={!!val} disabled className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                        ) : (
                          <p className="text-sm text-gray-900">{val != null && val !== '' ? String(val) : '—'}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'related' && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white shadow-sm border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Contacts ({relatedContacts.length})</h2>
                <button onClick={() => { setShowContactModal(true); setContactForm({}); setContactErrors({}); }} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">New Contact</button>
              </div>
              <RecordTable
                columns={[
                  { key: 'name', label: 'Name', render: (_, r) => `${r.firstName} ${r.lastName}` },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Phone' },
                ]}
                data={relatedContacts as unknown as Record<string, unknown>[]}
                onRowClick={(r) => navigate(`/contacts/${r.id}`)}
              />
            </div>
            <div className="rounded-lg bg-white shadow-sm border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Opportunities ({relatedOpps.length})</h2>
                <button onClick={() => { setShowOppModal(true); setOppForm({}); setOppErrors({}); }} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">New Opportunity</button>
              </div>
              <RecordTable
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'amount', label: 'Amount', render: (v) => v ? `$${Number(v).toLocaleString()}` : '—' },
                  { key: 'stage', label: 'Stage' },
                  { key: 'closeDate', label: 'Close Date' },
                ]}
                data={relatedOpps as unknown as Record<string, unknown>[]}
                onRowClick={(r) => navigate(`/opportunities/${r.id}`)}
              />
            </div>
          </div>
        )}
      </div>

      {/* New Contact Modal */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title="New Contact" footer={
        <>
          <button onClick={() => setShowContactModal(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Cancel</button>
          <button onClick={handleSaveContact} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Save</button>
        </>
      }>
        <RecordForm fields={contactFieldsNoAcct} values={contactForm} onChange={(k, v) => setContactForm((p) => ({ ...p, [k]: v }))} errors={contactErrors} />
      </Modal>

      {/* New Opportunity Modal */}
      <Modal isOpen={showOppModal} onClose={() => setShowOppModal(false)} title="New Opportunity" footer={
        <>
          <button onClick={() => setShowOppModal(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Cancel</button>
          <button onClick={handleSaveOpp} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Save</button>
        </>
      }>
        <RecordForm fields={oppBuiltIn.filter((f) => f.fieldName !== 'accountId')} values={oppForm} onChange={(k, v) => setOppForm((p) => ({ ...p, [k]: v }))} errors={oppErrors} />
      </Modal>
    </div>
  );
}
