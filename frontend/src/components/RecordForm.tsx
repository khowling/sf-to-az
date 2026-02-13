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
    <div className={`slds-form slds-form_stacked slds-grid slds-wrap slds-gutters_small`}>
      {fields.map((f) => (
        <div key={f.fieldName} className={columns === 2 ? 'slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-p-around_xx-small' : 'slds-col slds-size_1-of-1 slds-p-around_xx-small'}>
          <div className={`slds-form-element ${errors[f.fieldName] ? 'slds-has-error' : ''}`}>
            <label className="slds-form-element__label">
              {f.required && <abbr className="slds-required" title="required">*</abbr>}
              {f.label}
            </label>
            <div className="slds-form-element__control">
              {renderField(f, values[f.fieldName], (v) => onChange(f.fieldName, v), errors[f.fieldName])}
            </div>
            {errors[f.fieldName] && <div className="slds-form-element__help">{errors[f.fieldName]}</div>}
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
  const base = error ? 'slds-input slds-has-error' : 'slds-input';

  if (field.fieldType === 'lookup' && field.fieldName === 'accountId') {
    return <AccountLookup value={(value as string) ?? null} onChange={(v) => onChange(v)} error={error} />;
  }

  switch (field.fieldType) {
    case 'boolean':
      return (
        <div className="slds-checkbox">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            id={`cb-${field.fieldName}`}
          />
          <label className="slds-checkbox__label" htmlFor={`cb-${field.fieldName}`}>
            <span className="slds-checkbox_faux"></span>
          </label>
        </div>
      );
    case 'picklist':
      return (
        <div className="slds-select_container">
          <select value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className="slds-select">
            <option value="">— Select —</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
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
