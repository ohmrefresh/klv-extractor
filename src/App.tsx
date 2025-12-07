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
    <div className="h-screen flex flex-col overflow-hidden grid-background" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex-shrink-0 border-b-4 border-[var(--border-color)] px-8 py-6" style={{
        background: 'var(--bg-secondary)',
        boxShadow: '0 8px 0 rgba(0, 255, 136, 0.1)'
      }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl mb-2" style={{ color: 'var(--accent-primary)' }}>
              KLV DATA EXTRACTION
            </h1>
            <p className="text-sm" style={{
              color: 'var(--text-secondary)',
              fontFamily: "'Fira Code', monospace",
              letterSpacing: '0.1em'
            }}>
              ▸ TRANSACTION PARSER v2.1.0
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="pulse-animate w-3 h-3 rounded-full" style={{ background: 'var(--accent-primary)' }}></div>
            <span className="text-xs" style={{
              color: 'var(--text-muted)',
              fontFamily: "'Fira Code', monospace"
            }}>
              SYSTEM READY
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-shrink-0" style={{ background: 'var(--bg-primary)' }}>
        <nav className="flex gap-2 px-8 pt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-3 border-3 font-bold text-sm transition-all uppercase tracking-wider ${
                  isActive ? 'glow-effect' : ''
                }`}
                style={{
                  background: isActive ? 'var(--bg-secondary)' : 'transparent',
                  border: `3px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: isActive ? '4px 4px 0 rgba(0, 255, 136, 0.3)' : '4px 4px 0 rgba(0, 0, 0, 0.2)',
                  transform: isActive ? 'translate(-1px, -1px)' : 'none'
                }}
              >
                <Icon size={18} />
                <span style={{ fontFamily: "'Work Sans', sans-serif" }}>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
            {/* KLV Extractor Tab */}
            {activeTab === 'extractor' && (
              <div className="space-y-8">
                {/* Input Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="animate-slide-in stagger-1">
                    <label className="block font-bold mb-3 text-lg uppercase tracking-wide" style={{
                      color: 'var(--accent-primary)',
                      fontFamily: "'Work Sans', sans-serif"
                    }}>
                      ▸ Input Data
                    </label>
                    <textarea
                      value={klvInput}
                      onChange={(e) => setKlvInput(e.target.value)}
                      placeholder="PASTE KLV DATA HERE..."
                      className="w-full input-brutal scan-effect text-sm resize-none"
                      rows={6}
                      style={{
                        fontFamily: "'Fira Code', monospace",
                        fontSize: '0.875rem',
                        lineHeight: '1.5'
                      }}
                    />
                    <div className="flex gap-3 mt-4 flex-wrap">
                      <button
                        onClick={() => setKlvInput('')}
                        className="flex items-center gap-2 px-4 py-2 border-3 text-xs font-bold uppercase tracking-wider transition-all"
                        style={{
                          background: 'transparent',
                          border: '3px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          boxShadow: '3px 3px 0 rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                          e.currentTarget.style.color = 'var(--accent-secondary)';
                          e.currentTarget.style.transform = 'translate(-1px, -1px)';
                          e.currentTarget.style.boxShadow = '4px 4px 0 rgba(255, 107, 0, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '3px 3px 0 rgba(0, 0, 0, 0.2)';
                        }}
                      >
                        <Trash2 size={14} />
                        Clear
                      </button>
                      {sampleData.map((sample, i) => (
                        <button
                          key={i}
                          onClick={() => setKlvInput(sample)}
                          className="px-4 py-2 border-3 text-xs font-bold uppercase tracking-wider transition-all"
                          style={{
                            background: 'var(--bg-tertiary)',
                            border: '3px solid var(--accent-primary)',
                            color: 'var(--accent-primary)',
                            boxShadow: '3px 3px 0 rgba(0, 255, 136, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--accent-primary)';
                            e.currentTarget.style.color = 'var(--bg-primary)';
                            e.currentTarget.style.transform = 'translate(-1px, -1px)';
                            e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0, 255, 136, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--bg-tertiary)';
                            e.currentTarget.style.color = 'var(--accent-primary)';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '3px 3px 0 rgba(0, 255, 136, 0.2)';
                          }}
                        >
                          Sample {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="animate-slide-in stagger-2">
                    <label className="block font-bold mb-3 text-lg uppercase tracking-wide" style={{
                      color: 'var(--accent-primary)',
                      fontFamily: "'Work Sans', sans-serif"
                    }}>
                      ▸ File Upload
                    </label>
                    <FileUpload onFileLoad={handleFileLoad} />
                  </div>
                </div>

                {/* Results Section */}
                {(results.length > 0 || errors.length > 0) && (
                  <>
                    <div className="animate-slide-in stagger-3">
                      <Statistics results={results} />
                    </div>

                    {/* Error Display */}
                    {errors.length > 0 && (
                      <div className="animate-slide-in stagger-4 p-6 border-3" style={{
                        background: 'rgba(255, 71, 87, 0.1)',
                        borderColor: 'var(--error-color)',
                        borderLeftWidth: '8px',
                        boxShadow: '6px 6px 0 rgba(255, 71, 87, 0.2)'
                      }}>
                        <div className="flex items-center mb-3">
                          <svg className="w-6 h-6 mr-3" fill="var(--error-color)" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span className="font-bold text-lg uppercase tracking-wide" style={{
                            color: 'var(--error-color)',
                            fontFamily: "'Work Sans', sans-serif"
                          }}>
                            Parsing Errors Detected
                          </span>
                        </div>
                        <div className="text-sm space-y-2" style={{ fontFamily: "'Fira Code', monospace" }}>
                          {errors.map((error, index) => (
                            <div key={index} className="flex items-start gap-3" style={{ color: 'var(--text-primary)' }}>
                              <span style={{ color: 'var(--error-color)' }}>▸</span>
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Success and Data Display */}
                    {results.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-6 animate-slide-in stagger-4">
                          <div>
                            <h3 className="text-3xl mb-1" style={{
                              color: 'var(--accent-primary)',
                              fontFamily: "'Bebas Neue', sans-serif",
                              letterSpacing: '0.05em'
                            }}>
                              PARSED DATA
                            </h3>
                            <p className="text-sm" style={{
                              color: 'var(--text-muted)',
                              fontFamily: "'Fira Code', monospace"
                            }}>
                              {results.length} {results.length === 1 ? 'entry' : 'entries'} extracted
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                              <input
                                type="text"
                                placeholder="SEARCH..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-brutal pl-12 pr-4 py-3 text-sm w-64"
                                style={{ fontFamily: "'Fira Code', monospace" }}
                              />
                            </div>

                            {/* Toggle Raw View */}
                            <button
                              onClick={() => setShowRaw(!showRaw)}
                              className="flex items-center gap-2 px-4 py-3 border-3 text-xs font-bold uppercase tracking-wider transition-all"
                              style={{
                                background: showRaw ? 'var(--accent-tertiary)' : 'transparent',
                                border: `3px solid ${showRaw ? 'var(--accent-tertiary)' : 'var(--border-color)'}`,
                                color: showRaw ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                boxShadow: showRaw ? '4px 4px 0 rgba(0, 212, 255, 0.3)' : '3px 3px 0 rgba(0, 0, 0, 0.2)'
                              }}
                            >
                              {showRaw ? <EyeOff size={16} /> : <Eye size={16} />}
                              {showRaw ? 'Hide' : 'Raw'}
                            </button>

                            {/* Export */}
                            <ExportPanel results={filteredResults} />
                          </div>
                        </div>

                        {/* Raw Data Display */}
                        {showRaw && (
                          <div className="mb-6 p-5 border-3 scan-effect" style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--accent-tertiary)',
                            fontFamily: "'Fira Code', monospace",
                            fontSize: '0.875rem',
                            wordBreak: 'break-all',
                            boxShadow: '6px 6px 0 rgba(0, 212, 255, 0.2)'
                          }}>
                            <span style={{ color: 'var(--accent-tertiary)', fontWeight: 600 }}>RAW_KLV: </span>
                            <span style={{ color: 'var(--text-primary)' }}>{klvInput.replace(/\s/g, '')}</span>
                          </div>
                        )}

                        {/* KLV Entries */}
                        <div className="space-y-4">
                          {filteredResults.map((item, i) => (
                            <div
                              key={i}
                              className="card-brutal p-5 animate-slide-in"
                              style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="tag-brutal" style={{
                                    borderColor: 'var(--accent-primary)',
                                    color: 'var(--accent-primary)'
                                  }}>
                                    KEY {item.key}
                                  </span>
                                  <span className="font-bold text-base uppercase tracking-wide" style={{
                                    color: 'var(--text-primary)',
                                    fontFamily: "'Work Sans', sans-serif"
                                  }}>
                                    {item.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-1 border-2" style={{
                                      background: 'var(--bg-primary)',
                                      borderColor: 'var(--border-color)',
                                      color: 'var(--text-muted)',
                                      fontFamily: "'Fira Code', monospace"
                                    }}>
                                      LEN:{item.len}
                                    </span>
                                    <span className="text-xs px-2 py-1 border-2" style={{
                                      background: 'var(--bg-primary)',
                                      borderColor: 'var(--border-color)',
                                      color: 'var(--text-muted)',
                                      fontFamily: "'Fira Code', monospace"
                                    }}>
                                      POS:{item.pos}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(item.value)}
                                  className="p-3 border-3 transition-all"
                                  style={{
                                    background: 'transparent',
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-secondary)',
                                    boxShadow: '3px 3px 0 rgba(0, 0, 0, 0.2)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                    e.currentTarget.style.color = 'var(--accent-primary)';
                                    e.currentTarget.style.transform = 'translate(-1px, -1px)';
                                    e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0, 255, 136, 0.3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '3px 3px 0 rgba(0, 0, 0, 0.2)';
                                  }}
                                  title="Copy value"
                                >
                                  <Copy size={18} />
                                </button>
                              </div>

                              <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{
                                  color: 'var(--text-muted)',
                                  fontFamily: "'Work Sans', sans-serif"
                                }}>
                                  ▸ Value
                                </label>
                                <div className="p-4 border-3" style={{
                                  background: 'var(--bg-tertiary)',
                                  borderColor: 'var(--border-color)',
                                  fontFamily: "'Fira Code', monospace",
                                  fontSize: '0.875rem',
                                  wordBreak: 'break-all',
                                  boxShadow: 'inset 2px 2px 0 rgba(0, 0, 0, 0.2)'
                                }}>
                                  {item.formattedValue ? (
                                    <div>
                                      <div className="mb-2 font-semibold" style={{ color: 'var(--accent-tertiary)' }}>
                                        {item.formattedValue}
                                      </div>
                                      <div className="text-xs pt-2 border-t-2" style={{
                                        color: 'var(--text-muted)',
                                        borderColor: 'var(--border-color)'
                                      }}>
                                        RAW: {item.value}
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-primary)' }}>
                                      {item.value || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>[EMPTY]</span>}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* No Search Results */}
                        {filteredResults.length === 0 && searchTerm && (
                          <div className="text-center py-16">
                            <Search className="mx-auto mb-6" size={64} style={{ color: 'var(--border-color)' }} />
                            <div className="text-lg mb-2" style={{ color: 'var(--text-secondary)', fontFamily: "'Work Sans', sans-serif" }}>
                              NO RESULTS FOR "{searchTerm}"
                            </div>
                            <button
                              onClick={() => setSearchTerm('')}
                              className="mt-4 btn-secondary"
                            >
                              Clear Search
                            </button>
                          </div>
                        )}

                        {/* Add to History */}
                        {results.length > 0 && errors.length === 0 && (
                          <div className="mt-8 text-center">
                            <button
                              onClick={() => addToHistory(klvInput, `${results.length} entries - ${new Date().toLocaleTimeString()}`)}
                              className="btn-primary"
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
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl" style={{
                      color: 'var(--accent-primary)',
                      fontFamily: "'Bebas Neue', sans-serif"
                    }}>
                      PROCESSING HISTORY
                    </h3>
                    <p className="text-sm mt-1" style={{
                      color: 'var(--text-muted)',
                      fontFamily: "'Fira Code', monospace"
                    }}>
                      {history.length} saved {history.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={() => setHistory([])}
                      className="px-4 py-3 border-3 text-xs font-bold uppercase tracking-wider transition-all"
                      style={{
                        background: 'transparent',
                        border: '3px solid var(--error-color)',
                        color: 'var(--error-color)',
                        boxShadow: '4px 4px 0 rgba(255, 71, 87, 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--error-color)';
                        e.currentTarget.style.color = 'var(--bg-primary)';
                        e.currentTarget.style.transform = 'translate(-1px, -1px)';
                        e.currentTarget.style.boxShadow = '5px 5px 0 rgba(255, 71, 87, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--error-color)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '4px 4px 0 rgba(255, 71, 87, 0.2)';
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-16">
                    <Copy className="mx-auto mb-6" size={64} style={{ color: 'var(--border-color)' }} />
                    <div className="text-lg mb-2" style={{
                      color: 'var(--text-secondary)',
                      fontFamily: "'Work Sans', sans-serif",
                      fontWeight: 600
                    }}>
                      NO HISTORY YET
                    </div>
                    <div className="text-sm" style={{
                      color: 'var(--text-muted)',
                      fontFamily: "'Fira Code', monospace"
                    }}>
                      Parse KLV data and save it to see entries here
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="card-brutal p-5 animate-slide-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="font-bold text-base uppercase tracking-wide" style={{
                              color: 'var(--text-primary)',
                              fontFamily: "'Work Sans', sans-serif"
                            }}>
                              {entry.label}
                            </span>
                            <div className="text-xs mt-1" style={{
                              color: 'var(--text-muted)',
                              fontFamily: "'Fira Code', monospace"
                            }}>
                              {entry.timestamp} • {entry.resultCount} entries
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => copyToClipboard(entry.data)}
                              className="px-4 py-2 border-3 text-xs font-bold uppercase tracking-wider transition-all"
                              style={{
                                background: 'transparent',
                                border: '3px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                boxShadow: '3px 3px 0 rgba(0, 0, 0, 0.2)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                                e.currentTarget.style.color = 'var(--accent-secondary)';
                                e.currentTarget.style.transform = 'translate(-1px, -1px)';
                                e.currentTarget.style.boxShadow = '4px 4px 0 rgba(255, 107, 0, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '3px 3px 0 rgba(0, 0, 0, 0.2)';
                              }}
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => loadFromHistory(entry.data)}
                              className="px-4 py-2 border-3 text-xs font-bold uppercase tracking-wider transition-all"
                              style={{
                                background: 'var(--bg-tertiary)',
                                border: '3px solid var(--accent-primary)',
                                color: 'var(--accent-primary)',
                                boxShadow: '3px 3px 0 rgba(0, 255, 136, 0.2)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--accent-primary)';
                                e.currentTarget.style.color = 'var(--bg-primary)';
                                e.currentTarget.style.transform = 'translate(-1px, -1px)';
                                e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0, 255, 136, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--bg-tertiary)';
                                e.currentTarget.style.color = 'var(--accent-primary)';
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '3px 3px 0 rgba(0, 255, 136, 0.2)';
                              }}
                            >
                              Load
                            </button>
                          </div>
                        </div>
                        <div className="p-4 border-3" style={{
                          background: 'var(--bg-tertiary)',
                          borderColor: 'var(--border-color)',
                          fontFamily: "'Fira Code', monospace",
                          fontSize: '0.75rem',
                          wordBreak: 'break-all',
                          color: 'var(--text-muted)',
                          boxShadow: 'inset 2px 2px 0 rgba(0, 0, 0, 0.2)'
                        }}>
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
      <div className="flex-shrink-0 border-t-4 px-8 py-4" style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        boxShadow: '0 -4px 0 rgba(0, 255, 136, 0.1)'
      }}>
        <div className="flex items-center gap-8 text-xs" style={{ fontFamily: "'Fira Code', monospace" }}>
          <div className="flex items-center gap-2">
            <Info size={16} style={{ color: 'var(--accent-primary)' }} />
            <strong style={{ color: 'var(--text-primary)' }}>FORMAT:</strong>
            <span style={{ color: 'var(--accent-tertiary)' }}>KKKLLVVV...</span>
          </div>
          <div className="flex items-center gap-2">
            <strong style={{ color: 'var(--text-primary)' }}>EXAMPLE:</strong>
            <span style={{ color: 'var(--accent-tertiary)' }}>00206AB48DE</span>
          </div>
          <div className="flex items-center gap-2">
            <strong style={{ color: 'var(--text-primary)' }}>KEYS:</strong>
            <span style={{ color: 'var(--text-secondary)' }}>002-999</span>
            <span style={{ color: 'var(--text-muted)' }}>({Object.keys(KLVParser.definitions).length} defined)</span>
          </div>
          <div className="flex items-center gap-2">
            <strong style={{ color: 'var(--text-primary)' }}>EXPORT:</strong>
            <span style={{ color: 'var(--text-secondary)' }}>JSON • CSV • TABLE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;