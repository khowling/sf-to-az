import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldDefsApi, pageLayoutsApi, testDataApi } from '../api/client';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import type { ObjectType, FieldDefinition } from '../types';

const objectTypes: ObjectType[] = ['account', 'contact', 'opportunity'];

export default function Settings() {
  const toast = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'fields' | 'data'>('fields');
  const [activeObjectTab, setActiveObjectTab] = useState<ObjectType>('account');
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fieldForm, setFieldForm] = useState({ fieldName: '', label: '', fieldType: 'text' as FieldDefinition['fieldType'], required: false, options: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataCounts, setDataCounts] = useState({ accounts: 100000, contacts: 200000, opportunities: 1000000 });
  const [selectedTheme, setSelectedTheme] = useState('Mixed (All Industries)');

  const { data: themes = [] } = useQuery({ queryKey: ['testDataThemes'], queryFn: testDataApi.themes });

  const { data: fields = [] } = useQuery({ queryKey: ['fieldDefs', activeObjectTab], queryFn: () => fieldDefsApi.list(activeObjectTab) });
  const { data: layout } = useQuery({ queryKey: ['pageLayout', activeObjectTab], queryFn: () => pageLayoutsApi.get(activeObjectTab) });

  const layoutFields = layout?.sections?.[0]?.fields ?? fields.map((f) => f.fieldName);

  const createFieldMut = useMutation({
    mutationFn: () => fieldDefsApi.create({
      objectType: activeObjectTab,
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
    mutationFn: (fieldNames: string[]) => pageLayoutsApi.update(activeObjectTab, [{ title: 'Details', columns: 2, fields: fieldNames }]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pageLayout'] }); toast.success('Layout updated'); },
    onError: () => toast.error('Failed to update layout'),
  });

  const handleGenerateTestData = async () => {
    if (!confirm(`This will generate ${dataCounts.accounts.toLocaleString()} accounts, ${dataCounts.contacts.toLocaleString()} contacts, and ${dataCounts.opportunities.toLocaleString()} opportunities. This may take several minutes. Continue?`)) {
      return;
    }
    
    setIsGenerating(true);
    try {
      const result = await testDataApi.generate({ ...dataCounts, theme: selectedTheme });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success(`Test data generated: ${result.stats.accounts.toLocaleString()} accounts, ${result.stats.contacts.toLocaleString()} contacts, ${result.stats.opportunities.toLocaleString()} opportunities in ${result.stats.durationSeconds}s`);
    } catch (error) {
      toast.error(`Failed to generate test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

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

      {/* Main tabs */}
      <div>
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            <button onClick={() => setActiveTab('fields')} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'fields' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Field Definitions &amp; Layouts</button>
            <button onClick={() => setActiveTab('data')} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'data' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Test Data Generation</button>
          </nav>
        </div>

        <div>
          {activeTab === 'fields' && (
            <>
              <div className="border-b border-gray-200 mb-4">
                <nav className="flex gap-4">
                  {objectTypes.map((t) => (
                    <button key={t} onClick={() => setActiveObjectTab(t)} className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeObjectTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t}</button>
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
                    {fields.length === 0 && <div className="px-6 py-4 text-sm text-gray-400">No fields defined</div>}
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
                    {layoutFields.length === 0 && <div className="px-6 py-4 text-sm text-gray-400">No fields in layout</div>}
                  </div>
                  {fieldsNotInLayout.length > 0 && (
                    <div className="border-t border-gray-200 px-6 py-4">
                      <p className="text-xs text-gray-500 mb-2">Available fields:</p>
                      <div className="flex flex-wrap gap-2">
                        {fieldsNotInLayout.map((f) => (
                          <button key={f.fieldName} onClick={() => addToLayout(f.fieldName)} className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 focus:outline-none transition-colors">+ {f.label}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'data' && (
            <div className="mt-4">
              <div className="rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    <h2 className="text-base font-semibold text-gray-900">AI-Powered Test Data Generator</h2>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Generate realistic, industry-themed CRM data using AI-curated seed datasets</p>
                </div>
                <div className="px-6 py-6">
                  {/* Industry Theme */}
                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z"/></svg>
                      Industry Theme
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">Choose a theme to generate data with industry-specific company names, deals, and terminology</p>
                    <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)} className="w-full rounded-md border border-purple-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500">
                      {themes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Record counts */}
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Number of records to generate:</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Accounts</label>
                        <input type="number" min={1} max={500000} value={dataCounts.accounts} onChange={(e) => setDataCounts(p => ({ ...p, accounts: parseInt(e.target.value) || 0 }))} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Contacts</label>
                        <input type="number" min={1} max={1000000} value={dataCounts.contacts} onChange={(e) => setDataCounts(p => ({ ...p, contacts: parseInt(e.target.value) || 0 }))} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Opportunities</label>
                        <input type="number" min={1} max={5000000} value={dataCounts.opportunities} onChange={(e) => setDataCounts(p => ({ ...p, opportunities: parseInt(e.target.value) || 0 }))} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6 flex items-start gap-3" role="alert">
                    <svg className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
                    <p className="text-sm text-amber-800">This process may take several minutes to complete. Please do not close this page.</p>
                  </div>
                  <div className="text-center">
                    <button onClick={handleGenerateTestData} disabled={isGenerating} className="inline-flex items-center justify-center min-w-[12rem] rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Generating...
                        </>
                      ) : 'Generate Test Data'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
