const fs = require('fs');

let c = fs.readFileSync('src/pages/Deals/DealDetail.jsx', 'utf8');

const importsToAdd = `import Modal from '../../components/common/Modal';\n`;
if (!c.includes("import Modal")) {
  c = c.replace(/import \{ useCRM \}/, importsToAdd + 'import { useCRM }');
}

const modalComponent = `
function StageTransitionModal({ open, targetStage, deal, onClose, onSave }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        salesNo: deal.salesNo || '',
        amount: deal.amount || '',
        closingDate: deal.closingDate || '',
        reasonForLost: deal.reasonForLost || ''
      });
      setError('');
    }
  }, [open, deal]);

  const handleSave = () => {
    if (targetStage === 'Deal Closed (Won)' || targetStage === 'Deal Job Seeking & Agency') {
      if (!formData.salesNo) {
        setError('Sales_No is required');
        return;
      }
      onSave({ salesNo: formData.salesNo });
    } else if (targetStage === 'Pre-Deal Lost') {
      if (!formData.amount || !formData.closingDate) {
        setError('Amount and Closing Date are required');
        return;
      }
      onSave({ amount: formData.amount, closingDate: formData.closingDate });
    } else if (targetStage === 'Deal Closed (Lost)') {
      if (!formData.reasonForLost) {
        setError('Reason for Closed lost is required');
        return;
      }
      onSave({ reasonForLost: formData.reasonForLost });
    }
  };

  if (!open) return null;

  const isReview = targetStage !== 'Pre-Deal Lost';
  const title = isReview ? 'Review Details' : 'Verify Details';

  return (
    <Modal open={open} onClose={onClose} title={title} size="md" footer={
      <>
        <button onClick={onClose} className="btn-secondary px-4">Cancel</button>
        <button onClick={handleSave} className="btn-primary px-4 bg-[#1E40AF] hover:bg-[#1e3a8a] text-white">Save</button>
      </>
    }>
      <div className="py-2">
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        
        {targetStage === 'Pre-Deal Lost' && (
          <p className="text-sm text-ink-600 mb-4 font-medium">Since Stage IS Closed Lost (Record Category), verify the following details</p>
        )}

        <div className="space-y-4">
          {(targetStage === 'Deal Closed (Won)' || targetStage === 'Deal Job Seeking & Agency') && (
            <div>
              <label className="block text-sm text-ink-600 mb-1">Sales_No <span className="text-red-500">*</span></label>
              <input type="text" className="input-field w-full" value={formData.salesNo} onChange={e => setFormData({ ...formData, salesNo: e.target.value })} />
            </div>
          )}

          {targetStage === 'Pre-Deal Lost' && (
             <>
               <div>
                 <label className="block text-sm text-ink-600 mb-1">Amount <span className="text-red-500">*</span></label>
                 <input type="number" className="input-field w-full" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
               </div>
               <div>
                 <label className="block text-sm text-ink-600 mb-1">Closing Date <span className="text-red-500">*</span></label>
                 <input type="date" className="input-field w-full" value={formData.closingDate} onChange={e => setFormData({ ...formData, closingDate: e.target.value })} />
               </div>
             </>
          )}

          {targetStage === 'Deal Closed (Lost)' && (
             <div>
               <label className="block text-sm text-ink-600 mb-1">Reason for Closed lost <span className="text-red-500">*</span></label>
               <textarea className="input-field w-full" rows="3" value={formData.reasonForLost} onChange={e => setFormData({ ...formData, reasonForLost: e.target.value })}></textarea>
             </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
`;

if (!c.includes("StageTransitionModal")) {
  c = c.replace(/export default function DealDetail/, modalComponent + '\nexport default function DealDetail');
}

c = c.replace(/const \[previewStage, setPreviewStage\] = useState\\(null\\);/, "const [previewStage, setPreviewStage] = useState(null);\n  const [transitionTarget, setTransitionTarget] = useState(null);");

c = c.replace(/const handleUpdate = \\(field, value\\) => \\{\\s*updateRecord\\('deals', deal\\.id, \\{ \\[field\\]: value \\}\\);\\s*\\};/, `const handleUpdate = (field, value) => {
    updateRecord('deals', deal.id, { [field]: value });
  };

  const initiateStageTransition = (targetStage) => {
    const specialStages = ['Deal Closed (Won)', 'Deal Job Seeking & Agency', 'Pre-Deal Lost', 'Deal Closed (Lost)'];
    if (specialStages.includes(targetStage)) {
      setTransitionTarget(targetStage);
    } else {
      handleUpdate('stage', targetStage);
      setPreviewStage(null);
    }
  };

  const confirmStageTransition = (updates) => {
    updateRecord('deals', deal.id, { ...updates, stage: transitionTarget });
    setTransitionTarget(null);
    setPreviewStage(null);
  };
`);

// Replace stage update calls
c = c.replace(/onClick=\{\(\) => \{ handleUpdate\('stage', previewStage\); setPreviewStage\(null\); \}\}/g, "onClick={() => initiateStageTransition(previewStage)}");
c = c.replace(/onClick=\{\(\) => handleUpdate\('stage', 'Deal Closed \\(Won\\)'\)\}/g, "onClick={() => initiateStageTransition('Deal Closed (Won)')}");
c = c.replace(/onClick=\{\(\) => handleUpdate\('stage', 'Closed Lost'\)\}/g, "onClick={() => initiateStageTransition('Deal Closed (Lost)')}");

// Add the modal component to JSX
if (!c.includes("<StageTransitionModal open={!!transitionTarget}")) {
  c = c.replace(/\{activeTab === 'Timeline' && \(/, \`<StageTransitionModal open={!!transitionTarget} targetStage={transitionTarget} deal={deal} onClose={() => setTransitionTarget(null)} onSave={confirmStageTransition} />\n\n        {activeTab === 'Timeline' && (\`);
}

fs.writeFileSync('src/pages/Deals/DealDetail.jsx', c);
console.log('Update script finished');

