import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { searchApi } from '../api/client';

// Inline SVG icons for nav items
const icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6z" />
    </svg>
  ),
  accounts: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
    </svg>
  ),
  contacts: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  ),
  opportunities: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  ),
};

const navLinks = [
  { to: '/', label: 'Home', icon: icons.home },
  { to: '/accounts', label: 'Accounts', icon: icons.accounts },
  { to: '/contacts', label: 'Contacts', icon: icons.contacts },
  { to: '/opportunities', label: 'Opportunities', icon: icons.opportunities },
];

export default function Layout() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchApi.query>> | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fire search
  useEffect(() => {
    if (debouncedTerm.length < 2) { setResults(null); setShowDropdown(false); return; }
    setIsSearching(true);
    searchApi.query(debouncedTerm).then(r => { setResults(r); setShowDropdown(true); }).finally(() => setIsSearching(false));
  }, [debouncedTerm]);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false); };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowDropdown(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey); };
  }, []);

  const navigateTo = (path: string) => { setShowDropdown(false); setSearchTerm(''); navigate(path); };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top header bar */}
      <header
        style={{
          background: 'linear-gradient(135deg, #032d60 0%, #0b5cab 50%, #1b96ff 100%)',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '3.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo + App Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '2.125rem',
              height: '2.125rem',
              borderRadius: '0.625rem',
              background: 'linear-gradient(135deg, #1b96ff 0%, #032d60 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
              border: '1.5px solid rgba(255,255,255,0.3)',
            }}
          >
            <span style={{ color: '#fff', fontSize: '0.9375rem', fontWeight: 900, fontFamily: 'system-ui', lineHeight: 1 }}>m</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0' }}>
            <span
              style={{
                color: 'rgba(176,213,255,0.9)',
                fontSize: '1.0625rem',
                fontWeight: 400,
                letterSpacing: '0.02em',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              my
            </span>
            <span
              style={{
                color: '#fff',
                fontSize: '1.0625rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              CRM
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', height: '100%' }}>
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.875rem',
                borderRadius: '0.375rem',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                backgroundColor: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
                height: '2.125rem',
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('active'))
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('active'))
                  e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {l.icon}
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Search bar */}
        <div ref={searchRef} style={{ position: 'relative', flex: '0 0 20rem' }}>
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.6)' }}>
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => { if (results && searchTerm.length >= 2) setShowDropdown(true); }}
              placeholder="Search all records..."
              style={{
                width: '100%',
                padding: '0.375rem 0.75rem 0.375rem 2rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '0.8125rem',
                outline: 'none',
              }}
            />
          </div>
          {showDropdown && results && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.375rem',
              backgroundColor: '#fff',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              maxHeight: '24rem',
              overflowY: 'auto',
              zIndex: 50,
            }}>
              {isSearching && <p style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.8125rem' }}>Searching...</p>}
              {!isSearching && results.accounts.total === 0 && results.contacts.total === 0 && results.opportunities.total === 0 && (
                <p style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.8125rem' }}>No results found</p>
              )}
              {results.accounts.data.length > 0 && (
                <div>
                  <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.6875rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6' }}>
                    Accounts ({results.accounts.total.toLocaleString()} results)
                  </div>
                  {results.accounts.data.slice(0, 5).map(a => (
                    <button key={a.id} onClick={() => navigateTo(`/accounts/${a.id}`)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: '#111827', cursor: 'pointer', border: 'none', background: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      {a.name}
                    </button>
                  ))}
                </div>
              )}
              {results.contacts.data.length > 0 && (
                <div>
                  <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.6875rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6', borderTop: '1px solid #e5e7eb' }}>
                    Contacts ({results.contacts.total.toLocaleString()} results)
                  </div>
                  {results.contacts.data.slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => navigateTo(`/contacts/${c.id}`)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: '#111827', cursor: 'pointer', border: 'none', background: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      {c.firstName} {c.lastName}
                    </button>
                  ))}
                </div>
              )}
              {results.opportunities.data.length > 0 && (
                <div>
                  <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.6875rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6', borderTop: '1px solid #e5e7eb' }}>
                    Opportunities ({results.opportunities.total.toLocaleString()} results)
                  </div>
                  {results.opportunities.data.slice(0, 5).map(o => (
                    <button key={o.id} onClick={() => navigateTo(`/opportunities/${o.id}`)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: '#111827', cursor: 'pointer', border: 'none', background: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      {o.name}{o.accountName ? ` — ${o.accountName}` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings cog */}
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '50%',
            color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
            backgroundColor: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
          })}
          title="Settings"
        >
          {icons.settings}
        </NavLink>
      </header>

      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
