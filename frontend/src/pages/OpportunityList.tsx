import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { opportunitiesApi, fieldDefsApi } from '../api/client';
import RecordTable from '../components/RecordTable';
import Modal from '../components/Modal';
import RecordForm from '../components/RecordForm';
import FilterBar from '../components/FilterBar';
import type { FilterConfig } from '../components/FilterBar';
import { useToast } from '../components/Toast';
import type { FieldDefinition } from '../types';

const builtInFields: FieldDefinition[] = [
  { id: '_name', objectType: 'opportunity', fieldName: 'name', label: 'Name', fieldType: 'text', required: true, isCustom: false, options: [], validations: {}, sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: '_acct', objectType: 'opportunity', fieldName: 'accountId', label: 'Account', fieldType: 'lookup', required: true, isCustom: false, options: [], validations: {}, sortOrder: 1, createdAt: '', updatedAt: '' },
  { id: '_amount', objectType: 'opportunity', fieldName: 'amount', label: 'Amount', fieldType: 'number', required: false, isCustom: false, options: [], validations: {}, sortOrder: 2, createdAt: '', updatedAt: '' },
  { id: '_stage', objectType: 'opportunity', fieldName: 'stage', label: 'Stage', fieldType: 'picklist', required: true, isCustom: false, options: ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'], validations: {}, sortOrder: 3, createdAt: '', updatedAt: '' },
  { id: '_close', objectType: 'opportunity', fieldName: 'closeDate', label: 'Close Date', fieldType: 'date', required: false, isCustom: false, options: [], validations: {}, sortOrder: 4, createdAt: '', updatedAt: '' },
];

const stages = ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const filterConfigs: FilterConfig[] = [
  { key: 'stage', label: 'Stage', type: 'select', options: stages },
  { key: 'amountMin', label: 'Amount Min', type: 'number', placeholder: 'Min $' },
  { key: 'amountMax', label: 'Amount Max', type: 'number', placeholder: 'Max $' },
  { key: 'closeDateRange', label: 'Close Date', type: 'date-range' },
];

export default function OpportunityList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const stage = searchParams.get('stage');
    if (stage) initial.stage = stage;
    return initial;
  });

  // Sync URL stage param to filters on mount/change
  useEffect(() => {
    const stage = searchParams.get('stage');
    if (stage && filters.stage !== stage) {
      setFilters(f => ({ ...f, stage }));
    }
  }, [searchParams]);

  const handleFiltersChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPage(1);
    if (newFilters.stage) {
      setSearchParams({ stage: newFilters.stage });
    } else {
      setSearchParams({});
    }
  };

  const apiFilters = {
    stage: filters.stage || undefined,
    amountMin: filters.amountMin ? Number(filters.amountMin) : undefined,
    amountMax: filters.amountMax ? Number(filters.amountMax) : undefined,
    closeDateRange: filters.closeDateRange || undefined,
  };

  const { data: response, isLoading } = useQuery({
    queryKey: ['opportunities', page, apiFilters],
    queryFn: () => opportunitiesApi.list(page, 500, apiFilters),
  });
  const opps = response?.data ?? [];
  const totalPages = response?.totalPages ?? 1;
  const { data: customFields = [] } = useQuery({ queryKey: ['fieldDefs', 'opportunity'], queryFn: () => fieldDefsApi.list('opportunity') });

  const formFields = [...builtInFields, ...customFields.filter((f) => f.isCustom)];

  const createMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const { name, accountId, amount, stage, closeDate, ...rest } = data;
      return opportunitiesApi.create({ name: name as string, accountId: accountId as string, amount: amount != null ? String(amount) : null, stage: stage as string, closeDate: (closeDate as string) || null, customFields: rest });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['opportunities'] }); setShowModal(false); setFormValues({}); toast.success('Opportunity created'); },
    onError: () => toast.error('Failed to create opportunity'),
  });

  const handleSave = () => {
    const errs: Record<string, string> = {};
    formFields.forEach((f) => { if (f.required && !formValues[f.fieldName]) errs[f.fieldName] = 'Required'; });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    createMut.mutate(formValues);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'accountName', label: 'Account', render: (_: unknown, r: Record<string, unknown>) => r.accountName && r.accountId ? (
      <Link to={`/accounts/${r.accountId}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 no-underline">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
        {String(r.accountName)}
      </Link>
    ) : '—' },
    { key: 'amount', label: 'Amount', render: (v: unknown) => v ? `$${Number(v).toLocaleString()}` : '—' },
    { key: 'stage', label: 'Stage' },
    { key: 'closeDate', label: 'Close Date' },
  ];

  if (isLoading) return <p className="text-gray-400">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-lg bg-white px-6 py-4 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
        <button onClick={() => { setShowModal(true); setFormValues({}); setErrors({}); }} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          New
        </button>
      </div>
      <FilterBar filters={filterConfigs} values={filters} onChange={handleFiltersChange} />
      <RecordTable columns={columns} data={opps as unknown as Record<string, unknown>[]} onRowClick={(r) => navigate(`/opportunities/${r.id}`)} searchable />
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white rounded-b-lg">
        <p className="text-sm text-gray-500">{response?.total?.toLocaleString()} total records</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
          <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
        </div>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Opportunity" footer={
        <>
          <button onClick={() => setShowModal(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Cancel</button>
          <button onClick={handleSave} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Save</button>
        </>
      }>
        <RecordForm fields={formFields} values={formValues} onChange={(k, v) => setFormValues((p) => ({ ...p, [k]: v }))} errors={errors} />
      </Modal>
    </div>
  );
}
