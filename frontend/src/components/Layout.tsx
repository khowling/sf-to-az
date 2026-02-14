import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { searchApi } from '../api/client';

const navLinks = [
  { to: '/', label: 'Home', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg> },
  { to: '/accounts', label: 'Accounts', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg> },
  { to: '/contacts', label: 'Contacts', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg> },
  { to: '/opportunities', label: 'Opportunities', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

export default function Layout() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchApi.query>> | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedTerm.length < 2) { setResults(null); setShowDropdown(false); return; }
    setIsSearching(true);
    searchApi.query(debouncedTerm).then(r => { setResults(r); setShowDropdown(true); }).finally(() => setIsSearching(false));
  }, [debouncedTerm]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false); };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowDropdown(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey); };
  }, []);

  const navigateTo = (path: string) => { setShowDropdown(false); setSearchTerm(''); navigate(path); };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 h-14 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 no-underline group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-600/25 group-hover:shadow-md group-hover:shadow-blue-600/30 transition-shadow">
            <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5 text-white">
              <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" fill="currentColor" />
              <path d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" fill="currentColor" />
              <path d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" fill="currentColor" />
            </svg>
          </div>
          <span className="hidden sm:inline text-[0.9375rem] font-semibold text-gray-900 tracking-tight">
            <span className="text-gray-400 font-normal">my</span>CRM
          </span>
        </NavLink>

        {/* Nav */}
        <nav className="flex items-center gap-0.5 h-full">
          {navLinks.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-[0.8125rem] font-medium no-underline transition-all border-b-2 ${
                  isActive
                    ? 'border-blue-600 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }>
              {l.icon}
              <span className="hidden md:inline">{l.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Search */}
        <div ref={searchRef} className="relative w-32 sm:w-48 md:w-72">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => { if (results && searchTerm.length >= 2) setShowDropdown(true); }}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
            />
          </div>
          {showDropdown && results && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-200 max-h-96 overflow-y-auto z-50">
              {isSearching && <p className="px-3 py-3 text-sm text-gray-500">Searching...</p>}
              {!isSearching && results.accounts.total === 0 && results.contacts.total === 0 && results.opportunities.total === 0 && (
                <p className="px-3 py-3 text-sm text-gray-500">No results found</p>
              )}
              {results.accounts.data.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Accounts · {results.accounts.total.toLocaleString()}
                  </div>
                  {results.accounts.data.slice(0, 5).map(a => (
                    <button key={a.id} onClick={() => navigateTo(`/accounts/${a.id}`)} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {a.name}
                    </button>
                  ))}
                </div>
              )}
              {results.contacts.data.length > 0 && (
                <div className="border-t border-gray-100">
                  <div className="px-3 py-2 text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Contacts · {results.contacts.total.toLocaleString()}
                  </div>
                  {results.contacts.data.slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => navigateTo(`/contacts/${c.id}`)} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {c.firstName} {c.lastName}
                    </button>
                  ))}
                </div>
              )}
              {results.opportunities.data.length > 0 && (
                <div className="border-t border-gray-100">
                  <div className="px-3 py-2 text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Opportunities · {results.opportunities.total.toLocaleString()}
                  </div>
                  {results.opportunities.data.slice(0, 5).map(o => (
                    <button key={o.id} onClick={() => navigateTo(`/opportunities/${o.id}`)} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {o.name}{o.accountName ? ` — ${o.accountName}` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <NavLink to="/settings"
          className={({ isActive }) =>
            `flex items-center justify-center w-8 h-8 rounded-lg no-underline transition-all shrink-0 ${
              isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`
          }
          title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-[1.125rem] h-[1.125rem]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </NavLink>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
