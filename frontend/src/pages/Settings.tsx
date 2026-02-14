import { useState, useCallback, type DragEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldDefsApi, pageLayoutsApi, testDataApi } from '../api/client';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import type { ObjectType, FieldDefinition, PageLayoutSection } from '../types';

const objectTypes: { key: ObjectType; label: string; icon: React.ReactNode }[] = [
  { key: 'account', label: 'Account', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg> },
  { key: 'contact', label: 'Contact', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> },
  { key: 'opportunity', label: 'Opportunity', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg> },
];

const sidebarItems: { key: string; label: string; icon: React.ReactNode; type: 'object' | 'tool' }[] = [
  ...objectTypes.map(o => ({ key: o.key, label: o.label, icon: o.icon, type: 'object' as const })),
  { key: 'test-data', label: 'Test Data', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>, type: 'tool' },
];

export default function Settings() {
  const toast = useToast();
  const qc = useQueryClient();
  const [activeSidebar, setActiveSidebar] = useState<string>('account');
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionForm, setSectionForm] = useState({ title: '', columns: 2 });
  const [fieldForm, setFieldForm] = useState({ fieldName: '', label: '', fieldType: 'text' as FieldDefinition['fieldType'], required: false, options: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataCounts, setDataCounts] = useState({ accounts: 100000, contacts: 200000, opportunities: 1000000 });
  const [selectedTheme, setSelectedTheme] = useState('Mixed (All Industries)');
  const [dragData, setDragData] = useState<{ fieldName: string; fromSection?: number } | null>(null);

  const isObjectView = objectTypes.some(o => o.key === activeSidebar);
  const activeObjectType = isObjectView ? activeSidebar as ObjectType : 'account';

  const { data: themes = [] } = useQuery({ queryKey: ['testDataThemes'], queryFn: testDataApi.themes });
  const { data: fields = [] } = useQuery({ queryKey: ['fieldDefs', activeObjectType], queryFn: () => fieldDefsApi.list(activeObjectType), enabled: isObjectView });
  const { data: layout } = useQuery({ queryKey: ['pageLayout', activeObjectType], queryFn: () => pageLayoutsApi.get(activeObjectType), enabled: isObjectView });

  const sections: PageLayoutSection[] = layout?.sections?.length
    ? layout.sections
    : [{ title: 'Details', columns: 2, fields: fields.map(f => f.fieldName) }];

  const allLayoutFields = sections.flatMap(s => s.fields);
  const fieldsNotInLayout = fields.filter(f => !allLayoutFields.includes(f.fieldName));

  const createFieldMut = useMutation({
    mutationFn: () => fieldDefsApi.create({
      objectType: activeObjectType,
      fieldName: fieldForm.fieldName,
      label: fieldForm.label,
      fieldType: fieldForm.fieldType,
      required: fieldForm.required,
      options: fieldForm.fieldType === 'picklist' ? fieldForm.options.split(',').map(s => s.trim()).filter(Boolean) : [],
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
    mutationFn: (newSections: PageLayoutSection[]) => pageLayoutsApi.update(activeObjectType, newSections),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pageLayout'] }); toast.success('Layout updated'); },
    onError: () => toast.error('Failed to update layout'),
  });

  const handleGenerateTestData = async () => {
    if (!confirm(`This will generate ${dataCounts.accounts.toLocaleString()} accounts, ${dataCounts.contacts.toLocaleString()} contacts, and ${dataCounts.opportunities.toLocaleString()} opportunities. This may take several minutes. Continue?`)) return;
    setIsGenerating(true);
    try {
      const result = await testDataApi.generate({ ...dataCounts, theme: selectedTheme });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success(`Generated ${result.stats.accounts.toLocaleString()} accounts, ${result.stats.contacts.toLocaleString()} contacts, ${result.stats.opportunities.toLocaleString()} opportunities in ${result.stats.durationSeconds}s`);
    } catch (error) {
      toast.error(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally { setIsGenerating(false); }
  };

  const resetForm = () => setFieldForm({ fieldName: '', label: '', fieldType: 'text', required: false, options: '' });

  const handleCreateField = () => {
    if (!fieldForm.fieldName || !fieldForm.label) { toast.error('Name and label are required'); return; }
    createFieldMut.mutate();
  };

  // Section management
  const addSection = () => {
    if (!sectionForm.title) { toast.error('Section title is required'); return; }
    updateLayoutMut.mutate([...sections, { title: sectionForm.title, columns: sectionForm.columns, fields: [] }]);
    setShowSectionModal(false);
    setSectionForm({ title: '', columns: 2 });
  };

  const deleteSection = (idx: number) => {
    if (!confirm(`Delete section "${sections[idx].title}"?`)) return;
    updateLayoutMut.mutate(sections.filter((_, i) => i !== idx));
  };

  const updateSectionColumns = (idx: number, columns: number) => {
    const updated = sections.map((s, i) => i === idx ? { ...s, columns } : s);
    updateLayoutMut.mutate(updated);
  };

  const removeFieldFromSection = (sectionIdx: number, fieldName: string) => {
    const updated = sections.map((s, i) => i === sectionIdx ? { ...s, fields: s.fields.filter(f => f !== fieldName) } : s);
    updateLayoutMut.mutate(updated);
  };

  const moveFieldInSection = (sectionIdx: number, fieldIdx: number, dir: -1 | 1) => {
    const newIdx = fieldIdx + dir;
    const sectionFields = [...sections[sectionIdx].fields];
    if (newIdx < 0 || newIdx >= sectionFields.length) return;
    [sectionFields[fieldIdx], sectionFields[newIdx]] = [sectionFields[newIdx], sectionFields[fieldIdx]];
    const updated = sections.map((s, i) => i === sectionIdx ? { ...s, fields: sectionFields } : s);
    updateLayoutMut.mutate(updated);
  };

  // Drag and drop
  const handleDragStart = useCallback((fieldName: string, fromSection?: number) => {
    setDragData({ fieldName, fromSection });
  }, []);

  const handleDrop = useCallback((e: DragEvent, toSection: number) => {
    e.preventDefault();
    if (!dragData) return;
    const { fieldName, fromSection } = dragData;
    let updated = [...sections.map(s => ({ ...s, fields: [...s.fields] }))];
    // Remove from source
    if (fromSection !== undefined) {
      updated[fromSection].fields = updated[fromSection].fields.filter(f => f !== fieldName);
    }
    // Add to target if not already there
    if (!updated[toSection].fields.includes(fieldName)) {
      updated[toSection].fields.push(fieldName);
    }
    updateLayoutMut.mutate(updated);
    setDragData(null);
  }, [dragData, sections, updateLayoutMut]);

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); }, []);

  const getFieldLabel = (fieldName: string) => fields.find(f => f.fieldName === fieldName)?.label ?? fieldName;

  return (
    <div>
      <div className="mb-4 rounded-lg bg-white px-6 py-4 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-52 shrink-0">
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Objects</h2>
            </div>
            <nav className="py-1">
              {sidebarItems.filter(i => i.type === 'object').map(item => (
                <button key={item.key} onClick={() => setActiveSidebar(item.key)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${activeSidebar === item.key ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  {item.icon} {item.label}
                </button>
              ))}
            </nav>
            <div className="px-4 py-3 border-t border-b border-gray-200">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tools</h2>
            </div>
            <nav className="py-1">
              {sidebarItems.filter(i => i.type === 'tool').map(item => (
                <button key={item.key} onClick={() => setActiveSidebar(item.key)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${activeSidebar === item.key ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  {item.icon} {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {isObjectView && (
            <div className="space-y-4">
              {/* Field Definitions */}
              <div className="rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-gray-900 capitalize">{activeObjectType} Fields</h2>
                  <button onClick={() => { setShowFieldModal(true); resetForm(); }} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Add Field</button>
                </div>
                <div className="divide-y divide-gray-100">
                  {fields.map(f => (
                    <div key={f.id} className="flex items-center justify-between px-6 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${f.isCustom ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {f.isCustom ? 'Custom' : 'Standard'}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{f.label}</p>
                          <p className="text-xs text-gray-500">{f.fieldName} · {f.fieldType}{f.required ? ' · required' : ''}</p>
                        </div>
                      </div>
                      {f.isCustom && (
                        <button onClick={() => { if (confirm(`Delete field "${f.label}"?`)) deleteFieldMut.mutate(f.id); }} className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700">Delete</button>
                      )}
                    </div>
                  ))}
                  {fields.length === 0 && <div className="px-6 py-4 text-sm text-gray-400">No fields defined</div>}
                </div>
              </div>

              {/* Page Layout */}
              <div className="rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-gray-900">Page Layout</h2>
                  <button onClick={() => { setShowSectionModal(true); setSectionForm({ title: '', columns: 2 }); }} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Add Section</button>
                </div>
                <div className="p-4 space-y-4">
                  {sections.map((section, sIdx) => (
                    <div key={sIdx} className="rounded-lg border border-gray-200 overflow-hidden"
                      onDragOver={handleDragOver} onDrop={e => handleDrop(e, sIdx)}>
                      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500">Columns:</span>
                            {[1, 2].map(n => (
                              <button key={n} onClick={() => updateSectionColumns(sIdx, n)}
                                className={`rounded px-2 py-0.5 text-xs font-medium ${section.columns === n ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                {n}
                              </button>
                            ))}
                          </div>
                          {sections.length > 1 && (
                            <button onClick={() => deleteSection(sIdx)} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600" title="Delete section">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={`p-3 min-h-[3rem] ${dragData ? 'bg-blue-50/50' : ''}`}>
                        {section.fields.length > 0 ? (
                          <div className={`grid gap-2 ${section.columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {section.fields.map((fn, fIdx) => (
                              <div key={fn} draggable onDragStart={() => handleDragStart(fn, sIdx)}
                                className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2 text-sm cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-2">
                                  <svg className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                                  <span className="text-gray-900">{getFieldLabel(fn)}</span>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => moveFieldInSection(sIdx, fIdx, -1)} disabled={fIdx === 0} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30" title="Move up">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z" /></svg>
                                  </button>
                                  <button onClick={() => moveFieldInSection(sIdx, fIdx, 1)} disabled={fIdx === section.fields.length - 1} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30" title="Move down">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
                                  </button>
                                  <button onClick={() => removeFieldFromSection(sIdx, fn)} className="rounded p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600" title="Remove">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.36 5.64a1 1 0 00-1.41 0L12 10.59 7.05 5.64a1 1 0 10-1.41 1.41L10.59 12l-4.95 4.95a1 1 0 101.41 1.41L12 13.41l4.95 4.95a1 1 0 001.41-1.41L13.41 12l4.95-4.95a1 1 0 000-1.41z" /></svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-12 rounded border-2 border-dashed border-gray-200 text-xs text-gray-400">
                            Drag fields here
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Available fields pool */}
                  {fieldsNotInLayout.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Available Fields — drag into a section above</p>
                      <div className="flex flex-wrap gap-2">
                        {fieldsNotInLayout.map(f => (
                          <div key={f.fieldName} draggable onDragStart={() => handleDragStart(f.fieldName)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 cursor-grab active:cursor-grabbing hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors">
                            <svg className="h-3 w-3 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                            {f.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSidebar === 'test-data' && (
            <div className="rounded-lg bg-white shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  <h2 className="text-base font-semibold text-gray-900">AI-Powered Test Data Generator</h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">Generate realistic, industry-themed CRM data using AI-curated seed datasets</p>
              </div>
              <div className="px-6 py-6">
                <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z"/></svg>
                    Industry Theme
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">Choose a theme to generate data with industry-specific company names, deals, and terminology</p>
                  <select value={selectedTheme} onChange={e => setSelectedTheme(e.target.value)} className="w-full rounded-md border border-purple-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500">
                    {themes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Number of records to generate:</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Accounts</label>
                      <input type="number" min={1} max={500000} value={dataCounts.accounts} onChange={e => setDataCounts(p => ({ ...p, accounts: parseInt(e.target.value) || 0 }))} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Contacts</label>
                      <input type="number" min={1} max={1000000} value={dataCounts.contacts} onChange={e => setDataCounts(p => ({ ...p, contacts: parseInt(e.target.value) || 0 }))} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Opportunities</label>
                      <input type="number" min={1} max={5000000} value={dataCounts.opportunities} onChange={e => setDataCounts(p => ({ ...p, opportunities: parseInt(e.target.value) || 0 }))} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
          )}
        </div>
      </div>

      {/* Add Field Modal */}
      <Modal isOpen={showFieldModal} onClose={() => setShowFieldModal(false)} title="Add Custom Field" footer={
        <>
          <button onClick={() => setShowFieldModal(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreateField} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create</button>
        </>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
            <input type="text" value={fieldForm.fieldName} onChange={e => setFieldForm(p => ({ ...p, fieldName: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. customScore" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input type="text" value={fieldForm.label} onChange={e => setFieldForm(p => ({ ...p, label: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Custom Score" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
            <select value={fieldForm.fieldType} onChange={e => setFieldForm(p => ({ ...p, fieldType: e.target.value as FieldDefinition['fieldType'] }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
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
              <input type="text" value={fieldForm.options} onChange={e => setFieldForm(p => ({ ...p, options: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Option A, Option B, Option C" />
            </div>
          )}
          <div>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={fieldForm.required} onChange={e => setFieldForm(p => ({ ...p, required: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium text-gray-700">Required</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Add Section Modal */}
      <Modal isOpen={showSectionModal} onClose={() => setShowSectionModal(false)} title="Add Section" footer={
        <>
          <button onClick={() => setShowSectionModal(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={addSection} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Add</button>
        </>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
            <input type="text" value={sectionForm.title} onChange={e => setSectionForm(p => ({ ...p, title: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Additional Details" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
            <div className="flex gap-2">
              {[1, 2].map(n => (
                <button key={n} onClick={() => setSectionForm(p => ({ ...p, columns: n }))}
                  className={`rounded-md px-4 py-2 text-sm font-medium ${sectionForm.columns === n ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {n} Column{n > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
