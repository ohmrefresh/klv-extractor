import React, { useState } from 'react';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react';
import KLVParser, { KLVParseResult } from '../utils/KLVParser';

interface BatchResult extends KLVParseResult {
  line: number;
  input: string;
}

interface BatchProcessorProps {
  onProcess: (results: BatchResult[]) => void;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({ onProcess }) => {
  const [batchInput, setBatchInput] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<BatchResult[]>([]);

  const processBatch = async () => {
    setProcessing(true);
    const lines = batchInput.split('\n').filter(line => line.trim());
    
    const batchResults: BatchResult[] = lines.map((line, index) => ({
      line: index + 1,
      input: line.trim(),
      ...KLVParser.parse(line.trim())
    }));
    
    // Simulate processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setResults(batchResults);
    setProcessing(false);
    onProcess(batchResults);
  };

  const loadSampleBatch = () => {
    const sampleData = [
      '00206AB48DE026044577',
      '04210000050010008USD04305Test Merchant',
      '25103EMV25107Visa26105542200015INVALID_ENTRY',
      '04210050026055422600512345678042036MERCHANT_ID_12343015Test Transaction'
    ].join('\n');
    setBatchInput(sampleData);
  };

  const clearBatch = () => {
    setBatchInput('');
    setResults([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText size={20} />
          Batch Processor
        </h3>
        <div className="flex gap-2">
          <button
            onClick={loadSampleBatch}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
          >
            Load Sample
          </button>
          <button
            onClick={clearBatch}
            className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          KLV Data (one entry per line)
        </label>
        <textarea
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          placeholder="Enter multiple KLV strings, one per line...&#10;Example:&#10;00206AB48DE026044577&#10;04210000050010008USD"
          className="w-full p-3 border rounded font-mono text-sm resize-vertical"
          rows={8}
        />
        <div className="text-xs text-gray-500 mt-1">
          Lines to process: {batchInput.split('\n').filter(line => line.trim()).length}
        </div>
      </div>
      
      <button
        onClick={processBatch}
        disabled={processing || !batchInput.trim()}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Processing...
          </>
        ) : (
          'Process Batch'
        )}
      </button>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Batch Results</h4>
            <div className="text-sm text-gray-600">
              {results.filter(r => r.errors.length === 0).length} successful, {' '}
              {results.filter(r => r.errors.length > 0).length} failed
            </div>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, i) => (
              <div key={i} className={`border rounded p-3 ${
                result.errors.length === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Line {result.line}</span>
                  <div className="flex items-center gap-2">
                    {result.errors.length === 0 ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircle size={16} className="mr-1" />
                        {result.results.length} entries
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600 text-sm">
                        <AlertCircle size={16} className="mr-1" />
                        {result.errors.length} errors
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white p-2 rounded font-mono text-xs break-all mb-2 border">
                  {result.input}
                </div>
                
                {result.errors.length > 0 && (
                  <div className="text-red-600 text-xs">
                    Errors: {result.errors.join(', ')}
                  </div>
                )}
                
                {result.results.length > 0 && (
                  <div className="text-green-600 text-xs">
                    Keys found: {result.results.map(r => r.key).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;