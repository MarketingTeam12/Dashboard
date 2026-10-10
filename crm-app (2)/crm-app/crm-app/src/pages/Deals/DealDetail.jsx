import { useMemo } from 'react';
import { ArrowLeft, Tag, MoreHorizontal, ChevronLeft, ChevronRight, Check, X, Info } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { fmtINR, STAGES } from '../../utils/calculations';

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
  const { deals, accountName, userName, updateRecord } = useCRM();
  const deal = deals.find(d => d.id === id);

  if (!deal) return null;

  const currentIndex = STAGES.indexOf(deal.stage);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F7FA] -mx-3 sm:-mx-[18px] -mt-2.5 -mb-6">
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
          <button className="btn-primary px-4">Send Email</button>
          <button className="btn-secondary">Edit</button>
          <button className="btn-secondary">WhatsApp Chat</button>
          <button className="btn-secondary px-2"><MoreHorizontal size={16} /></button>
          <div className="flex items-center gap-1 ml-1">
            <button className="btn-secondary px-2"><ChevronLeft size={16} /></button>
            <button className="btn-secondary px-2"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Sub Header */}
      <div className="bg-[#F5F7FA] px-4 py-2 flex items-center justify-between border-b border-line">
        <div className="flex items-center gap-6 text-[13px] font-medium">
          <button className="text-primary border-b-2 border-primary pb-1">Overview</button>
          <button className="text-ink-500 hover:text-ink pb-1">Timeline</button>
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
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer" onClick={() => { document.getElementById('section-notes')?.scrollIntoView({ behavior: 'smooth' }); }}>Notes</li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer flex items-center gap-2" onClick={() => { document.getElementById('section-contact-roles')?.scrollIntoView({ behavior: 'smooth' }); }}>Contact Roles <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-[1px] text-[11px] font-semibold leading-none">1</span></li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer" onClick={() => { document.getElementById('section-attachments')?.scrollIntoView({ behavior: 'smooth' }); }}>Attachments</li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer" onClick={() => { document.getElementById('section-emails')?.scrollIntoView({ behavior: 'smooth' }); }}>Emails</li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer flex items-center gap-2" onClick={() => { document.getElementById('section-stage-history')?.scrollIntoView({ behavior: 'smooth' }); }}>Stage History <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-[1px] text-[11px] font-semibold leading-none">1</span></li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer" onClick={() => { document.getElementById('section-zoho-projects')?.scrollIntoView({ behavior: 'smooth' }); }}>Zoho Projects</li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer" onClick={() => { document.getElementById('section-open-activities')?.scrollIntoView({ behavior: 'smooth' }); }}>Open Activities</li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer flex items-center gap-2" onClick={() => { document.getElementById('section-closed-activities')?.scrollIntoView({ behavior: 'smooth' }); }}>Closed Activities <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-[1px] text-[11px] font-semibold leading-none">1</span></li>
              <li className="px-5 py-2 hover:bg-[#F3F4F6] cursor-pointer" onClick={() => { document.getElementById('section-zoho-finance')?.scrollIntoView({ behavior: 'smooth' }); }}>Zoho Finance</li>
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
             <div className="grid grid-cols-2 gap-y-5 gap-x-10">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Deal Approval Status</span>
                   <span className="text-ink font-medium">—</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   {/* Empty for spacing like in image */}
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Deal Owner</span>
                   <span className="text-ink font-medium">{userName(deal.ownerId)}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   {/* Empty */}
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
                   {/* Empty */}
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
                   {/* Empty */}
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Submission Status</span>
                   <div>
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-medium bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
                       Pending Info
                     </span>
                   </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   {/* Empty */}
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-[13px]">
                   <span className="text-ink-500 text-right">Territory</span>
                   <span className="text-ink font-medium">—</span>
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
               <p className="text-[13px] text-ink-500">No notes found.</p>
             </div>
             <div id="section-contact-roles" className="bg-white border border-line rounded-lg p-5">
               <h3 className="text-[16px] font-bold text-ink mb-2">Contact Roles</h3>
               <p className="text-[13px] text-ink-500">1 Contact Role</p>
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
               <p className="text-[13px] text-ink-500">1 Stage History record</p>
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
               <p className="text-[13px] text-ink-500">1 Closed Activity</p>
             </div>
             <div id="section-zoho-finance" className="bg-white border border-line rounded-lg p-5">
               <h3 className="text-[16px] font-bold text-ink mb-2">Zoho Finance</h3>
               <p className="text-[13px] text-ink-500">No finance records found.</p>
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

