import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

// Branch 1: Home / Workqueue / Dashboards / Messages / Leads / Agents
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import WorkQueue from './pages/WorkQueue/WorkQueue';
import Agents from './pages/Agents/Agents';
import Messages from './pages/Messages/Messages';
import Leads from './pages/Leads/Leads';
import LeadDetail from './pages/Leads/LeadDetail';
import LeadForm from './pages/Leads/LeadForm';
import DealApprovals from './pages/Deals/DealApprovals';

// Branch 2: Reports / Deals / Calls / Finance
import Reports from './pages/Reports/Reports';
import ReportBuilder from './pages/Reports/ReportBuilder';
import ReportDetail from './pages/Reports/ReportDetail';
import Deals from './pages/Deals/Deals';
import Calls from './pages/Calls/Calls';
import StageSummaryPercentage from './pages/StageSummaryPercentage/StageSummaryPercentage';
import StageSummaryOldData from './pages/StageSummaryOldData/StageSummaryOldData';
import ZohoFinance from './pages/ZohoFinance/ZohoFinance';
import WorkflowBuilder from './pages/WorkflowBuilder/WorkflowBuilder';

// Branch 3: Contacts / Accounts / My Jobs / Forecasts
import Contacts from './pages/Contacts/Contacts';
import Accounts from './pages/Accounts/Accounts';
import MyJobs from './pages/MyJobs/MyJobs';
import Forecasts from './pages/Forecasts/Forecasts';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Default route points to Home */}
        <Route index element={<Navigate to="/home" replace />} />

        {/* Branch 1: Home, Workqueue, Dashboards, Messages, Leads */}
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workqueue" element={<WorkQueue />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/new" element={<LeadForm />} />
        <Route path="/leads/:id/edit" element={<LeadForm />} />
        <Route path="/leads/:id" element={<LeadDetail />} />

        {/* Branch 2: Reports, Deals, Calls, Finance */}
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/create" element={<ReportBuilder />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/deal-approvals" element={<DealApprovals />} />
        <Route path="/approvals" element={<DealApprovals />} />
        <Route path="/calls" element={<Calls />} />
        <Route path="/stage-summary-percentage" element={<StageSummaryPercentage />} />
        <Route path="/stage-summary-old-data" element={<StageSummaryOldData />} />
        <Route path="/zoho-finance" element={<ZohoFinance />} />
        <Route path="/workflows" element={<WorkflowBuilder />} />
        <Route path="/workflows/:id" element={<WorkflowBuilder />} />

        {/* Branch 3: Contacts, Accounts, My Jobs, Forecasts */}
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/contacts/create" element={<Contacts isCreatePage={true} />} />
        <Route path="/contacts/new" element={<Contacts isCreatePage={true} />} />
        <Route path="/contacts/:contactId" element={<Contacts />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/create" element={<Accounts isCreatePage={true} />} />
        <Route path="/accounts/new" element={<Accounts isCreatePage={true} />} />
        <Route path="/accounts/:accountId" element={<Accounts />} />
        <Route path="/my-jobs" element={<MyJobs />} />
        <Route path="/my-job" element={<Navigate to="/my-jobs" replace />} />
        <Route path="/forecasts" element={<Forecasts />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
