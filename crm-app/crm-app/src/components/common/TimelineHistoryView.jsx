import React, { useState, useMemo } from 'react';
import {
  Filter, ChevronDown, ChevronUp, Clock, Calendar, Check, X,
  Briefcase, Edit3, Phone, FileText, Receipt, ArrowRight,
  User, RefreshCw, Layers, ShieldCheck, Zap
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { fmtDate, fmtTime, fmtINR } from '../../utils/calculations';

/**
 * TimelineHistoryFilterBar Component
 * 4 Dropdowns (Modules, Users, Time, Sources) + Custom Date Range + Apply / Clear buttons
 */
export function TimelineHistoryFilterBar({
  users = [],
  filterModule,
  setFilterModule,
  filterUser,
  setFilterUser,
  filterTime,
  setFilterTime,
  filterSource,
  setFilterSource,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  onApply,
  onClear,
  isFilterActive
}) {
  return (
    <div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
        {/* Modules Dropdown */}
        <div>
          <label className="block text-[11.5px] font-bold text-slate-500 mb-1 tracking-wide">Modules</label>
          <div className="relative">
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full h-9 pl-3 pr-8 text-[13px] bg-white border border-slate-300 rounded-md outline-none focus:border-primary text-slate-700 appearance-none cursor-pointer"
            >
              <option value="All Modules">All Modules</option>
              <option value="Deals">Deals</option>
              <option value="Calls">Calls</option>
              <option value="Zoho Finance">Zoho Finance</option>
              <option value="Notes">Notes</option>
              <option value="Tasks">Tasks</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Users Dropdown */}
        <div>
          <label className="block text-[11.5px] font-bold text-slate-500 mb-1 tracking-wide">Users</label>
          <div className="relative">
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full h-9 pl-3 pr-8 text-[13px] bg-white border border-slate-300 rounded-md outline-none focus:border-primary text-slate-700 appearance-none cursor-pointer"
            >
              <option value="All Users">All Users</option>
              <option value="Arun Kumar">Arun Kumar</option>
              <option value="Marketing Department">Marketing Department</option>
              <option value="System Admin">System Admin</option>
              <option value="System Automation">System Automation</option>
              {users && users.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Time Dropdown */}
        <div>
          <label className="block text-[11.5px] font-bold text-slate-500 mb-1 tracking-wide">Time</label>
          <div className="relative">
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="w-full h-9 pl-3 pr-8 text-[13px] bg-white border border-slate-300 rounded-md outline-none focus:border-primary text-slate-700 appearance-none cursor-pointer"
            >
              <option value="Any Time">Any Time</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
              <option value="Custom Date Range...">Custom Date Range...</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Sources Dropdown */}
        <div>
          <label className="block text-[11.5px] font-bold text-slate-500 mb-1 tracking-wide">Sources</label>
          <div className="relative">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full h-9 pl-3 pr-8 text-[13px] bg-white border border-slate-300 rounded-md outline-none focus:border-primary text-slate-700 appearance-none cursor-pointer"
            >
              <option value="All Sources">All Sources</option>
              <option value="Workflow Rule">Workflow Rule</option>
              <option value="Direct Edit">Direct Edit</option>
              <option value="System Automation">System Automation</option>
              <option value="Manual Entry">Manual Entry</option>
              <option value="Web Form">Web Form</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Custom Date Range Pickers (shown when Custom Date Range is selected) */}
      {filterTime === 'Custom Date Range...' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11.5px] font-bold text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full h-8 px-2.5 text-[12.5px] border border-slate-300 rounded-md outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-bold text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full h-8 px-2.5 text-[12.5px] border border-slate-300 rounded-md outline-none focus:border-primary"
            />
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center justify-end gap-2.5 mt-3 pt-3 border-t border-slate-100">
        {isFilterActive && (
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-1.5 text-[12.5px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition-colors"
          >
            Clear Filters
          </button>
        )}
        <button
          type="button"
          onClick={onApply}
          className="px-4 py-1.5 text-[12.5px] font-semibold text-white bg-[#7C8BF5] hover:bg-[#6879EC] rounded shadow-2xs cursor-pointer transition-colors"
        >
          Apply Filter
        </button>
      </div>
    </div>
  );
}

/**
 * TimelineHistoryView Component
 * Matches Zoho CRM reference screenshot exactly:
 * - History tab bar
 * - Timeline History heading with funnel toggle [ Y ]
 * - Collapsible "Show Upcoming Automated Actions"
 * - 4 Dropdowns filter bar: Modules, Users, Time, Sources + Apply Filter + Clear Filters
 * - Custom Date Range picker when selected
 * - Date grouping tags (e.g. 12/10/2026)
 * - Chronological timeline nodes with specific icons:
 *   - Workflow rules & functions (Briefcase)
 *   - Field / Stage / Score updates (Edit3/Pencil)
 *   - Logged calls (Phone)
 *   - Notes (FileText)
 *   - Invoices / Financial transactions (Receipt)
 * - Stage badge transitions and metadata details
 */
export default function TimelineHistoryView({
  module = 'Deals',
  record = null,
  records = [],
  customEvents = null
}) {
  const { users, userName, calls, invoices, deals } = useCRM();

  // Filter States
  const [filterModule, setFilterModule] = useState('All Modules');
  const [filterUser, setFilterUser] = useState('All Users');
  const [filterTime, setFilterTime] = useState('Any Time');
  const [filterSource, setFilterSource] = useState('All Sources');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Applied filter state (applied when clicking "Apply Filter")
  const [appliedFilters, setAppliedFilters] = useState({
    module: 'All Modules',
    user: 'All Users',
    time: 'Any Time',
    source: 'All Sources',
    startDate: '',
    endDate: ''
  });

  const [filterBarOpen, setFilterBarOpen] = useState(true);
  const [upcomingActionsOpen, setUpcomingActionsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generate Base Timeline Events
  const rawEvents = useMemo(() => {
    if (customEvents) return customEvents;

    const events = [];
    const todayStr = '12/10/2026';

    if (module === 'Deals' && record) {
      // 1. Workflow Rule action (matching screenshot)
      events.push({
        id: 'ev-wf-1',
        date: todayStr,
        time: '01:21 PM',
        timestamp: new Date('2026-10-12T13:21:00').getTime(),
        type: 'workflow',
        module: 'Deals',
        user: 'System Admin',
        source: 'Workflow Rule',
        icon: 'briefcase',
        title: 'Function Previous Stage was called',
        subtitle: 'via Workflow Rule Previous_Stage',
        linkText: 'Previous_Stage'
      });

      // 2. Stage & Field Updates (matching screenshot)
      events.push({
        id: 'ev-stage-1',
        date: todayStr,
        time: '01:20 PM',
        timestamp: new Date('2026-10-12T13:20:00').getTime(),
        type: 'field_update',
        module: 'Deals',
        user: 'Marketing Department',
        source: 'Direct Edit',
        icon: 'pencil',
        stageFrom: 'Deal Estimation accepted- Invoice Need',
        stageTo: record.stage || 'Deal Invoice Ready',
        changes: [
          `Probability (%) was updated from 60 to ${record.probability || 65}`,
          'Deal Aging (Days) was updated from -2.0 to -3.0',
          'Deal Aging was updated to 3 days ago'
        ],
        author: 'Marketing Department',
        authorDate: todayStr
      });

      // 3. Score update (matching screenshot)
      events.push({
        id: 'ev-score-1',
        date: todayStr,
        time: '12:03 PM',
        timestamp: new Date('2026-10-12T12:03:30').getTime(),
        type: 'score_update',
        module: 'Deals',
        user: 'System Automation',
        source: 'System Automation',
        icon: 'pencil',
        title: 'Score of Scoring test got updated from 24 to 25.'
      });

      // 4. Function call (matching screenshot)
      events.push({
        id: 'ev-wf-2',
        date: todayStr,
        time: '12:03 PM',
        timestamp: new Date('2026-10-12T12:03:00').getTime(),
        type: 'workflow',
        module: 'Deals',
        user: 'System Admin',
        source: 'Workflow Rule',
        icon: 'briefcase',
        title: 'Function Previous Stage was called',
        subtitle: 'via Workflow Rule Previous_Stage',
        linkText: 'Previous_Stage'
      });

      // 5. Associated Calls logged
      const dealCalls = calls?.filter(c => c.dealId === record.id) || [];
      dealCalls.forEach(c => {
        events.push({
          id: `ev-call-${c.id}`,
          date: c.dateTime ? fmtDate(c.dateTime) : '10/10/2026',
          time: c.dateTime ? fmtTime(c.dateTime) : '11:30 AM',
          timestamp: new Date(c.dateTime || '2026-10-10T11:30:00').getTime(),
          type: 'call',
          module: 'Calls',
          user: userName ? userName(c.ownerId) : 'Arun Kumar',
          source: 'Manual Entry',
          icon: 'phone',
          title: `${userName ? userName(c.ownerId) : 'User'} logged a call: "${c.subject}"`,
          details: `Duration: ${c.duration || 15} mins · Status: ${c.status || 'Completed'}`
        });
      });

      // 6. Notes added
      if (record.notesList && Array.isArray(record.notesList)) {
        record.notesList.forEach(n => {
          events.push({
            id: `ev-note-${n.id}`,
            date: n.createdAt ? fmtDate(n.createdAt) : '08/10/2026',
            time: n.createdAt ? fmtTime(n.createdAt) : '04:15 PM',
            timestamp: new Date(n.createdAt || '2026-10-08T16:15:00').getTime(),
            type: 'note',
            module: 'Notes',
            user: n.author || 'Divya R',
            source: 'Manual Entry',
            icon: 'file_text',
            title: `${n.author || 'User'} added a note`,
            noteContent: n.text
          });
        });
      }

      // 7. Deal creation
      events.push({
        id: 'ev-created',
        date: record.createdOn ? fmtDate(record.createdOn) : '01/10/2026',
        time: '10:00 AM',
        timestamp: new Date(record.createdOn || '2026-10-01T10:00:00').getTime(),
        type: 'creation',
        module: 'Deals',
        user: userName ? userName(record.ownerId) : 'Arun Kumar',
        source: 'Web Form',
        icon: 'briefcase',
        title: `Deal "${record.name}" created`,
        details: `Amount: ${fmtINR(record.amount)} · Source: ${record.source || 'Website'}`
      });
    } else if (module === 'Calls' && record) {
      events.push({
        id: 'ev-call-wf',
        date: todayStr,
        time: '01:21 PM',
        timestamp: new Date('2026-10-12T13:21:00').getTime(),
        type: 'workflow',
        module: 'Calls',
        user: 'System Admin',
        source: 'Workflow Rule',
        icon: 'briefcase',
        title: 'Workflow Rule Call_Followup_Notification triggered',
        subtitle: 'via Workflow Rule Call_Followup',
        linkText: 'Call_Followup'
      });

      events.push({
        id: 'ev-call-log',
        date: record.dateTime ? fmtDate(record.dateTime) : todayStr,
        time: record.dateTime ? fmtTime(record.dateTime) : '11:00 AM',
        timestamp: new Date(record.dateTime || '2026-10-12T11:00:00').getTime(),
        type: 'call',
        module: 'Calls',
        user: userName ? userName(record.ownerId) : 'Arun Kumar',
        source: 'Manual Entry',
        icon: 'phone',
        title: `Call "${record.subject}" logged`,
        details: `Purpose: ${record.purpose || 'Prospecting'} · Duration: ${record.duration || 15} mins · Status: ${record.status || 'Completed'}`
      });
    } else if (module === 'Zoho Finance' || module === 'Invoices') {
      const invList = records.length > 0 ? records : (record ? [record] : []);
      invList.forEach((inv, i) => {
        events.push({
          id: `ev-inv-${inv.id || i}`,
          date: inv.invoiceDate ? fmtDate(inv.invoiceDate) : todayStr,
          time: '10:30 AM',
          timestamp: new Date(inv.invoiceDate || '2026-10-12T10:30:00').getTime(),
          type: 'invoice',
          module: 'Zoho Finance',
          user: 'Billing Department',
          source: 'System Automation',
          icon: 'receipt',
          title: `Invoice "${inv.number}" generated`,
          details: `Amount: ${fmtINR(inv.amount)} · Due: ${fmtDate(inv.dueDate)} · Status: ${inv.status}`
        });

        if (inv.paidAmount > 0) {
          events.push({
            id: `ev-pay-${inv.id || i}`,
            date: inv.dueDate ? fmtDate(inv.dueDate) : todayStr,
            time: '02:45 PM',
            timestamp: new Date(inv.dueDate || '2026-10-12T14:45:00').getTime(),
            type: 'payment',
            module: 'Zoho Finance',
            user: 'Accounts Team',
            source: 'Manual Entry',
            icon: 'receipt',
            title: `Payment received for ${inv.number}`,
            details: `Received: ${fmtINR(inv.paidAmount)} · Balance: ${fmtINR(inv.amount - inv.paidAmount)}`
          });
        }
      });
    }

    // Sort descending by timestamp
    return events.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [module, record, records, customEvents, calls, userName]);

  // Apply Filter Action
  const handleApplyFilter = () => {
    setIsLoading(true);
    setTimeout(() => {
      setAppliedFilters({
        module: filterModule,
        user: filterUser,
        time: filterTime,
        source: filterSource,
        startDate: customStartDate,
        endDate: customEndDate
      });
      setIsLoading(false);
    }, 250);
  };

  const handleClearFilters = () => {
    setFilterModule('All Modules');
    setFilterUser('All Users');
    setFilterTime('Any Time');
    setFilterSource('All Sources');
    setCustomStartDate('');
    setCustomEndDate('');
    setAppliedFilters({
      module: 'All Modules',
      user: 'All Users',
      time: 'Any Time',
      source: 'All Sources',
      startDate: '',
      endDate: ''
    });
  };

  const isFilterActive =
    appliedFilters.module !== 'All Modules' ||
    appliedFilters.user !== 'All Users' ||
    appliedFilters.time !== 'Any Time' ||
    appliedFilters.source !== 'All Sources' ||
    Boolean(appliedFilters.startDate || appliedFilters.endDate);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return rawEvents.filter(ev => {
      // 1. Module filter
      if (appliedFilters.module !== 'All Modules') {
        if (ev.module?.toLowerCase() !== appliedFilters.module.toLowerCase()) return false;
      }
      // 2. User filter
      if (appliedFilters.user !== 'All Users') {
        if (!ev.user?.toLowerCase().includes(appliedFilters.user.toLowerCase())) return false;
      }
      // 3. Source filter
      if (appliedFilters.source !== 'All Sources') {
        if (ev.source?.toLowerCase() !== appliedFilters.source.toLowerCase()) return false;
      }
      // 4. Time filter
      if (appliedFilters.time !== 'Any Time') {
        const now = new Date('2026-10-12T23:59:59').getTime();
        const evTime = ev.timestamp || 0;
        const oneDay = 24 * 60 * 60 * 1000;

        if (appliedFilters.time === 'Today') {
          if (now - evTime > oneDay) return false;
        } else if (appliedFilters.time === 'Yesterday') {
          if (now - evTime < oneDay || now - evTime > 2 * oneDay) return false;
        } else if (appliedFilters.time === 'Last 7 Days') {
          if (now - evTime > 7 * oneDay) return false;
        } else if (appliedFilters.time === 'Last 30 Days') {
          if (now - evTime > 30 * oneDay) return false;
        } else if (appliedFilters.time === 'This Month') {
          if (now - evTime > 31 * oneDay) return false;
        } else if (appliedFilters.time === 'Custom Date Range...') {
          if (appliedFilters.startDate) {
            const start = new Date(appliedFilters.startDate).getTime();
            if (evTime < start) return false;
          }
          if (appliedFilters.endDate) {
            const end = new Date(appliedFilters.endDate + 'T23:59:59').getTime();
            if (evTime > end) return false;
          }
        }
      }
      return true;
    });
  }, [rawEvents, appliedFilters]);

  // Group events by date (e.g. "12/10/2026")
  const groupedEvents = useMemo(() => {
    const groups = {};
    filteredEvents.forEach(ev => {
      const dateKey = ev.date || 'Earlier';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(ev);
    });
    return groups;
  }, [filteredEvents]);

  // Upcoming scheduled actions matching reference
  const upcomingActions = [
    {
      id: 'ua-1',
      title: 'Workflow: Send Follow-up Reminder',
      triggerTime: '15/10/2026 10:00 AM',
      rule: 'Followup_SLA_Escalation',
      type: 'Email Alert',
      recipient: 'Arun Kumar'
    },
    {
      id: 'ua-2',
      title: 'Task: Deal Stage Inactivity Check',
      triggerTime: '17/10/2026 09:30 AM',
      rule: 'Inactivity_Aging_Rule',
      type: 'Field Update',
      recipient: 'System Automation'
    }
  ];

  return (
    <div className="flex-1 bg-white overflow-y-auto thin-scroll p-4 sm:p-6 select-text">
      <div className="max-w-[920px] mx-auto">
        {/* 1. History Tab Header matching Screenshot */}
        <div className="border-b border-line mb-5">
          <button
            type="button"
            className="pb-2.5 px-1 text-[14px] font-bold text-primary border-b-2 border-primary transition-all flex items-center gap-1.5"
          >
            <span>History</span>
          </button>
        </div>

        {/* 2. Timeline History Title & Funnel Filter Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-ink">Timeline History</h2>
            <button
              type="button"
              onClick={() => setFilterBarOpen(prev => !prev)}
              className={`p-1.5 rounded-md border transition-all cursor-pointer ${
                filterBarOpen || isFilterActive
                  ? 'border-primary/40 bg-primary/10 text-primary shadow-2xs'
                  : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600'
              }`}
              title="Toggle Timeline Filter"
            >
              <Filter size={15} />
            </button>
          </div>

          {/* Show Upcoming Automated Actions Toggle */}
          <button
            type="button"
            onClick={() => setUpcomingActionsOpen(prev => !prev)}
            className="text-[13px] text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Show Upcoming Automated Actions</span>
            {upcomingActionsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Upcoming Automated Actions Drawer */}
        {upcomingActionsOpen && (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={15} className="text-amber-500" />
              <h3 className="text-[13.5px] font-bold text-ink">Scheduled & Upcoming Automated Actions</h3>
            </div>
            <div className="space-y-2">
              {upcomingActions.map(ua => (
                <div key={ua.id} className="p-3 bg-white border border-line rounded-lg flex items-center justify-between text-[12.5px]">
                  <div>
                    <div className="font-semibold text-ink">{ua.title}</div>
                    <div className="text-slate-500 text-[11.5px] mt-0.5">
                      Rule: <span className="text-primary font-medium">{ua.rule}</span> · Type: {ua.type} · Assignee: {ua.recipient}
                    </div>
                  </div>
                  <div className="text-right text-[11.5px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 shrink-0">
                    {ua.triggerTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Filter Card matching Screenshot (Modules, Users, Time, Sources + Apply Filter) */}
        {filterBarOpen && (
          <TimelineHistoryFilterBar
            users={users}
            filterModule={filterModule}
            setFilterModule={setFilterModule}
            filterUser={filterUser}
            setFilterUser={setFilterUser}
            filterTime={filterTime}
            setFilterTime={setFilterTime}
            filterSource={filterSource}
            setFilterSource={setFilterSource}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            onApply={handleApplyFilter}
            onClear={handleClearFilters}
            isFilterActive={isFilterActive}
          />
        )}

        {/* 4. Timeline Records List */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2 text-[13px]">
            <RefreshCw size={16} className="animate-spin text-primary" />
            <span>Filtering timeline records...</span>
          </div>
        ) : Object.keys(groupedEvents).length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8">
            <Clock size={36} className="mx-auto text-slate-300 mb-2" />
            <div className="text-[14px] font-bold text-ink">No timeline history records found</div>
            <div className="text-[12.5px] text-slate-500 mt-1">Try modifying or clearing your filter criteria.</div>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-3 btn-secondary h-8 px-3 text-[12px] font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedEvents).map(([dateLabel, evGroup]) => (
            <div key={dateLabel} className="mb-8">
              {/* Date Group Badge matching Screenshot (e.g. 12/10/2026) */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded text-[12px] font-semibold text-slate-600 bg-slate-100 border border-slate-200">
                  {dateLabel}
                </span>
              </div>

              {/* Timeline Items on Vertical Line */}
              <div className="relative pl-24 space-y-7 before:absolute before:left-[108px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
                {evGroup.map((ev) => (
                  <div key={ev.id} className="relative flex items-start gap-4">
                    {/* Timestamp (e.g. 01:21 PM) */}
                    <div className="absolute -left-24 top-0.5 w-18 text-right text-[12px] font-medium text-slate-500">
                      {ev.time}
                    </div>

                    {/* Circular Icon Node */}
                    <div className="relative z-10 w-7 h-7 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-2xs shrink-0 text-slate-600">
                      {ev.icon === 'briefcase' ? (
                        <Briefcase size={13} className="text-slate-600" />
                      ) : ev.icon === 'pencil' ? (
                        <Edit3 size={13} className="text-slate-600" />
                      ) : ev.icon === 'phone' ? (
                        <Phone size={13} className="text-slate-600" />
                      ) : ev.icon === 'file_text' ? (
                        <FileText size={13} className="text-slate-600" />
                      ) : (
                        <Receipt size={13} className="text-slate-600" />
                      )}
                    </div>

                    {/* Event Content matching reference Screenshot */}
                    <div className="flex-1 min-w-0 text-[13px] text-slate-800 pt-0.5">
                      {ev.type === 'workflow' ? (
                        <div>
                          <div>{ev.title}</div>
                          {ev.subtitle && (
                            <div className="text-[12.5px] text-slate-500 mt-0.5">
                              via Workflow Rule{' '}
                              <span className="text-[#2563EB] hover:underline font-medium cursor-pointer">
                                {ev.linkText || 'Workflow'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : ev.type === 'field_update' ? (
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 leading-normal">
                            <span>Stage was updated from</span>
                            {ev.stageFrom && (
                              <span className="inline-block px-2 py-0.5 rounded text-[11.5px] font-semibold bg-[#FCE7F3] text-[#BE185D] border border-[#FBCFE8]">
                                {ev.stageFrom}
                              </span>
                            )}
                            <span>to</span>
                            {ev.stageTo && (
                              <span className="inline-block px-2.5 py-0.5 rounded text-[11.5px] font-semibold bg-[#0284C7] text-white">
                                {ev.stageTo}
                              </span>
                            )}
                          </div>
                          {ev.changes && ev.changes.length > 0 && (
                            <div className="mt-1 space-y-0.5 text-[12.5px] text-slate-700">
                              {ev.changes.map((ch, idx) => (
                                <div key={idx}>{ch}</div>
                              ))}
                            </div>
                          )}
                          {ev.author && (
                            <div className="text-[12px] text-slate-500 mt-1">
                              by {ev.author} {ev.authorDate}
                            </div>
                          )}
                        </div>
                      ) : ev.type === 'score_update' ? (
                        <div>
                          <div className="leading-snug">{ev.title}</div>
                        </div>
                      ) : ev.type === 'note' ? (
                        <div>
                          <div className="font-semibold text-ink">{ev.title}</div>
                          {ev.noteContent && (
                            <p className="mt-1 text-[12.5px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              {ev.noteContent}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-ink">{ev.title}</div>
                          {ev.details && (
                            <div className="text-[12px] text-slate-500 mt-0.5">{ev.details}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

