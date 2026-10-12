import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, Building2, CheckCircle2, Download,
  FileSpreadsheet, FileWarning, Info, Layers, Play, RefreshCw, Sparkles,
  Upload, UserCheck, Users, X, XCircle,
} from 'lucide-react';
import Modal from './Modal';
import { useCRM } from '../../context/CRMContext';
import { useToast } from './Toast';
import { exportCSV } from '../../utils/exportCSV';
import { todayISO } from '../../utils/calculations';
import { AVATAR_COLORS } from '../../data/seedData';

/**
 * RFC-4180 compliant CSV parser supporting quoted values, escaped quotes (""),
 * commas/newlines inside quotes, and UTF-8 BOM.
 */
export function parseCSVText(rawText = '') {
  const cleaned = String(rawText || '').replace(/^\uFEFF/, '');
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += ch;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  // Filter out completely blank rows
  const nonEmptyRows = rows.filter((r) => r.some((cell) => String(cell || '').trim() !== ''));
  if (nonEmptyRows.length === 0) {
    return { headers: [], rows: [], error: 'The uploaded CSV file is empty.' };
  }

  const headers = nonEmptyRows[0].map((h, idx) => h || `Column ${idx + 1}`);
  const dataRows = nonEmptyRows.slice(1).map((cells, idx) => {
    const rowObj = {};
    headers.forEach((h, colIdx) => {
      rowObj[h] = cells[colIdx] != null ? String(cells[colIdx]).trim() : '';
    });
    return {
      rowNumber: idx + 2, // 1-based line number in CSV (header is row 1)
      cells,
      raw: rowObj,
    };
  });

  if (dataRows.length === 0) {
    return {
      headers,
      rows: [],
      error: 'The CSV file contains headers but no data rows to import.',
    };
  }

  return { headers, rows: dataRows, error: null };
}

export const CONTACT_CRM_FIELDS = [
  { key: 'name', label: 'Contact Name (Full Name)', requiredGroup: 'name', aliases: ['contact name', 'full name', 'name', 'full contact name', 'person name'] },
  { key: 'firstName', label: 'First Name', requiredGroup: 'name', aliases: ['first name', 'firstname', 'given name', 'first'] },
  { key: 'lastName', label: 'Last Name', requiredGroup: 'name', aliases: ['last name', 'lastname', 'surname', 'family name', 'last'] },
  { key: 'salutation', label: 'Salutation', aliases: ['salutation', 'prefix', 'title prefix'] },
  { key: 'accountName', label: 'Account Name (Lookup)', aliases: ['account name', 'account', 'company', 'company name', 'organization'] },
  { key: 'email', label: 'Email', aliases: ['email', 'email address', 'primary email', 'e-mail'] },
  { key: 'secondaryEmail', label: 'Secondary Email', aliases: ['secondary email', 'other email', 'alt email'] },
  { key: 'phone', label: 'Phone', aliases: ['phone', 'phone number', 'work phone', 'telephone', 'office phone'] },
  { key: 'mobile', label: 'Mobile', aliases: ['mobile', 'mobile phone', 'cell', 'cell phone', 'whatsapp'] },
  { key: 'designation', label: 'Title / Designation', aliases: ['title', 'designation', 'job title', 'role', 'position'] },
  { key: 'department', label: 'Department', aliases: ['department', 'dept', 'division'] },
  { key: 'lifecycle', label: 'Lifecycle Stage', aliases: ['lifecycle stage', 'lifecycle', 'stage', 'status'] },
  { key: 'leadSource', label: 'Lead Source', aliases: ['lead source', 'source', 'acquisition source'] },
  { key: 'ownerName', label: 'Contact Owner', aliases: ['contact owner', 'owner', 'assigned to', 'sales rep'] },
  { key: 'mailingStreet', label: 'Mailing Street', aliases: ['mailing street', 'street', 'address', 'mailing address'] },
  { key: 'mailingCity', label: 'Mailing City', aliases: ['mailing city', 'city', 'location'] },
  { key: 'mailingState', label: 'Mailing State', aliases: ['mailing state', 'state', 'province'] },
  { key: 'mailingZip', label: 'Mailing Zip / Pincode', aliases: ['mailing zip', 'zip', 'postal code', 'pincode', 'pin'] },
  { key: 'mailingCountry', label: 'Mailing Country', aliases: ['mailing country', 'country'] },
  { key: 'vendorName', label: 'Vendor Name', aliases: ['vendor name', 'vendor', 'partner'] },
  { key: 'tags', label: 'Tags', aliases: ['tags', 'tag', 'labels'] },
  { key: 'description', label: 'Description', aliases: ['description', 'notes', 'summary', 'bio'] },
];

export const ACCOUNT_CRM_FIELDS = [
  { key: 'name', label: 'Account Name (Required)', required: true, aliases: ['account name', 'name', 'company', 'company name', 'enterprise name', 'organization'] },
  { key: 'accountNumber', label: 'Account Number', aliases: ['account number', 'account no', 'acc number', 'code'] },
  { key: 'accountSite', label: 'Account Site / Branch', aliases: ['account site', 'site', 'branch', 'campus'] },
  { key: 'clientName', label: 'Client / Primary Contact Name', aliases: ['client name', 'primary contact', 'contact person'] },
  { key: 'type', label: 'Account Type', aliases: ['account type', 'type', 'category'] },
  { key: 'industry', label: 'Industry', aliases: ['industry', 'sector', 'vertical'] },
  { key: 'annualRevenue', label: 'Annual Revenue (INR)', aliases: ['annual revenue', 'revenue', 'turnover', 'arr'] },
  { key: 'employees', label: 'Employees', aliases: ['employees', 'employee count', 'headcount', 'staff'] },
  { key: 'rating', label: 'Rating', aliases: ['rating', 'tier', 'priority'] },
  { key: 'ownership', label: 'Ownership', aliases: ['ownership', 'company type', 'entity type'] },
  { key: 'phone', label: 'Phone', aliases: ['phone', 'phone number', 'telephone', 'landline'] },
  { key: 'mobile', label: 'Mobile', aliases: ['mobile', 'mobile number', 'cell'] },
  { key: 'email', label: 'Email', aliases: ['email', 'email id', 'official email', 'email address'] },
  { key: 'website', label: 'Website', aliases: ['website', 'url', 'domain', 'web'] },
  { key: 'gstin', label: 'GSTIN / GST Number', aliases: ['gstin', 'gst number', 'gst', 'gstnumber'] },
  { key: 'gstState', label: 'GST State', aliases: ['gst state', 'tax state'] },
  { key: 'panNumber', label: 'PAN Number', aliases: ['pan', 'pan number'] },
  { key: 'ownerName', label: 'Account Owner', aliases: ['account owner', 'owner', 'assigned to'] },
  { key: 'parentAccountName', label: 'Parent Account', aliases: ['parent account', 'parent company', 'holding company'] },
  { key: 'billingStreet', label: 'Billing Street', aliases: ['billing street', 'street', 'billing address', 'address'] },
  { key: 'billingCity', label: 'Billing City', aliases: ['billing city', 'city', 'location', 'hq city'] },
  { key: 'billingState', label: 'Billing State', aliases: ['billing state', 'state'] },
  { key: 'billingZip', label: 'Billing Code / Pincode', aliases: ['billing code', 'billing zip', 'pincode', 'zip', 'postal code'] },
  { key: 'billingCountry', label: 'Billing Country', aliases: ['billing country', 'country'] },
  { key: 'tags', label: 'Tags', aliases: ['tags', 'tag', 'labels'] },
  { key: 'description', label: 'Description', aliases: ['description', 'notes', 'overview'] },
];

export const SAMPLE_CONTACTS_VALID_CSV = `Salutation,First Name,Last Name,Contact Name,Account Name,Title,Department,Email,Mobile,Phone,Mailing City,Mailing State,Lifecycle Stage,Lead Source,Contact Owner,Tags
Ms.,Nandini,Krishnan,Nandini Krishnan,Acme Technologies,VP of Engineering,Engineering,nandini.krishnan@acmetech.in,+91 98401 55101,+91 44 2811 4001,Chennai,Tamil Nadu,Qualified,LinkedIn,Arun Kumar,Enterprise; Decision Maker
Mr.,Rohan,Deshmukh,Rohan Deshmukh,Zenith Solutions,Head of Procurement,Operations,rohan.deshmukh@zenith.in,+91 98401 55102,+91 80 4122 9002,Bangalore,Karnataka,Proposal Sent,Website,Divya R,High Priority; Q4
Dr.,Kavitha,Subramanian,Kavitha Subramanian,Tech Corp,Chief Data Officer,IT,kavitha.s@techcorp.in,+91 98401 55103,+91 40 2311 7788,Hyderabad,Telangana,Customer,Referral,Karthik S,AI Champion`;

export const SAMPLE_CONTACTS_INVALID_CSV = `First Name,Last Name,Contact Name,Account Name,Email,Title,Department,Mobile,Lifecycle Stage
Priya,Sharma,Priya Sharma,Acme Technologies,priya.sharma@acmetech.in,CTO,IT,+91 98400 10000,Qualified
,,,Zenith Solutions,missing.name@zenith.in,Operations Manager,Operations,+91 98400 22222,New
 Vikram,, ,Global Systems,not-a-valid-email,Director,Sales,+91 98400 33333,Contacted
Meera,walkin,Meera Walkin,Unlisted Ventures Pvt Ltd,meera.walkin@unlisted.in,Founder,Executive,+91 98400 44444,Qualified`;

export const SAMPLE_ACCOUNTS_VALID_CSV = `Account Name,Account Number,Account Type,Industry,Annual Revenue,Employees,Rating,Ownership,Phone,Email,Website,GSTIN,Billing City,Billing State,Account Owner,Tags
 Bharat Cloud Networks,ACC-9101,Customer,SaaS / Cloud,145000000,420,Hot,Private,+91 44 4500 9101,finance@bharatcloud.in,https://bharatcloud.in,33AABCB9101C1Z5,Chennai,Tamil Nadu,Arun Kumar,Enterprise; Cloud
Deccan FinServe Ltd,ACC-9102,Prospect,Fintech,89000000,260,Warm,Public,+91 80 4500 9102,contact@deccanfinserve.in,https://deccanfinserve.in,29AABCD9102D1Z2,Bangalore,Karnataka,Divya R,Fintech; South
Indus Robotics & Automation,ACC-9103,Partner,Manufacturing,210000000,610,Hot,Private,+91 22 4500 9103,info@indusrobotics.in,https://indusrobotics.in,27AABCI9103E1Z9,Mumbai,Maharashtra,Karthik S,Strategic; Industrial`;

export const SAMPLE_ACCOUNTS_INVALID_CSV = `Account Name,Account Type,Industry,Annual Revenue,Employees,Rating,Email,Website,Billing City
Acme Technologies,Customer,IT Services,95000000,350,Hot,info@acmetech.in,https://acmetech.in,Chennai
,Prospect,SaaS / Cloud,45000000,120,Warm,missing.name@cloud.in,https://missingname.in,Bangalore
 Corrupted Revenue Corp,Customer,Fintech,NOT_A_NUMBER,180,Warm,bad-email-format,https://corrupt.in,Mumbai
averi Logistics India,Prospect,Logistics,64000000,210,Hot,ops@kaverilogistics.in,https://kaverilogistics.in,Hyderabad`;

/**
 * Automatically map CSV header names to CRM field keys using normalized alias matching.
 */
export function buildInitialMapping(headers = [], fieldCatalogOrModule = []) {
  const fieldCatalog = Array.isArray(fieldCatalogOrModule)
    ? fieldCatalogOrModule
    : fieldCatalogOrModule === 'accounts'
      ? ACCOUNT_CRM_FIELDS
      : CONTACT_CRM_FIELDS;
  const mapping = {};
  const usedFields = new Set();

  headers.forEach((header) => {
    const norm = String(header || '')
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    let matchedKey = '';
    for (const field of fieldCatalog) {
      if (usedFields.has(field.key)) continue;
      if (
        field.key.toLowerCase() === norm ||
        field.label.toLowerCase() === norm ||
        (field.aliases || []).some((a) => a.toLowerCase() === norm)
      ) {
        matchedKey = field.key;
        break;
      }
    }

    if (!matchedKey) {
      // Partial / fuzzy fallback
      for (const field of fieldCatalog) {
        if (usedFields.has(field.key)) continue;
        if ((field.aliases || []).some((a) => norm.includes(a.toLowerCase()))) {
          matchedKey = field.key;
          break;
        }
      }
    }

    if (matchedKey) {
      mapping[header] = matchedKey;
      usedFields.add(matchedKey);
    } else {
      mapping[header] = '';
    }
  });

  return mapping;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Evaluate all parsed rows with the current column mapping, CRM data, and duplicate strategy.
 */
export function evaluateImportRows({
  moduleType, // 'contacts' | 'accounts'
  parsedRows,
  rows,
  mapping = {},
  accounts = [],
  contacts = [],
  users = [],
  activeUser,
  duplicateMode = 'skip', // 'skip' | 'update' | 'create'
}) {
  const sourceRows = parsedRows || rows || [];
  const isContact = moduleType === 'contacts';

  // Lookup maps (case-insensitive)
  const accountByNameMap = new Map();
  accounts.forEach((a) => {
    if (a.name) accountByNameMap.set(String(a.name).trim().toLowerCase(), a);
  });

  const userByNameMap = new Map();
  users.forEach((u) => {
    if (u.name) userByNameMap.set(String(u.name).trim().toLowerCase(), u);
  });

  // Existing duplicate maps
  const existingContactByEmail = new Map();
  const existingContactByName = new Map();
  if (isContact) {
    contacts.forEach((c) => {
      if (c.email) existingContactByEmail.set(String(c.email).trim().toLowerCase(), c);
      if (c.name) existingContactByName.set(String(c.name).trim().toLowerCase(), c);
    });
  }

  const existingAccountByName = new Map();
  const existingAccountByNumber = new Map();
  if (!isContact) {
    accounts.forEach((a) => {
      if (a.name) existingAccountByName.set(String(a.name).trim().toLowerCase(), a);
      if (a.accountNumber) existingAccountByNumber.set(String(a.accountNumber).trim().toLowerCase(), a);
    });
  }

  // Track within-CSV duplicates as well
  const seenEmailsInBatch = new Map();
  const seenNamesInBatch = new Map();

  return sourceRows.map((row) => {
    const mapped = {};
    Object.entries(mapping).forEach(([csvHeader, crmField]) => {
      if (!crmField) return;
      const val = row.raw[csvHeader];
      if (val !== undefined && val !== '') {
        mapped[crmField] = String(val).trim();
      }
    });

    const errors = [];
    const warnings = [];
    let matchedAccount = null;
    let duplicateRecord = null;
    let duplicateReason = '';

    if (isContact) {
      // Resolve Contact Name / First Name + Last Name
      const hasFullName = Boolean(mapped.name && mapped.name.trim());
      const hasFirstAndLast = Boolean(
        mapped.firstName && mapped.firstName.trim() && mapped.lastName && mapped.lastName.trim()
      );

      if (!hasFullName && !hasFirstAndLast) {
        if (mapped.firstName && !mapped.lastName) {
          errors.push('Missing Last Name (provide both First Name and Last Name, or map Contact Name).');
        } else if (!mapped.firstName && mapped.lastName) {
          errors.push('Missing First Name (provide both First Name and Last Name, or map Contact Name).');
        } else {
          errors.push('Missing required Contact Name (or First Name and Last Name).');
        }
      }

      const fullName = hasFullName
        ? mapped.name.trim()
        : `${mapped.firstName || ''} ${mapped.lastName || ''}`.trim();
      const nameParts = fullName.split(/\s+/).filter(Boolean);
      const firstName = mapped.firstName || nameParts[0] || '';
      const lastName = mapped.lastName || nameParts.slice(1).join(' ') || nameParts[0] || '';

      // Validate Email if present
      if (mapped.email && !EMAIL_REGEX.test(mapped.email)) {
        errors.push(`Invalid Email format ("${mapped.email}").`);
      }
      if (mapped.secondaryEmail && !EMAIL_REGEX.test(mapped.secondaryEmail)) {
        errors.push(`Invalid Secondary Email format ("${mapped.secondaryEmail}").`);
      }

      // Match Account Name to existing account when provided
      if (mapped.accountName) {
        const foundAcc = accountByNameMap.get(mapped.accountName.toLowerCase());
        if (foundAcc) {
          matchedAccount = foundAcc;
        } else {
          warnings.push(`Account "${mapped.accountName}" not found; contact will be imported without linked Account ID.`);
        }
      }

      // Owner lookup
      const matchedOwner = mapped.ownerName
        ? userByNameMap.get(mapped.ownerName.toLowerCase())
        : null;

      // Duplicate check (by Email or Full Name)
      const emailKey = mapped.email ? mapped.email.toLowerCase() : '';
      const nameKey = fullName ? fullName.toLowerCase() : '';

      if (emailKey && existingContactByEmail.has(emailKey)) {
        duplicateRecord = existingContactByEmail.get(emailKey);
        duplicateReason = `Matches existing contact by Email (${mapped.email})`;
      } else if (nameKey && existingContactByName.has(nameKey)) {
        duplicateRecord = existingContactByName.get(nameKey);
        duplicateReason = `Matches existing contact by Name (${fullName})`;
      } else if (emailKey && seenEmailsInBatch.has(emailKey)) {
        duplicateRecord = seenEmailsInBatch.get(emailKey);
        duplicateReason = `Duplicate Email within CSV (Row #${duplicateRecord.rowNumber})`;
      } else if (nameKey && seenNamesInBatch.has(nameKey)) {
        duplicateRecord = seenNamesInBatch.get(nameKey);
        duplicateReason = `Duplicate Contact Name within CSV (Row #${duplicateRecord.rowNumber})`;
      }

      if (errors.length === 0) {
        if (emailKey && !seenEmailsInBatch.has(emailKey)) {
          seenEmailsInBatch.set(emailKey, { id: null, rowNumber: row.rowNumber, name: fullName });
        }
        if (nameKey && !seenNamesInBatch.has(nameKey)) {
          seenNamesInBatch.set(nameKey, { id: null, rowNumber: row.rowNumber, name: fullName });
        }
      }

      const tagsList = mapped.tags
        ? mapped.tags.split(/[;,]/).map((t) => t.trim()).filter(Boolean)
        : ['CSV Import'];

      const payload = {
        salutation: mapped.salutation || 'Mr.',
        firstName,
        lastName,
        name: fullName,
        accountId: matchedAccount ? matchedAccount.id : '',
        accountName: matchedAccount ? matchedAccount.name : (mapped.accountName || ''),
        designation: mapped.designation || 'Executive',
        department: mapped.department || 'General',
        email: mapped.email || '',
        secondaryEmail: mapped.secondaryEmail || '',
        phone: mapped.phone || mapped.mobile || '',
        mobile: mapped.mobile || mapped.phone || '',
        lifecycle: mapped.lifecycle || 'New',
        leadSource: mapped.leadSource || 'Website',
        ownerId: matchedOwner?.id || activeUser?.id || users[0]?.id || 'u1',
        mailingStreet: mapped.mailingStreet || '',
        mailingCity: mapped.mailingCity || 'Chennai',
        mailingState: mapped.mailingState || 'Tamil Nadu',
        mailingZip: mapped.mailingZip || '',
        mailingCountry: mapped.mailingCountry || 'India',
        city: mapped.mailingCity || 'Chennai',
        vendorName: mapped.vendorName || '',
        tags: tagsList,
        tag: tagsList.join(', '),
        description: mapped.description || '',
        lastContacted: todayISO(),
        createdTime: todayISO(),
        modifiedTime: todayISO(),
      };

      let status = 'valid';
      if (errors.length > 0) {
        status = 'invalid';
      } else if (duplicateRecord) {
        status =
          duplicateMode === 'skip'
            ? 'duplicate_skip'
            : duplicateMode === 'update'
              ? 'duplicate_update'
              : 'duplicate_create';
      }

      return {
        ...row,
        mapped,
        payload,
        displayTitle: fullName || '— Missing Contact Name —',
        displaySub: mapped.email || mapped.mobile || mapped.phone || 'No email/phone',
        matchedAccount,
        duplicateRecord,
        duplicateReason,
        errors,
        warnings,
        status,
        isValid: errors.length === 0,
      };
    } else {
      // Account validation
      const accountName = mapped.name ? mapped.name.trim() : '';
      if (!accountName) {
        errors.push('Missing required Account Name.');
      }

      if (mapped.email && !EMAIL_REGEX.test(mapped.email)) {
        errors.push(`Invalid Email format ("${mapped.email}").`);
      }

      let parsedRevenue = 25000000;
      if (mapped.annualRevenue !== undefined && mapped.annualRevenue !== '') {
        const cleanedRev = String(mapped.annualRevenue).replace(/[₹$,\s]/g, '');
        const numRev = Number(cleanedRev);
        if (isNaN(numRev) || numRev < 0) {
          errors.push(`Invalid Annual Revenue value ("${mapped.annualRevenue}").`);
        } else {
          parsedRevenue = numRev;
        }
      }

      let parsedEmployees = 120;
      if (mapped.employees !== undefined && mapped.employees !== '') {
        const cleanedEmp = String(mapped.employees).replace(/[,\s]/g, '');
        const numEmp = Number(cleanedEmp);
        if (isNaN(numEmp) || numEmp < 0) {
          errors.push(`Invalid Employees count ("${mapped.employees}").`);
        } else {
          parsedEmployees = Math.round(numEmp);
        }
      }

      const matchedOwner = mapped.ownerName
        ? userByNameMap.get(mapped.ownerName.toLowerCase())
        : null;
      const matchedParent = mapped.parentAccountName
        ? accountByNameMap.get(mapped.parentAccountName.toLowerCase())
        : null;

      // Duplicate check for Accounts (by Account Name or Account Number)
      const nameKey = accountName ? accountName.toLowerCase() : '';
      const numKey = mapped.accountNumber ? mapped.accountNumber.toLowerCase() : '';

      if (nameKey && existingAccountByName.has(nameKey)) {
        duplicateRecord = existingAccountByName.get(nameKey);
        duplicateReason = `Matches existing account by Name (${accountName})`;
      } else if (numKey && existingAccountByNumber.has(numKey)) {
        duplicateRecord = existingAccountByNumber.get(numKey);
        duplicateReason = `Matches existing account by Account Number (${mapped.accountNumber})`;
      } else if (nameKey && seenNamesInBatch.has(nameKey)) {
        duplicateRecord = seenNamesInBatch.get(nameKey);
        duplicateReason = `Duplicate Account Name within CSV (Row #${duplicateRecord.rowNumber})`;
      }

      if (errors.length === 0 && nameKey && !seenNamesInBatch.has(nameKey)) {
        seenNamesInBatch.set(nameKey, { id: null, rowNumber: row.rowNumber, name: accountName });
      }

      const tagsList = mapped.tags
        ? mapped.tags.split(/[;,]/).map((t) => t.trim()).filter(Boolean)
        : ['CSV Import'];

      const payload = {
        name: accountName,
        accountNumber: mapped.accountNumber || `ACC-${1001 + accounts.length + row.rowNumber}`,
        accountSite: mapped.accountSite || `${mapped.billingCity || 'Chennai'} Office`,
        clientName: mapped.clientName || accountName,
        type: mapped.type || 'Customer',
        industry: mapped.industry || 'IT Services',
        annualRevenue: parsedRevenue,
        employees: parsedEmployees,
        rating: mapped.rating || 'Warm',
        ownership: mapped.ownership || 'Private',
        status: 'Active',
        phone: mapped.phone || mapped.mobile || '',
        mobile: mapped.mobile || mapped.phone || '',
        email: mapped.email || '',
        emailId: mapped.email || '',
        website: mapped.website || '',
        gstin: mapped.gstin || '',
        gstNumber: mapped.gstin || '',
        gstState: mapped.gstState || mapped.billingState || 'Tamil Nadu',
        panNumber: mapped.panNumber || '',
        ownerId: matchedOwner?.id || activeUser?.id || users[0]?.id || 'u1',
        parentAccountId: matchedParent?.id || '',
        billingStreet: mapped.billingStreet || '',
        billingCity: mapped.billingCity || 'Chennai',
        billingState: mapped.billingState || 'Tamil Nadu',
        billingZip: mapped.billingZip || '',
        billingCountry: mapped.billingCountry || 'India',
        location: mapped.billingCity || 'Chennai',
        tags: tagsList,
        tag: tagsList.join(', '),
        description: mapped.description || '',
        color: AVATAR_COLORS[(accounts.length + row.rowNumber) % AVATAR_COLORS.length],
        createdTime: todayISO(),
        modifiedTime: todayISO(),
      };

      let status = 'valid';
      if (errors.length > 0) {
        status = 'invalid';
      } else if (duplicateRecord) {
        status =
          duplicateMode === 'skip'
            ? 'duplicate_skip'
            : duplicateMode === 'update'
              ? 'duplicate_update'
              : 'duplicate_create';
      }

      return {
        ...row,
        mapped,
        payload,
        displayTitle: accountName || '— Missing Account Name —',
        displaySub: `${mapped.industry || 'IT Services'} · ${mapped.billingCity || 'India'}`,
        matchedAccount: matchedParent,
        duplicateRecord,
        duplicateReason,
        errors,
        warnings,
        status,
        isValid: errors.length === 0,
      };
    }
  });
}

export default function CSVImportModal({
  open,
  onClose,
  moduleType = 'contacts', // 'contacts' | 'accounts'
  activeUser,
  onImportComplete,
}) {
  const { accounts, contacts, users, createRecord, updateRecord } = useCRM();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const isContact = moduleType === 'contacts';
  const entityLabel = isContact ? 'Contacts' : 'Accounts';
  const entitySingular = isContact ? 'Contact' : 'Account';
  const fieldCatalog = isContact ? CONTACT_CRM_FIELDS : ACCOUNT_CRM_FIELDS;

  // Step state: 'upload' | 'preview' | 'summary'
  const [step, setStep] = useState('upload');
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [duplicateMode, setDuplicateMode] = useState('skip'); // 'skip' | 'update' | 'create'
  const [previewFilter, setPreviewFilter] = useState('all'); // 'all' | 'valid' | 'duplicates' | 'errors'
  const [summaryResult, setSummaryResult] = useState(null);

  const resetModal = () => {
    setStep('upload');
    setFileName('');
    setFileError('');
    setCsvHeaders([]);
    setParsedRows([]);
    setMapping({});
    setDuplicateMode('skip');
    setPreviewFilter('all');
    setSummaryResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetModal();
    onClose?.();
  };

  const loadCSVContent = (text, name = 'import.csv') => {
    setFileError('');
    const parsed = parseCSVText(text);
    if (parsed.error) {
      setFileError(parsed.error);
      return;
    }
    setFileName(name);
    setCsvHeaders(parsed.headers);
    setParsedRows(parsed.rows);
    setMapping(buildInitialMapping(parsed.headers, fieldCatalog));
    setPreviewFilter('all');
    setStep('preview');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setFileError('Please select a valid .csv file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      loadCSVContent(String(ev.target?.result || ''), file.name);
    };
    reader.onerror = () => {
      setFileError('Failed to read the selected CSV file.');
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleTemplate = () => {
    const sampleText = isContact ? SAMPLE_CONTACTS_VALID_CSV : SAMPLE_ACCOUNTS_VALID_CSV;
    const blob = new Blob(['\uFEFF' + sampleText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isContact ? 'sample_contacts_import.csv' : 'sample_accounts_import.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Evaluate rows whenever mapping, duplicateMode, or CRM records change
  const evaluatedRows = useMemo(() => {
    if (parsedRows.length === 0) return [];
    return evaluateImportRows({
      moduleType,
      parsedRows,
      mapping,
      accounts,
      contacts,
      users,
      activeUser,
      duplicateMode,
    });
  }, [moduleType, parsedRows, mapping, accounts, contacts, users, activeUser, duplicateMode]);

  // Check if required fields are mapped at the column level
  const mappingValidation = useMemo(() => {
    const mappedFields = new Set(Object.values(mapping).filter(Boolean));
    if (isContact) {
      const hasName = mappedFields.has('name');
      const hasFirstAndLast = mappedFields.has('firstName') && mappedFields.has('lastName');
      return {
        isValid: hasName || hasFirstAndLast,
        message:
          hasName || hasFirstAndLast
            ? null
            : 'Map at least "Contact Name (Full Name)" OR both "First Name" and "Last Name" to import contacts.',
      };
    } else {
      const hasAccountName = mappedFields.has('name');
      return {
        isValid: hasAccountName,
        message: hasAccountName ? null : 'Map the required "Account Name" field to import accounts.',
      };
    }
  }, [mapping, isContact]);

  const counts = useMemo(() => {
    const validNew = evaluatedRows.filter((r) => r.status === 'valid').length;
    const dupSkip = evaluatedRows.filter((r) => r.status === 'duplicate_skip').length;
    const dupUpdate = evaluatedRows.filter((r) => r.status === 'duplicate_update').length;
    const dupCreate = evaluatedRows.filter((r) => r.status === 'duplicate_create').length;
    const invalid = evaluatedRows.filter((r) => r.status === 'invalid').length;
    const totalDuplicates = dupSkip + dupUpdate + dupCreate;
    const actionableCount = validNew + dupUpdate + dupCreate;
    return {
      total: evaluatedRows.length,
      validNew,
      dupSkip,
      dupUpdate,
      dupCreate,
      totalDuplicates,
      invalid,
      actionableCount,
    };
  }, [evaluatedRows]);

  const filteredPreviewRows = useMemo(() => {
    if (previewFilter === 'valid') {
      return evaluatedRows.filter((r) => r.status === 'valid' || r.status === 'duplicate_create' || r.status === 'duplicate_update');
    }
    if (previewFilter === 'duplicates') {
      return evaluatedRows.filter((r) => r.status.startsWith('duplicate_'));
    }
    if (previewFilter === 'errors') {
      return evaluatedRows.filter((r) => r.status === 'invalid');
    }
    return evaluatedRows;
  }, [evaluatedRows, previewFilter]);

  const handleConfirmImport = () => {
    const col = isContact ? 'contacts' : 'accounts';
    let importedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const failedRows = [];
    const batchCreatedByKey = new Map();

    evaluatedRows.forEach((row) => {
      if (row.status === 'invalid') {
        failedRows.push({
          rowNumber: row.rowNumber,
          displayTitle: row.displayTitle,
          raw: row.raw,
          errorDetails: row.errors.join('; '),
        });
        return;
      }

      if (row.status === 'duplicate_skip') {
        skippedCount += 1;
        return;
      }

      if (row.status === 'duplicate_update') {
        // Build non-empty patch from mapped fields
        const patch = {};
        Object.entries(row.payload).forEach(([k, v]) => {
          if (v !== '' && v !== undefined && v !== null) {
            patch[k] = v;
          }
        });
        const targetId =
          row.duplicateRecord?.id ||
          batchCreatedByKey.get((row.payload.email || '').toLowerCase())?.id ||
          batchCreatedByKey.get((row.payload.name || '').toLowerCase())?.id;

        if (targetId) {
          updateRecord(col, targetId, patch);
          importedCount += 1;
          updatedCount += 1;
        } else {
          const created = createRecord(col, row.payload);
          if (created?.email) batchCreatedByKey.set(String(created.email).toLowerCase(), created);
          if (created?.name) batchCreatedByKey.set(String(created.name).toLowerCase(), created);
          importedCount += 1;
          createdCount += 1;
        }
        return;
      }

      // 'valid' or 'duplicate_create'
      const created = createRecord(col, row.payload);
      if (created?.email) batchCreatedByKey.set(String(created.email).toLowerCase(), created);
      if (created?.name) batchCreatedByKey.set(String(created.name).toLowerCase(), created);
      importedCount += 1;
      createdCount += 1;
    });

    const summary = {
      fileName,
      totalRows: evaluatedRows.length,
      importedCount,
      createdCount,
      updatedCount,
      skippedCount,
      failedCount: failedRows.length,
      failedRows,
    };

    setSummaryResult(summary);
    setStep('summary');

    if (importedCount > 0) {
      toast.success(
        `Imported ${importedCount} ${importedCount === 1 ? entitySingular.toLowerCase() : entityLabel.toLowerCase()} (${skippedCount} skipped, ${failedRows.length} failed)`
      );
      onImportComplete?.(summary);
    } else if (failedRows.length > 0) {
      toast.error(`Import finished with 0 imported and ${failedRows.length} failed rows.`);
    } else {
      toast.info(`Import complete: ${skippedCount} duplicate rows skipped.`);
    }
  };

  const handleDownloadFailedRows = () => {
    if (!summaryResult?.failedRows?.length) return;
    const cols = [
      { label: 'CSV Row Number', value: (r) => r.rowNumber },
      ...csvHeaders.map((h) => ({ label: h, value: (r) => r.raw?.[h] ?? '' })),
      { label: 'Error Details', value: (r) => r.errorDetails },
    ];
    exportCSV(`failed_${moduleType}_import_rows.csv`, summaryResult.failedRows, cols);
    toast.info(`Downloaded ${summaryResult.failedRows.length} failed rows with error details.`);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Import ${entityLabel} (CSV)`}
      subtitle={
        step === 'upload'
          ? `Upload a .csv file to bulk import ${entityLabel.toLowerCase()} into your CRM.`
          : step === 'preview'
            ? `Map CSV columns to ${entitySingular} fields, choose duplicate handling, and review row validation.`
            : `Import completion summary for ${fileName}`
      }
      size="xl"
    >
      <div data-testid={`csv-import-modal-${moduleType}`} className="space-y-4">
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[12px]">
          {[
            { key: 'upload', num: 1, label: '1. Upload CSV File' },
            { key: 'preview', num: 2, label: '2. Map Fields & Validate Rows' },
            { key: 'summary', num: 3, label: '3. Completion Summary' },
          ].map((s, idx) => {
            const isCurrent = step === s.key;
            const isDone =
              (s.key === 'upload' && (step === 'preview' || step === 'summary')) ||
              (s.key === 'preview' && step === 'summary');
            return (
              <div key={s.key} className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                    isCurrent
                      ? 'bg-[#1262E0] text-white'
                      : isDone
                        ? 'bg-[#059669] text-white'
                        : 'bg-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  {isDone ? '✓' : s.num}
                </span>
                <span
                  className={`font-semibold ${
                    isCurrent ? 'text-[#1262E0]' : isDone ? 'text-[#059669]' : 'text-[#64748B]'
                  }`}
                >
                  {s.label}
                </span>
                {idx < 2 && <ArrowRight size={13} className="text-[#CBD5E1] hidden sm:inline ml-2" />}
              </div>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* STEP 1: UPLOAD CSV FILE                                           */}
        {/* ================================================================= */}
        {step === 'upload' && (
          <div data-testid="csv-step-upload" className="space-y-4">
            {/* Drag & Drop / File Input Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer?.files?.[0];
                if (droppedFile) {
                  handleFileChange({ target: { files: [droppedFile] } });
                }
              }}
              className="border-2 border-dashed border-[#93C5FD] hover:border-[#1262E0] bg-[#F8FAFF] rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                data-testid="csv-file-input"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#1262E0] flex items-center justify-center mx-auto mb-3 border border-[#BFDBFE]">
                <Upload size={22} />
              </div>
              <h4 className="text-[14px] font-semibold text-[#0F172A]">
                Click to select a .CSV file or drag and drop here
              </h4>
              <p className="text-[12.5px] text-[#64748B] mt-1 max-w-md mx-auto">
                {isContact
                  ? 'Requires at least Contact Name (or First Name + Last Name). Matching Account Names are linked automatically.'
                  : 'Requires at least Account Name. Supports Industry, Account Type, Annual Revenue, GSTIN, and Billing City.'}
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#1262E0] text-white text-[12.5px] font-semibold shadow-2xs">
                  <FileSpreadsheet size={15} /> Choose .CSV File
                </span>
              </div>
            </div>

            {fileError && (
              <div
                data-testid="csv-file-error"
                className="flex items-center gap-2 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[12.5px]"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Duplicate Handling Preference */}
            <div className="bg-white rounded-lg border border-[#DCE3EE] p-3.5 space-y-2">
              <div className="text-[12.5px] font-semibold text-[#0F172A]">
                Duplicate Record Handling
              </div>
              <p className="text-[11.5px] text-[#64748B]">
                Choose what happens when a CSV row matches an existing {entitySingular.toLowerCase()} ({isContact ? 'by Email or Contact Name' : 'by Account Name or Account Number'}):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {[
                  {
                    key: 'skip',
                    title: 'Skip Duplicates',
                    desc: `Keep existing ${entitySingular.toLowerCase()} untouched and skip the CSV row.`,
                  },
                  {
                    key: 'update',
                    title: 'Update Existing',
                    desc: `Merge non-empty CSV fields into the matching ${entitySingular.toLowerCase()}.`,
                  },
                  {
                    key: 'create',
                    title: 'Import as New',
                    desc: `Create a new ${entitySingular.toLowerCase()} record even if a match exists.`,
                  },
                ].map((opt) => {
                  const active = duplicateMode === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      data-testid={`csv-dup-mode-${opt.key}`}
                      onClick={() => setDuplicateMode(opt.key)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-[#1262E0] bg-[#EFF6FF] ring-1 ring-[#1262E0]'
                          : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="text-[12.5px] font-semibold text-[#0F172A]">{opt.title}</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5 leading-snug">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sample CSV Template Download & Quick-Load Testing Bar */}
            <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[12px] text-[#475569]">
                <span className="font-semibold text-[#0F172A] block">Need a sample CSV file?</span>
                Download a template or load a sample dataset to preview valid and invalid rows.
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-testid="csv-download-sample-btn"
                  onClick={handleDownloadSampleTemplate}
                  className="h-8 px-3 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#334155] text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13.5} /> Download Sample CSV
                </button>
                <button
                  type="button"
                  data-testid="csv-load-valid-sample-btn"
                  onClick={() =>
                    loadCSVContent(
                      isContact ? SAMPLE_CONTACTS_VALID_CSV : SAMPLE_ACCOUNTS_VALID_CSV,
                      isContact ? 'sample_contacts_valid.csv' : 'sample_accounts_valid.csv'
                    )
                  }
                  className="h-8 px-3 rounded border border-[#A7F3D0] bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={13.5} /> Load Valid Sample
                </button>
                <button
                  type="button"
                  data-testid="csv-load-invalid-sample-btn"
                  onClick={() =>
                    loadCSVContent(
                      isContact ? SAMPLE_CONTACTS_INVALID_CSV : SAMPLE_ACCOUNTS_INVALID_CSV,
                      isContact ? 'sample_contacts_mixed_errors.csv' : 'sample_accounts_mixed_errors.csv'
                    )
                  }
                  className="h-8 px-3 rounded border border-[#FDE68A] bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FileWarning size={13.5} /> Load Sample with Errors
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: COLUMN MAPPING, DUPLICATE MODE & ROW VALIDATION PREVIEW   */}
        {/* ================================================================= */}
        {step === 'preview' && (
          <div data-testid="csv-step-preview" className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
            {/* Top Bar: File Info + Duplicate Handling Selector */}
            <div className="bg-white rounded-lg border border-[#DCE3EE] p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#1262E0] flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[#0F172A] truncate">
                    {fileName} <span className="text-[#64748B] font-normal">({counts.total} rows detected)</span>
                  </div>
                  <div className="text-[11.5px] text-[#64748B]">
                    {isContact
                      ? 'Required: Contact Name OR First Name + Last Name · Account Name auto-links to existing Accounts'
                      : 'Required: Account Name'}
                  </div>
                </div>
              </div>

              {/* Duplicate Handling Inline Switcher */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-[11.5px] font-semibold text-[#475569]">Duplicates:</span>
                <div className="inline-flex rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] p-0.5 text-[11.5px]">
                  {[
                    { key: 'skip', label: 'Skip' },
                    { key: 'update', label: 'Update' },
                    { key: 'create', label: 'Import as New' },
                  ].map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      data-testid={`preview-dup-mode-${d.key}`}
                      onClick={() => setDuplicateMode(d.key)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        duplicateMode === d.key
                          ? 'bg-[#1262E0] text-white shadow-2xs'
                          : 'text-[#475569] hover:text-[#0F172A]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={resetModal}
                  className="h-7 px-2.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] text-[11.5px] font-medium cursor-pointer"
                >
                  Change File
                </button>
              </div>
            </div>

            {/* Column Mapping Grid */}
            <div className="bg-white rounded-lg border border-[#DCE3EE] overflow-hidden">
              <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12.5px] font-bold text-[#0F172A]">
                  Map CSV Columns to CRM Fields ({Object.values(mapping).filter(Boolean).length} of {csvHeaders.length} mapped)
                </span>
                {!mappingValidation.isValid && (
                  <span className="text-[11.5px] font-semibold text-[#DC2626] flex items-center gap-1">
                    <AlertCircle size={13} /> {mappingValidation.message}
                  </span>
                )}
              </div>

              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[210px] overflow-y-auto">
                {csvHeaders.map((header) => {
                  const sampleVal = parsedRows[0]?.raw?.[header] || '—';
                  const mappedKey = mapping[header] || '';
                  return (
                    <div
                      key={header}
                      className={`p-2 rounded-md border text-[12px] ${
                        mappedKey ? 'border-[#BFDBFE] bg-[#F8FAFF]' : 'border-[#E2E8F0] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-[#0F172A] truncate" title={header}>
                          {header}
                        </span>
                        <span className="text-[10.5px] text-[#64748B] truncate max-w-[110px]" title={`Row 1: ${sampleVal}`}>
                          e.g. {sampleVal}
                        </span>
                      </div>
                      <select
                        aria-label={`Map column ${header}`}
                        data-testid={`csv-map-select-${header}`}
                        value={mappedKey}
                        onChange={(e) =>
                          setMapping((prev) => ({
                            ...prev,
                            [header]: e.target.value,
                          }))
                        }
                        className="w-full h-7 px-2 rounded border border-[#CBD5E1] bg-white text-[11.5px] font-medium text-[#0F172A] focus:outline-hidden focus:border-[#1262E0]"
                      >
                        <option value="">— Do Not Import —</option>
                        {fieldCatalog.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Validation & Row Preview Table */}
            <div className="bg-white rounded-lg border border-[#DCE3EE] overflow-hidden">
              <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { key: 'all', label: `All Rows (${counts.total})` },
                    { key: 'valid', label: `Ready to Import (${counts.actionableCount})` },
                    { key: 'duplicates', label: `Duplicates (${counts.totalDuplicates})` },
                    { key: 'errors', label: `Validation Errors (${counts.invalid})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      data-testid={`csv-preview-tab-${tab.key}`}
                      onClick={() => setPreviewFilter(tab.key)}
                      className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold transition-colors cursor-pointer ${
                        previewFilter === tab.key
                          ? 'bg-[#1262E0] text-white'
                          : 'bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[11.5px]">
                  <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] font-semibold">
                    {counts.actionableCount} Will Import
                  </span>
                  {counts.dupSkip > 0 && (
                    <span className="px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] font-semibold">
                      {counts.dupSkip} Will Skip
                    </span>
                  )}
                  {counts.invalid > 0 && (
                    <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] font-semibold">
                      {counts.invalid} Errors
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto max-h-[260px]">
                <table className="w-full text-left text-[12px]" data-testid="csv-preview-table">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] sticky top-0">
                    <tr>
                      <th className="py-2 px-3 font-semibold w-16">Row #</th>
                      <th className="py-2 px-3 font-semibold">Status</th>
                      <th className="py-2 px-3 font-semibold">{entitySingular} Name</th>
                      <th className="py-2 px-3 font-semibold">
                        {isContact ? 'Account Lookup' : 'Industry & Location'}
                      </th>
                      <th className="py-2 px-3 font-semibold">
                        {isContact ? 'Email / Phone' : 'Revenue / GSTIN'}
                      </th>
                      <th className="py-2 px-3 font-semibold">Validation &amp; Duplicate Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredPreviewRows.map((r) => (
                      <tr
                        key={r.rowNumber}
                        data-testid="csv-preview-row"
                        data-row-status={r.status}
                        className={r.status === 'invalid' ? 'bg-[#FEF2F2]/60' : 'hover:bg-[#F8FAFC]'}
                      >
                        <td className="py-2 px-3 font-mono font-semibold text-[#475569]">#{r.rowNumber}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {r.status === 'valid' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                              <CheckCircle2 size={11} /> Ready
                            </span>
                          )}
                          {r.status === 'duplicate_skip' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                              <Info size={11} /> Duplicate (Skip)
                            </span>
                          )}
                          {r.status === 'duplicate_update' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#1262E0] border border-[#BFDBFE]">
                              <RefreshCw size={11} /> Duplicate (Update)
                            </span>
                          )}
                          {r.status === 'duplicate_create' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE]">
                              <Sparkles size={11} /> Duplicate (Import New)
                            </span>
                          )}
                          {r.status === 'invalid' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                              <XCircle size={11} /> Error
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#0F172A]">
                          {r.displayTitle}
                        </td>
                        <td className="py-2 px-3">
                          {isContact ? (
                            r.matchedAccount ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px] font-medium">
                                <Building2 size={11} /> Matched: {r.matchedAccount.name}
                              </span>
                            ) : r.mapped.accountName ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] text-[11px]">
                                Unmatched: {r.mapped.accountName}
                              </span>
                            ) : (
                              <span className="text-[#94A3B8]">—</span>
                            )
                          ) : (
                            <span className="text-[#334155]">{r.displaySub}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[#475569]">
                          {isContact
                            ? r.displaySub
                            : `${r.mapped.annualRevenue || '—'}${r.mapped.gstin ? ` · ${r.mapped.gstin}` : ''}`}
                        </td>
                        <td className="py-2 px-3">
                          {r.errors.length > 0 ? (
                            <div className="text-[#DC2626] font-medium space-y-0.5">
                              {r.errors.map((err, i) => (
                                <div key={i}>{err}</div>
                              ))}
                            </div>
                          ) : r.duplicateReason ? (
                            <div className="text-[#D97706] font-medium">{r.duplicateReason}</div>
                          ) : r.warnings.length > 0 ? (
                            <div className="text-[#64748B]">{r.warnings.join('; ')}</div>
                          ) : (
                            <span className="text-[#059669] font-medium">Valid {entitySingular.toLowerCase()} row</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={resetModal}
                className="h-9 px-3.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] text-[12.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to File Upload
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-9 px-3.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] text-[12.5px] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid="csv-confirm-import-btn"
                  disabled={!mappingValidation.isValid}
                  onClick={handleConfirmImport}
                  className="h-9 px-4 rounded-lg bg-[#1262E0] hover:bg-[#0E4FB5] disabled:opacity-40 text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 size={15} />
                  <span>
                    Confirm &amp; Import ({counts.actionableCount} {counts.actionableCount === 1 ? 'Row' : 'Rows'})
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: COMPLETION SUMMARY & FAILED ROWS DOWNLOAD                 */}
        {/* ================================================================= */}
        {step === 'summary' && summaryResult && (
          <div data-testid="csv-step-summary" className="space-y-4">
            <div className="bg-white rounded-lg border border-[#DCE3EE] p-4 sm:p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#0F172A]">
                  {entityLabel} CSV Import Complete
                </h3>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">
                  Processed <span className="font-semibold text-[#0F172A]">{summaryResult.totalRows}</span> rows from{' '}
                  <span className="font-semibold text-[#0F172A]">{summaryResult.fileName}</span>. Imported records are saved to CRM storage.
                </p>
              </div>

              {/* 3 Summary Stat Cards: Imported, Skipped, Failed */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl mx-auto">
                <div
                  data-testid="csv-summary-imported"
                  className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]"
                >
                  <div className="text-[22px] font-bold text-[#059669]">
                    {summaryResult.importedCount}
                  </div>
                  <div className="text-[12px] font-semibold text-[#065F46]">
                    Imported
                  </div>
                  <div className="text-[11px] text-[#047857]">
                    {summaryResult.createdCount} created · {summaryResult.updatedCount} updated
                  </div>
                </div>

                <div
                  data-testid="csv-summary-skipped"
                  className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A]"
                >
                  <div className="text-[22px] font-bold text-[#D97706]">
                    {summaryResult.skippedCount}
                  </div>
                  <div className="text-[12px] font-semibold text-[#92400E]">
                    Skipped
                  </div>
                  <div className="text-[11px] text-[#B45309]">
                    Duplicate rows skipped
                  </div>
                </div>

                <div
                  data-testid="csv-summary-failed"
                  className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA]"
                >
                  <div className="text-[22px] font-bold text-[#DC2626]">
                    {summaryResult.failedCount}
                  </div>
                  <div className="text-[12px] font-semibold text-[#991B1B]">
                    Failed
                  </div>
                  <div className="text-[11px] text-[#B91C1C]">
                    Validation errors
                  </div>
                </div>
              </div>
            </div>

            {/* Failed Rows Detail Table & CSV Download */}
            {summaryResult.failedRows.length > 0 && (
              <div className="bg-white rounded-lg border border-[#FECACA] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#FEF2F2] border-b border-[#FECACA] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#991B1B]">
                    <AlertCircle size={15} className="text-[#DC2626]" />
                    <span>Failed Rows ({summaryResult.failedRows.length})</span>
                  </div>
                  <button
                    type="button"
                    data-testid="csv-download-failed-btn"
                    onClick={handleDownloadFailedRows}
                    className="h-8 px-3 rounded bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download size={13.5} />
                    <span>Download Failed Rows (CSV)</span>
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[200px]">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-[#FFF5F5] border-b border-[#FECACA] text-[#991B1B]">
                      <tr>
                        <th className="py-2 px-3 font-semibold w-20">Row #</th>
                        <th className="py-2 px-3 font-semibold">Row Values</th>
                        <th className="py-2 px-3 font-semibold">Error Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FEE2E2]">
                      {summaryResult.failedRows.map((fr) => (
                        <tr key={fr.rowNumber}>
                          <td className="py-2 px-3 font-mono font-semibold text-[#991B1B]">#{fr.rowNumber}</td>
                          <td className="py-2 px-3 text-[#334155]">
                            {Object.entries(fr.raw || {})
                              .filter(([, v]) => v)
                              .slice(0, 4)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ') || 'Empty row'}
                          </td>
                          <td className="py-2 px-3 font-medium text-[#DC2626]">{fr.errorDetails}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                data-testid="csv-import-another-btn"
                onClick={resetModal}
                className="h-9 px-3.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] text-[12.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload size={14} /> Import Another CSV
              </button>
              <button
                type="button"
                data-testid="csv-summary-done-btn"
                onClick={handleClose}
                className="h-9 px-5 rounded-lg bg-[#1262E0] hover:bg-[#0E4FB5] text-white text-[12.5px] font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

