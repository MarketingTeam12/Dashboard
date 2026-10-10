import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, HelpCircle, Star, MoreVertical,
  FolderOpen, ChevronDown, List, ChevronRight, X
} from 'lucide-react';

const mockReports = [
  { id: 1, name: 'Deals by Stage', description: 'Count of deals in each stage', folder: 'Deal Reports', lastAccessed: 'Oct 10, 2026', favorite: true },
  { id: 2, name: 'Lost Deals', description: 'Deals lost this quarter', folder: 'Deal Reports', lastAccessed: 'Oct 09, 2026', favorite: false },
  { id: 3, name: 'Calls by User', description: 'Call metrics per user', folder: 'Call Reports', lastAccessed: 'Oct 08, 2026', favorite: true },
];

export default function Reports() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFolders, setShowFolders] = useState(false);
  
  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-800">Reports</h1>
          
          <div className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
            All Reports
            <ChevronDown className="w-4 h-4 ml-1" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search All Reports" 
              className="pl-9 pr-4 py-1.5 border rounded text-sm w-64 focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700"
            onClick={() => navigate('/reports/create')}
          >
            Create Report
          </button>
          <HelpCircle className="w-5 h-5 text-gray-400 cursor-pointer" />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar for Folders */}
        <div className="w-64 border-r bg-gray-50 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium text-gray-700 text-sm">Folders</span>
            <button 
              className="text-blue-600 text-sm hover:underline"
              onClick={() => setShowFolders(true)}
            >
              Manage Folders
            </button>
          </div>
          <div className="flex flex-col space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer bg-white border">
              <FolderOpen className="w-4 h-4 text-blue-500" />
              All Reports
            </div>
            <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
              <Star className="w-4 h-4 text-yellow-400" />
              Favorites
            </div>
            <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
              <FolderOpen className="w-4 h-4 text-gray-400" />
              Deal Reports
            </div>
            <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
              <FolderOpen className="w-4 h-4 text-gray-400" />
              Call Reports
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="w-12 p-3 text-center border-b"><input type="checkbox" /></th>
                <th className="w-12 p-3 border-b"></th>
                <th className="p-3 border-b font-medium">Report Name</th>
                <th className="p-3 border-b font-medium">Description</th>
                <th className="p-3 border-b font-medium">Folder</th>
                <th className="p-3 border-b font-medium">Last Accessed</th>
                <th className="w-12 p-3 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {mockReports.map(report => (
                <tr key={report.id} className="border-b hover:bg-gray-50 group">
                  <td className="p-3 text-center"><input type="checkbox" /></td>
                  <td className="p-3">
                    <Star className={`w-4 h-4 cursor-pointer ${report.favorite ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  </td>
                  <td className="p-3">
                    <button 
                      className="text-blue-600 hover:underline font-medium text-left"
                      onClick={() => navigate(`/reports/${report.id}`)}
                    >
                      {report.name}
                    </button>
                  </td>
                  <td className="p-3">{report.description}</td>
                  <td className="p-3">{report.folder}</td>
                  <td className="p-3">{report.lastAccessed}</td>
                  <td className="p-3 text-center">
                    <MoreVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 cursor-pointer inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Folders Modal */}
      {showFolders && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white w-[600px] rounded shadow-lg flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Manage Folders</h2>
              <button onClick={() => setShowFolders(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 flex-1 h-64 overflow-auto">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-gray-500" /> Deal Reports
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-gray-500" /> Call Reports
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
              <button className="px-4 py-1.5 border rounded text-sm" onClick={() => setShowFolders(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

