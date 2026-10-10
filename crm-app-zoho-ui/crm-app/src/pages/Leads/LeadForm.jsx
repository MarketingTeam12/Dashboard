import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, UserPlus } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';

/** Add Lead form (moved out of Leads.jsx unchanged, route: /leads/new) */
export default function LeadForm() {
  const { createRecord } = useCRM();
  const toast = useToast();
  const notify = (msg, type) => (type === 'error' ? toast.error(msg) : toast.success(msg));
  const navigate = useNavigate();
  const setCurrentView = () => navigate('/leads');
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    company: '',
    designation: '',
    email: '',
    phone: '',
    leadSource: 'Website',
    status: 'New',
    industry: 'Information Technology',
    employees: '50 - 200',
    address: 'No. 25, Tech Park, OMR Road, Chennai - 600097, Tamil Nadu, India',
    website: 'https://example.com',
    annualRevenue: '₹ 1 Cr - 5 Cr',
    productInterest: 'Cloud CRM Automation & AI Workflows',
    remarks: 'busy Honey Translation Services, Madurai',
    assignedTo: 'Karthik S',
    city: 'Chennai',
    tag: 'Lead',
    score: 85
  });

  // Add Lead Submit
  const handleSaveLead = (e) => {
    e.preventDefault();
    if (!newLead.firstName || !newLead.company || !newLead.phone) {
      notify('Please fill required fields (First Name, Company, Phone)', 'error');
      return;
    }

    const leadRecord = {
      name: `${newLead.firstName} ${newLead.lastName}`.trim(),
      company: newLead.company,
      designation: newLead.designation,
      email: newLead.email,
      phone: newLead.phone,
      mobile: newLead.phone,
      leadSource: newLead.leadSource,
      status: newLead.status,
      industry: newLead.industry,
      employees: newLead.employees,
      address: newLead.address,
      website: newLead.website,
      annualRevenue: newLead.annualRevenue,
      productInterest: newLead.productInterest,
      remarks: newLead.remarks,
      city: newLead.city,
      tag: newLead.tag,
      assignedTo: newLead.assignedTo,
      score: newLead.score || 85,
      createdTime: new Date().toISOString()
    };

    createRecord('leads', leadRecord);
    setCurrentView('list');
    notify('New lead created and workflow automated successfully!', 'success');
  };

    return (
      <div className="space-y-6">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => setCurrentView('list')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#2F7BF5] hover:underline"
        >
          <ArrowLeft size={16} />
          <span>Back to Lead List</span>
        </button>

        {/* Title Banner */}
        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-inner">
            <UserPlus size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Add Lead</h1>
            <p className="text-xs text-slate-500">
              Create a new lead and capture their information.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveLead} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Card: Lead Information (8 cols) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar size={18} className="text-[#2F7BF5]" />
              <h2 className="text-sm font-bold text-slate-900">Lead Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter first name"
                  value={newLead.firstName}
                  onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter last name"
                  value={newLead.lastName}
                  onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter company name"
                  value={newLead.company}
                  onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="Enter designation"
                  value={newLead.designation}
                  onChange={(e) => setNewLead({ ...newLead, designation: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-xs bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl text-slate-600">
                    +91
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter phone number"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-r-xl focus:outline-none focus:border-[#2F7BF5]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Lead Source *</label>
                <select
                  value={newLead.leadSource}
                  onChange={(e) => setNewLead({ ...newLead, leadSource: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                >
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Email Campaign">Email Campaign</option>
                  <option value="Direct Contact">Direct Contact</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Lead Status *</label>
                <select
                  value={newLead.status}
                  onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Converted">Converted</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Industry</label>
                <select
                  value={newLead.industry}
                  onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                >
                  <option value="Information Technology">Information Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Manufacturing">Manufacturing</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">No. of Employees</label>
                <select
                  value={newLead.employees}
                  onChange={(e) => setNewLead({ ...newLead, employees: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                >
                  <option value="1 - 10">1 - 10</option>
                  <option value="11 - 50">11 - 50</option>
                  <option value="50 - 200">50 - 200</option>
                  <option value="200+">200+</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Address</label>
              <textarea
                rows={3}
                placeholder="Enter address"
                value={newLead.address}
                onChange={(e) => setNewLead({ ...newLead, address: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
              />
            </div>
          </div>

          {/* Right Card: Additional Details & Assign (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Globe size={18} className="text-[#2F7BF5]" />
                <h2 className="text-sm font-bold text-slate-900">Additional Details</h2>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Website</label>
                <input
                  type="text"
                  placeholder="Enter website URL"
                  value={newLead.website}
                  onChange={(e) => setNewLead({ ...newLead, website: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Annual Revenue</label>
                <select
                  value={newLead.annualRevenue}
                  onChange={(e) => setNewLead({ ...newLead, annualRevenue: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                >
                  <option value="Under ₹ 50 L">Under ₹ 50 L</option>
                  <option value="₹ 50 L - 1 Cr">₹ 50 L - 1 Cr</option>
                  <option value="₹ 1 Cr - 5 Cr">₹ 1 Cr - 5 Cr</option>
                  <option value="Above ₹ 5 Cr">Above ₹ 5 Cr</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Interested Product/Service</label>
                <textarea
                  rows={2}
                  placeholder="Enter product or service of interest"
                  value={newLead.productInterest}
                  onChange={(e) => setNewLead({ ...newLead, productInterest: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Enter any additional remarks"
                  value={newLead.remarks}
                  onChange={(e) => setNewLead({ ...newLead, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>
            </div>

            {/* Assign To Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <Users size={18} className="text-[#2F7BF5]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Assign To</h3>
                  <p className="text-[11px] text-slate-500">Assign this lead to a team member or agent.</p>
                </div>
              </div>

              <div>
                <select
                  value={newLead.assignedTo}
                  onChange={(e) => setNewLead({ ...newLead, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5] font-medium"
                >
                  <option value="Sibi Chakaravarthi">Sibi Chakaravarthi (Sales Manager)</option>
                  <option value="Karthik S">Karthik S</option>
                  <option value="Arun Kumar">Arun Kumar</option>
                  <option value="Priya Sharma">Priya Sharma</option>
                  <option value="Divya R">Divya R</option>
                  <option value="Vikram P">Vikram P</option>
                </select>
              </div>

              {/* Zoho Workflow Notification Note */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles size={13} className="text-[#2F7BF5]" />
                  <span>Zoho Workflow Automation Active</span>
                </div>
                <p>
                  Upon saving: An agent will be assigned, a WorkQueue task will be generated, and a follow-up message will be scheduled automatically.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentView('list')}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-[#2F7BF5] text-white hover:bg-blue-600 rounded-xl shadow-sm transition"
                >
                  Save Lead
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  
}
