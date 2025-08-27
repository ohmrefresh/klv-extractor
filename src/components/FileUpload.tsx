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
    <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center hover:border-gray-400 transition-colors">
      <input
        ref={fileRef}
        type="file"
        onChange={handleFileChange}
        accept=".txt,.log,.csv,.json"
        className="hidden"
        aria-label="Upload KLV data file"
      />
      <Upload className="mx-auto mb-2 text-gray-400" size={24} />
      <p className="text-sm text-gray-600 mb-2">
        Upload KLV data file (.txt, .log, .csv)
      </p>
      <button
        onClick={() => fileRef.current?.click()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors"
      >
        Choose File
      </button>
    </div>
  );
};

export default FileUpload;