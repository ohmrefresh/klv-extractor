import React, { useState } from 'react';
import { Trash2, Plus, AlertCircle, Copy, CheckCircle, Info, Eye } from 'lucide-react';
import KLVParser, { KLVBuildEntry } from '../utils/KLVParser';

interface KLVBuilderProps {
  onBuild: (klvString: string) => void;
}

const KLVBuilder: React.FC<KLVBuilderProps> = ({ onBuild }) => {
  const [entries, setEntries] = useState<KLVBuildEntry[]>([{ key: '002', value: '' }]);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchKey, setSearchKey] = useState<string>('');

  const getDuplicateKeys = (): Set<string> => {
    const keyCounts = new Map<string, number>();
    entries.forEach(entry => {
      keyCounts.set(entry.key, (keyCounts.get(entry.key) || 0) + 1);
    });
    return new Set(
      Array.from(keyCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([key, _]) => key)
    );
  };

  const hasDuplicates = (): boolean => {
    return getDuplicateKeys().size > 0;
  };

  const getAvailableKeys = (): string[] => {
    const usedKeys = new Set(entries.map(e => e.key));
    return Object.keys(KLVParser.definitions).filter(key => !usedKeys.has(key));
  };

  const addEntry = () => {
    const availableKeys = getAvailableKeys();
    const nextKey = availableKeys.length > 0 ? availableKeys[0] : '002';
    setEntries([...entries, { key: nextKey, value: '' }]);
  };

  const updateEntry = (index: number, field: keyof KLVBuildEntry, value: string) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const buildKLV = () => {
    if (hasDuplicates()) {
      return;
    }
    const klvString = KLVParser.build(entries);
    if (klvString) {
      onBuild(klvString);
    }
  };

  const clearAll = () => {
    setEntries([{ key: '002', value: '' }]);
    setSearchKey('');
  };

  const copyPreview = async () => {
    const klvString = KLVParser.build(entries);
    if (klvString) {
      await navigator.clipboard.writeText(klvString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getFilteredDefinitions = () => {
    if (!searchKey.trim()) return Object.entries(KLVParser.definitions);
    const term = searchKey.toLowerCase();
    return Object.entries(KLVParser.definitions).filter(([key, name]) => 
      key.includes(term) || name.toLowerCase().includes(term)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-lg">KLV Builder</h3>
          <p className="text-xs text-gray-500 mt-1">Build KLV strings by adding key-value pairs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-red-600 border border-red-300 rounded hover:bg-red-50 text-sm transition-colors"
            title="Clear all entries"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-blue-600" />
          <span className="text-gray-700">
            <strong>{entries.length}</strong> {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <div className="text-gray-700">
          <strong>{entries.filter(e => e.value).length}</strong> with values
        </div>
        {hasDuplicates() && (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle size={16} />
            <strong>{getDuplicateKeys().size}</strong> duplicate keys
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {entries.map((entry, index) => {
          const duplicateKeys = getDuplicateKeys();
          const isDuplicate = duplicateKeys.has(entry.key);
          const keyName = KLVParser.definitions[entry.key as keyof typeof KLVParser.definitions];
          
          return (
            <div key={index} className={`flex flex-wrap sm:flex-nowrap gap-3 items-start p-3 sm:p-4 border-2 rounded-lg transition-all ${isDuplicate ? 'border-red-400 bg-red-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
              {/* Entry Number Badge */}
              <div className="flex-shrink-0 pt-1 order-1 sm:order-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isDuplicate ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                  {index + 1}
                </div>
              </div>

              {/* Key Selection */}
              <div className="flex-shrink-0 w-full sm:w-auto sm:min-w-[200px] order-3 sm:order-none">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Key {isDuplicate && <span className="text-red-600">⚠ Duplicate!</span>}
                </label>
                <select
                  value={entry.key}
                  onChange={(e) => updateEntry(index, 'key', e.target.value)}
                  className={`w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 ${isDuplicate ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'}`}
                >
                  {Object.entries(KLVParser.definitions).map(([key, name]) => (
                    <option key={key} value={key}>
                      {key} - {name}
                    </option>
                  ))}
                </select>
                {keyName && !isDuplicate && (
                  <p className="text-xs text-gray-500 mt-1 truncate" title={keyName}>
                    {keyName}
                  </p>
                )}
              </div>
              
              {/* Value Input */}
              <div className="flex-1 min-w-0 w-full sm:w-auto order-4 sm:order-none">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Value 
                  <span className="ml-2 text-gray-500 font-normal">
                    (Length: <span className={entry.value.length > 0 ? 'text-blue-600 font-semibold' : ''}>{entry.value.length}</span>)
                  </span>
                </label>
                <input
                  type="text"
                  value={entry.value}
                  onChange={(e) => updateEntry(index, 'value', e.target.value)}
                  placeholder="Enter hex value..."
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                />
                {entry.value && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Hex length: {Math.floor(entry.value.length / 2).toString(16).toUpperCase().padStart(2, '0')}
                  </p>
                )}
              </div>
              
              {/* Delete Button */}
              <div className="flex-shrink-0 ml-auto sm:ml-0 sm:pt-7 order-2 sm:order-none">
                <button
                  onClick={() => removeEntry(index)}
                  disabled={entries.length === 1}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={entries.length === 1 ? "Cannot remove the last entry" : "Remove entry"}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Error Banner */}
      {hasDuplicates() && (
        <div className="flex items-start gap-3 p-4 bg-red-100 border-2 border-red-400 rounded-lg text-red-800">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Duplicate Keys Detected</p>
            <p className="text-sm mt-1">Each key must be unique. Please change or remove duplicate entries before building.</p>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={addEntry}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-sm hover:shadow transition-all text-sm font-medium"
        >
          <Plus size={18} />
          Add Entry
        </button>
        <button
          onClick={buildKLV}
          disabled={entries.every(e => !e.value) || hasDuplicates()}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all text-sm font-medium"
          title={hasDuplicates() ? 'Cannot build: duplicate keys present' : entries.every(e => !e.value) ? 'Add at least one value' : 'Build KLV string'}
        >
          <CheckCircle size={18} />
          Build KLV String
        </button>
      </div>
      
      {/* Preview Section */}
      {entries.some(e => e.value) && !hasDuplicates() && (
        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Eye size={16} />
              KLV String Preview
            </label>
            <button
              onClick={copyPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="bg-white p-3 rounded border border-gray-300">
            <code className="text-sm text-gray-800 break-all font-mono">
              {KLVParser.build(entries)}
            </code>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Total length: {KLVParser.build(entries)?.length || 0} characters
          </div>
        </div>
      )}
    </div>
  );
};

export default KLVBuilder;