import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlarmClock, BadgeCheck, ChevronDown, Download, Eye, FileText, IndianRupee, Layers, LayoutGrid, Pencil, Plus, Receipt, Trash2, Upload, Wallet,
} from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';

import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge from '../../components/common/StatusBadge';
import { badgeTone } from '../../components/common/statusTone';
import ActionMenu from '../../components/common/ActionMenu';
import FormModal from '../../components/common/RecordForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Drawer, SectionTitle } from '../../components/common/Modal';
import Dropdown, { MenuItem, MenuLabel } from '../../components/common/Dropdown';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import { ChartView, GridView, KanbanView } from '../../components/common/Views';
import DonutChart, { DonutLegend } from '../../components/charts/DonutChart';
import BarChart from '../../components/charts/BarChart';
import { ChartCard } from '../StageSummaryPercentage/StageSummaryPercentage';
import { useRefresh, useUrlActions } from '../../components/common/hooks';
import { useToast } from '../../components/common/toastContext';
import { INVOICE_STATUSES, INVOICE_TYPES } from '../../data/seedData';
import {
  MONTHS, addDays, axisCompact, balanceOf, deriveInvoiceStatus, fmtCompact, fmtDate, fmtINR, fmtNum, inRange, invoiceKpis, monthIndex, pct, todayISO, trend,
} from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';

const DEFAULT_RANGE = { from: '2026-01-01', to: '2026-12-31' };
const EMPTY = { status: '', type: '', account: '', minAmt: '', maxAmt: '', dueFrom: '', dueTo: '', withBalance: false };
const STATUS_COLORS = { Paid: '#12C26B', Pending: '#FFA51F', Overdue: '#F04438', 'Partially Paid': '#2F7BF5' };
const TYPE_COLORS = { 'Sales Invoice': '#2F7BF5', 'Recurring Invoice': '#8E3CF2', 'Credit Note': '#FFA51F', 'Debit Note': '#12C26B' };
const p0 = (v) => `${Math.round(v)}%`;

export default function ZohoFinance() {
  const { invoices, accounts, baselines, accountName, accountsById, createRecord, updateRecord, deleteRecords } = useCRM();
  const toast = useToast();
  const { refreshing, refresh } = useRefresh('Invoices');
  const [layout, setLayout] = useState('list');
  const [dense, setDense] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [savedView, setSavedView] = useState('all');
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [f, setF] = useState(EMPTY);
  const [form, setForm] = useState(null);
  const [payFor, setPayFor] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const views = [
    { key: 'all', label: 'All Transactions', test: () => true },
    { key: 'unpaid', label: 'Unpaid Invoices', test: (i) => balanceOf(i) > 0 },
    { key: 'overdue', label: 'Overdue Invoices', test: (i) => i.status === 'Overdue' },
    { key: 'notes', label: 'Credit & Debit Notes', test: (i) => i.type === 'Credit Note' || i.type === 'Debit Note' },
  ].map((v) => ({ ...v, count: invoices.filter(v.test).length }));
  const viewTest = views.find((v) => v.key === savedView)?.test;

  const invAccounts = useMemo(() => {
    const ids = new Set(invoices.map((i) => i.accountId));
    return accounts.filter((a) => ids.has(a.id)).sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name }));
  }, [invoices, accounts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((i) => {
      if (viewTest && !viewTest(i)) return false;
      if (!inRange(i.invoiceDate, range)) return false;
      if (q && ![i.number, accountName(i.accountId), i.type, i.status, i.notes].some((v) => String(v).toLowerCase().includes(q))) return false;
      if (f.status && i.status !== f.status) return false;
      if (f.type && i.type !== f.type) return false;
      if (f.account && i.accountId !== f.account) return false;
      if (f.minAmt && i.amount < Number(f.minAmt)) return false;
      if (f.maxAmt && i.amount > Number(f.maxAmt)) return false;
      if (f.dueFrom && i.dueDate < f.dueFrom) return false;
      if (f.dueTo && i.dueDate > f.dueTo) return false;
      if (f.withBalance && balanceOf(i) <= 0) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, search, range, f, savedView, accountName]);

  const accessors = useMemo(() => ({ account: (i) => accountName(i.accountId), balance: balanceOf }), [accountName]);
  const table = useTable(filtered, { accessors, defaultSort: { key: 'number', dir: 'asc' }, pageSize: 10 });
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); table.setPage(1); };
  const reset = () => { setF(EMPTY); setSearch(''); setRange(DEFAULT_RANGE); setSavedView('all'); };
  const moreCount = ['minAmt', 'maxAmt', 'dueFrom', 'dueTo', 'withBalance'].filter((k) => f[k]).length;

  const k = invoiceKpis(filtered);
  const base = baselines.invoices;
  const monthSpark = (fn) => [5, 6, 7, 8, 9].map((m) => filtered.filter((i) => monthIndex(i.invoiceDate) <= m).reduce((s, i) => s + fn(i), 0) + 1);

  const statusDonut = [
    { name: 'Paid', value: k.paid, color: STATUS_COLORS.Paid },
    { name: 'Pending', value: k.pending, color: STATUS_COLORS.Pending },
    { name: 'Overdue', value: k.overdue, color: STATUS_COLORS.Overdue },
  ];
  const monthly = MONTHS.map((m, idx) => {
    const list = filtered.filter((i) => monthIndex(i.invoiceDate) === idx);
    return {
      name: m,
      paid: list.reduce((s, i) => s + Math.min(i.paidAmount, i.amount), 0),
      pending: list.filter((i) => i.status !== 'Overdue').reduce((s, i) => s + balanceOf(i), 0),
      overdue: list.filter((i) => i.status === 'Overdue').reduce((s, i) => s + balanceOf(i), 0),
    };
  });
  const typeDonut = INVOICE_TYPES.map((t) => ({ name: t, value: filtered.filter((i) => i.type === t).length, color: TYPE_COLORS[t] }));

  const nextNumber = () => {
    const max = invoices.reduce((m, i) => Math.max(m, Number(i.number.split('-').pop()) || 0), 0);
    return `INV-2026-${String(max + 1).padStart(3, '0')}`;
  };
  const accountOptions = useMemo(() => [...accounts].sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name })), [accounts]);
  const fields = [
    { name: 'number', label: 'Invoice Number', required: true, validate: (v, vals) => (invoices.some((i) => i.number === String(v).trim() && i.id !== vals.id) ? 'This invoice number is already used.' : '') },
    { name: 'accountId', label: 'Account Name', type: 'select', options: accountOptions, required: true },
    { name: 'type', label: 'Invoice Type', type: 'select', options: INVOICE_TYPES, required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'auto', label: 'Set automatically from payments & due date' }, ...INVOICE_STATUSES] },
    { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true, onChangeEffect: (v, vals) => (!vals.dueDate || vals.dueDate < v ? { dueDate: addDays(v, 15) } : {}) },
    { name: 'dueDate', label: 'Due Date', type: 'date', required: true, validate: (v, vals) => (v < vals.invoiceDate ? 'Due date can’t be before the invoice date.' : '') },
    { name: 'amount', label: 'Amount (₹)', type: 'number', min: 1, required: true },
    { name: 'paidAmount', label: 'Paid Amount (₹)', type: 'number', min: 0, validate: (v, vals) => (Number(v) > Number(vals.amount) ? 'Paid amount can’t exceed the invoice amount.' : ''), help: 'Balance is calculated automatically.' },
    { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
  ];
  const blank = () => ({ number: nextNumber(), accountId: '', type: 'Sales Invoice', status: 'auto', invoiceDate: todayISO(), dueDate: addDays(todayISO(), 15), amount: '', paidAmount: 0, notes: '' });

  useUrlActions({
    onCreate: () => setForm({ mode: 'create', record: blank() }),
    onOpen: (id) => invoices.some((i) => i.id === id) && setViewing(id),
    onParams: (p) => { if (p.status) { set('status')(p.status); setRange({ from: '', to: '' }); } },
  });

  const submit = (v) => {
    const paidAmount = Number(v.paidAmount) || 0;
    const draft = { ...v, number: v.number.trim(), paidAmount };
    draft.status = v.status === 'auto' ? deriveInvoiceStatus(draft) : v.status;
    if (form.mode === 'create') {
      createRecord('invoices', { ...draft, payments: paidAmount ? [{ id: `pay-${Date.now()}`, date: v.invoiceDate, amount: paidAmount, note: 'Recorded at creation' }] : [] });
      table.setSort({ key: 'number', dir: 'desc' });
      table.setPage(1);
      if (!inRange(v.invoiceDate, range)) setRange({ from: '', to: '' });
    } else {
      const prev = invoices.find((i) => i.id === form.record.id);
      const diff = paidAmount - (prev.paidAmount || 0);
      const payments = diff ? [...(prev.payments || []), { id: `pay-${Date.now()}`, date: todayISO(), amount: diff, note: diff > 0 ? 'Adjusted in invoice edit' : 'Payment correction' }] : prev.payments;
      updateRecord('invoices', form.record.id, { ...draft, payments });
    }
    setForm(null);
  };

  const recordPayment = ({ amount, date, note }) => {
    const inv = invoices.find((i) => i.id === payFor);
    const paidAmount = Math.min(inv.amount, inv.paidAmount + Number(amount));
    const next = { ...inv, paidAmount };
    updateRecord('invoices', inv.id, { paidAmount, status: deriveInvoiceStatus(next), payments: [...(inv.payments || []), { id: `pay-${Date.now()}`, date, amount: Number(amount), note }] });
    toast.success(`Payment of ${fmtINR(amount)} recorded for ${inv.number}`);
    setPayFor(null);
  };

  const setStatus = (inv, status) => {
    if (status === 'Paid' && balanceOf(inv) > 0) {
      updateRecord('invoices', inv.id, { status, paidAmount: inv.amount, payments: [...(inv.payments || []), { id: `pay-${Date.now()}`, date: todayISO(), amount: balanceOf(inv), note: 'Marked as paid' }] });
    } else if (status === 'Partially Paid' && inv.paidAmount <= 0) {
      setPayFor(inv.id);
    } else updateRecord('invoices', inv.id, { status });
  };

  const runOverdueCheck = () => {
    const today = todayISO();
    const due = invoices.filter((i) => balanceOf(i) > 0 && i.dueDate < today && i.status !== 'Overdue');
    due.forEach((i) => updateRecord('invoices', i.id, { status: 'Overdue' }));
    toast[due.length ? 'success' : 'info'](due.length ? `${due.length} invoice${due.length > 1 ? 's' : ''} marked overdue` : 'No unpaid invoices are past their due date.');
  };

  const exportRows = (rows) => exportCSV('invoices', rows, [
    { label: 'Invoice Number', value: (i) => i.number }, { label: 'Account Name', value: (i) => accountName(i.accountId) }, { label: 'Invoice Type', value: (i) => i.type },
    { label: 'Invoice Date', value: (i) => i.invoiceDate }, { label: 'Due Date', value: (i) => i.dueDate }, { label: 'Amount (INR)', value: (i) => i.amount },
    { label: 'Paid Amount (INR)', value: (i) => i.paidAmount }, { label: 'Balance (INR)', value: balanceOf }, { label: 'Status', value: (i) => i.status },
  ]);

  const statusMenu = (inv, trigger) => (
    <Dropdown width={190} trigger={trigger}>
      {(close) => (<><MenuLabel>Update payment status</MenuLabel>{INVOICE_STATUSES.map((s) => <MenuItem key={s} close={close} active={s === inv.status} onClick={() => s !== inv.status && setStatus(inv, s)}>{s}</MenuItem>)}</>)}
    </Dropdown>
  );

  const columns = [
    { key: 'number', header: 'Invoice Number', sortable: true, render: (i) => <button onClick={() => setViewing(i.id)} className="text-primary hover:underline whitespace-nowrap">{i.number}</button> },
    { key: 'account', header: 'Account Name', sortable: true, render: (i) => <Link to={`/accounts?open=${i.accountId}`} className="text-ink-600 hover:text-primary whitespace-nowrap">{accountName(i.accountId)}</Link> },
    { key: 'type', header: 'Invoice Type', sortable: true, render: (i) => <StatusBadge kind="invoiceType" value={i.type} size="sm" className="min-w-[96px]" /> },
    { key: 'invoiceDate', header: 'Invoice Date', sortable: true, className: 'whitespace-nowrap', render: (i) => fmtDate(i.invoiceDate) },
    { key: 'dueDate', header: 'Due Date', sortable: true, className: 'whitespace-nowrap', render: (i) => <span className={balanceOf(i) > 0 && i.dueDate < todayISO() ? 'text-danger-700' : ''}>{fmtDate(i.dueDate)}</span> },
    { key: 'amount', header: 'Amount (₹)', sortable: true, render: (i) => fmtNum(i.amount) },
    { key: 'paidAmount', header: 'Paid Amount (₹)', sortable: true, render: (i) => fmtNum(i.paidAmount) },
    { key: 'balance', header: 'Balance (₹)', sortable: true, render: (i) => <span className={balanceOf(i) ? 'text-ink' : ''}>{fmtNum(balanceOf(i))}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (i) => statusMenu(i, <button type="button" title="Update payment status" className={`inline-flex items-center justify-center h-[22px] min-w-[66px] px-2 rounded-md text-[12px] font-medium whitespace-nowrap ${badgeTone('invoiceStatus', i.status)}`}>{i.status}</button>) },
    { key: 'actions', header: 'Actions', align: 'center', render: (i) => (
      <div className="flex items-center justify-center gap-1">
        <button className="p-1.5 rounded-md text-ink-600 hover:bg-page hover:text-primary" onClick={() => setViewing(i.id)} aria-label={`View ${i.number}`}><Eye size={16} /></button>
        <button className="p-1.5 rounded-md text-ink-600 hover:bg-page hover:text-primary" onClick={() => setForm({ mode: 'edit', record: i })} aria-label={`Edit ${i.number}`}><Pencil size={15} /></button>
        <ActionMenu boxed={false} items={[
          { label: 'Record payment', icon: Wallet, disabled: balanceOf(i) <= 0, onClick: () => setPayFor(i.id) },
          { label: 'Mark as paid', icon: BadgeCheck, disabled: i.status === 'Paid', onClick: () => setStatus(i, 'Paid') },
          { label: 'Mark as overdue', icon: AlarmClock, disabled: i.status === 'Overdue' || balanceOf(i) <= 0, onClick: () => setStatus(i, 'Overdue') },
          { divider: true },
          { label: 'Delete invoice', icon: Trash2, danger: true, onClick: () => setConfirm({ ids: [i.id], label: i.number }) },
        ]} />
      </div>
    ) },
  ];

  const rec = invoices.find((i) => i.id === viewing);
  const payInv = invoices.find((i) => i.id === payFor);
  const selectedIds = [...table.selected];


  return (
    <div>
      <PageHeader
        views={views} view={savedView} onViewChange={(v) => { setSavedView(v); table.setPage(1); }}
        tabMenu={[{ label: 'Export filtered invoices (CSV)', icon: Download, onClick: () => exportRows(table.sorted) }, { label: 'Check for overdue invoices', icon: AlarmClock, onClick: runOverdueCheck }, { label: 'Reset filters', onClick: reset }]}
        toolbar={{
          filterActive: filtersOpen, onFilter: () => setFiltersOpen((o) => !o),
          sortOptions: [{ key: 'number', label: 'Invoice Number' }, { key: 'invoiceDate', label: 'Invoice Date' }, { key: 'dueDate', label: 'Due Date' }, { key: 'amount', label: 'Amount' }, { key: 'balance', label: 'Balance' }],
          sort: table.sort, onSort: table.setSort, layouts: ['list', 'kanban', 'grid', 'chart'], layout, onLayout: setLayout,
          onRefresh: refresh, refreshing, dense, onDense: () => setDense((d) => !d), module: 'Finance',
          primary: { label: 'Create Invoice', onClick: () => setForm({ mode: 'create', record: blank() }), menu: [
            { label: 'Create Invoice', icon: Plus, onClick: () => setForm({ mode: 'create', record: blank() }) },
            { label: 'Create Credit Note', icon: Receipt, onClick: () => setForm({ mode: 'create', record: { ...blank(), type: 'Credit Note' } }) },
            { label: 'Export invoices (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
          ] },
          moreItems: [
            { label: 'Check for overdue invoices', icon: AlarmClock, onClick: runOverdueCheck },
            { label: 'Export selected (CSV)', icon: Download, disabled: !selectedIds.length, onClick: () => exportRows(invoices.filter((i) => table.selected.has(i.id))) },
            { label: 'Delete selected', icon: Trash2, danger: true, disabled: !selectedIds.length, onClick: () => setConfirm({ ids: selectedIds, label: `${selectedIds.length} invoices` }) },
          ],
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 mb-3">
        <StatCard icon={FileText} tone="violet" label="Total Invoices" value={k.count} trend={trend(k.count, base.count)} spark={monthSpark(() => 1)} onClick={reset} />
        <StatCard icon={IndianRupee} tone="green" tinted label="Total Invoice Amount" value={fmtINR(k.total)} trend={trend(k.total, base.total)} spark={monthSpark((i) => i.amount)} />
        <StatCard icon={BadgeCheck} tone="amber" label="Paid Amount" value={fmtINR(k.paid)} trend={trend(k.paid, base.paid)} spark={monthSpark((i) => i.paidAmount)} onClick={() => set('status')('Paid')} />
        <StatCard icon={AlarmClock} tone="red" tinted label="Pending Amount" value={fmtINR(k.pending)} trend={trend(k.pending, base.pending)} invertTrend spark={monthSpark((i) => (i.status !== 'Overdue' ? balanceOf(i) : 0))} onClick={() => setSavedView('unpaid')} />
        <StatCard icon={FileText} tone="blue" tinted label="Overdue Amount" value={fmtINR(k.overdue)} trend={trend(k.overdue, base.overdue)} invertTrend spark={monthSpark((i) => (i.status === 'Overdue' ? balanceOf(i) : 0))} onClick={() => set('status')('Overdue')} />
      </div>

      <div className="flex gap-3 items-start">
        {filtersOpen && (
          <aside className="card hidden md:block w-[220px] shrink-0 px-3.5 py-4 sticky top-[72px] max-h-[calc(100vh-86px)] overflow-y-auto thin-scroll">
             <div className="flex items-center justify-between mb-3">
               <h2 className="text-[15px] font-semibold text-ink whitespace-nowrap">Filter Invoices by</h2>
               {(moreCount > 0 || search || range.from !== DEFAULT_RANGE.from || range.to !== DEFAULT_RANGE.to) && <button onClick={reset} className="text-[12.5px] text-primary hover:underline">Clear</button>}
             </div>
             
             <div className="relative mb-5">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-2.5 text-ink-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
               <input type="text" placeholder="Search" className="w-full h-9 pl-8 pr-3 text-[13px] border border-line rounded-md focus:border-primary outline-none" value={search} onChange={(e) => { setSearch(e.target.value); table.setPage(1); }} />
             </div>

             <details className="group" open>
               <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                 <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                 Filter By Fields
               </summary>
               <div className="pl-5 pb-4 space-y-3">
                  {[
                    'Account Name', 'Adjustments', 'Balance', 'Client Viewed', 'Contact Name', 
                    'Created By', 'Created Time', 'Deal Name', 'Discount Amount', 'Discount Percentage', 
                    'Due Date', 'Exchange Rate (Invoice)', 'Grand Total', 'Invoice Date', 'Invoice ID', 
                    'Invoice Number', 'Invoice Owner', 'Last Activity Time', 'Modified By'
                  ].map(lbl => (
                    <label key={lbl} className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                      <input type="checkbox" className="cb mt-0.5" />
                      {lbl}
                    </label>
                  ))}
               </div>
             </details>
          </aside>
        )}

        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr_1fr] gap-3 mb-3">
            <ChartCard title="Invoice Status (Amount)" icon={Layers} extra={<ActionMenu boxed={false} items={[{ label: 'Show unpaid only', onClick: () => setSavedView('unpaid') }, { label: 'Show overdue only', onClick: () => set('status')('Overdue') }, { label: 'Export invoices (CSV)', icon: Download, onClick: () => exportRows(table.sorted) }]} />}>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-[190px] shrink-0"><DonutChart data={statusDonut} centerValue={fmtCompact(k.total)} centerLabel="Total Amount" height={190} inner="58%" valueFormatter={(v) => fmtINR(v)} onSliceClick={(s) => (s === 'Pending' ? setSavedView('unpaid') : set('status')(s))} /></div>
                <ul className="flex-1 space-y-3 w-full">
                  {statusDonut.map((s) => (
                    <li key={s.name} className="text-[13px]">
                      <div className="flex items-center gap-2 text-ink-600"><span className="h-3 w-3 rounded-full" style={{ background: s.color }} />{s.name}</div>
                      <div className="pl-5 font-semibold text-ink">{fmtINR(s.value)} ({p0(pct(s.value, k.total))})</div>
                    </li>
                  ))}
                </ul>
              </div>
            </ChartCard>
            <ChartCard title="Monthly Revenue (₹)" icon={Layers} extra={<ActionMenu boxed={false} items={[{ label: 'Export monthly revenue (CSV)', icon: Download, onClick: () => exportCSV('monthly-revenue', monthly, [{ label: 'Month', value: (r) => r.name }, { label: 'Paid', value: (r) => r.paid }, { label: 'Pending', value: (r) => r.pending }, { label: 'Overdue', value: (r) => r.overdue }]) }]} />}>
              <BarChart data={monthly} height={200} legend barSize={16} yFormatter={axisCompact} valueFormatter={(v) => fmtINR(v)} yWidth={42}
                bars={[{ key: 'paid', name: 'Paid', color: STATUS_COLORS.Paid, stackId: 'a' }, { key: 'pending', name: 'Pending', color: STATUS_COLORS.Pending, stackId: 'a' }, { key: 'overdue', name: 'Overdue', color: STATUS_COLORS.Overdue, stackId: 'a', top: true }]} />
            </ChartCard>
            <ChartCard title="Invoices by Type" icon={LayoutGrid} extra={<ActionMenu boxed={false} items={INVOICE_TYPES.map((t) => ({ label: `Show ${t}s`, onClick: () => set('type')(t) }))} />}>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-[180px] shrink-0"><DonutChart data={typeDonut} centerValue={k.count} centerLabel="Total Invoices" height={180} valueFormatter={(v) => `${v} invoices`} onSliceClick={(t) => set('type')(t)} /></div>
                <DonutLegend className="flex-1 w-full" items={typeDonut.map((t) => ({ name: t.name, color: t.color, right: `${t.value} (${p0(pct(t.value, k.count))})` }))} />
              </div>
            </ChartCard>
          </div>

          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <h2 className="text-[17px] font-semibold text-ink">Invoice List</h2>
              <Dropdown width={210} align="right" trigger={<button className="h-9 px-3 rounded-lg border border-line text-primary text-[13.5px] font-medium inline-flex items-center gap-1.5 hover:bg-primary-50"><Upload size={15} />Export<ChevronDown size={14} /></button>}>
                {(close) => (<>
                  <MenuItem icon={Download} close={close} onClick={() => exportRows(table.sorted)}>Filtered invoices (CSV)</MenuItem>
                  <MenuItem icon={Download} close={close} onClick={() => exportRows(invoices)}>All invoices (CSV)</MenuItem>
                  <MenuItem icon={Download} close={close} disabled={!selectedIds.length} onClick={() => exportRows(invoices.filter((i) => table.selected.has(i.id)))}>Selected invoices (CSV)</MenuItem>
                </>)}
              </Dropdown>
            </div>
        <BulkBar count={selectedIds.length} onClear={table.clearSelection}>
          <BulkButton icon={BadgeCheck} onClick={() => { selectedIds.forEach((id) => { const i = invoices.find((x) => x.id === id); if (i.status !== 'Paid') setStatus(i, 'Paid'); }); table.clearSelection(); }}>Mark as paid</BulkButton>
          <BulkButton icon={Download} onClick={() => exportRows(invoices.filter((i) => table.selected.has(i.id)))}>Export</BulkButton>
          <BulkButton icon={Trash2} danger onClick={() => setConfirm({ ids: selectedIds, label: `${selectedIds.length} invoices` })}>Delete</BulkButton>
        </BulkBar>
        {layout === 'list' && <DataTable columns={columns} rows={table.pageRows} table={table} showIndex={false} loading={refreshing} dense={dense} minWidth={1180}
          emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Create Invoice</button>} />}
        {layout === 'kanban' && <div className="p-3"><KanbanView groups={INVOICE_STATUSES.map((s) => ({ key: s, label: s, color: STATUS_COLORS[s] }))} rows={table.sorted} groupOf={(i) => i.status}
          onMove={setStatus} onCardClick={(i) => setViewing(i.id)} summary={(items) => `${fmtCompact(items.reduce((s, i) => s + balanceOf(i), 0))} outstanding`}
          renderCard={(i) => (<div><div className="flex items-center justify-between"><span className="text-[13.5px] font-semibold text-primary">{i.number}</span><StatusBadge kind="invoiceType" value={i.type} size="sm" /></div><div className="text-[12px] text-ink-500 mt-1">{accountName(i.accountId)} · due {fmtDate(i.dueDate)}</div><div className="flex justify-between mt-2 text-[12.5px]"><span className="text-ink">{fmtINR(i.amount)}</span><span className="text-ink-500">Bal {fmtINR(balanceOf(i))}</span></div></div>)} /></div>}
        {layout === 'grid' && <div className="p-3"><GridView rows={table.pageRows} onCardClick={(i) => setViewing(i.id)} renderCard={(i) => (
          <>
            <div className="flex items-center justify-between"><span className="font-semibold text-primary">{i.number}</span><StatusBadge kind="invoiceStatus" value={i.status} size="sm" /></div>
            <div className="text-[12.5px] text-ink-500 mt-1">{accountName(i.accountId)}</div>
            <div className="text-[19px] font-bold text-ink mt-3">{fmtINR(i.amount)}</div>
            <div className="h-1.5 rounded-full bg-[#EEF2F8] mt-2 overflow-hidden"><div className="h-full bg-success" style={{ width: `${pct(i.paidAmount, i.amount)}%` }} /></div>
            <div className="flex justify-between mt-2 text-[12px] text-ink-500"><span>Paid {fmtINR(i.paidAmount)}</span><span>Due {fmtDate(i.dueDate)}</span></div>
          </>
        )} /></div>}
        {layout === 'chart' && <ChartView title="Invoice count by status (filtered)" data={INVOICE_STATUSES.map((s) => ({ name: s, value: filtered.filter((i) => i.status === s).length, color: STATUS_COLORS[s] }))} valueLabel="Invoices" />}
        {(layout === 'list' || layout === 'grid') && <div className="px-4"><Pagination table={table} noun="invoices" options={[10, 25, 50, 100]} /></div>}
      </section>
        </div>
      </div>

      <FormModal open={!!form} onClose={() => setForm(null)} title={form?.mode === 'edit' ? `Edit ${form.record.number}` : 'Create invoice'} subtitle="Balance and status are recalculated from the amount, payments and due date." fields={fields}
        initial={form?.record} onSubmit={submit} submitLabel={form?.mode === 'edit' ? 'Save changes' : 'Create invoice'} />
      <FormModal open={!!payInv} onClose={() => setPayFor(null)} size="sm" title="Record payment" subtitle={payInv && `${payInv.number} · balance ${fmtINR(balanceOf(payInv))}`}
        initial={payInv ? { amount: balanceOf(payInv), date: todayISO(), note: 'Bank transfer' } : null} submitLabel="Record payment"
        fields={[
          { name: 'amount', label: 'Amount received (₹)', type: 'number', min: 1, required: true, span: 2, validate: (v) => (payInv && Number(v) > balanceOf(payInv) ? `Can’t exceed the balance of ${fmtINR(balanceOf(payInv))}.` : '') },
          { name: 'date', label: 'Payment date', type: 'date', required: true },
          { name: 'note', label: 'Reference / mode' },
        ]}
        onSubmit={recordPayment} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title="Delete invoices?" message={confirm ? `Delete ${confirm.label}? Finance totals and charts update immediately.` : ''}
        onConfirm={() => { deleteRecords('invoices', confirm.ids); table.clearSelection(); setViewing(null); }} />

      <Drawer open={!!rec} onClose={() => setViewing(null)} width={540}
        title={rec && <div><h2 className="text-[17px] font-semibold text-ink">{rec.number}</h2><p className="text-[13px] text-ink-500">{rec.type} · {accountName(rec.accountId)}</p></div>}
        footer={rec && (<>
          <button className="btn-secondary text-danger-700" onClick={() => setConfirm({ ids: [rec.id], label: rec.number })}><Trash2 size={15} />Delete</button>
          <button className="btn-secondary" disabled={balanceOf(rec) <= 0} onClick={() => setPayFor(rec.id)}><Wallet size={15} />Record payment</button>
          <button className="btn-primary" onClick={() => setForm({ mode: 'edit', record: rec })}><Pencil size={15} />Edit</button>
        </>)}>
        {rec && (
          <>
            <div className="rounded-xl border border-line p-4 bg-[#FAFCFF]">
              <div className="flex items-start justify-between">
                <div><div className="text-[12px] text-ink-500">Billed to</div><div className="text-[15px] font-semibold text-ink">{accountName(rec.accountId)}</div><div className="text-[12.5px] text-ink-500">{accountsById[rec.accountId]?.location}</div></div>
                <div className="text-right">
                  {statusMenu(rec, <button className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12.5px] font-medium ${badgeTone('invoiceStatus', rec.status)}`}>{rec.status}<ChevronDown size={13} /></button>)}
                  <div className="text-[12px] text-ink-500 mt-1.5">Issued {fmtDate(rec.invoiceDate)}</div><div className="text-[12px] text-ink-500">Due {fmtDate(rec.dueDate)}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[['Amount', rec.amount, 'text-ink'], ['Paid', rec.paidAmount, 'text-success-700'], ['Balance', balanceOf(rec), balanceOf(rec) ? 'text-danger-700' : 'text-ink']].map(([l, v, c]) => (
                  <div key={l} className="bg-white border border-line rounded-lg px-3 py-2"><div className="text-[11.5px] text-ink-500">{l}</div><div className={`text-[15px] font-semibold ${c}`}>{fmtINR(v)}</div></div>
                ))}
              </div>
              <div className="h-2 rounded-full bg-[#EEF2F8] mt-3 overflow-hidden"><div className="h-full bg-success" style={{ width: `${pct(rec.paidAmount, rec.amount)}%` }} /></div>
              <div className="text-[12px] text-ink-500 mt-1">{p0(pct(rec.paidAmount, rec.amount))} collected</div>
            </div>
            {rec.notes && <><SectionTitle>Notes</SectionTitle><p className="text-[13px] text-ink-600">{rec.notes}</p></>}
            <SectionTitle extra={<span className="text-[12px] text-ink-500">{(rec.payments || []).length}</span>}>Payment history</SectionTitle>
            {(rec.payments || []).length === 0 ? <p className="text-[13px] text-ink-500">No payments recorded yet.</p> : (
              <ul className="divide-y divide-line-soft border border-line rounded-lg">
                {[...rec.payments].reverse().map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-3 py-2.5 text-[13px]"><span><span className="text-ink">{fmtDate(p.date)}</span><span className="text-ink-500"> · {p.note}</span></span><span className={`font-semibold ${p.amount < 0 ? 'text-danger-700' : 'text-success-700'}`}>{fmtINR(p.amount)}</span></li>
                ))}
              </ul>
            )}
            <p className="text-[12px] text-ink-400 mt-5">This is a standalone finance simulation inside the CRM. It is not connected to Zoho Finance.</p>
          </>
        )}
      </Drawer>
    </div>
  );
}
