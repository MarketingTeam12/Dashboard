import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Save, Plus, Undo2, Download, Search, Check, FileSpreadsheet,
  Trash2, AlertCircle, Sparkles, Building2
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { STAGES, fmtINR, todayISO } from '../../utils/calculations';
import { DEAL_SOURCES } from '../../data/seedData';

export default function SheetViewModal({
  open,
  onClose,
  deals = [],
  accounts = [],
  users = [],
  accountName,
  userName,
  onSaveUpdates,
}) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [dirtyRowIds, setDirtyRowIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRows(deals.map((d) => ({ ...d })));
      setDirtyRowIds(new Set());
      setSearch('');
    }
  }, [open, deals]);

  if (!open) return null;

  const handleCellChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          if (field === 'amount') {
            updated.amount = Number(value) || 0;
          }
          if (field === 'probability') {
            updated.probability = Number(value) || 0;
          }
          return updated;
        }
        return r;
      })
    );
    setDirtyRowIds((prev) => new Set(prev).add(id));
  };

  const handleAddRow = () => {
    const newId = `new_${Date.now()}`;
    const newRow = {
      id: newId,
      name: 'New Deal ' + (rows.length + 1),
      accountId: accounts[0]?.id || '',
      amount: 100000,
      stage: 'Need Deals Estimation _Pending Info',
      closingDate: todayISO(),
      probability: 20,
      ownerId: users[0]?.id || 'u1',
      source: 'Website',
      isNew: true,
    };
    setRows([newRow, ...rows]);
    setDirtyRowIds((prev) => new Set(prev).add(newId));
  };

  const handleSave = () => {
    if (dirtyRowIds.size === 0) {
      toast.info('No changes to save.');
      return;
    }

    setIsSaving(true);
    const updated = rows.filter((r) => dirtyRowIds.has(r.id));
    onSaveUpdates(updated);
    toast.success(`Saved changes to ${updated.length} deals in backend!`);
    setIsSaving(false);
    setDirtyRowIds(new Set());
    onClose();
  };

  const handleReset = () => {
    setRows(deals.map((d) => ({ ...d })));
    setDirtyRowIds(new Set());
    toast.info('Reverted all unsaved edits.');
  };

  const filteredRows = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      accountName(r.accountId)?.toLowerCase().includes(q) ||
      r.stage?.toLowerCase().includes(q) ||
      userName(r.ownerId)?.toLowerCase().includes(q)
    );
  });

  const totalValue = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-3 sm:p-5" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[1280px] max-w-full h-[90vh] flex flex-col overflow-hidden border border-line"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-line flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-ink">Sheet View — Deals Spreadsheet</h2>
                {dirtyRowIds.size > 0 && (
                  <span className="text-[11.5px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                    {dirtyRowIds.size} unsaved edits
                  </span>
                )}
              </div>
              <p className="text-[12px] text-ink-500">
                Click any cell to edit inline. Changes update existing deals in the database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="btn-secondary h-8 px-3 rounded-md text-[12.5px] flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Row</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={dirtyRowIds.size === 0}
              className="btn-secondary h-8 px-3 rounded-md text-[12.5px] flex items-center gap-1.5 disabled:opacity-40"
            >
              <Undo2 size={13} />
              <span>Discard</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={dirtyRowIds.size === 0 || isSaving}
              className="btn-primary h-8 px-4 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 disabled:opacity-40"
            >
              <Save size={14} />
              <span>{isSaving ? 'Saving...' : `Save Changes (${dirtyRowIds.size})`}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-ink-400 hover:text-ink hover:bg-slate-200/60 rounded-md ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="px-6 py-2.5 border-b border-line bg-white flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 text-ink-400" size={14} />
            <input
              type="text"
              placeholder="Search in sheet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-[12.5px] border border-line rounded-md focus:border-primary outline-none"
            />
          </div>

          <div className="flex items-center gap-4 text-ink-600 font-medium">
            <span>Total Rows: <strong className="text-ink">{rows.length}</strong></span>
            <span>Filtered: <strong className="text-ink">{filteredRows.length}</strong></span>
            <span>Total Pipeline: <strong className="text-ink">{fmtINR(totalValue)}</strong></span>
          </div>
        </div>

        {/* Editable Spreadsheet Grid */}
        <div className="flex-1 overflow-auto thin-scroll bg-slate-50/30">
          <table className="w-full text-[12.5px] text-left border-collapse select-none">
            <thead className="bg-[#F1F5F9] border-b border-line text-ink-600 font-bold sticky top-0 z-10">
              <tr>
                <th className="w-10 px-2 py-2 text-center border-r border-line bg-slate-200/70 text-ink-400 text-[11px]">#</th>
                <th className="px-3 py-2 border-r border-line min-w-[200px]">Deal Name</th>
                <th className="px-3 py-2 border-r border-line min-w-[170px]">Account Name</th>
                <th className="px-3 py-2 border-r border-line min-w-[130px]">Amount (₹)</th>
                <th className="px-3 py-2 border-r border-line min-w-[220px]">Stage</th>
                <th className="px-3 py-2 border-r border-line min-w-[130px]">Closing Date</th>
                <th className="px-3 py-2 border-r border-line min-w-[110px]">Probability %</th>
                <th className="px-3 py-2 border-r border-line min-w-[150px]">Owner</th>
                <th className="px-3 py-2 border-r border-line min-w-[130px]">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {filteredRows.map((row, idx) => {
                const isDirty = dirtyRowIds.has(row.id);
                return (
                  <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${isDirty ? 'bg-amber-50/40' : ''}`}>
                    {/* Index */}
                    <td className="w-10 px-2 py-1.5 text-center border-r border-line text-[11px] font-mono text-ink-400 bg-slate-50">
                      {idx + 1}
                    </td>

                    {/* Deal Name */}
                    <td className="p-0 border-r border-line">
                      <input
                        type="text"
                        value={row.name || ''}
                        onChange={(e) => handleCellChange(row.id, 'name', e.target.value)}
                        className="w-full h-8 px-2.5 text-[12.5px] font-medium text-ink bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-primary"
                      />
                    </td>

                    {/* Account Name */}
                    <td className="p-0 border-r border-line">
                      <select
                        value={row.accountId || ''}
                        onChange={(e) => handleCellChange(row.id, 'accountId', e.target.value)}
                        className="w-full h-8 px-2 text-[12px] bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-None-</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Amount */}
                    <td className="p-0 border-r border-line">
                      <input
                        type="number"
                        value={row.amount || 0}
                        onChange={(e) => handleCellChange(row.id, 'amount', e.target.value)}
                        className="w-full h-8 px-2.5 text-[12.5px] font-semibold text-ink bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-primary"
                      />
                    </td>

                    {/* Stage */}
                    <td className="p-0 border-r border-line">
                      <select
                        value={row.stage || ''}
                        onChange={(e) => handleCellChange(row.id, 'stage', e.target.value)}
                        className="w-full h-8 px-2 text-[12px] font-medium bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-primary"
                      >
                        <option value="Need Deals Estimation _Pending Info">Need Deals Estimation _Pending Info</option>
                        <option value="Deal Estimation Ready">Deal Estimation Ready</option>
                        <option value="Deal Estimation Sent to Client_Translations">Deal Estimation Sent to Client_Translations</option>
                        <option value="Deal Estimation Sent to Client_Other Services">Deal Estimation Sent to Client_Other Services</option>
                        <option value="Estimation Accepted">Estimation Accepted</option>
                        <option value="Invoice Need">Invoice Need</option>
                        <option value="Invoice Ready">Invoice Ready</option>
                        <option value="Deal Closed Won">Deal Closed Won</option>
                        <option value="Deal Closed Lost Pending Approval">Deal Closed Lost Pending Approval</option>
                        <option value="Deal Closed Lost Rejected">Deal Closed Lost Rejected</option>
                        <option value="Deal Job Seeking">Deal Job Seeking</option>
                      </select>
                    </td>

                    {/* Closing Date */}
                    <td className="p-0 border-r border-line">
                      <input
                        type="date"
                        value={row.closingDate || ''}
                        onChange={(e) => handleCellChange(row.id, 'closingDate', e.target.value)}
                        className="w-full h-8 px-2 text-[12px] bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-primary"
                      />
                    </td>

                    {/* Probability % */}
                    <td className="p-0 border-r border-line">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={row.probability || 0}
                        onChange={(e) => handleCellChange(row.id, 'probability', e.target.value)}
                        className="w-full h-8 px-2.5 text-[12.5px] text-ink bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-primary"
                      />
                    </td>

                    {/* Owner */}
                    <td className="p-0 border-r border-line">
                      <select
                        value={row.ownerId || ''}
                        onChange={(e) => handleCellChange(row.id, 'ownerId', e.target.value)}
                        className="w-full h-8 px-2 text-[12px] bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-primary"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Source */}
                    <td className="p-0 border-r border-line">
                      <select
                        value={row.source || 'Website'}
                        onChange={(e) => handleCellChange(row.id, 'source', e.target.value)}
                        className="w-full h-8 px-2 text-[12px] bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-primary"
                      >
                        {DEAL_SOURCES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-line bg-slate-50 flex items-center justify-between text-[12px] text-ink-500">
          <span>Showing {filteredRows.length} of {rows.length} deal records</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary h-8 px-4 rounded-md text-[12.5px]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={dirtyRowIds.size === 0 || isSaving}
              className="btn-primary h-8 px-4 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={13} />
              <span>{isSaving ? 'Saving...' : `Save Changes (${dirtyRowIds.size})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

