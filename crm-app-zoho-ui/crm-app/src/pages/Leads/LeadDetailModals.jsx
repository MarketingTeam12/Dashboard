import { useState } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Check, CheckCircle2, Clock3, Code2, Copy, Download,
  ExternalLink, Eye, FileText, FolderKanban, Globe, Italic, Layers, Link2, List, Maximize2,
  MessageSquare, Minimize2, Paperclip, Play, Plus, Printer, RefreshCw, Search, Send, Share2,
  ShieldCheck, Sliders, Sparkles, Trash2, Underline, Upload, UserCheck, Users, Video, Workflow, X,
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import { todayISO } from '../../utils/calculations';

const EMAIL_TEMPLATES = [
  {
    id: 'tpl-1',
    name: 'Welcome & Translation Quotation',
    subject: 'Quotation & Turnaround Details — {{Lead.Category}}',
    body: `Dear {{Lead.Name}},\n\nThank you for contacting Honey Translation Services regarding {{Lead.Category}} ({{Lead.SourceLang}} to {{Lead.TargetLang}}).\n\nPlease find our standard certified translation turnaround and pricing details below:\n• Standard Turnaround: 24–48 Business Hours\n• ISO 9001:2015 Certified & Native Linguists\n• Includes Quality Proofreading & Formatting\n\nPlease share your source document(s) by replying to this email so we can share a firm estimate.\n\nWarm regards,\n{{Lead.Owner}}\nHoney Translation Services`,
  },
  {
    id: 'tpl-2',
    name: 'Follow-up After Discovery Call',
    subject: 'Great speaking with you today, {{Lead.Name}}!',
    body: `Hi {{Lead.Name}},\n\nIt was a pleasure speaking with you earlier regarding your {{Lead.ProductName}} requirements for {{Lead.Company}}.\n\nAs discussed on our call, we have reserved our specialist team for your project. Let us know once you are ready to proceed.\n\nBest regards,\n{{Lead.Owner}}`,
  },
  {
    id: 'tpl-3',
    name: 'Apostille & MEA Attestation Checklist',
    subject: 'Document Checklist for MEA Apostille & Embassy Attestation',
    body: `Dear {{Lead.Name}},\n\nHere is the required document checklist for processing your Attestation / Apostille request:\n1. Original Certificate (Degree / Birth / Marriage / Commercial)\n2. Clear Passport Copy (Front & Back)\n3. Authorization Letter (attached)\n\nDoorstep pickup and secure courier return are available in {{Lead.City}}.\n\nRegards,\n{{Lead.Owner}}`,
  },
  {
    id: 'tpl-4',
    name: 'Enterprise Interpretation & Localization SLA',
    subject: 'Enterprise Language Localization & Interpretation Proposal — {{Lead.Company}}',
    body: `Dear {{Lead.Name}},\n\nWe are pleased to share our Enterprise Language Localization & Simultaneous Interpretation SLA proposal tailored for {{Lead.Company}}.\n\nLooking forward to your feedback.\n\nSincerely,\n{{Lead.Owner}}`,
  },
];

const SURVEY_CATALOG = [
  {
    id: 'srv-cat-1',
    name: 'Customer Translation Satisfaction Survey (CSAT)',
    department: 'Quality Assurance',
    link: 'https://survey.zoho.in/zs/HTScsat2026',
    questions: [
      { id: 'q1', q: 'How satisfied are you with the accuracy of our translation / localization?', type: 'rating' },
      { id: 'q2', q: 'Was your project delivered within the promised turnaround time?', type: 'yesno' },
      { id: 'q3', q: 'Any additional feedback or upcoming language requirements?', type: 'text' },
    ],
  },
  {
    id: 'srv-cat-2',
    name: 'Lead Qualification & Language Needs Discovery',
    department: 'Sales Operations',
    link: 'https://survey.zoho.in/zs/HTSdiscovery',
    questions: [
      { id: 'q1', q: 'Which language pair(s) do you require support for?', type: 'text' },
      { id: 'q2', q: 'What is your estimated document volume / word count?', type: 'text' },
      { id: 'q3', q: 'Do you require certified / notarized stamps or MEA Apostille?', type: 'yesno' },
    ],
  },
  {
    id: 'srv-cat-3',
    name: 'Interpretation & VoiceOver Event Readiness Survey',
    department: 'Enterprise Events',
    link: 'https://survey.zoho.in/zs/HTSevents',
    questions: [
      { id: 'q1', q: 'Preferred mode of interpretation (Simultaneous / Consecutive / Remote Zoom)?', type: 'text' },
      { id: 'q2', q: 'How many delegates / participants will attend?', type: 'text' },
    ],
  },
];

/**
 * Section 6: Rich Zoho Email Composer Window (with From, To, CC, BCC, Templates, Rich Text Toolbar, Attachments, Draft, Schedule, Send, Minimize/Maximize/Close)
 */
export function ZohoEmailComposerModal({
  open,
  onClose,
  lead,
  ownerName,
  initialMode = 'Mails',
  onSendEmail,
  onNotify,
}) {
  const [fromAddr, setFromAddr] = useState(`sibi@crm.in <${ownerName || 'Karthik S'}>`);
  const [toAddr, setToAddr] = useState(lead?.email || `${(lead?.firstName || 'client').toLowerCase()}@example.com`);
  const [ccAddr, setCcAddr] = useState('');
  const [bccAddr, setBccAddr] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(`Follow-up regarding ${lead?.productName || lead?.category || 'Language Translation Services'}`);
  const [body, setBody] = useState(
    `Dear ${lead?.name || 'Client'},\n\nThank you for reaching out to us regarding ${lead?.productName || lead?.category || 'our services'}.\nPlease let us know a convenient time to discuss your project timeline and deliverables.\n\nWarm regards,\n${ownerName || 'Karthik S'}\nHoney Translation Services`
  );
  const [fontFamily, setFontFamily] = useState('Sans Serif');
  const [fontSize, setFontSize] = useState('13px');
  const [attachments, setAttachments] = useState([]);
  const [scheduleMode, setScheduleMode] = useState(initialMode === 'Scheduled');
  const [scheduleDate, setScheduleDate] = useState(todayISO());
  const [scheduleTime, setScheduleTime] = useState('10:30');
  const [windowState, setWindowState] = useState('normal'); // 'normal' | 'maximized' | 'minimized'

  if (!open) return null;

  const applyTemplate = (tplId) => {
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    const replaceVars = (str) =>
      str
        .replace(/\{\{Lead\.Name\}\}/g, lead?.name || 'Client')
        .replace(/\{\{Lead\.Company\}\}/g, lead?.company || 'your organization')
        .replace(/\{\{Lead\.Category\}\}/g, lead?.category || 'Language Translation Services')
        .replace(/\{\{Lead\.ProductName\}\}/g, lead?.productName || 'Translation Services')
        .replace(/\{\{Lead\.SourceLang\}\}/g, lead?.sourceLang || 'English')
        .replace(/\{\{Lead\.TargetLang\}\}/g, lead?.targetLang || 'German')
        .replace(/\{\{Lead\.City\}\}/g, lead?.city || 'Chennai')
        .replace(/\{\{Lead\.Owner\}\}/g, ownerName || 'Karthik S');
    setSubject(replaceVars(tpl.subject));
    setBody(replaceVars(tpl.body));
    if (onNotify) onNotify(`Inserted template "${tpl.name}"`, 'info');
  };

  const wrapSelectionWith = (prefix, suffix = prefix) => {
    setBody((prev) => `${prev}\n${prefix}Important Note${suffix}`);
  };

  const handleAttachFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachments((prev) => [
      ...prev,
      { id: `em-att-${Date.now()}`, name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB` },
    ]);
  };

  const submitEmail = (targetMode) => {
    if (!toAddr.trim()) {
      if (onNotify) onNotify('Recipient (To) email address is required', 'error');
      return;
    }
    onSendEmail({
      from: fromAddr,
      to: toAddr.trim(),
      cc: ccAddr.trim(),
      bcc: bccAddr.trim(),
      subject: subject.trim() || '(No Subject)',
      body,
      attachments,
      mode: targetMode,
      scheduledFor: targetMode === 'Scheduled' ? `${scheduleDate} ${scheduleTime}` : null,
    });
    onClose();
  };

  if (windowState === 'minimized') {
    return (
      <div className="fixed bottom-3 right-6 z-50 w-80 bg-[#1F2A44] text-white rounded-t-lg shadow-2xl px-4 py-2.5 flex items-center justify-between text-[13px]">
        <span className="font-semibold truncate">{subject || 'New Email'}</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setWindowState('normal')} title="Restore"><Maximize2 size={14} /></button>
          <button type="button" onClick={onClose} title="Close"><X size={15} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-3">
      <div
        className={`bg-white border border-[#CBD5E1] rounded-lg shadow-2xl flex flex-col overflow-hidden transition-all ${
          windowState === 'maximized' ? 'w-[96vw] h-[92vh]' : 'w-full max-w-[820px] max-h-[88vh]'
        }`}
      >
        {/* Top Bar with Minimize, Maximize, Close */}
        <div className="flex items-center justify-between px-4 h-11 bg-[#1F2A44] text-white text-[13.5px] font-semibold">
          <div className="flex items-center gap-2">
            <Send size={14} className="text-blue-300" />
            <span>Compose Email — {lead?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Minimize"
              onClick={() => setWindowState('minimized')}
              className="p-1 rounded hover:bg-white/15"
            >
              <Minimize2 size={14} />
            </button>
            <button
              type="button"
              title={windowState === 'maximized' ? 'Restore Down' : 'Maximize'}
              onClick={() => setWindowState((w) => (w === 'maximized' ? 'normal' : 'maximized'))}
              className="p-1 rounded hover:bg-white/15"
            >
              <Maximize2 size={14} />
            </button>
            <button
              type="button"
              title="Close"
              onClick={onClose}
              className="p-1 rounded hover:bg-rose-500/80"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Sender, Recipients, Templates Bar */}
        <div className="px-4 py-2.5 border-b border-[#E3E8F2] space-y-2 text-[13px] bg-[#F8FAFD]">
          <div className="flex items-center gap-3">
            <span className="w-14 text-[#5B6684] font-medium">From</span>
            <select
              value={fromAddr}
              onChange={(e) => setFromAddr(e.target.value)}
              className="flex-1 h-8 px-2.5 rounded border border-[#CBD5E1] bg-white text-[13px]"
            >
              <option value={`sibi@crm.in <${ownerName || 'Karthik S'}>`}>sibi@crm.in &lt;{ownerName || 'Karthik S'}&gt;</option>
              <option value="sales@honeytranslations.com <HTS Sales Desk>">sales@honeytranslations.com &lt;HTS Sales Desk&gt;</option>
              <option value="projects@honeytranslations.com <Project Management>">projects@honeytranslations.com &lt;Project Management&gt;</option>
            </select>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) applyTemplate(e.target.value);
                e.target.value = '';
              }}
              className="h-8 px-2.5 rounded border border-[#2F55D4] text-[#2F55D4] bg-[#EEF2FF] font-semibold text-[12.5px]"
            >
              <option value="">Insert Template...</option>
              {EMAIL_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-14 text-[#5B6684] font-medium">To</span>
            <input
              type="text"
              value={toAddr}
              onChange={(e) => setToAddr(e.target.value)}
              placeholder="recipient@company.com"
              className="flex-1 h-8 px-2.5 rounded border border-[#CBD5E1] bg-white text-[13px]"
            />
            <div className="flex items-center gap-2 text-[12px] text-[#2F55D4] font-medium">
              {!showCc && <button type="button" onClick={() => setShowCc(true)} className="hover:underline">CC</button>}
              {!showBcc && <button type="button" onClick={() => setShowBcc(true)} className="hover:underline">BCC</button>}
            </div>
          </div>

          {showCc && (
            <div className="flex items-center gap-3">
              <span className="w-14 text-[#5B6684] font-medium">CC</span>
              <input
                type="text"
                value={ccAddr}
                onChange={(e) => setCcAddr(e.target.value)}
                placeholder="cc@company.com"
                className="flex-1 h-8 px-2.5 rounded border border-[#CBD5E1] bg-white text-[13px]"
              />
              <button type="button" onClick={() => { setShowCc(false); setCcAddr(''); }} className="text-[#8B95AE] hover:text-[#1F2A44]"><X size={13} /></button>
            </div>
          )}

          {showBcc && (
            <div className="flex items-center gap-3">
              <span className="w-14 text-[#5B6684] font-medium">BCC</span>
              <input
                type="text"
                value={bccAddr}
                onChange={(e) => setBccAddr(e.target.value)}
                placeholder="bcc@company.com"
                className="flex-1 h-8 px-2.5 rounded border border-[#CBD5E1] bg-white text-[13px]"
              />
              <button type="button" onClick={() => { setShowBcc(false); setBccAddr(''); }} className="text-[#8B95AE] hover:text-[#1F2A44]"><X size={13} /></button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="w-14 text-[#5B6684] font-medium">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="flex-1 h-8 px-2.5 rounded border border-[#CBD5E1] bg-white text-[13px] font-medium"
            />
          </div>
        </div>

        {/* Rich Text Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-1.5 bg-[#F1F5F9] border-b border-[#E3E8F2] text-[#1F2A44]">
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="h-7 px-2 rounded border border-[#CBD5E1] bg-white text-[12px]"
          >
            <option value="Sans Serif">Sans Serif</option>
            <option value="Georgia">Serif</option>
            <option value="Monospace">Monospace</option>
          </select>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="h-7 px-2 rounded border border-[#CBD5E1] bg-white text-[12px]"
          >
            <option value="12px">Small</option>
            <option value="13px">Normal</option>
            <option value="15px">Large</option>
            <option value="18px">Heading</option>
          </select>
          <div className="h-4 w-[1px] bg-[#CBD5E1] mx-1" />
          <button type="button" onClick={() => wrapSelectionWith('**')} title="Bold" className="p-1.5 rounded hover:bg-white"><Bold size={13} /></button>
          <button type="button" onClick={() => wrapSelectionWith('_')} title="Italic" className="p-1.5 rounded hover:bg-white"><Italic size={13} /></button>
          <button type="button" onClick={() => wrapSelectionWith('__')} title="Underline" className="p-1.5 rounded hover:bg-white"><Underline size={13} /></button>
          <div className="h-4 w-[1px] bg-[#CBD5E1] mx-1" />
          <button type="button" onClick={() => setBody((b) => `${b}\n• Bullet item`)} title="Bullet List" className="p-1.5 rounded hover:bg-white"><List size={13} /></button>
          <button type="button" onClick={() => setBody((b) => `${b}\nhttps://www.honeytranslations.com`)} title="Insert Link" className="p-1.5 rounded hover:bg-white"><Link2 size={13} /></button>
          <label title="Attach File" className="p-1.5 rounded hover:bg-white cursor-pointer inline-flex items-center gap-1 text-[12px] text-[#2F55D4] font-medium ml-auto">
            <Paperclip size={13} /> Attach File
            <input type="file" onChange={handleAttachFile} className="hidden" />
          </label>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-4 flex flex-col min-h-[220px] overflow-y-auto">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{
              fontFamily: fontFamily === 'Georgia' ? 'Georgia, serif' : fontFamily === 'Monospace' ? 'monospace' : 'inherit',
              fontSize,
            }}
            className="w-full flex-1 min-h-[190px] resize-none border-0 focus:outline-none text-[#1F2A44] leading-relaxed"
          />

          {attachments.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#EEF1F7] flex flex-wrap gap-2">
              {attachments.map((att) => (
                <span key={att.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#2F55D4] text-[12px] font-medium">
                  <Paperclip size={12} /> {att.name} ({att.size})
                  <button type="button" onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== att.id))}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {scheduleMode && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-[12.5px]">
              <span className="font-semibold text-amber-900 inline-flex items-center gap-1.5">
                <Clock3 size={14} /> Schedule Delivery Time:
              </span>
              <div className="flex items-center gap-2">
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="h-7 px-2 rounded border border-amber-300 bg-white text-[12px]" />
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="h-7 px-2 rounded border border-amber-300 bg-white text-[12px]" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8FAFD] border-t border-[#E3E8F2]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => submitEmail('Drafts')}
              className="h-8 px-3.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F3F6FB] text-[12.5px] font-medium text-[#1F2A44]"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode((s) => !s)}
              className={`h-8 px-3.5 rounded border text-[12.5px] font-medium inline-flex items-center gap-1.5 ${
                scheduleMode ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-[#CBD5E1] bg-white text-[#1F2A44] hover:bg-[#F3F6FB]'
              }`}
            >
              <Clock3 size={13} /> {scheduleMode ? 'Scheduling Active' : 'Schedule Later'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F3F6FB] text-[12.5px] text-[#4B5578]"
            >
              Cancel
            </button>
            {scheduleMode ? (
              <button
                type="button"
                onClick={() => submitEmail('Scheduled')}
                className="h-8 px-5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-semibold inline-flex items-center gap-1.5"
              >
                <Clock3 size={13} /> Schedule Email
              </button>
            ) : (
              <button
                type="button"
                onClick={() => submitEmail('Mails')}
                className="h-8 px-5 rounded bg-[#2F55D4] hover:bg-[#2546B8] text-white text-[13px] font-semibold inline-flex items-center gap-1.5"
              >
                <Send size={13} /> Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section 8: Zoho Survey Modals (Send Survey, Take Survey, Create Survey) matching exact screenshot fields
 */
export function ZohoSurveyModal({
  open,
  mode = 'Send Survey', // 'Send Survey' | 'Take Survey' | 'Create Survey'
  onClose,
  lead,
  ownerName,
  customSurveys = [],
  onCreateSurveyCatalogItem,
  onSaveLeadSurveyRecord,
  onNotify,
}) {
  const allSurveys = [...SURVEY_CATALOG, ...customSurveys];
  const [activeMode, setActiveMode] = useState(mode);
  const [selectedSurveyId, setSelectedSurveyId] = useState(allSurveys[0]?.id || 'srv-cat-1');
  const [surveyLink, setSurveyLink] = useState(allSurveys[0]?.link || 'https://survey.zoho.in/zs/HTScsat2026');
  const [displayText, setDisplayText] = useState('Click here to complete your Zoho Survey');

  // Take Survey response state
  const [takingQuestions, setTakingQuestions] = useState(false);
  const [answers, setAnswers] = useState({});

  // Create New Survey state
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newSurveyDept, setNewSurveyDept] = useState('Sales Operations');
  const [newSurveyQ1, setNewSurveyQ1] = useState('How would you rate our translation turnaround speed?');
  const [newSurveyQ2, setNewSurveyQ2] = useState('Would you recommend Honey Translation Services to a colleague?');

  if (!open) return null;

  const currentSurvey = allSurveys.find((s) => s.id === selectedSurveyId) || allSurveys[0];

  const handleSelectSurvey = (id) => {
    setSelectedSurveyId(id);
    const found = allSurveys.find((s) => s.id === id);
    if (found) setSurveyLink(`${found.link}?lead=${lead?.leadNo || lead?.id || ''}`);
  };

  const handleInsertSendSurvey = () => {
    onSaveLeadSurveyRecord({
      id: `srv-${Date.now()}`,
      title: currentSurvey?.name || 'Customer Survey',
      mode: 'Send Survey',
      surveyLink,
      displayText: displayText || currentSurvey?.name,
      status: 'Sent',
      sentBy: ownerName,
      date: todayISO(),
    });
    if (onNotify) onNotify(`Survey "${currentSurvey?.name}" link inserted & sent to ${lead?.name}`, 'success');
    onClose();
  };

  const handleSubmitTakeSurvey = () => {
    onSaveLeadSurveyRecord({
      id: `srv-${Date.now()}`,
      title: currentSurvey?.name || 'Discovery Survey',
      mode: 'Take Survey',
      surveyLink,
      responses: answers,
      status: 'Response Submitted',
      sentBy: ownerName,
      date: todayISO(),
    });
    setTakingQuestions(false);
    setAnswers({});
    if (onNotify) onNotify(`Survey responses recorded for "${currentSurvey?.name}"`, 'success');
    onClose();
  };

  const handleCreateNewSurvey = () => {
    if (!newSurveyTitle.trim()) {
      if (onNotify) onNotify('Please enter a Survey Title', 'error');
      return;
    }
    const created = {
      id: `srv-custom-${Date.now()}`,
      name: newSurveyTitle.trim(),
      department: newSurveyDept,
      link: `https://survey.zoho.in/zs/${newSurveyTitle.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}`,
      questions: [
        { id: 'q1', q: newSurveyQ1, type: 'text' },
        { id: 'q2', q: newSurveyQ2, type: 'yesno' },
      ],
    };
    if (onCreateSurveyCatalogItem) onCreateSurveyCatalogItem(created);
    onSaveLeadSurveyRecord({
      id: `srv-${Date.now()}`,
      title: created.name,
      mode: 'Create Survey',
      surveyLink: created.link,
      status: 'Created & Published',
      sentBy: ownerName,
      date: todayISO(),
    });
    if (onNotify) onNotify(`Created new Zoho Survey "${created.name}"`, 'success');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={activeMode}
      size="md"
      footer={
        activeMode === 'Send Survey' ? (
          <>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleInsertSendSurvey}>Insert</button>
          </>
        ) : activeMode === 'Take Survey' ? (
          <>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            {!takingQuestions ? (
              <button type="button" className="btn-primary" onClick={() => setTakingQuestions(true)}>
                Take Survey
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={handleSubmitTakeSurvey}>
                Submit Survey Responses
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreateNewSurvey}>Create & Publish Survey</button>
          </>
        )
      }
    >
      <div className="space-y-4 text-[13px]">
        {/* Mode Switch Tabs */}
        <div className="flex gap-2 border-b border-[#EEF1F7] pb-2.5">
          {['Send Survey', 'Take Survey', 'Create Survey'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setActiveMode(m);
                setTakingQuestions(false);
              }}
              className={`px-3 py-1 rounded text-[12.5px] font-medium ${
                activeMode === m ? 'bg-[#2F55D4] text-white' : 'bg-[#F3F6FB] text-[#4B5578] hover:text-[#1F2A44]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {activeMode === 'Send Survey' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[#4B5578] font-medium mb-1">Select the Survey</label>
              <select
                value={selectedSurveyId}
                onChange={(e) => handleSelectSurvey(e.target.value)}
                className="input"
              >
                {allSurveys.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#4B5578] font-medium mb-1">Survey Link</label>
              <input
                type="text"
                value={surveyLink}
                onChange={(e) => setSurveyLink(e.target.value)}
                className="input bg-[#F8FAFC]"
              />
            </div>
            <div>
              <label className="block text-[#4B5578] font-medium mb-1">Text To Display (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Complete Your Translation Feedback Survey"
                value={displayText}
                onChange={(e) => setDisplayText(e.target.value)}
                className="input"
              />
            </div>
          </div>
        )}

        {activeMode === 'Take Survey' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="block text-[#4B5578] font-medium">Select the Survey</label>
              <button
                type="button"
                onClick={() => setActiveMode('Create Survey')}
                className="text-[12.5px] text-[#2F55D4] hover:underline font-semibold inline-flex items-center gap-1"
              >
                <Plus size={13} /> Create New Survey
              </button>
            </div>
            <select
              value={selectedSurveyId}
              onChange={(e) => handleSelectSurvey(e.target.value)}
              className="input"
            >
              {allSurveys.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {takingQuestions && currentSurvey && (
              <div className="p-3.5 rounded-lg bg-[#F8FAFD] border border-[#D5DBE8] space-y-3">
                <div className="font-semibold text-[#1F2A44] border-b border-[#E3E8F2] pb-1.5">
                  Responding on behalf of: {lead?.name}
                </div>
                {(currentSurvey.questions || []).map((q, idx) => (
                  <div key={q.id} className="space-y-1">
                    <label className="block text-[12.5px] font-medium text-[#1F2A44]">
                      {idx + 1}. {q.q}
                    </label>
                    {q.type === 'yesno' ? (
                      <select
                        value={answers[q.id] || 'Yes'}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="input !h-8"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : q.type === 'rating' ? (
                      <select
                        value={answers[q.id] || '5 - Extremely Satisfied'}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="input !h-8"
                      >
                        <option>5 - Extremely Satisfied</option>
                        <option>4 - Satisfied</option>
                        <option>3 - Neutral</option>
                        <option>2 - Dissatisfied</option>
                      </select>
                    ) : (
                      <input
                        className="input !h-8"
                        placeholder="Enter response..."
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeMode === 'Create Survey' && (
          <div className="space-y-3">
            <label className="block text-[#4B5578] font-medium">
              Survey Title *
              <input
                className="input mt-1"
                placeholder="e.g. Post-Delivery Localization Feedback"
                value={newSurveyTitle}
                onChange={(e) => setNewSurveyTitle(e.target.value)}
              />
            </label>
            <label className="block text-[#4B5578] font-medium">
              Department / Category
              <input
                className="input mt-1"
                value={newSurveyDept}
                onChange={(e) => setNewSurveyDept(e.target.value)}
              />
            </label>
            <label className="block text-[#4B5578] font-medium">
              Question 1
              <input
                className="input mt-1"
                value={newSurveyQ1}
                onChange={(e) => setNewSurveyQ1(e.target.value)}
              />
            </label>
            <label className="block text-[#4B5578] font-medium">
              Question 2
              <input
                className="input mt-1"
                value={newSurveyQ2}
                onChange={(e) => setNewSurveyQ2(e.target.value)}
              />
            </label>
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * Section 12: 7-Tab Add Related List Modal
 * Tabs: Unselected Related Lists | StyleUI Component | Widgets | Queries | Multi-Select Lookup Related List | Custom Apps | Functions
 */
export function AddRelatedListModal({
  open,
  onClose,
  extraRelatedLists = [],
  onToggleRelatedList,
  onAddCustomRelatedSection,
  onNotify,
}) {
  const [activeTab, setActiveTab] = useState('Unselected Related Lists');
  const [customLabel, setCustomLabel] = useState('');
  const [customSource, setCustomSource] = useState('');

  if (!open) return null;

  const TABS = [
    'Unselected Related Lists',
    'StyleUI Component',
    'Widgets',
    'Queries',
    'Multi-Select Lookup Related List',
    'Custom Apps',
    'Functions',
  ];

  const AVAILABLE_RELATED_LISTS = [
    { name: 'Notes', desc: 'Timestamped sales notes & call summaries' },
    { name: 'Campaigns', desc: 'Marketing & Zoho Campaigns linked to this Lead' },
    { name: 'Products', desc: 'Interested translation & localization products' },
    { name: 'Accounts (Connected Records)', desc: 'Linked corporate client accounts' },
    { name: 'Deals (Connected Records)', desc: 'Converted or associated revenue deals' },
    { name: 'Approval Logs', desc: 'CEO & Manager discount approval logs' },
    { name: 'Cases', desc: 'Customer support & quality escalation tickets' },
    { name: 'Solutions', desc: 'Knowledge base & glossary solutions' },
    { name: 'Vendors (Connected Records)', desc: 'External freelance translators & agencies' },
    { name: 'VoC Responses', desc: 'Voice of Customer feedback responses' },
  ];

  const handleCreateCustomRelated = () => {
    if (!customLabel.trim()) {
      if (onNotify) onNotify('Please enter a Related List Name', 'error');
      return;
    }
    const label = customLabel.trim();
    if (onAddCustomRelatedSection) {
      onAddCustomRelatedSection({
        name: label,
        category: activeTab,
        source: customSource || activeTab,
      });
    }
    setCustomLabel('');
    setCustomSource('');
    if (onNotify) onNotify(`Added "${label}" (${activeTab}) to Lead Related Lists`, 'success');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Related List"
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[12px] text-[#5B6684]">
            Selected Lists Active: <b>{extraRelatedLists.length}</b>
          </span>
          <button type="button" className="btn-primary" onClick={onClose}>Done</button>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-4 min-h-[390px] text-[13px]">
        {/* Left Navigation Tabs */}
        <div className="w-full md:w-64 shrink-0 border-r border-[#E3E8F2] pr-3 space-y-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`w-full text-left px-3 py-2 rounded-md text-[12.5px] font-medium transition ${
                activeTab === t
                  ? 'bg-[#EAF2FF] text-[#2F55D4] font-semibold'
                  : 'text-[#4B5578] hover:bg-[#F8FAFC] hover:text-[#1F2A44]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Right Panel */}
        <div className="flex-1 min-w-0">
          {activeTab === 'Unselected Related Lists' ? (
            <div className="space-y-2.5">
              <div className="text-[13px] font-semibold text-[#1F2A44] mb-2">
                Select Related Modules to Display on Lead Details
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5 max-h-[330px] overflow-y-auto thin-scroll pr-1">
                {AVAILABLE_RELATED_LISTS.map((item) => {
                  const isSelected = extraRelatedLists.includes(item.name);
                  return (
                    <label
                      key={item.name}
                      className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition ${
                        isSelected ? 'border-[#2F55D4] bg-[#F5F8FF]' : 'border-[#E3E8F2] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleRelatedList(item.name)}
                        className="accent-[#2F55D4] mt-0.5 h-4 w-4"
                      />
                      <div>
                        <div className="font-semibold text-[#1F2A44] text-[13px]">{item.name}</div>
                        <div className="text-[11.5px] text-[#6B7696]">{item.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-2">
              <div>
                <h4 className="text-[14px] font-bold text-[#1F2A44]">{activeTab}</h4>
                <p className="text-[12px] text-[#6B7696] mt-0.5">
                  Configure and attach a {activeTab} block directly into the Lead Details related lists panel.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#F8FAFD] border border-[#E3E8F2] space-y-3">
                <label className="block text-[#4B5578] font-medium">
                  Related List Display Label *
                  <input
                    className="input mt-1"
                    placeholder={`e.g. ${activeTab} — Translation Cost Estimator`}
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                  />
                </label>
                <label className="block text-[#4B5578] font-medium">
                  {activeTab === 'Queries'
                    ? 'COQL / SOQL Query Expression'
                    : activeTab === 'Functions'
                    ? 'Deluge / Serverless Function Name'
                    : activeTab === 'Widgets'
                    ? 'Widget Bundle URL / Extension ID'
                    : 'Component / Lookup Configuration'}
                  <input
                    className="input mt-1 font-mono text-[12px]"
                    placeholder={
                      activeTab === 'Queries'
                        ? "SELECT Deal_Name, Amount, Stage FROM Deals WHERE City = '${Lead.City}'"
                        : activeTab === 'Functions'
                        ? 'fn_fetch_linguist_availability(lead.id)'
                        : 'https://widgets.zoho.in/hts/translator-match'
                    }
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCreateCustomRelated}
                  className="btn-primary"
                >
                  <Plus size={14} /> Add {activeTab} to Lead Details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/**
 * Section 9: Handler Modal for the 20 Lead Actions in More (•••)
 */
export function LeadMoreActionModal({
  actionKey,
  onClose,
  lead,
  leads = [],
  users = [],
  ownerName,
  updateRecord,
  createRecord,
  onAddCustomHeaderButton,
  businessCardFields = [],
  onUpdateBusinessCardFields,
  onNotify,
}) {
  const [shareUser, setShareUser] = useState(users[0]?.name || 'Priya Nair');
  const [sharePerm, setSharePerm] = useState('Read / Write');
  const [cliqChannel, setCliqChannel] = useState('#sales-chennai-leads');
  const [cliqMsg, setCliqMsg] = useState(`Please review high-priority lead: ${lead?.name} (${lead?.company}) — ${lead?.mobile}`);
  const [meetingTopic, setMeetingTopic] = useState(`Online Discovery Meeting with ${lead?.name}`);
  const [meetingTime, setMeetingTime] = useState(`${todayISO()} 04:00 PM`);
  const [selectedMacro, setSelectedMacro] = useState('Send Welcome Email + Mark Status Contacted + Create Followup Task');
  const [selectedCadence, setSelectedCadence] = useState('Enterprise Translation 5-Day Follow-up Cadence');
  const [customBtnLabel, setCustomBtnLabel] = useState('Check Translator Availability');
  const [customBtnUrl, setCustomBtnUrl] = useState('https://hts.internal/linguists');
  const [clientScriptCode, setClientScriptCode] = useState(
    `// Zoho CRM Client Script — OnPageLoad\nZDK.Page.getField('Lead_Status').setMandatory(true);\nif (ZDK.Page.getField('City').getValue() === 'Chennai') {\n  ZDK.Client.showMessage('Chennai Branch SLA: 2-hour response time');\n}`
  );
  const [localCardFields, setLocalCardFields] = useState(
    businessCardFields.length ? businessCardFields : ['Mobile', 'Lead Status', 'City', 'Lead Aging', 'Category']
  );

  if (!actionKey) return null;

  // Potential duplicates for "Find and Merge Duplicates"
  const potentialDuplicates = leads.filter(
    (l) =>
      l.id !== lead?.id &&
      (l.city === lead?.city ||
        l.company === lead?.company ||
        (l.mobile && l.mobile === lead?.mobile))
  ).slice(0, 4);

  const ALL_CARD_FIELD_OPTIONS = [
    'Mobile', 'Lead Status', 'City', 'Lead Aging', 'Category',
    'Lead Source', 'Lead Owner', 'Email', 'Company', 'Product Name', 'Source Lang', 'Target Lang',
  ];

  const handleConfirmAction = () => {
    if (actionKey === 'share') {
      updateRecord('leads', lead.id, { sharedWith: shareUser, sharePermission: sharePerm });
      if (onNotify) onNotify(`Shared lead "${lead.name}" with ${shareUser} (${sharePerm})`, 'success');
    } else if (actionKey === 'share_cliq') {
      if (onNotify) onNotify(`Posted lead card to Zoho Cliq channel ${cliqChannel}`, 'success');
    } else if (actionKey === 'merge_duplicates') {
      if (onNotify) onNotify(`Verified & merged duplicate lead fields into "${lead.name}"`, 'success');
    } else if (actionKey === 'mail_merge') {
      const content = `HONEY TRANSLATION SERVICES — PROPOSAL\n\nDate: ${todayISO()}\nPrepared For: ${lead.name} (${lead.company})\nCity: ${lead.city}\nService Category: ${lead.category}\nMobile: ${lead.mobile}\n\nAuthorized By: ${ownerName}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MailMerge_${(lead.name || 'Lead').replace(/\s+/g, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      if (onNotify) onNotify('Generated and downloaded Mail Merge document', 'success');
    } else if (actionKey === 'meet_now' || actionKey === 'schedule_meeting') {
      const newAct = {
        id: `act-${Date.now()}`,
        type: 'Meeting',
        desc: `${meetingTopic} (${actionKey === 'meet_now' ? 'Instant Zoho Meeting Started' : `Scheduled for ${meetingTime}`})`,
        by: ownerName,
        date: meetingTime,
        status: actionKey === 'meet_now' ? 'Completed' : 'Open',
      };
      updateRecord('leads', lead.id, {
        activities: [...(lead.activities || []), newAct],
      });
      if (onNotify) onNotify(`${actionKey === 'meet_now' ? 'Launched instant Zoho Meeting' : 'Scheduled Online Meeting'} for ${lead.name}`, 'success');
    } else if (actionKey === 'run_macro') {
      const newAct = {
        id: `act-${Date.now()}`,
        type: 'Macro Executed',
        desc: `Ran Macro: "${selectedMacro}"`,
        by: ownerName,
        date: todayISO(),
        status: 'Completed',
      };
      updateRecord('leads', lead.id, {
        status: 'Contacted',
        activities: [...(lead.activities || []), newAct],
      });
      if (onNotify) onNotify(`Macro executed: "${selectedMacro}"`, 'success');
    } else if (actionKey === 'customize_business_card') {
      if (onUpdateBusinessCardFields) onUpdateBusinessCardFields(localCardFields);
      if (onNotify) onNotify('Updated Lead Business Card fields', 'success');
    } else if (actionKey === 'enroll_cadence') {
      updateRecord('leads', lead.id, { cadence: selectedCadence });
      if (onNotify) onNotify(`Enrolled "${lead.name}" in "${selectedCadence}"`, 'success');
    } else if (actionKey === 'create_button') {
      if (onAddCustomHeaderButton && customBtnLabel.trim()) {
        onAddCustomHeaderButton({ label: customBtnLabel.trim(), url: customBtnUrl.trim() });
      }
      if (onNotify) onNotify(`Created custom button "${customBtnLabel}"`, 'success');
    } else if (actionKey === 'manage_client_script') {
      if (onNotify) onNotify('Saved and activated Client Script for Leads Detail Page', 'success');
    } else {
      if (onNotify) onNotify('Action completed successfully', 'success');
    }
    onClose();
  };

  const TITLES = {
    share: `Share Record — ${lead?.name}`,
    share_cliq: 'Share Lead via Zoho Cliq',
    print_preview: `Print Preview — ${lead?.name}`,
    merge_duplicates: `Find and Merge Duplicates — ${lead?.name}`,
    mail_merge: 'Zoho Writer Mail Merge',
    meet_now: 'Start Instant Zoho Meeting (Meet Now!)',
    schedule_meeting: 'Schedule Online Meeting',
    run_macro: 'Run Macro on Lead',
    customize_business_card: 'Customize Business Card Fields',
    organize_lead_details: 'Organize Lead Details Sections',
    review_history: `Review History & Audit Trail — ${lead?.name}`,
    enroll_cadence: 'Enroll Lead to Cadence',
    add_kiosk: 'Kiosk Studio — Guided Sales Process',
    create_button: 'Create Custom Action Button',
    manage_client_script: 'Manage Client Script (ZDK)',
    view_followers: `Followers of ${lead?.name}`,
  };

  return (
    <Modal
      open={!!actionKey}
      onClose={onClose}
      title={TITLES[actionKey] || 'Lead Action'}
      size="md"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
          {actionKey === 'print_preview' ? (
            <button type="button" className="btn-primary" onClick={() => { window.print(); onClose(); }}>
              <Printer size={14} /> Print Record
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={handleConfirmAction}>
              Confirm & Apply
            </button>
          )}
        </>
      }
    >
      <div className="space-y-3 text-[13px]">
        {actionKey === 'share' && (
          <>
            <label className="block text-[#4B5578] font-medium">
              Select User or Role to Share With
              <select className="input mt-1" value={shareUser} onChange={(e) => setShareUser(e.target.value)}>
                {users.map((u) => <option key={u.id} value={u.name}>{u.name} ({u.role || 'Sales'})</option>)}
              </select>
            </label>
            <label className="block text-[#4B5578] font-medium">
              Access Permission Level
              <select className="input mt-1" value={sharePerm} onChange={(e) => setSharePerm(e.target.value)}>
                <option>Read Only</option>
                <option>Read / Write</option>
                <option>Full Access (Read / Write / Share)</option>
              </select>
            </label>
          </>
        )}

        {actionKey === 'share_cliq' && (
          <>
            <label className="block text-[#4B5578] font-medium">
              Zoho Cliq Channel / Direct User
              <select className="input mt-1" value={cliqChannel} onChange={(e) => setCliqChannel(e.target.value)}>
                <option>#sales-chennai-leads</option>
                <option>#enterprise-translations</option>
                <option>#ceo-approvals</option>
                <option>@Karthik S</option>
                <option>@Gautam S.</option>
              </select>
            </label>
            <label className="block text-[#4B5578] font-medium">
              Message Note
              <textarea className="input mt-1 !h-20 py-2" value={cliqMsg} onChange={(e) => setCliqMsg(e.target.value)} />
            </label>
          </>
        )}

        {actionKey === 'print_preview' && (
          <div className="p-4 rounded border border-[#CBD5E1] bg-[#F8FAFC] space-y-2 text-[12.5px]">
            <div className="text-[15px] font-bold text-[#1F2A44] border-b border-[#CBD5E1] pb-2">
              {lead?.name} — {lead?.company} ({lead?.leadNo || lead?.id})
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><b>Mobile:</b> {lead?.mobile || lead?.phone}</div>
              <div><b>Email:</b> {lead?.email || '—'}</div>
              <div><b>Lead Status:</b> {lead?.status}</div>
              <div><b>Lead Source:</b> {lead?.source || lead?.leadSource}</div>
              <div><b>Category:</b> {lead?.category}</div>
              <div><b>City:</b> {lead?.city}</div>
              <div><b>Lead Owner:</b> {ownerName}</div>
              <div><b>Created Time:</b> {lead?.createdTime || lead?.createdOn}</div>
            </div>
            <div className="pt-2 border-t border-[#E3E8F2]">
              <b>Remarks:</b> {lead?.remarks || '—'}
            </div>
          </div>
        )}

        {actionKey === 'merge_duplicates' && (
          <div className="space-y-2.5">
            <div className="text-[#4B5578]">
              Scanning CRM database for records matching mobile, email, company, or city of <b>{lead?.name}</b>:
            </div>
            {potentialDuplicates.length === 0 ? (
              <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                No exact duplicate records found.
              </div>
            ) : (
              potentialDuplicates.map((d) => (
                <label key={d.id} className="flex items-center justify-between p-2.5 rounded border border-[#E3E8F2] bg-[#F8FAFC]">
                  <div>
                    <div className="font-semibold text-[#1F2A44]">{d.name} ({d.company})</div>
                    <div className="text-[11.5px] text-[#6B7696]">{d.mobile} • {d.city} • {d.status}</div>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-[#2F55D4] h-4 w-4" />
                </label>
              ))
            )}
          </div>
        )}

        {actionKey === 'mail_merge' && (
          <div className="space-y-2.5">
            <div className="text-[#4B5578]">
              Select a Zoho Writer Mail Merge template to populate with <b>{lead?.name}</b>'s fields and download:
            </div>
            <select className="input">
              <option>Official Translation & Localization Quotation Template</option>
              <option>Mutual Non-Disclosure Agreement (NDA)</option>
              <option>MEA Apostille Authorization Letter</option>
            </select>
          </div>
        )}

        {(actionKey === 'meet_now' || actionKey === 'schedule_meeting') && (
          <div className="space-y-3">
            <label className="block text-[#4B5578] font-medium">
              Meeting Topic
              <input className="input mt-1" value={meetingTopic} onChange={(e) => setMeetingTopic(e.target.value)} />
            </label>
            <label className="block text-[#4B5578] font-medium">
              Date & Time
              <input className="input mt-1" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
            </label>
            <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-[12px] text-[#2F55D4]">
              Participant Invite will be sent to: <b>{lead?.email || lead?.mobile}</b>
            </div>
          </div>
        )}

        {actionKey === 'run_macro' && (
          <label className="block text-[#4B5578] font-medium">
            Select Automated Macro to Execute
            <select className="input mt-1" value={selectedMacro} onChange={(e) => setSelectedMacro(e.target.value)}>
              <option>Send Welcome Email + Mark Status Contacted + Create Followup Task</option>
              <option>Assign to Chennai Branch + Tag as followup</option>
              <option>Escalate to CEO Approval + Notify Lead Manager 1</option>
            </select>
          </label>
        )}

        {actionKey === 'customize_business_card' && (
          <div className="space-y-2">
            <div className="text-[#4B5578] mb-1">Select up to 6 key fields to display in the top Lead Business Card summary:</div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_CARD_FIELD_OPTIONS.map((f) => {
                const checked = localCardFields.includes(f);
                return (
                  <label key={f} className="flex items-center gap-2 p-2 rounded border border-[#E3E8F2] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setLocalCardFields((prev) =>
                          prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
                        )
                      }
                      className="accent-[#2F55D4]"
                    />
                    <span>{f}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {actionKey === 'organize_lead_details' && (
          <div className="space-y-2">
            <div className="text-[#4B5578]">Active Lead Detail Sections (Drag / Toggle visibility):</div>
            {['Lead Information', 'Address Information', 'Description Information', 'Visit Summary', 'Open Activities', 'Closed Activities', 'Emails', 'Attachments', 'Zoho Survey', 'ZohoSign Documents', 'Messages'].map((sec) => (
              <label key={sec} className="flex items-center justify-between px-3 py-1.5 rounded border border-[#E3E8F2] bg-[#F8FAFC]">
                <span className="font-medium text-[#1F2A44]">{sec}</span>
                <input type="checkbox" defaultChecked className="accent-[#2F55D4]" />
              </label>
            ))}
          </div>
        )}

        {actionKey === 'review_history' && (
          <div className="space-y-2 max-h-60 overflow-y-auto thin-scroll">
            <div className="p-2.5 rounded border border-[#E3E8F2] bg-[#F8FAFC]">
              <div className="font-semibold text-[#1F2A44]">Record Created & Assigned</div>
              <div className="text-[11.5px] text-[#6B7696]">By {ownerName} • {lead?.createdTime || lead?.createdOn}</div>
            </div>
            {(lead?.activities || []).map((a, i) => (
              <div key={i} className="p-2.5 rounded border border-[#E3E8F2] bg-white">
                <div className="font-semibold text-[#1F2A44]">{a.type}: {a.desc}</div>
                <div className="text-[11.5px] text-[#6B7696]">By {a.by} • {a.date}</div>
              </div>
            ))}
          </div>
        )}

        {actionKey === 'enroll_cadence' && (
          <label className="block text-[#4B5578] font-medium">
            Select Automated Sales Cadence
            <select className="input mt-1" value={selectedCadence} onChange={(e) => setSelectedCadence(e.target.value)}>
              <option>Enterprise Translation 5-Day Follow-up Cadence</option>
              <option>Justdial & Indiamart Instant Speed-to-Lead Cadence</option>
              <option>Apostille & Embassy Attestation Nurture Cadence</option>
              <option>Dormant Lead Re-engagement Cadence</option>
            </select>
          </label>
        )}

        {actionKey === 'add_kiosk' && (
          <div className="p-3.5 rounded-lg bg-[#F8FAFD] border border-[#D5DBE8] space-y-2">
            <div className="font-semibold text-[#1F2A44]">Kiosk Studio — Guided Qualification Flow</div>
            <p className="text-[12px] text-[#5B6684]">
              Step 1: Verify Source & Target Language Pair ({lead?.sourceLang || 'English'} → {lead?.targetLang || 'German'})<br />
              Step 2: Collect Document Page / Word Count<br />
              Step 3: Send Instant Quotation & Convert to Deal
            </p>
          </div>
        )}

        {actionKey === 'create_button' && (
          <div className="space-y-3">
            <label className="block text-[#4B5578] font-medium">
              Custom Button Label
              <input className="input mt-1" value={customBtnLabel} onChange={(e) => setCustomBtnLabel(e.target.value)} />
            </label>
            <label className="block text-[#4B5578] font-medium">
              Action / Webhook URL
              <input className="input mt-1" value={customBtnUrl} onChange={(e) => setCustomBtnUrl(e.target.value)} />
            </label>
          </div>
        )}

        {actionKey === 'manage_client_script' && (
          <div className="space-y-2">
            <div className="text-[12px] text-[#5B6684]">Client Script (JavaScript / ZDK) for Lead Details Page:</div>
            <textarea
              rows={6}
              value={clientScriptCode}
              onChange={(e) => setClientScriptCode(e.target.value)}
              className="w-full p-2.5 rounded border border-[#CBD5E1] bg-[#0F172A] text-emerald-300 font-mono text-[12px]"
            />
          </div>
        )}

        {actionKey === 'view_followers' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded border border-[#E3E8F2] bg-[#F8FAFC]">
              <span className="font-semibold text-[#1F2A44]">{ownerName} (Lead Owner)</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Following</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded border border-[#E3E8F2] bg-white">
              <span className="font-semibold text-[#1F2A44]">Gautam S. (Lead Manager 1)</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Following</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

