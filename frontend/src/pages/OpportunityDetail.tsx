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
    <div className="slds-path">
      <div className="slds-grid slds-path__track">
        <div className="slds-grid slds-path__scroller-container">
          <div className="slds-path__scroller">
            <div className="slds-path__scroller_inner" role="listbox">
              {stages.map((stage, i) => {
                let stepClass = 'slds-path__item slds-is-incomplete';
                if (i < activeIdx) stepClass = 'slds-path__item slds-is-complete';
                if (stage === current) {
                  stepClass = 'slds-path__item slds-is-current';
                  if (isWon) stepClass += ' slds-is-won';
                  if (isLost) stepClass += ' slds-is-lost';
                }
                return (
                  <li key={stage} className={stepClass} role="presentation">
                    <a className="slds-path__link" role="option" tabIndex={-1}>
                      <span className="slds-path__title">{stage}</span>
                    </a>
                  </li>
                );
              })}
            </div>
          </div>
        </div>
      </div>
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
    <div className={`slds-box rounded-lg border px-4 py-3 ${color}`}>
      <div className="flex items-center justify-between slds-m-bottom_xx-small">
        <span className="slds-text-title_caps">{icon} {isPast ? 'Overdue' : 'Time Remaining'}</span>
        <span className="slds-text-body_regular" style={{ fontWeight: 700 }}>{label}</span>
      </div>
      <div className="slds-progress-bar slds-progress-bar_circular" style={{ backgroundColor: 'rgba(255,255,255,0.6)', height: '0.5rem', borderRadius: '9999px' }}>
        <span
          className="slds-progress-bar__value"
          style={{ width: `${pct}%`, backgroundColor: isPast ? '#ea001e' : diffDays <= 7 ? '#fe9339' : diffDays <= 30 ? '#e4a201' : '#2e844a', borderRadius: '9999px' }}
        />
      </div>
      <p className="slds-text-body_small slds-m-top_xx-small" style={{ opacity: 0.75 }}>
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

  if (isLoading || !opp) return <p className="slds-text-color_weak">Loading…</p>;

  const stageClass = stageColors[opp.stage] ?? 'bg-gray-100 text-gray-800';

  const highlights = [
    { label: 'Account', value: linkedAccount?.name ?? opp.accountName, link: linkedAccount ? `/accounts/${linkedAccount.id}` : undefined },
    { label: 'Amount', value: opp.amount ? `$${Number(opp.amount).toLocaleString()}` : '—' },
    { label: 'Stage', value: opp.stage, badge: true },
    { label: 'Close Date', value: opp.closeDate || '—' },
  ];

  return (
    <div>
      <div className="slds-page-header slds-m-bottom_medium">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <div className="slds-media">
              <div className="slds-media__body">
                <div className="slds-page-header__name">
                  <div className="slds-page-header__name-title">
                    <span className="slds-page-header__name-meta">Opportunity</span>
                    <h1><span className="slds-page-header__title slds-truncate">{opp.name}</span></h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="slds-page-header__col-actions">
            <div className="slds-page-header__controls">
              <button onClick={startEdit} className="slds-button slds-button_neutral">Edit</button>
              <button onClick={() => { if (confirm('Delete this opportunity?')) deleteMut.mutate(); }} className="slds-button slds-button_destructive">Delete</button>
            </div>
          </div>
        </div>
        <div className="slds-page-header__row slds-page-header__row_gutters">
          <div className="slds-page-header__col-details">
            <ul className="slds-page-header__detail-row">
              {highlights.map((h) => (
                <li key={h.label} className="slds-page-header__detail-block">
                  <p className="slds-text-title slds-truncate">{h.label}</p>
                  {h.link ? (
                    <Link to={h.link} className="slds-text-body_regular" style={{ color: '#0176d3' }}>{h.value}</Link>
                  ) : h.badge ? (
                    <span className={`slds-badge ${stageClass}`}>{h.value}</span>
                  ) : (
                    <p className="slds-text-body_regular slds-truncate">{h.value}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Stage Progress + Time Horizon */}
      <div className="slds-grid slds-wrap slds-gutters slds-m-bottom_medium">
        <div className="slds-col slds-size_1-of-1 slds-large-size_2-of-3">
          <div className="slds-card">
            <div className="slds-card__body slds-card__body_inner">
              <p className="slds-text-title slds-m-bottom_small">Sales Path</p>
              <StageProgress current={opp.stage} />
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-1 slds-large-size_1-of-3">
          <TimeHorizon closeDate={opp.closeDate} />
        </div>
      </div>

      <div className="slds-card">
        <div className="slds-card__body slds-card__body_inner">
          {editing ? (
            <>
              <RecordForm fields={allFields} values={editValues} onChange={(k, v) => setEditValues((p) => ({ ...p, [k]: v }))} errors={errors} />
              <div className="slds-m-top_medium">
                <button onClick={handleSave} className="slds-button slds-button_brand">Save</button>
                <button onClick={() => setEditing(false)} className="slds-button slds-button_neutral slds-m-left_x-small">Cancel</button>
              </div>
            </>
          ) : (
            <div className="slds-grid slds-wrap slds-gutters_small">
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
                  <div key={f.fieldName} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-p-around_xx-small">
                    <div className="slds-form-element slds-form-element_readonly">
                      <span className="slds-form-element__label">{f.label}</span>
                      <div className="slds-form-element__control">
                        {f.fieldName === 'stage' ? (
                          <span className={`slds-badge ${stageClass}`}>{String(val)}</span>
                        ) : f.fieldType === 'boolean' ? (
                          <input type="checkbox" checked={!!val} disabled className="slds-checkbox" />
                        ) : (
                          <div className="slds-form-element__static">{val != null && val !== '' ? String(val) : '—'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
