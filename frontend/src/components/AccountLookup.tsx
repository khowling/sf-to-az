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
    <div ref={ref} className="slds-combobox_container" style={{ position: 'relative' }}>
      <div className="slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click" role="combobox">
        <div className="slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right" role="none">
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
            className="slds-input slds-combobox__input"
            role="textbox"
            autoComplete="off"
          />
          {value && (
            <button
              type="button"
              onClick={() => { onChange(null); setSearch(''); }}
              className="slds-button slds-button_icon slds-input__icon slds-input__icon_right"
              style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}
            >
              <span className="slds-assistive-text">Clear</span>✕
            </button>
          )}
        </div>
        {open && (
          <div className="slds-dropdown slds-dropdown_length-5 slds-dropdown_fluid" role="listbox" style={{ display: 'block' }}>
            <ul className="slds-listbox slds-listbox_vertical" role="presentation">
              {filtered.length === 0 ? (
                <li className="slds-listbox__item slds-p-around_small slds-text-color_weak" role="presentation">No accounts found</li>
              ) : (
                filtered.map((a) => (
                  <li
                    key={a.id}
                    role="presentation"
                    className="slds-listbox__item"
                    onClick={() => { onChange(a.id); setOpen(false); setSearch(''); }}
                  >
                    <div className="slds-media slds-listbox__option slds-listbox__option_plain slds-media_small" role="option" style={{ cursor: 'pointer' }}>
                      <span className="slds-media__body">
                        <span className="slds-truncate">{a.name}</span>
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <div className="slds-form-element__help">{error}</div>}
    </div>
  );
}
