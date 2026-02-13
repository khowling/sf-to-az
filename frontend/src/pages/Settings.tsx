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
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Settings</h1>

      {/* Object type tabs */}
      <div className="flex gap-2 mb-6">
        {objectTypes.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
              activeTab === t ? 'bg-[#0176d3] text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field Definitions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Field Definitions</h2>
            <button onClick={() => { setShowFieldModal(true); resetForm(); }} className="text-sm text-[#0176d3] hover:underline">Add Field</button>
          </div>
          <div className="divide-y divide-gray-200">
            {fields.map((f) => (
              <div key={f.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{f.label}</p>
                  <p className="text-xs text-gray-500">{f.fieldName} · {f.fieldType}{f.required ? ' · required' : ''}</p>
                </div>
                {f.isCustom && (
                  <button onClick={() => { if (confirm(`Delete field "${f.label}"?`)) deleteFieldMut.mutate(f.id); }} className="text-xs text-red-500 hover:underline">Delete</button>
                )}
              </div>
            ))}
            {fields.length === 0 && <p className="px-6 py-4 text-sm text-gray-400">No fields defined</p>}
          </div>
        </div>

        {/* Page Layout */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Page Layout</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {layoutFields.map((fn, i) => {
              const fd = fields.find((f) => f.fieldName === fn);
              return (
                <div key={fn} className="px-6 py-2 flex items-center justify-between">
                  <span className="text-sm text-gray-700">{fd?.label ?? fn}</span>
                  <div className="flex gap-1">
                    <button onClick={() => moveField(i, -1)} disabled={i === 0} className="px-2 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50">↑</button>
                    <button onClick={() => moveField(i, 1)} disabled={i === layoutFields.length - 1} className="px-2 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50">↓</button>
                    <button onClick={() => removeFromLayout(fn)} className="px-2 py-1 text-xs border rounded text-red-500 hover:bg-red-50">✕</button>
                  </div>
                </div>
              );
            })}
            {layoutFields.length === 0 && <p className="px-6 py-4 text-sm text-gray-400">No fields in layout</p>}
          </div>
          {fieldsNotInLayout.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Available fields:</p>
              <div className="flex flex-wrap gap-2">
                {fieldsNotInLayout.map((f) => (
                  <button key={f.fieldName} onClick={() => addToLayout(f.fieldName)} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-blue-100">
                    + {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Field Modal */}
      <Modal isOpen={showFieldModal} onClose={() => setShowFieldModal(false)} title="Add Custom Field" footer={
        <>
          <button onClick={() => setShowFieldModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreateField} className="px-4 py-2 text-sm bg-[#0176d3] text-white rounded-md hover:bg-[#014486]">Create</button>
        </>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Field Name</label>
            <input type="text" value={fieldForm.fieldName} onChange={(e) => setFieldForm((p) => ({ ...p, fieldName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3]" placeholder="e.g. customScore" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
            <input type="text" value={fieldForm.label} onChange={(e) => setFieldForm((p) => ({ ...p, label: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3]" placeholder="e.g. Custom Score" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Field Type</label>
            <select value={fieldForm.fieldType} onChange={(e) => setFieldForm((p) => ({ ...p, fieldType: e.target.value as FieldDefinition['fieldType'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3]">
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="picklist">Picklist</option>
              <option value="boolean">Boolean</option>
            </select>
          </div>
          {fieldForm.fieldType === 'picklist' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Options (comma-separated)</label>
              <input type="text" value={fieldForm.options} onChange={(e) => setFieldForm((p) => ({ ...p, options: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3]" placeholder="e.g. Option A, Option B, Option C" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={fieldForm.required} onChange={(e) => setFieldForm((p) => ({ ...p, required: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-[#0176d3] focus:ring-[#0176d3]" />
            <label className="text-sm text-gray-700">Required</label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
