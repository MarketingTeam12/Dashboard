import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Clock3, Coins, Download, Handshake, Layers, Trophy, Upload, XCircle } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { ViewTabs, Toolbar } from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { DateRangePicker, SelectField } from '../../components/common/FilterBar';
import SearchInput from '../../components/common/SearchInput';
import DonutChart, { DonutLegend } from '../../components/charts/DonutChart';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import Dropdown, { MenuItem } from '../../components/common/Dropdown';
import { useRefresh } from '../../components/common/hooks';
import { DEAL_SOURCES, DEPARTMENTS } from '../../data/seedData';
import {
  MONTHS, STAGES, STAGE_COLORS, dealKpis, fmtCompact, fmtINR, fmtNum, funnelConversion, groupSummaryRows, inRange, monthIndex,
  pct, stageSummaryRows, sumBy, totalsRow, trend,
} from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';

const DEFAULT_RANGE = { from: '2026-01-01', to: '2026-12-31' };
const SOURCE_COLORS = { Website: '#2F7BF5', Referral: '#FF7B3A', 'Cold Call': '#8E3CF2', Email: '#FFBB28', Partner: '#12C26B' };
const EMPTY = { department: '', owner: '', account: '', source: '' };
const p0 = (v) => `${Math.round(v)}%`;

export function ChartCard({ title, icon: Icon, children, className = '', extra }) {
  return (
    <section className={`chart-card min-w-0 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 className="chart-title">{Icon && <Icon size={16} className="text-primary" />}{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

export default function StageSummaryPercentage() {
  const { deals, oldDeals, users, accounts, userName, accountName } = useCRM();
  const navigate = useNavigate();
  const { refreshing, refresh } = useRefresh('Stage summary');
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [f, setF] = useState(EMPTY);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [q, setQ] = useState('');
  const [groupBy, setGroupBy] = useState('stage');
  const [sort, setSort] = useState(null);
  const [dense, setDense] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const reset = () => { setF(EMPTY); setRange(DEFAULT_RANGE); setQ(''); setGroupBy('stage'); setSort(null); };

  const dealAccounts = useMemo(() => {
    const ids = new Set(deals.map((d) => d.accountId));
    return accounts.filter((a) => ids.has(a.id)).sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name }));
  }, [deals, accounts]);

  const rows = useMemo(() => deals.filter((d) => inRange(d.createdOn, range)
    && (!f.department || d.department === f.department) && (!f.owner || d.ownerId === f.owner)
    && (!f.account || d.accountId === f.account) && (!f.source || d.source === f.source)), [deals, range, f]);

  const k = dealKpis(rows);
  const prev = dealKpis(oldDeals);
  const stageRows = stageSummaryRows(rows);
  const withPct = (n) => `${n} (${Math.round(pct(n, k.total))}%)`;

  const donut = stageRows.map((r) => ({ name: r.stage, value: r.totalDeals, color: STAGE_COLORS[r.stage] }));
  const bars = stageRows.map((r) => ({ name: r.stage, value: r.totalDeals, pct: Math.round(r.percentage), color: STAGE_COLORS[r.stage] }));
  const conversion = funnelConversion(rows).map((c) => ({ name: c.stage, value: c.value }));
  const sourceData = DEAL_SOURCES.map((s) => ({ name: s, value: rows.filter((d) => d.source === s).length, color: SOURCE_COLORS[s] }));
  const maxRev = Math.max(...stageRows.map((r) => r.revenue), 1);
  const trendData = MONTHS.map((m, i) => {
    const inMonth = rows.filter((d) => monthIndex(d.createdOn) === i);
    const point = { name: m };
    STAGES.forEach((s) => { point[s] = inMonth.length ? Math.round(pct(inMonth.filter((d) => d.stage === s).length, inMonth.length)) : null; });
    return point;
  });

  const tableRows = useMemo(() => {
    let out;
    if (groupBy === 'stage') out = stageRows;
    else if (groupBy === 'month') {
      const keys = [...new Set(rows.map((d) => d.createdOn.slice(0, 7)))].sort();
      out = groupSummaryRows(rows, (d) => d.createdOn.slice(0, 7), keys).map((r) => ({ ...r, stage: `${MONTHS[Number(r.key.slice(5, 7)) - 1]} ${r.key.slice(0, 4)}` }));
    } else if (groupBy === 'source') out = groupSummaryRows(rows, (d) => d.source, DEAL_SOURCES);
    else out = groupSummaryRows(rows, (d) => d.ownerId, users.map((u) => u.id)).map((r) => ({ ...r, stage: userName(r.key) }));
    const s = q.trim().toLowerCase();
    if (s) out = out.filter((r) => r.stage.toLowerCase().includes(s));
    if (sort) out = [...out].sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * (a[sort.key] - b[sort.key]));
    return out;
  }, [groupBy, stageRows, rows, q, sort, users, userName]);
  const totals = totalsRow(tableRows);

  const doExport = (what) => {
    if (what === 'deals') {
      exportCSV('stage-summary-deals', rows, [
        { label: 'Deal Name', value: (d) => d.name }, { label: 'Account', value: (d) => accountName(d.accountId) }, { label: 'Stage', value: (d) => d.stage },
        { label: 'Amount (INR)', value: (d) => d.amount }, { label: 'Source', value: (d) => d.source }, { label: 'Department', value: (d) => d.department },
        { label: 'Owner', value: (d) => userName(d.ownerId) }, { label: 'Created On', value: (d) => d.createdOn },
      ]);
      return;
    }
    if (what === 'trend') {
      exportCSV('monthly-stage-percentage-trend', trendData, [{ label: 'Month', value: (r) => r.name }, ...STAGES.map((s) => ({ label: `${s} %`, value: (r) => r[s] ?? '' }))]);
      return;
    }
    const label = { stage: 'Stage', month: 'Month', source: 'Deal Source', owner: 'Owner' }[groupBy];
    exportCSV(`stage-summary-by-${groupBy}`, [...tableRows, { ...totals, stage: 'Total' }], [
      { label, value: (r) => r.stage }, { label: 'Total Deals', value: (r) => r.totalDeals }, { label: 'Percentage (%)', value: (r) => r.percentage.toFixed(1) },
      { label: 'Total Revenue (INR)', value: (r) => r.revenue }, { label: 'Revenue %', value: (r) => r.revenuePct.toFixed(1) }, { label: 'Won Deals', value: (r) => r.won },
      { label: 'Lost Deals', value: (r) => r.lost }, { label: 'Open Deals', value: (r) => r.open }, { label: 'Avg. Deal Value (INR)', value: (r) => Math.round(r.avg) },
    ]);
  };
  const exportItems = [
    { label: 'Summary table (CSV)', icon: Download, onClick: () => doExport('table') },
    { label: 'Filtered deals (CSV)', icon: Download, onClick: () => doExport('deals') },
    { label: 'Monthly trend (CSV)', icon: Download, onClick: () => doExport('trend') },
  ];

  const barLabel = () => ({
    content: ({ x, y, width, height, index }) => {
      const d = bars[index];
      if (!d) return null;
      return (
        <g>
          <text x={x + width / 2} y={y - 18} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#071344">{d.pct}%</text>
          <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#071344">{d.value}</text>
          {height > 22 && <text x={x + width / 2} y={y + height - 8} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#fff">{d.value}</text>}
        </g>
      );
    },
  });

  return (
    <div>
      <ViewTabs views={[{ key: 'all', label: 'All Deals' }]} view="all" onViewChange={() => {}}
        tabMenu={[{ label: 'Open Deals module', onClick: () => navigate('/deals') }, { label: 'Compare with old data', onClick: () => navigate('/stage-summary-old-data') }, { label: 'Reset filters', onClick: reset }]} />
      <Toolbar
        filterActive={filtersOpen} onFilter={() => setFiltersOpen((o) => !o)}
        sortOptions={[{ key: 'totalDeals', label: 'Total Deals' }, { key: 'revenue', label: 'Total Revenue' }, { key: 'avg', label: 'Avg. Deal Value' }, { key: 'won', label: 'Won Deals' }]} sort={sort} onSort={setSort}
        layouts={['list', 'kanban', 'grid', 'chart']} layout="chart"
        onLayout={(l) => (l === 'list' ? navigate('/deals') : l === 'kanban' ? navigate('/deals?view=kanban') : l === 'grid' ? navigate('/deals') : null)}
        onRefresh={refresh} refreshing={refreshing} dense={dense} onDense={() => setDense((d) => !d)} module="Deals"
        primary={{ label: 'Export', onClick: () => doExport('table'), menu: exportItems }}
        moreItems={[{ label: 'Compare with old data', onClick: () => navigate('/stage-summary-old-data') }, { label: 'Reset filters', onClick: reset }]}
      />

      {filtersOpen && (
        <div className="card px-3 py-3 mb-3 flex flex-wrap items-end gap-3">
          <DateRangePicker label="Date Range" value={range} onChange={setRange} size="sm" className="flex-[1.3_1_220px]" />
          <SelectField label="Department" value={f.department} onChange={set('department')} options={DEPARTMENTS} allLabel="All Departments" size="sm" className="flex-[1_1_160px]" />
          <SelectField label="Owner" value={f.owner} onChange={set('owner')} options={users.map((u) => ({ value: u.id, label: u.name }))} allLabel="All Owners" size="sm" className="flex-[1_1_160px]" />
          <SelectField label="Account" value={f.account} onChange={set('account')} options={dealAccounts} allLabel="All Accounts" size="sm" className="flex-[1_1_160px]" />
          <SelectField label="Deal Source" value={f.source} onChange={set('source')} options={DEAL_SOURCES} allLabel="All Sources" size="sm" className="flex-[1_1_160px]" />
          <button onClick={reset} className="h-10 px-7 rounded-lg bg-[#EEF3FA] border border-line text-[14px] text-ink hover:bg-[#E3EBF6]">Reset</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 mb-3">
        <StatCard variant="inline" icon={Handshake} tone="blue" label="Total Deals" value={k.total} trend={trend(k.total, prev.total)} />
        <StatCard variant="inline" icon={Coins} tone="green" label="Total Pipeline Value" value={fmtCompact(k.pipeline)} trend={trend(k.pipeline, prev.pipeline)} />
        <StatCard variant="inline" icon={Trophy} tone="violet" label="Won Deals" value={withPct(k.won)} trend={trend(k.won, prev.won)} />
        <StatCard variant="inline" icon={XCircle} tone="red" label="Lost Deals" value={withPct(k.lost)} trend={trend(k.lost, prev.lost)} invertTrend />
        <StatCard variant="inline" icon={Clock3} tone="amber" label="Open Deals" value={withPct(k.open)} trend={trend(k.open, prev.open)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-3">
        <ChartCard title="Stage Distribution (Percentage)" icon={Layers}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-[190px] shrink-0"><DonutChart data={donut} centerValue={k.total} centerLabel="Total Deals" height={190} valueFormatter={(v) => `${v} deals (${Math.round(pct(v, k.total))}%)`} onSliceClick={(s) => { setGroupBy('stage'); setQ(s); }} /></div>
            <DonutLegend className="flex-1 w-full" items={stageRows.map((r) => ({ name: r.stage, color: STAGE_COLORS[r.stage], right: p0(r.percentage) }))} />
          </div>
        </ChartCard>
        <ChartCard title="Stage-wise Deal Count">
          <BarChart data={bars} bars={[{ key: 'value', name: 'Deals', color: '#2F7BF5', cellColors: (d) => d.color }]} height={200} barSize={40} yLabel="Deal Count" renderLabel={barLabel} margin={{ top: 34, right: 6, left: 6, bottom: 0 }} />
        </ChartCard>
        <ChartCard title="Stage Conversion Percentage" extra={<span className="text-[11.5px] text-ink-500">% of deals reaching each stage</span>}>
          <LineChart data={conversion} lines={[{ key: 'value', name: 'Reached', color: '#12C26B', area: true, labels: (v) => `${v}%` }]} height={200} yFormatter={(v) => `${v}%`} valueFormatter={(v) => `${v}%`} yDomain={[0, 100]} margin={{ top: 26, right: 18, left: -4, bottom: 0 }} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_0.95fr_1.3fr] gap-3 mb-3">
        <ChartCard title="Revenue by Stage (₹)">
          <ul className="mt-3 space-y-[11px]">
            {stageRows.map((r) => (
              <li key={r.stage} className="grid grid-cols-[112px_1fr_auto] items-center gap-3 text-[12.5px]" title={`${r.stage}: ${fmtINR(r.revenue)}`}>
                <span className="flex items-center gap-2 text-ink-600 truncate"><span className="h-3 w-3 rounded-full shrink-0" style={{ background: STAGE_COLORS[r.stage] }} />{r.stage}</span>
                <span className="h-[14px] rounded-[3px] bg-[#F1F4F9]"><span className="block h-full rounded-[3px]" style={{ width: `${(r.revenue / maxRev) * 100}%`, background: STAGE_COLORS[r.stage] }} /></span>
                <span className="text-ink font-medium whitespace-nowrap">{fmtINR(r.revenue)} ({p0(r.revenuePct)})</span>
              </li>
            ))}
          </ul>
        </ChartCard>
        <ChartCard title="Deals Percentage by Source">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-[170px] shrink-0"><DonutChart data={sourceData} centerValue={k.total} centerLabel="Total Deals" height={170} valueFormatter={(v) => `${v} deals`} /></div>
            <DonutLegend className="flex-1 w-full" items={sourceData.map((s) => ({ name: s.name, color: s.color, right: p0(pct(s.value, k.total)) }))} />
          </div>
        </ChartCard>
        <ChartCard title="Monthly Stage Percentage Trend">
          <LineChart data={trendData} lines={STAGES.map((s) => ({ key: s, name: s, color: STAGE_COLORS[s] }))} height={190} legend yFormatter={(v) => `${v}%`} valueFormatter={(v) => (v == null ? '—' : `${v}%`)} margin={{ top: 24, right: 10, left: -8, bottom: 0 }} />
        </ChartCard>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3">
          <h2 className="text-[16px] font-semibold text-ink flex-1 min-w-[220px]">Stage Summary Percentage (Detailed)</h2>
          <SearchInput value={q} onChange={setQ} placeholder={`Search ${groupBy === 'stage' ? 'stage' : groupBy}...`} size="sm" className="w-full sm:w-[190px]" />
          <SelectField value={groupBy} onChange={(v) => { setGroupBy(v); setQ(''); }} size="sm" className="w-[160px]"
            options={[{ value: 'stage', label: 'Group by Stage' }, { value: 'month', label: 'Group by Month' }, { value: 'source', label: 'Group by Source' }, { value: 'owner', label: 'Group by Owner' }]} />
          <Dropdown width={200} align="right" trigger={<button className="h-9 px-3 rounded-lg border border-line text-primary text-[13.5px] font-medium inline-flex items-center gap-1.5 hover:bg-primary-50"><Upload size={15} />Export<ChevronDown size={14} /></button>}>
            {(close) => exportItems.map((it) => <MenuItem key={it.label} icon={it.icon} close={close} onClick={it.onClick}>{it.label}</MenuItem>)}
          </Dropdown>
        </div>
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full min-w-[980px] text-[13px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#F5F8FD]">
                <th className={`th text-left pl-4 ${dense ? 'h-9' : ''}`}>{{ stage: 'Stage', month: 'Month', source: 'Deal Source', owner: 'Owner' }[groupBy]}</th>
                {['Total Deals', 'Percentage (%)', 'Total Revenue (₹)', 'Revenue %', 'Won Deals', 'Lost Deals', 'Open Deals', 'Avg. Deal Value (₹)'].map((h) => <th key={h} className="th text-center">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {refreshing && <tr><td colSpan={9} className="td py-6 text-center text-ink-400">Refreshing…</td></tr>}
              {!refreshing && tableRows.map((r) => (
                <tr key={r.key} className={`${dense ? 'h-8' : 'h-[34px]'} hover:bg-[#F8FAFE]`}>
                  <td className="td pl-4 text-ink"><span className="inline-flex items-center gap-2.5">{groupBy === 'stage' && <span className="h-3.5 w-3.5 rounded-full" style={{ background: STAGE_COLORS[r.stage] }} />}{groupBy === 'source' && <span className="h-3.5 w-3.5 rounded-full" style={{ background: SOURCE_COLORS[r.stage] }} />}{r.stage}</span></td>
                  <td className="td text-center">{r.totalDeals}</td>
                  <td className="td text-center">{p0(r.percentage)}</td>
                  <td className="td text-center">{fmtNum(r.revenue)}</td>
                  <td className="td text-center">{p0(r.revenuePct)}</td>
                  <td className="td text-center">{r.won}</td>
                  <td className="td text-center">{r.lost}</td>
                  <td className="td text-center">{r.open}</td>
                  <td className="td text-center">{fmtNum(r.avg)}</td>
                </tr>
              ))}
              {!refreshing && tableRows.length === 0 && <tr><td colSpan={9} className="td py-10 text-center text-ink-500">No rows match “{q}”. Clear the search to see every {groupBy}.</td></tr>}
              <tr className="h-10 font-bold text-ink bg-[#FAFCFF]">
                <td className="pl-4 px-2.5">Total</td>
                <td className="text-center">{totals.totalDeals}</td>
                <td className="text-center">{p0(sumBy(tableRows, (r) => r.percentage))}</td>
                <td className="text-center">{fmtNum(totals.revenue)}</td>
                <td className="text-center">{p0(sumBy(tableRows, (r) => r.revenuePct))}</td>
                <td className="text-center">{totals.won}</td>
                <td className="text-center">{totals.lost}</td>
                <td className="text-center">{totals.open}</td>
                <td className="text-center">{fmtNum(totals.avg)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {q && <p className="px-4 py-2 text-[12px] text-ink-500 border-t border-line-soft">Percentages are each row’s share of all {k.total} filtered deals, so the total row adds up only the rows shown.</p>}
      </section>
    </div>
  );
}
