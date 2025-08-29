import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExportPanel from '../../components/ExportPanel';
import { KLVEntry } from '../../utils/KLVParser';

// Mock the KLVParser export function
jest.mock('../../utils/KLVParser', () => ({
  __esModule: true,
  default: {
    export: jest.fn()
  }
}));

const mockKLVParser = require('../../utils/KLVParser').default;

describe('ExportPanel Component', () => {
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
    
    
    // Mock URL methods
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock Blob
    global.Blob = jest.fn().mockImplementation((content, options) => ({
      content,
      options
    })) as any;
    
    // Only mock document.createElement for 'a' elements, let others work normally
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: jest.fn(),
          style: {}
        };
      }
      // Use the original createElement for other elements
      return originalCreateElement(tagName);
    });
    
    // Mock document.body methods only for test purposes, preserve original functionality
    const originalAppendChild = document.body.appendChild.bind(document.body);
    const originalRemoveChild = document.body.removeChild.bind(document.body);
    
    document.body.appendChild = jest.fn((node) => {
      // If it's our mock anchor element, just return it
      if (node && typeof node === 'object' && 'click' in node && typeof node.click === 'function') {
        return node;
      }
      // Otherwise, use the original functionality
      return originalAppendChild(node);
    });
    
    document.body.removeChild = jest.fn((node) => {
      // If it's our mock anchor element, just return it
      if (node && typeof node === 'object' && 'click' in node && typeof node.click === 'function') {
        return node;
      }
      // Otherwise, use the original functionality  
      return originalRemoveChild(node);
    });
  });

  it('renders nothing when no results provided', () => {
    const { container } = render(<ExportPanel results={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders export buttons when results are provided', () => {
    const { container } = render(<ExportPanel results={mockResults} />);

    expect(container.textContent).toContain('JSON');
    expect(container.textContent).toContain('CSV');
    expect(container.textContent).toContain('Table');
  });

  it('has correct button styling', () => {
    const { container } = render(<ExportPanel results={mockResults} />);

    const jsonButton = container.querySelector('button[title="Export as JSON"]');
    const csvButton = container.querySelector('button[title="Export as CSV"]');
    const tableButton = container.querySelector('button[title="Export as Table"]');

    expect(jsonButton).toHaveClass('px-3', 'py-1', 'bg-green-100', 'text-green-800', 'rounded', 'text-sm');
    expect(csvButton).toHaveClass('px-3', 'py-1', 'bg-blue-100', 'text-blue-800', 'rounded', 'text-sm');
    expect(tableButton).toHaveClass('px-3', 'py-1', 'bg-purple-100', 'text-purple-800', 'rounded', 'text-sm');
  });

  it('has correct button titles', () => {
    const { container } = render(<ExportPanel results={mockResults} />);

    expect(container.querySelector('button[title="Export as JSON"]')).toBeTruthy();
    expect(container.querySelector('button[title="Export as CSV"]')).toBeTruthy();
    expect(container.querySelector('button[title="Export as Table"]')).toBeTruthy();
  });

  it('calls KLVParser.export and triggers download for JSON', () => {
    const mockJsonData = JSON.stringify(mockResults);
    mockKLVParser.export.mockReturnValue(mockJsonData);

    const { container } = render(<ExportPanel results={mockResults} />);
    
    const jsonButton = container.querySelector('button[title="Export as JSON"]');
    fireEvent.click(jsonButton!);

    expect(mockKLVParser.export).toHaveBeenCalledWith(mockResults, 'json');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
  });

  it('calls KLVParser.export and triggers download for CSV', () => {
    const mockCsvData = 'Key,Name,Length,Value,Position\n002,Tracking Number,6,AB48DE,0';
    mockKLVParser.export.mockReturnValue(mockCsvData);

    const { container } = render(<ExportPanel results={mockResults} />);
    
    const csvButton = container.querySelector('button[title="Export as CSV"]');
    fireEvent.click(csvButton!);

    expect(mockKLVParser.export).toHaveBeenCalledWith(mockResults, 'csv');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('calls KLVParser.export and triggers download for Table', () => {
    const mockTableData = 'Key    Name              Length  Value   Position\n002    Tracking Number   6       AB48DE  0';
    mockKLVParser.export.mockReturnValue(mockTableData);

    const { container } = render(<ExportPanel results={mockResults} />);
    
    const tableButton = container.querySelector('button[title="Export as Table"]');
    fireEvent.click(tableButton!);

    expect(mockKLVParser.export).toHaveBeenCalledWith(mockResults, 'table');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('creates blob with correct content and type for JSON', () => {
    const mockJsonData = JSON.stringify(mockResults);
    mockKLVParser.export.mockReturnValue(mockJsonData);

    const { container } = render(<ExportPanel results={mockResults} />);
    fireEvent.click(container.querySelector('button[title="Export as JSON"]')!);

    expect(global.Blob).toHaveBeenCalledWith([mockJsonData], { type: 'application/json' });
  });

  it('creates blob with correct content and type for CSV', () => {
    const mockCsvData = 'csv,data';
    mockKLVParser.export.mockReturnValue(mockCsvData);

    const { container } = render(<ExportPanel results={mockResults} />);
    fireEvent.click(container.querySelector('button[title="Export as CSV"]')!);

    expect(global.Blob).toHaveBeenCalledWith([mockCsvData], { type: 'text/csv' });
  });

  it('creates blob with correct content and type for Table', () => {
    const mockTableData = 'table data';
    mockKLVParser.export.mockReturnValue(mockTableData);

    const { container } = render(<ExportPanel results={mockResults} />);
    fireEvent.click(container.querySelector('button[title="Export as Table"]')!);

    expect(global.Blob).toHaveBeenCalledWith([mockTableData], { type: 'text/plain' });
  });

  it('sets correct download filename with timestamp', () => {
    const mockJsonData = JSON.stringify(mockResults);
    mockKLVParser.export.mockReturnValue(mockJsonData);

    const { container } = render(<ExportPanel results={mockResults} />);
    fireEvent.click(container.querySelector('button[title="Export as JSON"]')!);

    expect(mockKLVParser.export).toHaveBeenCalledWith(mockResults, 'json');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('handles single result correctly', () => {
    const singleResult = [mockResults[0]];
    mockKLVParser.export.mockReturnValue('single result data');

    const { container } = render(<ExportPanel results={singleResult} />);
    
    expect(container.textContent).toContain('JSON');
    expect(container.textContent).toContain('CSV');
    expect(container.textContent).toContain('Table');

    fireEvent.click(container.querySelector('button[title="Export as JSON"]')!);
    expect(mockKLVParser.export).toHaveBeenCalledWith(singleResult, 'json');
  });
});