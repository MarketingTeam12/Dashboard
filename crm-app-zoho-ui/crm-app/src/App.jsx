import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

// Seven New Zoho CRM Modules
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import WorkQueue from './pages/WorkQueue/WorkQueue';
import Reports from './pages/Reports/Reports';
import Agents from './pages/Agents/Agents';
import Messages from './pages/Messages/Messages';
import Leads from './pages/Leads/Leads';
import LeadDetail from './pages/Leads/LeadDetail';
import LeadForm from './pages/Leads/LeadForm';
import MyJobs from './pages/MyJobs/MyJobs';
import Forecasts from './pages/Forecasts/Forecasts';

// Existing Intact Modules
import Contacts from './pages/Contacts/Contacts';
import Accounts from './pages/Accounts/Accounts';
import Deals from './pages/Deals/Deals';
import Calls from './pages/Calls/Calls';
import StageSummaryPercentage from './pages/StageSummaryPercentage/StageSummaryPercentage';
import StageSummaryOldData from './pages/StageSummaryOldData/StageSummaryOldData';
import ZohoFinance from './pages/ZohoFinance/ZohoFinance';
import WorkflowBuilder from './pages/WorkflowBuilder/WorkflowBuilder';

import DealApprovals from './pages/Deals/DealApprovals';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Default route points to Home */}
        <Route index element={<Navigate to="/home" replace />} />

        {/* 7 New Zoho Modules */}
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workqueue" element={<WorkQueue />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/new" element={<LeadForm />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/my-jobs" element={<MyJobs />} />
        <Route path="/forecasts" element={<Forecasts />} />

        {/* Existing Intact Modules & Extended Zoho Views */}
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/deal-approvals" element={<DealApprovals />} />
        <Route path="/approvals" element={<DealApprovals />} />
        <Route path="/calls" element={<Calls />} />
        <Route path="/stage-summary-percentage" element={<StageSummaryPercentage />} />
        <Route path="/stage-summary-old-data" element={<StageSummaryOldData />} />
        <Route path="/zoho-finance" element={<ZohoFinance />} />
        <Route path="/workflows" element={<WorkflowBuilder />} />
        <Route path="/workflows/:id" element={<WorkflowBuilder />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
