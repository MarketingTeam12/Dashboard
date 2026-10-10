import {
  Award, Building2, CircleDollarSign, ClipboardList, Home,
  LineChart, Phone, Receipt, TrendingUp, Users, PieChart, History, Workflow,
  MessageSquare, LayoutDashboard, Briefcase
} from 'lucide-react';

export const MODULES = [
  { path: '/contacts', title: 'Contacts', icon: Users, create: 'Create Contact' },
  { path: '/accounts', title: 'Accounts', icon: Building2, create: 'Create Account' },
  { path: '/deals', title: 'Deals', icon: CircleDollarSign, create: 'Create Deal' },
  { path: '/calls', title: 'Calls', icon: Phone, create: 'Log a Call' },
  { path: '/stage-summary-percentage', title: 'Stage Summary Percentage', icon: PieChart },
  { path: '/stage-summary-old-data', title: 'Stage Summary Old Data', icon: History },
  { path: '/zoho-finance', title: 'Zoho Finance', icon: Receipt, create: 'Create Invoice' },
  { path: '/reports', title: 'Reports', icon: LineChart, create: 'Create Report' },
  { path: '/workflows', title: 'Workflow Automation', icon: Workflow },
];

export const SIDEBAR_ITEMS = [
  { title: 'Home', icon: Home },
  { title: 'Workqueue', icon: ClipboardList },
  { path: '/reports' },
  { title: 'Dashboard', icon: LayoutDashboard },
  { title: 'Messages', icon: MessageSquare },
  { title: 'Leads', icon: Award },
  { path: '/contacts' },
  { path: '/accounts' },
  { path: '/deals' },
  { path: '/calls' },
  { path: '/zoho-finance', title: 'Finance' },
  { title: 'My Jobs', icon: Briefcase },
  { title: 'Forecasts', icon: TrendingUp },
];

export const moduleByPath = (pathname) => MODULES.find((m) => pathname.startsWith(m.path));
