import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { accountsApi, fieldDefsApi } from '../api/client';
import RecordTable from '../components/RecordTable';
import Modal from '../components/Modal';
import RecordForm from '../components/RecordForm';
import { useToast } from '../components/Toast';
import type { FieldDefinition } from '../types';

const builtInFields: FieldDefinition[] = [
  { id: '_name', objectType: 'account', fieldName: 'name', label: 'Name', fieldType: 'text', required: true, isCustom: false, options: [], validations: {}, sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: '_industry', objectType: 'account', fieldName: 'industry', label: 'Industry', fieldType: 'text', required: false, isCustom: false, options: [], validations: {}, sortOrder: 1, createdAt: '', updatedAt: '' },
  { id: '_phone', objectType: 'account', fieldName: 'phone', label: 'Phone', fieldType: 'text', required: false, isCustom: false, options: [], validations: {}, sortOrder: 2, createdAt: '', updatedAt: '' },
  { id: '_website', objectType: 'account', fieldName: 'website', label: 'Website', fieldType: 'text', required: false, isCustom: false, options: [], validations: {}, sortOrder: 3, createdAt: '', updatedAt: '' },
];

export default function AccountList() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: accounts = [], isLoading } = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });
  const { data: customFields = [] } = useQuery({ queryKey: ['fieldDefs', 'account'], queryFn: () => fieldDefsApi.list('account') });

  const formFields = [...builtInFields, ...customFields.filter((f) => f.isCustom)];

  const createMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const { name, industry, phone, website, ...rest } = data;
      return accountsApi.create({ name: name as string, industry: industry as string, phone: phone as string, website: website as string, customFields: rest });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); setShowModal(false); setFormValues({}); toast.success('Account created'); },
    onError: () => toast.error('Failed to create account'),
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
    { key: 'industry', label: 'Industry' },
    { key: 'phone', label: 'Phone' },
    { key: 'website', label: 'Website' },
  ];

  if (isLoading) return <p className="slds-text-color_weak">Loading…</p>;

  return (
    <div>
      <div className="slds-page-header slds-m-bottom_medium">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <h1 className="slds-page-header__title">Accounts</h1>
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
      <RecordTable columns={columns} data={accounts as unknown as Record<string, unknown>[]} onRowClick={(r) => navigate(`/accounts/${r.id}`)} searchable />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Account" footer={
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
