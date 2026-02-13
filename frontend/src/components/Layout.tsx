import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/contacts', label: 'Contacts' },
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  return (
    <div className="slds-scope" style={{ minHeight: '100vh', backgroundColor: '#f3f3f3' }}>
      <header className="slds-global-header_container">
        <div className="slds-global-header slds-grid slds-grid_align-spread" style={{ backgroundColor: '#032d60' }}>
          <div className="slds-global-header__item">
            <span className="slds-text-heading_small" style={{ color: '#fff', fontWeight: 700, letterSpacing: '0.05em' }}>CRM</span>
          </div>
        </div>
      </header>
      <div className="slds-context-bar" style={{ backgroundColor: '#032d60', borderBottom: '3px solid #1b96ff' }}>
        <div className="slds-context-bar__primary">
          <nav className="slds-context-bar__secondary" role="navigation">
            <ul className="slds-grid">
              {links.map((l) => (
                <li key={l.to} className="slds-context-bar__item">
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) =>
                      `slds-context-bar__label-action ${isActive ? 'slds-is-active' : ''}`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? '#fff' : '#b0d5ff',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                      textDecoration: 'none',
                    })}
                  >
                    <span className="slds-truncate">{l.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <main className="slds-p-around_medium" style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
