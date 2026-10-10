import { useRef } from 'react';
import {
  ArrowLeft, Tag, MoreHorizontal, ChevronLeft, ChevronRight,
  Check, X, Info, Paperclip, Upload, FileText, Download, Trash2
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import { fmtINR, STAGES } from '../../utils/calculations';

const formatBytes = (bytes) => {
  if (!bytes || isNaN(bytes)) return '24 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

function StageChevron({ stage, current, passed, onClick }) {
  const isCurrent = stage === current;
  const isPassed = passed;

  let bg = '#F3F4F6';
  let text = '#4B5563';
  if (isCurrent) {
    bg = '#FDE68A';
    text = '#92400E';
  } else if (isPassed) {
    bg = '#E5E7EB';
    text = '#1F2937';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex-1 flex items-center justify-center h-8 text-[12.5px] font-semibold min-w-max px-4 group transition-colors"
      style={{ backgroundColor: bg, color: text }}
    >
      <span className="relative z-10">{stage}</span>
      <div className="absolute right-[-10px] top-0 bottom-0 w-[20px] overflow-hidden z-20 pointer-events-none">
        <div className="h-full w-full origin-left bg-inherit transform scale-[0.707] rotate-45 translate-x-[-50%] border-r border-t border-white" />
      </div>
    </button>
  );
}

export default function DealDetail({ id, onClose }) {
  const { deals, userName, currentUser, updateRecord } = useCRM();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const deal = deals.find((d) => d.id === id);

  if (!deal) return null;

  const currentIndex = STAGES.indexOf(deal.stage);
  const attachments = Array.isArray(deal.attachments) ? deal.attachments : [];

  const handleAttachFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newAtts = files.map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: formatBytes(file.size),
      type: file.type || 'application/octet-stream',
      uploadedBy: currentUser?.name || userName(deal.ownerId),
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      url: URL.createObjectURL(file),
    }));
    updateRecord('deals', deal.id, { attachments: [...attachments, ...newAtts] });
    toast.success(`${newAtts.length} attachment(s) added to ${deal.name}`);
    e.target.value = '';
  };

  const handleRemoveAttachment = (attId) => {
    updateRecord('deals', deal.id, { attachments: attachments.filter((a) => a.id !== attId) });
    toast.info('Attachment removed');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F7FA] -mx-3 sm:-mx-[18px] -mt-2.5 -mb-6">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAttachFiles} />

      {/* Top Header */}
      <div className="bg-white px-4 py-3 border-b border-line flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 hover:bg-page rounded-full text-ink-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="h-9 w-9 rounded flex items-center justify-center text-[15px] font-bold bg-[#E5E7EB] text-ink-600">
            {deal.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-ink leading-tight flex items-center gap-2">
              {deal.name} - {fmtINR(deal.amount)}
            </h1>
            <div className="flex items-center gap-1 text-[12.5px] text-ink-500 mt-0.5 cursor-pointer hover:text-primary">
              <Tag size={12} /> Add Tags
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
          >
            <Paperclip size={14} /> Attach File
          </button>
          <button className="btn-primary px-4">Send Email</button>
          <button className="btn-secondary">Edit</button>
          <button className="btn-secondary">WhatsApp Chat</button>
          <button className="btn-secondary px-2">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Sub Header */}
      <div className="bg-[#F5F7FA] px-4 py-2 flex items-center justify-between border-b border-line">
        <div className="flex items-center gap-6 text-[13.5px] font-semibold">
          <button className="text-primary border-b-2 border-primary pb-1">Overview</button>
          <button className="text-ink-500 hover:text-ink pb-1">Timeline</button>
        </div>
        <div className="text-[12px] text-ink-500 flex items-center gap-1">
          <ClockIcon /> Last Update : Just now
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[215px] bg-white border-r border-line flex flex-col overflow-y-auto thin-scroll shrink-0 pb-4">
          <div className="pt-4">
            <div className="px-5 mb-2 text-[14px] font-bold text-ink tracking-tight">Related List</div>
            <ul className="text-[13.5px] text-ink-700">
              <li
                className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer"
                onClick={() => document.getElementById('section-notes')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Notes
              </li>
              <li
                className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer flex items-center justify-between"
                onClick={() => document.getElementById('section-attachments')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span>Attachments</span>
                {attachments.length > 0 && (
                  <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-2 py-0.5 text-[11.5px] font-semibold">
                    {attachments.length}
                  </span>
                )}
              </li>
              <li
                className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer flex items-center justify-between"
                onClick={() => document.getElementById('section-contact-roles')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span>Contact Roles</span>
                <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-2 py-0.5 text-[11.5px] font-semibold">
                  1
                </span>
              </li>
              <li
                className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer"
                onClick={() => document.getElementById('section-emails')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Emails
              </li>
              <li
                className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer flex items-center justify-between"
                onClick={() => document.getElementById('section-stage-history')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span>Stage History</span>
                <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-2 py-0.5 text-[11.5px] font-semibold">
                  1
                </span>
              </li>
              <li
                className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer"
                onClick={() => document.getElementById('section-open-activities')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Open Activities
              </li>
              <li
                className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer flex items-center justify-between"
                onClick={() => document.getElementById('section-closed-activities')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span>Closed Activities</span>
                <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-2 py-0.5 text-[11.5px] font-semibold">
                  1
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-5">
            <div className="px-5 mb-2 text-[13.5px] font-bold text-ink uppercase tracking-tight">SALES SUMMARY</div>
            <div className="px-5 space-y-3 text-[13.5px] text-ink-700 leading-snug">
              <div>Lead Conversion Time: 7 day(s)</div>
              <div>Sales Cycle Duration: 10 day(s)</div>
              <div>Overall Sales Duration: 17 day(s)</div>
            </div>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="flex-1 overflow-y-auto thin-scroll p-4 bg-white">
          {/* Stage Progress Bar */}
          <div className="bg-white border border-line rounded-lg mb-4 flex items-center justify-between p-2">
            <div className="flex items-center w-full gap-1 overflow-x-auto thin-scroll py-2 px-1">
              {STAGES.map((s, i) => (
                <StageChevron
                  key={s}
                  stage={s}
                  current={deal.stage}
                  passed={i < currentIndex}
                  onClick={() => updateRecord('deals', deal.id, { stage: s })}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 ml-4 shrink-0 pr-2">
              <button
                className="h-8 w-10 bg-[#D1FAE5] text-[#047857] flex items-center justify-center rounded border border-[#10B981] hover:bg-[#A7F3D0] transition-colors"
                title="Closed Won"
                onClick={() => updateRecord('deals', deal.id, { stage: 'Closed Won' })}
              >
                <Check size={16} />
              </button>
              <button
                className="h-8 w-10 bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center rounded border border-[#EF4444] hover:bg-[#FECACA] transition-colors"
                title="Closed Lost"
                onClick={() => updateRecord('deals', deal.id, { stage: 'Closed Lost' })}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white border border-line rounded-lg p-5 mb-4">
            <div className="grid grid-cols-2 gap-y-4 gap-x-10 text-[13.5px]">
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <span className="text-ink-500 text-right">Deal Owner</span>
                <span className="text-ink font-semibold">{userName(deal.ownerId)}</span>
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <span className="text-ink-500 text-right">Deal Stage</span>
                <span className="text-ink font-semibold">{deal.stage}</span>
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <span className="text-ink-500 text-right">Lead Source</span>
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-semibold bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
                    {deal.source || 'Database call'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <span className="text-ink-500 text-right">Closing Date</span>
                <span className="text-ink font-semibold">{deal.closeDate || '—'}</span>
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <span className="text-ink-500 text-right flex items-center justify-end gap-1">
                  Categories <Info size={12} className="text-ink-400" />
                </span>
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-semibold bg-[#F3F4F6] text-ink border border-[#D1D5DB]">
                    {deal.department || 'DTP Services'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <span className="text-ink-500 text-right">Probability</span>
                <span className="text-ink font-semibold">{deal.probability ?? 50}%</span>
              </div>
            </div>
          </div>

          {/* Related List Sections */}
          <div className="mt-6 space-y-5 pb-20">
            {/* Real Attachments Section */}
            <div id="section-attachments" className="bg-white border border-line rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
                <h3 className="text-[15.5px] font-bold text-ink">Attachments ({attachments.length})</h3>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-blue-50 text-[13px] font-semibold transition"
                >
                  <Paperclip size={14} /> Attach File
                </button>
              </div>
              {attachments.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="m-4 border-2 border-dashed border-line hover:border-primary rounded-xl p-5 text-center cursor-pointer bg-page/40 hover:bg-blue-50/30 transition"
                >
                  <Upload size={20} className="mx-auto text-primary mb-1" />
                  <div className="text-[13.5px] font-semibold text-ink">
                    Click to attach files to this Deal
                  </div>
                  <div className="text-[12px] text-ink-400">
                    Attach proposals, purchase orders, invoices, or contracts
                  </div>
                </div>
              ) : (
                <table className="w-full text-[13.5px]">
                  <thead>
                    <tr className="text-left text-ink-500 border-b border-line bg-page/60">
                      <th className="px-5 py-2.5 font-semibold">File Name</th>
                      <th className="px-5 py-2.5 font-semibold">Attached By</th>
                      <th className="px-5 py-2.5 font-semibold">Date Added</th>
                      <th className="px-5 py-2.5 font-semibold">Size</th>
                      <th className="px-5 py-2.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {attachments.map((att) => (
                      <tr key={att.id} className="hover:bg-page/40">
                        <td className="px-5 py-2.5 font-semibold text-primary">
                          <a
                            href={att.url || '#'}
                            download={att.name}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 hover:underline"
                          >
                            <FileText size={15} />
                            <span>{att.name}</span>
                          </a>
                        </td>
                        <td className="px-5 py-2.5 text-ink">{att.uploadedBy}</td>
                        <td className="px-5 py-2.5 text-ink-500">{att.uploadedAt}</td>
                        <td className="px-5 py-2.5 text-ink-500">{att.size}</td>
                        <td className="px-5 py-2.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {att.url && (
                              <a
                                href={att.url}
                                download={att.name}
                                className="p-1 text-ink-500 hover:text-primary"
                                title="Download"
                              >
                                <Download size={15} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(att.id)}
                              className="p-1 text-ink-400 hover:text-rose-600"
                              title="Remove"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div id="section-notes" className="bg-white border border-line rounded-lg p-5">
              <h3 className="text-[15.5px] font-bold text-ink mb-2">Notes</h3>
              <p className="text-[13.5px] text-ink-500">No notes found.</p>
            </div>
            <div id="section-contact-roles" className="bg-white border border-line rounded-lg p-5">
              <h3 className="text-[15.5px] font-bold text-ink mb-2">Contact Roles</h3>
              <p className="text-[13.5px] text-ink-500">1 Contact Role associated with this deal.</p>
            </div>
            <div id="section-emails" className="bg-white border border-line rounded-lg p-5">
              <h3 className="text-[15.5px] font-bold text-ink mb-2">Emails</h3>
              <p className="text-[13.5px] text-ink-500">No emails found.</p>
            </div>
            <div id="section-stage-history" className="bg-white border border-line rounded-lg p-5">
              <h3 className="text-[15.5px] font-bold text-ink mb-2">Stage History</h3>
              <p className="text-[13.5px] text-ink-500">Current Stage: {deal.stage}</p>
            </div>
            <div id="section-open-activities" className="bg-white border border-line rounded-lg p-5">
              <h3 className="text-[15.5px] font-bold text-ink mb-2">Open Activities</h3>
              <p className="text-[13.5px] text-ink-500">No open activities found.</p>
            </div>
            <div id="section-closed-activities" className="bg-white border border-line rounded-lg p-5">
              <h3 className="text-[15.5px] font-bold text-ink mb-2">Closed Activities</h3>
              <p className="text-[13.5px] text-ink-500">1 Closed Activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
