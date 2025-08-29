import React, { useState, useMemo } from 'react';
import { Search, Copy, Trash2, Eye, EyeOff, Info, Database, Settings, FileText } from 'lucide-react';

// Import components
import FileUpload from './components/FileUpload';
import ExportPanel from './components/ExportPanel';
import Statistics from './components/Statistics';
import KLVBuilder from './components/KLVBuilder';
import BatchProcessor from './components/BatchProcessor';

// Import utilities
import KLVParser, { KLVEntry } from './utils/KLVParser';

interface HistoryEntry {
  id: number;
  label: string;
  data: string;
  timestamp: string;
  resultCount: number;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface BatchResult {
  line: number;
  input: string;
  results: KLVEntry[];
  errors: string[];
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('extractor');
  const [klvInput, setKlvInput] = useState<string>('00206AB48DE026044577');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showRaw, setShowRaw] = useState<boolean>(false);
  const [, setBatchResults] = useState<BatchResult[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Parse KLV data
  const { results, errors } = useMemo(() => KLVParser.parse(klvInput), [klvInput]);

  // Filter results based on search
  const filteredResults = useMemo(() => {
    if (!searchTerm) return results;
    const term = searchTerm.toLowerCase();
    return results.filter(item => 
      item.key.includes(searchTerm) ||
      item.value.toLowerCase().includes(term) ||
      item.name.toLowerCase().includes(term)
    );
  }, [results, searchTerm]);

  // Tab configuration
  const tabs: Tab[] = [
    { id: 'extractor', label: 'Extractor', icon: Database },
    { id: 'builder', label: 'Builder', icon: Settings },
    { id: 'batch', label: 'Batch', icon: FileText },
    { id: 'history', label: 'History', icon: Copy }
  ];

  // Sample data for testing
  const sampleData = [
    '00206AB48DE026044577',
    '04210000050010008USD04305Test Merchant25103EMV25107Visa',
    '04210050026055422600512345678042036MERCHANT_ID_12343015Test Transaction'
  ];

  // Utility functions
  const addToHistory = (data: string, label?: string) => {
    const entry: HistoryEntry = {
      id: Date.now(),
      label: label || `Entry ${history.length + 1}`,
      data,
      timestamp: new Date().toLocaleString(),
      resultCount: KLVParser.parse(data).results.length
    };
    setHistory([entry, ...history.slice(0, 9)]); // Keep last 10
  };

  const loadFromHistory = (data: string) => {
    setKlvInput(data);
    setActiveTab('extractor');
  };

  const handleFileLoad = (content: string, filename: string) => {
    setKlvInput(content);
    addToHistory(content, `File: ${filename}`);
    setActiveTab('extractor');
  };

  const handleBatchProcess = (results: BatchResult[]) => {
    setBatchResults(results);
  };

  const handleBuilderResult = (klvString: string) => {
    setKlvInput(klvString);
    addToHistory(klvString, 'Built KLV');
    setActiveTab('extractor');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            KLV Data Extraction Suite
          </h1>
          <p className="text-gray-600">
            Complete toolkit for KLV data processing, parsing, and analysis
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* KLV Extractor Tab */}
            {activeTab === 'extractor' && (
              <div className="space-y-6">
                {/* Input Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium mb-2 text-gray-700">
                      KLV Data Input
                    </label>
                    <textarea
                      value={klvInput}
                      onChange={(e) => setKlvInput(e.target.value)}
                      placeholder="Enter KLV data (e.g., 00206AB48DE026044577)..."
                      className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <button
                        onClick={() => setKlvInput('')}
                        className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                      >
                        <Trash2 size={14} />
                        Clear
                      </button>
                      {sampleData.map((sample, i) => (
                        <button
                          key={i}
                          onClick={() => setKlvInput(sample)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                        >
                          Sample {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block font-medium mb-2 text-gray-700">
                      File Upload
                    </label>
                    <FileUpload onFileLoad={handleFileLoad} />
                  </div>
                </div>

                {/* Results Section */}
                {(results.length > 0 || errors.length > 0) && (
                  <>
                    <Statistics results={results} />
                    
                    {/* Error Display */}
                    {errors.length > 0 && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex items-center mb-2">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-800 font-medium">Parsing Errors</span>
                          </div>
                        </div>
                        <div className="text-red-700 text-sm">
                          <ul className="list-disc list-inside space-y-1">
                            {errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Success and Data Display */}
                    {results.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg text-gray-800">
                            Parsed KLV Data ({results.length} entries)
                          </h3>
                          <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
                              <input
                                type="text"
                                placeholder="Search keys, values, names..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-2 border border-gray-300 rounded text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            {/* Toggle Raw View */}
                            <button
                              onClick={() => setShowRaw(!showRaw)}
                              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                            >
                              {showRaw ? <EyeOff size={16} /> : <Eye size={16} />}
                              {showRaw ? 'Hide Raw' : 'Show Raw'}
                            </button>
                            
                            {/* Export */}
                            <ExportPanel results={filteredResults} />
                          </div>
                        </div>

                        {/* Raw Data Display */}
                        {showRaw && (
                          <div className="mb-4 p-3 bg-gray-100 rounded border font-mono text-sm break-all">
                            <span className="text-gray-600">Raw KLV: </span>
                            <span className="text-gray-800">{klvInput.replace(/\s/g, '')}</span>
                          </div>
                        )}

                        {/* KLV Entries */}
                        <div className="space-y-3">
                          {filteredResults.map((item, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-mono font-medium">
                                    Key {item.key}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {item.name}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    Len: {item.len}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    Pos: {item.pos}
                                  </span>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(item.value)}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                  title="Copy value"
                                >
                                  <Copy size={16} />
                                </button>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Value
                                </label>
                                <div className="bg-gray-50 border p-3 rounded font-mono text-sm break-all text-gray-800">
                                  {item.formattedValue ? (
                                    <div>
                                      <div className="mb-1 font-medium text-blue-700">{item.formattedValue}</div>
                                      <div className="text-xs text-gray-500">Raw: {item.value}</div>
                                    </div>
                                  ) : (
                                    item.value || <span className="text-gray-400 italic">Empty</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* No Search Results */}
                        {filteredResults.length === 0 && searchTerm && (
                          <div className="text-center py-12">
                            <Search className="mx-auto mb-4 text-gray-300" size={48} />
                            <div className="text-gray-500">
                              No entries match "{searchTerm}"
                            </div>
                            <button
                              onClick={() => setSearchTerm('')}
                              className="mt-2 px-3 py-1 text-blue-600 hover:text-blue-800"
                            >
                              Clear search
                            </button>
                          </div>
                        )}

                        {/* Add to History */}
                        {results.length > 0 && errors.length === 0 && (
                          <div className="mt-6 text-center">
                            <button
                              onClick={() => addToHistory(klvInput, `${results.length} entries - ${new Date().toLocaleTimeString()}`)}
                              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm transition-colors"
                            >
                              Save to History
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* KLV Builder Tab */}
            {activeTab === 'builder' && <KLVBuilder onBuild={handleBuilderResult} />}

            {/* Batch Processor Tab */}
            {activeTab === 'batch' && (
              <div className="space-y-6">
                <BatchProcessor onProcess={handleBatchProcess} />
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Processing History</h3>
                  {history.length > 0 && (
                    <button
                      onClick={() => setHistory([])}
                      className="px-3 py-1 text-red-600 border border-red-300 rounded text-sm hover:bg-red-50 transition-colors"
                    >
                      Clear All History
                    </button>
                  )}
                </div>
                
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <Copy className="mx-auto mb-4 text-gray-300" size={48} />
                    <div className="text-gray-500 mb-2">
                      No processing history yet
                    </div>
                    <div className="text-gray-400 text-sm">
                      Parse some KLV data and save it to see it here
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-medium text-gray-900">{entry.label}</span>
                            <div className="text-xs text-gray-500 mt-1">
                              {entry.timestamp} • {entry.resultCount} entries
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(entry.data)}
                              className="px-3 py-1 text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => loadFromHistory(entry.data)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                            >
                              Load
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 border p-3 rounded font-mono text-xs break-all text-gray-600">
                          {entry.data.length > 200 ? `${entry.data.slice(0, 200)}...` : entry.data}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Reference Footer */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-3 flex items-center text-gray-800">
            <Info className="mr-2" size={16} />
            KLV Format Quick Reference
          </h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <strong className="text-blue-800">Format Structure:</strong>
              <div className="text-blue-700 mt-1">KKKLLVVV...</div>
              <div className="text-blue-600 text-xs mt-1">3-digit Key + 2-digit Length + Value</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <strong className="text-green-800">Example:</strong>
              <div className="text-green-700 mt-1 font-mono">00206AB48DE</div>
              <div className="text-green-600 text-xs mt-1">Key=002, Len=06, Val=AB48DE</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <strong className="text-purple-800">Key Range:</strong>
              <div className="text-purple-700 mt-1">002 - 999</div>
              <div className="text-purple-600 text-xs mt-1">{Object.keys(KLVParser.definitions).length} defined keys</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <strong className="text-yellow-800">Features:</strong>
              <div className="text-yellow-700 mt-1">Parse, Build, Batch</div>
              <div className="text-yellow-600 text-xs mt-1">Export to JSON, CSV, Table</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;