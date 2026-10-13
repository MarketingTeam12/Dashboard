import React, { useState, useEffect } from 'react';
import {
  X, Upload, FileSpreadsheet, Package, FileText, CheckCircle2,
  AlertCircle, ArrowRight, Download, Plus, Sparkles
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { STAGES, todayISO, fmtINR } from '../../utils/calculations';

const SAMPLE_DEALS_CSV = `Deal Name,Account,Amount,Stage,Closing Date,Probability
FinTech Cloud Migration,Apex Technologies,1250000,Need Deals Estimation _Pending Info,2026-11-15,30
AI Assistant Integration,Blue Systems,850000,Deal Estimation Ready,2026-12-01,50
Enterprise Security Audit,Crest Industries,1600000,Estimation Accepted,2026-10-30,70`;

const SAMPLE_PRODUCTS_CSV = `Deal Name,Account,Product Name,Quantity,Unit Price,Stage,Closing Date
ERP Global License,Delta Enterprises,ERP Enterprise Suite,10,150000,Deal Estimation Ready,2026-11-20
Data Analytics Setup,Elite Labs,Analytics Engine Pro,5,80000,Estimation Accepted,2026-12-10
Cloud Infrastructure,Fusion Networks,Cloud Server Node,8,120000,Invoice Need,2026-11-30`;

const SAMPLE_NOTES_CSV = `Deal Name,Note Title,Note Content
FinTech Cloud Migration,Initial Discovery,Client expressed strong interest in high-availability multi-region hosting.
AI Assistant Integration,Technical Meeting,Discussed SLA requirements and integration with existing REST APIs.
Enterprise Security Audit,Pricing Approval,Sent revised estimate including GST and 24x7 priority support.`;

export default function ImportModal({
  open,
  onClose,
  initialType = 'deals', // 'deals' | 'deals_products' | 'notes'
  deals = [],
  accounts = [],
  contacts = [],
  users = [],
  onImportDeals,
  onImportDealsProducts,
  onImportNotes,
}) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(initialType);
  const [csvText, setCsvText] = useState('');
  const [previewRows, setPreviewRows] = useState([]);
  const [parsingError, setParsingError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab(initialType || 'deals');
      loadSample(initialType || 'deals');
    }
  }, [open, initialType]);

  const loadSample = (type) => {
    let sample = '';
    if (type === 'deals') sample = SAMPLE_DEALS_CSV;
    else if (type === 'deals_products') sample = SAMPLE_PRODUCTS_CSV;
    else if (type === 'notes') sample = SAMPLE_NOTES_CSV;

    setCsvText(sample);
    parseCSV(sample, type);
  };

  const handleTabChange = (type) => {
    setActiveTab(type);
    loadSample(type);
  };

  const parseCSV = (text, type = activeTab) => {
    setParsingError('');
    if (!text.trim()) {
      setPreviewRows([]);
      return;
    }

    try {
      const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setParsingError('CSV must include a header line and at least one data row.');
        setPreviewRows([]);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        rows.push(row);
      }

      setPreviewRows(rows);
    } catch (err) {
      setParsingError('Failed to parse CSV: ' + err.message);
      setPreviewRows([]);
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setCsvText(val);
    parseCSV(val, activeTab);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      setCsvText(content);
      parseCSV(content, activeTab);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (previewRows.length === 0) {
      setParsingError('No records to import. Please add or load CSV data.');
      return;
    }

    setIsImporting(true);

    try {
      if (activeTab === 'deals') {
        const records = previewRows.map((r) => {
          const acc = accounts.find((a) => a.name.toLowerCase() === (r['Account'] || '').toLowerCase());
          return {
            name: r['Deal Name'] || 'Imported Deal',
            accountId: acc ? acc.id : accounts[0]?.id || '',
            amount: Number(r['Amount']) || 100000,
            stage: r['Stage'] || 'Need Deals Estimation _Pending Info',
            closingDate: r['Closing Date'] || todayISO(),
            probability: Number(r['Probability']) || 30,
            ownerId: users[0]?.id || 'u1',
            source: 'Import',
            department: 'Enterprise Sales',
            createdOn: todayISO(),
            description: `Imported via Deals CSV on ${todayISO()}`,
          };
        });

        onImportDeals(records);
        toast.success(`Successfully imported ${records.length} deals!`);
      } else if (activeTab === 'deals_products') {
        const records = previewRows.map((r) => {
          const acc = accounts.find((a) => a.name.toLowerCase() === (r['Account'] || '').toLowerCase());
          const qty = Number(r['Quantity']) || 1;
          const unitPrice = Number(r['Unit Price']) || 50000;
          const totalAmt = qty * unitPrice;

          return {
            name: r['Deal Name'] || 'Deal with Products',
            accountId: acc ? acc.id : accounts[0]?.id || '',
            amount: totalAmt,
            stage: r['Stage'] || 'Deal Estimation Ready',
            closingDate: r['Closing Date'] || todayISO(),
            probability: 50,
            ownerId: users[0]?.id || 'u1',
            source: 'Product Catalog Import',
            department: 'Enterprise Sales',
            createdOn: todayISO(),
            products: [
              {
                name: r['Product Name'] || 'General Service',
                quantity: qty,
                unitPrice,
                total: totalAmt,
              },
            ],
            description: `Imported with product line: ${r['Product Name'] || 'Product'} (${qty} units @ ₹${unitPrice})`,
          };
        });

        onImportDealsProducts(records);
        toast.success(`Successfully imported ${records.length} deals with product line items!`);
      } else if (activeTab === 'notes') {
        const notesToImport = previewRows.map((r) => {
          const matchedDeal = deals.find((d) => d.name.toLowerCase().includes((r['Deal Name'] || '').toLowerCase())) || deals[0];
          return {
            dealId: matchedDeal ? matchedDeal.id : deals[0]?.id,
            dealName: matchedDeal ? matchedDeal.name : r['Deal Name'],
            title: r['Note Title'] || 'Imported Note',
            content: r['Note Content'] || 'No content provided',
            date: todayISO(),
          };
        });

        onImportNotes(notesToImport);
        toast.success(`Successfully imported ${notesToImport.length} notes for deals!`);
      }

      setIsImporting(false);
      onClose();
    } catch (err) {
      setIsImporting(false);
      setParsingError('Import failed: ' + err.message);
      toast.error('Import failed: ' + err.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[780px] max-w-full max-h-[92vh] flex flex-col overflow-hidden border border-line"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-ink">Import Data to Deals</h2>
              <p className="text-[12px] text-ink-500">
                Choose an import workflow and upload or paste your records
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-ink-400 hover:text-ink hover:bg-slate-200/60 rounded-md">
            <X size={18} />
          </button>
        </div>

        {/* Workflow Tabs */}
        <div className="flex border-b border-line bg-white px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('deals')}
            className={`pb-2.5 px-3 text-[13.5px] font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'deals'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-500 hover:text-ink'
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>Import Deals</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('deals_products')}
            className={`pb-2.5 px-3 text-[13.5px] font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'deals_products'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-500 hover:text-ink'
            }`}
          >
            <Package size={15} />
            <span>Import Deals X Products</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('notes')}
            className={`pb-2.5 px-3 text-[13.5px] font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'notes'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-500 hover:text-ink'
            }`}
          >
            <FileText size={15} />
            <span>Import Notes</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 thin-scroll">
          {parsingError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[12.5px] rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{parsingError}</span>
            </div>
          )}

          {/* Action helpers */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="text-[12.5px] text-ink-600 font-medium">
              Paste CSV records below or upload a file:
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadSample(activeTab)}
                className="text-[12px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles size={13} />
                <span>Load Sample Data</span>
              </button>
              <span className="text-ink-300">•</span>
              <label className="text-[12px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1">
                <Upload size={13} />
                <span>Upload CSV File</span>
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* CSV Text Box */}
          <textarea
            value={csvText}
            onChange={handleTextChange}
            rows={5}
            placeholder="Paste comma-separated values here..."
            className="w-full p-3 font-mono text-[12px] border border-line rounded-lg focus:border-primary outline-none bg-slate-50/50"
          />

          {/* Data Preview Table */}
          {previewRows.length > 0 && (
            <div className="border border-line rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 border-b border-line flex items-center justify-between">
                <span className="text-[12.5px] font-bold text-ink">
                  Parsed Data Preview ({previewRows.length} records ready)
                </span>
                <span className="text-[11.5px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Ready to Import
                </span>
              </div>
              <div className="max-h-[190px] overflow-x-auto overflow-y-auto thin-scroll">
                <table className="w-full text-[12px] text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-line text-ink-500 font-semibold sticky top-0">
                    <tr>
                      {Object.keys(previewRows[0]).map((h) => (
                        <th key={h} className="px-3 py-2 border-r border-line last:border-r-0 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {previewRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        {Object.values(r).map((v, idx) => (
                          <td key={idx} className="px-3 py-1.5 border-r border-line last:border-r-0 whitespace-nowrap text-ink-700">
                            {String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line flex items-center justify-between bg-slate-50/70">
          <button type="button" onClick={onClose} className="btn-secondary h-8 px-4 rounded-md text-[13px]">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={previewRows.length === 0 || isImporting}
              onClick={handleExecuteImport}
              className="btn-primary h-8 px-4 rounded-md text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              <span>{isImporting ? 'Importing...' : `Import ${previewRows.length} Records`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

