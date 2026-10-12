import { useEffect, useState } from 'react';
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_TAGS } from '../../data/seedData';

const STORAGE_KEY = 'zcrm.customization.v1';

// Screenshot-matching columns for Leads List (Section 2)
export const ALL_LEADS_COLUMNS = [
  { key: 'leadName', label: 'Lead Name', defaultVisible: true, width: 170 },
  { key: 'createdTime', label: 'Created Time', defaultVisible: true, width: 145 },
  { key: 'mobile', label: 'Mobile', defaultVisible: true, width: 140 },
  { key: 'leadSource', label: 'Lead Source', defaultVisible: true, width: 130 },
  { key: 'category', label: 'Category', defaultVisible: true, width: 170 },
  { key: 'remarks', label: 'Remarks', defaultVisible: true, width: 210 },
  { key: 'tags', label: 'Tags', defaultVisible: true, width: 130 },
  { key: 'city', label: 'City', defaultVisible: true, width: 120 },
  { key: 'leadOwner', label: 'Lead Owner', defaultVisible: true, width: 145 },
  { key: 'leadManager1', label: 'Lead Manager 1', defaultVisible: true, width: 135 },
  { key: 'leadAging', label: 'Lead Aging', defaultVisible: true, width: 115 },
  { key: 'callStartTime', label: 'Call Start Time', defaultVisible: true, width: 150 },
  { key: 'leadActivityAging', label: 'Lead Activity Aging', defaultVisible: true, width: 150 },
  { key: 'leadStatus', label: 'Lead Status', defaultVisible: true, width: 125 },
  { key: 'company', label: 'Company', defaultVisible: false, width: 160 },
  { key: 'email', label: 'Email', defaultVisible: false, width: 190 },
  { key: 'leadNo', label: 'Lead No', defaultVisible: false, width: 120 },
  { key: 'phone', label: 'Phone', defaultVisible: false, width: 135 },
  { key: 'directCallDuration', label: 'Direct Call Duration', defaultVisible: false, width: 145 },
  { key: 'performance', label: 'Performance', defaultVisible: false, width: 120 },
];

export const DEFAULT_LAYOUTS = [
  {
    id: 'layout-standard',
    name: 'Standard View',
    description: 'Two-column Zoho layout with Address & Visit Summary',
    columns: 2,
    isDefault: true,
  },
  {
    id: 'layout-comprehensive',
    name: 'Comprehensive View',
    description: 'Full enterprise layout with Call Analytics, Campaign Attribution & SLA fields',
    columns: 2,
    isDefault: true,
  },
  {
    id: 'layout-compact',
    name: 'Compact Executive View',
    description: 'Streamlined high-density layout for rapid call qualification',
    columns: 1,
    isDefault: true,
  },
];

export const DEFAULT_CUSTOMIZATION = {
  moduleLabel: 'Leads',
  customColumns: [],
  removedColumnKeys: [],
  visibleColumnKeys: ALL_LEADS_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key),
  columnOrder: ALL_LEADS_COLUMNS.map((c) => c.key),
  columnWidths: Object.fromEntries(ALL_LEADS_COLUMNS.map((c) => [c.key, c.width])),
  fieldLabels: {},
  requiredFields: ['lastName', 'company', 'mobile'],
  customFields: [
    {
      id: 'cf-budget',
      key: 'estimatedBudget',
      label: 'Estimated Budget (₹)',
      type: 'number',
      required: false,
      section: 'Lead Information',
      options: [],
    },
  ],
  customStatuses: [...LEAD_STATUSES],
  customSources: [...LEAD_SOURCES],
  customTags: [...LEAD_TAGS],
  tagsVersion: 3,
  customCategories: [
    'Language Translation Services',
    'Language Conversion',
    'Attestation',
    'Transcription',
    'Interpretation',
    'Dubbing / VoiceOver',
    'Typing / DTP',
    'Admission',
    'Overseas Education',
    'Visa',
    'Education',
    'Other Category',
  ],
  statusColors: {
    Assigned: '#1DB54A',
    New: '#2F7BF5',
    Contacted: '#1DB54A',
    Followup: '#0EA5E9',
    Qualified: '#F59E0B',
    Proposal: '#F43F5E',
    Converted: '#8E3CF2',
    Lost: '#64748B',
    'Lost Lead': '#64748B',
    RNR: '#D97706',
    Pending: '#6366F1',
  },
  tagColors: {
    'Already Job Completed': '#0D9488',
    'Asking Very Low Rate': '#D97706',
    'Block List': '#991B1B',
    'Complicated': '#7C3AED',
    'Deal Done': '#16A34A',
    'Duplicate': '#DC2626',
    'Foreign Number': '#0284C7',
    'Future Requirements': '#2563EB',
    'Insufficient Contact Det': '#CA8A04',
    'Invaild Number': '#9333EA',
    'Job seeking': '#4F46E5',
    'Junk': '#E11D48',
    'Not contactable': '#BE185D',
    'Offline Service': '#0891B2',
    'Service Not Provided': '#64748B',
    'followup': '#059669',
    'swich off': '#EA580C',
  },
  sourceColors: {
    Website: '#2563EB',
    Justdial: '#F59E0B',
    Indiamart: '#10B981',
    'Existing Client': '#8B5CF6',
    'Database call': '#0EA5E9',
    'Email Marketing': '#EC4899',
  },
  categoryColors: {
    'Language Translation Services': '#2563EB',
    Attestation: '#0D9488',
    Transcription: '#7C3AED',
    Interpretation: '#D97706',
    Visa: '#E11D48',
  },
  layouts: DEFAULT_LAYOUTS,
  formLayout: 'Standard View',
  businessCardFields: ['Mobile', 'Lead Status', 'City', 'Lead Aging', 'Category'],
  workflowRules: [
    { id: 'wf-1', name: 'Auto-Assign Chennai Leads to Karthik S', module: 'Leads', trigger: 'On Lead Creation (City = Chennai)', action: 'Assign Owner & Create Follow-up Task', active: true },
    { id: 'wf-2', name: 'Tag High Score Leads for Followup', module: 'Leads', trigger: 'When Visitor Score >= 80', action: 'Set Tag = followup', active: true },
    { id: 'wf-3', name: 'Require CEO Approval on Enterprise Deals', module: 'Deals', trigger: 'When Deal Amount > ₹ 5,00,000', action: 'Flag Deal Approval = Pending', active: true },
    { id: 'wf-4', name: 'Send Welcome WhatsApp on Website Inquiry', module: 'Leads', trigger: 'On Lead Creation (Source = Website)', action: 'Queue Welcome Message & Call Follow-up', active: true },
  ],
  rolePermissions: {
    Administrator: {
      canCreate: true,
      canEdit: true,
      canImport: true,
      canBulkImport: true,
      canExport: true,
      canConvert: true,
      canApproveDeals: true,
      canDelete: true,
      canCustomize: true,
    },
    'Sales Manager': {
      canCreate: true,
      canEdit: true,
      canImport: true,
      canBulkImport: true,
      canExport: true,
      canConvert: true,
      canApproveDeals: true,
      canDelete: true,
      canCustomize: true,
    },
    'Sales Executive': {
      canCreate: true,
      canEdit: true,
      canImport: true,
      canBulkImport: false,
      canExport: true,
      canConvert: true,
      canApproveDeals: false,
      canDelete: false,
      canCustomize: false,
    },
  },
  activeRole: 'Administrator',
};

export function getAllConfiguredColumns(config = DEFAULT_CUSTOMIZATION) {
  const customCols = Array.isArray(config?.customColumns) ? config.customColumns : [];
  const removedSet = new Set(Array.isArray(config?.removedColumnKeys) ? config.removedColumnKeys : []);
  const combined = [...ALL_LEADS_COLUMNS];
  customCols.forEach((cc) => {
    if (cc && cc.key && !combined.some((c) => c.key === cc.key)) {
      combined.push({
        key: cc.key,
        label: cc.label || cc.key,
        defaultVisible: true,
        width: Number(cc.width) || 150,
        isCustom: true,
      });
    }
  });
  return combined.filter((c) => !removedSet.has(c.key));
}

export function loadCustomization() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOMIZATION;
    const parsed = JSON.parse(raw);
    const mergedRoles = { ...DEFAULT_CUSTOMIZATION.rolePermissions };
    if (parsed.rolePermissions && typeof parsed.rolePermissions === 'object') {
      Object.keys(parsed.rolePermissions).forEach((role) => {
        mergedRoles[role] = {
          ...(DEFAULT_CUSTOMIZATION.rolePermissions[role] || {
            canCreate: true,
            canEdit: true,
            canImport: true,
            canBulkImport: false,
            canExport: true,
            canConvert: true,
            canApproveDeals: false,
            canDelete: false,
            canCustomize: false,
          }),
          ...(parsed.rolePermissions[role] || {}),
        };
      });
    }
    const isUpToDateTags = parsed.tagsVersion === 3 && Array.isArray(parsed.customTags) && parsed.customTags.length > 0;
    const forbiddenTags = new Set(['hot lead', 'hot', 'lead', 'product demo', 'it industry', 'swich offival', 'tag']);
    const sanitizedTags = (isUpToDateTags ? parsed.customTags : [...LEAD_TAGS]).filter(
      (t) => t && !forbiddenTags.has(String(t).trim().toLowerCase())
    );
    const mergedTagColors = { ...DEFAULT_CUSTOMIZATION.tagColors, ...(isUpToDateTags ? parsed.tagColors || {} : {}) };
    delete mergedTagColors['Hot Lead'];
    delete mergedTagColors['Hot'];
    delete mergedTagColors['swich offival'];
    delete mergedTagColors['tag'];

    return {
      ...DEFAULT_CUSTOMIZATION,
      ...parsed,
      tagsVersion: 3,
      customTags: sanitizedTags.length > 0 ? sanitizedTags : [...LEAD_TAGS],
      customColumns: Array.isArray(parsed.customColumns) ? parsed.customColumns : [],
      removedColumnKeys: Array.isArray(parsed.removedColumnKeys) ? parsed.removedColumnKeys : [],
      layouts: Array.isArray(parsed.layouts) && parsed.layouts.length > 0 ? parsed.layouts : DEFAULT_LAYOUTS,
      statusColors: { ...DEFAULT_CUSTOMIZATION.statusColors, ...(parsed.statusColors || {}) },
      tagColors: mergedTagColors,
      sourceColors: { ...DEFAULT_CUSTOMIZATION.sourceColors, ...(parsed.sourceColors || {}) },
      categoryColors: { ...DEFAULT_CUSTOMIZATION.categoryColors, ...(parsed.categoryColors || {}) },
      columnWidths: { ...DEFAULT_CUSTOMIZATION.columnWidths, ...(parsed.columnWidths || {}) },
      rolePermissions: mergedRoles,
    };
  } catch {
    return DEFAULT_CUSTOMIZATION;
  }
}

export function saveCustomization(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('zcrm-customization-updated', { detail: next }));
  } catch {
    // ignore storage errors
  }
}

export function useZohoCustomization() {
  const [config, setConfig] = useState(loadCustomization);

  useEffect(() => {
    const handler = (e) => {
      setConfig(e.detail || loadCustomization());
    };
    window.addEventListener('zcrm-customization-updated', handler);
    return () => window.removeEventListener('zcrm-customization-updated', handler);
  }, []);

  const updateConfig = (patch) => {
    setConfig((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      saveCustomization(next);
      return next;
    });
  };

  const resetConfig = () => {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_CUSTOMIZATION));
    saveCustomization(fresh);
    setConfig(fresh);
  };

  return { config, updateConfig, resetConfig };
}

