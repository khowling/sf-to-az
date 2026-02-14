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
      <div className="mb-6 rounded-lg bg-white px-6 py-4 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Object type tabs */}
      <div>
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex gap-4">
            {objectTypes.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >{t}</button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Field Definitions */}
          <div className="rounded-lg bg-white shadow-sm border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Field Definitions</h2>
              <button onClick={() => { setShowFieldModal(true); resetForm(); }} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Add Field</button>
            </div>
            <div className="divide-y divide-gray-100">
              {fields.map((f) => (
                <div key={f.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{f.label}</p>
                    <p className="text-xs text-gray-500">{f.fieldName} · {f.fieldType}{f.required ? ' · required' : ''}</p>
                  </div>
                  <div>
                    {f.isCustom && (
                      <button onClick={() => { if (confirm(`Delete field "${f.label}"?`)) deleteFieldMut.mutate(f.id); }} className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">Delete</button>
                    )}
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <div className="px-6 py-4 text-sm text-gray-400">No fields defined</div>
              )}
            </div>
          </div>

          {/* Page Layout */}
          <div className="rounded-lg bg-white shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Page Layout</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {layoutFields.map((fn, i) => {
                const fd = fields.find((f) => f.fieldName === fn);
                return (
                  <div key={fn} className="flex items-center justify-between px-6 py-3">
                    <span className="text-sm text-gray-900">{fd?.label ?? fn}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveField(i, -1)} disabled={i === 0} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 focus:outline-none" title="Move up">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z" /></svg>
                      </button>
                      <button onClick={() => moveField(i, 1)} disabled={i === layoutFields.length - 1} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 focus:outline-none" title="Move down">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
                      </button>
                      <button onClick={() => removeFromLayout(fn)} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 focus:outline-none" title="Remove">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.36 5.64a1 1 0 00-1.41 0L12 10.59 7.05 5.64a1 1 0 10-1.41 1.41L10.59 12l-4.95 4.95a1 1 0 101.41 1.41L12 13.41l4.95 4.95a1 1 0 001.41-1.41L13.41 12l4.95-4.95a1 1 0 000-1.41z" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
              {layoutFields.length === 0 && (
                <div className="px-6 py-4 text-sm text-gray-400">No fields in layout</div>
              )}
            </div>
            {fieldsNotInLayout.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-4">
                <p className="text-xs text-gray-500 mb-2">Available fields:</p>
                <div className="flex flex-wrap gap-2">
                  {fieldsNotInLayout.map((f) => (
                    <button key={f.fieldName} onClick={() => addToLayout(f.fieldName)} className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 focus:outline-none transition-colors">
                      + {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Field Modal */}
      <Modal isOpen={showFieldModal} onClose={() => setShowFieldModal(false)} title="Add Custom Field" footer={
        <>
          <button onClick={() => setShowFieldModal(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Cancel</button>
          <button onClick={handleCreateField} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Create</button>
        </>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
            <input type="text" value={fieldForm.fieldName} onChange={(e) => setFieldForm((p) => ({ ...p, fieldName: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. customScore" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input type="text" value={fieldForm.label} onChange={(e) => setFieldForm((p) => ({ ...p, label: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Custom Score" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
            <select value={fieldForm.fieldType} onChange={(e) => setFieldForm((p) => ({ ...p, fieldType: e.target.value as FieldDefinition['fieldType'] }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="picklist">Picklist</option>
              <option value="boolean">Boolean</option>
            </select>
          </div>
          {fieldForm.fieldType === 'picklist' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Options (comma-separated)</label>
              <input type="text" value={fieldForm.options} onChange={(e) => setFieldForm((p) => ({ ...p, options: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Option A, Option B, Option C" />
            </div>
          )}
          <div>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" id="req-checkbox" checked={fieldForm.required} onChange={(e) => setFieldForm((p) => ({ ...p, required: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium text-gray-700">Required</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
