import {
  Award, BarChart3, Bot, Building2, Calendar, CalendarClock, CheckSquare, CircleDollarSign, ClipboardList,
  Compass, FileText, Headphones, History, Home, Inbox, LayoutDashboard, LineChart, Mail, Megaphone,
  MessageSquare, Package, Phone, PieChart, Receipt, Server, Settings, Target, TrendingUp, UserRound, Users, Workflow,
} from 'lucide-react';

export const MODULES = [
  { path: '/home', title: 'Home', icon: Home },
  { path: '/dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { path: '/workqueue', title: 'Workqueue', icon: ClipboardList, create: 'Create Task' },
  { path: '/reports', title: 'Reports', icon: LineChart, create: 'Create Report' },
  { path: '/agents', title: 'Agents', icon: UserRound, create: 'Create Agent' },
  { path: '/messages', title: 'Messages', icon: MessageSquare, create: 'Compose Message' },
  { path: '/leads', title: 'Leads', icon: Award, create: 'Add Lead' },
  { path: '/contacts', title: 'Contacts', icon: Users, create: 'Create Contact' },
  { path: '/accounts', title: 'Accounts', icon: Building2, create: 'Create Account' },
  { path: '/deals', title: 'Deals', icon: CircleDollarSign, create: 'Create Deal' },
  { path: '/calls', title: 'Calls', icon: Phone, create: 'Log a Call' },
  { path: '/stage-summary-percentage', title: 'Stage Summary Percentage', icon: PieChart },
  { path: '/stage-summary-old-data', title: 'Stage Summary Old Data', icon: History },
  { path: '/zoho-finance', title: 'Zoho Finance', icon: Receipt, create: 'Create Invoice' },
  { path: '/my-jobs', title: 'My Jobs', icon: ClipboardList },
  { path: '/forecasts', title: 'Forecasts', icon: TrendingUp },
  { path: '/workflows', title: 'Workflow Automation', icon: Workflow, create: 'Create Workflow' },
];

export const TOP_NAV_ITEMS = [
  { path: '/home', title: 'Home', icon: Home },
  { path: '/workqueue', title: 'Workqueue', icon: ClipboardList },
  { path: '/reports', title: 'Reports', icon: LineChart },
  { path: '/dashboard', title: 'Dashboards', icon: LayoutDashboard },
];

// Zoho-style "CRM Teamspace" list - ONLY the modules requested, in this order.
export const TEAMSPACE_ITEMS = [
  { path: '/messages', title: 'Messages', icon: MessageSquare },
  { path: '/leads', title: 'Leads', icon: Award },
  { path: '/contacts', title: 'Contacts', icon: Users },
  { path: '/accounts', title: 'Accounts', icon: Building2 },
  { path: '/deals', title: 'Deals', icon: CircleDollarSign },
  { path: '/zoho-finance', title: 'Zoho Finance', icon: Receipt },
  { path: '/calls', title: 'Calls', icon: Phone },
  { path: '/my-jobs', title: 'My Jobs', icon: ClipboardList },
  { path: '/forecasts', title: 'Forecasts', icon: TrendingUp },
];

export const GROUPS = [
  { title: 'Activities', icon: CalendarClock, children: ['Tasks', 'Events', 'Meetings'] },
  { title: 'Inventory', icon: Package, children: ['Products', 'Price Books', 'Quotes'] },
  { title: 'Support', icon: Headphones, children: ['Cases', 'Solutions'] },
  { title: 'Integrations', icon: Settings, children: ['Connections', 'Webhooks'] },
];

export const BOTTOM_ITEMS = ['/stage-summary-percentage', '/stage-summary-old-data', '/zoho-finance', '/workflows'];

export const moduleByPath = (pathname) => {
  if (pathname === '/' || pathname === '/home') return MODULES.find((m) => m.path === '/home');
  return MODULES.find((m) => pathname.startsWith(m.path));
};
