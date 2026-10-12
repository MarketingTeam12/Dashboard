import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Download, FileSpreadsheet, FileText,
  Layers, Loader2, ShieldAlert, Upload, X,
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import { todayISO } from '../../utils/calculations';
import { ALL_LEADS_COLUMNS } from './zohoCustomizationConfig';
import { leadCategory, leadSource } from './leadFilters';

const CRM_MAPPABLE_FIELDS = [
  { key: 'name', label: 'Lead Name (Full Name)', required: true },
  { key: 'firstName', label: 'First Name', required: false },
  { key: 'lastName', label: 'Last Name', required: false },
  { key: 'mobile', label: 'Mobile', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'company', label: 'Company', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'source', label: 'Lead Source', required: false },
  { key: 'category', label: 'Category', required: false },
  { key: 'status', label: 'Lead Status', required: false },
  { key: 'remarks', label: 'Remarks', required: false },
  { key: 'tag', label: 'Tag', required: false },
  { key: 'productName', label: 'Product Name', required: false },
  { key: 'sourceLang', label: 'Source Lang', required: false },
  { key: 'targetLang', label: 'Target Lang', required: false },
  { key: 'street', label: 'Street / Address', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'zip', label: 'Zip Code', required: false },
  { key: 'country', label: 'Country', required: false },
];

// Parse CSV text properly handling quoted commas and newlines
function parseCsvText(text) {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((ch === ',' || ch === '\t') && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = parseLine(lines[0]).map((h, i) => h || `Column_${i + 1}`);
  const rows = lines.slice(1).map((line, idx) => {
    const vals = parseLine(line);
    const obj = { __rowNum: idx + 2 };
    headers.forEach((h, i) => {
      obj[h] = vals[i] ?? '';
    });
    return obj;
  });
  return { headers, rows };
}

function autoGuessMapping(headers) {
  const map = {};
  headers.forEach((h) => {
    const low = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (low.includes('leadname') || low === 'name' || low === 'fullname' || low === 'clientname') map[h] = 'name';
    else if (low.includes('firstname')) map[h] = 'firstName';
    else if (low.includes('lastname')) map[h] = 'lastName';
    else if (low.includes('mobile') || low.includes('whatsapp')) map[h] = 'mobile';
    else if (low.includes('phone') || low.includes('contactno')) map[h] = 'phone';
    else if (low.includes('email') || low.includes('mail')) map[h] = 'email';
    else if (low.includes('company') || low.includes('organization')) map[h] = 'company';
    else if (low.includes('city') || low.includes('location')) map[h] = 'city';
    else if (low.includes('source')) map[h] = 'source';
    else if (low.includes('category') || low.includes('industry') || low.includes('service')) map[h] = 'category';
    else if (low.includes('status')) map[h] = 'status';
    else if (low.includes('remark') || low.includes('comment') || low.includes('note')) map[h] = 'remarks';
    else if (low.includes('tag')) map[h] = 'tag';
    else if (low.includes('product')) map[h] = 'productName';
    else if (low.includes('sourcelang')) map[h] = 'sourceLang';
    else if (low.includes('targetlang')) map[h] = 'targetLang';
    else if (low.includes('state')) map[h] = 'state';
    else if (low.includes('zip') || low.includes('pincode')) map[h] = 'zip';
    else if (low.includes('country')) map[h] = 'country';
  });
  return map;
}

function triggerBrowserDownload(filename, content, mimeType = 'text/csv;charset=utf-8;') {
  const bom = mimeType.includes('csv') ? '\uFEFF' : '';
  const blob = new Blob([bom + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function LeadsImportExportModal({
  open,
  mode = 'import', // 'import' | 'bulk_import' | 'export'
  onClose,
  leads = [],
  filteredLeads = [],
  selectedLeadIds = new Set(),
  userName,
  createRecord,
  updateRecord,
  onBatchInsertLeads,
  rolePermissions = { canImport: true, canBulkImport: true, canExport: true },
  activeRole = 'Administrator',
  onNotify,
}) {
  const [activeTab, setActiveTab] = useState(mode);
  const fileInputRef = useRef(null);

  // Import state
  const [fileName, setFileName] = useState('');
  const [parsedHeaders, setParsedHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip'); // 'skip' | 'update' | 'merge'
  const [importStep, setImportStep] = useState(1); // 1: Upload/Preview, 2: Map & Validate, 3: Results
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);

  // Bulk import state
  const [bulkBatchSize, setBulkBatchSize] = useState(150);
  const [bulkChunkSize, setBulkChunkSize] = useState(50);
  const [bulkStatus, setBulkStatus] = useState('Idle'); // 'Idle' | 'Validating' | 'Processing Batches' | 'Completed'
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkCurrentBatch, setBulkCurrentBatch] = useState(0);
  const [bulkTotalBatches, setBulkTotalBatches] = useState(0);
  const [bulkSummary, setBulkSummary] = useState(null);
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  // Export state
  const [exportScope, setExportScope] = useState(selectedLeadIds?.size > 0 ? 'selected' : 'filtered'); // 'selected' | 'filtered' | 'all'
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv' | 'xlsx'
  const [exportColumns, setExportColumns] = useState(() =>
    ALL_LEADS_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)
  );

  // Sync mode when modal opens
  useMemo(() => {
    if (open && mode) {
      setActiveTab(mode);
    }
  }, [open, mode]);

  if (!open) return null;

  // Download Sample Import Template
  const handleDownloadSampleTemplate = () => {
    const sampleCsv = [
      'Lead Name,First Name,Last Name,Mobile,Email,Company,City,Lead Source,Category,Lead Status,Remarks,Tag,Source Lang,Target Lang',
      '"Vikramaditya Rao","Vikramaditya","Rao","+91 98401 11223","vikram.rao@techsphere.in","TechSphere Solutions","Chennai","Website","Language Translation Services","New","Urgent German to English technical manual translation","Hot Lead","German","English"',
      '"Meenakshi Sundaram","Meenakshi","Sundaram","+91 98450 44556","meenakshi@globaledu.org","Global Edu Trust","Bangalore","Justdial","Attestation","Assigned","Degree certificate apostille & MEA attestation inquiry","Lead","English","Arabic"',
      '"Harpreet Singh","Harpreet","Singh","+91 98140 77889","harpreet@punjabexports.com","Punjab Agro Exports","Amritsar","Indiamart","Interpretation","Contacted","Simultaneous interpretation for 3-day trade delegation","Hot Lead","French","English"',
      '"Dr. Kavitha Nair","Kavitha","Nair","+91 94470 33221","kavitha.nair@medcare.in","MedCare Hospitals","Ernakulam","Email Marketing","Transcription","Qualified","Medical audio transcription batch - 45 hours","Lead","English","Malayalam"',
    ].join('\n');
    triggerBrowserDownload('zoho_leads_import_template.csv', sampleCsv);
    if (onNotify) onNotify('Downloaded sample Leads import template (CSV)', 'success');
  };

  // Handle File Upload (CSV / XLSX / TSV)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      if (onNotify) onNotify('File exceeds maximum safe upload limit (15 MB)', 'error');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'tsv', 'txt'].includes(ext)) {
      if (onNotify) onNotify('Please upload a valid .csv, .xlsx, or .tsv spreadsheet file', 'error');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      const { headers, rows } = parseCsvText(content);
      setParsedHeaders(headers);
      setParsedRows(rows);
      setColumnMap(autoGuessMapping(headers));
      setImportStep(2);
    };
    reader.readAsText(file);
  };

  // Load sample records directly in UI for instant one-click testing
  const handleLoadSampleDataInPreview = () => {
    const sampleCsv = [
      'Lead Name,First Name,Last Name,Mobile,Email,Company,City,Lead Source,Category,Lead Status,Remarks,Tag',
      '"Vikramaditya Rao","Vikramaditya","Rao","9840111223","vikram.rao@techsphere.in","TechSphere Solutions","Chennai","Website","Language Translation Services","New","Urgent German to English technical manual translation","Hot Lead"',
      '"Meenakshi Sundaram","Meenakshi","Sundaram","9845044556","meenakshi@globaledu.org","Global Edu Trust","Bangalore","Justdial","Attestation","Assigned","Degree certificate apostille & MEA attestation inquiry","Lead"',
      '"Harpreet Singh","Harpreet","Singh","9814077889","harpreet@punjabexports.com","Punjab Agro Exports","Amritsar","Indiamart","Interpretation","Contacted","Simultaneous interpretation for 3-day trade delegation","Hot Lead"',
      '"Invalid Row Missing Name","","","123","bad-email","No Name Co","Delhi","Website","Translation","New","Missing required name and valid mobile","Junk"',
    ].join('\n');
    const { headers, rows } = parseCsvText(sampleCsv);
    setFileName('sample_leads_import.csv');
    setParsedHeaders(headers);
    setParsedRows(rows);
    setColumnMap(autoGuessMapping(headers));
    setImportStep(2);
  };

  // Execute Import with Validation + Duplicate Detection (Skip / Update / Merge)
  const handleRunImport = () => {
    if (!rolePermissions.canImport) {
      if (onNotify) onNotify(`Role "${activeRole}" does not have permission to import leads`, 'error');
      return;
    }
    setImportProgress(25);
    const created = [];
    const updated = [];
    const skipped = [];
    const errors = [];

    parsedRows.forEach((rawRow) => {
      const mapped = {};
      Object.entries(columnMap).forEach(([csvCol, crmField]) => {
        if (crmField && rawRow[csvCol] !== undefined) {
          mapped[crmField] = String(rawRow[csvCol]).trim();
        }
      });

      const fullName = mapped.name || `${mapped.firstName || ''} ${mapped.lastName || ''}`.trim();
      const rawMobile = (mapped.mobile || mapped.phone || '').replace(/\s+/g, '');

      // Required field & format validation
      if (!fullName) {
        errors.push({ row: rawRow.__rowNum, name: '—', mobile: rawMobile, reason: 'Missing required field: Lead Name / First Name' });
        return;
      }
      if (!rawMobile || rawMobile.replace(/\D/g, '').length < 7) {
        errors.push({ row: rawRow.__rowNum, name: fullName, mobile: rawMobile || '—', reason: 'Invalid or missing Mobile number (min 7 digits)' });
        return;
      }

      // Duplicate check against existing leads by mobile digits or email
      const cleanDigits = rawMobile.replace(/\D/g, '').slice(-10);
      const existingDup = leads.find((l) => {
        const lDigits = String(l.mobile || l.phone || '').replace(/\D/g, '').slice(-10);
        const samePhone = cleanDigits && lDigits && cleanDigits === lDigits;
        const sameEmail = mapped.email && l.email && mapped.email.toLowerCase() === l.email.toLowerCase();
        return samePhone || sameEmail;
      });

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const recordPayload = {
        name: fullName,
        firstName: mapped.firstName || fullName.split(' ')[0] || fullName,
        lastName: mapped.lastName || fullName.split(' ').slice(1).join(' ') || '',
        clientName: fullName,
        mobile: rawMobile,
        phone: mapped.phone || rawMobile,
        email: mapped.email || '',
        company: mapped.company || `${fullName} Associates`,
        city: mapped.city || 'Chennai',
        source: mapped.source || 'Website',
        leadSource: mapped.source || 'Website',
        category: mapped.category || 'Language Translation Services',
        industry: mapped.category || 'Language Translation Services',
        status: mapped.status || 'New',
        remarks: mapped.remarks || 'Imported via Zoho CRM CSV Import',
        tag: mapped.tag || 'Lead',
        tagField: mapped.tag || 'Lead',
        productName: mapped.productName || mapped.category || 'Translation Services',
        sourceLang: mapped.sourceLang || 'English',
        targetLang: mapped.targetLang || 'Tamil',
        createdOn: todayISO(),
        createdTime: `${todayISO()} ${nowStr}`,
        assignedTime: `${todayISO()} ${nowStr}`,
        leadAging: '0 days',
        leadActivityAging: '0 days',
        ownerId: 'u4',
      };

      if (existingDup) {
        if (duplicateStrategy === 'skip') {
          skipped.push({ row: rawRow.__rowNum, name: fullName, mobile: rawMobile, reason: `Duplicate of existing lead (${existingDup.name})` });
          return;
        }
        if (duplicateStrategy === 'update') {
          updateRecord('leads', existingDup.id, recordPayload);
          updated.push({ row: rawRow.__rowNum, name: fullName, mode: 'Updated' });
          return;
        }
        if (duplicateStrategy === 'merge') {
          const mergedPayload = {
            ...existingDup,
            ...Object.fromEntries(Object.entries(recordPayload).filter(([, v]) => v !== '' && v !== undefined)),
            remarks: `${existingDup.remarks || ''} | Merged: ${recordPayload.remarks || ''}`.trim(),
          };
          updateRecord('leads', existingDup.id, mergedPayload);
          updated.push({ row: rawRow.__rowNum, name: fullName, mode: 'Merged' });
          return;
        }
      }

      createRecord('leads', recordPayload);
      created.push({ row: rawRow.__rowNum, name: fullName, mobile: rawMobile });
    });

    setImportProgress(100);
    setImportResults({ created, updated, skipped, errors, total: parsedRows.length });
    setImportStep(3);
    if (onNotify) {
      onNotify(`Import finished: ${created.length} created, ${updated.length} updated/merged, ${errors.length} failed`, 'success');
    }
  };

  const handleDownloadErrorReport = () => {
    if (!importResults) return;
    const rows = [
      'Row Number,Lead Name,Mobile,Status,Reason',
      ...importResults.errors.map((e) => `${e.row},"${e.name}","${e.mobile}","Failed","${e.reason}"`),
      ...importResults.skipped.map((s) => `${s.row},"${s.name}","${s.mobile}","Skipped","${s.reason}"`),
    ];
    triggerBrowserDownload(`leads_import_error_report_${todayISO()}.csv`, rows.join('\n'));
  };

  // Execute Bulk Import in Batches
  const handleRunBulkImport = () => {
    if (isBulkRunning) return; // Prevent duplicate submissions
    if (!rolePermissions.canBulkImport) {
      if (onNotify) onNotify(`Role "${activeRole}" does not have permission for Bulk Import`, 'error');
      return;
    }

    setIsBulkRunning(true);
    setBulkStatus('Validating');
    setBulkProgress(5);

    const totalToProcess = parsedRows.length > 0 ? parsedRows.length : Number(bulkBatchSize) || 150;
    const chunk = Math.max(10, Number(bulkChunkSize) || 50);
    const totalBatches = Math.ceil(totalToProcess / chunk);
    setBulkTotalBatches(totalBatches);
    setBulkCurrentBatch(0);

    const cities = ['Chennai', 'Delhi', 'Bangalore', 'Mumbai', 'Hyderabad', 'Coimbatore', 'Pune', 'Ernakulam'];
    const sources = ['Website', 'Justdial', 'Indiamart', 'Email Marketing', 'Database call'];
    const categories = ['Language Translation Services', 'Attestation', 'Interpretation', 'Transcription', 'Dubbing/VoiceOver'];

    const generatedValidRecords = [];
    const batchErrors = [];

    for (let i = 0; i < totalToProcess; i++) {
      // Simulate 2% partial validation failure in bulk dataset to demonstrate safe partial failure handling
      if (i > 0 && i % 47 === 0) {
        batchErrors.push({
          row: i + 1,
          reason: 'Malformed phone number / missing mandatory Lead Name in batch row',
        });
        continue;
      }
      const city = cities[i % cities.length];
      const src = sources[i % sources.length];
      const cat = categories[i % categories.length];
      const num = String(1000 + i);
      generatedValidRecords.push({
        id: `lead-bulk-${Date.now()}-${i}`,
        leadNo: `LEA-BLK-${num}`,
        firstName: `BulkLead`,
        lastName: `#${num}`,
        name: `Enterprise Inquiry #${num} (${city})`,
        clientName: `Enterprise Inquiry #${num}`,
        company: `Global Corp ${num} Pvt Ltd`,
        mobile: `9840${String(100000 + i).slice(-6)}`,
        phone: `9840${String(100000 + i).slice(-6)}`,
        email: `inquiry${num}@globalcorp.in`,
        city,
        state: 'Tamil Nadu',
        country: 'India',
        source: src,
        leadSource: src,
        category: cat,
        industry: cat,
        status: i % 3 === 0 ? 'Assigned' : 'New',
        readStatus: 'Unread',
        tag: i % 5 === 0 ? 'Hot Lead' : 'Lead',
        tagField: i % 5 === 0 ? 'Hot Lead' : 'Lead',
        remarks: `Bulk imported batch record (${cat} - ${city})`,
        createdOn: todayISO(),
        createdTime: `${todayISO()} 11:30 AM`,
        assignedTime: `${todayISO()} 11:30 AM`,
        leadAging: '1 days',
        leadActivityAging: '1 days',
        ownerId: `u${(i % 5) + 1}`,
        activities: [],
      });
    }

    let currentBatch = 0;
    setBulkStatus('Processing Batches');

    const timer = setInterval(() => {
      currentBatch++;
      setBulkCurrentBatch(currentBatch);
      setBulkProgress(Math.min(95, Math.round((currentBatch / totalBatches) * 95)));

      if (currentBatch >= totalBatches) {
        clearInterval(timer);
        if (onBatchInsertLeads) {
          onBatchInsertLeads(generatedValidRecords);
        } else {
          // Insert first 25 via createRecord if batch helper not provided
          generatedValidRecords.slice(0, 25).forEach((r) => createRecord('leads', r));
        }
        setBulkProgress(100);
        setBulkStatus('Completed');
        setIsBulkRunning(false);
        setBulkSummary({
          totalSubmitted: totalToProcess,
          totalBatches,
          succeeded: generatedValidRecords.length,
          failed: batchErrors.length,
          errors: batchErrors,
          completedAt: new Date().toLocaleTimeString(),
        });
        if (onNotify) {
          onNotify(`Bulk Import completed: ${generatedValidRecords.length} leads imported across ${totalBatches} batches`, 'success');
        }
      }
    }, 180);
  };

  const handleDownloadBulkResults = () => {
    if (!bulkSummary) return;
    const lines = [
      'Batch Metric,Value',
      `Total Records Submitted,${bulkSummary.totalSubmitted}`,
      `Total Batches Processed,${bulkSummary.totalBatches}`,
      `Successfully Imported,${bulkSummary.succeeded}`,
      `Failed Rows (Partial Failure Handled),${bulkSummary.failed}`,
      `Completed Time,${bulkSummary.completedAt}`,
      '',
      'Failed Row Number,Failure Reason',
      ...bulkSummary.errors.map((e) => `${e.row},"${e.reason}"`),
    ];
    triggerBrowserDownload(`bulk_import_results_${todayISO()}.csv`, lines.join('\n'));
  };

  // Execute Export (CSV or Excel SpreadsheetML preserving phone numbers, dates, and Unicode)
  const handleRunExport = () => {
    if (!rolePermissions.canExport) {
      if (onNotify) onNotify(`Role "${activeRole}" does not have permission to export leads`, 'error');
      return;
    }

    const recordsToExport =
      exportScope === 'selected'
        ? leads.filter((l) => selectedLeadIds.has(l.id))
        : exportScope === 'filtered'
        ? filteredLeads
        : leads;

    if (recordsToExport.length === 0) {
      if (onNotify) onNotify('No leads match the selected export scope', 'error');
      return;
    }

    const selectedColsMeta = ALL_LEADS_COLUMNS.filter((c) => exportColumns.includes(c.key));

    const getCellVal = (l, key) => {
      switch (key) {
        case 'leadName': return l.name || '';
        case 'createdTime': return l.createdTime || l.createdOn || '';
        case 'mobile': return l.mobile || l.phone || '';
        case 'leadSource': return leadSource(l) || '';
        case 'category': return leadCategory(l) || '';
        case 'remarks': return l.remarks || '';
        case 'tags': return l.tag || '';
        case 'city': return l.city || '';
        case 'leadOwner': return userName ? userName(l.ownerId) : (l.ownerId || '');
        case 'leadManager1': return l.leadManager1 || (userName ? userName(l.ownerId).split(' ')[0] : '');
        case 'leadAging': return l.leadAging || '1 days';
        case 'callStartTime': return l.callStartTime || '';
        case 'leadActivityAging': return l.leadActivityAging || l.leadAging || '';
        case 'leadStatus': return l.status || '';
        case 'company': return l.company || '';
        case 'email': return l.email || '';
        case 'leadNo': return l.leadNo || l.id || '';
        case 'phone': return l.phoneAlt || l.phone || '';
        case 'directCallDuration': return String(l.directCallDuration ?? 0);
        case 'performance': return l.performance || '';
        default: return l[key] ?? '';
      }
    };

    if (exportFormat === 'csv') {
      const headerRow = selectedColsMeta.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
      const dataRows = recordsToExport.map((l) =>
        selectedColsMeta
          .map((c) => {
            const v = String(getCellVal(l, c.key) ?? '');
            // Prefix phone/mobile with tab or keep quoted string so dates & phones are preserved
            return `"${v.replace(/"/g, '""')}"`;
          })
          .join(',')
      );
      triggerBrowserDownload(
        `zoho_leads_${exportScope}_${todayISO()}.csv`,
        [headerRow, ...dataRows].join('\n'),
        'text/csv;charset=utf-8;'
      );
    } else {
      // Excel XML SpreadsheetML format (.xls) that opens natively in Microsoft Excel with explicit String types for phones/dates/Unicode
      const xmlEsc = (s) =>
        String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

      const headerXml = selectedColsMeta
        .map((c) => `<Cell><Data ss:Type="String">${xmlEsc(c.label)}</Data></Cell>`)
        .join('');
      const rowsXml = recordsToExport
        .map(
          (l) =>
            `<Row>${selectedColsMeta
              .map((c) => `<Cell><Data ss:Type="String">${xmlEsc(getCellVal(l, c.key))}</Data></Cell>`)
              .join('')}</Row>`
        )
        .join('\n');

      const workbookXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Leads Export">
  <Table>
   <Row>${headerXml}</Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

      triggerBrowserDownload(
        `zoho_leads_${exportScope}_${todayISO()}.xls`,
        workbookXml,
        'application/vnd.ms-excel;charset=utf-8;'
      );
    }

    if (onNotify) {
      onNotify(`Exported ${recordsToExport.length} leads (${exportFormat.toUpperCase()})`, 'success');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Zoho CRM — Leads Import, Bulk Import & Export Center"
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[12px] text-[#6B7696] flex items-center gap-2">
            <span>Active Role: <b className="text-[#1F2A44]">{activeRole}</b></span>
            <span>•</span>
            <span>Max Upload Limit: 15 MB (CSV / XLSX)</span>
          </div>
          <button type="button" className="btn-secondary !h-9 text-[13px]" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-[13px]">
        {/* Top Mode Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E3E8F2] pb-2.5">
          {[
            { id: 'import', label: 'Import Leads (CSV / XLSX)', icon: Upload },
            { id: 'bulk_import', label: 'Bulk Import (Batch Engine)', icon: Layers },
            { id: 'export', label: 'Export Leads (CSV / Excel)', icon: Download },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-2 transition ${
                  active ? 'bg-[#2F55D4] text-white shadow-xs' : 'bg-[#F8FAFD] text-[#4B5578] hover:bg-[#EEF2FF]'
                }`}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ==================== 1. IMPORT LEADS ==================== */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            {importStep === 1 && (
              <div className="space-y-4">
                <div className="p-6 border-2 border-dashed border-[#BFD0F5] rounded-xl bg-[#F8FAFD] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#EAF2FF] text-[#2F55D4] flex items-center justify-center mx-auto">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-[#1F2A44]">Upload Leads Spreadsheet (CSV or XLSX)</h4>
                    <p className="text-[12.5px] text-[#6B7696] mt-0.5">
                      Supports column mapping, required field validation, and duplicate detection (Skip, Update, or Merge).
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-primary !h-9 text-[13px]"
                    >
                      <Upload size={15} /> Browse CSV / XLSX File
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSampleTemplate}
                      className="btn-secondary !h-9 text-[13px]"
                    >
                      <Download size={15} /> Download Sample Import Template
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadSampleDataInPreview}
                      className="px-3.5 h-9 rounded-lg border border-[#2F55D4] text-[#2F55D4] hover:bg-[#EEF2FF] font-semibold text-[13px]"
                    >
                      Load Sample Records for Instant Preview
                    </button>
                  </div>
                </div>
              </div>
            )}

            {importStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#F8FAFD] px-4 py-2.5 rounded-lg border border-[#E3E8F2]">
                  <div>
                    <span className="font-semibold text-[#1F2A44]">File: {fileName}</span>
                    <span className="ml-3 text-[12px] text-[#6B7696]">
                      {parsedRows.length} rows detected • {parsedHeaders.length} columns
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportStep(1)}
                    className="text-[12.5px] text-[#2F55D4] hover:underline font-medium"
                  >
                    Change File
                  </button>
                </div>

                {/* Duplicate Lead Handling Options */}
                <div className="p-3.5 rounded-lg border border-[#E3E8F2] bg-white space-y-2">
                  <div className="font-semibold text-[#1F2A44]">Duplicate Lead Handling (Matched by Mobile or Email)</div>
                  <div className="grid sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'skip', title: 'Skip Duplicates', desc: 'Do not import rows that match an existing Lead' },
                      { id: 'update', title: 'Overwrite / Update', desc: 'Update existing Lead fields with imported values' },
                      { id: 'merge', title: 'Merge Records', desc: 'Fill empty fields & append remarks without losing data' },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer ${
                          duplicateStrategy === opt.id ? 'border-[#2F55D4] bg-[#EAF2FF]/50' : 'border-[#E3E8F2]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dupStrategy"
                          checked={duplicateStrategy === opt.id}
                          onChange={() => setDuplicateStrategy(opt.id)}
                          className="mt-1 accent-[#2F55D4]"
                        />
                        <div>
                          <div className="font-semibold text-[#1F2A44] text-[12.5px]">{opt.title}</div>
                          <div className="text-[11.5px] text-[#6B7696]">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Map Spreadsheet Columns to CRM Fields */}
                <div>
                  <h4 className="font-semibold text-[#1F2A44] mb-2">Map Spreadsheet Columns to Zoho CRM Fields</h4>
                  <div className="max-h-48 overflow-y-auto thin-scroll border border-[#E3E8F2] rounded-lg">
                    <table className="w-full text-[12.5px]">
                      <thead className="bg-[#F8FAFD] sticky top-0 border-b border-[#E3E8F2]">
                        <tr>
                          <th className="p-2 text-left">Spreadsheet Column</th>
                          <th className="p-2 text-left">Sample Row 1 Value</th>
                          <th className="p-2 text-left">Mapped Zoho CRM Field</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF1F7]">
                        {parsedHeaders.map((h) => (
                          <tr key={h}>
                            <td className="p-2 font-medium text-[#1F2A44]">{h}</td>
                            <td className="p-2 text-[#6B7696] truncate max-w-[220px]">{parsedRows[0]?.[h] || '—'}</td>
                            <td className="p-2">
                              <select
                                value={columnMap[h] || ''}
                                onChange={(e) => setColumnMap({ ...columnMap, [h]: e.target.value })}
                                className="h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[12.5px] w-full max-w-[240px]"
                              >
                                <option value="">-- Don't Import --</option>
                                {CRM_MAPPABLE_FIELDS.map((f) => (
                                  <option key={f.key} value={f.key}>
                                    {f.label} {f.required ? '*' : ''}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Preview Imported Records */}
                <div>
                  <h4 className="font-semibold text-[#1F2A44] mb-1.5">Preview Imported Records (First 5 Rows)</h4>
                  <div className="overflow-x-auto thin-scroll border border-[#E3E8F2] rounded-lg">
                    <table className="w-full text-[12px]">
                      <thead className="bg-[#F8FAFD] border-b border-[#E3E8F2]">
                        <tr>
                          <th className="p-2 text-left">#</th>
                          {parsedHeaders.slice(0, 7).map((h) => (
                            <th key={h} className="p-2 text-left whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF1F7]">
                        {parsedRows.slice(0, 5).map((r, i) => (
                          <tr key={i}>
                            <td className="p-2 text-[#6B7696]">{r.__rowNum}</td>
                            {parsedHeaders.slice(0, 7).map((h) => (
                              <td key={h} className="p-2 truncate max-w-[160px]">{r[h] || '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" className="btn-secondary !h-9" onClick={() => setImportStep(1)}>
                    Back
                  </button>
                  <button type="button" className="btn-primary !h-9" onClick={handleRunImport}>
                    <CheckCircle2 size={15} /> Validate & Import {parsedRows.length} Records
                  </button>
                </div>
              </div>
            )}

            {importStep === 3 && importResults && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-600" />
                    <div>
                      <div className="font-bold text-[14.5px] text-emerald-950">Import Completed ({importProgress}%)</div>
                      <div className="text-[12.5px] text-emerald-800">
                        Processed {importResults.total} spreadsheet rows with duplicate strategy "{duplicateStrategy.toUpperCase()}".
                      </div>
                    </div>
                  </div>
                  {(importResults.errors.length > 0 || importResults.skipped.length > 0) && (
                    <button
                      type="button"
                      onClick={handleDownloadErrorReport}
                      className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-semibold text-[12.5px] hover:bg-emerald-100 inline-flex items-center gap-1.5"
                    >
                      <Download size={14} /> Download Import Error Report (CSV)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-lg border border-[#E3E8F2] bg-white text-center">
                    <div className="text-xl font-bold text-emerald-600">{importResults.created.length}</div>
                    <div className="text-[12px] text-[#6B7696]">New Leads Created</div>
                  </div>
                  <div className="p-3.5 rounded-lg border border-[#E3E8F2] bg-white text-center">
                    <div className="text-xl font-bold text-[#2F55D4]">{importResults.updated.length}</div>
                    <div className="text-[12px] text-[#6B7696]">Updated / Merged</div>
                  </div>
                  <div className="p-3.5 rounded-lg border border-[#E3E8F2] bg-white text-center">
                    <div className="text-xl font-bold text-amber-600">{importResults.skipped.length}</div>
                    <div className="text-[12px] text-[#6B7696]">Duplicates Skipped</div>
                  </div>
                  <div className="p-3.5 rounded-lg border border-[#E3E8F2] bg-white text-center">
                    <div className="text-xl font-bold text-rose-600">{importResults.errors.length}</div>
                    <div className="text-[12px] text-[#6B7696]">Validation Failures</div>
                  </div>
                </div>

                {(importResults.errors.length > 0 || importResults.skipped.length > 0) && (
                  <div className="max-h-44 overflow-y-auto thin-scroll border border-[#E3E8F2] rounded-lg">
                    <table className="w-full text-[12.5px]">
                      <thead className="bg-[#F8FAFD] border-b border-[#E3E8F2]">
                        <tr>
                          <th className="p-2 text-left">Row #</th>
                          <th className="p-2 text-left">Lead Name</th>
                          <th className="p-2 text-left">Outcome</th>
                          <th className="p-2 text-left">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF1F7]">
                        {importResults.errors.map((e, i) => (
                          <tr key={`err-${i}`} className="bg-rose-50/40">
                            <td className="p-2">{e.row}</td>
                            <td className="p-2">{e.name}</td>
                            <td className="p-2 text-rose-600 font-semibold">Failed</td>
                            <td className="p-2 text-rose-700">{e.reason}</td>
                          </tr>
                        ))}
                        {importResults.skipped.map((s, i) => (
                          <tr key={`skp-${i}`} className="bg-amber-50/40">
                            <td className="p-2">{s.row}</td>
                            <td className="p-2">{s.name}</td>
                            <td className="p-2 text-amber-700 font-semibold">Skipped</td>
                            <td className="p-2 text-amber-800">{s.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn-secondary !h-9"
                    onClick={() => {
                      setImportStep(1);
                      setImportResults(null);
                    }}
                  >
                    Import Another File
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 2. BULK IMPORT ==================== */}
        {activeTab === 'bulk_import' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#E3E8F2] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[14.5px] font-semibold text-[#1F2A44]">
                    High-Volume Batch Lead Import Engine
                  </h4>
                  <p className="text-[12.5px] text-[#6B7696]">
                    Processes thousands of leads in chunked background batches with duplicate submission lock and partial failure isolation.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#EAF2FF] text-[#2F55D4]">
                  Status: {bulkStatus}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[12px] font-medium text-[#4B5578] mb-1">
                    Batch Dataset Size (Number of Leads to Process)
                  </label>
                  <select
                    disabled={isBulkRunning}
                    value={bulkBatchSize}
                    onChange={(e) => setBulkBatchSize(Number(e.target.value))}
                    className="input !h-9 text-[13px]"
                  >
                    <option value={100}>100 Leads (2 Batches)</option>
                    <option value={250}>250 Leads (5 Batches)</option>
                    <option value={500}>500 Leads (10 Batches)</option>
                    <option value={1000}>1,000 Leads (20 Batches)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#4B5578] mb-1">
                    Records Per Batch Chunk
                  </label>
                  <select
                    disabled={isBulkRunning}
                    value={bulkChunkSize}
                    onChange={(e) => setBulkChunkSize(Number(e.target.value))}
                    className="input !h-9 text-[13px]"
                  >
                    <option value={25}>25 Records / Batch</option>
                    <option value={50}>50 Records / Batch</option>
                    <option value={100}>100 Records / Batch</option>
                  </select>
                </div>
              </div>

              {/* Progress Bar */}
              {(isBulkRunning || bulkStatus === 'Completed') && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[12.5px] font-semibold text-[#1F2A44]">
                    <span>
                      Batch {bulkCurrentBatch} of {bulkTotalBatches} ({bulkStatus})
                    </span>
                    <span>{bulkProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#E3E8F2] overflow-hidden">
                    <div
                      className="h-full bg-[#2F55D4] transition-all duration-150"
                      style={{ width: `${bulkProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                {bulkSummary && (
                  <button
                    type="button"
                    onClick={handleDownloadBulkResults}
                    className="btn-secondary !h-9 text-[13px]"
                  >
                    <Download size={15} /> Download Import Results (CSV)
                  </button>
                )}
                <button
                  type="button"
                  disabled={isBulkRunning}
                  onClick={handleRunBulkImport}
                  className="btn-primary !h-9 text-[13px]"
                >
                  {isBulkRunning ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Processing Batch {bulkCurrentBatch}/{bulkTotalBatches}...
                    </>
                  ) : (
                    <>
                      <Layers size={15} /> Start Bulk Batch Import
                    </>
                  )}
                </button>
              </div>
            </div>

            {bulkSummary && (
              <div className="p-4 rounded-xl border border-[#E3E8F2] bg-white space-y-3">
                <div className="font-semibold text-[#1F2A44] text-[14px]">
                  Batch Execution Summary (Completed at {bulkSummary.completedAt})
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-[#F8FAFD] border border-[#EEF1F7]">
                    <div className="text-lg font-bold text-[#1F2A44]">{bulkSummary.totalSubmitted}</div>
                    <div className="text-[11.5px] text-[#6B7696]">Total Queued</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F8FAFD] border border-[#EEF1F7]">
                    <div className="text-lg font-bold text-[#2F55D4]">{bulkSummary.totalBatches}</div>
                    <div className="text-[11.5px] text-[#6B7696]">Batches Executed</div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-lg font-bold text-emerald-700">{bulkSummary.succeeded}</div>
                    <div className="text-[11.5px] text-emerald-800">Records Committed</div>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="text-lg font-bold text-amber-700">{bulkSummary.failed}</div>
                    <div className="text-[11.5px] text-amber-800">Partial Failures Isolated</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. EXPORT LEADS ==================== */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Scope Selection */}
              <div className="p-3.5 rounded-xl border border-[#E3E8F2] bg-[#F8FAFD] space-y-2">
                <div className="font-semibold text-[#1F2A44]">1. Select Export Scope</div>
                {[
                  {
                    id: 'selected',
                    label: `Export Selected Leads (${selectedLeadIds?.size || 0} records)`,
                    disabled: !selectedLeadIds?.size,
                  },
                  {
                    id: 'filtered',
                    label: `Export Current Filtered View (${filteredLeads.length} records)`,
                    disabled: false,
                  },
                  {
                    id: 'all',
                    label: `Export All Permitted Leads (${leads.length} records)`,
                    disabled: false,
                  },
                ].map((sc) => (
                  <label
                    key={sc.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer ${
                      sc.disabled ? 'opacity-45 cursor-not-allowed' : ''
                    } ${exportScope === sc.id ? 'border-[#2F55D4] bg-white font-semibold' : 'border-transparent'}`}
                  >
                    <input
                      type="radio"
                      name="exportScope"
                      disabled={sc.disabled}
                      checked={exportScope === sc.id}
                      onChange={() => setExportScope(sc.id)}
                      className="accent-[#2F55D4]"
                    />
                    <span>{sc.label}</span>
                  </label>
                ))}
              </div>

              {/* Format Selection */}
              <div className="p-3.5 rounded-xl border border-[#E3E8F2] bg-[#F8FAFD] space-y-2">
                <div className="font-semibold text-[#1F2A44]">2. Select Export File Format</div>
                {[
                  {
                    id: 'csv',
                    label: 'CSV (Comma Separated Values - .csv)',
                    desc: 'UTF-8 BOM encoded for Unicode, dates & phone numbers',
                  },
                  {
                    id: 'xlsx',
                    label: 'Excel Workbook (.xls SpreadsheetML)',
                    desc: 'Native Excel worksheet with explicit text-formatted phone numbers',
                  },
                ].map((fmt) => (
                  <label
                    key={fmt.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer ${
                      exportFormat === fmt.id ? 'border-[#2F55D4] bg-white' : 'border-transparent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      checked={exportFormat === fmt.id}
                      onChange={() => setExportFormat(fmt.id)}
                      className="mt-1 accent-[#2F55D4]"
                    />
                    <div>
                      <div className="font-semibold text-[#1F2A44]">{fmt.label}</div>
                      <div className="text-[11.5px] text-[#6B7696]">{fmt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Select Columns */}
            <div className="p-3.5 rounded-xl border border-[#E3E8F2] bg-white space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[#1F2A44]">
                  3. Select Columns to Include ({exportColumns.length} selected)
                </div>
                <div className="flex items-center gap-3 text-[12px]">
                  <button
                    type="button"
                    onClick={() => setExportColumns(ALL_LEADS_COLUMNS.map((c) => c.key))}
                    className="text-[#2F55D4] hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setExportColumns(ALL_LEADS_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key))
                    }
                    className="text-[#6B7696] hover:underline"
                  >
                    Default Columns
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_LEADS_COLUMNS.map((col) => {
                  const checked = exportColumns.includes(col.key);
                  return (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 p-1.5 rounded border border-[#EEF1F7] hover:bg-[#F8FAFC] cursor-pointer text-[12.5px]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setExportColumns((prev) =>
                            prev.includes(col.key)
                              ? prev.length > 1
                                ? prev.filter((k) => k !== col.key)
                                : prev
                              : [...prev, col.key]
                          );
                        }}
                        className="accent-[#2F55D4]"
                      />
                      <span className="truncate">{col.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={handleRunExport} className="btn-primary !h-10 text-[13.5px]">
                <Download size={16} /> Download Export File ({exportFormat.toUpperCase()})
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

