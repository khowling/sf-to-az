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
  const isClosed = current === 'Closed Won' || current === 'Closed Lost';
  const isWon = current === 'Closed Won';
  const isLost = current === 'Closed Lost';
  const activeIdx = stages.indexOf(current);

  return (
    <div className="flex items-center w-full">
      {stages.map((stage, i) => {
        const isClosedStage = stage === 'Closed Won' || stage === 'Closed Lost';
        const isPast = i < activeIdx && !isClosedStage;
        const isActive = stage === current;

        let bg = 'bg-gray-200 text-gray-500';
        if (isPast) bg = 'bg-[#0176d3] text-white';
        if (isActive && isWon) bg = 'bg-green-500 text-white';
        if (isActive && isLost) bg = 'bg-red-500 text-white';
        if (isActive && !isClosed) bg = 'bg-[#0176d3] text-white ring-2 ring-[#0176d3] ring-offset-2';

        // Hide the opposite closed stage
        if (isClosedStage && !isActive && isClosed) return null;
        // When not closed, show both closed stages dimmed
        if (isClosedStage && !isClosed) bg = 'bg-gray-200 text-gray-400';

        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${bg} transition-all`}>
                {isPast ? '✓' : isActive && isWon ? '★' : isActive && isLost ? '✕' : i + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight w-16 ${isActive ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                {stage}
              </span>
            </div>
            {i < stages.length - 1 && !(isClosedStage && !isActive && isClosed) && (
              <div className={`h-0.5 flex-1 mx-1 ${isPast ? 'bg-[#0176d3]' : 'bg-gray-200'} transition-all`} />
            )}
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
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{icon} {isPast ? 'Overdue' : 'Time Remaining'}</span>
        <span className="text-sm font-bold">{label}</span>
      </div>
      <div className="w-full bg-white/60 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${isPast ? 'bg-red-400' : diffDays <= 7 ? 'bg-orange-400' : diffDays <= 30 ? 'bg-yellow-400' : 'bg-green-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs mt-1 opacity-75">
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

      {/* Stage Progress + Time Horizon */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-white rounded-lg shadow px-6 py-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Sales Path</p>
          <StageProgress current={opp.stage} />
        </div>
        <div>
          <TimeHorizon closeDate={opp.closeDate} />
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
                  ) : f.fieldType === 'boolean' ? (
                    <input type="checkbox" checked={!!val} disabled className="h-4 w-4 rounded border-gray-300 text-[#0176d3]" />
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
