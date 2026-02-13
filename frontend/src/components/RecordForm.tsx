import type { FieldDefinition } from '../types';
import AccountLookup from './AccountLookup';

interface RecordFormProps {
  fields: FieldDefinition[];
  values: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  errors?: Record<string, string>;
  columns?: number;
}

export default function RecordForm({ fields, values, onChange, errors = {}, columns = 2 }: RecordFormProps) {
  return (
    <div className={`grid gap-4 ${columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
      {fields.map((f) => (
        <div key={f.fieldName}>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {f.label}
            {f.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {renderField(f, values[f.fieldName], (v) => onChange(f.fieldName, v), errors[f.fieldName])}
          {errors[f.fieldName] && <p className="text-red-500 text-xs mt-1">{errors[f.fieldName]}</p>}
        </div>
      ))}
    </div>
  );
}

function renderField(
  field: FieldDefinition,
  value: unknown,
  onChange: (v: unknown) => void,
  error?: string,
) {
  const base = `w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3] focus:border-transparent ${
    error ? 'border-red-400' : 'border-gray-300'
  }`;

  if (field.fieldType === 'lookup' && field.fieldName === 'accountId') {
    return <AccountLookup value={(value as string) ?? null} onChange={(v) => onChange(v)} error={error} />;
  }

  switch (field.fieldType) {
    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[#0176d3] focus:ring-[#0176d3]"
        />
      );
    case 'picklist':
      return (
        <select value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="">— Select —</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'number':
      return (
        <input
          type="number"
          value={value != null ? String(value) : ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className={base}
        />
      );
    case 'date':
      return (
        <input
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className={base}
        />
      );
    default:
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      );
  }
}
