import React, { useState } from 'react';
import {
  X, Printer, Layout, Sliders, Check, FileText, ArrowRight,
  Eye, Building2, Calendar, User, DollarSign, Sparkles
} from 'lucide-react';
import { fmtINR, fmtDate, dealKpis, fmtCompact } from '../../utils/calculations';

const DEFAULT_PRINT_COLS = [
  { key: 'name', label: 'Deal Name' },
  { key: 'account', label: 'Account Name' },
  { key: 'amount', label: 'Amount' },
  { key: 'stage', label: 'Stage' },
  { key: 'closingDate', label: 'Closing Date' },
  { key: 'owner', label: 'Owner' },
];

export default function PrintViewModal({
  open,
  onClose,
  initialMode = 'default', // 'default' | 'canvas'
  deals = [],
  accountName,
  contactName,
  userName,
}) {
  const [mode, setMode] = useState(initialMode);

  // Canvas Customization Options
  const [reportTitle, setReportTitle] = useState('Deals Pipeline Report');
  const [reportSubtitle, setReportSubtitle] = useState('Confidential & Internal - Generated ' + new Date().toLocaleDateString());
  const [orientation, setOrientation] = useState('landscape'); // 'portrait' | 'landscape'
  const [showKpis, setShowKpis] = useState(true);
  const [showZebra, setShowZebra] = useState(true);
  const [fontSize, setFontSize] = useState('normal'); // 'compact' | 'normal' | 'spacious'
  const [selectedCols, setSelectedCols] = useState(new Set(['name', 'account', 'amount', 'stage', 'closingDate', 'owner']));

  if (!open) return null;

  const kpis = dealKpis(deals);

  const toggleCol = (colKey) => {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      if (next.has(colKey)) {
        if (next.size > 1) next.delete(colKey);
      } else {
        next.add(colKey);
      }
      return next;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-xs p-3 sm:p-5" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[1180px] max-w-full h-[92vh] flex flex-col overflow-hidden border border-line"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar (Hidden in physical print) */}
        <div className="px-6 py-3.5 border-b border-line flex flex-wrap items-center justify-between gap-3 bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center">
              <Printer size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-ink">Print Deals</h2>
              <p className="text-[12px] text-ink-500">
                {mode === 'default' ? 'Clean print preview ready for printer or PDF' : 'Customizable canvas layout editor'}
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300 text-[12.5px] font-semibold">
            <button
              type="button"
              onClick={() => setMode('default')}
              className={`px-3 py-1 rounded-md transition-colors ${
                mode === 'default' ? 'bg-white text-primary shadow-xs' : 'text-ink-600 hover:text-ink'
              }`}
            >
              Print Default View
            </button>
            <button
              type="button"
              onClick={() => setMode('canvas')}
              className={`px-3 py-1 rounded-md transition-colors ${
                mode === 'canvas' ? 'bg-white text-primary shadow-xs' : 'text-ink-600 hover:text-ink'
              }`}
            >
              Print Using Canvas
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary h-8 px-4 rounded-md text-[13px] font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Printer size={14} />
              <span>Print Document</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-ink-400 hover:text-ink hover:bg-slate-200/60 rounded-md">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODE 1: Print Default View */}
        {mode === 'default' && (
          <div className="flex-1 overflow-y-auto p-8 thin-scroll bg-slate-100 flex justify-center">
            <div className="w-[850px] max-w-full bg-white shadow-md rounded-lg p-8 border border-slate-200 text-ink">
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
                <div>
                  <h1 className="text-[22px] font-bold text-slate-900 uppercase tracking-tight">Deals Pipeline</h1>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">Summary of Deals records and stage distribution</p>
                </div>
                <div className="text-right text-[11.5px] text-slate-500">
                  <p>Date: <strong className="text-slate-800">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></p>
                  <p>Total Records: <strong className="text-slate-800">{deals.length}</strong></p>
                </div>
              </div>

              {/* KPI Summary Block */}
              <div className="grid grid-cols-5 gap-3 mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-slate-500 block">Total Deals</span>
                  <span className="text-[16px] font-bold text-slate-900 mt-0.5 block">{kpis.total}</span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-slate-500 block">Pipeline Value</span>
                  <span className="text-[16px] font-bold text-slate-900 mt-0.5 block">{fmtCompact(kpis.pipeline)}</span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-slate-500 block">Won Deals</span>
                  <span className="text-[16px] font-bold text-emerald-700 mt-0.5 block">{kpis.won}</span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-slate-500 block">Lost Deals</span>
                  <span className="text-[16px] font-bold text-rose-700 mt-0.5 block">{kpis.lost}</span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-slate-500 block">Open Deals</span>
                  <span className="text-[16px] font-bold text-blue-700 mt-0.5 block">{kpis.open}</span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-[12px] text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-700 font-bold uppercase text-[10.5px]">
                    <th className="py-2 px-1">Deal Name</th>
                    <th className="py-2 px-1">Account</th>
                    <th className="py-2 px-1 text-right">Amount (₹)</th>
                    <th className="py-2 px-1">Stage</th>
                    <th className="py-2 px-1">Closing Date</th>
                    <th className="py-2 px-1">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {deals.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-1 font-semibold text-slate-900">{d.name}</td>
                      <td className="py-2 px-1 text-slate-600">{accountName(d.accountId) || '—'}</td>
                      <td className="py-2 px-1 text-right font-bold text-slate-900">{fmtINR(d.amount)}</td>
                      <td className="py-2 px-1 text-slate-700 font-medium">{d.stage}</td>
                      <td className="py-2 px-1 text-slate-600">{fmtDate(d.closingDate)}</td>
                      <td className="py-2 px-1 text-slate-600">{userName(d.ownerId)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-300 mt-6 pt-3 text-[11px] text-slate-400 flex justify-between">
                <span>Enterprise CRM Application — Deals Report</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: Print Using Canvas (Customizable Editor) */}
        {mode === 'canvas' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Controls Sidebar */}
            <div className="w-full lg:w-80 shrink-0 border-r border-line p-5 overflow-y-auto thin-scroll space-y-5 bg-slate-50 print:hidden">
              <div>
                <h3 className="text-[13.5px] font-bold text-ink mb-2">Canvas Options</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11.5px] font-semibold text-ink-500 uppercase tracking-wider block mb-1">Report Title</label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="w-full h-8 px-2.5 text-[12.5px] border border-line rounded-md bg-white focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-semibold text-ink-500 uppercase tracking-wider block mb-1">Subtitle / Notes</label>
                    <input
                      type="text"
                      value={reportSubtitle}
                      onChange={(e) => setReportSubtitle(e.target.value)}
                      className="w-full h-8 px-2.5 text-[12.5px] border border-line rounded-md bg-white focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Layout controls */}
              <div className="pt-3 border-t border-line space-y-3">
                <h4 className="text-[12.5px] font-bold text-ink">Page Layout</h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`flex-1 py-1.5 text-[12px] font-semibold rounded-md border text-center ${
                      orientation === 'portrait' ? 'bg-primary text-white border-primary' : 'bg-white border-line text-ink-600'
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`flex-1 py-1.5 text-[12px] font-semibold rounded-md border text-center ${
                      orientation === 'landscape' ? 'bg-primary text-white border-primary' : 'bg-white border-line text-ink-600'
                    }`}
                  >
                    Landscape
                  </button>
                </div>

                <div className="space-y-2 pt-1 text-[12.5px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="cb" checked={showKpis} onChange={(e) => setShowKpis(e.target.checked)} />
                    <span className="text-ink-700">Include KPI Summary Cards</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="cb" checked={showZebra} onChange={(e) => setShowZebra(e.target.checked)} />
                    <span className="text-ink-700">Zebra Striped Rows</span>
                  </label>
                </div>
              </div>

              {/* Columns Selector */}
              <div className="pt-3 border-t border-line space-y-2">
                <h4 className="text-[12.5px] font-bold text-ink">Visible Columns</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto thin-scroll">
                  {DEFAULT_PRINT_COLS.map((col) => {
                    const checked = selectedCols.has(col.key);
                    return (
                      <label key={col.key} className="flex items-center gap-2 cursor-pointer text-[12px] hover:bg-white p-1 rounded">
                        <input
                          type="checkbox"
                          className="cb"
                          checked={checked}
                          onChange={() => toggleCol(col.key)}
                        />
                        <span className={checked ? 'font-semibold text-primary' : 'text-ink-600'}>{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full btn-primary h-9 rounded-md text-[13px] font-bold flex items-center justify-center gap-2 shadow-xs"
                >
                  <Printer size={15} />
                  <span>Print Canvas</span>
                </button>
              </div>
            </div>

            {/* Right Live Canvas Preview Area */}
            <div className="flex-1 overflow-auto p-8 thin-scroll bg-slate-200/60 flex justify-center items-start">
              <div
                className={`bg-white shadow-xl rounded-lg p-8 border border-slate-300 text-ink transition-all ${
                  orientation === 'landscape' ? 'w-[1020px]' : 'w-[750px]'
                }`}
              >
                {/* Canvas Header */}
                <div className="border-b-2 border-slate-900 pb-3 mb-5 flex items-start justify-between">
                  <div>
                    <h1 className="text-[20px] font-extrabold text-slate-900 tracking-tight">{reportTitle}</h1>
                    <p className="text-[12px] text-slate-500 mt-0.5">{reportSubtitle}</p>
                  </div>
                  <div className="text-right text-[11.5px] text-slate-500">
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
                      {deals.length} Deals
                    </span>
                  </div>
                </div>

                {/* Optional KPI Blocks */}
                {showKpis && (
                  <div className="grid grid-cols-4 gap-3 mb-5 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Deals</span>
                      <span className="text-[15px] font-extrabold text-slate-900 block mt-0.5">{kpis.total}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Pipeline</span>
                      <span className="text-[15px] font-extrabold text-slate-900 block mt-0.5">{fmtCompact(kpis.pipeline)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Won</span>
                      <span className="text-[15px] font-extrabold text-emerald-700 block mt-0.5">{kpis.won}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Open</span>
                      <span className="text-[15px] font-extrabold text-blue-700 block mt-0.5">{kpis.open}</span>
                    </div>
                  </div>
                )}

                {/* Canvas Table */}
                <table className="w-full text-[11.5px] text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                      {selectedCols.has('name') && <th className="py-2 px-1.5">Deal Name</th>}
                      {selectedCols.has('account') && <th className="py-2 px-1.5">Account</th>}
                      {selectedCols.has('amount') && <th className="py-2 px-1.5 text-right">Amount</th>}
                      {selectedCols.has('stage') && <th className="py-2 px-1.5">Stage</th>}
                      {selectedCols.has('closingDate') && <th className="py-2 px-1.5">Closing Date</th>}
                      {selectedCols.has('owner') && <th className="py-2 px-1.5">Owner</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deals.map((d, i) => (
                      <tr key={d.id} className={showZebra && i % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                        {selectedCols.has('name') && (
                          <td className="py-2 px-1.5 font-semibold text-slate-900">{d.name}</td>
                        )}
                        {selectedCols.has('account') && (
                          <td className="py-2 px-1.5 text-slate-600">{accountName(d.accountId) || '—'}</td>
                        )}
                        {selectedCols.has('amount') && (
                          <td className="py-2 px-1.5 text-right font-bold text-slate-900">{fmtINR(d.amount)}</td>
                        )}
                        {selectedCols.has('stage') && (
                          <td className="py-2 px-1.5 text-slate-700 font-medium">{d.stage}</td>
                        )}
                        {selectedCols.has('closingDate') && (
                          <td className="py-2 px-1.5 text-slate-600">{fmtDate(d.closingDate)}</td>
                        )}
                        {selectedCols.has('owner') && (
                          <td className="py-2 px-1.5 text-slate-600">{userName(d.ownerId)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Canvas Footer */}
                <div className="border-t border-slate-200 mt-6 pt-3 text-[10.5px] text-slate-400 flex justify-between">
                  <span>Deals Module — Custom Canvas Print</span>
                  <span>{deals.length} records printed</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

