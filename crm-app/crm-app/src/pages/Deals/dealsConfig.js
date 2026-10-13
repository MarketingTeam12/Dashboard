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

// 10. Forecast Category
export const FORECAST_CATEGORY_OPTIONS = [
  'Pipeline',
  'Best Case',
  'Commit',
  'Closed',
  'Omitted'
];

// 11. Categories (Deal Category Selection)
export const CATEGORIES_OPTIONS = [
  'Translation',
  'Interpretation',
  'Localization',
  'Transcription',
  'Content Writing',
  'Language Training',
  'Other'
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

