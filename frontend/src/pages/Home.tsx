import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { accountsApi, contactsApi, opportunitiesApi } from '../api/client';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function StatCard({ label, count, subtitle, to, color }: { label: string; count: number; subtitle?: string; to: string; color: string }) {
  return (
    <Link to={to} className="block rounded-lg bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow no-underline">
      <div className="px-4 py-4 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white text-lg font-bold" style={{ backgroundColor: color }}>
          {count.toLocaleString()}
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{label}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
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

  // Opportunity Pipeline by Stage
  const stageOrder = ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const oppsByStage = opps.reduce((acc, opp) => {
    const stage = opp.stage || 'Unknown';
    if (!acc[stage]) acc[stage] = { count: 0, value: 0 };
    acc[stage].count++;
    acc[stage].value += parseFloat(opp.amount ?? '0') || 0;
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  const pipelineData = stageOrder.map(stage => ({
    stage,
    count: oppsByStage[stage]?.count || 0,
    value: oppsByStage[stage]?.value || 0,
  }));

  // Account Distribution by Industry
  const accountsByIndustry = accounts.reduce((acc, account) => {
    const industry = account.industry || 'Unknown';
    acc[industry] = (acc[industry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const industryData = Object.entries(accountsByIndustry)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const INDUSTRY_COLORS = ['#0176d3', '#06a59a', '#9050e9', '#e16032', '#54698d', '#16325c', '#0070d2', '#00a1e0', '#4bca81', '#ffb75d'];

  return (
    <div>
      <div className="mb-6 rounded-lg bg-white px-6 py-4 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-6">
        <StatCard label="Accounts" count={accounts.length} to="/accounts" color="#0176d3" />
        <StatCard label="Contacts" count={contacts.length} to="/contacts" color="#06a59a" />
        <StatCard label="Opportunities" count={opps.length} subtitle={`Pipeline: ${fmt.format(pipeline)}`} to="/opportunities" color="#9050e9" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Opportunity Pipeline by Stage - Count */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 truncate">Opportunity Pipeline by Stage</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={pipelineData} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#9050e9" name="Opportunity Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Opportunity Pipeline by Stage - Value */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 truncate">Opportunity Value by Stage</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={pipelineData} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(value) => fmt.format(Number(value))} />
                <Legend />
                <Bar dataKey="value" fill="#0176d3" name="Total Value ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Account Distribution by Industry */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 truncate">Top 10 Industries by Account Count</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={industryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {industryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={INDUSTRY_COLORS[index % INDUSTRY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contact Summary Stats */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 truncate">Contact Summary</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: '#06a59a' }}>{contacts.length.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Total Contacts</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: '#0176d3' }}>{contacts.filter(c => c.accountId).length.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">With Accounts</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: '#9050e9' }}>{contacts.filter(c => c.email).length.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">With Email</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: '#e16032' }}>{contacts.filter(c => c.phone).length.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">With Phone</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
