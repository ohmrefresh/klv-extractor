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
        className="px-4 py-3 border-3 text-xs font-bold uppercase tracking-wider transition-all"
        style={{
          background: 'var(--bg-tertiary)',
          border: '3px solid var(--success-color)',
          color: 'var(--success-color)',
          boxShadow: '3px 3px 0 rgba(0, 255, 136, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--success-color)';
          e.currentTarget.style.color = 'var(--bg-primary)';
          e.currentTarget.style.transform = 'translate(-1px, -1px)';
          e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0, 255, 136, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-tertiary)';
          e.currentTarget.style.color = 'var(--success-color)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '3px 3px 0 rgba(0, 255, 136, 0.2)';
        }}
        title="Export as JSON"
      >
        JSON
      </button>
      <button
        onClick={() => exportData('csv')}
        className="px-4 py-3 border-3 text-xs font-bold uppercase tracking-wider transition-all"
        style={{
          background: 'var(--bg-tertiary)',
          border: '3px solid var(--accent-tertiary)',
          color: 'var(--accent-tertiary)',
          boxShadow: '3px 3px 0 rgba(0, 212, 255, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-tertiary)';
          e.currentTarget.style.color = 'var(--bg-primary)';
          e.currentTarget.style.transform = 'translate(-1px, -1px)';
          e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0, 212, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-tertiary)';
          e.currentTarget.style.color = 'var(--accent-tertiary)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '3px 3px 0 rgba(0, 212, 255, 0.2)';
        }}
        title="Export as CSV"
      >
        CSV
      </button>
      <button
        onClick={() => exportData('table')}
        className="px-4 py-3 border-3 text-xs font-bold uppercase tracking-wider transition-all"
        style={{
          background: 'var(--bg-tertiary)',
          border: '3px solid var(--accent-secondary)',
          color: 'var(--accent-secondary)',
          boxShadow: '3px 3px 0 rgba(255, 107, 0, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-secondary)';
          e.currentTarget.style.color = 'var(--bg-primary)';
          e.currentTarget.style.transform = 'translate(-1px, -1px)';
          e.currentTarget.style.boxShadow = '4px 4px 0 rgba(255, 107, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-tertiary)';
          e.currentTarget.style.color = 'var(--accent-secondary)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '3px 3px 0 rgba(255, 107, 0, 0.2)';
        }}
        title="Export as Table"
      >
        Table
      </button>
    </div>
  );
};

export default ExportPanel;