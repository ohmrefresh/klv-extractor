import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import KLVParser, { KLVBuildEntry } from '../utils/KLVParser';

interface KLVBuilderProps {
  onBuild: (klvString: string) => void;
}

const KLVBuilder: React.FC<KLVBuilderProps> = ({ onBuild }) => {
  const [entries, setEntries] = useState<KLVBuildEntry[]>([{ key: '002', value: '' }]);

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

  const addEntry = () => {
    setEntries([...entries, { key: '002', value: '' }]);
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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">KLV Builder</h3>
        <button
          onClick={clearAll}
          className="px-3 py-1 text-red-600 border border-red-300 rounded text-sm hover:bg-red-50"
        >
          Clear All
        </button>
      </div>
      
      <div className="space-y-3">
        {entries.map((entry, index) => {
          const duplicateKeys = getDuplicateKeys();
          const isDuplicate = duplicateKeys.has(entry.key);
          
          return (
            <div key={index} className={`flex gap-2 items-center p-3 border rounded ${isDuplicate ? 'border-red-500 bg-red-50' : ''}`}>
              <div className="flex-shrink-0">
                <label className="block text-xs text-gray-500 mb-1">
                  Key {isDuplicate && <span className="text-red-600 font-semibold">(Duplicate!)</span>}
                </label>
                <select
                  value={entry.key}
                  onChange={(e) => updateEntry(index, 'key', e.target.value)}
                  className={`w-120 p-2 border rounded text-sm ${isDuplicate ? 'border-red-500' : ''}`}
                >
                  {Object.entries(KLVParser.definitions).map(([key, name]) => (
                    <option key={key} value={key}>
                      {key} - {name}
                    </option>
                  ))}
                </select>
              </div>
            
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                Value (Length: {entry.value.length})
              </label>
              <input
                type="text"
                value={entry.value}
                onChange={(e) => updateEntry(index, 'value', e.target.value)}
                placeholder="Enter value..."
                className="w-full p-2 border rounded text-sm"
              />
            </div>
            
            <div className="flex-shrink-0">
              <label className="block text-xs text-gray-500 mb-1">&nbsp;</label>
              <button
                onClick={() => removeEntry(index)}
                disabled={entries.length === 1}
                className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove entry"
              >
                <Trash2 size={16} />
              </button>
            </div>
            </div>
          );
        })}
      </div>
      
      {hasDuplicates() && (
        <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          <strong>Error:</strong> Duplicate keys detected. Each key must be unique.
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={addEntry}
          className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          <Plus size={16} />
          Add Entry
        </button>
        <button
          onClick={buildKLV}
          disabled={entries.every(e => !e.value) || hasDuplicates()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title={hasDuplicates() ? 'Cannot build: duplicate keys present' : ''}
        >
          Build KLV
        </button>
      </div>
      
      {entries.some(e => e.value) && (
        <div className="p-3 bg-gray-50 rounded">
          <label className="block text-sm font-medium mb-2">Preview:</label>
          <code className="text-sm break-all">
            {KLVParser.build(entries)}
          </code>
        </div>
      )}
    </div>
  );
};

export default KLVBuilder;