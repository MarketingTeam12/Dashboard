import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Clock3, Download,
  ExternalLink, Eye, FileText, Filter, Megaphone, MoreHorizontal,
  Paperclip, Pencil, Plus, Search, Trash2, Upload, Users, X, Check
} from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import { useUrlActions } from '../../components/common/hooks';
import { CAMPAIGN_TYPES } from '../../data/seedData';
import { fmtDate, fmtINR, todayISO } from '../../utils/calculations';

const STATUS_BADGE = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Planning: 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-purple-50 text-purple-700 border-purple-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function Campaigns() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    campaigns = [],
    leads = [],
    contacts = [],
    deals = [],
    calls = [],
    users = [],
    userName,
    accountName,
    createRecord,
    updateRecord,
    deleteRecord,
    notify,
  } = useCRM();

  const [viewingId, setViewingId] = useState(routeId || null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [tab, setTab] = useState('Overview');
  const [showDetails, setShowDetails] = useState(true);
  const [connectedTab, setConnectedTab] = useState('All');

  // Modals for Edit / Create / Note / Attachment
  const [formModal, setFormModal] = useState(null); // { mode: 'create' | 'edit', data }
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [attachModal, setAttachModal] = useState(false);
  const [attachFile, setAttachFile] = useState({ fileName: '', size: '380 KB' });

  useUrlActions({
    onOpen: (openId) => {
      if (openId) setViewingId(openId);
    },
  });

  const activeId = routeId || viewingId;
  const campIdx = campaigns.findIndex((c) => c.id === activeId);
  const activeCampaign = campIdx >= 0 ? campaigns[campIdx] : activeId ? campaigns[0] : null;

  // Resolve Connected Records (Leads, Contacts, Deals) for a Campaign
  const getConnectedRecords = (camp) => {
    if (!camp) return { connectedLeads: [], connectedContacts: [], connectedDeals: [], connectedCalls: [] };
    const cName = (camp.name || '').toLowerCase();
    const cType = (camp.type || '').toLowerCase();

    let connectedLeads = leads.filter(
      (l) =>
        (l.campaignName || '').toLowerCase() === cName ||
        (l.campaignType || '').toLowerCase() === cType
    );
    if (connectedLeads.length === 0) {
      connectedLeads = leads.slice(0, 4);
    }

    const leadAccIds = new Set(connectedLeads.map((l) => l.connectedAccountId).filter(Boolean));
    const leadConIds = new Set(connectedLeads.map((l) => l.connectedContactId).filter(Boolean));
    const leadDealIds = new Set(connectedLeads.map((l) => l.connectedDealId).filter(Boolean));

    let connectedContacts = contacts.filter(
      (con) => leadConIds.has(con.id) || leadAccIds.has(con.accountId) || con.ownerId === camp.ownerId
    ).slice(0, 8);
    if (connectedContacts.length === 0) {
      connectedContacts = contacts.slice(0, 4);
    }

    let connectedDeals = deals.filter(
      (d) => leadDealIds.has(d.id) || leadAccIds.has(d.accountId) || d.ownerId === camp.ownerId
    ).slice(0, 8);
    if (connectedDeals.length === 0) {
      connectedDeals = deals.slice(0, 4);
    }

    const conIds = new Set(connectedContacts.map((c) => c.id));
    const connectedCalls = calls.filter((c) => conIds.has(c.contactId) || c.ownerId === camp.ownerId).slice(0, 6);

    return { connectedLeads, connectedContacts, connectedDeals, connectedCalls };
  };

  const { connectedLeads, connectedContacts, connectedDeals, connectedCalls } = useMemo(
    () => getConnectedRecords(activeCampaign),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCampaign, leads, contacts, deals, calls]
  );

  const totalConnectedCount =
    connectedLeads.length + connectedContacts.length + connectedDeals.length;

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from, { state: location.state });
      return;
    }
    if (routeId) {
      navigate('/campaigns');
    } else {
      setViewingId(null);
    }
  };

  const openCampaignDetail = (campId) => {
    setViewingId(campId);
    setTab('Overview');
    navigate(`/campaigns/${campId}`, {
      state: location.state?.from ? location.state : { from: '/campaigns' },
    });
  };

  const handleSaveCampaign = (e) => {
    e.preventDefault();
    if (!formModal) return;
    const d = formModal.data;
    if (!d.name?.trim()) return;
    const payload = {
      ...d,
      expectedRevenue: Number(d.expectedRevenue) || 0,
      budgetedCost: Number(d.budgetedCost) || 0,
      actualCost: Number(d.actualCost) || 0,
      expectedResponse: Number(d.expectedResponse) || 0,
      numSent: Number(d.numSent) || 0,
      modifiedBy: 'Sibi Chakaravarthi',
    };
    if (formModal.mode === 'create') {
      createRecord('campaigns', {
        ...payload,
        createdBy: 'Sibi Chakaravarthi',
        createdOn: todayISO(),
        notes: [],
        attachments: [],
      });
      notify(`Campaign "${d.name}" created`);
    } else if (activeCampaign) {
      updateRecord('campaigns', activeCampaign.id, payload);
      notify(`Campaign "${d.name}" updated`);
    }
    setFormModal(null);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!activeCampaign || !noteText.trim()) return;
    const newNote = {
      id: `cn-${Date.now()}`,
      title: noteTitle.trim() || 'Campaign Note',
      content: noteText.trim(),
      by: 'Sibi Chakaravarthi',
      date: fmtDate(todayISO()),
    };
    updateRecord('campaigns', activeCampaign.id, {
      notes: [newNote, ...(activeCampaign.notes || [])],
    });
    setNoteTitle('');
    setNoteText('');
    notify('Note added to campaign');
  };

  const handleAddAttachment = (e) => {
    e.preventDefault();
    if (!activeCampaign || !attachFile.fileName.trim()) return;
    const nextAtt = {
      id: `catt-${Date.now()}`,
      fileName: attachFile.fileName.trim(),
      size: attachFile.size || '380 KB',
      uploadedBy: 'Sibi Chakaravarthi',
      date: todayISO(),
    };
    updateRecord('campaigns', activeCampaign.id, {
      attachments: [nextAtt, ...(activeCampaign.attachments || [])],
    });
    setAttachFile({ fileName: '', size: '380 KB' });
    setAttachModal(false);
    notify('Attachment added to campaign');
  };

  const scrollToSection = (secId) => {
    setTab('Overview');
    setTimeout(() => {
      document.getElementById(secId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  };

  // ==========================================================================
  // VIEW 1: CAMPAIGN DETAILS PAGE (Screenshots 7, 8, 9)
  // ==========================================================================
  if (activeCampaign) {
    const prevCamp = campIdx > 0 ? campaigns[campIdx - 1] : null;
    const nextCamp = campIdx >= 0 && campIdx < campaigns.length - 1 ? campaigns[campIdx + 1] : null;
    const roiPct =
      activeCampaign.actualCost > 0
        ? Math.round(
            ((activeCampaign.expectedRevenue - activeCampaign.actualCost) /
              activeCampaign.actualCost) *
              100
          )
        : 100;

    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F7FA] -mx-3 sm:-mx-[18px] -mt-2.5 -mb-6">
        {/* Top Header */}
        <div className="bg-white px-4 py-3 border-b border-[#E3E8F2] flex flex-wrap items-center justify-between gap-3 shadow-xs z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-1.5 hover:bg-[#F3F6FB] rounded-full text-[#475569] transition"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold bg-[#2F55D4]">
              <Megaphone size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[16px] font-semibold text-[#1F2A44]">
                  {activeCampaign.name}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    STATUS_BADGE[activeCampaign.status] || STATUS_BADGE.Active
                  }`}
                >
                  {activeCampaign.status}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF2FF] text-[#2F55D4] border border-[#C7D2FE]">
                  {activeCampaign.type}
                </span>
              </div>
              <div className="text-[12px] text-[#6B7696] mt-0.5">
                Owner: <span className="font-medium text-[#1F2A44]">{userName(activeCampaign.ownerId)}</span> • {fmtDate(activeCampaign.startDate)} to {fmtDate(activeCampaign.endDate)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setFormModal({
                  mode: 'edit',
                  data: { ...activeCampaign },
                })
              }
              className="h-8 px-3 rounded border border-[#D5DBE8] bg-white hover:bg-[#F3F6FB] text-[12.5px] font-medium text-[#1F2A44] inline-flex items-center gap-1.5"
            >
              <Pencil size={13.5} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setAttachModal(true)}
              className="h-8 px-3 rounded border border-[#D5DBE8] bg-white hover:bg-[#F3F6FB] text-[12.5px] font-medium text-[#1F2A44] inline-flex items-center gap-1.5"
            >
              <Paperclip size={13.5} />
              Attach
            </button>
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                disabled={!prevCamp}
                onClick={() => prevCamp && openCampaignDetail(prevCamp.id)}
                className="h-8 w-8 rounded border border-[#D5DBE8] bg-white hover:bg-[#F3F6FB] flex items-center justify-center disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                disabled={!nextCamp}
                onClick={() => nextCamp && openCampaignDetail(nextCamp.id)}
                className="h-8 w-8 rounded border border-[#D5DBE8] bg-white hover:bg-[#F3F6FB] flex items-center justify-center disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Sub Header: Overview | Timeline */}
        <div className="bg-[#F5F7FA] px-4 py-2 flex items-center justify-between border-b border-[#E3E8F2]">
          <div className="flex items-center gap-6 text-[13px] font-medium">
            <button
              type="button"
              onClick={() => setTab('Overview')}
              className={`pb-1 transition ${
                tab === 'Overview'
                  ? 'text-[#2F55D4] border-b-2 border-[#2F55D4] font-semibold'
                  : 'text-[#6B7696] hover:text-[#1F2A44]'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setTab('Timeline')}
              className={`pb-1 transition ${
                tab === 'Timeline'
                  ? 'text-[#2F55D4] border-b-2 border-[#2F55D4] font-semibold'
                  : 'text-[#6B7696] hover:text-[#1F2A44]'
              }`}
            >
              Timeline
            </button>
          </div>
          <div className="text-[11.5px] text-[#6B7696] flex items-center gap-1.5">
            <Clock3 size={13} />
            Last Updated: {fmtDate(activeCampaign.createdOn)}
          </div>
        </div>

        {/* Main Body: Left Related List Sidebar + Right Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Related List Sidebar */}
          <div className="w-[215px] bg-white border-r border-[#E3E8F2] flex flex-col overflow-y-auto shrink-0 py-4">
            <div className="px-5 mb-2 text-[13.5px] font-bold text-[#1F2A44] tracking-tight">
              Related List
            </div>
            <ul className="text-[13px] text-[#334155] space-y-0.5">
              <li
                onClick={() => scrollToSection('camp-info')}
                className="px-5 py-2 hover:bg-[#F3F6FB] cursor-pointer flex items-center justify-between"
              >
                <span>Campaign Information</span>
              </li>
              <li
                onClick={() => scrollToSection('camp-summary')}
                className="px-5 py-2 hover:bg-[#F3F6FB] cursor-pointer flex items-center justify-between"
              >
                <span>Summary</span>
              </li>
              <li
                onClick={() => scrollToSection('camp-notes')}
                className="px-5 py-2 hover:bg-[#F3F6FB] cursor-pointer flex items-center justify-between"
              >
                <span>Notes</span>
                <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-2 py-0.5 text-[11px] font-semibold">
                  {(activeCampaign.notes || []).length}
                </span>
              </li>
              <li
                onClick={() => scrollToSection('camp-attachments')}
                className="px-5 py-2 hover:bg-[#F3F6FB] cursor-pointer flex items-center justify-between"
              >
                <span>Attachments</span>
                <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-2 py-0.5 text-[11px] font-semibold">
                  {(activeCampaign.attachments || []).length}
                </span>
              </li>
              <li
                onClick={() => scrollToSection('camp-connected')}
                className="px-5 py-2 hover:bg-[#F3F6FB] cursor-pointer flex items-center justify-between font-medium text-[#2F55D4]"
              >
                <span>Connected Records</span>
                <span className="bg-[#EEF2FF] text-[#2F55D4] rounded-full px-2 py-0.5 text-[11px] font-semibold">
                  {totalConnectedCount}
                </span>
              </li>
              <li
                onClick={() => {
                  setConnectedTab('Leads');
                  scrollToSection('camp-connected');
                }}
                className="pl-8 pr-5 py-1.5 hover:bg-[#F3F6FB] cursor-pointer flex items-center justify-between text-[12.5px] text-[#475569]"
              >
                <span>Leads</span>
                <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-0.2 text-[10.5px] font-semibold">
                  {connectedLeads.length}
                </span>
              </li>
              <li
                onClick={() => {
                  setConnectedTab('Contacts');
                  scrollToSection('camp-connected');
                }}
                className="pl-8 pr-5 py-1.5 hover:bg-[#F3F6FB] cursor-pointer flex items-center justify-between text-[12.5px] text-[#475569]"
              >
                <span>Contacts</span>
                <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-0.2 text-[10.5px] font-semibold">
                  {connectedContacts.length}
                </span>
              </li>
              <li
                onClick={() => {
                  setConnectedTab('Deals');
                  scrollToSection('camp-connected');
                }}
                className="pl-8 pr-5 py-1.5 hover:bg-[#F3F6FB] cursor-pointer flex items-center justify-between text-[12.5px] text-[#475569]"
              >
                <span>Deals</span>
                <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-0.2 text-[10.5px] font-semibold">
                  {connectedDeals.length}
                </span>
              </li>
              <li
                onClick={() => scrollToSection('camp-activities')}
                className="px-5 py-2 hover:bg-[#F3F6FB] cursor-pointer flex items-center justify-between"
              >
                <span>Activities</span>
                <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-2 py-0.5 text-[11px] font-semibold">
                  {connectedCalls.length}
                </span>
              </li>
            </ul>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {tab === 'Overview' ? (
              <>
                {/* 1. Summary Section */}
                <section
                  id="camp-summary"
                  className="bg-white border border-[#E3E8F2] rounded-lg p-5 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-bold text-[#1F2A44]">Summary</h3>
                    <span className="text-[12px] text-[#6B7696]">
                      Campaign ID: <span className="font-mono text-[#1F2A44]">{activeCampaign.id}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <div className="text-[11px] text-[#64748B]">Expected Revenue</div>
                      <div className="text-[14px] font-bold text-[#0F172A] mt-0.5">
                        {fmtINR(activeCampaign.expectedRevenue)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <div className="text-[11px] text-[#64748B]">Budgeted Cost</div>
                      <div className="text-[14px] font-bold text-[#0F172A] mt-0.5">
                        {fmtINR(activeCampaign.budgetedCost)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <div className="text-[11px] text-[#64748B]">Actual Cost</div>
                      <div className="text-[14px] font-bold text-[#0F172A] mt-0.5">
                        {fmtINR(activeCampaign.actualCost)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <div className="text-[11px] text-[#64748B]">Expected Response</div>
                      <div className="text-[14px] font-bold text-emerald-700 mt-0.5">
                        {activeCampaign.expectedResponse}%
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <div className="text-[11px] text-[#64748B]">Numbers Sent</div>
                      <div className="text-[14px] font-bold text-[#0F172A] mt-0.5">
                        {(activeCampaign.numSent || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <div className="text-[11px] text-[#64748B]">Projected ROI</div>
                      <div className="text-[14px] font-bold text-[#2F55D4] mt-0.5">
                        +{roiPct}%
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Campaign Information Section */}
                <section
                  id="camp-info"
                  className="bg-white border border-[#E3E8F2] rounded-lg overflow-hidden shadow-2xs"
                >
                  <div className="px-5 py-3 border-b border-[#EEF1F7] flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-[#1F2A44]">
                      Campaign Information
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowDetails((s) => !s)}
                      className="text-[12px] font-medium text-[#2F55D4] hover:underline"
                    >
                      {showDetails ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  {showDetails && (
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-10 text-[13px]">
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-[#6B7696] text-right">Campaign Owner</span>
                        <span className="font-medium text-[#1F2A44]">
                          {userName(activeCampaign.ownerId)}
                        </span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-[#6B7696] text-right">Type</span>
                        <span className="font-medium text-[#1F2A44]">{activeCampaign.type}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-[#6B7696] text-right">Campaign Name</span>
                        <span className="font-semibold text-[#1F2A44]">{activeCampaign.name}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-[#6B7696] text-right">Status</span>
                        <span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              STATUS_BADGE[activeCampaign.status] || STATUS_BADGE.Active
                            }`}
                          >
                            {activeCampaign.status}
                          </span>
                        </span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-[#6B7696] text-right">Start Date</span>
                        <span className="text-[#1F2A44]">{fmtDate(activeCampaign.startDate)}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-[#6B7696] text-right">End Date</span>
                        <span className="text-[#1F2A44]">{fmtDate(activeCampaign.endDate)}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-[#6B7696] text-right">Expected Revenue</span>
                        <span className="font-semibold text-[#1F2A44]">
                          {fmtINR(activeCampaign.expectedRevenue)}
                        </span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-[#6B7696] text-right">Budgeted Cost</span>
                        <span className="text-[#1F2A44]">
                          {fmtINR(activeCampaign.budgetedCost)}
                        </span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-[#6B7696] text-right">Actual Cost</span>
                        <span className="text-[#1F2A44]">{fmtINR(activeCampaign.actualCost)}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-[#6B7696] text-right">Expected Response</span>
                        <span className="text-[#1F2A44]">{activeCampaign.expectedResponse}%</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-[#6B7696] text-right">Numbers Sent</span>
                        <span className="text-[#1F2A44]">
                          {(activeCampaign.numSent || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-[#6B7696] text-right">Created By</span>
                        <span className="text-[#1F2A44]">
                          {activeCampaign.createdBy || userName(activeCampaign.ownerId)}
                        </span>
                      </div>
                      <div className="md:col-span-2 grid grid-cols-[160px_1fr] gap-3 pt-2 border-t border-[#EEF1F7]">
                        <span className="text-[#6B7696] text-right">Description</span>
                        <span className="text-[#334155] leading-relaxed">
                          {activeCampaign.description || '—'}
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                {/* 3. Notes Section */}
                <section
                  id="camp-notes"
                  className="bg-white border border-[#E3E8F2] rounded-lg p-5 shadow-2xs space-y-3"
                >
                  <h3 className="text-[14px] font-bold text-[#1F2A44]">Notes</h3>
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Add a title..."
                      className="w-full h-8 px-3 border border-[#CBD5E1] rounded text-[12.5px]"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Write a note for this campaign..."
                        className="flex-1 h-8 px-3 border border-[#CBD5E1] rounded text-[12.5px]"
                      />
                      <button
                        type="submit"
                        className="h-8 px-3.5 rounded bg-[#2F55D4] text-white text-[12px] font-medium hover:bg-[#2748B8]"
                      >
                        Save Note
                      </button>
                    </div>
                  </form>
                  {(activeCampaign.notes || []).length === 0 ? (
                    <p className="text-[12.5px] text-[#6B7696]">No notes recorded yet.</p>
                  ) : (
                    <div className="space-y-2 pt-1">
                      {(activeCampaign.notes || []).map((n) => (
                        <div
                          key={n.id}
                          className="p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC] text-[12.5px]"
                        >
                          <div className="font-semibold text-[#0F172A]">{n.title}</div>
                          <div className="text-[#334155] mt-0.5">{n.content}</div>
                          <div className="text-[11px] text-[#64748B] mt-1">
                            {n.by} • {n.date}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* 4. Attachments Section */}
                <section
                  id="camp-attachments"
                  className="bg-white border border-[#E3E8F2] rounded-lg p-5 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-[#1F2A44]">Attachments</h3>
                    <button
                      type="button"
                      onClick={() => setAttachModal(true)}
                      className="h-7 px-3 rounded border border-[#2F55D4] text-[#2F55D4] text-[12px] font-medium hover:bg-[#EEF2FF] inline-flex items-center gap-1"
                    >
                      <Upload size={12.5} /> Attach File
                    </button>
                  </div>
                  {(activeCampaign.attachments || []).length === 0 ? (
                    <p className="text-[12.5px] text-[#6B7696]">No attachments found.</p>
                  ) : (
                    <table className="w-full text-left text-[12.5px] border border-[#E2E8F0] rounded overflow-hidden">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569]">
                        <tr>
                          <th className="py-2 px-3">File Name</th>
                          <th className="py-2 px-3">Size</th>
                          <th className="py-2 px-3">Attached By</th>
                          <th className="py-2 px-3">Date Added</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF2F6]">
                        {(activeCampaign.attachments || []).map((att) => (
                          <tr key={att.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-2 px-3 font-medium text-[#2F55D4] flex items-center gap-1.5">
                              <FileText size={14} />
                              {att.fileName}
                            </td>
                            <td className="py-2 px-3 text-[#475569]">{att.size}</td>
                            <td className="py-2 px-3 text-[#475569]">{att.uploadedBy}</td>
                            <td className="py-2 px-3 text-[#475569]">{fmtDate(att.date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>

                {/* 5. Connected Records Section (Screenshots 8 & 9: Leads, Contacts, Deals) */}
                <section
                  id="camp-connected"
                  className="bg-white border border-[#E3E8F2] rounded-lg overflow-hidden shadow-2xs"
                >
                  <div className="px-5 py-3 border-b border-[#EEF1F7] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-[#1F2A44]">
                        Connected Records
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2FF] text-[#2F55D4]">
                        {totalConnectedCount}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[
                        { key: 'All', label: `All (${totalConnectedCount})` },
                        { key: 'Leads', label: `Leads (${connectedLeads.length})` },
                        { key: 'Contacts', label: `Contacts (${connectedContacts.length})` },
                        { key: 'Deals', label: `Deals (${connectedDeals.length})` },
                      ].map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setConnectedTab(t.key)}
                          className={`px-2.5 py-1 rounded text-[12px] font-medium transition ${
                            connectedTab === t.key
                              ? 'bg-[#2F55D4] text-white'
                              : 'bg-[#F3F6FB] text-[#475569] hover:bg-[#E2E8F0]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 space-y-5">
                    {/* Connected Leads Table */}
                    {(connectedTab === 'All' || connectedTab === 'Leads') && (
                      <div>
                        <h4 className="text-[12.5px] font-semibold text-[#475569] uppercase tracking-wider mb-2">
                          Connected Leads ({connectedLeads.length})
                        </h4>
                        <div className="overflow-x-auto border border-[#E2E8F0] rounded">
                          <table className="w-full text-left text-[12.5px]">
                            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                              <tr>
                                <th className="py-2 px-3">Lead Name</th>
                                <th className="py-2 px-3">Company</th>
                                <th className="py-2 px-3">Phone / Mobile</th>
                                <th className="py-2 px-3">Lead Status</th>
                                <th className="py-2 px-3">City</th>
                                <th className="py-2 px-3">Lead Owner</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EEF2F6]">
                              {connectedLeads.map((l) => (
                                <tr key={l.id} className="hover:bg-[#F5F8FF]">
                                  <td className="py-2 px-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigate(`/leads/${l.id}`, {
                                          state: { from: `/campaigns/${activeCampaign.id}` },
                                        })
                                      }
                                      className="text-[#2F55D4] hover:underline font-semibold text-left"
                                    >
                                      {l.name}
                                    </button>
                                  </td>
                                  <td className="py-2 px-3 text-[#334155]">{l.company}</td>
                                  <td className="py-2 px-3 text-[#475569]">{l.mobile || l.phone}</td>
                                  <td className="py-2 px-3">
                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-medium">
                                      {l.status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-[#475569]">{l.city}</td>
                                  <td className="py-2 px-3 text-[#475569]">{userName(l.ownerId)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Connected Contacts Table */}
                    {(connectedTab === 'All' || connectedTab === 'Contacts') && (
                      <div>
                        <h4 className="text-[12.5px] font-semibold text-[#475569] uppercase tracking-wider mb-2">
                          Connected Contacts ({connectedContacts.length})
                        </h4>
                        <div className="overflow-x-auto border border-[#E2E8F0] rounded">
                          <table className="w-full text-left text-[12.5px]">
                            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                              <tr>
                                <th className="py-2 px-3">Contact Name</th>
                                <th className="py-2 px-3">Account Name</th>
                                <th className="py-2 px-3">Email</th>
                                <th className="py-2 px-3">Phone</th>
                                <th className="py-2 px-3">Lifecycle</th>
                                <th className="py-2 px-3">Owner</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EEF2F6]">
                              {connectedContacts.map((c) => (
                                <tr key={c.id} className="hover:bg-[#F5F8FF]">
                                  <td className="py-2 px-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigate(`/contacts/${c.id}`, {
                                          state: { from: `/campaigns/${activeCampaign.id}` },
                                        })
                                      }
                                      className="text-[#2F55D4] hover:underline font-semibold text-left"
                                    >
                                      {c.name}
                                    </button>
                                  </td>
                                  <td className="py-2 px-3 text-[#334155]">{accountName(c.accountId)}</td>
                                  <td className="py-2 px-3 text-[#475569]">{c.email}</td>
                                  <td className="py-2 px-3 text-[#475569]">{c.phone}</td>
                                  <td className="py-2 px-3">
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                                      {c.lifecycle}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-[#475569]">{userName(c.ownerId)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Connected Deals Table */}
                    {(connectedTab === 'All' || connectedTab === 'Deals') && (
                      <div>
                        <h4 className="text-[12.5px] font-semibold text-[#475569] uppercase tracking-wider mb-2">
                          Connected Deals ({connectedDeals.length})
                        </h4>
                        <div className="overflow-x-auto border border-[#E2E8F0] rounded">
                          <table className="w-full text-left text-[12.5px]">
                            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                              <tr>
                                <th className="py-2 px-3">Deal Name</th>
                                <th className="py-2 px-3">Account Name</th>
                                <th className="py-2 px-3">Stage</th>
                                <th className="py-2 px-3 text-right">Amount</th>
                                <th className="py-2 px-3">Closing Date</th>
                                <th className="py-2 px-3">Deal Owner</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EEF2F6]">
                              {connectedDeals.map((d) => (
                                <tr key={d.id} className="hover:bg-[#F5F8FF]">
                                  <td className="py-2 px-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigate(`/deals/${d.id}`, {
                                          state: { from: `/campaigns/${activeCampaign.id}` },
                                        })
                                      }
                                      className="text-[#2F55D4] hover:underline font-semibold text-left"
                                    >
                                      {d.name}
                                    </button>
                                  </td>
                                  <td className="py-2 px-3 text-[#334155]">{accountName(d.accountId)}</td>
                                  <td className="py-2 px-3">
                                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-medium">
                                      {d.stage}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right font-semibold text-[#0F172A]">
                                    {fmtINR(d.amount)}
                                  </td>
                                  <td className="py-2 px-3 text-[#475569]">{fmtDate(d.closingDate)}</td>
                                  <td className="py-2 px-3 text-[#475569]">{userName(d.ownerId)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* 6. Campaign Activities Section */}
                <section
                  id="camp-activities"
                  className="bg-white border border-[#E3E8F2] rounded-lg p-5 shadow-2xs space-y-3"
                >
                  <h3 className="text-[14px] font-bold text-[#1F2A44]">
                    Campaign Call Activities ({connectedCalls.length})
                  </h3>
                  {connectedCalls.length === 0 ? (
                    <p className="text-[12.5px] text-[#6B7696]">No activities logged yet.</p>
                  ) : (
                    <div className="overflow-x-auto border border-[#E2E8F0] rounded">
                      <table className="w-full text-left text-[12.5px]">
                        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                          <tr>
                            <th className="py-2 px-3">Subject</th>
                            <th className="py-2 px-3">Call Type</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Call Start Time</th>
                            <th className="py-2 px-3">Owner</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF2F6]">
                          {connectedCalls.map((c) => (
                            <tr key={c.id} className="hover:bg-[#F5F8FF]">
                              <td className="py-2 px-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/calls/${c.id}`, {
                                      state: { from: `/campaigns/${activeCampaign.id}` },
                                    })
                                  }
                                  className="text-[#2F55D4] hover:underline font-medium text-left"
                                >
                                  {c.subject}
                                </button>
                              </td>
                              <td className="py-2 px-3 text-[#334155]">{c.type}</td>
                              <td className="py-2 px-3 text-[#334155]">{c.status}</td>
                              <td className="py-2 px-3 text-[#475569]">{fmtDate(c.dateTime)}</td>
                              <td className="py-2 px-3 text-[#475569]">{userName(c.ownerId)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            ) : (
              /* TIMELINE TAB */
              <div className="bg-white border border-[#E3E8F2] rounded-lg p-5 shadow-2xs space-y-4">
                <h3 className="text-[14px] font-bold text-[#1F2A44]">Campaign Timeline</h3>
                <ol className="relative border-l-2 border-[#CBD5E1] ml-3 space-y-4">
                  {[
                    {
                      title: `Campaign "${activeCampaign.name}" status verified as ${activeCampaign.status}`,
                      by: userName(activeCampaign.ownerId),
                      time: `${fmtDate(activeCampaign.startDate)} 10:30 AM`,
                    },
                    {
                      title: `${connectedLeads.length} Leads and ${connectedDeals.length} Deals connected to campaign`,
                      by: activeCampaign.createdBy || 'Sibi Chakaravarthi',
                      time: `${fmtDate(activeCampaign.startDate)} 09:45 AM`,
                    },
                    {
                      title: `Budgeted Cost set to ${fmtINR(activeCampaign.budgetedCost)} with Expected Revenue ${fmtINR(activeCampaign.expectedRevenue)}`,
                      by: activeCampaign.createdBy || 'Sibi Chakaravarthi',
                      time: `${fmtDate(activeCampaign.createdOn)} 09:15 AM`,
                    },
                    {
                      title: `Campaign created in Zoho CRM`,
                      by: activeCampaign.createdBy || 'Sibi Chakaravarthi',
                      time: `${fmtDate(activeCampaign.createdOn)} 09:00 AM`,
                    },
                  ].map((ev, i) => (
                    <li key={i} className="pl-5 relative">
                      <span className="w-3 h-3 rounded-full bg-[#2F55D4] ring-4 ring-white absolute -left-[7px] top-1" />
                      <div className="text-[13px] font-medium text-[#1F2A44]">{ev.title}</div>
                      <div className="text-[11.5px] text-[#6B7696] mt-0.5">
                        by {ev.by} • {ev.time}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Attach Modal */}
        {attachModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-xl w-full max-w-md p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-[#0F172A]">Attach File to Campaign</h3>
                <button type="button" onClick={() => setAttachModal(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleAddAttachment} className="space-y-3 text-[13px]">
                <div>
                  <label className="block font-medium text-[#334155] mb-1">File Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Campaign_ROI_Report.pdf"
                    value={attachFile.fileName}
                    onChange={(e) => setAttachFile({ ...attachFile, fileName: e.target.value })}
                    className="w-full h-9 px-3 border border-[#CBD5E1] rounded"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAttachModal(false)}
                    className="h-8 px-3 border border-[#CBD5E1] rounded text-[12.5px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8 px-4 bg-[#2F55D4] text-white rounded text-[12.5px] font-medium"
                  >
                    Attach
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Campaign Modal */}
        {formModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-xl w-full max-w-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-[#0F172A]">
                  {formModal.mode === 'create' ? 'Create Campaign' : 'Edit Campaign'}
                </h3>
                <button type="button" onClick={() => setFormModal(null)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSaveCampaign} className="space-y-3 text-[12.5px]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block font-medium text-[#334155] mb-1">Campaign Name *</label>
                    <input
                      type="text"
                      required
                      value={formModal.data.name || ''}
                      onChange={(e) =>
                        setFormModal((p) => ({ ...p, data: { ...p.data, name: e.target.value } }))
                      }
                      className="w-full h-8 px-3 border border-[#CBD5E1] rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#334155] mb-1">Type</label>
                    <select
                      value={formModal.data.type || 'Zoho Campaigns'}
                      onChange={(e) =>
                        setFormModal((p) => ({ ...p, data: { ...p.data, type: e.target.value } }))
                      }
                      className="w-full h-8 px-2 border border-[#CBD5E1] rounded bg-white"
                    >
                      {CAMPAIGN_TYPES.filter((t) => !t.startsWith('-')).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-[#334155] mb-1">Status</label>
                    <select
                      value={formModal.data.status || 'Active'}
                      onChange={(e) =>
                        setFormModal((p) => ({ ...p, data: { ...p.data, status: e.target.value } }))
                      }
                      className="w-full h-8 px-2 border border-[#CBD5E1] rounded bg-white"
                    >
                      {['Active', 'Planning', 'Completed', 'Inactive'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-[#334155] mb-1">Expected Revenue (₹)</label>
                    <input
                      type="number"
                      value={formModal.data.expectedRevenue || 0}
                      onChange={(e) =>
                        setFormModal((p) => ({
                          ...p,
                          data: { ...p.data, expectedRevenue: e.target.value },
                        }))
                      }
                      className="w-full h-8 px-3 border border-[#CBD5E1] rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#334155] mb-1">Budgeted Cost (₹)</label>
                    <input
                      type="number"
                      value={formModal.data.budgetedCost || 0}
                      onChange={(e) =>
                        setFormModal((p) => ({
                          ...p,
                          data: { ...p.data, budgetedCost: e.target.value },
                        }))
                      }
                      className="w-full h-8 px-3 border border-[#CBD5E1] rounded"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFormModal(null)}
                    className="h-8 px-3 border border-[#CBD5E1] rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8 px-4 bg-[#2F55D4] text-white rounded font-medium"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // VIEW 2: CAMPAIGNS LIST PAGE (/campaigns)
  // ==========================================================================
  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (typeFilter !== 'All' && c.type !== typeFilter) return false;
    if (
      search.trim() &&
      !c.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      !c.type.toLowerCase().includes(search.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {location.state?.from && (
        <div>
          <button
            type="button"
            onClick={() => navigate(location.state.from)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-[#2F7BF5] font-semibold text-xs hover:bg-blue-100 transition"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F55D4] flex items-center justify-center">
            <Megaphone size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Campaigns</h1>
            <p className="text-xs text-slate-500">
              Click any Campaign Name to view its Overview, Timeline, Summary, Attachments, and Connected Records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Planning">Planning</option>
            <option value="Completed">Completed</option>
          </select>
          <button
            type="button"
            onClick={() =>
              setFormModal({
                mode: 'create',
                data: {
                  name: '',
                  type: 'Zoho Campaigns',
                  status: 'Active',
                  ownerId: 'u1',
                  startDate: todayISO(),
                  endDate: '2026-12-31',
                  expectedRevenue: 2500000,
                  budgetedCost: 120000,
                  actualCost: 85000,
                  expectedResponse: 35,
                  numSent: 1500,
                  description: '',
                },
              })
            }
            className="px-3.5 py-1.5 bg-[#2F55D4] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Create Campaign
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4 text-right">Expected Revenue</th>
                <th className="py-3 px-4 text-right">Budgeted Cost</th>
                <th className="py-3 px-4">Campaign Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaigns.map((c) => (
                <tr key={c.id} className="hover:bg-blue-50/40 transition">
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => openCampaignDetail(c.id)}
                      className="text-[#2F55D4] hover:underline font-semibold text-left"
                    >
                      {c.name}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{c.type}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        STATUS_BADGE[c.status] || STATUS_BADGE.Active
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{fmtDate(c.startDate)}</td>
                  <td className="py-3 px-4 text-slate-600">{fmtDate(c.endDate)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {fmtINR(c.expectedRevenue)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {fmtINR(c.budgetedCost)}
                  </td>
                  <td className="py-3 px-4 text-slate-700">{userName(c.ownerId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

