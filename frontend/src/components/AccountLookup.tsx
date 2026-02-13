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

  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });

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
        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3] focus:border-transparent ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      {value && (
        <button
          type="button"
          onClick={() => { onChange(null); setSearch(''); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
        >
          ✕
        </button>
      )}
      {open && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">No accounts found</li>
          ) : (
            filtered.map((a) => (
              <li
                key={a.id}
                onClick={() => { onChange(a.id); setOpen(false); setSearch(''); }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
              >
                {a.name}
              </li>
            ))
          )}
        </ul>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
