import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, X, Search } from 'lucide-react';

export default function ReportBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [primaryModule, setPrimaryModule] = useState('Deals');
  const [relatedModules, setRelatedModules] = useState([]);
  
  // Step 1: Select Module Modal
  if (step === 1) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="bg-white w-[500px] rounded shadow flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Select Primary Module</h2>
            <button onClick={() => navigate('/reports')}><X className="w-5 h-5 text-gray-500" /></button>
          </div>
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Module <span className="text-red-500">*</span></label>
            <select 
              className="w-full border rounded p-2 text-sm focus:outline-none focus:border-blue-500"
              value={primaryModule}
              onChange={(e) => setPrimaryModule(e.target.value)}
            >
              <option value="Deals">Deals</option>
              <option value="Calls">Calls</option>
              <option value="Contacts">Contacts</option>
              <option value="Accounts">Accounts</option>
            </select>
          </div>
          <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
            <button className="px-4 py-1.5 border rounded text-sm text-gray-600 hover:bg-gray-100" onClick={() => navigate('/reports')}>Cancel</button>
            <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700" onClick={() => setStep(2)}>Continue</button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Builder
  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <ArrowLeft className="w-5 h-5 text-gray-500 cursor-pointer" onClick={() => navigate('/reports')} />
          <h1 className="text-xl font-semibold text-gray-800">Untitled Report</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-1.5 border rounded text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Save</button>
        </div>
      </div>
      
      {/* Builder Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Module Relationships */}
        <div className="w-64 border-r bg-gray-50 flex flex-col">
          <div className="p-3 border-b font-medium text-sm text-gray-700">Modules</div>
          <div className="p-4 flex-1">
            <div className="bg-white border rounded p-3 text-sm shadow-sm font-medium border-l-4 border-l-blue-500">
              {primaryModule} (Primary)
            </div>
            
            <div className="my-4 relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-300"></div>
              <div className="ml-8 space-y-3">
                {relatedModules.map((mod, i) => (
                  <div key={i} className="bg-white border rounded p-2 text-sm shadow-sm flex justify-between items-center relative">
                    <div className="absolute -left-4 top-1/2 w-4 h-px bg-gray-300"></div>
                    {mod}
                    <Trash2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500" onClick={() => setRelatedModules(relatedModules.filter((_, idx) => idx !== i))} />
                  </div>
                ))}
                
                <button className="text-blue-600 text-sm flex items-center gap-1 hover:underline relative bg-gray-50 z-10 py-1" onClick={() => setRelatedModules([...relatedModules, 'Related Module'])}>
                  <Plus className="w-4 h-4" /> Add Related Module
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side: Columns and Filters */}
        <div className="flex-1 flex flex-col overflow-auto bg-gray-50 p-6">
          <div className="bg-white border rounded shadow-sm flex flex-col mb-6">
            <div className="p-3 border-b font-medium text-sm text-gray-700 flex justify-between">
              Columns
              <button className="text-blue-600 text-sm font-normal">Add Column</button>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 p-2 border rounded text-sm bg-gray-50">
                <span className="text-gray-500">{primaryModule}</span> - Name
              </div>
              <div className="flex items-center gap-2 p-2 border rounded text-sm bg-gray-50">
                <span className="text-gray-500">{primaryModule}</span> - Amount
              </div>
              <div className="flex items-center gap-2 p-2 border rounded text-sm bg-gray-50">
                <span className="text-gray-500">{primaryModule}</span> - Stage
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded shadow-sm flex flex-col">
            <div className="p-3 border-b font-medium text-sm text-gray-700 flex justify-between">
              Filters
              <button className="text-blue-600 text-sm font-normal">Add Filter</button>
            </div>
            <div className="p-4 text-sm text-gray-500 italic">
              No filters added. All records will be included.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

