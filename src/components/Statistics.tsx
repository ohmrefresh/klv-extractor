import React, { useMemo } from 'react';
import { KLVEntry } from '../utils/KLVParser';

interface StatisticsProps {
  results: KLVEntry[];
}

interface StatsData {
  total: number;
  totalValueLength: number;
  knownKeys: number;
  unknownKeys: number;
  keyTypes: Record<string, number>;
}

const Statistics: React.FC<StatisticsProps> = ({ results }) => {
  const stats: StatsData = useMemo(() => {
    const keyTypes: Record<string, number> = {};
    let totalValueLength = 0;
    let knownKeys = 0;

    results.forEach(item => {
      const category = item.name !== 'Unknown' ? 'Known' : 'Unknown';
      keyTypes[category] = (keyTypes[category] || 0) + 1;
      totalValueLength += item.len;
      if (item.name !== 'Unknown') knownKeys++;
    });

    return {
      total: results.length,
      totalValueLength,
      knownKeys,
      unknownKeys: results.length - knownKeys,
      keyTypes
    };
  }, [results]);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="card-brutal p-5 text-center">
        <div className="text-4xl font-bold mb-2" style={{
          color: 'var(--accent-primary)',
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: '0.05em'
        }}>
          {stats.total}
        </div>
        <div className="text-xs uppercase tracking-wider" style={{
          color: 'var(--text-muted)',
          fontFamily: "'Work Sans', sans-serif",
          fontWeight: 600
        }}>
          Total Entries
        </div>
      </div>
      <div className="card-brutal p-5 text-center">
        <div className="text-4xl font-bold mb-2" style={{
          color: 'var(--success-color)',
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: '0.05em'
        }}>
          {stats.knownKeys}
        </div>
        <div className="text-xs uppercase tracking-wider" style={{
          color: 'var(--text-muted)',
          fontFamily: "'Work Sans', sans-serif",
          fontWeight: 600
        }}>
          Known Keys
        </div>
      </div>
      <div className="card-brutal p-5 text-center">
        <div className="text-4xl font-bold mb-2" style={{
          color: 'var(--accent-secondary)',
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: '0.05em'
        }}>
          {stats.unknownKeys}
        </div>
        <div className="text-xs uppercase tracking-wider" style={{
          color: 'var(--text-muted)',
          fontFamily: "'Work Sans', sans-serif",
          fontWeight: 600
        }}>
          Unknown Keys
        </div>
      </div>
      <div className="card-brutal p-5 text-center">
        <div className="text-4xl font-bold mb-2" style={{
          color: 'var(--accent-tertiary)',
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: '0.05em'
        }}>
          {stats.totalValueLength}
        </div>
        <div className="text-xs uppercase tracking-wider" style={{
          color: 'var(--text-muted)',
          fontFamily: "'Work Sans', sans-serif",
          fontWeight: 600
        }}>
          Total Length
        </div>
      </div>
    </div>
  );
};

export default Statistics;