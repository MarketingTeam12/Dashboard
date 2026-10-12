import { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  Check,
  ExternalLink,
  Info,
  Pencil,
  Phone,
  Smartphone,
  Sparkles,
  User,
  Building2,
} from 'lucide-react';
import Modal from './Modal';

/**
 * Official-style WhatsApp SVG icon.
 */
export function WhatsAppIcon({ size = 14, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.08-1.13.11-1.83-.11-.42-.13-.97-.31-1.66-.61-2.92-1.26-4.82-4.21-4.97-4.4-.15-.2-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.01-2.42.27-.29.59-.36.79-.36.2 0 .4.01.57.01.18 0 .43-.07.67.51.24.59.82 2.01.89 2.16.07.15.12.32.02.52-.1.2-.15.32-.29.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.15.46.12.63-.07.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.15.27.1 1.71.81 2 .95.29.15.49.22.56.34.07.12.07.71-.17 1.39z" />
    </svg>
  );
}

/**
 * Formats and validates a phone or mobile number for WhatsApp links (wa.me / web.whatsapp.com).
 * Normalizes 10-digit Indian numbers with country code 91, strips non-digits, and validates 8-15 digits.
 */
export function formatWhatsAppNumber(rawInput, defaultCountryCode = '91') {
  const raw = String(rawInput ?? '').trim();
  if (!raw) {
    return {
      valid: false,
      digits: '',
      e164: '',
      formattedDisplay: '',
      reason: 'No phone or mobile number is available on this record.',
    };
  }

  // Strip all non-digit characters
  let digits = raw.replace(/\D/g, '');

  if (!digits) {
    return {
      valid: false,
      digits: '',
      e164: '',
      formattedDisplay: raw,
      reason: 'Phone number contains no digits. Please enter a valid mobile or phone number.',
    };
  }

  // Normalize 00 international prefix (e.g. 00919840010000 -> 919840010000)
  if (digits.startsWith('00') && digits.length > 10) {
    digits = digits.slice(2);
  }

  // Normalize leading trunk 0 on 11-digit domestic numbers (e.g. 09840010000 or 04428154100 -> 10 digits)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Prepend default country code (91) for standard 10-digit numbers without a country code
  if (digits.length === 10 && !raw.startsWith('+')) {
    digits = `${defaultCountryCode}${digits}`;
  }

  // Strip any remaining leading zeros
  digits = digits.replace(/^0+/, '');

  if (digits.length < 8 || digits.length > 15) {
    return {
      valid: false,
      digits,
      e164: digits ? `+${digits}` : '',
      formattedDisplay: raw,
      reason: 'Enter a valid WhatsApp number (10-digit mobile/phone or 8–15 digits with country code).',
    };
  }

  // Format for readable display (e.g. +91 98400 10000)
  let formattedDisplay = `+${digits}`;
  if (digits.startsWith('91') && digits.length === 12) {
    formattedDisplay = `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }

  return {
    valid: true,
    digits,
    e164: `+${digits}`,
    formattedDisplay,
    reason: '',
  };
}

/**
 * Builds WhatsApp deep links for both mobile/universal (wa.me) and desktop WhatsApp Web.
 */
export function buildWhatsAppUrls(digits, message = '') {
  const cleanDigits = String(digits || '').replace(/\D/g, '');
  const encodedText = encodeURIComponent(String(message || ''));
  const textQuery = encodedText ? `?text=${encodedText}` : '';
  const webTextQuery = encodedText ? `&text=${encodedText}` : '';

  return {
    universalUrl: `https://wa.me/${cleanDigits}${textQuery}`,
    webUrl: `https://web.whatsapp.com/send?phone=${cleanDigits}${webTextQuery}`,
  };
}

/**
 * Shared WhatsApp Message Composer Modal for Contact and Account detail pages.
 */
export default function WhatsAppComposerModal({
  open,
  onClose,
  recordType = 'Contact', // 'Contact' | 'Account'
  recordName = '',
  recordSubtitle = '',
  mobile = '',
  phone = '',
  otherPhone = '',
  homePhone = '',
  preferredField = '',
  defaultMessage = '',
  ownerName = '',
  onSavePhone, // (updates: { mobile?: string, phone?: string }) => void
  onOpenedWhatsApp, // ({ number, message, mode }) => void
}) {
  // Collect candidate numbers from the record
  const candidateNumbers = useMemo(() => {
    const items = [];
    const seen = new Set();
    const pushIfNew = (field, label, rawVal) => {
      const val = String(rawVal || '').trim();
      if (!val || seen.has(val)) return;
      seen.add(val);
      items.push({ field, label, value: val });
    };
    pushIfNew('mobile', 'Mobile', mobile);
    pushIfNew('phone', 'Phone', phone);
    pushIfNew('otherPhone', 'Other Phone', otherPhone);
    pushIfNew('homePhone', 'Home Phone', homePhone);
    return items;
  }, [mobile, phone, otherPhone, homePhone]);

  const initialNumber = useMemo(() => {
    const byField = {
      mobile: String(mobile || '').trim(),
      phone: String(phone || '').trim(),
      otherPhone: String(otherPhone || '').trim(),
      homePhone: String(homePhone || '').trim(),
    };
    if (preferredField && byField[preferredField]) return byField[preferredField];
    if (byField.mobile) return byField.mobile;
    if (byField.phone) return byField.phone;
    if (byField.otherPhone) return byField.otherPhone;
    if (byField.homePhone) return byField.homePhone;
    return '';
  }, [mobile, phone, otherPhone, homePhone, preferredField]);

  const [selectedField, setSelectedField] = useState('mobile');
  const [phoneInput, setPhoneInput] = useState(initialNumber);
  const [isEditingNumber, setIsEditingNumber] = useState(!initialNumber);
  const [message, setMessage] = useState(defaultMessage);
  const [savedFeedback, setSavedFeedback] = useState('');
  const [openedNotice, setOpenedNotice] = useState(null);

  // Sync state when modal opens or record changes
  useEffect(() => {
    if (!open) return;
    const byField = {
      mobile: String(mobile || '').trim(),
      phone: String(phone || '').trim(),
      otherPhone: String(otherPhone || '').trim(),
      homePhone: String(homePhone || '').trim(),
    };
    let startField = 'mobile';
    let startNumber = '';

    if (preferredField && byField[preferredField]) {
      startField = preferredField === 'phone' ? 'phone' : 'mobile';
      startNumber = byField[preferredField];
    } else if (byField.mobile) {
      startField = 'mobile';
      startNumber = byField.mobile;
    } else if (byField.phone) {
      startField = 'phone';
      startNumber = byField.phone;
    } else if (byField.otherPhone) {
      startField = 'mobile';
      startNumber = byField.otherPhone;
    } else if (byField.homePhone) {
      startField = 'mobile';
      startNumber = byField.homePhone;
    }

    setSelectedField(startField);
    setPhoneInput(startNumber);
    const check = formatWhatsAppNumber(startNumber);
    setIsEditingNumber(!check.valid);
    setMessage(
      defaultMessage ||
        `Hi ${recordName || 'there'},\n\nHope you are doing well. Reaching out regarding our ongoing conversation.\n\nBest regards,\n${ownerName || 'Sales Team'}`
    );
    setSavedFeedback('');
    setOpenedNotice(null);
  }, [open, mobile, phone, otherPhone, homePhone, preferredField, defaultMessage, recordName, ownerName]);

  const formatted = useMemo(() => formatWhatsAppNumber(phoneInput), [phoneInput]);

  const urls = useMemo(() => {
    if (!formatted.valid) return { universalUrl: '', webUrl: '' };
    return buildWhatsAppUrls(formatted.digits, message);
  }, [formatted, message]);

  const quickTemplates = useMemo(() => {
    const greetingName = recordName || 'there';
    const sender = ownerName || 'Sales Team';
    return [
      {
        label: 'Follow-up',
        text: `Hi ${greetingName},\n\nHope you are doing well. Following up on our recent conversation to see if you had any questions.\n\nBest regards,\n${sender}`,
      },
      {
        label: 'Meeting Check-in',
        text: `Hi ${greetingName},\n\nChecking in to schedule a quick call this week at your convenience. Please let me know a time that works for you.\n\nBest regards,\n${sender}`,
      },
      {
        label: 'Proposal / Quote',
        text: `Hi ${greetingName},\n\nWe have shared the latest proposal details. Please let us know if you would like to review them together.\n\nBest regards,\n${sender}`,
      },
    ];
  }, [recordName, ownerName]);

  const handleSaveNumberToRecord = () => {
    if (!formatted.valid) return;
    const cleanToSave = formatted.formattedDisplay;
    const targetField = selectedField === 'phone' ? 'phone' : 'mobile';
    onSavePhone?.({
      [targetField]: cleanToSave,
      ...(targetField === 'mobile' && !String(phone || '').trim() ? { phone: cleanToSave } : {}),
    });
    setPhoneInput(cleanToSave);
    setIsEditingNumber(false);
    setSavedFeedback(`Saved ${targetField === 'phone' ? 'Phone' : 'Mobile'} (${cleanToSave}) to ${recordName}`);
  };

  const handleLaunchWhatsApp = (mode) => {
    if (!formatted.valid) {
      setIsEditingNumber(true);
      return;
    }

    // If the user typed or fixed a number that differs from the record's stored number, save it to the record
    const currentRecordValue = selectedField === 'phone' ? String(phone || '').trim() : String(mobile || '').trim();
    if (onSavePhone && String(phoneInput || '').trim() !== currentRecordValue) {
      const targetField = selectedField === 'phone' ? 'phone' : 'mobile';
      onSavePhone({
        [targetField]: formatted.formattedDisplay,
      });
    }

    const targetUrl = mode === 'web' ? urls.webUrl : urls.universalUrl;
    if (typeof window !== 'undefined' && targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }

    setOpenedNotice({
      mode: mode === 'web' ? 'WhatsApp Web' : 'WhatsApp',
      number: formatted.formattedDisplay,
    });

    onOpenedWhatsApp?.({
      number: formatted.formattedDisplay,
      digits: formatted.digits,
      message,
      mode,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Send WhatsApp — ${recordName}`}
      subtitle={
        recordSubtitle ||
        `Compose your message and open WhatsApp with the recipient number and text prefilled`
      }
      size="md"
    >
      <div data-testid="whatsapp-composer-modal" className="space-y-3.5 text-[12.5px]">
        {/* Recipient Summary Card */}
        <div className="rounded-lg border border-[#DCE3EE] bg-[#F8FAFC] p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
                {recordType === 'Account' ? <Building2 size={15} /> : <User size={15} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    data-testid="whatsapp-composer-record-name"
                    className="font-semibold text-[#0F172A] text-[13px] truncate"
                  >
                    {recordName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-white border border-[#DCE3EE] text-[#475569]">
                    {recordType}
                  </span>
                </div>
                <div className="text-[11.5px] text-[#64748B] truncate">
                  {formatted.valid ? (
                    <span>
                      WhatsApp Number:{' '}
                      <strong
                        data-testid="whatsapp-composer-formatted-number"
                        className="text-[#0F172A] font-mono"
                      >
                        {formatted.formattedDisplay}
                      </strong>{' '}
                      <span className="text-[#15803D]">({formatted.e164})</span>
                    </span>
                  ) : (
                    <span className="text-[#B45309] font-medium">
                      No valid WhatsApp number set
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              data-testid="whatsapp-composer-toggle-edit-number"
              onClick={() => {
                setIsEditingNumber((prev) => !prev);
                setSavedFeedback('');
              }}
              className="h-7 px-2.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#334155] text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors"
            >
              <Pencil size={11.5} />
              <span>{isEditingNumber ? 'Hide Number Editor' : formatted.valid ? 'Edit Number' : 'Add Number'}</span>
            </button>
          </div>

          {/* Candidate number switcher if the record has both Mobile and Phone */}
          {candidateNumbers.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#E2E8F0]">
              <span className="text-[11px] text-[#64748B] mr-1">Use number:</span>
              {candidateNumbers.map((item) => {
                const isSelected = phoneInput === item.value;
                return (
                  <button
                    key={item.field}
                    type="button"
                    onClick={() => {
                      setSelectedField(item.field === 'phone' ? 'phone' : 'mobile');
                      setPhoneInput(item.value);
                      setSavedFeedback('');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                      isSelected
                        ? 'border-[#16A34A] bg-[#DCFCE7] text-[#15803D]'
                        : 'border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {item.label}: {item.value}
                  </button>
                );
              })}
            </div>
          )}

          {/* Missing / Invalid Number Alert */}
          {!formatted.valid && (
            <div
              data-testid="whatsapp-composer-invalid-number-alert"
              className="rounded-md border border-[#FCD34D] bg-[#FFFBEB] px-3 py-2 text-[#92400E] flex items-start gap-2 text-[11.5px]"
            >
              <AlertCircle size={14} className="text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Valid WhatsApp number required</div>
                <div>{formatted.reason} Add or edit the number below to enable WhatsApp.</div>
              </div>
            </div>
          )}

          {/* Add / Edit Number Editor */}
          {(isEditingNumber || !formatted.valid) && (
            <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11.5px] font-semibold text-[#334155] flex items-center gap-1.5">
                  <Phone size={12} className="text-[#16A34A]" />
                  <span>{recordType} Mobile / Phone Number</span>
                </label>
                <div className="inline-flex items-center gap-1 text-[11px]">
                  <span className="text-[#64748B]">Save to field:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedField('mobile')}
                    className={`px-2 py-0.5 rounded border ${
                      selectedField === 'mobile'
                        ? 'border-[#1262E0] bg-[#EFF6FF] text-[#1262E0] font-semibold'
                        : 'border-[#CBD5E1] bg-white text-[#475569]'
                    }`}
                  >
                    Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedField('phone')}
                    className={`px-2 py-0.5 rounded border ${
                      selectedField === 'phone'
                        ? 'border-[#1262E0] bg-[#EFF6FF] text-[#1262E0] font-semibold'
                        : 'border-[#CBD5E1] bg-white text-[#475569]'
                    }`}
                  >
                    Phone
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="tel"
                  data-testid="whatsapp-composer-phone-input"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setSavedFeedback('');
                  }}
                  placeholder="e.g. +91 98400 10000"
                  className="input h-8 text-[12.5px] font-mono flex-1"
                />
                {onSavePhone && (
                  <button
                    type="button"
                    data-testid="whatsapp-composer-save-phone-btn"
                    disabled={!formatted.valid}
                    onClick={handleSaveNumberToRecord}
                    className="h-8 px-3 rounded bg-[#1262E0] hover:bg-[#0B4BB8] disabled:opacity-50 text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Check size={13} />
                    <span>Save Number</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] text-[#64748B]">
                {formatted.valid ? (
                  <span className="text-[#15803D] font-medium">
                    Formatted for WhatsApp: <span className="font-mono">{formatted.e164}</span> (wa.me/{formatted.digits})
                  </span>
                ) : (
                  <span>Tip: 10-digit numbers automatically use country code +91, or include your full country code.</span>
                )}
              </div>
            </div>
          )}

          {savedFeedback && (
            <div className="text-[11.5px] text-[#15803D] font-medium flex items-center gap-1.5 pt-1">
              <Check size={13} />
              <span>{savedFeedback}</span>
            </div>
          )}
        </div>

        {/* Quick Templates */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
            <label className="font-semibold text-[#334155] text-[12px]">Message</label>
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] text-[#64748B] inline-flex items-center gap-1 mr-0.5">
                <Sparkles size={11} className="text-[#16A34A]" /> Templates:
              </span>
              {quickTemplates.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => setMessage(tpl.text)}
                  className="px-2 py-0.5 rounded-full border border-[#DCE3EE] bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] text-[#334155] text-[11px] font-medium transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={5}
            data-testid="whatsapp-composer-message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Write a WhatsApp message to ${recordName}...`}
            className="input p-2.5 text-[12.5px] w-full leading-relaxed"
          />
          <div className="flex items-center justify-between mt-1 text-[11px] text-[#64748B]">
            <span>Message will be prefilled in WhatsApp so you can review or edit before sending.</span>
            <span>{message.length} chars</span>
          </div>
        </div>

        {/* Clear Disclosure Banner: Must confirm sending in WhatsApp */}
        <div
          data-testid="whatsapp-composer-confirm-disclosure"
          className="rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-[#1E3A8A] flex items-start gap-2 text-[11.5px]"
        >
          <Info size={14} className="text-[#1262E0] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Confirm sending in WhatsApp:</span> Messages are not sent automatically from the CRM. Opening WhatsApp prefills the number and message—please review and press{' '}
            <span className="font-semibold">Send</span> inside WhatsApp.
          </div>
        </div>

        {/* Status notice after user clicks Open in WhatsApp */}
        {openedNotice && (
          <div
            data-testid="whatsapp-composer-opened-banner"
            className="rounded-md border border-[#86EFAC] bg-[#F0FDF4] px-3 py-2 text-[#14532D] flex items-start gap-2 text-[11.5px]"
          >
            <ExternalLink size={14} className="text-[#16A34A] shrink-0 mt-0.5" />
            <div>
              Opened <strong>{openedNotice.mode}</strong> for <strong>{openedNotice.number}</strong> with your prefilled message. Please confirm and press <strong>Send</strong> in WhatsApp to deliver it.
            </div>
          </div>
        )}

        {/* Action Footer supporting Mobile/App and WhatsApp Web */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
          <button type="button" onClick={onClose} className="btn-secondary h-8 px-3 text-[12px]">
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="whatsapp-composer-open-web-btn"
              disabled={!formatted.valid || !message.trim()}
              onClick={() => handleLaunchWhatsApp('web')}
              title="Open directly in WhatsApp Web on desktop"
              className="h-8 px-3 rounded border border-[#16A34A] bg-white hover:bg-[#F0FDF4] disabled:opacity-50 disabled:pointer-events-none text-[#15803D] text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink size={13} />
              <span>WhatsApp Web</span>
            </button>

            <button
              type="button"
              data-testid="whatsapp-composer-open-app-btn"
              disabled={!formatted.valid || !message.trim()}
              onClick={() => handleLaunchWhatsApp('app')}
              title="Open in WhatsApp app (mobile or desktop) with number and message prefilled"
              className="h-8 px-3.5 rounded bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 disabled:pointer-events-none text-white text-[12px] font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <WhatsAppIcon size={14} />
              <Smartphone size={13} className="sm:hidden" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

