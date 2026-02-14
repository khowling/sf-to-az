import { useState } from 'react';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'number' | 'date-range';
  options?: string[];  // for select type
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export default function FilterBar({ filters, values, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(values).filter(Boolean).length;

  const update = (key: string, value: string) => {
    onChange({ ...values, [key]: value });
  };

  const clearAll = () => {
    onChange({});
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setOpen(!open)}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            activeCount > 0
              ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white leading-none">{activeCount}</span>
          )}
        </button>
        {/* Active filter badges */}
        {Object.entries(values).filter(([, v]) => v).map(([key, val]) => {
          const config = filters.find(f => f.key === key);
          const label = config?.key === 'closeDateRange'
            ? { this_week: 'This Week', this_month: 'This Month', this_quarter: 'This Quarter', this_year: 'This Year', overdue: 'Overdue' }[val] || val
            : config?.key === 'amountMin' ? `≥ $${Number(val).toLocaleString()}`
            : config?.key === 'amountMax' ? `≤ $${Number(val).toLocaleString()}`
            : val;
          return (
            <span key={key} className="inline-flex items-center gap-1 rounded-full bg-purple-100 border border-purple-200 px-3 py-1 text-xs font-medium text-purple-700">
              {config?.label}: {label}
              <button onClick={() => update(key, '')} className="ml-0.5 text-purple-400 hover:text-purple-600">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.36 5.64a1 1 0 00-1.41 0L12 10.59 7.05 5.64a1 1 0 10-1.41 1.41L10.59 12l-4.95 4.95a1 1 0 101.41 1.41L12 13.41l4.95 4.95a1 1 0 001.41-1.41L13.41 12l4.95-4.95a1 1 0 000-1.41z" /></svg>
              </button>
            </span>
          );
        })}
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear all</button>
        )}
      </div>
      {open && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filters.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={values[f.key] || ''}
                    onChange={e => update(f.key, e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'number' ? (
                  <input
                    type="number"
                    value={values[f.key] || ''}
                    onChange={e => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                ) : f.type === 'date-range' ? (
                  <select
                    value={values[f.key] || ''}
                    onChange={e => update(f.key, e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Time</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="this_quarter">This Quarter</option>
                    <option value="this_year">This Year</option>
                    <option value="overdue">Overdue</option>
                  </select>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
