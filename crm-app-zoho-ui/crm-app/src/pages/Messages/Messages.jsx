import { useMemo, useState } from 'react';
import {
  MessageSquare, Mail, Paperclip, Reply, Star, Archive, Trash2,
  Search, ChevronDown, ChevronLeft, ChevronRight, Send, Plus,
  MoreHorizontal, CheckCircle2, Clock, User, Filter, Eye, Check
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';

const TAG_COLORS = {
  Lead: 'bg-blue-50 text-blue-700 border-blue-200',
  Contact: 'bg-purple-50 text-purple-700 border-purple-200',
  Deal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Account: 'bg-amber-50 text-amber-700 border-amber-200',
  Customer: 'bg-teal-50 text-teal-700 border-teal-200',
  Internal: 'bg-slate-100 text-slate-700 border-slate-200'
};

export default function Messages() {
  const crm = useCRM();
  const {
    messages = [],
    sendMessage,
    replyMessage,
    toggleStarMessage,
    archiveMessage,
    markMessageRead,
    notify
  } = crm;

  const [mainFilter, setMainFilter] = useState('All Messages');
  const [statusFilter, setStatusFilter] = useState('All'); // 'Not Read', 'Read', 'Starred', 'Archived'
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Message Time');
  const [sortOrder, setSortOrder] = useState('Desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Drawers
  const [viewingMessage, setViewingMessage] = useState(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Compose form
  const [composeForm, setComposeForm] = useState({
    recipient: '',
    tag: 'Lead',
    snippet: '',
    body: ''
  });

  // Calculate badge counts
  const unreadCount = useMemo(() => messages.filter((m) => !m.read && !m.archived).length || 12, [messages]);
  const readCount = useMemo(() => messages.filter((m) => m.read && !m.archived).length || 48, [messages]);
  const starredCount = useMemo(() => messages.filter((m) => m.starred).length || 5, [messages]);
  const archivedCount = useMemo(() => messages.filter((m) => m.archived).length || 3, [messages]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (statusFilter === 'Not Read' && m.read) return false;
      if (statusFilter === 'Read' && !m.read) return false;
      if (statusFilter === 'Starred' && !m.starred) return false;
      if (statusFilter === 'Archived' && !m.archived) return false;
      if (statusFilter !== 'Archived' && m.archived) return false;

      if (typeFilter !== 'All Types') {
        const targetTag = typeFilter.replace(' Messages', '');
        if (m.tag !== targetTag) return false;
      }

      if (search) {
        const q = search.toLowerCase();
        const snd = (m.sender || '').toLowerCase();
        const snp = (m.snippet || '').toLowerCase();
        if (!snd.includes(q) && !snp.includes(q)) return false;
      }

      return true;
    });
  }, [messages, statusFilter, typeFilter, search]);

  const paginatedMessages = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMessages.slice(start, start + pageSize);
  }, [filteredMessages, page, pageSize]);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleOpenMessage = (msg) => {
    setViewingMessage(msg);
    if (!msg.read) markMessageRead(msg.id);
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !viewingMessage) return;
    replyMessage(viewingMessage.id, replyText);
    setReplyText('');
    notify('Reply sent successfully via CRM communication bridge', 'success');
  };

  const handleComposeSubmit = (e) => {
    e.preventDefault();
    if (!composeForm.recipient || !composeForm.snippet) return;
    sendMessage({
      sender: composeForm.recipient,
      tag: composeForm.tag,
      snippet: composeForm.snippet,
      body: composeForm.body || composeForm.snippet,
      time: 'Just now',
      read: true
    });
    setIsComposeOpen(false);
    setComposeForm({ recipient: '', tag: 'Lead', snippet: '', body: '' });
    notify('Message sent', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2F7BF5] flex items-center justify-center font-semibold shadow-inner">
            <MessageSquare size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Messages</h1>
            <p className="text-sm text-slate-500">
              Customer communications and automated workflow notifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2F7BF5] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Plus size={15} />
            <span>Compose Message</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Filter Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Filter Messages by</h2>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
              />
            </div>

            {/* Message Status Section */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ChevronDown size={12} />
                Message Status
              </span>
              <div className="space-y-1 pl-2 text-xs">
                {[
                  { label: 'Not Read', count: unreadCount, key: 'Not Read' },
                  { label: 'Read', count: readCount, key: 'Read' },
                  { label: 'Starred', count: starredCount, key: 'Starred' },
                  { label: 'Archived', count: archivedCount, key: 'Archived' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={statusFilter === item.key}
                        onChange={() => setStatusFilter(statusFilter === item.key ? 'All' : item.key)}
                        className="rounded text-[#2F7BF5] focus:ring-[#2F7BF5]"
                      />
                      <span className={statusFilter === item.key ? 'font-semibold text-[#2F7BF5]' : ''}>
                        {item.label}
                      </span>
                    </div>
                    <span className="text-slate-400 font-medium text-[11px]">{item.count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Message Type Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ChevronDown size={12} />
                Message Type
              </span>
              <div className="space-y-1 pl-2 text-xs">
                {[
                  { label: 'All Types', count: 63, key: 'All Types' },
                  { label: 'Lead Messages', count: 18, key: 'Lead Messages' },
                  { label: 'Deal Messages', count: 14, key: 'Deal Messages' },
                  { label: 'Customer Messages', count: 22, key: 'Customer Messages' },
                  { label: 'Internal Messages', count: 9, key: 'Internal Messages' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={typeFilter === item.key}
                        onChange={() => setTypeFilter(typeFilter === item.key ? 'All Types' : item.key)}
                        className="rounded text-[#2F7BF5] focus:ring-[#2F7BF5]"
                      />
                      <span className={typeFilter === item.key ? 'font-semibold text-[#2F7BF5]' : ''}>
                        {item.label}
                      </span>
                    </div>
                    <span className="text-slate-400 font-medium text-[11px]">{item.count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter By Fields */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ChevronDown size={12} />
                Filter By Fields
              </span>
              <div className="space-y-1 pl-2 text-xs text-slate-600">
                {['Message Time', 'Sender', 'Department', 'Related To', 'Tags'].map((field) => (
                  <label key={field} className="flex items-center gap-2 py-1 px-2 hover:bg-slate-50 rounded cursor-pointer">
                    <input type="checkbox" className="rounded text-[#2F7BF5] focus:ring-[#2F7BF5]" />
                    <span>{field}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Messages Area (9 cols) */}
        <div className="lg:col-span-9 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <select
                value={mainFilter}
                onChange={(e) => setMainFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="All Messages">All Messages</option>
                <option value="Unread">Unread Messages</option>
                <option value="Starred">Starred Messages</option>
              </select>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <span>Sort By:</span>
                <span className="font-semibold text-slate-800">{sortBy}</span>
              </div>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'Desc' ? 'Asc' : 'Desc')}
                className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200"
              >
                <span>{sortOrder}</span>
                <ChevronDown size={12} />
              </button>
            </div>
          </div>

          {/* Messages Rows List */}
          <div className="divide-y divide-slate-100">
            {paginatedMessages.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No messages found matching criteria.
              </div>
            ) : (
              paginatedMessages.map((msg) => {
                const isSelected = selectedIds.has(msg.id);
                const initials = (msg.sender || 'User')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0].toUpperCase())
                  .join('');

                return (
                  <div
                    key={msg.id}
                    className={`flex items-center justify-between py-3 px-2 hover:bg-slate-50 transition cursor-pointer rounded-xl group ${
                      !msg.read ? 'bg-blue-50/20 font-medium' : ''
                    } ${isSelected ? 'bg-blue-50/50' : ''}`}
                    onClick={() => handleOpenMessage(msg)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(msg.id)}
                          className="rounded text-[#2F7BF5] focus:ring-[#2F7BF5]"
                        />
                      </div>

                      {/* Avatar */}
                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-[#2F7BF5] font-semibold text-xs flex items-center justify-center flex-shrink-0">
                        {initials || 'U'}
                      </span>

                      {/* Sender Name */}
                      <div className="w-28 flex-shrink-0">
                        <span className="text-xs font-semibold text-[#2F7BF5] hover:underline block truncate">
                          {msg.sender}
                        </span>
                      </div>

                      {/* Tag Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 ${TAG_COLORS[msg.tag] || 'bg-slate-100 text-slate-700'}`}>
                        {msg.tag}
                      </span>

                      {/* Icons & Snippet */}
                      <div className="flex items-center gap-2 min-w-0 flex-1 text-xs text-slate-600 truncate pl-2">
                        <Reply size={13} className="text-slate-400 flex-shrink-0" />
                        {msg.hasAttachment && (
                          <Paperclip size={13} className="text-slate-400 flex-shrink-0" />
                        )}
                        <span className="truncate">{msg.snippet}</span>
                      </div>
                    </div>

                    {/* Right Time & Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0 text-xs text-slate-400 ml-3">
                      <span className="whitespace-nowrap font-medium text-slate-500">{msg.time}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleStarMessage(msg.id)}
                          className="p-1 hover:text-amber-500 rounded"
                        >
                          <Star size={14} className={msg.starred ? 'fill-amber-400 text-amber-400' : ''} />
                        </button>
                        <button
                          type="button"
                          onClick={() => archiveMessage(msg.id)}
                          className="p-1 hover:text-slate-700 rounded"
                        >
                          <Archive size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Total Count: <span className="font-semibold text-slate-800">{filteredMessages.length}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded border border-slate-200"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-medium text-slate-800">{page} to {Math.ceil(filteredMessages.length / pageSize) || 1}</span>
                <button
                  type="button"
                  disabled={page * pageSize >= filteredMessages.length}
                  onClick={() => setPage(page + 1)}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded border border-slate-200"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Viewer & Reply Drawer */}
      {viewingMessage && (
        <Drawer
          open={!!viewingMessage}
          onClose={() => setViewingMessage(null)}
          title={`Message from ${viewingMessage.sender}`}
          subtitle={`Type: ${viewingMessage.tag} • Received ${viewingMessage.time}`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#2F7BF5] font-bold text-sm flex items-center justify-center">
                  {(viewingMessage.sender || 'U')[0]}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{viewingMessage.sender}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${TAG_COLORS[viewingMessage.tag] || 'bg-slate-100 text-slate-700'}`}>
                    {viewingMessage.tag}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleStarMessage(viewingMessage.id)}
                  className="p-2 text-slate-400 hover:text-amber-500 rounded-xl border border-slate-200 bg-white"
                >
                  <Star size={15} className={viewingMessage.starred ? 'fill-amber-400 text-amber-400' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    archiveMessage(viewingMessage.id);
                    setViewingMessage(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl border border-slate-200 bg-white"
                >
                  <Archive size={15} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <SectionTitle>Message Body</SectionTitle>
              <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed shadow-sm">
                {viewingMessage.body || viewingMessage.snippet}
              </div>
            </div>

            {/* Previous Replies in thread if any */}
            {viewingMessage.replies && viewingMessage.replies.length > 0 && (
              <div className="space-y-2">
                <SectionTitle>Thread History</SectionTitle>
                <div className="space-y-2">
                  {viewingMessage.replies.map((rep, i) => (
                    <div key={i} className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl text-xs">
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-semibold text-[#2F7BF5]">{rep.author}</span>
                        <span>{rep.time}</span>
                      </div>
                      <p className="text-slate-700">{rep.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Composer */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t border-slate-200">
              <SectionTitle>Send Reply</SectionTitle>
              <textarea
                rows={3}
                required
                placeholder="Type your response to customer..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2F7BF5] text-white hover:bg-blue-600 text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  <Send size={13} />
                  <span>Send Reply</span>
                </button>
              </div>
            </form>
          </div>
        </Drawer>
      )}

      {/* Compose Message Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Compose CRM Message</h3>
            <p className="text-xs text-slate-500 mb-4">Send a message to a customer, lead, or account.</p>

            <form onSubmit={handleComposeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Recipient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arun Kumar"
                  value={composeForm.recipient}
                  onChange={(e) => setComposeForm({ ...composeForm, recipient: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Recipient Type</label>
                <select
                  value={composeForm.tag}
                  onChange={(e) => setComposeForm({ ...composeForm, tag: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                >
                  <option value="Lead">Lead</option>
                  <option value="Contact">Contact</option>
                  <option value="Deal">Deal</option>
                  <option value="Account">Account</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Subject / Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow-up on product quotation request"
                  value={composeForm.snippet}
                  onChange={(e) => setComposeForm({ ...composeForm, snippet: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Message Content</label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed message text..."
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#2F7BF5] text-white hover:bg-blue-600 rounded-xl shadow-sm"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
