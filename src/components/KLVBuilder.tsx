import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import KLVParser, { KLVBuildEntry } from '../utils/KLVParser';

interface KLVBuilderProps {
  onBuild: (klvString: string) => void;
}

const KLVBuilder: React.FC<KLVBuilderProps> = ({ onBuild }) => {
  const [entries, setEntries] = useState<KLVBuildEntry[]>([{ key: '002', value: '' }]);

  // Get all available keys
  const allKeys = Object.keys(KLVParser.definitions);

  // Get keys that are already used
  const usedKeys = entries.map(e => e.key);

  // Get the next available key that hasn't been used
  const getNextAvailableKey = (): string => {
    const availableKey = allKeys.find(key => !usedKeys.includes(key));
    return availableKey || allKeys[0];
  };

  // Check if a key is available for a specific entry index
  const isKeyAvailable = (key: string, currentIndex: number): boolean => {
    return !entries.some((entry, index) => index !== currentIndex && entry.key === key);
  };

  const addEntry = () => {
    const nextKey = getNextAvailableKey();
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
    const klvString = KLVParser.build(entries);
    if (klvString) {
      onBuild(klvString);
    }
  };

  const clearAll = () => {
    setEntries([{ key: '002', value: '' }]);
  };

  // Check if all keys are used
  const allKeysUsed = usedKeys.length >= allKeys.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl mb-1" style={{
            color: 'var(--accent-primary)',
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '0.05em'
          }}>
            KLV BUILDER
          </h3>
          <div className="flex items-center gap-4">
            <p className="text-sm" style={{
              color: 'var(--text-muted)',
              fontFamily: "'Fira Code', monospace"
            }}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} configured
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 border-2" style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
                fontFamily: "'Fira Code', monospace",
                fontWeight: 600
              }}>
                {usedKeys.length} UNIQUE {usedKeys.length === 1 ? 'KEY' : 'KEYS'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={clearAll}
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
      </div>

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div
            key={index}
            className="card-brutal p-5 animate-slide-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs px-3 py-1 border-2 font-bold" style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--accent-tertiary)',
                color: 'var(--accent-tertiary)',
                fontFamily: "'Fira Code', monospace"
              }}>
                ENTRY #{index + 1}
              </span>
              <div className="h-px flex-1" style={{ background: 'var(--border-color)' }} />
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex-shrink-0" style={{ width: '280px' }}>
                <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{
                  color: 'var(--text-muted)',
                  fontFamily: "'Work Sans', sans-serif"
                }}>
                  ▸ Key
                </label>
                <select
                  value={entry.key}
                  onChange={(e) => updateEntry(index, 'key', e.target.value)}
                  className="w-full input-brutal text-sm"
                  style={{
                    fontFamily: "'Fira Code', monospace",
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem'
                  }}
                >
                  {Object.entries(KLVParser.definitions).map(([key, name]) => {
                    const isUsed = !isKeyAvailable(key, index);
                    return (
                      <option key={key} value={key} disabled={isUsed}>
                        {key} - {name} {isUsed ? '(IN USE)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{
                  color: 'var(--text-muted)',
                  fontFamily: "'Work Sans', sans-serif"
                }}>
                  ▸ Value <span style={{ color: 'var(--accent-tertiary)' }}>(Length: {entry.value.length})</span>
                </label>
                <input
                  type="text"
                  value={entry.value}
                  onChange={(e) => updateEntry(index, 'value', e.target.value)}
                  placeholder="ENTER VALUE..."
                  className="w-full input-brutal text-sm"
                  style={{
                    fontFamily: "'Fira Code', monospace"
                  }}
                />
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={() => removeEntry(index)}
                  disabled={entries.length === 1}
                  className="p-3 border-3 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: 'transparent',
                    borderColor: entries.length === 1 ? 'var(--border-color)' : 'var(--error-color)',
                    color: entries.length === 1 ? 'var(--text-muted)' : 'var(--error-color)',
                    boxShadow: entries.length === 1 ? '3px 3px 0 rgba(0, 0, 0, 0.1)' : '3px 3px 0 rgba(255, 71, 87, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    if (entries.length > 1) {
                      e.currentTarget.style.background = 'var(--error-color)';
                      e.currentTarget.style.color = 'var(--bg-primary)';
                      e.currentTarget.style.transform = 'translate(-1px, -1px)';
                      e.currentTarget.style.boxShadow = '4px 4px 0 rgba(255, 71, 87, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (entries.length > 1) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--error-color)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '3px 3px 0 rgba(255, 71, 87, 0.2)';
                    }
                  }}
                  title="Remove entry"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex gap-3 items-center">
          <button
            onClick={addEntry}
            disabled={allKeysUsed}
            className="flex items-center gap-2 px-6 py-3 border-3 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: allKeysUsed ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
              border: `3px solid ${allKeysUsed ? 'var(--border-color)' : 'var(--accent-tertiary)'}`,
              color: allKeysUsed ? 'var(--text-muted)' : 'var(--accent-tertiary)',
              boxShadow: allKeysUsed ? '4px 4px 0 rgba(0, 0, 0, 0.1)' : '4px 4px 0 rgba(0, 212, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!allKeysUsed) {
                e.currentTarget.style.background = 'var(--accent-tertiary)';
                e.currentTarget.style.color = 'var(--bg-primary)';
                e.currentTarget.style.transform = 'translate(-1px, -1px)';
                e.currentTarget.style.boxShadow = '5px 5px 0 rgba(0, 212, 255, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!allKeysUsed) {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--accent-tertiary)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0, 212, 255, 0.2)';
              }
            }}
            title={allKeysUsed ? 'All available keys are in use' : 'Add a new entry'}
          >
            <Plus size={18} />
            Add Entry
          </button>
          <button
            onClick={buildKLV}
            disabled={entries.every(e => !e.value)}
            className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Build KLV
          </button>
          {allKeysUsed && (
            <div className="flex items-center gap-2 px-4 py-2 border-2" style={{
              background: 'rgba(255, 107, 0, 0.1)',
              borderColor: 'var(--accent-secondary)',
              color: 'var(--accent-secondary)',
              fontFamily: "'Fira Code', monospace",
              fontSize: '0.75rem'
            }}>
              <span>⚠</span>
              <span>ALL KEYS IN USE</span>
            </div>
          )}
        </div>
        {!allKeysUsed && (
          <p className="text-xs" style={{
            color: 'var(--text-muted)',
            fontFamily: "'Fira Code', monospace"
          }}>
            {allKeys.length - usedKeys.length} of {allKeys.length} keys available
          </p>
        )}
      </div>

      {entries.some(e => e.value) && (
        <div className="p-6 border-3 scan-effect animate-slide-in" style={{
          background: 'var(--bg-tertiary)',
          borderColor: 'var(--accent-primary)',
          boxShadow: '6px 6px 0 rgba(0, 255, 136, 0.2)'
        }}>
          <label className="block text-sm font-bold mb-3 uppercase tracking-wide" style={{
            color: 'var(--accent-primary)',
            fontFamily: "'Work Sans', sans-serif"
          }}>
            ▸ Preview Output
          </label>
          <code className="text-sm break-all block" style={{
            fontFamily: "'Fira Code', monospace",
            color: 'var(--text-primary)',
            lineHeight: '1.6'
          }}>
            {KLVParser.build(entries)}
          </code>
        </div>
      )}
    </div>
  );
};

export default KLVBuilder;