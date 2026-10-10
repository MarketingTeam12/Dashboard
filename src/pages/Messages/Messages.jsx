import { useMemo, useRef, useState } from 'react';
import {
  MessageSquare, Mail, Paperclip, Reply, Star, Archive, Trash2,
  Search, ChevronDown, Send, Plus, Upload, FileText, Download,
  CheckCircle2, X, Folder
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import Modal, { Drawer, SectionTitle } from '../../components/common/Modal';

const TAG_COLORS = {
  Lead: 'bg-blue-50 text-blue-700 border-blue-200',
  Contact: 'bg-purple-50 text-purple-700 border-purple-200',
  Deal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Account: 'bg-amber-50 text-amber-700 border-amber-200',
  Customer: 'bg-teal-50 text-teal-700 border-teal-200',
  Internal: 'bg-slate-100 text-slate-700 border-slate-200',
};

// Zoho CRM reference messages from Image 5
const ZOHO_REFERENCE_MESSAGES = [
  {
    id: 'zoho-msg-1',
    sender: 'VIKRAM',
    tag: 'Lead',
    snippet: 'Lead is viewing',
    body: 'Lead VIKRAM is currently viewing the product catalog and pricing details on WhatsApp.',
    time: '18 Apr 2025',
    ownerName: 'Sibi Chakaravarthi',
    repliedBy: '',
    replied: false,
    read: false,
    starred: true,
    hasAttachment: true,
    attachments: [
      {
        id: 'att-zoho-1',
        name: 'Vikram_Product_Brochure.pdf',
        size: '312.4 KB',
        type: 'application/pdf',
        uploadedAt: '18 Apr 2025',
        uploadedBy: 'Sibi Chakaravarthi',
        url: '#',
      },
    ],
  },
  {
    id: 'zoho-msg-2',
    sender: 'Justdial User',
    tag: 'Lead',
    snippet: 'Yes Tell me',
    body: 'Yes Tell me the complete quotation and installation timeline for our office requirement.',
    time: '15 Apr 2025',
    ownerName: 'Haritha',
    repliedBy: 'Haritha',
    replied: true,
    read: true,
    starred: false,
    hasAttachment: false,
    attachments: [],
  },
  {
    id: 'zoho-msg-3',
    sender: 'Mr Adi',
    tag: 'Lead',
    snippet: 'Lead has submitted the registration form',
    body: 'Lead Mr Adi has submitted the registration form with GST and company verification documents.',
    time: '11 Apr 2025',
    ownerName: 'Pravin',
    repliedBy: '',
    replied: false,
    read: false,
    starred: true,
    hasAttachment: true,
    attachments: [
      {
        id: 'att-zoho-3',
        name: 'Mr_Adi_Registration_Form.pdf',
        size: '184.0 KB',
        type: 'application/pdf',
        uploadedAt: '11 Apr 2025',
        uploadedBy: 'Mr Adi',
        url: '#',
      },
    ],
  },
  {
    id: 'zoho-msg-4',
    sender: 'Deekshith Deekshith',
    tag: 'Lead',
    snippet: "Hi Sibi Chakaravarthi, I'm interested in your services. Please contact me.",
    body: "Hi Sibi Chakaravarthi, I'm interested in your services. Please contact me with a formal quotation.",
    time: '10 Apr 2025',
    ownerName: 'Sibi Chakaravarthi',
    repliedBy: 'Sibi Chakaravarthi',
    replied: true,
    read: true,
    starred: false,
    hasAttachment: false,
    attachments: [],
  },
  {
    id: 'zoho-msg-5',
    sender: 'Bhuvanesh D',
    tag: 'Lead',
    snippet: 'No',
    body: 'No, please reschedule the demo call to next week.',
    time: '04 Apr 2025',
    ownerName: 'Pavithra',
    repliedBy: '',
    replied: false,
    read: true,
    starred: false,
    hasAttachment: false,
    attachments: [],
  },
  {
    id: 'zoho-msg-6',
    sender: 'Dr Ruchi',
    tag: 'Lead',
    snippet: 'Justdial',
    body: 'Enquiry received via Justdial for hospital CRM and billing integration.',
    time: '03 Apr 2025',
    ownerName: 'Soundarya',
    repliedBy: 'Soundarya',
    replied: true,
    read: true,
    starred: true,
    hasAttachment: true,
    attachments: [
      {
        id: 'att-zoho-6',
        name: 'Dr_Ruchi_Requirements.docx',
        size: '142.6 KB',
        type: 'application/docx',
        uploadedAt: '03 Apr 2025',
        uploadedBy: 'Dr Ruchi',
        url: '#',
      },
    ],
  },
  {
    id: 'zoho-msg-7',
    sender: 'Lalith',
    tag: 'Lead',
    snippet: 'Lead is visiting the catalog',
    body: 'Lead Lalith is visiting the catalog and requested enterprise pricing.',
    time: '02 Apr 2025',
    ownerName: 'Ramesh',
    repliedBy: '',
    replied: false,
    read: false,
    starred: false,
    hasAttachment: false,
    attachments: [],
  },
  {
    id: 'zoho-msg-8',
    sender: 'Sunil',
    tag: 'Lead',
    snippet: "Hi Sibi Chakaravarthi, I'm interested in your services. Please contact me.",
    body: "Hi Sibi Chakaravarthi, I'm interested in your services. Please contact me.",
    time: '02 Apr 2025',
    ownerName: 'Sibi Chakaravarthi',
    repliedBy: 'Sibi Chakaravarthi',
    replied: true,
    read: true,
    starred: false,
    hasAttachment: false,
    attachments: [],
  },
];

const formatBytes = (bytes) => {
  if (!bytes || isNaN(bytes)) return '18 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const filesToAttachments = (fileList, currentUserName = 'Current User') =>
  Array.from(fileList || []).map((file) => ({
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    size: formatBytes(file.size),
    type: file.type || 'application/octet-stream',
    uploadedAt: new Date().toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    uploadedBy: currentUserName,
    url: URL.createObjectURL(file),
  }));

export default function Messages() {
  const crm = useCRM();
  const {
    messages: contextMessages = [],
    currentUser,
    sendMessage,
    replyMessage,
    addMessageAttachment,
    removeMessageAttachment,
    toggleStarMessage,
    archiveMessage,
    markMessageRead,
    notify,
  } = crm;

  // Local state for reference messages so attachments/stars/replies work seamlessly on all rows
  const [localMsgOverrides, setLocalMsgOverrides] = useState({});

  const [activeView, setActiveView] = useState('all');
  const [view, setView] = useState('list');
  const [systemFilter, setSystemFilter] = useState('All'); // 'All', 'Not Replied Messages', 'Replied Messages'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Not Read', 'Read', 'Starred', 'Archived'
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [onlyWithAttachments, setOnlyWithAttachments] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [openSections, setOpenSections] = useState({
    system: true,
    fields: true,
    status: true,
    type: true,
  });

  // Active message ID for drawer
  const [viewingMsgId, setViewingMsgId] = useState(null);

  // Quick row attachment target
  const [rowAttachTargetId, setRowAttachTargetId] = useState(null);
  const rowFileInputRef = useRef(null);
  const drawerFileInputRef = useRef(null);
  const replyFileInputRef = useRef(null);
  const composeFileInputRef = useRef(null);

  // Compose & Reply state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [composeForm, setComposeForm] = useState({
    recipient: '',
    tag: 'Lead',
    snippet: '',
    body: '',
    attachments: [],
  });

  // Combine Zoho CRM reference messages + context messages
  const normalizedMessages = useMemo(() => {
    const existingIds = new Set(contextMessages.map((m) => m.id));
    const combined = [
      ...ZOHO_REFERENCE_MESSAGES.filter((zm) => !existingIds.has(zm.id)),
      ...contextMessages,
    ];

    return combined.map((raw) => {
      const ov = localMsgOverrides[raw.id] || {};
      const m = { ...raw, ...ov };
      const isRead = m.read !== undefined ? m.read : m.status === 'Read';
      const isStarred = m.starred !== undefined ? m.starred : m.status === 'Starred';
      const isArchived = m.archived !== undefined ? m.archived : m.status === 'Archived';
      const tag = m.tag || m.badge || 'Lead';
      const existingAtts = Array.isArray(m.attachments) ? m.attachments : [];
      const attachments =
        existingAtts.length > 0
          ? existingAtts
          : m.hasAttachment
          ? [
              {
                id: `seed-att-${m.id}`,
                name: `${(m.sender || 'Client').replace(/\s+/g, '_')}_Document.pdf`,
                size: '245.8 KB',
                type: 'application/pdf',
                uploadedAt: m.time || 'Today',
                uploadedBy: m.sender || 'Customer',
                url: '#',
              },
            ]
          : [];
      const isReplied =
        Boolean(m.replied) || (Array.isArray(m.replies) && m.replies.length > 0);
      return {
        ...m,
        read: isRead,
        starred: isStarred,
        archived: isArchived,
        replied: isReplied,
        tag,
        ownerName: m.ownerName || 'Sibi Chakaravarthi',
        attachments,
        hasAttachment: attachments.length > 0,
      };
    });
  }, [contextMessages, localMsgOverrides]);

  const viewingMessage = useMemo(
    () => normalizedMessages.find((m) => m.id === viewingMsgId) || null,
    [normalizedMessages, viewingMsgId]
  );

  // Helper to update either context message or reference message
  const updateMessageItem = (msgId, updater) => {
    const target = normalizedMessages.find((m) => m.id === msgId);
    if (!target) return;
    const nextPatch = updater(target);
    setLocalMsgOverrides((prev) => ({
      ...prev,
      [msgId]: { ...(prev[msgId] || {}), ...nextPatch },
    }));
  };

  // Live counts
  const counts = useMemo(() => {
    const active = normalizedMessages.filter((m) => !m.archived);
    return {
      total: active.length,
      unread: active.filter((m) => !m.read).length,
      read: active.filter((m) => m.read).length,
      notReplied: active.filter((m) => !m.replied).length,
      replied: active.filter((m) => m.replied).length,
      starred: normalizedMessages.filter((m) => m.starred).length,
      archived: normalizedMessages.filter((m) => m.archived).length,
      withAttachments: active.filter((m) => m.hasAttachment).length,
      byTag: {
        Lead: active.filter((m) => m.tag === 'Lead').length,
        Deal: active.filter((m) => m.tag === 'Deal').length,
        Contact: active.filter((m) => m.tag === 'Contact').length,
        Account: active.filter((m) => m.tag === 'Account').length,
      },
    };
  }, [normalizedMessages]);

  // Views dropdown matching Image 5 ("All Todays Messages") + Image 2 UI Model
  const views = useMemo(
    () => [
      { key: 'all', label: 'All Todays Messages', count: counts.total },
      { key: 'not_replied', label: 'Not Replied Messages', count: counts.notReplied },
      { key: 'replied', label: 'Replied Messages', count: counts.replied },
      { key: 'attachments', label: 'With Attachments', count: counts.withAttachments },
    ],
    [counts]
  );

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return normalizedMessages.filter((m) => {
      if (activeView === 'not_replied' && m.replied) return false;
      if (activeView === 'replied' && !m.replied) return false;
      if (activeView === 'attachments' && !m.hasAttachment) return false;

      if (systemFilter === 'Not Replied Messages' && m.replied) return false;
      if (systemFilter === 'Replied Messages' && !m.replied) return false;

      if (statusFilter === 'Not Read' && (m.read || m.archived)) return false;
      if (statusFilter === 'Read' && (!m.read || m.archived)) return false;
      if (statusFilter === 'Starred' && !m.starred) return false;
      if (statusFilter === 'Archived' && !m.archived) return false;
      if (statusFilter === 'All' && m.archived) return false;

      if (typeFilter !== 'All Types') {
        const targetTag = typeFilter.replace(' Messages', '');
        if (m.tag !== targetTag) return false;
      }

      if (ownerFilter !== 'All' && m.ownerName !== ownerFilter) return false;
      if (onlyWithAttachments && !m.hasAttachment) return false;

      return true;
    });
  }, [
    normalizedMessages,
    activeView,
    systemFilter,
    statusFilter,
    typeFilter,
    ownerFilter,
    onlyWithAttachments,
  ]);

  const table = useTable(filteredMessages, {
    searchKeys: ['sender', 'snippet', 'body', 'tag', 'ownerName'],
    initialSort: { key: 'sender', dir: 'asc' },
    pageSize: 10,
  });

  const handleOpenMessage = (msg) => {
    setViewingMsgId(msg.id);
    if (!msg.read) {
      markMessageRead?.(msg.id);
      updateMessageItem(msg.id, () => ({ read: true }));
    }
  };

  // Trigger file attach directly from table row
  const handleTriggerRowAttach = (msgId, e) => {
    e.stopPropagation();
    setRowAttachTargetId(msgId);
    if (rowFileInputRef.current) {
      rowFileInputRef.current.value = '';
      rowFileInputRef.current.click();
    }
  };

  const handleRowFilesSelected = (e) => {
    const newAtts = filesToAttachments(e.target.files, currentUser?.name || 'Sibi Chakaravarthi');
    if (newAtts.length > 0 && rowAttachTargetId) {
      addMessageAttachment?.(rowAttachTargetId, newAtts);
      updateMessageItem(rowAttachTargetId, (m) => ({
        attachments: [...(m.attachments || []), ...newAtts],
        hasAttachment: true,
      }));
      notify?.(`${newAtts.length} file(s) attached to message`, 'success');
    }
    setRowAttachTargetId(null);
  };

  // Attach files inside the Message Drawer
  const handleDrawerFilesSelected = (e) => {
    if (!viewingMessage) return;
    const newAtts = filesToAttachments(e.target.files, currentUser?.name || 'Sibi Chakaravarthi');
    if (newAtts.length > 0) {
      addMessageAttachment?.(viewingMessage.id, newAtts);
      updateMessageItem(viewingMessage.id, (m) => ({
        attachments: [...(m.attachments || []), ...newAtts],
        hasAttachment: true,
      }));
      notify?.(`${newAtts.length} attachment(s) added`, 'success');
    }
    e.target.value = '';
  };

  const handleRemoveAttachment = (msgId, attId) => {
    removeMessageAttachment?.(msgId, attId);
    updateMessageItem(msgId, (m) => {
      const next = (m.attachments || []).filter((a) => a.id !== attId);
      return { attachments: next, hasAttachment: next.length > 0 };
    });
    notify?.('Attachment removed', 'info');
  };

  // Attach files to Reply
  const handleReplyFilesSelected = (e) => {
    const newAtts = filesToAttachments(e.target.files, currentUser?.name || 'Sibi Chakaravarthi');
    if (newAtts.length > 0) {
      setReplyAttachments((prev) => [...prev, ...newAtts]);
    }
    e.target.value = '';
  };

  // Attach files in Compose Modal
  const handleComposeFilesSelected = (e) => {
    const newAtts = filesToAttachments(e.target.files, currentUser?.name || 'Sibi Chakaravarthi');
    if (newAtts.length > 0) {
      setComposeForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newAtts],
      }));
    }
    e.target.value = '';
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if ((!replyText.trim() && replyAttachments.length === 0) || !viewingMessage) return;
    const text = replyText.trim() || `Attached ${replyAttachments.length} file(s)`;
    replyMessage?.(viewingMessage.id, text, replyAttachments);
    updateMessageItem(viewingMessage.id, (m) => ({
      replied: true,
      repliedBy: currentUser?.name || 'Sibi Chakaravarthi',
      attachments: [...(m.attachments || []), ...replyAttachments],
      hasAttachment: (m.attachments?.length || 0) + replyAttachments.length > 0,
      replies: [
        ...(m.replies || []),
        {
          id: `rep-${Date.now()}`,
          author: currentUser?.name || 'Sibi Chakaravarthi',
          text,
          time: 'Just now',
          attachments: replyAttachments,
        },
      ],
    }));
    setReplyText('');
    setReplyAttachments([]);
    notify?.('Reply sent successfully', 'success');
  };

  const handleComposeSubmit = (e) => {
    e.preventDefault();
    if (!composeForm.recipient || !composeForm.snippet) return;
    sendMessage?.({
      sender: composeForm.recipient,
      tag: composeForm.tag,
      badge: composeForm.tag,
      snippet: composeForm.snippet,
      body: composeForm.body || composeForm.snippet,
      attachments: composeForm.attachments,
      hasAttachment: composeForm.attachments.length > 0,
      time: 'Just now',
      read: true,
    });
    setIsComposeOpen(false);
    setComposeForm({ recipient: '', tag: 'Lead', snippet: '', body: '', attachments: [] });
    notify?.('Message sent with attachments', 'success');
  };

  const columns = [
    {
      key: 'sender',
      header: 'Sender / Contact',
      render: (m) => {
        const initials = (m.sender || 'U')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0].toUpperCase())
          .join('');
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="w-9 h-9 rounded-full bg-indigo-50 text-primary font-semibold text-[13px] flex items-center justify-center border border-indigo-100">
                {initials || 'U'}
              </span>
              {!m.read && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-white"
                  title="Unread"
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[14px] ${
                    !m.read ? 'font-bold text-ink' : 'font-semibold text-primary'
                  } hover:underline`}
                >
                  {m.sender}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    TAG_COLORS[m.tag] || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {m.tag}
                </span>
              </div>
              <div className="text-[12px] text-ink-400">
                Owner: {m.ownerName || 'Sibi Chakaravarthi'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'snippet',
      header: 'Message',
      render: (m) => (
        <div className="max-w-[430px]">
          <div
            className={`text-[13.5px] truncate flex items-center gap-1.5 ${
              !m.read ? 'font-semibold text-ink' : 'text-ink-600'
            }`}
          >
            <Reply size={14} className="text-ink-400 shrink-0" />
            <span className="truncate">{m.snippet}</span>
          </div>
          {m.replies && m.replies.length > 0 && (
            <div className="text-[12px] text-emerald-600 font-medium mt-0.5">
              {m.replies.length} {m.replies.length === 1 ? 'reply' : 'replies'} in thread
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'attachments',
      header: 'Attachment Field',
      render: (m) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {m.attachments && m.attachments.length > 0 ? (
            <button
              type="button"
              onClick={() => handleOpenMessage(m)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-primary border border-blue-200 text-[12.5px] font-medium hover:bg-blue-100 transition-colors max-w-[200px]"
              title={m.attachments.map((a) => a.name).join(', ')}
            >
              <Paperclip size={13} className="shrink-0" />
              <span className="truncate">{m.attachments[0].name}</span>
              {m.attachments.length > 1 && (
                <span className="px-1.5 py-0.2 bg-white rounded text-[11px] font-bold">
                  +{m.attachments.length - 1}
                </span>
              )}
            </button>
          ) : (
            <span className="text-[12.5px] text-ink-400">No file</span>
          )}
          <button
            type="button"
            onClick={(e) => handleTriggerRowAttach(m.id, e)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-line bg-white hover:bg-page hover:border-primary text-[12px] font-semibold text-ink-600 hover:text-primary transition-colors"
            title="Attach file to this message"
          >
            <Paperclip size={12} /> + Attach
          </button>
        </div>
      ),
    },
    {
      key: 'time',
      header: 'Message Time',
      render: (m) => <span className="text-[13.5px] text-ink-500 font-medium">{m.time}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${
            m.replied
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              m.replied ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          {m.replied ? 'Replied' : 'Not Replied'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      align: 'right',
      render: (m) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              toggleStarMessage?.(m.id);
              updateMessageItem(m.id, (cur) => ({ starred: !cur.starred }));
            }}
            className="p-1.5 rounded hover:bg-page text-ink-400 hover:text-amber-500"
            title="Star Message"
          >
            <Star size={15} className={m.starred ? 'fill-amber-400 text-amber-400' : ''} />
          </button>
          <button
            type="button"
            onClick={() => {
              archiveMessage?.(m.id);
              updateMessageItem(m.id, () => ({ archived: true }));
            }}
            className="p-1.5 rounded hover:bg-page text-ink-400 hover:text-ink"
            title="Archive Message"
          >
            <Archive size={15} />
          </button>
        </div>
      ),
    },
  ];

  const activeFilterCount =
    (systemFilter !== 'All' ? 1 : 0) +
    (statusFilter !== 'All' ? 1 : 0) +
    (typeFilter !== 'All Types' ? 1 : 0) +
    (ownerFilter !== 'All' ? 1 : 0) +
    (onlyWithAttachments ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Hidden input for direct row attachment */}
      <input
        ref={rowFileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleRowFilesSelected}
      />

      {/* Page Header (Image 2 Deals.jsx UI Model + Image 5 "All Todays Messages") */}
      <PageHeader
        views={views}
        activeView={activeView}
        onViewChange={setActiveView}
        primary={{
          label: 'Compose Message',
          icon: Plus,
          onClick: () => setIsComposeOpen(true),
        }}
        toolbar={{
          search: table.search,
          onSearch: table.setSearch,
          view,
          onView: setView,
          enabledViews: ['list', 'grid'],
          onFilter: () => setShowFilters((s) => !s),
          filterCount: activeFilterCount,
          onSort: () => table.toggleSort('sender'),
          onRefresh: () => {},
        }}
      />

      {/* 5 StatCards Row (Image 2 UI Model) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="All Todays Messages"
          value={counts.total}
          trend={{ up: true, value: '+8.4%' }}
          tone="violet"
          icon={MessageSquare}
          spark={[18, 22, 25, 24, 29, 34, counts.total]}
        />
        <StatCard
          label="Not Replied Messages"
          value={counts.notReplied}
          trend={{ up: false, value: '-4.1%' }}
          tone="amber"
          icon={Mail}
          spark={[14, 12, 11, 13, 9, 8, counts.notReplied]}
        />
        <StatCard
          label="Replied Messages"
          value={counts.replied}
          trend={{ up: true, value: '+9.8%' }}
          tone="green"
          icon={CheckCircle2}
          spark={[5, 7, 9, 10, 12, 15, counts.replied]}
        />
        <StatCard
          label="With Attachments"
          value={counts.withAttachments}
          trend={{ up: true, value: '+12.6%' }}
          tone="blue"
          icon={Paperclip}
          spark={[4, 6, 8, 9, 11, 14, counts.withAttachments]}
        />
        <StatCard
          label="Starred Threads"
          value={counts.starred}
          trend={{ up: true, value: '+5.2%' }}
          tone="violet"
          icon={Star}
          spark={[2, 3, 4, 4, 5, 6, counts.starred]}
        />
      </div>

      {/* Main Split View: Left Filter Sidebar (Image 5 Zoho CRM Filters) + Right Table */}
      <div className="flex gap-4 items-start">
        {showFilters && (
          <aside className="w-[260px] shrink-0 bg-white border border-line rounded-xl p-4 shadow-card select-none">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-ink">Filter Messages by</h3>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSystemFilter('All');
                    setStatusFilter('All');
                    setTypeFilter('All Types');
                    setOwnerFilter('All');
                    setOnlyWithAttachments(false);
                  }}
                  className="text-[12px] text-primary font-semibold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search"
                className="w-full h-9 pl-8 pr-3 bg-white border border-line rounded-lg text-[13px] placeholder:text-ink-400 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto thin-scroll pr-1">
              {/* System Defined Filters (Matches Image 5: Not Replied Messages, Replied Messages) */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenSections((s) => ({ ...s, system: !s.system }))}
                  className="flex items-center gap-1 text-[13px] font-bold text-ink w-full text-left mb-2"
                >
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${openSections.system ? '' : '-rotate-90'}`}
                  />
                  <span>System Defined Filters</span>
                </button>
                {openSections.system && (
                  <div className="space-y-1.5 pl-1">
                    {[
                      { label: 'Not Replied Messages', count: counts.notReplied },
                      { label: 'Replied Messages', count: counts.replied },
                    ]
                      .filter(
                        (i) =>
                          !filterSearch ||
                          i.label.toLowerCase().includes(filterSearch.toLowerCase())
                      )
                      .map((item) => (
                        <label
                          key={item.label}
                          className="flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-page cursor-pointer text-[13.5px] text-ink-600"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={systemFilter === item.label}
                              onChange={() =>
                                setSystemFilter(systemFilter === item.label ? 'All' : item.label)
                              }
                              className="rounded border-ink-300 text-primary focus:ring-primary"
                            />
                            <span
                              className={
                                systemFilter === item.label ? 'font-semibold text-primary' : ''
                              }
                            >
                              {item.label}
                            </span>
                          </div>
                          <span className="text-[12px] text-ink-400 font-medium">{item.count}</span>
                        </label>
                      ))}
                  </div>
                )}
              </div>

              <hr className="border-line" />

              {/* Filter By Fields (Matches Image 5: Message Time, Notifications, Record Owner, Replied By, Has Attachment) */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenSections((s) => ({ ...s, fields: !s.fields }))}
                  className="flex items-center gap-1 text-[13px] font-bold text-ink w-full text-left mb-2"
                >
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${openSections.fields ? '' : '-rotate-90'}`}
                  />
                  <span>Filter By Fields</span>
                </button>
                {openSections.fields && (
                  <div className="space-y-1.5 pl-1">
                    <label className="flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-page cursor-pointer text-[13.5px] text-ink-600">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={onlyWithAttachments}
                          onChange={(e) => setOnlyWithAttachments(e.target.checked)}
                          className="rounded border-ink-300 text-primary focus:ring-primary"
                        />
                        <span className={onlyWithAttachments ? 'font-semibold text-primary' : ''}>
                          Has Attachment
                        </span>
                      </div>
                      <span className="text-[12px] text-ink-400 font-medium">
                        {counts.withAttachments}
                      </span>
                    </label>

                    <label className="flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-page cursor-pointer text-[13.5px] text-ink-600">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={statusFilter === 'Not Read'}
                          onChange={() =>
                            setStatusFilter(statusFilter === 'Not Read' ? 'All' : 'Not Read')
                          }
                          className="rounded border-ink-300 text-primary focus:ring-primary"
                        />
                        <span
                          className={statusFilter === 'Not Read' ? 'font-semibold text-primary' : ''}
                        >
                          Notifications (Unread)
                        </span>
                      </div>
                      <span className="text-[12px] text-ink-400 font-medium">{counts.unread}</span>
                    </label>

                    <label className="flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-page cursor-pointer text-[13.5px] text-ink-600">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={ownerFilter === 'Sibi Chakaravarthi'}
                          onChange={() =>
                            setOwnerFilter(
                              ownerFilter === 'Sibi Chakaravarthi' ? 'All' : 'Sibi Chakaravarthi'
                            )
                          }
                          className="rounded border-ink-300 text-primary focus:ring-primary"
                        />
                        <span
                          className={
                            ownerFilter === 'Sibi Chakaravarthi' ? 'font-semibold text-primary' : ''
                          }
                        >
                          Record Owner (Sibi)
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-page cursor-pointer text-[13.5px] text-ink-600">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={statusFilter === 'Starred'}
                          onChange={() =>
                            setStatusFilter(statusFilter === 'Starred' ? 'All' : 'Starred')
                          }
                          className="rounded border-ink-300 text-primary focus:ring-primary"
                        />
                        <span
                          className={statusFilter === 'Starred' ? 'font-semibold text-primary' : ''}
                        >
                          Message Time (Recent)
                        </span>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <hr className="border-line" />

              {/* Message Type */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenSections((s) => ({ ...s, type: !s.type }))}
                  className="flex items-center gap-1 text-[13px] font-bold text-ink w-full text-left mb-2"
                >
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${openSections.type ? '' : '-rotate-90'}`}
                  />
                  <span>Module Type</span>
                </button>
                {openSections.type && (
                  <div className="space-y-1.5 pl-1">
                    {[
                      { label: 'All Types', key: 'All Types', count: counts.total },
                      { label: 'Lead Messages', key: 'Lead Messages', count: counts.byTag.Lead },
                      { label: 'Deal Messages', key: 'Deal Messages', count: counts.byTag.Deal },
                      {
                        label: 'Contact Messages',
                        key: 'Contact Messages',
                        count: counts.byTag.Contact,
                      },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-page cursor-pointer text-[13.5px] text-ink-600"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={typeFilter === item.key}
                            onChange={() =>
                              setTypeFilter(typeFilter === item.key ? 'All Types' : item.key)
                            }
                            className="rounded border-ink-300 text-primary focus:ring-primary"
                          />
                          <span
                            className={typeFilter === item.key ? 'font-semibold text-primary' : ''}
                          >
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[12px] text-ink-400 font-medium">{item.count}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Right Messages Table / Grid */}
        <div className="flex-1 min-w-0">
          {view === 'list' && (
            <div className="card overflow-hidden">
              <DataTable
                columns={columns}
                rows={table.pageRows}
                table={table}
                onRowClick={handleOpenMessage}
              />
              <Pagination table={table} />
            </div>
          )}

          {view === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {table.pageRows.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleOpenMessage(m)}
                  className="card p-4 card-hover cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[14.5px] font-bold text-ink truncate">{m.sender}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11.5px] font-semibold border ${
                          TAG_COLORS[m.tag] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.tag}
                      </span>
                    </div>
                    <p className="text-[13.5px] text-ink-600 line-clamp-2 mb-3">{m.snippet}</p>
                  </div>
                  <div className="pt-3 border-t border-line flex items-center justify-between text-[12.5px]">
                    <span className="text-ink-400">{m.time}</span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {m.attachments?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-primary font-semibold">
                          <Paperclip size={13} /> {m.attachments.length}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleTriggerRowAttach(m.id, e)}
                        className="px-2 py-1 rounded border border-line hover:border-primary text-[12px] text-ink-600 hover:text-primary"
                      >
                        + Attach
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Viewer, Attachment Manager & Reply Drawer */}
      {viewingMessage && (
        <Drawer
          open={!!viewingMessage}
          onClose={() => setViewingMsgId(null)}
          title={`Message from ${viewingMessage.sender}`}
          subtitle={`Module: ${viewingMessage.tag || 'Lead'} • ${viewingMessage.time}`}
        >
          <div className="space-y-6">
            {/* Sender Header */}
            <div className="flex items-center justify-between p-4 bg-page rounded-xl border border-line">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-indigo-100 text-primary font-bold text-[15px] flex items-center justify-center">
                  {(viewingMessage.sender || 'U')[0]}
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-ink">{viewingMessage.sender}</h4>
                  <span
                    className={`inline-block mt-0.5 px-2.5 py-0.5 rounded text-[11.5px] font-semibold border ${
                      TAG_COLORS[viewingMessage.tag] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {viewingMessage.tag || 'Lead'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toggleStarMessage?.(viewingMessage.id);
                    updateMessageItem(viewingMessage.id, (cur) => ({ starred: !cur.starred }));
                  }}
                  className="p-2 text-ink-400 hover:text-amber-500 rounded-lg border border-line bg-white"
                  title="Star"
                >
                  <Star
                    size={16}
                    className={viewingMessage.starred ? 'fill-amber-400 text-amber-400' : ''}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    archiveMessage?.(viewingMessage.id);
                    updateMessageItem(viewingMessage.id, () => ({ archived: true }));
                    setViewingMsgId(null);
                  }}
                  className="p-2 text-ink-400 hover:text-ink rounded-lg border border-line bg-white"
                  title="Archive"
                >
                  <Archive size={16} />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <SectionTitle>Message Content</SectionTitle>
              <div className="p-4 bg-white border border-line rounded-xl text-[14px] text-ink leading-relaxed shadow-sm">
                {viewingMessage.body || viewingMessage.snippet}
              </div>
            </div>

            {/* Dedicated Attachments Section with Real File Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionTitle>
                  Attachments ({(viewingMessage.attachments || []).length})
                </SectionTitle>
                <div>
                  <input
                    ref={drawerFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleDrawerFilesSelected}
                  />
                  <button
                    type="button"
                    onClick={() => drawerFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover text-[13px] font-semibold shadow-sm transition"
                  >
                    <Paperclip size={14} />
                    <span>Attach File</span>
                  </button>
                </div>
              </div>

              {(!viewingMessage.attachments || viewingMessage.attachments.length === 0) ? (
                <div
                  onClick={() => drawerFileInputRef.current?.click()}
                  className="border-2 border-dashed border-line hover:border-primary rounded-xl p-5 text-center cursor-pointer bg-page/40 hover:bg-blue-50/30 transition"
                >
                  <Upload size={22} className="mx-auto text-primary mb-1.5" />
                  <p className="text-[13.5px] font-medium text-ink">
                    Click to attach files to this message
                  </p>
                  <p className="text-[12px] text-ink-400 mt-0.5">
                    Supports PDF, Word, Excel, Images, ZIP (Up to 20 MB)
                  </p>
                </div>
              ) : (
                <div className="border border-line rounded-xl divide-y divide-line bg-white overflow-hidden">
                  {viewingMessage.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between px-3.5 py-2.5 hover:bg-page/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <a
                            href={att.url || '#'}
                            download={att.name}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[13.5px] font-semibold text-primary hover:underline block truncate"
                          >
                            {att.name}
                          </a>
                          <div className="text-[12px] text-ink-400">
                            {att.size} • Added by {att.uploadedBy || 'User'} •{' '}
                            {att.uploadedAt || 'Just now'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {att.url && att.url !== '#' && (
                          <a
                            href={att.url}
                            download={att.name}
                            className="p-1.5 text-ink-500 hover:text-primary rounded hover:bg-page"
                            title="Download"
                          >
                            <Download size={15} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(viewingMessage.id, att.id)}
                          className="p-1.5 text-ink-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Remove attachment"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thread History */}
            {viewingMessage.replies && viewingMessage.replies.length > 0 && (
              <div className="space-y-2.5">
                <SectionTitle>Thread Replies ({viewingMessage.replies.length})</SectionTitle>
                <div className="space-y-2.5">
                  {viewingMessage.replies.map((rep, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-xl text-[13.5px]"
                    >
                      <div className="flex justify-between text-[12px] text-ink-500 mb-1">
                        <span className="font-semibold text-primary">{rep.author}</span>
                        <span>{rep.time}</span>
                      </div>
                      <p className="text-ink">{rep.text}</p>
                      {rep.attachments && rep.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {rep.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.url || '#'}
                              download={att.name}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-blue-200 text-[12px] font-medium text-primary hover:underline"
                            >
                              <Paperclip size={12} />
                              <span>{att.name}</span>
                              <span className="text-ink-400">({att.size})</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Composer with Attachment Picker */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-4 border-t border-line">
              <SectionTitle>Send Reply</SectionTitle>
              <textarea
                rows={3}
                placeholder="Type your response to customer..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[13.5px] border border-line rounded-xl focus:outline-none focus:border-primary"
              />

              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {replyAttachments.map((att) => (
                    <span
                      key={att.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[12.5px] text-primary font-medium"
                    >
                      <Paperclip size={12} />
                      <span className="truncate max-w-[180px]">{att.name}</span>
                      <span className="text-[11px] text-ink-400">({att.size})</span>
                      <button
                        type="button"
                        onClick={() =>
                          setReplyAttachments((prev) => prev.filter((x) => x.id !== att.id))
                        }
                        className="text-ink-400 hover:text-rose-600"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div>
                  <input
                    ref={replyFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleReplyFilesSelected}
                  />
                  <button
                    type="button"
                    onClick={() => replyFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-line rounded-lg text-[13px] font-medium text-ink-600 hover:border-primary hover:text-primary bg-white transition"
                  >
                    <Paperclip size={14} />
                    <span>Attach Files</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white hover:bg-primary-hover text-[13.5px] font-semibold rounded-lg shadow-sm transition"
                >
                  <Send size={14} />
                  <span>Send Reply</span>
                </button>
              </div>
            </form>
          </div>
        </Drawer>
      )}

      {/* Compose Message Modal with Real Attachment Field */}
      <Modal
        open={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Compose CRM Message"
        subtitle="Send a message with file attachments to a Lead, Contact, Deal, or Account"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsComposeOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" form="compose-msg-form" className="btn-primary">
              <Send size={14} /> Send Message
            </button>
          </>
        }
      >
        <form id="compose-msg-form" onSubmit={handleComposeSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="label">Recipient Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. VIKRAM"
                value={composeForm.recipient}
                onChange={(e) => setComposeForm({ ...composeForm, recipient: e.target.value })}
                className="input text-[13.5px]"
              />
            </div>

            <div>
              <label className="label">Module / Type</label>
              <select
                value={composeForm.tag}
                onChange={(e) => setComposeForm({ ...composeForm, tag: e.target.value })}
                className="input text-[13.5px]"
              >
                <option value="Lead">Lead</option>
                <option value="Contact">Contact</option>
                <option value="Deal">Deal</option>
                <option value="Account">Account</option>
                <option value="Customer">Customer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Subject / Summary *</label>
            <input
              type="text"
              required
              placeholder="e.g. Follow-up on quotation & product brochure"
              value={composeForm.snippet}
              onChange={(e) => setComposeForm({ ...composeForm, snippet: e.target.value })}
              className="input text-[13.5px]"
            />
          </div>

          <div>
            <label className="label">Message Content</label>
            <textarea
              rows={3}
              placeholder="Enter detailed message text..."
              value={composeForm.body}
              onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
              className="input !h-auto py-2.5 text-[13.5px]"
            />
          </div>

          {/* Attachment Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label !mb-0">Attachment Field</label>
              <button
                type="button"
                onClick={() => composeFileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
              >
                <Paperclip size={13} /> Browse Files
              </button>
            </div>
            <input
              ref={composeFileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleComposeFilesSelected}
            />
            <div
              onClick={() => composeFileInputRef.current?.click()}
              className="border-2 border-dashed border-line hover:border-primary rounded-xl p-4 text-center cursor-pointer bg-page/40 hover:bg-blue-50/30 transition"
            >
              <Upload size={20} className="mx-auto text-primary mb-1" />
              <div className="text-[13.5px] font-medium text-ink">
                Click to attach files or documents
              </div>
              <div className="text-[12px] text-ink-400">
                Attach proposals, quotations, screenshots, or PDFs
              </div>
            </div>

            {composeForm.attachments.length > 0 && (
              <div className="mt-2.5 border border-line rounded-xl divide-y divide-line bg-white">
                {composeForm.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between px-3 py-2 text-[13px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={14} className="text-primary shrink-0" />
                      <span className="font-medium text-ink truncate">{att.name}</span>
                      <span className="text-ink-400 text-[12px] shrink-0">({att.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setComposeForm((prev) => ({
                          ...prev,
                          attachments: prev.attachments.filter((x) => x.id !== att.id),
                        }))
                      }
                      className="text-ink-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
