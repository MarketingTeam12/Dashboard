import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, MoreHorizontal, ChevronLeft, ChevronRight, Check, X, Info, UserCheck } from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import { LEAD_TAGS } from '../../data/seedData';
import { fmtDate, fmtINR, STAGES } from '../../utils/calculations';
import { APPROVAL_STORAGE_KEY } from './dealApprovalUtils';

function StageChevron({ stage, current, passed, onClick }) {
  const isCurrent = stage === current;
  const isPassed = passed;
  
  let bg = '#F3F4F6'; // default
  let text = '#4B5563';
  if (isCurrent) {
    bg = '#FDE68A'; // yellow-200
    text = '#92400E';
  } else if (isPassed) {
    bg = '#E5E7EB'; // darker gray for passed
    text = '#1F2937';
  }

  return (
    <button type="button" onClick={onClick} className="relative flex-1 flex items-center justify-center h-8 text-[12px] font-medium min-w-max px-4 group transition-colors"
      style={{ backgroundColor: bg, color: text }}>
      <span className="relative z-10">{stage}</span>
      <div className="absolute right-[-10px] top-0 bottom-0 w-[20px] overflow-hidden z-20 pointer-events-none">
         <div className="h-full w-full origin-left bg-inherit transform scale-[0.707] rotate-45 translate-x-[-50%] border-r border-t border-white" />
      </div>
    </button>
  );
}

export default function DealDetail({ id, onClose }) {
  const navigate = useNavigate();
  const { deals, oldDeals = [], users = [], contacts = [], calls = [], accountName, contactName, userName, updateRecord, notify } = useCRM();
  const [activeId, setActiveId] = useState(id);
  const [tab, setTab] = useState('Overview');
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [delegateUser, setDelegateUser] = useState('Sibi Chakaravarthi');
  const [tagMenuOpen, setTagMenuOpen] = useState(false);

  const currentDealId = activeId || id;
  const dealIndex = deals.findIndex((d) => d.id === currentDealId);
  const deal = deals[dealIndex] || oldDeals.find((d) => d.id === currentDealId);

  if (!deal) return null;

  const prevDeal = dealIndex > 0 ? deals[dealIndex - 1] : null;
  const nextDeal = dealIndex >= 0 && dealIndex < deals.length - 1 ? deals[dealIndex + 1] : null;

  const defaultStatuses = ['Pending', 'Approved', 'Pending', 'Approved', 'Pending', 'Rejected', 'Approved'];
  const defaultDiscounts = ['15%', '10%', '20%', '12%', '18%', '15%', '10%'];
  const approvalStatus =
    deal.approvalStatus ||
    (dealIndex >= 0 && dealIndex < 7 ? defaultStatuses[dealIndex] : Number(deal.amount) >= 500000 ? 'Pending' : 'Approved');
  const approvalDiscount =
    deal.approvalDiscount || (dealIndex >= 0 && dealIndex < 7 ? defaultDiscounts[dealIndex] : '10%');
  const approverName = deal.approverName || 'Arun Kumar';

  const currentIndex = STAGES.indexOf(deal.stage);

  const handleApprovalAction = (newStatus, nextApprover) => {
    const timestamp = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const appKey = dealIndex >= 0 && dealIndex < 7 ? `app-${dealIndex + 1}` : `app-deal-${deal.id}`;
    try {
      const saved = JSON.parse(localStorage.getItem(APPROVAL_STORAGE_KEY) || '{}');
      saved[appKey] = {
        ...(saved[appKey] || {}),
        ...(newStatus ? { status: newStatus, decidedOn: timestamp } : {}),
        ...(nextApprover ? { approver: nextApprover } : {}),
      };
      localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // ignore
    }

    updateRecord('deals', deal.id, {
      ...(newStatus ? { approvalStatus: newStatus, approvalDecidedOn: timestamp } : {}),
      ...(nextApprover ? { approverName: nextApprover } : {}),
      approvalDiscount,
    });

    if (nextApprover) {
      notify?.(`Approval for "${deal.name}" delegated to ${nextApprover}`, 'info');
      setDelegateOpen(false);
    } else {
      notify?.(`Deal "${deal.name}" approval status updated to ${newStatus}`, newStatus === 'Approved' ? 'success' : 'info');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F7FA] -mx-3 sm:-mx-[18px] -mt-2.5 -mb-6">
      {/* Top Header */}
      <div className="bg-white px-4 py-3 border-b border-line flex items-center justify-between shadow-sm z-10 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 hover:bg-page rounded-full text-ink-600 transition-colors" title="Back">
            <ArrowLeft size={18} />
          </button>
          <div className="h-9 w-9 rounded flex items-center justify-center text-[15px] font-bold bg-[#E5E7EB] text-ink-600">
            {deal.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 relative">
            <h1 className="text-[17px] font-semibold text-ink leading-tight flex items-center gap-2">
              {deal.name} - {fmtINR(deal.amount)}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {deal.tag && (
                <span className="inline-flex items-center gap-1 h-[20px] px-2 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-[11.5px] font-medium">
                  {deal.tag}
                </span>
              )}
              <button
                type="button"
                onClick={() => setTagMenuOpen((o) => !o)}
                className="flex items-center gap-1 text-[12.5px] text-ink-500 cursor-pointer hover:text-primary"
              >
                <Tag size={12} /> {deal.tag ? 'Change Tag' : 'Add Tags'}
              </button>
            </div>
            {tagMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-[220px] max-h-[260px] overflow-y-auto bg-white border border-[#D8E0ED] rounded-md shadow-xl z-50 py-1">
                {deal.tag && (
                  <button
                    type="button"
                    onClick={() => {
                      updateRecord('deals', deal.id, { tag: '', tags: [] });
                      setTagMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[12.5px] text-rose-600 hover:bg-rose-50 border-b border-[#EEF2F8]"
                  >
                    Clear Tag
                  </button>
                )}
                {LEAD_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      updateRecord('deals', deal.id, { tag: t, tags: [t] });
                      setTagMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[12.5px] flex items-center justify-between hover:bg-[#F3F6FB] ${
                      deal.tag === t ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold' : 'text-[#1E293B]'
                    }`}
                  >
                    <span>{t}</span>
                    {deal.tag === t && <Check size={13} className="text-[#2563EB]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleApprovalAction('Approved')}
            className="h-8 px-3 rounded text-[12px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition inline-flex items-center gap-1"
          >
            <Check size={14} /> Approve
          </button>
          <button
            type="button"
            onClick={() => setDelegateOpen((o) => !o)}
            className="h-8 px-3 rounded text-[12px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-200 hover:bg-blue-100 transition inline-flex items-center gap-1"
          >
            <UserCheck size={14} /> Delegate
          </button>
          <button
            type="button"
            onClick={() => handleApprovalAction('Rejected')}
            className="h-8 px-3 rounded text-[12px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition inline-flex items-center gap-1"
          >
            <X size={14} /> Reject
          </button>
          <button className="btn-primary px-4">Send Email</button>
          <button className="btn-secondary">Edit</button>
          <button className="btn-secondary">WhatsApp Chat</button>
          <button className="btn-secondary px-2"><MoreHorizontal size={16} /></button>
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              disabled={!prevDeal}
              onClick={() => prevDeal && setActiveId(prevDeal.id)}
              className="btn-secondary px-2 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={!nextDeal}
              onClick={() => nextDeal && setActiveId(nextDeal.id)}
              className="btn-secondary px-2 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Delegate Inline Bar */}
      {delegateOpen && (
        <div className="bg-blue-50/90 border-b border-blue-200 px-4 py-2 flex items-center justify-between gap-3 text-[12.5px]">
          <div className="flex items-center gap-2 text-[#1E3A8A] font-medium">
            <UserCheck size={15} />
            <span>Delegate approval for <strong>{deal.name}</strong> (Current Approver: {approverName}) to:</span>
            <select
              value={delegateUser}
              onChange={(e) => setDelegateUser(e.target.value)}
              className="h-7 px-2 bg-white border border-blue-300 rounded text-[12px] text-ink"
            >
              {['Sibi Chakaravarthi', ...users.map((u) => u.name)].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleApprovalAction(null, delegateUser)}
              className="px-3 py-1 rounded bg-[#2563EB] text-white text-[12px] font-semibold hover:bg-blue-700"
            >
              Confirm Delegate
            </button>
            <button
              type="button"
              onClick={() => setDelegateOpen(false)}
              className="px-2.5 py-1 rounded text-ink-600 hover:bg-blue-100 text-[12px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sub Header */}
      <div className="bg-[#F5F7FA] px-4 py-2 flex items-center justify-between border-b border-line">
        <div className="flex items-center gap-6 text-[13px] font-medium">
          <button
            type="button"
            onClick={() => setTab('Overview')}
            className={tab === 'Overview' ? 'text-primary border-b-2 border-primary pb-1 font-semibold' : 'text-ink-500 hover:text-ink pb-1'}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setTab('Timeline')}
            className={tab === 'Timeline' ? 'text-primary border-b-2 border-primary pb-1 font-semibold' : 'text-ink-500 hover:text-ink pb-1'}
          >
            Timeline
          </button>
        </div>
        <div className="text-[11px] text-ink-500 flex items-center gap-1">
          <ClockIcon /> Last Update : 0 day(s) ago
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[210px] bg-white border-r border-line flex flex-col overflow-y-auto thin-scroll shrink-0 pb-4">
          <div className="pt-4">
            <div className="px-5 mb-2 text-[14px] font-bold text-ink tracking-tight">Related List</div>
            <ul className="text-[13.5px] text-ink-700">
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer" onClick={() => { setTab('Overview'); setTimeout(() => document.getElementById('section-notes')?.scrollIntoView({ behavior: 'smooth' }), 20); }}>Notes</li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer flex items-center gap-2" onClick={() => { setTab('Overview'); setTimeout(() => document.getElementById('section-contact-roles')?.scrollIntoView({ behavior: 'smooth' }), 20); }}>Contact Roles <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-[1px] text-[11px] font-semibold leading-none">1</span></li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer" onClick={() => { setTab('Overview'); setTimeout(() => document.getElementById('section-attachments')?.scrollIntoView({ behavior: 'smooth' }), 20); }}>Attachments</li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer" onClick={() => { setTab('Overview'); setTimeout(() => document.getElementById('section-emails')?.scrollIntoView({ behavior: 'smooth' }), 20); }}>Emails</li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer flex items-center gap-2" onClick={() => { setTab('Overview'); setTimeout(() => document.getElementById('section-stage-history')?.scrollIntoView({ behavior: 'smooth' }), 20); }}>Stage History <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-[1px] text-[11px] font-semibold leading-none">1</span></li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer" onClick={() => { setTab('Overview'); setTimeout(() => document.getElementById('section-zoho-projects')?.scrollIntoView({ behavior: 'smooth' }), 20); }}>Zoho Projects</li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer" onClick={() => { setTab('Overview'); setTimeout(() => document.getElementById('section-open-activities')?.scrollIntoView({ behavior: 'smooth' }), 20); }}>Open Activities</li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer flex items-center gap-2" onClick={() => { setTab('Overview'); setTimeout(() => document.getElementById('section-closed-activities')?.scrollIntoView({ behavior: 'smooth' }), 20); }}>Closed Activities <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-[1px] text-[11px] font-semibold leading-none">1</span></li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer" onClick={() => { setTab('Overview'); setTimeout(() => document.getElementById('section-zoho-finance')?.scrollIntoView({ behavior: 'smooth' }), 20); }}>Zoho Finance</li>
              <li className="px-5 py-2 text-primary hover:underline cursor-pointer">Add Related List</li>
            </ul>
          </div>
          
          <div className="pt-5">
            <div className="px-5 mb-2 text-[13.5px] font-bold text-ink uppercase tracking-tight">SALES SUMMARY</div>
            <div className="px-5 space-y-4 text-[13.5px] text-ink-700 leading-snug">
              <div>Lead Conversion Time: 7 day(s)</div>
              <div>Sales Cycle Duration: 10 day(s)</div>
              <div>Overall Sales Duration: 17 day(s)</div>
            </div>
          </div>

          <div className="pt-6">
            <div className="px-5 mb-2 text-[14px] font-bold text-ink tracking-tight">Links</div>
            <div className="px-5">
              <span className="text-primary hover:underline cursor-pointer text-[13.5px]">Add Link</span>
            </div>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="flex-1 overflow-y-auto thin-scroll p-4 bg-white">
          {tab === 'Timeline' ? (
            <div className="bg-white border border-line rounded-lg p-5">
              <h3 className="text-[15px] font-bold text-ink mb-4">Deal Activity & Approval Timeline</h3>
              <ol className="relative border-l-2 border-line ml-3 space-y-4">
                <li className="pl-5 relative">
                  <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary ring-2 ring-white" />
                  <div className="text-[13px] font-semibold text-ink">
                    Approval Status: <span className="text-primary">{approvalStatus}</span> ({approvalDiscount} discount)
                  </div>
                  <div className="text-[12px] text-ink-500 mt-0.5">
                    Approver: {approverName} • {deal.approvalDecidedOn || fmtDate(deal.createdOn)}
                  </div>
                </li>
                <li className="pl-5 relative">
                  <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  <div className="text-[13px] font-semibold text-ink">
                    Deal Stage moved to <span className="text-emerald-700">{deal.stage}</span> ({deal.probability}% probability)
                  </div>
                  <div className="text-[12px] text-ink-500 mt-0.5">
                    Updated by {userName(deal.ownerId)} • Closing Date: {fmtDate(deal.closingDate)}
                  </div>
                </li>
                <li className="pl-5 relative">
                  <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-slate-400 ring-2 ring-white" />
                  <div className="text-[13px] font-semibold text-ink">
                    Deal "{deal.name}" created ({fmtINR(deal.amount)})
                  </div>
                  <div className="text-[12px] text-ink-500 mt-0.5">
                    Source: {deal.source || 'Website'} • Owner: {userName(deal.ownerId)} • {fmtDate(deal.createdOn)}
                  </div>
                </li>
              </ol>
            </div>
          ) : (
          <div className="space-y-0">
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
               <button className="h-8 w-10 bg-[#D1FAE5] text-[#047857] flex items-center justify-center rounded border border-[#10B981] hover:bg-[#A7F3D0] transition-colors" title="Closed Won" onClick={() => updateRecord('deals', deal.id, { stage: 'Closed Won' })}>
                 <Check size={16} />
               </button>
               <button className="h-8 w-10 bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center rounded border border-[#EF4444] hover:bg-[#FECACA] transition-colors" title="Closed Lost" onClick={() => updateRecord('deals', deal.id, { stage: 'Closed Lost' })}>
                 <X size={16} />
               </button>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white border border-line rounded-lg p-5 mb-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Deal Approval Status</span>
                   <div className="flex items-center gap-2 flex-wrap">
                     <span
                       className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11.5px] font-bold border ${
                         approvalStatus === 'Approved'
                           ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                           : approvalStatus === 'Rejected'
                           ? 'bg-rose-50 text-rose-700 border-rose-200'
                           : 'bg-amber-50 text-amber-700 border-amber-200'
                       }`}
                     >
                       {approvalStatus}
                     </span>
                     <span className="text-[11.5px] text-ink-500">
                       ({approvalDiscount} Discount • Approver: {approverName})
                     </span>
                   </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Account Name</span>
                   <span className="text-ink font-semibold">{deal.accountId ? accountName(deal.accountId) : 'Enterprise Account'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Deal Owner</span>
                   <span className="text-ink font-medium">{userName(deal.ownerId)}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Expected Revenue</span>
                   <span className="text-emerald-700 font-bold">
                     {fmtINR(deal.expectedRevenue || Math.round(Number(deal.amount || 0) * 0.9))}
                   </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Lead Source</span>
                   <div>
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-medium bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
                       {deal.source || 'Database call'}
                     </span>
                   </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Closing Date</span>
                   <span className="text-ink font-medium">{deal.closingDate || '2026-10-30'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right flex items-center justify-end gap-1">Categories <Info size={12} className="text-ink-400" /></span>
                   <div>
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-medium bg-[#F3F4F6] text-ink border border-[#D1D5DB]">
                       {deal.department || 'DTP Services'}
                     </span>
                   </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Deal ID</span>
                   <span className="text-ink font-mono text-[12px]">{deal.id}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Submission Status</span>
                   <div>
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-medium bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
                       {approvalStatus === 'Approved' ? 'Verified & Approved' : 'Pending Info'}
                     </span>
                   </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Territory</span>
                   <span className="text-ink font-medium">{deal.city || 'Chennai'}</span>
                </div>
             </div>
          </div>

          {/* Bottom Cards */}
          <div className="grid grid-cols-2 gap-4">
             {/* Best time to */}
             <div className="bg-white border border-line rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-bold text-ink">Best time to</h3>
                  <button className="text-[12.5px] text-primary hover:underline">Today</button>
                </div>
                <div className="space-y-4">
                   <div>
                      <div className="text-[13px] text-ink-600 mb-0.5">Call</div>
                      <div className="text-[13px] text-ink font-medium">No best time for the day</div>
                   </div>
                   <div>
                      <div className="text-[13px] text-ink-600 mb-0.5">Email</div>
                      <div className="text-[13px] text-ink font-medium">No best time for the day</div>
                   </div>
                </div>
             </div>

             {/* Zia Score */}
             <div className="bg-white border border-line rounded-lg p-4 flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[14px] font-bold text-ink">Zia Score</h3>
                  <div className="flex gap-1">
                    <button className="text-ink-400 hover:text-ink"><ChevronLeft size={16} /></button>
                    <button className="text-ink-400 hover:text-ink"><ChevronRight size={16} /></button>
                  </div>
                </div>
                <p className="text-[12.5px] text-ink-500 mb-4">Zia predicts that this Deal's health level is low</p>
                <div className="flex items-center gap-6 mt-2">
                   {/* Circular progress dummy */}
                   <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="25, 100" />
                      </svg>
                      <div className="absolute text-[13px] font-bold text-ink">25%</div>
                   </div>
                   <div>
                      <div className="text-[12px] text-ink-500 mb-0.5">Health score</div>
                      <div className="text-[14px] font-semibold text-ink">Need improvement</div>
                   </div>
                </div>
                <div className="absolute bottom-4 right-4">
                  <button className="text-[12px] text-primary hover:underline">View Scorecard</button>
                </div>
             </div>
          </div>

          {/* Related List Sections */}
          <div className="mt-8 space-y-6 pb-20">
             <div id="section-notes" className="bg-white border border-line rounded-lg p-5">
               <h3 className="text-[16px] font-bold text-ink mb-2">Notes</h3>
               <p className="text-[13px] text-ink-500">{deal.description || 'No notes found.'}</p>
             </div>
             <div id="section-contact-roles" className="bg-white border border-line rounded-lg p-5">
               <h3 className="text-[16px] font-bold text-ink mb-2">Contact Roles</h3>
               {deal.contactId ? (
                 <div className="flex items-center justify-between text-[13px] py-1">
                   <button
                     type="button"
                     onClick={() => navigate(`/contacts/${deal.contactId}`, { state: { from: `/deals/${deal.id}` } })}
                     className="text-primary hover:underline font-semibold"
                   >
                     {contactName(deal.contactId)}
                   </button>
                   <span className="text-ink-500">Decision Maker • {accountName(deal.accountId)}</span>
                 </div>
               ) : (
                 <p className="text-[13px] text-ink-500">1 Contact Role</p>
               )}
             </div>
             <div id="section-attachments" className="bg-white border border-line rounded-lg p-5">
               <h3 className="text-[16px] font-bold text-ink mb-2">Attachments</h3>
               <p className="text-[13px] text-ink-500">No attachments found.</p>
             </div>
             <div id="section-emails" className="bg-white border border-line rounded-lg p-5">
               <h3 className="text-[16px] font-bold text-ink mb-2">Emails</h3>
               <p className="text-[13px] text-ink-500">No emails found.</p>
             </div>
             <div id="section-stage-history" className="bg-white border border-line rounded-lg p-5">
               <h3 className="text-[16px] font-bold text-ink mb-2">Stage History</h3>
               <p className="text-[13px] text-ink-500">Current Stage: {deal.stage} ({deal.probability}% probability) — Updated on {fmtDate(deal.createdOn)}</p>
             </div>
             <div id="section-zoho-projects" className="bg-white border border-line rounded-lg p-5">
               <h3 className="text-[16px] font-bold text-ink mb-2">Zoho Projects</h3>
               <p className="text-[13px] text-ink-500">No projects found.</p>
             </div>
             <div id="section-open-activities" className="bg-white border border-line rounded-lg p-5">
               <h3 className="text-[16px] font-bold text-ink mb-2">Open Activities</h3>
               <p className="text-[13px] text-ink-500">No open activities found.</p>
             </div>
             <div id="section-closed-activities" className="bg-white border border-line rounded-lg p-5">
               <h3 className="text-[16px] font-bold text-ink mb-2">Closed Activities</h3>
               {calls.filter((c) => c.contactId === deal.contactId || c.accountId === deal.accountId).length > 0 ? (
                 <div className="space-y-1.5">
                   {calls
                     .filter((c) => c.contactId === deal.contactId || c.accountId === deal.accountId)
                     .slice(0, 3)
                     .map((c) => (
                       <div key={c.id} className="flex items-center justify-between text-[13px] py-1 border-b border-line-soft last:border-0">
                         <button
                           type="button"
                           onClick={() => navigate(`/calls/${c.id}`, { state: { from: `/deals/${deal.id}` } })}
                           className="text-primary hover:underline font-medium"
                         >
                           {c.subject}
                         </button>
                         <span className="text-ink-500">{c.type} • {c.status} • {fmtDate(c.dateTime)}</span>
                       </div>
                     ))}
                 </div>
               ) : (
                 <p className="text-[13px] text-ink-500">1 Closed Activity</p>
               )}
             </div>
             <div id="section-zoho-finance" className="bg-white border border-line rounded-lg p-5">
               <h3 className="text-[16px] font-bold text-ink mb-2">Zoho Finance</h3>
               <p className="text-[13px] text-ink-500">No finance records found.</p>
             </div>
          </div>
          </div>
          )}
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

