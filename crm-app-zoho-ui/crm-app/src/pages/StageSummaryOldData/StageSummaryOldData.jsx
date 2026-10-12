import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ChevronDown, Clock3, Coins, Download, Handshake, LineChart as LineIcon, PieChart, Trophy, Upload, XCircle } from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import { ViewTabs, Toolbar } from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { DateRangePicker, SelectField } from '../../components/common/FilterBar';
import SearchInput from '../../components/common/SearchInput';
import DonutChart, { DonutLegend } from '../../components/charts/DonutChart';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import Dropdown, { MenuItem } from '../../components/common/Dropdown';
import { AccountLogo } from '../../components/common/Avatar';
import { useRefresh } from '../../components/common/hooks';
import { ChartCard } from '../StageSummaryPercentage/StageSummaryPercentage';
import { DEAL_SOURCES } from '../../data/seedData';
import {
  MONTHS, STAGES, STAGE_COLORS, axisCompact, dealKpis, fmtCompact, fmtNum, inRange, isLost, isOpen, isWon, monthIndex, pct, stageSummaryRows, sumBy, trend,
} from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';

const DEFAULT_RANGE = { from: '2024-01-01', to: '2024-12-31' };
const PRESETS = [
  { label: 'Year 2024', value: DEFAULT_RANGE },
  { label: 'Q1 2024', value: { from: '2024-01-01', to: '2024-03-31' } },
  { label: 'Q2 2024', value: { from: '2024-04-01', to: '2024-06-30' } },
  { label: 'Q3 2024', value: { from: '2024-07-01', to: '2024-09-30' } },
  { label: 'Q4 2024', value: { from: '2024-10-01', to: '2024-12-31' } },
  { label: 'H1 2024', value: { from: '2024-01-01', to: '2024-06-30' } },
  { label: 'All history', value: { from: '', to: '' } },
];
const EMPTY = { stage: '', owner: '', account: '', source: '' };
const p0 = (v) => `${Math.round(v)}%`;
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function StageSummaryOldData() {
  const { oldDeals, deals, users, accounts, accountsById, userName, accountName } = useCRM();
  const navigate = useNavigate();
  const { refreshing, refresh } = useRefresh('Historical data');
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [f, setF] = useState(EMPTY);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [q, setQ] = useState('');
  const [period, setPeriod] = useState('month');
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState(null);
  const [dense, setDense] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const reset = () => { setF(EMPTY); setRange(DEFAULT_RANGE); setQ(''); setPeriod('month'); setSort(null); };

  const oldAccounts = useMemo(() => {
    const ids = new Set(oldDeals.map((d) => d.accountId));
    return accounts.filter((a) => ids.has(a.id)).sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name }));
  }, [oldDeals, accounts]);

  const match = (d) => (!f.stage || d.stage === f.stage) && (!f.owner || d.ownerId === f.owner) && (!f.account || d.accountId === f.account) && (!f.source || d.source === f.source);
  const rows = useMemo(() => oldDeals.filter((d) => inRange(d.createdOn, range) && match(d)), [oldDeals, range, f]); // eslint-disable-line react-hooks/exhaustive-deps
  // Current data uses the same non-date filters, for the year 2026, only for comparison charts.
  const current = useMemo(() => deals.filter((d) => d.createdOn.startsWith('2026') && match(d)), [deals, f]); // eslint-disable-line react-hooks/exhaustive-deps

  const k = dealKpis(rows);
  const cur = dealKpis(current);
  const stageRows = stageSummaryRows(rows);
  const curStageRows = stageSummaryRows(current);
  const withPct = (n) => `${n} (${Math.round(pct(n, k.total))}%)`;
  const donut = stageRows.map((r) => ({ name: r.stage, value: r.totalDeals, color: STAGE_COLORS[r.stage] }));
  const trendBars = STAGES.map((s, i) => ({ name: s, old: stageRows[i].totalDeals, current: curStageRows[i].totalDeals }));
  const revenueLines = MONTHS.map((m, i) => ({
    name: m,
    old: sumBy(rows.filter((d) => monthIndex(d.createdOn) === i), (d) => d.amount),
    current: sumBy(current.filter((d) => monthIndex(d.createdOn) === i), (d) => d.amount),
  }));

  const cols = period === 'month' ? MONTHS : QUARTERS;
  const colOf = (d) => (period === 'month' ? monthIndex(d.createdOn) : Math.floor(monthIndex(d.createdOn) / 3));
  const histRows = useMemo(() => {
    let out = STAGES.map((s, i) => {
      const inStage = rows.filter((d) => d.stage === s);
      return { stage: s, cells: cols.map((_, c) => inStage.filter((d) => colOf(d) === c).length), total: inStage.length, revenue: stageRows[i].revenue, winRate: stageRows[i].winRate };
    });
    const s = q.trim().toLowerCase();
    if (s) out = out.filter((r) => r.stage.toLowerCase().includes(s));
    if (sort) out = [...out].sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * (a[sort.key] - b[sort.key]));
    return out;
  }, [rows, period, q, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  const colTotals = cols.map((_, c) => sumBy(histRows, (r) => r.cells[c]));
  const yearLabel = range.from ? range.from.slice(0, 4) : '';

  const topAccounts = useMemo(() => {
    const by = {};
    rows.forEach((d) => { (by[d.accountId] ||= []).push(d); });
    return Object.entries(by).map(([id, list]) => {
      const won = list.filter(isWon);
      const lost = list.filter(isLost);
      return {
        id, name: accountName(id), total: list.length, won: won.length, lost: lost.length, open: list.filter(isOpen).length,
        revenue: sumBy(list, (d) => d.amount), wonRevenue: sumBy(won, (d) => d.amount), lostRevenue: sumBy(lost, (d) => d.amount), winRate: pct(won.length, list.length),
      };
    }).sort((a, b) => b.total - a.total || b.revenue - a.revenue);
  }, [rows, accountName]);
  const shownAccounts = showAll ? topAccounts : topAccounts.slice(0, 5);

  const doExport = (what) => {
    if (what === 'accounts') {
      exportCSV('top-accounts-old-data', topAccounts, [
        { label: 'Account Name', value: (r) => r.name }, { label: 'Total Deals', value: (r) => r.total }, { label: 'Won Deals', value: (r) => r.won },
        { label: 'Lost Deals', value: (r) => r.lost }, { label: 'Open Deals', value: (r) => r.open }, { label: 'Total Revenue (INR)', value: (r) => r.revenue },
        { label: 'Won Revenue (INR)', value: (r) => r.wonRevenue }, { label: 'Lost Revenue (INR)', value: (r) => r.lostRevenue }, { label: 'Win Rate (%)', value: (r) => r.winRate.toFixed(1) },
      ]);
    } else if (what === 'raw') {
      exportCSV('historical-deals', rows, [
        { label: 'Deal Name', value: (d) => d.name }, { label: 'Account', value: (d) => accountName(d.accountId) }, { label: 'Stage', value: (d) => d.stage },
        { label: 'Amount (INR)', value: (d) => d.amount }, { label: 'Source', value: (d) => d.source }, { label: 'Owner', value: (d) => userName(d.ownerId) }, { label: 'Created On', value: (d) => d.createdOn },
      ]);
    } else if (what === 'compare') {
      exportCSV('old-vs-current-comparison', revenueLines, [{ label: 'Month', value: (r) => r.name }, { label: 'Old revenue (INR)', value: (r) => r.old }, { label: 'Current revenue (INR)', value: (r) => r.current }]);
    } else {
      exportCSV(`stage-summary-old-data-by-${period}`, histRows, [
        { label: 'Stage', value: (r) => r.stage }, ...cols.map((c, i) => ({ label: `${c} ${yearLabel}`.trim(), value: (r) => r.cells[i] })),
        { label: 'Total', value: (r) => r.total }, { label: 'Revenue (INR)', value: (r) => r.revenue }, { label: 'Won %', value: (r) => r.winRate.toFixed(1) },
      ]);
    }
  };
  const exportItems = [
    { label: 'Stage summary (CSV)', icon: Download, onClick: () => doExport('stages') },
    { label: 'Top accounts (CSV)', icon: Download, onClick: () => doExport('accounts') },
    { label: 'Old vs current revenue (CSV)', icon: Download, onClick: () => doExport('compare') },
    { label: 'Historical deal records (CSV)', icon: Download, onClick: () => doExport('raw') },
  ];

  return (
    <div>
      <ViewTabs views={[{ key: 'all', label: 'All Records' }]} view="all" onViewChange={() => {}}
        tabMenu={[{ label: 'Open current stage summary', onClick: () => navigate('/stage-summary-percentage') }, { label: 'Reset filters', onClick: reset }]} />
      <Toolbar
        filterActive={filtersOpen} onFilter={() => setFiltersOpen((o) => !o)}
        sortOptions={[{ key: 'total', label: 'Total Deals' }, { key: 'revenue', label: 'Revenue' }, { key: 'winRate', label: 'Won %' }]} sort={sort} onSort={setSort}
        layouts={['list', 'kanban', 'grid', 'chart', 'bars']} layout="bars"
        onLayout={(l) => (l === 'chart' ? navigate('/stage-summary-percentage') : l === 'kanban' ? navigate('/deals?view=kanban') : l !== 'bars' ? navigate('/deals') : null)}
        onRefresh={refresh} refreshing={refreshing} dense={dense} onDense={() => setDense((d) => !d)} module="Deals"
        primary={{ label: 'Export', onClick: () => doExport('stages'), menu: exportItems }}
        moreItems={[{ label: 'Open current stage summary', onClick: () => navigate('/stage-summary-percentage') }, { label: 'Reset filters', onClick: reset }]}
      />

      {filtersOpen && (
        <div className="card px-3 py-3 mb-3 flex flex-wrap items-end gap-3">
          <DateRangePicker label="Date Range" value={range} onChange={setRange} presets={PRESETS} size="sm" className="flex-[1.3_1_220px]" />
          <SelectField label="Stage" value={f.stage} onChange={set('stage')} options={STAGES} allLabel="All Stages" size="sm" className="flex-[1_1_160px]" />
          <SelectField label="Owner" value={f.owner} onChange={set('owner')} options={users.map((u) => ({ value: u.id, label: u.name }))} allLabel="All Owners" size="sm" className="flex-[1_1_160px]" />
          <SelectField label="Account" value={f.account} onChange={set('account')} options={oldAccounts} allLabel="All Accounts" size="sm" className="flex-[1_1_160px]" />
          <SelectField label="Deal Source" value={f.source} onChange={set('source')} options={DEAL_SOURCES} allLabel="All Sources" size="sm" className="flex-[1_1_160px]" />
          <button onClick={reset} className="h-10 px-7 rounded-lg bg-[#EEF3FA] border border-line text-[14px] text-ink hover:bg-[#E3EBF6]">Reset</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 mb-3">
        <StatCard variant="inline" icon={Handshake} tone="blue" label="Total Deals (Old Data)" value={k.total} trend={trend(k.total, cur.total)} trendLabel="vs current data" />
        <StatCard variant="inline" icon={Coins} tone="green" label="Total Revenue (₹)" value={fmtCompact(k.pipeline)} trend={trend(k.pipeline, cur.pipeline)} trendLabel="vs current data" />
        <StatCard variant="inline" icon={Trophy} tone="violet" label="Won Deals" value={withPct(k.won)} trend={trend(k.won, cur.won)} trendLabel="vs current data" />
        <StatCard variant="inline" icon={XCircle} tone="red" label="Lost Deals" value={withPct(k.lost)} trend={trend(k.lost, cur.lost)} invertTrend trendLabel="vs current data" />
        <StatCard variant="inline" icon={Clock3} tone="amber" label="Open Deals" value={withPct(k.open)} trend={trend(k.open, cur.open)} trendLabel="vs current data" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-3">
        <ChartCard title="Stage Distribution (Old Data)" icon={PieChart}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-[180px] shrink-0"><DonutChart data={donut} centerValue={k.total} centerLabel="Total Deals" height={180} valueFormatter={(v) => `${v} deals`} onSliceClick={(s) => setQ(s)} /></div>
            <DonutLegend className="flex-1 w-full" items={stageRows.map((r) => ({ name: r.stage, color: STAGE_COLORS[r.stage], right: `${p0(r.percentage)} (${r.totalDeals})` }))} />
          </div>
        </ChartCard>
        <ChartCard title="Deals Trend (Old vs Current)" icon={BarChart3}>
          <BarChart data={trendBars} height={200} legend barSize={18} yLabel="Deal Count"
            bars={[{ key: 'old', name: `Old Data${yearLabel ? ` (${yearLabel})` : ''}`, color: '#2F7BF5' }, { key: 'current', name: 'Current Data (2026)', color: '#2FCB8B' }]}
            renderLabel={() => ({ position: 'top', fontSize: 10.5, fill: '#071344', fontWeight: 600 })} margin={{ top: 30, right: 6, left: 6, bottom: 0 }} />
        </ChartCard>
        <ChartCard title="Revenue Comparison (₹)" icon={LineIcon}>
          <LineChart data={revenueLines} height={200} legend yFormatter={axisCompact} valueFormatter={(v) => fmtCompact(v)} yLabel="Revenue" yWidth={46}
            lines={[{ key: 'old', name: 'Old Data', color: '#2F7BF5' }, { key: 'current', name: 'Current Data', color: '#12C26B' }]} margin={{ top: 22, right: 10, left: 6, bottom: 0 }} />
        </ChartCard>
      </div>

      <section className="card overflow-hidden mb-3">
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3">
          <h2 className="text-[16px] font-semibold text-ink flex-1 min-w-[200px]">Stage Summary - Old Data</h2>
          <SearchInput value={q} onChange={setQ} placeholder="Search stage..." size="sm" className="w-full sm:w-[190px]" />
          <SelectField value={period} onChange={setPeriod} size="sm" className="w-[160px]" options={[{ value: 'month', label: 'Group by Month' }, { value: 'quarter', label: 'Group by Quarter' }]} />
          <Dropdown width={240} align="right" trigger={<button className="h-9 px-3 rounded-lg border border-line text-primary text-[13.5px] font-medium inline-flex items-center gap-1.5 hover:bg-primary-50"><Upload size={15} />Export<ChevronDown size={14} /></button>}>
            {(close) => exportItems.map((it) => <MenuItem key={it.label} icon={it.icon} close={close} onClick={it.onClick}>{it.label}</MenuItem>)}
          </Dropdown>
        </div>
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full min-w-[1160px] text-[13px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#F5F8FD]">
                <th className="th text-left pl-4">Stage</th>
                {cols.map((c) => <th key={c} className="th text-center">{c} {yearLabel}</th>)}
                <th className="th text-center">Total</th><th className="th text-center">Revenue (₹)</th><th className="th text-center">Won %</th>
              </tr>
            </thead>
            <tbody>
              {refreshing && <tr><td colSpan={cols.length + 4} className="td py-6 text-center text-ink-400">Refreshing…</td></tr>}
              {!refreshing && histRows.map((r) => (
                <tr key={r.stage} className={`${dense ? 'h-7' : 'h-[31px]'} hover:bg-[#F8FAFE]`}>
                  <td className="td pl-4 text-ink whitespace-nowrap"><span className="inline-flex items-center gap-2.5"><span className="h-3.5 w-3.5 rounded-full" style={{ background: STAGE_COLORS[r.stage] }} />{r.stage}</span></td>
                  {r.cells.map((v, i) => <td key={i} className="td text-center">{v}</td>)}
                  <td className="td text-center font-semibold text-ink">{r.total}</td>
                  <td className="td text-center">{fmtNum(r.revenue)}</td>
                  <td className="td text-center">{p0(r.winRate)}</td>
                </tr>
              ))}
              {!refreshing && histRows.length === 0 && <tr><td colSpan={cols.length + 4} className="td py-8 text-center text-ink-500">No stage matches “{q}”.</td></tr>}
              <tr className="h-10 font-bold text-ink bg-[#FAFCFF]">
                <td className="pl-4 px-2.5">Total</td>
                {colTotals.map((v, i) => <td key={i} className="text-center">{v}</td>)}
                <td className="text-center">{sumBy(histRows, (r) => r.total)}</td>
                <td className="text-center">{fmtNum(sumBy(histRows, (r) => r.revenue))}</td>
                <td className="text-center">{p0(pct(k.won, k.total))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-[12px] text-ink-500 border-t border-line-soft">Won % is the share of deals that reached a stage and were eventually won. Historical records are stored separately from current deals.</p>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-[16px] font-semibold text-ink">Top Accounts - Old Data</h2>
          <button onClick={() => setShowAll((s) => !s)} className="h-9 px-4 rounded-lg border border-line text-primary text-[13.5px] font-medium hover:bg-primary-50">{showAll ? 'Show Top 5' : `View All (${topAccounts.length})`}</button>
        </div>
        <div className={`overflow-x-auto thin-scroll ${showAll ? 'max-h-[460px] overflow-y-auto' : ''}`}>
          <table className="w-full min-w-[1080px] text-[13px] border-separate border-spacing-0">
            <thead className="sticky top-0">
              <tr className="bg-[#F5F8FD]">
                {['#', 'Account Name', 'Total Deals', 'Won Deals', 'Lost Deals', 'Open Deals', 'Total Revenue (₹)', 'Won Revenue (₹)', 'Lost Revenue (₹)', 'Win Rate'].map((h, i) => <th key={h} className={`th ${i === 1 ? 'text-left' : i === 0 ? 'text-center w-12' : 'text-left'}`}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {shownAccounts.map((r, i) => (
                <tr key={r.id} className="h-[34px] hover:bg-[#F8FAFE]">
                  <td className="td text-center">{i + 1}</td>
                  <td className="td"><button onClick={() => navigate(`/accounts?open=${r.id}`)} className="inline-flex items-center gap-2.5 text-ink hover:text-primary"><AccountLogo account={accountsById[r.id]} size={24} />{r.name}</button></td>
                  <td className="td">{r.total}</td><td className="td">{r.won}</td><td className="td">{r.lost}</td><td className="td">{r.open}</td>
                  <td className="td">{fmtNum(r.revenue)}</td><td className="td">{fmtNum(r.wonRevenue)}</td><td className="td">{fmtNum(r.lostRevenue)}</td>
                  <td className="td"><span className="inline-flex h-6 px-2 items-center rounded-md bg-[#DFF6EA] text-[#0E9F5E] text-[12px] font-semibold">{p0(r.winRate)}</span></td>
                </tr>
              ))}
              {shownAccounts.length === 0 && <tr><td colSpan={10} className="td py-8 text-center text-ink-500">No historical deals in this range.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
