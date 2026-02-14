import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { accountsApi, contactsApi, opportunitiesApi } from '../api/client';
import { BarChart, Bar, PieChart, Pie, FunnelChart, Funnel, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';

function StatCard({ label, count, subtitle, to, color }: { label: string; count: number; subtitle?: string; to: string; color: string }) {
  return (
    <Link to={to} className="block rounded-lg bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow no-underline">
      <div className="px-4 py-4 flex items-center gap-4">
        <div className="flex min-w-[3rem] h-12 px-3 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold" style={{ backgroundColor: color }}>
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
  const navigate = useNavigate();
  const { data: accountsRes } = useQuery({ queryKey: ['accounts'], queryFn: () => accountsApi.list(1, 500) });
  const { data: contactsRes } = useQuery({ queryKey: ['contacts'], queryFn: () => contactsApi.list(1, 500) });
  const { data: oppsRes } = useQuery({ queryKey: ['opportunities'], queryFn: () => opportunitiesApi.list(1, 500) });

  const accounts = accountsRes?.data ?? [];
  const contacts = contactsRes?.data ?? [];
  const opps = oppsRes?.data ?? [];
  const accountsTotal = accountsRes?.total ?? 0;
  const contactsTotal = contactsRes?.total ?? 0;
  const oppsTotal = oppsRes?.total ?? 0;

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

  // Opportunity Funnel (active pipeline stages only)
  const funnelStages = ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won'];
  const FUNNEL_COLORS = ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#16a34a'];
  const funnelData = funnelStages
    .map((stage, i) => ({
      name: stage,
      value: oppsByStage[stage]?.count || 0,
      fill: FUNNEL_COLORS[i],
    }))
    .filter(d => d.value > 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (data: any) => {
    const stage = data?.stage || data?.payload?.stage;
    if (stage) navigate(`/opportunities?stage=${encodeURIComponent(stage)}`);
  };

  return (
    <div>
      <div className="mb-4 rounded-lg bg-white px-5 py-3 shadow-sm border border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
        <StatCard label="Accounts" count={accountsTotal} to="/accounts" color="#0176d3" />
        <StatCard label="Contacts" count={contactsTotal} to="/contacts" color="#06a59a" />
        <StatCard label="Opportunities" count={oppsTotal} subtitle={`Pipeline: ${fmt.format(pipeline)}`} to="/opportunities" color="#9050e9" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Opportunity Pipeline by Stage - Count */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-visible">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 truncate">Opportunity Pipeline by Stage</h2>
          </div>
          <div className="p-3 pb-6">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 10, dy: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#9050e9" name="Opportunity Count" cursor="pointer" onClick={handleBarClick} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Opportunity Pipeline by Stage - Value */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-visible">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 truncate">Opportunity Value by Stage</h2>
          </div>
          <div className="p-3 pb-6">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineData} margin={{ top: 5, right: 10, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 10, dy: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000000 ? `$${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`} />
                <Tooltip formatter={(value) => fmt.format(Number(value))} />
                <Bar dataKey="value" fill="#0176d3" name="Total Value ($)" cursor="pointer" onClick={handleBarClick} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Account Distribution by Industry */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 truncate">Top 10 Industries by Account Count</h2>
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={industryData}
                  cx="50%"
                  cy="40%"
                  labelLine={false}
                  outerRadius={75}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {industryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={INDUSTRY_COLORS[index % INDUSTRY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} accounts`, name]} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
                  iconSize={8}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contact Summary Stats */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 truncate">Contact Summary</h2>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xl font-bold" style={{ color: '#06a59a' }}>{contactsTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Contacts</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xl font-bold" style={{ color: '#0176d3' }}>{contacts.filter(c => c.accountId).length.toLocaleString()}</p>
                <p className="text-xs text-gray-500">With Accounts</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xl font-bold" style={{ color: '#9050e9' }}>{contacts.filter(c => c.email).length.toLocaleString()}</p>
                <p className="text-xs text-gray-500">With Email</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xl font-bold" style={{ color: '#e16032' }}>{contacts.filter(c => c.phone).length.toLocaleString()}</p>
                <p className="text-xs text-gray-500">With Phone</p>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunity Funnel */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 truncate">Opportunity Funnel</h2>
          </div>
          <div className="p-3">
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <FunnelChart>
                  <Tooltip formatter={(value, name) => [`${Number(value).toLocaleString()} opportunities`, name]} />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="center" fill="#fff" fontSize={10} fontWeight={600}
                      formatter={(v: unknown) => Number(v).toLocaleString()} />
                    <LabelList position="right" fill="#374151" fontSize={10} dataKey="name" />
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-sm text-gray-400">No opportunity data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
