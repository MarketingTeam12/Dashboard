import React, { useRef, useState, useEffect } from "react";
import { ArrowLeft, Tag, MoreHorizontal, ChevronLeft, ChevronRight, Phone, Trash2, Edit2, Share2, Printer, Check as CheckIcon, X as XIcon, Play, Pause, ChevronDown, ChevronUp, Link2, Plus, Settings } from "lucide-react";
import { useCRM } from "../../context/CRMContext";
import { fmtDate, fmtTime, fmtDuration, fmtINR } from "../../utils/calculations";
import { Link } from "react-router-dom";

function EditableField({ label, value, type = "text", options = [], onSave, badgeClass, readOnly, linkTo, hasIcon }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value || "");

  useEffect(() => {
    setVal(value || "");
  }, [value]);

  const handleSave = () => {
    if (val !== (value || "")) {
      onSave(val);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setVal(value || "");
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[13px] group">
      <span className="text-ink-500 text-right mt-[2px]">{label}</span>
      <div className="min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            {type === "select" ? (
              <select className="input-field py-1 px-2 text-[13px] w-full max-w-[200px]" value={val} onChange={e => setVal(e.target.value)}>
                <option value="">-None-</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : type === "textarea" ? (
              <textarea className="input-field py-1 px-2 text-[13px] w-full" rows={3} value={val} onChange={e => setVal(e.target.value)} />
            ) : (
              <input type={type} className="input-field py-1 px-2 text-[13px] w-full max-w-[200px]" value={val} onChange={e => setVal(e.target.value)} />
            )}
            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckIcon size={14} /></button>
            <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded"><XIcon size={14} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-ink ${!value ? "text-ink-300" : "font-medium"} ${badgeClass && value ? badgeClass : ""}`}>
              {linkTo && value ? (
                <Link to={linkTo} className="text-primary hover:underline">{value}</Link>
              ) : (
                value || "-"
              )}
            </span>
            {hasIcon && value && <Phone size={14} className="text-green-500" />}
            {!readOnly && onSave && (
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

function DropdownMenu({ open, items, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-line rounded-lg shadow-lg z-50 py-1">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose(); }}
            className={`w-full text-left px-4 py-2 text-[13px] hover:bg-page transition-colors ${item.danger ? "text-red-600" : "text-ink-700"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

function CollapsibleSection({ id, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className="mb-10">
      <div 
        className="flex items-center gap-2 cursor-pointer mb-4 pb-2 border-b border-line hover:text-primary transition-colors group"
        onClick={() => setOpen(!open)}
      >
        <span className="text-ink-400 group-hover:text-primary">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
        <h2 className="text-[16px] font-bold text-ink group-hover:text-primary transition-colors">{title}</h2>
      </div>
      {open && children}
    </div>
  );
}

export default function CallDetail({ id, onClose, onEdit, onDelete, onPrev, onNext, hasPrev, hasNext }) {
  const { calls, deals, contacts, accounts, userName, updateRecord } = useCRM();
  const call = calls.find(c => c.id === id);
  const scrollRef = useRef(null);

  const [activeTab, setActiveTab] = useState("Overview");
  const [activeSection, setActiveSection] = useState("section-call-summary");
  const [menuOpen, setMenuOpen] = useState(false);
  const [openActivitiesOpen, setOpenActivitiesOpen] = useState({ tasks: false, meetings: false, calls: false });

  useEffect(() => {
    if (activeTab !== "Overview") return;
    const observer = new IntersectionObserver((entries) => {
      const intersecting = entries.filter(e => e.isIntersecting);
      if (intersecting.length > 0) {
        intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setActiveSection(intersecting[0].target.id);
      }
    }, {
      root: scrollRef.current,
      rootMargin: "-20px 0px -80% 0px",
      threshold: 0
    });

    const sections = [
      "section-call-summary", "section-call-information", "section-purpose", "section-outcome", "section-notes", "section-links"
    ];

    sections.forEach(secId => {
      const el = document.getElementById(secId);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [id, activeTab]);

  if (!call) return null;

  const scrollToSection = (sectionId) => {
    if (!scrollRef.current) return;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  };

  const handleUpdate = (field, value) => {
    updateRecord("calls", call.id, { [field]: value });
  };

  const contact = contacts.find(c => c.id === call.contactId);
  const account = accounts.find(a => a.id === call.accountId);
  const relatedDeal = deals.find(d => d.contactId === call.contactId);

  const relatedName = contact?.name || account?.name || "-";
  const callTitle = call.subject || relatedName;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F7FA] -mx-3 sm:-mx-[18px] -mt-2.5 -mb-6">
      {/* Top Header */}
      <div className="bg-white px-4 py-3 border-b border-line flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 hover:bg-page rounded-full text-ink-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="h-9 w-9 rounded flex items-center justify-center text-white bg-teal-500">
            <Phone size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-ink leading-tight flex items-center gap-2">
              {callTitle}
            </h1>
            <div className="flex items-center gap-1 text-[12.5px] text-ink-500 mt-0.5 cursor-pointer hover:text-primary">
              <Tag size={12} /> Add Tags
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          <button className="btn-primary px-4 bg-blue-600 hover:bg-blue-700 text-white">Call</button>
          
          <button className="btn-secondary px-2" onClick={() => setMenuOpen(true)}>
            <MoreHorizontal size={16} />
          </button>
          <DropdownMenu 
            open={menuOpen} 
            onClose={() => setMenuOpen(false)}
            items={[
              { label: "Edit", onClick: () => onEdit?.(call) },
              { label: "Delete", onClick: () => onDelete?.(call.id), danger: true },
              { label: "Share via Cliq", onClick: () => alert("Share via Cliq clicked") },
              { label: "Print Preview", onClick: () => window.print() }
            ]}
          />
          
          <div className="flex items-center gap-1 ml-1">
            <button className="btn-secondary px-2" disabled={!hasPrev} onClick={onPrev}><ChevronLeft size={16} /></button>
            <button className="btn-secondary px-2" disabled={!hasNext} onClick={onNext}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Sub Header */}
      <div className="bg-[#F5F7FA] px-4 py-2 flex items-center justify-between border-b border-line shrink-0">
        <div className="flex items-center gap-6 text-[13px] font-medium">
          <button onClick={() => setActiveTab("Overview")} className={`pb-1 ${activeTab === "Overview" ? "text-primary border-b-2 border-primary" : "text-ink-500 hover:text-ink"}`}>Overview</button>
          <button onClick={() => setActiveTab("Timeline")} className={`pb-1 ${activeTab === "Timeline" ? "text-primary border-b-2 border-primary" : "text-ink-500 hover:text-ink"}`}>Timeline</button>
        </div>
        <div className="text-[11px] text-ink-500 flex items-center gap-1">
          Last Update : {fmtDate(call.dateTime)}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "Overview" && (
          <div className="w-[210px] bg-white border-r border-line flex flex-col overflow-y-auto thin-scroll shrink-0 pb-4">
            <div className="pt-4">
              <ul className="text-[13.5px] text-ink-700">
                {[
                  { id: "section-call-summary", label: "Call Summary" },
                  { id: "section-call-information", label: "Call Information" },
                  { id: "section-purpose", label: "Purpose of Outgoing Call" },
                  { id: "section-outcome", label: "Outcome of Outgoing Call" },
                  { id: "section-notes", label: "Notes" },
                  { id: "section-links", label: "Links" },
                ].map(sec => (
                  <li key={sec.id}>
                    <button
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left px-5 py-2 hover:bg-page transition-colors ${activeSection === sec.id ? "bg-primary-50 text-primary border-l-2 border-primary font-medium" : "border-l-2 border-transparent"}`}
                    >
                      {sec.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "Overview" && (
          <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll p-6 pb-[30vh]">
            
            <div id="section-call-summary" className="mb-10">
              <div className="bg-white rounded-lg p-5 border border-line shadow-sm mb-6 flex flex-wrap gap-y-6">
                 <div className="w-1/3 border-r border-line px-4 text-center">
                   <div className="text-[12px] text-ink-500 uppercase tracking-wide">Call For</div>
                   <div className="text-[15px] font-semibold text-ink mt-1">{contact?.name || account?.name || "-"}</div>
                 </div>
                 <div className="w-1/3 border-r border-line px-4 text-center">
                   <div className="text-[12px] text-ink-500 uppercase tracking-wide">Related To</div>
                   <div className="text-[15px] font-medium text-ink mt-1">{relatedDeal?.name || "-"}</div>
                 </div>
                 <div className="w-1/3 px-4 text-center">
                   <div className="text-[12px] text-ink-500 uppercase tracking-wide">Call Type</div>
                   <div className="text-[15px] font-medium text-ink mt-1">{call.type || "-"}</div>
                 </div>
                 
                 <div className="w-1/3 border-r border-line px-4 text-center">
                   <div className="text-[12px] text-ink-500 uppercase tracking-wide">Outgoing Call Status</div>
                   <div className="text-[15px] font-semibold text-ink mt-1">{call.status || "-"}</div>
                 </div>
                 <div className="w-1/3 border-r border-line px-4 text-center">
                   <div className="text-[12px] text-ink-500 uppercase tracking-wide">Call Start Time</div>
                   <div className="text-[15px] font-medium text-ink mt-1">{fmtDate(call.dateTime)} {fmtTime(call.dateTime)}</div>
                 </div>
                 <div className="w-1/3 px-4 text-center">
                   <div className="text-[12px] text-ink-500 uppercase tracking-wide">Call Duration</div>
                   <div className="text-[15px] font-medium text-ink mt-1">{fmtDuration(call.duration) || "-"}</div>
                 </div>
              </div>
            </div>

            <CollapsibleSection id="section-call-information" title="Call Information">
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-4xl">
                <EditableField label="Call For" value={contact?.name} linkTo={contact ? `/contacts?open=${contact.id}` : null} readOnly />
                <EditableField label="Related To" value={relatedDeal?.name} linkTo={relatedDeal ? `/deals?open=${relatedDeal.id}` : null} readOnly />
                <EditableField label="From Number" value={call.fromNumber || "-"} readOnly hasIcon={!!call.fromNumber} />
                <EditableField label="To Number" value={contact?.phone || account?.phone || "-"} readOnly hasIcon={!!(contact?.phone || account?.phone)} />
                <EditableField label="Call Type" value={call.type || "-"} readOnly />
                <EditableField label="Outgoing Call Status" value={call.status || "-"} readOnly />
                <EditableField label="Call Start Time" value={`${fmtDate(call.dateTime)} ${fmtTime(call.dateTime)}`} readOnly />
                <EditableField label="Call Duration" value={fmtDuration(call.duration) || "-"} readOnly />
                <EditableField label="Call Owner" value={userName(call.ownerId)} readOnly />
                <EditableField label="Subject" value={call.subject} readOnly />
                <EditableField label="Caller ID" value="-" readOnly />
                <EditableField label="Telephony External ID" value="-" readOnly />
                <EditableField label="Created By" value={userName(call.ownerId)} readOnly />
                <EditableField label="Modified By" value={userName(call.ownerId)} readOnly />
                
                {/* Voice Recording Player */}
                <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[13px] col-span-2">
                  <span className="text-ink-500 text-right mt-[2px]">Voice Recording</span>
                  <div className="min-w-0">
                    {call.recordingUrl ? (
                      <div className="flex items-center gap-3 bg-page p-2 rounded max-w-md border border-line">
                         <audio controls src={call.recordingUrl} className="w-full h-8" />
                         <button className="text-primary hover:bg-primary-50 p-1 rounded" title="Copy Link"><Link2 size={16} /></button>
                      </div>
                    ) : (
                      <div className="text-ink-400 italic">Recording unavailable</div>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="section-purpose" title="Purpose of Outgoing Call">
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-4xl">
                <EditableField label="Raw Transcriptions" value="-" readOnly />
                <EditableField label="AI Analysis" value="-" readOnly />
                <EditableField label="Call Connect Status" value="-" readOnly />
                <EditableField label="From No" value={call.fromNumber || "-"} readOnly hasIcon={!!call.fromNumber} />
                <EditableField label="Call Purpose" value="-" readOnly />
                <EditableField label="Call Agenda" value="-" readOnly />
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="section-outcome" title="Outcome of Outgoing Call">
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-4xl">
                <EditableField label="Call Result" value="-" readOnly />
                <EditableField label="Description" value={call.notes || "-"} readOnly />
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="section-notes" title="Notes">
               <div className="bg-white border border-line rounded-lg p-5 max-w-4xl">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[14px] font-bold text-ink">Notes</h3>
                   <div className="flex items-center gap-1 text-[12px] text-ink-500 cursor-pointer">
                     Recent Last <ChevronDown size={14} />
                   </div>
                 </div>
                 <textarea className="input-field w-full mb-2" rows="3" placeholder="Add a note..."></textarea>
                 <button className="btn-primary text-sm px-4 bg-blue-600 hover:bg-blue-700 text-white">Save</button>
                 
                 {call.notes && (
                   <div className="mt-6 pt-4 border-t border-line group relative">
                     <div className="flex items-center gap-2 mb-2">
                       <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{userName(call.ownerId).charAt(0)}</div>
                       <span className="font-semibold text-sm">{userName(call.ownerId)}</span>
                       <span className="text-xs text-ink-500">{fmtDate(call.dateTime)}</span>
                     </div>
                     <p className="text-sm text-ink-700 pl-8">{call.notes}</p>
                     
                     <div className="absolute right-0 top-4 opacity-0 group-hover:opacity-100 flex gap-2">
                       <button className="text-ink-400 hover:text-primary"><Edit2 size={14} /></button>
                       <button className="text-ink-400 hover:text-red-600"><Trash2 size={14} /></button>
                     </div>
                   </div>
                 )}
               </div>
            </CollapsibleSection>
            
            <CollapsibleSection id="section-links" title="Links">
               <div className="bg-white border border-line rounded-lg p-5 max-w-4xl">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[14px] font-bold text-ink">Links</h3>
                   <div className="flex items-center gap-2">
                     <button className="text-primary text-[13px] font-medium hover:underline flex items-center"><Plus size={14} className="mr-1"/> Add</button>
                     <button className="text-ink-500 text-[13px] font-medium hover:underline flex items-center"><Settings size={14} className="mr-1"/> Manage</button>
                   </div>
                 </div>
                 <p className="text-[13px] text-ink-500 text-center py-4">No links found.</p>
               </div>
            </CollapsibleSection>
          </div>
        )}

        {/* Right Info Panel (20%) */}
        {activeTab === "Overview" && (
          <div className="w-[280px] bg-[#F9FAFB] border-l border-line p-5 flex flex-col gap-6 overflow-y-auto thin-scroll shrink-0">
             {/* Info Widget */}
             <div className="bg-white border border-line rounded-lg p-4">
                <h3 className="text-[14px] font-bold text-ink mb-4">Info</h3>
                
                {relatedDeal ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Link to={`/deals?open=${relatedDeal.id}`} className="text-[14px] font-semibold text-primary hover:underline">{relatedDeal.name}</Link>
                      </div>
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-medium rounded">Deal</span>
                    </div>
                    <button className="w-full btn-secondary py-1 text-[13px]">Send Email</button>
                    <div className="pt-2 border-t border-line space-y-3">
                      <div>
                        <div className="text-[12px] text-ink-500">Amount</div>
                        <div className="text-[13px] font-medium">{fmtINR(relatedDeal.amount || 0)}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-ink-500">Deal Approval Status</div>
                        <div className="text-[13px] font-medium">-</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-ink-500">Deal Owner</div>
                        <div className="text-[13px] font-medium">{userName(relatedDeal.ownerId)}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-ink-500">Lead Source</div>
                        <div className="text-[13px] font-medium text-green-600">Website</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-ink-500">Categories</div>
                        <div className="text-[13px] font-medium text-yellow-600">Pending</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-ink-500">Submission Status</div>
                        <div className="text-[13px] font-medium text-red-600">Pending</div>
                      </div>
                    </div>
                    <button className="text-[12px] text-primary hover:underline w-full text-left font-medium">More Info</button>
                  </div>
                ) : contact ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Link to={`/contacts?open=${contact.id}`} className="text-[14px] font-semibold text-primary hover:underline">{contact.name}</Link>
                      </div>
                      <span className="inline-block px-2 py-0.5 bg-green-50 text-green-600 text-[11px] font-medium rounded">Contact</span>
                    </div>
                    <button className="w-full btn-secondary py-1 text-[13px]">Send Email</button>
                    <button className="text-[12px] text-primary hover:underline w-full text-left font-medium pt-2 border-t border-line">More Info</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[12.5px] text-ink-500">No related records found.</p>
                  </div>
                )}
             </div>
             
             {/* Open Activities Widget */}
             <div className="bg-white border border-line rounded-lg p-0 overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-line bg-gray-50/50">
                  <h3 className="text-[14px] font-bold text-ink">Open Activities</h3>
                  <button className="text-primary"><Plus size={16} /></button>
                </div>
                <div className="divide-y divide-line">
                  <div 
                    className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-page"
                    onClick={() => setOpenActivitiesOpen(prev => ({ ...prev, tasks: !prev.tasks }))}
                  >
                    <span className="text-[13px] font-medium text-ink-700">Tasks (0)</span>
                    {openActivitiesOpen.tasks ? <ChevronUp size={14} className="text-ink-400" /> : <ChevronDown size={14} className="text-ink-400" />}
                  </div>
                  {openActivitiesOpen.tasks && (
                    <div className="px-4 py-2 bg-page text-[12.5px] text-ink-500">No tasks</div>
                  )}
                  <div 
                    className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-page"
                    onClick={() => setOpenActivitiesOpen(prev => ({ ...prev, meetings: !prev.meetings }))}
                  >
                    <span className="text-[13px] font-medium text-ink-700">Meetings (0)</span>
                    {openActivitiesOpen.meetings ? <ChevronUp size={14} className="text-ink-400" /> : <ChevronDown size={14} className="text-ink-400" />}
                  </div>
                  {openActivitiesOpen.meetings && (
                    <div className="px-4 py-2 bg-page text-[12.5px] text-ink-500">No meetings</div>
                  )}
                  <div 
                    className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-page"
                    onClick={() => setOpenActivitiesOpen(prev => ({ ...prev, calls: !prev.calls }))}
                  >
                    <span className="text-[13px] font-medium text-ink-700">Calls (0)</span>
                    {openActivitiesOpen.calls ? <ChevronUp size={14} className="text-ink-400" /> : <ChevronDown size={14} className="text-ink-400" />}
                  </div>
                  {openActivitiesOpen.calls && (
                    <div className="px-4 py-2 bg-page text-[12.5px] text-ink-500">No calls</div>
                  )}
                </div>
             </div>
          </div>
        )}

        {activeTab === "Timeline" && (
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            <h2 className="text-[16px] font-bold mb-6">Timeline</h2>
            <div className="relative border-l border-line ml-4 space-y-6">
              <div className="relative pl-6">
                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white"></div>
                <div className="text-[13px]">
                  <span className="font-semibold">{userName(call.ownerId)}</span> logged the call.
                </div>
                <div className="text-[12px] text-ink-500 mt-0.5">{fmtDate(call.dateTime) || "Recently"}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
