import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { accountsApi, contactsApi, opportunitiesApi } from '../api/client';

function StatCard({ label, count, subtitle, to, color }: { label: string; count: number; subtitle?: string; to: string; color: string }) {
  return (
    <Link to={to} className="slds-card" style={{ textDecoration: 'none' }}>
      <div className="slds-card__body slds-p-around_medium" style={{ textAlign: 'center' }}>
        <div className="slds-m-bottom_small" style={{ display: 'inline-flex', width: '6rem', height: '6rem', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.875rem', fontWeight: 700, backgroundColor: color }}>
          {count}
        </div>
        <h3 className="slds-text-heading_small">{label}</h3>
        {subtitle && <p className="slds-text-color_weak slds-m-top_xx-small">{subtitle}</p>}
      </div>
    </Link>
  );
}

export default function Home() {
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });
  const { data: contacts = [] } = useQuery({ queryKey: ['contacts'], queryFn: contactsApi.list });
  const { data: opps = [] } = useQuery({ queryKey: ['opportunities'], queryFn: opportunitiesApi.list });

  const pipeline = opps.reduce((sum, o) => sum + (parseFloat(o.amount ?? '0') || 0), 0);
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div>
      <div className="slds-page-header slds-m-bottom_medium">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <h1 className="slds-page-header__title">Dashboard</h1>
          </div>
        </div>
      </div>
      <div className="slds-grid slds-wrap slds-gutters">
        <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">
          <StatCard label="Accounts" count={accounts.length} to="/accounts" color="#0176d3" />
        </div>
        <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">
          <StatCard label="Contacts" count={contacts.length} to="/contacts" color="#06a59a" />
        </div>
        <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">
          <StatCard label="Opportunities" count={opps.length} subtitle={`Pipeline: ${fmt.format(pipeline)}`} to="/opportunities" color="#9050e9" />
        </div>
      </div>
    </div>
  );
}
