import React from 'react';
import KLVParser, { KLVEntry } from '../utils/KLVParser';

interface ExportPanelProps {
  results: KLVEntry[];
}

type ExportFormat = 'json' | 'csv' | 'table';

const ExportPanel: React.FC<ExportPanelProps> = ({ results }) => {
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportData = (format: ExportFormat) => {
    const content = KLVParser.export(results, format);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const extensions: Record<ExportFormat, string> = { json: 'json', csv: 'csv', table: 'txt' };
    const mimeTypes: Record<ExportFormat, string> = { 
      json: 'application/json', 
      csv: 'text/csv', 
      table: 'text/plain' 
    };
    
    downloadFile(
      content, 
      `klv-data-${timestamp}.${extensions[format]}`, 
      mimeTypes[format]
    );
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportData('json')}
        className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors"
        title="Export as JSON"
      >
        JSON
      </button>
      <button
        onClick={() => exportData('csv')}
        className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 transition-colors"
        title="Export as CSV"
      >
        CSV
      </button>
      <button
        onClick={() => exportData('table')}
        className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm hover:bg-purple-200 transition-colors"
        title="Export as Table"
      >
        Table
      </button>
    </div>
  );
};

export default ExportPanel;