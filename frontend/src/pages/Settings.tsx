import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldDefsApi, pageLayoutsApi } from '../api/client';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import type { ObjectType, FieldDefinition } from '../types';

const objectTypes: ObjectType[] = ['account', 'contact', 'opportunity'];

export default function Settings() {
  const toast = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<ObjectType>('account');
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fieldForm, setFieldForm] = useState({ fieldName: '', label: '', fieldType: 'text' as FieldDefinition['fieldType'], required: false, options: '' });

  const { data: fields = [] } = useQuery({ queryKey: ['fieldDefs', activeTab], queryFn: () => fieldDefsApi.list(activeTab) });
  const { data: layout } = useQuery({ queryKey: ['pageLayout', activeTab], queryFn: () => pageLayoutsApi.get(activeTab) });

  const layoutFields = layout?.sections?.[0]?.fields ?? fields.map((f) => f.fieldName);

  const createFieldMut = useMutation({
    mutationFn: () => fieldDefsApi.create({
      objectType: activeTab,
      fieldName: fieldForm.fieldName,
      label: fieldForm.label,
      fieldType: fieldForm.fieldType,
      required: fieldForm.required,
      options: fieldForm.fieldType === 'picklist' ? fieldForm.options.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fieldDefs'] }); setShowFieldModal(false); resetForm(); toast.success('Field created'); },
    onError: () => toast.error('Failed to create field'),
  });

  const deleteFieldMut = useMutation({
    mutationFn: (id: string) => fieldDefsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fieldDefs'] }); toast.success('Field deleted'); },
    onError: () => toast.error('Failed to delete field'),
  });

  const updateLayoutMut = useMutation({
    mutationFn: (fieldNames: string[]) => pageLayoutsApi.update(activeTab, [{ title: 'Details', columns: 2, fields: fieldNames }]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pageLayout'] }); toast.success('Layout updated'); },
    onError: () => toast.error('Failed to update layout'),
  });

  const resetForm = () => setFieldForm({ fieldName: '', label: '', fieldType: 'text', required: false, options: '' });

  const handleCreateField = () => {
    if (!fieldForm.fieldName || !fieldForm.label) { toast.error('Name and label are required'); return; }
    createFieldMut.mutate();
  };

  const moveField = (index: number, dir: -1 | 1) => {
    const arr = [...layoutFields];
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[index], arr[newIdx]] = [arr[newIdx], arr[index]];
    updateLayoutMut.mutate(arr);
  };

  const removeFromLayout = (fieldName: string) => {
    updateLayoutMut.mutate(layoutFields.filter((f) => f !== fieldName));
  };

  const addToLayout = (fieldName: string) => {
    if (!layoutFields.includes(fieldName)) {
      updateLayoutMut.mutate([...layoutFields, fieldName]);
    }
  };

  const fieldsNotInLayout = fields.filter((f) => !layoutFields.includes(f.fieldName));

  return (
    <div>
      <div className="slds-page-header slds-m-bottom_medium">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <h1 className="slds-page-header__title">Settings</h1>
          </div>
        </div>
      </div>

      {/* Object type tabs */}
      <div className="slds-tabs_default">
        <ul className="slds-tabs_default__nav" role="tablist">
          {objectTypes.map((t) => (
            <li key={t} className={`slds-tabs_default__item ${activeTab === t ? 'slds-is-active' : ''}`} role="presentation">
              <a className="slds-tabs_default__link" role="tab" onClick={() => setActiveTab(t)} style={{ textTransform: 'capitalize' }}>{t}</a>
            </li>
          ))}
        </ul>

        <div className="slds-tabs_default__content slds-show">
          <div className="slds-grid slds-wrap slds-gutters">
            {/* Field Definitions */}
            <div className="slds-col slds-size_1-of-1 slds-large-size_1-of-2">
              <div className="slds-card">
                <div className="slds-card__header slds-grid">
                  <header className="slds-media slds-media_center slds-has-flexi-truncate">
                    <div className="slds-media__body">
                      <h2 className="slds-card__header-title">Field Definitions</h2>
                    </div>
                  </header>
                  <div className="slds-no-flex">
                    <button onClick={() => { setShowFieldModal(true); resetForm(); }} className="slds-button slds-button_neutral">Add Field</button>
                  </div>
                </div>
                <div className="slds-card__body">
                  <table className="slds-table slds-table_bordered slds-table_cell-buffer slds-no-row-hover">
                    <tbody>
                      {fields.map((f) => (
                        <tr key={f.id}>
                          <td>
                            <p className="slds-text-body_regular" style={{ fontWeight: 500 }}>{f.label}</p>
                            <p className="slds-text-body_small slds-text-color_weak">{f.fieldName} · {f.fieldType}{f.required ? ' · required' : ''}</p>
                          </td>
                          <td style={{ width: '4rem', textAlign: 'right' }}>
                            {f.isCustom && (
                              <button onClick={() => { if (confirm(`Delete field "${f.label}"?`)) deleteFieldMut.mutate(f.id); }} className="slds-button slds-button_destructive slds-button_stretch" style={{ fontSize: '0.75rem' }}>Delete</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {fields.length === 0 && (
                        <tr><td className="slds-text-color_weak">No fields defined</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Page Layout */}
            <div className="slds-col slds-size_1-of-1 slds-large-size_1-of-2">
              <div className="slds-card">
                <div className="slds-card__header slds-grid">
                  <header className="slds-media slds-media_center slds-has-flexi-truncate">
                    <div className="slds-media__body">
                      <h2 className="slds-card__header-title">Page Layout</h2>
                    </div>
                  </header>
                </div>
                <div className="slds-card__body">
                  <table className="slds-table slds-table_bordered slds-table_cell-buffer slds-no-row-hover">
                    <tbody>
                      {layoutFields.map((fn, i) => {
                        const fd = fields.find((f) => f.fieldName === fn);
                        return (
                          <tr key={fn}>
                            <td><span className="slds-text-body_regular">{fd?.label ?? fn}</span></td>
                            <td style={{ width: '8rem', textAlign: 'right' }}>
                              <div className="slds-button-group" role="group">
                                <button onClick={() => moveField(i, -1)} disabled={i === 0} className="slds-button slds-button_icon slds-button_icon-border" title="Move up">
                                  <svg className="slds-button__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z" /></svg>
                                </button>
                                <button onClick={() => moveField(i, 1)} disabled={i === layoutFields.length - 1} className="slds-button slds-button_icon slds-button_icon-border" title="Move down">
                                  <svg className="slds-button__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
                                </button>
                                <button onClick={() => removeFromLayout(fn)} className="slds-button slds-button_icon slds-button_icon-border" title="Remove" style={{ color: '#ea001e' }}>
                                  <svg className="slds-button__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.36 5.64a1 1 0 00-1.41 0L12 10.59 7.05 5.64a1 1 0 10-1.41 1.41L10.59 12l-4.95 4.95a1 1 0 101.41 1.41L12 13.41l4.95 4.95a1 1 0 001.41-1.41L13.41 12l4.95-4.95a1 1 0 000-1.41z" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {layoutFields.length === 0 && (
                        <tr><td className="slds-text-color_weak">No fields in layout</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {fieldsNotInLayout.length > 0 && (
                  <div className="slds-card__footer">
                    <p className="slds-text-body_small slds-text-color_weak slds-m-bottom_xx-small">Available fields:</p>
                    <div className="slds-pill_container">
                      {fieldsNotInLayout.map((f) => (
                        <span key={f.fieldName} className="slds-pill slds-pill_link" onClick={() => addToLayout(f.fieldName)} style={{ cursor: 'pointer' }}>
                          <span className="slds-pill__label">+ {f.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Field Modal */}
      <Modal isOpen={showFieldModal} onClose={() => setShowFieldModal(false)} title="Add Custom Field" footer={
        <>
          <button onClick={() => setShowFieldModal(false)} className="slds-button slds-button_neutral">Cancel</button>
          <button onClick={handleCreateField} className="slds-button slds-button_brand">Create</button>
        </>
      }>
        <div className="slds-form slds-form_stacked">
          <div className="slds-form-element slds-m-bottom_small">
            <label className="slds-form-element__label">Field Name</label>
            <div className="slds-form-element__control">
              <input type="text" value={fieldForm.fieldName} onChange={(e) => setFieldForm((p) => ({ ...p, fieldName: e.target.value }))} className="slds-input" placeholder="e.g. customScore" />
            </div>
          </div>
          <div className="slds-form-element slds-m-bottom_small">
            <label className="slds-form-element__label">Label</label>
            <div className="slds-form-element__control">
              <input type="text" value={fieldForm.label} onChange={(e) => setFieldForm((p) => ({ ...p, label: e.target.value }))} className="slds-input" placeholder="e.g. Custom Score" />
            </div>
          </div>
          <div className="slds-form-element slds-m-bottom_small">
            <label className="slds-form-element__label">Field Type</label>
            <div className="slds-form-element__control">
              <div className="slds-select_container">
                <select value={fieldForm.fieldType} onChange={(e) => setFieldForm((p) => ({ ...p, fieldType: e.target.value as FieldDefinition['fieldType'] }))} className="slds-select">
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="picklist">Picklist</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>
            </div>
          </div>
          {fieldForm.fieldType === 'picklist' && (
            <div className="slds-form-element slds-m-bottom_small">
              <label className="slds-form-element__label">Options (comma-separated)</label>
              <div className="slds-form-element__control">
                <input type="text" value={fieldForm.options} onChange={(e) => setFieldForm((p) => ({ ...p, options: e.target.value }))} className="slds-input" placeholder="e.g. Option A, Option B, Option C" />
              </div>
            </div>
          )}
          <div className="slds-form-element">
            <div className="slds-form-element__control">
              <div className="slds-checkbox">
                <input type="checkbox" id="req-checkbox" checked={fieldForm.required} onChange={(e) => setFieldForm((p) => ({ ...p, required: e.target.checked }))} />
                <label className="slds-checkbox__label" htmlFor="req-checkbox">
                  <span className="slds-checkbox_faux"></span>
                  <span className="slds-form-element__label">Required</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
