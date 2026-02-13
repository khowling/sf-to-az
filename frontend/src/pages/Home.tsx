import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { accountsApi, contactsApi, opportunitiesApi } from '../api/client';

function StatCard({ label, count, subtitle, to, color }: { label: string; count: number; subtitle?: string; to: string; color: string }) {
  return (
    <Link to={to} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col items-center">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3 ${color}`}>
        {count}
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Accounts" count={accounts.length} to="/accounts" color="bg-[#0176d3]" />
        <StatCard label="Contacts" count={contacts.length} to="/contacts" color="bg-[#06a59a]" />
        <StatCard label="Opportunities" count={opps.length} subtitle={`Pipeline: ${fmt.format(pipeline)}`} to="/opportunities" color="bg-[#9050e9]" />
      </div>
    </div>
  );
}
