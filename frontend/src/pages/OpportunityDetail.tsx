import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesApi, accountsApi, fieldDefsApi } from '../api/client';
import RecordForm from '../components/RecordForm';
import { useToast } from '../components/Toast';
import type { FieldDefinition } from '../types';

const builtInFields: FieldDefinition[] = [
  { id: '_name', objectType: 'opportunity', fieldName: 'name', label: 'Name', fieldType: 'text', required: true, isCustom: false, options: [], validations: {}, sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: '_acct', objectType: 'opportunity', fieldName: 'accountId', label: 'Account', fieldType: 'lookup', required: true, isCustom: false, options: [], validations: {}, sortOrder: 1, createdAt: '', updatedAt: '' },
  { id: '_amount', objectType: 'opportunity', fieldName: 'amount', label: 'Amount', fieldType: 'number', required: false, isCustom: false, options: [], validations: {}, sortOrder: 2, createdAt: '', updatedAt: '' },
  { id: '_stage', objectType: 'opportunity', fieldName: 'stage', label: 'Stage', fieldType: 'picklist', required: true, isCustom: false, options: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'], validations: {}, sortOrder: 3, createdAt: '', updatedAt: '' },
  { id: '_close', objectType: 'opportunity', fieldName: 'closeDate', label: 'Close Date', fieldType: 'date', required: false, isCustom: false, options: [], validations: {}, sortOrder: 4, createdAt: '', updatedAt: '' },
];

const stageColors: Record<string, string> = {
  Prospecting: 'bg-blue-100 text-blue-800',
  Qualification: 'bg-indigo-100 text-indigo-800',
  Proposal: 'bg-yellow-100 text-yellow-800',
  Negotiation: 'bg-orange-100 text-orange-800',
  'Closed Won': 'bg-green-100 text-green-800',
  'Closed Lost': 'bg-red-100 text-red-800',
};

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: opp, isLoading } = useQuery({ queryKey: ['opportunities', id], queryFn: () => opportunitiesApi.get(id!) });
  const { data: customFields = [] } = useQuery({ queryKey: ['fieldDefs', 'opportunity'], queryFn: () => fieldDefsApi.list('opportunity') });
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });

  const allFields = [...builtInFields, ...customFields.filter((f) => f.isCustom)];
  const linkedAccount = accounts.find((a) => a.id === opp?.accountId);

  const updateMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const { name, accountId, amount, stage, closeDate, ...rest } = data;
      return opportunitiesApi.update(id!, { name: name as string, accountId: accountId as string, amount: amount != null ? String(amount) : null, stage: stage as string, closeDate: (closeDate as string) || null, customFields: rest });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['opportunities'] }); setEditing(false); toast.success('Opportunity updated'); },
    onError: () => toast.error('Failed to update opportunity'),
  });

  const deleteMut = useMutation({
    mutationFn: () => opportunitiesApi.delete(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['opportunities'] }); navigate('/opportunities'); toast.success('Opportunity deleted'); },
    onError: () => toast.error('Failed to delete opportunity'),
  });

  const startEdit = () => {
    if (!opp) return;
    const vals: Record<string, unknown> = { name: opp.name, accountId: opp.accountId, amount: opp.amount ? Number(opp.amount) : null, stage: opp.stage, closeDate: opp.closeDate };
    if (opp.customFields) Object.assign(vals, opp.customFields);
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

  if (isLoading || !opp) return <p className="text-gray-500">Loading…</p>;

  const stageClass = stageColors[opp.stage] ?? 'bg-gray-100 text-gray-800';

  const highlights = [
    { label: 'Account', value: linkedAccount?.name ?? opp.accountName, link: linkedAccount ? `/accounts/${linkedAccount.id}` : undefined },
    { label: 'Amount', value: opp.amount ? `$${Number(opp.amount).toLocaleString()}` : '—' },
    { label: 'Stage', value: opp.stage, badge: true },
    { label: 'Close Date', value: opp.closeDate || '—' },
  ];

  return (
    <div>
      <div className="bg-white rounded-lg shadow mb-4">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Opportunity</p>
            <h1 className="text-xl font-bold text-gray-800">{opp.name}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={startEdit} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Edit</button>
            <button onClick={() => { if (confirm('Delete this opportunity?')) deleteMut.mutate(); }} className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50">Delete</button>
          </div>
        </div>
        <div className="px-6 py-3 flex gap-8">
          {highlights.map((h) => (
            <div key={h.label}>
              <p className="text-xs text-gray-500">{h.label}</p>
              {h.link ? (
                <Link to={h.link} className="text-sm font-medium text-[#0176d3] hover:underline">{h.value}</Link>
              ) : h.badge ? (
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${stageClass}`}>{h.value}</span>
              ) : (
                <p className="text-sm font-medium text-gray-800">{h.value}</p>
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
              if (['name', 'accountId', 'amount', 'stage', 'closeDate'].includes(f.fieldName)) {
                val = (opp as unknown as Record<string, unknown>)[f.fieldName];
                if (f.fieldName === 'accountId') val = linkedAccount?.name ?? val;
                if (f.fieldName === 'amount' && val) val = `$${Number(val).toLocaleString()}`;
              } else {
                val = opp.customFields?.[f.fieldName];
              }
              return (
                <div key={f.fieldName}>
                  <p className="text-xs text-gray-500">{f.label}</p>
                  {f.fieldName === 'stage' ? (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${stageClass}`}>{String(val)}</span>
                  ) : (
                    <p className="text-sm text-gray-800">{val != null && val !== '' ? String(val) : '—'}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
