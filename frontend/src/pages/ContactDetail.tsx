import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, accountsApi, fieldDefsApi } from '../api/client';
import RecordForm from '../components/RecordForm';
import { useToast } from '../components/Toast';
import type { FieldDefinition } from '../types';

const builtInFields: FieldDefinition[] = [
  { id: '_fn', objectType: 'contact', fieldName: 'firstName', label: 'First Name', fieldType: 'text', required: true, isCustom: false, options: [], validations: {}, sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: '_ln', objectType: 'contact', fieldName: 'lastName', label: 'Last Name', fieldType: 'text', required: true, isCustom: false, options: [], validations: {}, sortOrder: 1, createdAt: '', updatedAt: '' },
  { id: '_email', objectType: 'contact', fieldName: 'email', label: 'Email', fieldType: 'text', required: false, isCustom: false, options: [], validations: {}, sortOrder: 2, createdAt: '', updatedAt: '' },
  { id: '_phone', objectType: 'contact', fieldName: 'phone', label: 'Phone', fieldType: 'text', required: false, isCustom: false, options: [], validations: {}, sortOrder: 3, createdAt: '', updatedAt: '' },
  { id: '_acct', objectType: 'contact', fieldName: 'accountId', label: 'Account', fieldType: 'lookup', required: false, isCustom: false, options: [], validations: {}, sortOrder: 4, createdAt: '', updatedAt: '' },
];

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: contact, isLoading } = useQuery({ queryKey: ['contacts', id], queryFn: () => contactsApi.get(id!) });
  const { data: customFields = [] } = useQuery({ queryKey: ['fieldDefs', 'contact'], queryFn: () => fieldDefsApi.list('contact') });
  const { data: accountsRes } = useQuery({ queryKey: ['accounts'], queryFn: () => accountsApi.list() });

  const allFields = [...builtInFields, ...customFields.filter((f) => f.isCustom)];
  const linkedAccount = (accountsRes?.data ?? []).find((a) => a.id === contact?.accountId);

  const updateMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const { firstName, lastName, email, phone, accountId, ...rest } = data;
      return contactsApi.update(id!, { firstName: firstName as string, lastName: lastName as string, email: email as string, phone: phone as string, accountId: (accountId as string) || null, customFields: rest });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); setEditing(false); toast.success('Contact updated'); },
    onError: () => toast.error('Failed to update contact'),
  });

  const deleteMut = useMutation({
    mutationFn: () => contactsApi.delete(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); navigate('/contacts'); toast.success('Contact deleted'); },
    onError: () => toast.error('Failed to delete contact'),
  });

  const startEdit = () => {
    if (!contact) return;
    const vals: Record<string, unknown> = { firstName: contact.firstName, lastName: contact.lastName, email: contact.email, phone: contact.phone, accountId: contact.accountId };
    if (contact.customFields) Object.assign(vals, contact.customFields);
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

  if (isLoading || !contact) return <p className="text-gray-400">Loading…</p>;

  const highlights = [
    { label: 'Email', value: contact.email },
    { label: 'Phone', value: contact.phone },
    { label: 'Account', value: linkedAccount?.name, link: linkedAccount ? `/accounts/${linkedAccount.id}` : undefined },
  ];

  return (
    <div>
      <div className="mb-6 rounded-lg bg-white px-6 py-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Contact</p>
            <h1 className="text-2xl font-bold text-gray-900 truncate">{contact.firstName} {contact.lastName}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={startEdit} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Edit</button>
            <button onClick={() => { if (confirm('Delete this contact?')) deleteMut.mutate(); }} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">Delete</button>
          </div>
        </div>
        <div className="mt-4 flex gap-8">
          {highlights.map((h) => (
            <div key={h.label}>
              <p className="text-xs font-medium text-gray-500 truncate">{h.label}</p>
              {h.link ? (
                <Link to={h.link} className="text-sm text-blue-600 hover:text-blue-700">{h.value}</Link>
              ) : (
                <p className="text-sm text-gray-900 truncate">{h.value || '—'}</p>
              )}
            </div>
          ))}
        </div>
      </div>

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
              let val: unknown;
              if (['firstName', 'lastName', 'email', 'phone', 'accountId'].includes(f.fieldName)) {
                val = (contact as unknown as Record<string, unknown>)[f.fieldName];
                if (f.fieldName === 'accountId') val = linkedAccount?.name ?? val;
              } else {
                val = contact.customFields?.[f.fieldName];
              }
              return (
                <div key={f.fieldName}>
                  <p className="text-xs font-medium text-gray-500">{f.label}</p>
                  <div className="mt-1">
                    {f.fieldName === 'accountId' && linkedAccount ? (
                      <Link to={`/accounts/${linkedAccount.id}`} className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors no-underline">
                        <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
                        {linkedAccount.name}
                      </Link>
                    ) : f.fieldType === 'boolean' ? (
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
    </div>
  );
}
