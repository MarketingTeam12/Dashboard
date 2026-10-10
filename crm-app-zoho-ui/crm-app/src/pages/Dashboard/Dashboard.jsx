import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, User, Handshake, Coins, Target, Plus, MoreHorizontal,
  ChevronDown, Phone, Mail, Calendar, CheckSquare, Eye, Edit3,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Clock, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useCRM } from '../../context/CRMContext';
import { fmtINR, fmtDate, fmtTime } from '../../utils/calculations';

function Sparkline({ color = '#2F7BF5', heights = [20, 35, 45, 30, 60, 80, 95] }) {
  return (
    <div className="flex items-end gap-1 h-8">
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-1.5 rounded-t"
          style={{
            height: `${h}%`,
            backgroundColor: color,
            opacity: 0.25 + (i / heights.length) * 0.75
          }}
        />
      ))}
    </div>
  );
}

const STATUS_COLORS = {
  New: '#2F7BF5',
  Contacted: '#12C26B',
  Qualified: '#F59E0B',
  Proposal: '#F43F5E',
  Converted: '#8E3CF2'
};

const TREND_DATA = [
  { month: 'May', created: 25, converted: 12 },
  { month: 'Jun', created: 48, converted: 26 },
  { month: 'Jul', created: 58, converted: 32 },
  { month: 'Aug', created: 72, converted: 38 },
  { month: 'Sep', created: 78, converted: 45 },
  { month: 'Oct', created: 90, converted: 54 }
];

const SOURCES_DATA = [
  { source: 'Website', count: 80, color: '#2F7BF5' },
  { source: 'Referral', count: 50, color: '#12C26B' },
  { source: 'Social Media', count: 40, color: '#F59E0B' },
  { source: 'Email Campaign', count: 30, color: '#F43F5E' },
  { source: 'Direct Contact', count: 20, color: '#8E3CF2' },
  { source: 'Events', count: 15, color: '#06B6D4' },
  { source: 'Others', count: 15, color: '#94A3B8' }
];

export default function Dashboard() {
  const crm = useCRM();
  const navigate = useNavigate();
  const { leads = [], contacts = [], deals = [], users = [] } = crm;

  const [leadPeriod, setLeadPeriod] = useState('This Month');
  const [trendPeriod, setTrendPeriod] = useState('Last 6 Months');
  const [dealStagePeriod, setDealStagePeriod] = useState('This Month');
  const [activityPeriod, setActivityPeriod] = useState('This Week');
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);

  // Status donut distribution
  const statusCounts = useMemo(() => {
    return [
      { name: 'New', value: 100, color: '#2F7BF5', pct: '40%' },
      { name: 'Contacted', value: 50, color: '#12C26B', pct: '20%' },
      { name: 'Qualified', value: 38, color: '#F59E0B', pct: '15%' },
      { name: 'Proposal', value: 38, color: '#F43F5E', pct: '15%' },
      { name: 'Converted', value: 24, color: '#8E3CF2', pct: '10%' }
    ];
  }, []);

  // Upcoming follow ups matching mockup
  const upcomingFollowups = [
    { lead: 'Arun Kumar', type: 'Call', icon: Phone, color: 'text-emerald-600 bg-emerald-50', dateTime: '10 Oct 2026 11:30 AM', agent: 'Karthik S', role: 'Sales Lead' },
    { lead: 'Priya Menon', type: 'Email', icon: Mail, color: 'text-rose-600 bg-rose-50', dateTime: '09 Oct 2026 02:00 PM', agent: 'Anitha M', role: 'Account Exec' },
    { lead: 'Ramesh S', type: 'Meeting', icon: Users, color: 'text-blue-600 bg-blue-50', dateTime: '08 Oct 2026 04:00 PM', agent: 'Vikram P', role: 'Consultant' },
    { lead: 'Divya K', type: 'Task', icon: CheckSquare, color: 'text-purple-600 bg-purple-50', dateTime: '07 Oct 2026 10:45 AM', agent: 'Divya R', role: 'Solutions Rep' },
    { lead: 'Mohan Raj', type: 'Call', icon: Phone, color: 'text-emerald-600 bg-emerald-50', dateTime: '06 Oct 2026 03:30 PM', agent: 'Arun Kumar', role: 'Deal Strategist' }
  ];

  // Recent leads matching mockup
  const recentLeads = [
    { id: '1', name: 'Arun Kumar', company: 'ABC Solutions', source: 'Website', status: 'New', createdOn: '10 Oct 2026' },
    { id: '2', name: 'Priya Menon', company: 'XYZ Technologies', source: 'Referral', status: 'Contacted', createdOn: '09 Oct 2026' },
    { id: '3', name: 'Ramesh S', company: 'R S Enterprises', source: 'Social Media', status: 'Qualified', createdOn: '08 Oct 2026' },
    { id: '4', name: 'Divya K', company: 'D Tech Solutions', source: 'Email Campaign', status: 'Proposal', createdOn: '07 Oct 2026' },
    { id: '5', name: 'Mohan Raj', company: 'MNR Traders', source: 'Direct Contact', status: 'Converted', createdOn: '06 Oct 2026' }
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back! Here's an overview of your CRM.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddWidgetModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2F7BF5] hover:bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus size={16} />
            <span>Add Widget</span>
          </button>
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Leads */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F7BF5] flex items-center justify-center">
              <Users size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Total Leads</p>
            <div className="text-2xl font-bold text-slate-900">250</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 12%</div>
          </div>
          <Sparkline color="#2F7BF5" heights={[25, 40, 50, 35, 70, 85, 95]} />
        </div>

        {/* Card 2: Total Contacts */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <User size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Total Contacts</p>
            <div className="text-2xl font-bold text-slate-900">180</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 8%</div>
          </div>
          <Sparkline color="#10B981" heights={[30, 45, 40, 60, 50, 75, 90]} />
        </div>

        {/* Card 3: Total Deals */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Handshake size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Total Deals</p>
            <div className="text-2xl font-bold text-slate-900">120</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 15%</div>
          </div>
          <Sparkline color="#8B5CF6" heights={[20, 30, 45, 60, 70, 85, 90]} />
        </div>

        {/* Card 4: Revenue */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Revenue</p>
            <div className="text-2xl font-bold text-slate-900">₹ 48.5 L</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 20%</div>
          </div>
          <Sparkline color="#F59E0B" heights={[30, 40, 50, 60, 75, 85, 100]} />
        </div>

        {/* Card 5: Conversion Rate */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Target size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Conversion Rate</p>
            <div className="text-2xl font-bold text-slate-900">24%</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 5%</div>
          </div>
          <Sparkline color="#F43F5E" heights={[35, 45, 55, 65, 75, 85, 95]} />
        </div>
      </div>

      {/* Row 2: 3 Analytics Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Widget 1: Leads by Status (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2F7BF5] flex items-center justify-center">
                  <PieChartIcon size={15} />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Leads by Status</h2>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
                onClick={() => setLeadPeriod(leadPeriod === 'This Month' ? 'This Quarter' : 'This Month')}
              >
                <span>{leadPeriod}</span>
                <ChevronDown size={12} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Current month lead distribution</p>

            <div className="flex flex-col items-center justify-center">
              <div className="relative w-44 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RechartsTooltip
                      formatter={(val, name) => [`${val} Leads`, name]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Pie
                      data={statusCounts}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-900">250</span>
                  <span className="text-[10px] font-medium text-slate-500">Leads</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full pt-3 text-xs border-t border-slate-100 mt-2">
                {statusCounts.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 text-[11px]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800 text-[11px]">{item.value} ({item.pct})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Widget 2: Leads Trend (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2F7BF5] flex items-center justify-center">
                  <LineChartIcon size={15} />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Leads Trend</h2>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
                onClick={() => setTrendPeriod(trendPeriod === 'Last 6 Months' ? 'Last Year' : 'Last 6 Months')}
              >
                <span>{trendPeriod}</span>
                <ChevronDown size={12} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Leads created vs converted</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="created" name="Leads Created" stroke="#2F7BF5" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="converted" name="Leads Converted" stroke="#12C26B" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2F7BF5]" />
              <span className="text-slate-600 font-medium">Leads Created</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12C26B]" />
              <span className="text-slate-600 font-medium">Leads Converted</span>
            </div>
          </div>
        </div>

        {/* Widget 3: Leads by Source (3 cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2F7BF5] flex items-center justify-center">
                <BarChart3 size={15} />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Leads by Source</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">Top lead sources this month</p>

            <div className="space-y-3">
              {SOURCES_DATA.map((item) => (
                <div key={item.source} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">{item.source}</span>
                    <span className="text-slate-900 font-bold">{item.count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.count / 100) * 100}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Leads & Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Leads (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2F7BF5] flex items-center justify-center">
                <Clock size={15} />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Recent Leads</h2>
            </div>
            <Link to="/leads" className="text-xs font-semibold text-[#2F7BF5] hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Lead Name</th>
                  <th className="py-2.5 px-2">Company</th>
                  <th className="py-2.5 px-2">Source</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Created On</th>
                  <th className="py-2.5 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLeads.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-2 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-2 font-medium text-slate-900">
                      <Link to="/leads" className="hover:text-[#2F7BF5]">
                        {item.name}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-slate-600">{item.company}</td>
                    <td className="py-3 px-2 text-slate-500">{item.source}</td>
                    <td className="py-3 px-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-medium inline-block"
                        style={{
                          backgroundColor: `${STATUS_COLORS[item.status] || '#2F7BF5'}15`,
                          color: STATUS_COLORS[item.status] || '#2F7BF5'
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-500">{item.createdOn}</td>
                    <td className="py-3 px-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate('/leads')}
                          className="p-1 text-slate-400 hover:text-[#2F7BF5] rounded"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/leads')}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Follow-ups (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2F7BF5] flex items-center justify-center">
                <Calendar size={15} />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Upcoming Follow-ups</h2>
            </div>
            <Link to="/workqueue" className="text-xs font-semibold text-[#2F7BF5] hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 px-2">Lead Name</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2">Date & Time</th>
                  <th className="py-2.5 px-2">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingFollowups.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-2 font-medium text-slate-900">
                        <Link to="/leads" className="hover:text-[#2F7BF5]">
                          {item.lead}
                        </Link>
                      </td>
                      <td className="py-3 px-2">
                        <div className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                          <span className={`p-1 rounded-md ${item.color}`}>
                            <Icon size={12} />
                          </span>
                          <span>{item.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-500">{item.dateTime}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {item.agent[0]}
                          </div>
                          <span className="font-medium text-slate-800">{item.agent}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 4: Deals by Stage & Activities Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deals by Stage (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2F7BF5] flex items-center justify-center">
                <Target size={15} />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Deals by Stage</h2>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
              onClick={() => setDealStagePeriod(dealStagePeriod === 'This Month' ? 'This Quarter' : 'This Month')}
            >
              <span>{dealStagePeriod}</span>
              <ChevronDown size={12} />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-center space-y-1">
              <span className="text-[11px] font-medium text-blue-700 block truncate">Qualification</span>
              <div className="text-lg font-bold text-slate-900">30</div>
              <span className="text-[11px] font-semibold text-slate-600">₹ 10.5 L</span>
            </div>
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-center space-y-1">
              <span className="text-[11px] font-medium text-emerald-700 block truncate">Needs Analysis</span>
              <div className="text-lg font-bold text-slate-900">25</div>
              <span className="text-[11px] font-semibold text-slate-600">₹ 8.0 L</span>
            </div>
            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-center space-y-1">
              <span className="text-[11px] font-medium text-amber-700 block truncate">Proposal</span>
              <div className="text-lg font-bold text-slate-900">20</div>
              <span className="text-[11px] font-semibold text-slate-600">₹ 12.0 L</span>
            </div>
            <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl text-center space-y-1">
              <span className="text-[11px] font-medium text-rose-700 block truncate">Negotiation</span>
              <div className="text-lg font-bold text-slate-900">15</div>
              <span className="text-[11px] font-semibold text-slate-600">₹ 9.5 L</span>
            </div>
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-center space-y-1">
              <span className="text-[11px] font-medium text-purple-700 block truncate">Closed Won</span>
              <div className="text-lg font-bold text-slate-900">30</div>
              <span className="text-[11px] font-semibold text-slate-600">₹ 48.5 L</span>
            </div>
          </div>
        </div>

        {/* Activities Overview (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2F7BF5] flex items-center justify-center">
                <CheckSquare size={15} />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Activities Overview</h2>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
              onClick={() => setActivityPeriod(activityPeriod === 'This Week' ? 'This Month' : 'This Week')}
            >
              <span>{activityPeriod}</span>
              <ChevronDown size={12} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Calls</span>
                <div className="text-xl font-bold text-slate-900">45</div>
                <span className="text-[11px] font-semibold text-emerald-600">↑ 18%</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Phone size={18} />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Emails</span>
                <div className="text-xl font-bold text-slate-900">32</div>
                <span className="text-[11px] font-semibold text-emerald-600">↑ 12%</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Mail size={18} />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Meetings</span>
                <div className="text-xl font-bold text-slate-900">18</div>
                <span className="text-[11px] font-semibold text-emerald-600">↑ 20%</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Tasks</span>
                <div className="text-xl font-bold text-slate-900">27</div>
                <span className="text-[11px] font-semibold text-emerald-600">↑ 17%</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Widget Modal */}
      {showAddWidgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Customize Dashboard Widgets</h3>
            <p className="text-sm text-slate-500 mb-4">Choose which performance cards and analytics widgets to display on your CRM overview.</p>
            <div className="space-y-3 mb-6">
              {[
                { name: 'Lead Velocity Index', desc: 'Real-time velocity of newly generated leads' },
                { name: 'Agent Workload Monitor', desc: 'Live tasks assigned across team members' },
                { name: 'Deal Win-Rate Cohorts', desc: 'Monthly probability distribution of pipeline deals' },
                { name: 'Automated WorkQueue Queue Health', desc: 'Pending vs completed automated workflow steps' }
              ].map((w, i) => (
                <label key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input type="checkbox" defaultChecked={i < 2} className="mt-1 rounded text-[#2F7BF5] focus:ring-[#2F7BF5]" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{w.name}</div>
                    <div className="text-xs text-slate-500">{w.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddWidgetModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddWidgetModal(false);
                  crm.notify('Widgets updated successfully', 'success');
                }}
                className="px-4 py-2 text-sm font-semibold bg-[#2F7BF5] text-white hover:bg-blue-600 rounded-xl"
              >
                Save Widgets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
