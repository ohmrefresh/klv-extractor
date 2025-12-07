import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileLoad: (content: string, filename: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoad }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      onFileLoad(text, file.name);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
    }
    
    e.target.value = '';
  };

  return (
    <div className="border-3 p-6 text-center scan-effect transition-all" style={{
      background: 'var(--bg-secondary)',
      borderColor: 'var(--border-color)',
      borderStyle: 'dashed',
      boxShadow: '6px 6px 0 rgba(0, 0, 0, 0.2)'
    }}>
      <input
        ref={fileRef}
        type="file"
        onChange={handleFileChange}
        accept=".txt,.log,.csv,.json"
        className="hidden"
        aria-label="Upload KLV data file"
      />
      <Upload className="mx-auto mb-4" size={32} style={{ color: 'var(--accent-tertiary)' }} />
      <p className="text-sm mb-4 uppercase tracking-wide" style={{
        color: 'var(--text-secondary)',
        fontFamily: "'Work Sans', sans-serif",
        fontWeight: 600
      }}>
        Upload KLV Data File
      </p>
      <p className="text-xs mb-4" style={{
        color: 'var(--text-muted)',
        fontFamily: "'Fira Code', monospace"
      }}>
        .txt • .log • .csv • .json
      </p>
      <button
        onClick={() => fileRef.current?.click()}
        className="btn-primary"
      >
        Choose File
      </button>
    </div>
  );
};

export default FileUpload;