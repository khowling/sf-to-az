import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { accountsApi, contactsApi, opportunitiesApi } from '../api/client';

function StatCard({ label, count, subtitle, to, color }: { label: string; count: number; subtitle?: string; to: string; color: string }) {
  return (
    <Link to={to} className="block rounded-lg bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow no-underline">
      <div className="p-6 text-center">
        <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full text-white text-3xl font-bold" style={{ backgroundColor: color }}>
          {count}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
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
      <div className="mb-6 rounded-lg bg-white px-6 py-4 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard label="Accounts" count={accounts.length} to="/accounts" color="#0176d3" />
        <StatCard label="Contacts" count={contacts.length} to="/contacts" color="#06a59a" />
        <StatCard label="Opportunities" count={opps.length} subtitle={`Pipeline: ${fmt.format(pipeline)}`} to="/opportunities" color="#9050e9" />
      </div>
    </div>
  );
}
