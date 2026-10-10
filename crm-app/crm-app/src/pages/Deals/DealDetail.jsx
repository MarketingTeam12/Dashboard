import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ArrowLeft, Tag, MoreHorizontal, ChevronLeft, ChevronRight, Check, X, Info, Edit2, Check as CheckIcon, X as XIcon } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { useCRM } from '../../context/CRMContext';
import { fmtINR, STAGES } from '../../utils/calculations';

function EditableField({ label, value, type = 'text', options = [], onSave, badgeClass, readOnly }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value || '');

  useEffect(() => {
    setVal(value || '');
  }, [value]);

  const handleSave = () => {
    if (val !== (value || '')) {
      onSave(val);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setVal(value || '');
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[13px] group">
      <span className="text-ink-500 text-right mt-[2px]">{label}</span>
      <div className="min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            {type === 'select' ? (
              <select className="input-field py-1 px-2 text-[13px] w-full max-w-[200px]" value={val} onChange={e => setVal(e.target.value)}>
                <option value="">-None-</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : type === 'textarea' ? (
              <textarea className="input-field py-1 px-2 text-[13px] w-full" rows={3} value={val} onChange={e => setVal(e.target.value)} />
            ) : type === 'number' ? (
              <input type="number" className="input-field py-1 px-2 text-[13px] w-full max-w-[200px]" value={val} onChange={e => setVal(e.target.value)} />
            ) : type === 'date' ? (
              <input type="date" className="input-field py-1 px-2 text-[13px] w-full max-w-[200px]" value={val} onChange={e => setVal(e.target.value)} />
            ) : (
              <input type="text" className="input-field py-1 px-2 text-[13px] w-full max-w-[200px]" value={val} onChange={e => setVal(e.target.value)} />
            )}
            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckIcon size={14} /></button>
            <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded"><XIcon size={14} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-ink ${!value ? 'text-ink-300' : 'font-medium'} ${badgeClass && value ? badgeClass : ''}`}>
              {value || '—'}
            </span>
            {!readOnly && (
              <button onClick={() => setIsEditing(true)} className="text-ink-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StageChevron({ stage, current, passed, onClick }) {
  const isCurrent = stage === current;
  
  let bg = '#F3F4F6';
  let text = '#4B5563';
  if (isCurrent) {
    bg = '#FDE68A';
    text = '#92400E';
  } else if (passed) {
    bg = '#E5E7EB';
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

function StageTransitionModal({ open, targetStage, deal, onClose, onSave }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && deal) {
      setFormData({
        salesNo: deal.salesNo || '',
        amount: deal.amount || '',
        closingDate: deal.closingDate || '',
        reasonForLost: deal.reasonForLost || ''
      });
      setError('');
    }
  }, [open, deal]);

  const handleSave = () => {
    if (targetStage === 'Deal Closed (Won)' || targetStage === 'Deal Job Seeking & Agency') {
      if (!formData.salesNo) {
        setError('Sales_No is required');
        return;
      }
      onSave({ salesNo: formData.salesNo });
    } else if (targetStage === 'Pre-Deal Lost') {
      if (!formData.amount || !formData.closingDate) {
        setError('Amount and Closing Date are required');
        return;
      }
      onSave({ amount: formData.amount, closingDate: formData.closingDate });
    } else if (targetStage === 'Deal Closed (Lost)') {
      if (!formData.reasonForLost) {
        setError('Reason for Closed lost is required');
        return;
      }
      onSave({ reasonForLost: formData.reasonForLost });
    }
  };

  if (!open) return null;

  const isReview = targetStage !== 'Pre-Deal Lost';
  const title = isReview ? 'Review Details' : 'Verify Details';

  return (
    <Modal open={open} onClose={onClose} title={title} size="md" footer={
      <>
        <button onClick={onClose} className="btn-secondary px-4">Cancel</button>
        <button onClick={handleSave} className="btn-primary px-4 bg-[#1E40AF] hover:bg-[#1e3a8a] text-white">Save</button>
      </>
    }>
      <div className="py-2">
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        
        {targetStage === 'Pre-Deal Lost' && (
          <p className="text-sm text-ink-600 mb-4 font-medium">Since Stage IS Closed Lost (Record Category), verify the following details</p>
        )}

        <div className="space-y-4">
          {(targetStage === 'Deal Closed (Won)' || targetStage === 'Deal Job Seeking & Agency') && (
            <div>
              <label className="block text-sm text-ink-600 mb-1">Sales_No <span className="text-red-500">*</span></label>
              <input type="text" className="input-field w-full" value={formData.salesNo} onChange={e => setFormData({ ...formData, salesNo: e.target.value })} />
            </div>
          )}

          {targetStage === 'Pre-Deal Lost' && (
             <>
               <div>
                 <label className="block text-sm text-ink-600 mb-1">Amount <span className="text-red-500">*</span></label>
                 <input type="number" className="input-field w-full" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
               </div>
               <div>
                 <label className="block text-sm text-ink-600 mb-1">Closing Date <span className="text-red-500">*</span></label>
                 <input type="date" className="input-field w-full" value={formData.closingDate} onChange={e => setFormData({ ...formData, closingDate: e.target.value })} />
               </div>
             </>
          )}

          {targetStage === 'Deal Closed (Lost)' && (
             <div>
               <label className="block text-sm text-ink-600 mb-1">Reason for Closed lost <span className="text-red-500">*</span></label>
               <textarea className="input-field w-full" rows="3" value={formData.reasonForLost} onChange={e => setFormData({ ...formData, reasonForLost: e.target.value })}></textarea>
             </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function DealDetail({ id, onClose }) {
  const { deals, userName, updateRecord } = useCRM();
  const deal = deals.find(d => d.id === id);
  const scrollRef = useRef(null);

  const [activeTab, setActiveTab] = useState('Overview');
  const [activeSection, setActiveSection] = useState('section-deal-info');
  const [transitionTarget, setTransitionTarget] = useState(null);

  useEffect(() => {
    if (activeTab !== 'Overview') return;
    const observer = new IntersectionObserver((entries) => {
      const intersecting = entries.filter(e => e.isIntersecting);
      if (intersecting.length > 0) {
        intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setActiveSection(intersecting[0].target.id);
      }
    }, {
      root: scrollRef.current,
      rootMargin: '-20px 0px -80% 0px',
      threshold: 0
    });

    const sections = [
      'section-deal-info', 'section-notes', 'section-contact-roles', 'section-attachments',
      'section-emails', 'section-stage-history', 'section-zoho-projects',
      'section-open-activities', 'section-closed-activities', 'section-zoho-finance'
    ];

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [id, activeTab]);

  if (!deal) return null;

  const scrollToSection = (sectionId) => {
    if (!scrollRef.current) return;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  const handleUpdate = (field, value) => {
    updateRecord('deals', deal.id, { [field]: value });
  };

  const initiateStageTransition = (targetStage) => {
    const specialStages = ['Deal Closed (Won)', 'Deal Job Seeking & Agency', 'Pre-Deal Lost', 'Deal Closed (Lost)'];
    if (specialStages.includes(targetStage)) {
      setTransitionTarget(targetStage);
    } else {
      handleUpdate('stage', targetStage);
    }
  };

  const confirmStageTransition = (updates) => {
    updateRecord('deals', deal.id, { ...updates, stage: transitionTarget });
    setTransitionTarget(null);
  };

  const currentIndex = STAGES.indexOf(deal.stage);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F7FA] -mx-3 sm:-mx-[18px] -mt-2.5 -mb-6">
      {/* Top Header */}
      <div className="bg-white px-4 py-3 border-b border-line flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 hover:bg-page rounded-full text-ink-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="h-9 w-9 rounded flex items-center justify-center text-[15px] font-bold bg-[#E5E7EB] text-ink-600">
            {deal.name?.charAt(0).toUpperCase()}
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
      <div className="bg-[#F5F7FA] px-4 py-2 flex items-center justify-between border-b border-line shrink-0">
        <div className="flex items-center gap-6 text-[13px] font-medium">
          <button onClick={() => setActiveTab('Overview')} className={`pb-1 ${activeTab === 'Overview' ? 'text-primary border-b-2 border-primary' : 'text-ink-500 hover:text-ink'}`}>Overview</button>
          <button onClick={() => setActiveTab('Timeline')} className={`pb-1 ${activeTab === 'Timeline' ? 'text-primary border-b-2 border-primary' : 'text-ink-500 hover:text-ink'}`}>Timeline</button>
        </div>
        <div className="text-[11px] text-ink-500 flex items-center gap-1">
          Last Update : 0 day(s) ago
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'Overview' && (
          <div className="w-[210px] bg-white border-r border-line flex flex-col overflow-y-auto thin-scroll shrink-0 pb-4">
            <div className="pt-4">
              <div className="px-5 mb-2 text-[14px] font-bold text-ink tracking-tight">Related List</div>
              <ul className="text-[13.5px] text-ink-700">
                {[
                  { id: 'section-deal-info', label: 'Deal Information' },
                  { id: 'section-notes', label: 'Notes' },
                  { id: 'section-contact-roles', label: 'Contact Roles', count: 1 },
                  { id: 'section-attachments', label: 'Attachments' },
                  { id: 'section-emails', label: 'Emails' },
                  { id: 'section-stage-history', label: 'Stage History', count: 1 },
                  { id: 'section-zoho-projects', label: 'Zoho Projects' },
                  { id: 'section-open-activities', label: 'Open Activities' },
                  { id: 'section-closed-activities', label: 'Closed Activities', count: 1 },
                  { id: 'section-zoho-finance', label: 'Zoho Finance' }
                ].map(item => (
                  <li 
                    key={item.id}
                    className={`px-5 py-2 cursor-pointer flex items-center gap-2 border-l-2 ${activeSection === item.id ? 'bg-[#EEF2F8] border-primary text-ink font-medium' : 'border-transparent hover:bg-[#F3F4F6]'}`}
                    onClick={() => scrollToSection(item.id)}
                  >
                    {item.label}
                    {item.count && <span className={`rounded-full px-1.5 py-[1px] text-[11px] font-semibold leading-none ${activeSection === item.id ? 'bg-white text-primary' : 'bg-[#EEF2F8] text-[#374151]'}`}>{item.count}</span>}
                  </li>
                ))}
                <li className="px-5 py-2 text-primary hover:underline cursor-pointer border-l-2 border-transparent">Add Related List</li>
              </ul>
            </div>
            
            <div className="pt-5">
              <div className="px-5 mb-2 text-[13.5px] font-bold text-ink uppercase tracking-tight">SALES SUMMARY</div>
              <div className="px-5 space-y-4 text-[13.5px] text-ink-700 leading-snug">
                <div>Lead Conversion Time: {deal.leadConversionTime || '7 day(s)'}</div>
                <div>Sales Cycle Duration: {deal.salesCycleDuration || '10 day(s)'}</div>
                <div>Overall Sales Duration: {deal.overallSalesDuration || '17 day(s)'}</div>
              </div>
            </div>

            <div className="pt-6">
              <div className="px-5 mb-2 text-[14px] font-bold text-ink tracking-tight">Links</div>
              <div className="px-5">
                <span className="text-primary hover:underline cursor-pointer text-[13.5px]">Add Link</span>
              </div>
            </div>
          </div>
        )}

        {/* Right Details Panel */}
        {activeTab === 'Overview' && (
          <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll p-4 bg-[#F5F7FA] relative">
            {/* Stage Progress Bar */}
            <div className="bg-white border border-line rounded-lg mb-4 p-2 flex flex-col items-stretch">
              <div className="flex items-center w-full gap-1 overflow-x-auto thin-scroll py-2 px-1">
                 {STAGES.map((s, i) => (
                   <StageChevron 
                      key={s} 
                      stage={s} 
                      current={deal.stage} 
                      passed={i < currentIndex}
                      onClick={() => { if (s !== deal.stage) initiateStageTransition(s); }} 
                   />
                 ))}
                 <div className="flex items-center gap-1.5 ml-4 shrink-0 pr-2">
                    <button className="h-8 w-10 bg-[#D1FAE5] text-[#047857] flex items-center justify-center rounded border border-[#10B981] hover:bg-[#A7F3D0] transition-colors" title="Deal Closed (Won)" onClick={() => initiateStageTransition('Deal Closed (Won)')}>
                      <Check size={16} />
                    </button>
                    <button className="h-8 w-10 bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center rounded border border-[#EF4444] hover:bg-[#FECACA] transition-colors" title="Deal Closed (Lost)" onClick={() => initiateStageTransition('Deal Closed (Lost)')}>
                      <X size={16} />
                    </button>
                 </div>
              </div>
              <div className="flex items-center justify-between mt-2 px-2 text-[12px] text-ink-500">
                <div>Created: {deal.createdTime || '—'}</div>
                <div>Closing: {deal.closingDate || '—'}</div>
              </div>
            </div>

            {/* Deal Info Section */}
            <div id="section-deal-info" className="bg-white border border-line rounded-lg mb-4">
               <div className="p-4 border-b border-line bg-[#FAFAFA] rounded-t-lg">
                 <h3 className="text-[15px] font-semibold text-ink">Deal Information</h3>
               </div>
               <div className="p-5 grid grid-cols-2 gap-y-5 gap-x-10">
                  <EditableField label="Deal Owner" value={userName(deal.ownerId)} readOnly />
                  <EditableField label="Lead Source" value={deal.source || 'Database call'} options={['Database call', 'Advertisement', 'Cold Call', 'Employee Referral', 'External Referral', 'Partner', 'Public Relations', 'Trade Show', 'Web Download', 'Web Research', 'Chat']} type="select" onSave={v => handleUpdate('source', v)} />
                  <EditableField label="Deal Name" value={deal.name} onSave={v => handleUpdate('name', v)} />
                  <EditableField label="Categories" value={deal.department || 'DTP Services'} options={['DTP Services', 'Translation', 'Localization']} type="select" onSave={v => handleUpdate('department', v)} />
                  <EditableField label="Amount" value={deal.amount} type="number" onSave={v => handleUpdate('amount', v)} />
                  <EditableField label="City" value={deal.city} onSave={v => handleUpdate('city', v)} />
                  <EditableField label="Stage" value={deal.stage} readOnly />
                  <EditableField label="Contact Name" value={deal.contactName} onSave={v => handleUpdate('contactName', v)} />
                  <EditableField label="Closing Date" value={deal.closingDate} type="date" onSave={v => handleUpdate('closingDate', v)} />
                  <EditableField label="Lead Manager 1" value={deal.leadManager1} onSave={v => handleUpdate('leadManager1', v)} />
                  <EditableField label="Submission Status" value={deal.submissionStatus || 'Pending Info'} options={['Pending Info', 'Submitted', 'Approved', 'Rejected']} type="select" badgeClass="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-medium bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]" onSave={v => handleUpdate('submissionStatus', v)} />
                  <EditableField label="Deal Approval Status" value={deal.approvalStatus} onSave={v => handleUpdate('approvalStatus', v)} />
                  <EditableField label="Territory" value={deal.territory} onSave={v => handleUpdate('territory', v)} />
                  <EditableField label="Incentive Amount" value={deal.incentiveAmount} type="number" onSave={v => handleUpdate('incentiveAmount', v)} />
                  <EditableField label="Sales_No" value={deal.salesNo} onSave={v => handleUpdate('salesNo', v)} />
               </div>

               <div className="p-4 border-y border-line bg-[#FAFAFA]">
                 <h3 className="text-[15px] font-semibold text-ink">Deal Other Details</h3>
               </div>
               <div className="p-5 grid grid-cols-2 gap-y-5 gap-x-10">
                  <EditableField label="Job type" value={deal.jobType} onSave={v => handleUpdate('jobType', v)} />
                  <EditableField label="Purpose Of Translation" value={deal.purposeOfTranslation} onSave={v => handleUpdate('purposeOfTranslation', v)} />
                  <EditableField label="Client Budget" value={deal.clientBudget} type="number" onSave={v => handleUpdate('clientBudget', v)} />
                  <EditableField label="Delivery type" value={deal.deliveryType} onSave={v => handleUpdate('deliveryType', v)} />
                  <EditableField label="Account Name" value={deal.accountName} onSave={v => handleUpdate('accountName', v)} />
                  <EditableField label="Without GST" value={deal.withoutGst} type="number" onSave={v => handleUpdate('withoutGst', v)} />
                  <EditableField label="GST Amount" value={deal.gstAmount} type="number" onSave={v => handleUpdate('gstAmount', v)} />
                  <EditableField label="Probability (%)" value={deal.probability} type="number" onSave={v => handleUpdate('probability', v)} />
                  <EditableField label="Expected Revenue" value={deal.expectedRevenue} type="number" onSave={v => handleUpdate('expectedRevenue', v)} />
                  <EditableField label="Mobile" value={deal.mobile} onSave={v => handleUpdate('mobile', v)} />
                  <EditableField label="Mobile No" value={deal.mobileNo} onSave={v => handleUpdate('mobileNo', v)} />
               </div>

               <div className="p-4 border-y border-line bg-[#FAFAFA]">
                 <h3 className="text-[15px] font-semibold text-ink">Description Information</h3>
               </div>
               <div className="p-5">
                 <EditableField label="Description" value={deal.description} type="textarea" onSave={v => handleUpdate('description', v)} />
               </div>

               <div className="p-4 border-y border-line bg-[#FAFAFA]">
                 <h3 className="text-[15px] font-semibold text-ink">Approval Process</h3>
               </div>
               <div className="p-5 grid grid-cols-2 gap-y-5 gap-x-10">
                  <EditableField label="EST Ready" value={deal.estReady} onSave={v => handleUpdate('estReady', v)} />
                  <EditableField label="Closed Won Approval" value={deal.closedWonApproval} onSave={v => handleUpdate('closedWonApproval', v)} />
                  <EditableField label="Closed Lost Approval" value={deal.closedLostApproval} onSave={v => handleUpdate('closedLostApproval', v)} />
               </div>
            </div>

            {/* Bottom Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
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
            <div className="space-y-6 pb-20">
               <div id="section-notes" className="bg-white border border-line rounded-lg p-5">
                 <h3 className="text-[16px] font-bold text-ink mb-2">Notes</h3>
                 <textarea className="input-field w-full mb-2" rows="3" placeholder="Add a note..."></textarea>
                 <button className="btn-primary text-sm px-4">Save</button>
               </div>
               <div id="section-contact-roles" className="bg-white border border-line rounded-lg p-5">
                 <div className="flex justify-between mb-4">
                   <h3 className="text-[16px] font-bold text-ink">Contact Roles</h3>
                   <button className="btn-secondary text-sm">Add Contact Roles</button>
                 </div>
                 <p className="text-[13px] text-ink-500">1 Contact Role</p>
               </div>
               <div id="section-attachments" className="bg-white border border-line rounded-lg p-5">
                 <div className="flex justify-between mb-4">
                   <h3 className="text-[16px] font-bold text-ink">Attachments</h3>
                   <button className="btn-secondary text-sm">Upload</button>
                 </div>
                 <p className="text-[13px] text-ink-500">No attachments found.</p>
               </div>
               <div id="section-emails" className="bg-white border border-line rounded-lg p-5">
                 <h3 className="text-[16px] font-bold text-ink mb-2">Emails</h3>
                 <p className="text-[13px] text-ink-500">No emails found.</p>
               </div>
               <div id="section-stage-history" className="bg-white border border-line rounded-lg p-5">
                 <h3 className="text-[16px] font-bold text-ink mb-2">Stage History</h3>
                 <table className="w-full text-left text-[13px]">
                   <thead className="bg-[#F5F7FA]">
                     <tr>
                       <th className="p-2 font-medium border-b border-line">Stage</th>
                       <th className="p-2 font-medium border-b border-line">Amount</th>
                       <th className="p-2 font-medium border-b border-line">Modified Time</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr>
                       <td className="p-2 border-b border-line">{deal.stage}</td>
                       <td className="p-2 border-b border-line">{fmtINR(deal.amount)}</td>
                       <td className="p-2 border-b border-line">Just now</td>
                     </tr>
                   </tbody>
                 </table>
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
        )}

        {/* Timeline Tab Content */}
        {activeTab === 'Timeline' && (
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            <h2 className="text-[16px] font-bold mb-6">Timeline</h2>
            <div className="relative border-l border-line ml-4 space-y-6">
              <div className="relative pl-6">
                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white"></div>
                <div className="text-[13px]">
                  <span className="font-semibold">{userName(deal.ownerId)}</span> created the deal.
                </div>
                <div className="text-[12px] text-ink-500 mt-0.5">{deal.createdTime || 'Recently'}</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></div>
                <div className="text-[13px]">
                  Deal stage changed to <span className="font-semibold">{deal.stage}</span>
                </div>
                <div className="text-[12px] text-ink-500 mt-0.5">Recently</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <StageTransitionModal 
        open={!!transitionTarget} 
        targetStage={transitionTarget} 
        deal={deal} 
        onClose={() => setTransitionTarget(null)} 
        onSave={confirmStageTransition} 
      />
    </div>
  );
}
