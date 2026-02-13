import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { opportunitiesApi, fieldDefsApi } from '../api/client';
import RecordTable from '../components/RecordTable';
import Modal from '../components/Modal';
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

export default function OpportunityList() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: opps = [], isLoading } = useQuery({ queryKey: ['opportunities'], queryFn: opportunitiesApi.list });
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
    { key: 'accountName', label: 'Account' },
    { key: 'amount', label: 'Amount', render: (v: unknown) => v ? `$${Number(v).toLocaleString()}` : '—' },
    { key: 'stage', label: 'Stage' },
    { key: 'closeDate', label: 'Close Date' },
  ];

  if (isLoading) return <p className="slds-text-color_weak">Loading…</p>;

  return (
    <div>
      <div className="slds-page-header slds-m-bottom_medium">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <h1 className="slds-page-header__title">Opportunities</h1>
          </div>
          <div className="slds-page-header__col-actions">
            <div className="slds-page-header__controls">
              <button onClick={() => { setShowModal(true); setFormValues({}); setErrors({}); }} className="slds-button slds-button_brand">
                New
              </button>
            </div>
          </div>
        </div>
      </div>
      <RecordTable columns={columns} data={opps as unknown as Record<string, unknown>[]} onRowClick={(r) => navigate(`/opportunities/${r.id}`)} searchable />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Opportunity" footer={
        <>
          <button onClick={() => setShowModal(false)} className="slds-button slds-button_neutral">Cancel</button>
          <button onClick={handleSave} className="slds-button slds-button_brand">Save</button>
        </>
      }>
        <RecordForm fields={formFields} values={formValues} onChange={(k, v) => setFormValues((p) => ({ ...p, [k]: v }))} errors={errors} />
      </Modal>
    </div>
  );
}
