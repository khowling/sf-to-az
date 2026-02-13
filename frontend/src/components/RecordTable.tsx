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
    <div className="slds-card">
      <div className="slds-card__body">
        {searchable && (
          <div className="slds-form-element slds-m-bottom_small" style={{ maxWidth: '20rem' }}>
            <div className="slds-form-element__control">
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="slds-input"
              />
            </div>
          </div>
        )}
        <table className="slds-table slds-table_bordered slds-table_cell-buffer">
          <thead>
            <tr className="slds-line-height_reset">
              {columns.map((col) => (
                <th key={col.key} scope="col">
                  <div className="slds-truncate" title={col.label}>{col.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="slds-text-align_center slds-p-around_medium slds-text-color_weak">
                  No records found
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={(row.id as string) ?? i}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'slds-hint-parent cursor-pointer' : ''}
                >
                  {columns.map((col) => (
                    <td key={col.key} data-label={col.label}>
                      <div className="slds-truncate">
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
