import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { DEAL_SOURCES, DEPARTMENTS } from '../../data/seedData';
import { STAGES, STAGE_PROBABILITY, todayISO } from '../../utils/calculations';

function Field({ label, required, children }) {
  return (
    <div className="flex items-start gap-4 mb-4">
      <label className="w-[180px] shrink-0 text-[13px] text-ink-600 font-medium text-right mt-1.5 flex items-center justify-end">
        {required && <span className="text-danger mr-1">*</span>}
        {label}
      </label>
      <div className="flex-1 max-w-[320px]">
        {children}
      </div>
    </div>
  );
}

export default function CreateDeal({ record, mode, onSave, onCancel }) {
  const { users, accounts, contacts } = useCRM();
  const [data, setData] = useState(record || {});
  
  const handleChange = (field, value) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'stage' && STAGE_PROBABILITY[value]) {
        next.probability = STAGE_PROBABILITY[value];
      }
      return next;
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(data, false);
  };

  const handleSaveAndNew = (e) => {
    e.preventDefault();
    onSave(data, true);
  };

  const ownerOptions = users.map((u) => ({ value: u.id, label: u.name }));
  const accountOptions = [...accounts].sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name }));
  const contactOptions = contacts.filter((c) => !data.accountId || c.accountId === data.accountId).map((c) => ({ value: c.id, label: c.name }));

  const inputClass = "w-full h-[34px] px-3 text-[13px] border border-line rounded-md focus:border-primary outline-none focus:ring-1 focus:ring-primary";

  return (
    <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm border border-line flex flex-col h-full absolute inset-0 z-20">
      <div className="flex items-center justify-between p-4 border-b border-line sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="h-8 w-8 rounded flex items-center justify-center hover:bg-page text-ink-600">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-[18px] font-semibold text-ink">{mode === 'edit' ? 'Edit Deal' : 'Create Deal'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="h-9 px-4 rounded border border-line bg-white text-ink-600 font-medium hover:bg-page">Cancel</button>
          <button type="button" onClick={handleSaveAndNew} className="h-9 px-4 rounded border border-line bg-white text-ink-600 font-medium hover:bg-page">Save and New</button>
          <button type="submit" className="h-9 px-4 rounded bg-primary text-white font-medium hover:bg-primary-600">Save</button>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto flex-1 bg-page pb-20">
        <div className="max-w-[900px] mx-auto bg-white rounded-lg shadow-sm border border-line pb-8">
          
          {/* Deal Image Section */}
          <div className="px-6 py-4 border-b border-line bg-page rounded-t-lg flex items-center justify-between">
            <h3 className="font-semibold text-ink text-[15px]">Deal Image</h3>
          </div>
          
          {/* Deal Information Section */}
          <div className="px-6 py-4 border-b border-line bg-page mt-4">
            <h3 className="font-semibold text-ink text-[15px]">Deal Information</h3>
          </div>
          
          <div className="p-6 grid grid-cols-2 gap-x-8">
            <div>
              <Field label="Deal Owner" required>
                <select className={inputClass} value={data.ownerId || ''} onChange={(e) => handleChange('ownerId', e.target.value)}>
                  <option value="">None</option>
                  {ownerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Deal Name" required>
                <input type="text" className={inputClass} value={data.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
              </Field>
              <Field label="City">
                <input type="text" className={inputClass} value={data.city || ''} onChange={(e) => handleChange('city', e.target.value)} />
              </Field>
              <Field label="Contact Name">
                <select className={inputClass} value={data.contactId || ''} onChange={(e) => handleChange('contactId', e.target.value)}>
                  <option value="">None</option>
                  {contactOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Stage" required>
                <select className={inputClass} value={data.stage || ''} onChange={(e) => handleChange('stage', e.target.value)}>
                  <option value="">None</option>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Closing Date" required>
                <input type="date" className={inputClass} value={data.closingDate || ''} onChange={(e) => handleChange('closingDate', e.target.value)} />
              </Field>
              <Field label="Lead Source">
                <select className={inputClass} value={data.source || ''} onChange={(e) => handleChange('source', e.target.value)}>
                  <option value="">None</option>
                  {DEAL_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="SO_No.">
                <input type="text" className={inputClass} value={data.soNo || ''} onChange={(e) => handleChange('soNo', e.target.value)} />
              </Field>
              <Field label="Probability (%)">
                <input type="number" className={inputClass} value={data.probability || ''} onChange={(e) => handleChange('probability', e.target.value)} />
              </Field>
              <Field label="End User End Date">
                <input type="date" className={inputClass} value={data.endUserEndDate || ''} onChange={(e) => handleChange('endUserEndDate', e.target.value)} />
              </Field>
              <Field label="Remarks">
                <input type="text" className={inputClass} value={data.remarks || ''} onChange={(e) => handleChange('remarks', e.target.value)} />
              </Field>
              <Field label="Submissions Status">
                <select className={inputClass} value={data.submissionsStatus || ''} onChange={(e) => handleChange('submissionsStatus', e.target.value)}>
                  <option value="">None</option>
                  <option value="Pending">Pending</option>
                  <option value="Submitted">Submitted</option>
                </select>
              </Field>
              <Field label="Distributor Order No.">
                <input type="text" className={inputClass} value={data.distributorOrderNo || ''} onChange={(e) => handleChange('distributorOrderNo', e.target.value)} />
              </Field>
            </div>
            
            <div>
              <Field label="Lead Name">
                <input type="text" className={inputClass} value={data.leadName || ''} onChange={(e) => handleChange('leadName', e.target.value)} />
              </Field>
              <Field label="existing/new">
                <select className={inputClass} value={data.existingNew || ''} onChange={(e) => handleChange('existingNew', e.target.value)}>
                  <option value="">None</option>
                  <option value="Existing">Existing</option>
                  <option value="New">New</option>
                </select>
              </Field>
              <Field label="Internal campaign Id">
                <input type="text" className={inputClass} value={data.internalCampaignId || ''} onChange={(e) => handleChange('internalCampaignId', e.target.value)} />
              </Field>
              <Field label="Target Engagement">
                <input type="text" className={inputClass} value={data.targetEngagement || ''} onChange={(e) => handleChange('targetEngagement', e.target.value)} />
              </Field>
              <Field label="Bill Date">
                <input type="date" className={inputClass} value={data.billDate || ''} onChange={(e) => handleChange('billDate', e.target.value)} />
              </Field>
              <Field label="Partner 2 Hardware">
                <input type="text" className={inputClass} value={data.partner2Hardware || ''} onChange={(e) => handleChange('partner2Hardware', e.target.value)} />
              </Field>
              <Field label="Criteria Search">
                <input type="text" className={inputClass} value={data.criteriaSearch || ''} onChange={(e) => handleChange('criteriaSearch', e.target.value)} />
              </Field>
              <Field label="Lead assign">
                <input type="text" className={inputClass} value={data.leadAssign || ''} onChange={(e) => handleChange('leadAssign', e.target.value)} />
              </Field>
              <Field label="Lead Area">
                <input type="text" className={inputClass} value={data.leadArea || ''} onChange={(e) => handleChange('leadArea', e.target.value)} />
              </Field>
              <Field label="Account Name" required>
                <select className={inputClass} value={data.accountId || ''} onChange={(e) => handleChange('accountId', e.target.value)}>
                  <option value="">None</option>
                  {accountOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Amount (INR)" required>
                <input type="number" className={inputClass} value={data.amount || ''} onChange={(e) => handleChange('amount', e.target.value)} />
              </Field>
              <Field label="Hardware Delivery Date">
                <input type="date" className={inputClass} value={data.hardwareDeliveryDate || ''} onChange={(e) => handleChange('hardwareDeliveryDate', e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="px-6 py-4 border-y border-line bg-page">
            <h3 className="font-semibold text-ink text-[15px]">Dealer Details</h3>
          </div>
          
          <div className="p-6 grid grid-cols-2 gap-x-8">
            <div>
              <Field label="Pre-sales Routing">
                <input type="text" className={inputClass} value={data.preSalesRouting || ''} onChange={(e) => handleChange('preSalesRouting', e.target.value)} />
              </Field>
              <Field label="Previous Stage">
                <select className={inputClass} value={data.previousStage || ''} onChange={(e) => handleChange('previousStage', e.target.value)}>
                  <option value="">None</option>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Client Name">
                <input type="text" className={inputClass} value={data.clientName || ''} onChange={(e) => handleChange('clientName', e.target.value)} />
              </Field>
              <Field label="Hardware AMC Date">
                <input type="date" className={inputClass} value={data.hardwareAmcDate || ''} onChange={(e) => handleChange('hardwareAmcDate', e.target.value)} />
              </Field>
              <Field label="Mobile">
                <input type="text" className={inputClass} value={data.mobile || ''} onChange={(e) => handleChange('mobile', e.target.value)} />
              </Field>
              <Field label="Branch No">
                <input type="text" className={inputClass} value={data.branchNo || ''} onChange={(e) => handleChange('branchNo', e.target.value)} />
              </Field>
              <Field label="PO_No">
                <input type="text" className={inputClass} value={data.poNo || ''} onChange={(e) => handleChange('poNo', e.target.value)} />
              </Field>
              <Field label="Cloud Renewal Date">
                <input type="date" className={inputClass} value={data.cloudRenewalDate || ''} onChange={(e) => handleChange('cloudRenewalDate', e.target.value)} />
              </Field>
              <Field label="Probability (%)">
                <input type="number" className={inputClass} value={data.dealerProbability || ''} onChange={(e) => handleChange('dealerProbability', e.target.value)} />
              </Field>
              <Field label="Expected Revenue">
                <input type="number" className={inputClass} value={data.expectedRevenue || ''} onChange={(e) => handleChange('expectedRevenue', e.target.value)} />
              </Field>
              <Field label="Forecast Category">
                <select className={inputClass} value={data.forecastCategory || ''} onChange={(e) => handleChange('forecastCategory', e.target.value)}>
                  <option value="">Pipeline</option>
                  <option value="Closed">Closed</option>
                  <option value="Omitted">Omitted</option>
                </select>
              </Field>
            </div>
            <div>
              <Field label="Estimate provided by">
                <input type="text" className={inputClass} value={data.estimateProvidedBy || ''} onChange={(e) => handleChange('estimateProvidedBy', e.target.value)} />
              </Field>
              <Field label="Campaign Source">
                <input type="text" className={inputClass} value={data.campaignSource || ''} onChange={(e) => handleChange('campaignSource', e.target.value)} />
              </Field>
              <Field label="Contact">
                <input type="text" className={inputClass} value={data.dealerContact || ''} onChange={(e) => handleChange('dealerContact', e.target.value)} />
              </Field>
              <Field label="Comments">
                <input type="text" className={inputClass} value={data.comments || ''} onChange={(e) => handleChange('comments', e.target.value)} />
              </Field>
              <Field label="Invoice_no.">
                <input type="text" className={inputClass} value={data.invoiceNo || ''} onChange={(e) => handleChange('invoiceNo', e.target.value)} />
              </Field>
              <Field label="Type">
                <select className={inputClass} value={data.type || ''} onChange={(e) => handleChange('type', e.target.value)}>
                  <option value="">None</option>
                  <option value="Existing Business">Existing Business</option>
                  <option value="New Business">New Business</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="px-6 py-4 border-y border-line bg-page">
            <h3 className="font-semibold text-ink text-[15px]">Description Information</h3>
          </div>
          
          <div className="p-6">
            <Field label="Description">
              <textarea className={`${inputClass} h-[80px] py-2`} value={data.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
            </Field>
          </div>

          <div className="px-6 py-4 border-y border-line bg-page">
            <h3 className="font-semibold text-ink text-[15px]">Approval Process</h3>
          </div>
          
          <div className="p-6 grid grid-cols-2 gap-x-8">
            <div>
              <Field label="Is L1 Need?">
                <input type="text" className={inputClass} value={data.isL1Need || ''} onChange={(e) => handleChange('isL1Need', e.target.value)} />
              </Field>
              <Field label="Reason for Approval">
                <input type="text" className={inputClass} value={data.reasonForApproval || ''} onChange={(e) => handleChange('reasonForApproval', e.target.value)} />
              </Field>
            </div>
            <div>
              <Field label="L2 Need for Approval">
                <input type="text" className={inputClass} value={data.l2NeedForApproval || ''} onChange={(e) => handleChange('l2NeedForApproval', e.target.value)} />
              </Field>
            </div>
          </div>
          
        </div>
      </div>
    </form>
  );
}
