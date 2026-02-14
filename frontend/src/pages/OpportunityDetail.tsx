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

const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

function StageProgress({ current }: { current: string }) {
  const activeIdx = stages.indexOf(current);
  const isWon = current === 'Closed Won';
  const isLost = current === 'Closed Lost';

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {stages.map((stage, i) => {
        const isComplete = i < activeIdx;
        const isCurrent = stage === current;

        let bg = '#e5e7eb';
        let fg = '#6b7280';
        let border = '#d1d5db';
        if (isComplete) { bg = '#0176d3'; fg = '#fff'; border = '#0176d3'; }
        if (isCurrent && isWon) { bg = '#2e844a'; fg = '#fff'; border = '#2e844a'; }
        else if (isCurrent && isLost) { bg = '#c23934'; fg = '#fff'; border = '#c23934'; }
        else if (isCurrent) { bg = '#0176d3'; fg = '#fff'; border = '#0176d3'; }

        return (
          <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div
              style={{
                flex: 1,
                position: 'relative',
                padding: '0.5rem 0.75rem',
                backgroundColor: bg,
                color: fg,
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: isCurrent ? 700 : 500,
                clipPath: i === 0
                  ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                  : i === stages.length - 1
                  ? 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                  : 'polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)',
                marginLeft: i > 0 ? '-6px' : 0,
                zIndex: stages.length - i,
                boxShadow: isCurrent ? '0 0 0 2px #fff, 0 0 0 4px ' + border : 'none',
                borderRadius: isCurrent ? '2px' : 0,
                transition: 'all 0.2s ease',
                lineHeight: 1.3,
              }}
            >
              {isComplete ? '✓ ' : ''}{stage}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimeHorizon({ closeDate }: { closeDate: string | null }) {
  if (!closeDate) return null;

  const now = new Date();
  const close = new Date(closeDate + 'T00:00:00');
  const diffMs = close.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isPast = diffDays < 0;
  const absDays = Math.abs(diffDays);
  const weeks = Math.floor(absDays / 7);
  const months = Math.floor(absDays / 30);

  let label: string;
  if (absDays === 0) label = 'Today';
  else if (absDays === 1) label = isPast ? '1 day ago' : 'Tomorrow';
  else if (absDays < 14) label = isPast ? `${absDays} days ago` : `${absDays} days`;
  else if (absDays < 60) label = isPast ? `${weeks} weeks ago` : `${weeks} weeks`;
  else label = isPast ? `${months} months ago` : `${months} months`;

  let color = 'text-green-600 bg-green-50 border-green-200';
  let icon = '📅';
  if (isPast) { color = 'text-red-600 bg-red-50 border-red-200'; icon = '⚠️'; }
  else if (diffDays <= 7) { color = 'text-orange-600 bg-orange-50 border-orange-200'; icon = '⏰'; }
  else if (diffDays <= 30) { color = 'text-yellow-600 bg-yellow-50 border-yellow-200'; icon = '📅'; }

  // Progress bar: how far through a 90-day window
  const totalSpan = 90;
  const elapsed = totalSpan - Math.min(Math.max(diffDays, 0), totalSpan);
  const pct = Math.round((elapsed / totalSpan) * 100);

  return (
    <div className={`rounded-lg border px-4 py-3 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider">{icon} {isPast ? 'Overdue' : 'Time Remaining'}</span>
        <span className="text-sm font-bold">{label}</span>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: isPast ? '#ea001e' : diffDays <= 7 ? '#fe9339' : diffDays <= 30 ? '#e4a201' : '#2e844a' }}
        />
      </div>
      <p className="mt-1 text-xs" style={{ opacity: 0.75 }}>
        Close date: {close.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  );
}

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
  const { data: accountsRes } = useQuery({ queryKey: ['accounts'], queryFn: () => accountsApi.list() });

  const allFields = [...builtInFields, ...customFields.filter((f) => f.isCustom)];
  const linkedAccount = (accountsRes?.data ?? []).find((a) => a.id === opp?.accountId);

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

  if (isLoading || !opp) return <p className="text-gray-400">Loading…</p>;

  const stageClass = stageColors[opp.stage] ?? 'bg-gray-100 text-gray-800';

  const highlights = [
    { label: 'Account', value: linkedAccount?.name ?? opp.accountName, link: linkedAccount ? `/accounts/${linkedAccount.id}` : undefined },
    { label: 'Amount', value: opp.amount ? `$${Number(opp.amount).toLocaleString()}` : '—' },
    { label: 'Stage', value: opp.stage, badge: true },
    { label: 'Close Date', value: opp.closeDate || '—' },
  ];

  return (
    <div>
      <div className="mb-6 rounded-lg bg-white px-6 py-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Opportunity</p>
            <h1 className="text-2xl font-bold text-gray-900 truncate">{opp.name}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={startEdit} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Edit</button>
            <button onClick={() => { if (confirm('Delete this opportunity?')) deleteMut.mutate(); }} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">Delete</button>
          </div>
        </div>
        <div className="mt-4 flex gap-8">
          {highlights.map((h) => (
            <div key={h.label}>
              <p className="text-xs font-medium text-gray-500 truncate">{h.label}</p>
              {h.link ? (
                <Link to={h.link} className="text-sm text-blue-600 hover:text-blue-700">{h.value}</Link>
              ) : h.badge ? (
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${stageClass}`}>{h.value}</span>
              ) : (
                <p className="text-sm text-gray-900 truncate">{h.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage Progress + Time Horizon */}
      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg bg-white shadow-sm border border-gray-200 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">Sales Path</p>
          <StageProgress current={opp.stage} />
        </div>
        <div>
          <TimeHorizon closeDate={opp.closeDate} />
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
              if (['name', 'accountId', 'amount', 'stage', 'closeDate'].includes(f.fieldName)) {
                val = (opp as unknown as Record<string, unknown>)[f.fieldName];
                if (f.fieldName === 'accountId') val = linkedAccount?.name ?? val;
                if (f.fieldName === 'amount' && val) val = `$${Number(val).toLocaleString()}`;
              } else {
                val = opp.customFields?.[f.fieldName];
              }
              return (
                <div key={f.fieldName}>
                  <p className="text-xs font-medium text-gray-500">{f.label}</p>
                  <div className="mt-1">
                    {f.fieldName === 'stage' ? (
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${stageClass}`}>{String(val)}</span>
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
