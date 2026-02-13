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
  const { data: contacts = [] } = useQuery({ queryKey: ['contacts'], queryFn: contactsApi.list });
  const { data: opps = [] } = useQuery({ queryKey: ['opportunities'], queryFn: opportunitiesApi.list });

  const allFields = [...builtInFields, ...customFields.filter((f) => f.isCustom)];
  const relatedContacts = contacts.filter((c) => c.accountId === id);
  const relatedOpps = opps.filter((o) => o.accountId === id);

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

  if (isLoading || !account) return <p className="slds-text-color_weak">Loading…</p>;

  const highlights = [
    { label: 'Phone', value: account.phone },
    { label: 'Website', value: account.website },
    { label: 'Industry', value: account.industry },
  ];

  const contactFieldsNoAcct = contactBuiltIn.filter((f) => f.fieldName !== 'accountId');

  return (
    <div>
      {/* Header */}
      <div className="slds-page-header slds-m-bottom_medium">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <div className="slds-media">
              <div className="slds-media__body">
                <div className="slds-page-header__name">
                  <div className="slds-page-header__name-title">
                    <span className="slds-page-header__name-meta">Account</span>
                    <h1><span className="slds-page-header__title slds-truncate">{account.name}</span></h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="slds-page-header__col-actions">
            <div className="slds-page-header__controls">
              <button onClick={startEdit} className="slds-button slds-button_neutral">Edit</button>
              <button onClick={() => { if (confirm('Delete this account?')) deleteMut.mutate(); }} className="slds-button slds-button_destructive">Delete</button>
            </div>
          </div>
        </div>
        <div className="slds-page-header__row slds-page-header__row_gutters">
          <div className="slds-page-header__col-details">
            <ul className="slds-page-header__detail-row">
              {highlights.map((h) => (
                <li key={h.label} className="slds-page-header__detail-block">
                  <p className="slds-text-title slds-truncate">{h.label}</p>
                  <p className="slds-text-body_regular slds-truncate">{h.value || '—'}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="slds-tabs_default">
        <ul className="slds-tabs_default__nav" role="tablist">
          <li className={`slds-tabs_default__item ${tab === 'details' ? 'slds-is-active' : ''}`} role="presentation">
            <a className="slds-tabs_default__link" role="tab" onClick={() => setTab('details')}>Details</a>
          </li>
          <li className={`slds-tabs_default__item ${tab === 'related' ? 'slds-is-active' : ''}`} role="presentation">
            <a className="slds-tabs_default__link" role="tab" onClick={() => setTab('related')}>Related</a>
          </li>
        </ul>

        {tab === 'details' && (
          <div className="slds-tabs_default__content slds-show">
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
                      const val = ['name', 'industry', 'phone', 'website'].includes(f.fieldName)
                        ? (account as unknown as Record<string, unknown>)[f.fieldName]
                        : account.customFields?.[f.fieldName];
                      return (
                        <div key={f.fieldName} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-p-around_xx-small">
                          <div className="slds-form-element slds-form-element_readonly">
                            <span className="slds-form-element__label">{f.label}</span>
                            <div className="slds-form-element__control">
                              {f.fieldType === 'boolean' ? (
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
        )}

        {tab === 'related' && (
          <div className="slds-tabs_default__content slds-show">
            <div className="slds-card slds-m-bottom_medium">
              <div className="slds-card__header slds-grid">
                <header className="slds-media slds-media_center slds-has-flexi-truncate">
                  <div className="slds-media__body">
                    <h2 className="slds-card__header-title">Contacts ({relatedContacts.length})</h2>
                  </div>
                </header>
                <div className="slds-no-flex">
                  <button onClick={() => { setShowContactModal(true); setContactForm({}); setContactErrors({}); }} className="slds-button slds-button_neutral">New Contact</button>
                </div>
              </div>
              <div className="slds-card__body">
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
            </div>
            <div className="slds-card">
              <div className="slds-card__header slds-grid">
                <header className="slds-media slds-media_center slds-has-flexi-truncate">
                  <div className="slds-media__body">
                    <h2 className="slds-card__header-title">Opportunities ({relatedOpps.length})</h2>
                  </div>
                </header>
                <div className="slds-no-flex">
                  <button onClick={() => { setShowOppModal(true); setOppForm({}); setOppErrors({}); }} className="slds-button slds-button_neutral">New Opportunity</button>
                </div>
              </div>
              <div className="slds-card__body">
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
          </div>
        )}
      </div>

      {/* New Contact Modal */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title="New Contact" footer={
        <>
          <button onClick={() => setShowContactModal(false)} className="slds-button slds-button_neutral">Cancel</button>
          <button onClick={handleSaveContact} className="slds-button slds-button_brand">Save</button>
        </>
      }>
        <RecordForm fields={contactFieldsNoAcct} values={contactForm} onChange={(k, v) => setContactForm((p) => ({ ...p, [k]: v }))} errors={contactErrors} />
      </Modal>

      {/* New Opportunity Modal */}
      <Modal isOpen={showOppModal} onClose={() => setShowOppModal(false)} title="New Opportunity" footer={
        <>
          <button onClick={() => setShowOppModal(false)} className="slds-button slds-button_neutral">Cancel</button>
          <button onClick={handleSaveOpp} className="slds-button slds-button_brand">Save</button>
        </>
      }>
        <RecordForm fields={oppBuiltIn.filter((f) => f.fieldName !== 'accountId')} values={oppForm} onChange={(k, v) => setOppForm((p) => ({ ...p, [k]: v }))} errors={oppErrors} />
      </Modal>
    </div>
  );
}
