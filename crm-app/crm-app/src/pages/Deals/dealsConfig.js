/**
 * Centralized Configuration for Deals Module (Frontend Source of Truth)
 * Decouples dropdown options, stages, probabilities, and field configurations
 * for CreateDeal, EditDeal, DealDetail, and SplitView.
 */

// 1. Deal Stages (Exact 9 canonical stages in sequence)
export const STAGES = [
  'Need Deal Estimation',
  'Deal Estimation Ready',
  'Deal Estimation sent to Client',
  'Deal Estimation accepted- Invoice Need',
  'Deal Invoice Ready',
  'Deal Closed (Won)',
  'Deal Job Seeking& Agency',
  'Pre- Deal Lost',
  'Deal Closed (Lost)'
];

// Stage Probability Mapping (%)
export const STAGE_PROBABILITY = {
  'Need Deal Estimation': 10,
  'Deal Estimation Ready': 30,
  'Deal Estimation sent to Client': 50,
  'Deal Estimation accepted- Invoice Need': 70,
  'Deal Invoice Ready': 90,
  'Deal Closed (Won)': 100,
  'Deal Job Seeking& Agency': 100,
  'Deal Job Seeking & Agency': 100,
  'Pre- Deal Lost': 0,
  'Pre-Deal Lost': 0,
  'Deal Closed (Lost)': 0
};

// Stage Color Codes (Exact user-specified hex colors)
export const STAGE_COLORS = {
  'Need Deal Estimation': '#FDE68A', // YELLOW
  'Deal Estimation Ready': '#BBF7D0', // GREEN
  'Deal Estimation sent to Client': '#BAE6FD', // LIGHT BLUE
  'Deal Estimation accepted- Invoice Need': '#FBCFE8', // LIGHT PINK
  'Deal Invoice Ready': '#BAE6FD', // LIGHT BLUE
  'Deal Closed (Won)': '#BBF7D0', // GREEN
  'Deal Job Seeking& Agency': '#FDE68A', // YELLOW
  'Deal Job Seeking & Agency': '#FDE68A', // YELLOW
  'Pre- Deal Lost': '#FECACA', // RED
  'Pre-Deal Lost': '#FECACA', // RED
  'Deal Closed (Lost)': '#FECACA', // RED
  // Fallbacks
  'Closed Won': '#BBF7D0',
  'Closed Lost': '#FECACA'
};

// Stage Text Colors (Appropriate dark text colors for readability)
export const STAGE_TEXT_COLORS = {
  'Need Deal Estimation': '#78350F',
  'Deal Estimation Ready': '#14532D',
  'Deal Estimation sent to Client': '#0C4A6E',
  'Deal Estimation accepted- Invoice Need': '#831843',
  'Deal Invoice Ready': '#0C4A6E',
  'Deal Closed (Won)': '#14532D',
  'Deal Job Seeking& Agency': '#78350F',
  'Deal Job Seeking & Agency': '#78350F',
  'Pre- Deal Lost': '#7F1D1D',
  'Pre-Deal Lost': '#7F1D1D',
  'Deal Closed (Lost)': '#7F1D1D',
  'Closed Won': '#14532D',
  'Closed Lost': '#7F1D1D'
};

// 2. Lead Sources (Exact 19 options from user specifications)
export const LEAD_SOURCE_OPTIONS = [
  '-None-',
  'BNI Referral',
  'Website',
  'IndiaMart',
  'Insurance Companies',
  'HRD',
  'Existing Client',
  'Client Referral',
  'Sibi Sir give lead',
  'JD',
  'Database call',
  'Direct Call',
  'Quick Documentation',
  'Quick Kerala',
  'Client Direct Visit',
  'DM',
  'Campaign Lead',
  'Linxon',
  'Email Marketing',
  'Tender'
];

// Lead Source Color Map (Matches reference screenshot dots and badges)
export const LEAD_SOURCE_COLORS = {
  '-None-': '#94A3B8',
  'BNI Referral': '#8B5CF6',
  'Website': '#DC2626',
  'IndiaMart': '#06B6D4',
  'Insurance Companies': '#10B981',
  'HRD': '#EC4899',
  'Existing Client': '#14B8A6',
  'Client Referral': '#84CC16',
  'Sibi Sir give lead': '#F43F5E',
  'JD': '#64748B',
  'Database call': '#0284C7',
  'Direct Call': '#D97706',
  'Quick Documentation': '#7C3AED',
  'Quick Kerala': '#2563EB',
  'Client Direct Visit': '#9333EA',
  'DM': '#EAB308',
  'Campaign Lead': '#38BDF8',
  'Linxon': '#22C55E',
  'Email Marketing': '#6366F1',
  'Tender': '#F97316'
};

// 3. Languages (Strictly valid languages, -None- is excluded from selectable options)
export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Dutch',
  'Swedish',
  'Danish',
  'Norwegian',
  'Finnish',
  'Polish',
  'Czech',
  'Hungarian',
  'Greek',
  'Turkish',
  'Hebrew',
  'Thai',
  'Vietnamese',
  'Indonesian',
  'Malay'
];

// 4. Job Types
export const JOB_TYPE_OPTIONS = [
  '-None-',
  'ONE TIME',
  'Recurring Job'
];

export const JOB_TYPE_COLORS = {
  '-None-': '#94A3B8',
  'ONE TIME': '#16A34A',
  'Recurring Job': '#DC2626'
};

// 5. Purpose of Translation
export const PURPOSE_TRANSLATION_OPTIONS = [
  'Business',
  'Legal',
  'Medical & Healthcare',
  'Marketing & Advertising',
  'Technical & Engineering',
  'Financial & Banking',
  'Educational & Academic',
  'Government & Public Sector',
  'IT & Software',
  'Personal Documents',
  'Other'
];

// 6. Delivery Types
export const DELIVERY_TYPE_OPTIONS = [
  '-None-',
  'Urgency(immediate)',
  'Within 1 hour',
  'Within 2 hour',
  'Normal',
  'As usual'
];

export const DELIVERY_TYPE_COLORS = {
  '-None-': '#94A3B8',
  'Urgency(immediate)': '#16A34A',
  'Within 1 hour': '#2563EB',
  'Within 2 hour': '#EC4899',
  'Normal': '#7C3AED',
  'As usual': '#F87171'
};

// 7. Submission Status (Exact options from user specifications & reference screenshot)
export const SUBMISSION_STATUS_OPTIONS = [
  '-None-',
  'All Set.Need Deal Estimation',
  'Pendings Info'
];

// Submission Status Color Map (Matches reference screenshot 2)
export const SUBMISSION_STATUS_COLORS = {
  '-None-': '#94A3B8',
  'All Set.Need Deal Estimation': '#22C55E',
  'Pendings Info': '#DC2626'
};

// 8. Previous Pending Estimations
export const PREVIOUS_PENDING_ESTIMATIONS_OPTIONS = [
  '-None-',
  'EST-2025-104',
  'EST-2026-002',
  'EST-2026-015',
  'EST-2026-031'
];

// 9. Type (Deal Type)
export const TYPE_OPTIONS = [
  'Existing Business',
  'New Business',
  'Add-on Business',
  'Renewal'
];

// 10. Forecast Category (Matches Screenshot 4)
export const FORECAST_CATEGORY_OPTIONS = [
  'Pipeline',
  'Best Case',
  'Committed'
];

export const FORECAST_CATEGORY_COLORS = {
  'Pipeline': '#0284C7',
  'Best Case': '#F87171',
  'Committed': '#D946EF',
  'Commit': '#D946EF'
};

// 11. Categories (Deal Category Selection)
export const CATEGORIES_OPTIONS = [
  'translations',
  'Translation',
  'Interpretation',
  'Localization',
  'Transcription',
  'Content Writing',
  'Language Training',
  'Other'
];

// 11b. Territories (Searchable inline selection)
export const TERRITORY_OPTIONS = [
  '-None-',
  'India',
  'North America',
  'Europe',
  'Asia Pacific',
  'Middle East',
  'Australia',
  'Latin America',
  'South East Asia',
  'United Kingdom'
];

// 12. Category (Business Market Category)
export const CATEGORY_OPTIONS = [
  'Commercial',
  'Enterprise',
  'Government',
  'Retail',
  'Education',
  'Non-Profit',
  'Partner'
];

// 13. Approval Statuses
export const APPROVAL_STATUS_OPTIONS = [
  '-None-',
  'Pending Approval',
  'Approved',
  'Rejected',
  'N/A'
];

// 14. EST Ready Options
export const EST_READY_OPTIONS = [
  '-None-',
  'Pending',
  'Ready',
  'Not Applicable'
];

// 15. Standard Deal Tags matching Zoho CRM reference screenshots
export const DEFAULT_DEAL_TAGS = [
  { id: 'tag-1', name: 'No Requirements', color: '#EA580C', textColor: '#FFFFFF' }, // Orange
  { id: 'tag-2', name: 'Junk', color: '#DC2626', textColor: '#FFFFFF' }, // Red/Orange
  { id: 'tag-3', name: 'Deal Done', color: '#16A34A', textColor: '#FFFFFF' }, // Green
  { id: 'tag-4', name: 'Not contactable', color: '#881337', textColor: '#FFFFFF' }, // Maroon
  { id: 'tag-5', name: 'followup', color: '#EAB308', textColor: '#1F2937' }, // Yellow (dark text)
  { id: 'tag-6', name: 'Estimation Sent', color: '#DB2777', textColor: '#FFFFFF' }, // Pink
  { id: 'tag-7', name: 'Waiting for Estimation', color: '#6366F1', textColor: '#FFFFFF' }, // Lavender Blue
  { id: 'tag-8', name: 'Estimation Ready', color: '#EC4899', textColor: '#FFFFFF' }, // Pink
  { id: 'tag-9', name: 'Invoice Need', color: '#0D9488', textColor: '#FFFFFF' }, // Teal
  { id: 'tag-10', name: 'Invoice Sent', color: '#2563EB', textColor: '#FFFFFF' }, // Blue
  { id: 'tag-11', name: 'Whatsapp Followups', color: '#16A34A', textColor: '#FFFFFF' }, // Bright Green
  { id: 'tag-12', name: 'Closed Lost', color: '#DC2626', textColor: '#FFFFFF' }, // Red
  { id: 'tag-13', name: 'Future Requirements', color: '#C2410C', textColor: '#FFFFFF' }, // Dark Orange
  { id: 'tag-14', name: 'Ideal Deal', color: '#65A30D', textColor: '#FFFFFF' }, // Olive Green
  { id: 'tag-15', name: 'Duplicate', color: '#831843', textColor: '#FFFFFF' }, // Maroon
  { id: 'tag-16', name: 'Already Job Completed', color: '#0284C7', textColor: '#FFFFFF' }, // Cyan Blue
  { id: 'tag-17', name: 'Foreign Number', color: '#10B981', textColor: '#FFFFFF' }, // Light Green
  { id: 'tag-18', name: 'Block List', color: '#B91C1C', textColor: '#FFFFFF' }, // Red
];

// 16. Organize Potentials Details - 20 Canonical Sections matching reference screenshot
export const DEFAULT_ORGANIZE_SECTIONS = [
  { id: 'section-notes', label: 'Notes', visible: true },
  { id: 'section-contact-roles', label: 'Contact Roles', visible: true },
  { id: 'section-attachments', label: 'Attachments', visible: true },
  { id: 'section-emails', label: 'Emails', visible: true },
  { id: 'section-stage-history', label: 'Stage History', visible: true },
  { id: 'section-zoho-projects', label: 'Zoho Projects', visible: true },
  { id: 'section-open-activities', label: 'Open Activities', visible: true },
  { id: 'section-closed-activities', label: 'Closed Activities', visible: true },
  { id: 'section-zoho-finance', label: 'Zoho Finance', visible: true },
  { id: 'section-zoho-desk', label: 'Zoho Desk', visible: false },
  { id: 'section-competitors', label: 'Competitors', visible: false },
  { id: 'section-products', label: 'Products', visible: false },
  { id: 'section-zoho-survey', label: 'Zoho Survey', visible: false },
  { id: 'section-zoho-sign', label: 'ZohoSign Documents', visible: false },
  { id: 'section-cadences', label: 'Cadences', visible: false },
  { id: 'section-zoho-expense', label: 'Zoho Expense', visible: false },
  { id: 'section-cases', label: 'Cases', visible: false },
  { id: 'section-connected-records', label: 'Connected Records', visible: false },
  { id: 'section-whatsapp', label: 'Whatsapp', visible: false },
  { id: 'section-products-1', label: 'Products1', visible: false },
];


