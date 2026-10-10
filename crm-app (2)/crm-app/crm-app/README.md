# CRM — React + Vite frontend

A frontend-only CRM with seven working modules (Contacts, Accounts, Deals, Calls,
Stage Summary Percentage, Stage Summary Old Data, Zoho Finance) and a visual
workflow automation builder. All data lives in your browser's LocalStorage —
there is no backend, no API key and no Zoho connection.

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## What works

- **Contacts** — create / edit / view / delete, left filter panel (system filters and
  field filters), lifecycle quick filter, column chooser, bulk owner/lifecycle updates,
  follow-up tags, call history and linked deals in the detail drawer.
- **Accounts** — KPI cards, industry/type/owner/status filters plus location, revenue
  and date filters, live contact and deal counts, status changes, linked records.
- **Deals** — inline stage changes from the table, Kanban board with drag-and-drop
  (probability resets to the stage default), quick update of amount / probability /
  closing date, bulk stage and owner changes. KPIs recalculate with filters.
- **Calls** — log or schedule calls, status updates (completing a call asks for its
  duration), per-contact call history timeline, type/status/owner/date filters.
- **Stage Summary Percentage** — six charts and a detailed table derived from the
  Deals data; filter by date, department, owner, account and source; group the table
  by stage, month, source or owner; CSV export.
- **Stage Summary Old Data** — an independent 2024 dataset with monthly or quarterly
  breakdown, old-vs-current comparison charts, top accounts and CSV export.
- **Zoho Finance** — invoices with partial payments, automatic balance and status,
  payment history, "Check for overdue invoices", charts and CSV export. This is a
  standalone simulation, not a Zoho Finance integration.
- **Workflow Automation** (Settings menu, sidebar, or the workflow icon in any toolbar)
  — React Flow canvas with trigger, condition (Yes/No branches) and action nodes,
  a settings panel, test runs against real records, activate/deactivate, execution
  history, tasks and an activity log.

Every list view also offers Kanban, grid and chart layouts, saved views, sorting,
pagination, compact rows, CSV export and a refresh that re-reads LocalStorage.

## Workflow engine

Every create, update and delete runs the active workflows for that module
(`src/workflows/workflowEngine.js`). The engine walks the graph from the trigger:
conditions route down the Yes or No handle, and actions update the record, assign an
owner, change a deal stage, set a status, create a task, add an in-app notification
or write to the activity log. Changes made by a workflow don't re-trigger workflows,
which prevents loops. Notifications appear in the bell menu only — no email or SMS
is sent.

Seeded rules:
- **High-value deal alert** (active): a new deal over ₹10,00,000 is assigned to
  Arun Kumar, with a notification and an activity log entry.
- **Overdue invoice follow-up** (active): when an invoice's status changes to
  Overdue, it adds a notification and a collection task.
- **Missed call follow-up** (inactive): creates a callback task for missed calls.

## Data notes

- Sample data is generated deterministically. The first rows of every table match
  the reference screenshots, and totals match the reference KPIs
  (248 accounts, 342 deals, 256 calls, 142 invoices).
- "vs previous period" on deal KPIs compares with the 2024 historical dataset;
  other modules compare with a stored previous-period snapshot.
- Stage reports include Closed Lost as a sixth stage so every deal is counted.
- Settings → **Reset demo data** restores the original sample data.
  Settings → **Export all data (JSON)** downloads everything.

## Project structure

```
src/
  components/layout/   Sidebar, Topbar, MainLayout, navConfig
  components/common/   DataTable, FilterBar, StatCard, Modal/Drawer, RecordForm,
                       Dropdown, ActionMenu, Pagination, Views (Kanban/Grid/Chart) …
  components/charts/   DonutChart, BarChart, LineChart
  pages/               one folder per module + WorkflowBuilder
  workflows/           WorkflowCanvas, node components, workflowEngine.js
  context/CRMContext.jsx   shared store, CRUD, cascading links, persistence
  data/seedData.js     deterministic sample data
  utils/               calculations, storage, exportCSV
```
