import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Share2, Download, Printer } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function ReportDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { deals } = useCRM();

  // Aggregate Data for chart and table
  // Group deals by Stage
  const stageDataMap = deals.reduce((acc, deal) => {
    const stage = deal.stage || 'Unknown';
    if (!acc[stage]) acc[stage] = { stage, count: 0, totalAmount: 0 };
    acc[stage].count += 1;
    acc[stage].totalAmount += parseFloat(deal.amount || 0);
    return acc;
  }, {});

  const stageData = Object.values(stageDataMap);
  const grandTotal = stageData.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalRecords = deals.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <ArrowLeft className="w-5 h-5 text-gray-500 cursor-pointer" onClick={() => navigate('/reports')} />
          <h1 className="text-xl font-semibold text-gray-800">Deals by Stage</h1>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Report Folder: Deal Reports</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm text-gray-600 hover:bg-gray-50" onClick={() => navigate('/reports/create')}>
            <Edit2 className="w-4 h-4" /> Edit
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm text-gray-600 hover:bg-gray-50">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm text-gray-600 hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm text-gray-600 hover:bg-gray-50">
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Summary KPIs */}
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded shadow-sm border flex-1">
              <div className="text-sm text-gray-500 mb-1">Total Records</div>
              <div className="text-2xl font-semibold">{totalRecords}</div>
            </div>
            <div className="bg-white p-4 rounded shadow-sm border flex-1">
              <div className="text-sm text-gray-500 mb-1">Sum of Amount</div>
              <div className="text-2xl font-semibold">${grandTotal.toLocaleString()}</div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="bg-white p-4 rounded shadow-sm border h-80">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Deals by Stage (Amount)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                <Bar dataKey="totalAmount" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Grouped Table Data */}
          <div className="bg-white rounded shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 border-b">
                <tr>
                  <th className="p-3 font-medium">Stage</th>
                  <th className="p-3 font-medium text-right">Record Count</th>
                  <th className="p-3 font-medium text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {stageData.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{row.stage}</td>
                    <td className="p-3 text-right">{row.count}</td>
                    <td className="p-3 text-right">${row.totalAmount.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold text-gray-800">
                  <td className="p-3 text-right">Grand Total</td>
                  <td className="p-3 text-right">{totalRecords}</td>
                  <td className="p-3 text-right">${grandTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

