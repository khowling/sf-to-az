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

  if (isLoading || !contact) return <p className="slds-text-color_weak">Loading…</p>;

  const highlights = [
    { label: 'Email', value: contact.email },
    { label: 'Phone', value: contact.phone },
    { label: 'Account', value: linkedAccount?.name, link: linkedAccount ? `/accounts/${linkedAccount.id}` : undefined },
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
                    <span className="slds-page-header__name-meta">Contact</span>
                    <h1><span className="slds-page-header__title slds-truncate">{contact.firstName} {contact.lastName}</span></h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="slds-page-header__col-actions">
            <div className="slds-page-header__controls">
              <button onClick={startEdit} className="slds-button slds-button_neutral">Edit</button>
              <button onClick={() => { if (confirm('Delete this contact?')) deleteMut.mutate(); }} className="slds-button slds-button_destructive">Delete</button>
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
                  ) : (
                    <p className="slds-text-body_regular slds-truncate">{h.value || '—'}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
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
                if (['firstName', 'lastName', 'email', 'phone', 'accountId'].includes(f.fieldName)) {
                  val = (contact as unknown as Record<string, unknown>)[f.fieldName];
                  if (f.fieldName === 'accountId') val = linkedAccount?.name ?? val;
                } else {
                  val = contact.customFields?.[f.fieldName];
                }
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
  );
}
