import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '../api/client';

interface AccountLookupProps {
  value: string | null;
  onChange: (accountId: string | null) => void;
  error?: string;
}

export default function AccountLookup({ value, onChange, error }: AccountLookupProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: response } = useQuery({ queryKey: ['accounts'], queryFn: () => accountsApi.list() });
  const accounts = response?.data ?? [];

  const selected = accounts.find((a) => a.id === value);
  const filtered = accounts.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div role="combobox">
        <div className="relative">
          <input
            type="text"
            placeholder="Search accounts…"
            value={open ? search : selected?.name ?? ''}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              setSearch('');
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            role="textbox"
            autoComplete="off"
          />
          {value && (
            <button
              type="button"
              onClick={() => { onChange(null); setSearch(''); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none"
              title="Clear"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.36 5.64a1 1 0 00-1.41 0L12 10.59 7.05 5.64a1 1 0 10-1.41 1.41L10.59 12l-4.95 4.95a1 1 0 101.41 1.41L12 13.41l4.95 4.95a1 1 0 001.41-1.41L13.41 12l4.95-4.95a1 1 0 000-1.41z" />
              </svg>
              <span className="sr-only">Clear</span>
            </button>
          )}
        </div>
        {open && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-48 overflow-auto" role="listbox">
            <ul role="presentation">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-400" role="presentation">No accounts found</li>
              ) : (
                filtered.map((a) => (
                  <li
                    key={a.id}
                    role="presentation"
                    onClick={() => { onChange(a.id); setOpen(false); setSearch(''); }}
                    className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span className="truncate">{a.name}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
