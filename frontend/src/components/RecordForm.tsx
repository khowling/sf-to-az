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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {f.required && <span className="text-red-500 mr-0.5" title="required">*</span>}
              {f.label}
            </label>
            <div>
              {renderField(f, values[f.fieldName], (v) => onChange(f.fieldName, v), errors[f.fieldName])}
            </div>
            {errors[f.fieldName] && <p className="mt-1 text-sm text-red-600">{errors[f.fieldName]}</p>}
          </div>
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
  const base = `w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`;

  if (field.fieldType === 'lookup' && field.fieldName === 'accountId') {
    return <AccountLookup value={(value as string) ?? null} onChange={(v) => onChange(v)} error={error} />;
  }

  switch (field.fieldType) {
    case 'boolean':
      return (
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            id={`cb-${field.fieldName}`}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
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
