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
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });

  const allFields = [...builtInFields, ...customFields.filter((f) => f.isCustom)];
  const linkedAccount = accounts.find((a) => a.id === contact?.accountId);

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

  if (isLoading || !contact) return <p className="text-gray-500">Loading…</p>;

  const highlights = [
    { label: 'Email', value: contact.email },
    { label: 'Phone', value: contact.phone },
    { label: 'Account', value: linkedAccount?.name, link: linkedAccount ? `/accounts/${linkedAccount.id}` : undefined },
  ];

  return (
    <div>
      <div className="bg-white rounded-lg shadow mb-4">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Contact</p>
            <h1 className="text-xl font-bold text-gray-800">{contact.firstName} {contact.lastName}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={startEdit} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Edit</button>
            <button onClick={() => { if (confirm('Delete this contact?')) deleteMut.mutate(); }} className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50">Delete</button>
          </div>
        </div>
        <div className="px-6 py-3 flex gap-8">
          {highlights.map((h) => (
            <div key={h.label}>
              <p className="text-xs text-gray-500">{h.label}</p>
              {h.link ? (
                <Link to={h.link} className="text-sm font-medium text-[#0176d3] hover:underline">{h.value}</Link>
              ) : (
                <p className="text-sm font-medium text-gray-800">{h.value || '—'}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {editing ? (
          <>
            <RecordForm fields={allFields} values={editValues} onChange={(k, v) => setEditValues((p) => ({ ...p, [k]: v }))} errors={errors} />
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-[#0176d3] text-white rounded-md hover:bg-[#014486]">Save</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="text-xs text-gray-500">{f.label}</p>
                  <p className="text-sm text-gray-800">{val != null && val !== '' ? String(val) : '—'}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
