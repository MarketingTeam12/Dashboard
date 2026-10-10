import {
  Award, BarChart3, Briefcase, Building2, CalendarClock, CircleDollarSign, ClipboardList, FileText, Headphones, History, Home,
  LineChart, Megaphone, Package, Phone, PieChart, Receipt, Server, Settings, TrendingUp, UserRound, Users, Workflow,
} from 'lucide-react';

export const MODULES = [
  { path: '/contacts', title: 'Contacts', icon: Users, create: 'Create Contact' },
  { path: '/accounts', title: 'Accounts', icon: Building2, create: 'Create Account' },
  { path: '/deals', title: 'Deals', icon: CircleDollarSign, create: 'Create Deal' },
  { path: '/calls', title: 'Calls', icon: Phone, create: 'Log a Call' },
  { path: '/my-jobs', title: 'My Jobs', icon: Briefcase },
  { path: '/forecasts', title: 'Forecasts', icon: TrendingUp },
  { path: '/stage-summary-percentage', title: 'Stage Summary Percentage', icon: PieChart },
  { path: '/stage-summary-old-data', title: 'Stage Summary Old Data', icon: History },
  { path: '/zoho-finance', title: 'Zoho Finance', icon: Receipt, create: 'Create Invoice' },
  { path: '/workflows', title: 'Workflow Automation', icon: Workflow },
];

export const TOP_ITEMS = [
  { title: 'Home', icon: Home }, { title: 'Workqueue', icon: ClipboardList }, { title: 'Reports', icon: LineChart },
  { title: 'Analytics', icon: BarChart3 }, { title: 'Agents', icon: UserRound }, { title: 'MCP Server', icon: Server },
];

export const SALES_ITEMS = [
  { title: 'Leads', icon: Award }, { path: '/contacts' }, { path: '/accounts' }, { path: '/deals' }, { path: '/calls' },
];

export const POST_MY_JOB_ITEMS = [
  { path: '/forecasts' }, { title: 'Documents', icon: FileText }, { title: 'Campaigns', icon: Megaphone },
];

export const GROUPS = [
  { title: 'Activities', icon: CalendarClock, children: ['Tasks', 'Events', 'Meetings'] },
  { title: 'Inventory', icon: Package, children: ['Products', 'Price Books', 'Quotes'] },
  { title: 'Support', icon: Headphones, children: ['Cases', 'Solutions'] },
  { title: 'Integrations', icon: Settings, children: ['Connections', 'Webhooks'] },
];

export const BOTTOM_ITEMS = ['/stage-summary-percentage', '/stage-summary-old-data', '/zoho-finance', '/workflows'];

export const moduleByPath = (pathname) => MODULES.find((m) => pathname.startsWith(m.path));
