import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportPanel from '../../components/ExportPanel';
import { KLVEntry } from '../../utils/KLVParser';
import { mockURLAPIs, mockDOMFileDownload } from '../helpers/testUtils';

// Mock Blob constructor
global.Blob = jest.fn().mockImplementation((content, options) => ({
  content,
  options,
  size: content[0]?.length || 0
})) as any;

let domMocks: any;
let urlMocks: any;

describe('ExportPanel', () => {
  const mockResults: KLVEntry[] = [
    {
      key: '002',
      len: 6,
      value: 'AB48DE',
      pos: 0,
      name: 'Tracking Number'
    },
    {
      key: '026',
      len: 4,
      value: '4577',
      pos: 11,
      name: 'Merchant Category Code'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    domMocks?.cleanup();
  });

  describe('Rendering', () => {
    it('should render export buttons when results are provided', () => {
      render(<ExportPanel results={mockResults} />);
      
      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('Table')).toBeInTheDocument();
    });

    it('should not render when results array is empty', () => {
      const { container } = render(<ExportPanel results={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should have correct button styling and titles', () => {
      render(<ExportPanel results={mockResults} />);
      
      const jsonButton = screen.getByText('JSON');
      const csvButton = screen.getByText('CSV');
      const tableButton = screen.getByText('Table');
      
      expect(jsonButton).toHaveClass('bg-green-100', 'text-green-800');
      expect(csvButton).toHaveClass('bg-blue-100', 'text-blue-800');
      expect(tableButton).toHaveClass('bg-purple-100', 'text-purple-800');
      
      expect(jsonButton).toHaveAttribute('title', 'Export as JSON');
      expect(csvButton).toHaveAttribute('title', 'Export as CSV');
      expect(tableButton).toHaveAttribute('title', 'Export as Table');
    });

    it('should handle single result correctly', () => {
      const singleResult: KLVEntry[] = [mockResults[0]];
      
      render(<ExportPanel results={singleResult} />);
      
      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('Table')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should trigger JSON export when JSON button is clicked', async () => {
      const user = userEvent.setup();
      render(<ExportPanel results={mockResults} />);
      
      // Set up mocks after rendering
      domMocks = mockDOMFileDownload();
      urlMocks = mockURLAPIs();
      
      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);
      
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('"key": "002"')],
        { type: 'application/json' }
      );
      expect(urlMocks.mockCreateObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(domMocks.mocks.mockAppendChild).toHaveBeenCalled();
      expect(domMocks.mocks.mockClick).toHaveBeenCalled();
      expect(domMocks.mocks.mockRemoveChild).toHaveBeenCalled();
      expect(urlMocks.mockRevokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });

    it('should trigger CSV export when CSV button is clicked', async () => {
      const user = userEvent.setup();
      render(<ExportPanel results={mockResults} />);
      
      // Set up mocks after rendering
      domMocks = mockDOMFileDownload();
      urlMocks = mockURLAPIs();
      
      const csvButton = screen.getByText('CSV');
      await user.click(csvButton);
      
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('Key,Name,Length,Value,Position')],
        { type: 'text/csv' }
      );
      expect(urlMocks.mockCreateObjectURL).toHaveBeenCalled();
      expect(domMocks.mocks.mockClick).toHaveBeenCalled();
    });

    it('should trigger Table export when Table button is clicked', async () => {
      const user = userEvent.setup();
      render(<ExportPanel results={mockResults} />);
      
      // Set up mocks after rendering
      domMocks = mockDOMFileDownload();
      urlMocks = mockURLAPIs();
      
      const tableButton = screen.getByText('Table');
      await user.click(tableButton);
      
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('002')],
        { type: 'text/plain' }
      );
      expect(urlMocks.mockCreateObjectURL).toHaveBeenCalled();
      expect(domMocks.mocks.mockClick).toHaveBeenCalled();
    });

    it('should generate filename with timestamp for JSON export', async () => {
      const user = userEvent.setup();
      render(<ExportPanel results={mockResults} />);
      
      // Set up mocks after rendering
      domMocks = mockDOMFileDownload();
      urlMocks = mockURLAPIs();
      
      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);
      
      expect(domMocks.mocks.mockElement.download).toMatch(/klv-data-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json/);
    });

    it('should generate filename with timestamp for CSV export', async () => {
      const user = userEvent.setup();
      render(<ExportPanel results={mockResults} />);
      
      // Set up mocks after rendering
      domMocks = mockDOMFileDownload();
      urlMocks = mockURLAPIs();
      
      const csvButton = screen.getByText('CSV');
      await user.click(csvButton);
      
      expect(domMocks.mocks.mockElement.download).toMatch(/klv-data-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv/);
    });

    it('should generate filename with timestamp for Table export', async () => {
      const user = userEvent.setup();
      render(<ExportPanel results={mockResults} />);
      
      // Set up mocks after rendering
      domMocks = mockDOMFileDownload();
      urlMocks = mockURLAPIs();
      
      const tableButton = screen.getByText('Table');
      await user.click(tableButton);
      
      expect(domMocks.mocks.mockElement.download).toMatch(/klv-data-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.txt/);
    });

    it('should set correct href for download link', async () => {
      const user = userEvent.setup();
      render(<ExportPanel results={mockResults} />);
      
      // Set up mocks after rendering
      domMocks = mockDOMFileDownload();
      urlMocks = mockURLAPIs();
      
      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);
      
      expect(domMocks.mocks.mockElement.href).toBe('mock-blob-url');
    });
  });

  describe('DOM Cleanup', () => {
    it('should properly clean up DOM elements after export', async () => {
      const user = userEvent.setup();
      render(<ExportPanel results={mockResults} />);
      
      // Set up mocks after rendering
      domMocks = mockDOMFileDownload();
      urlMocks = mockURLAPIs();
      
      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);
      
      expect(domMocks.mocks.mockAppendChild).toHaveBeenCalledWith(domMocks.mocks.mockElement);
      expect(domMocks.mocks.mockRemoveChild).toHaveBeenCalledWith(domMocks.mocks.mockElement);
      expect(urlMocks.mockRevokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty values in results', async () => {
      const emptyResults: KLVEntry[] = [
        {
          key: '002',
          len: 0,
          value: '',
          pos: 0,
          name: 'Empty Value'
        }
      ];
      
      const user = userEvent.setup();
      render(<ExportPanel results={emptyResults} />);
      
      // Set up mocks after rendering
      domMocks = mockDOMFileDownload();
      urlMocks = mockURLAPIs();
      
      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);
      
      expect(global.Blob).toHaveBeenCalled();
      expect(domMocks.mocks.mockClick).toHaveBeenCalled();
    });

    it('should handle special characters in values', async () => {
      const specialResults: KLVEntry[] = [
        {
          key: '002',
          len: 10,
          value: 'Test"Value,',
          pos: 0,
          name: 'Special Chars'
        }
      ];
      
      const user = userEvent.setup();
      render(<ExportPanel results={specialResults} />);
      
      // Set up mocks after rendering
      domMocks = mockDOMFileDownload();
      urlMocks = mockURLAPIs();
      
      const csvButton = screen.getByText('CSV');
      await user.click(csvButton);
      
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('Test"Value,')],
        { type: 'text/csv' }
      );
      expect(domMocks.mocks.mockClick).toHaveBeenCalled();
    });
  });

  describe('Component Props', () => {
    it('should re-render when results prop changes', () => {
      const { rerender } = render(<ExportPanel results={[]} />);
      
      expect(screen.queryByText('JSON')).not.toBeInTheDocument();
      
      rerender(<ExportPanel results={mockResults} />);
      
      expect(screen.getByText('JSON')).toBeInTheDocument();
    });

    it('should handle results with different key types', async () => {
      const mixedResults: KLVEntry[] = [
        {
          key: '002',
          len: 4,
          value: 'TEST',
          pos: 0,
          name: 'Known Key'
        },
        {
          key: '999',
          len: 3,
          value: 'XYZ',
          pos: 9,
          name: 'Unknown'
        }
      ];
      
      const user = userEvent.setup();
      render(<ExportPanel results={mixedResults} />);
      
      // Set up mocks after rendering
      domMocks = mockDOMFileDownload();
      urlMocks = mockURLAPIs();
      
      const tableButton = screen.getByText('Table');
      await user.click(tableButton);
      
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('002') && expect.stringContaining('999')],
        { type: 'text/plain' }
      );
    });
  });
});