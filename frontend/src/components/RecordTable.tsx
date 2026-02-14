import { useState, type ReactNode } from 'react';

export interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

interface RecordTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  searchable?: boolean;
}

export default function RecordTable({ columns, data, onRowClick, searchable }: RecordTableProps) {
  const [search, setSearch] = useState('');

  const filtered = searchable && search
    ? data.filter((row) =>
        columns.some((col) => {
          const val = row[col.key];
          return val != null && String(val).toLowerCase().includes(search.toLowerCase());
        }),
      )
    : data;

  return (
    <div className="rounded-lg bg-white shadow-sm border border-gray-200">
      {searchable && (
        <div className="p-3 sm:p-4 pb-0">
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th key={col.key} scope="col" className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={(row.id as string) ?? i}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
                >
                  {columns.map((col) => (
                    <td key={col.key} data-label={col.label} className="px-3 sm:px-4 py-2 sm:py-3 text-gray-700">
                      <div className="truncate max-w-[200px] sm:max-w-none">
                        {col.render ? col.render(row[col.key], row) : (row[col.key] as ReactNode) ?? '—'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
