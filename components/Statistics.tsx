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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
        <div className="text-xs text-gray-600">Total Entries</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.knownKeys}</div>
        <div className="text-xs text-gray-600">Known Keys</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-600">{stats.unknownKeys}</div>
        <div className="text-xs text-gray-600">Unknown Keys</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.totalValueLength}</div>
        <div className="text-xs text-gray-600">Total Length</div>
      </div>
    </div>
  );
};

export default Statistics;