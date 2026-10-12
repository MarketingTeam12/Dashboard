import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Contacts from './pages/Contacts/Contacts';
import Accounts from './pages/Accounts/Accounts';
import Deals from './pages/Deals/Deals';
import Calls from './pages/Calls/Calls';
import MyJobs from './pages/MyJobs/MyJobs';
import Forecasts from './pages/Forecasts/Forecasts';
import StageSummaryPercentage from './pages/StageSummaryPercentage/StageSummaryPercentage';
import StageSummaryOldData from './pages/StageSummaryOldData/StageSummaryOldData';
import ZohoFinance from './pages/ZohoFinance/ZohoFinance';
import WorkflowBuilder from './pages/WorkflowBuilder/WorkflowBuilder';
import Reports from './pages/Reports/Reports';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/contacts" replace />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:reportId" element={<Reports />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/contacts/create" element={<Contacts isCreatePage={true} />} />
        <Route path="/contacts/new" element={<Contacts isCreatePage={true} />} />
        <Route path="/contacts/:contactId" element={<Contacts />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/create" element={<Accounts isCreatePage={true} />} />
        <Route path="/accounts/new" element={<Accounts isCreatePage={true} />} />
        <Route path="/accounts/:accountId" element={<Accounts />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/calls" element={<Calls />} />
        <Route path="/my-jobs" element={<MyJobs />} />
        <Route path="/my-job" element={<Navigate to="/my-jobs" replace />} />
        <Route path="/forecasts" element={<Forecasts />} />
        <Route path="/stage-summary-percentage" element={<StageSummaryPercentage />} />
        <Route path="/stage-summary-old-data" element={<StageSummaryOldData />} />
        <Route path="/zoho-finance" element={<ZohoFinance />} />
        <Route path="/workflows" element={<WorkflowBuilder />} />
        <Route path="/workflows/:id" element={<WorkflowBuilder />} />
        <Route path="*" element={<Navigate to="/contacts" replace />} />
      </Route>
    </Routes>
  );
}
