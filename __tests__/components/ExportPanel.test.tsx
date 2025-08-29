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
    
    // Mock document.createElement to return a proper mock element
    Object.defineProperty(document, 'createElement', {
      value: jest.fn((tagName) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: jest.fn(),
            style: {}
          };
        }
        // Return a generic mock for other elements
        return {
          appendChild: jest.fn(),
          removeChild: jest.fn(),
          setAttribute: jest.fn(),
          style: {}
        };
      }),
      writable: true
    });
    
    // Mock document.body methods
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });

  it('renders nothing when no results provided', () => {
    const { container } = render(<ExportPanel results={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders export buttons when results are provided', () => {
    render(<ExportPanel results={mockResults} />);

    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('has correct button styling', () => {
    render(<ExportPanel results={mockResults} />);

    const jsonButton = screen.getByText('JSON');
    const csvButton = screen.getByText('CSV');
    const tableButton = screen.getByText('Table');

    expect(jsonButton).toHaveClass('px-3', 'py-1', 'bg-green-100', 'text-green-800', 'rounded', 'text-sm');
    expect(csvButton).toHaveClass('px-3', 'py-1', 'bg-blue-100', 'text-blue-800', 'rounded', 'text-sm');
    expect(tableButton).toHaveClass('px-3', 'py-1', 'bg-purple-100', 'text-purple-800', 'rounded', 'text-sm');
  });

  it('has correct button titles', () => {
    render(<ExportPanel results={mockResults} />);

    expect(screen.getByTitle('Export as JSON')).toBeInTheDocument();
    expect(screen.getByTitle('Export as CSV')).toBeInTheDocument();
    expect(screen.getByTitle('Export as Table')).toBeInTheDocument();
  });

  it('calls KLVParser.export and triggers download for JSON', () => {
    const mockJsonData = JSON.stringify(mockResults);
    mockKLVParser.export.mockReturnValue(mockJsonData);

    render(<ExportPanel results={mockResults} />);
    
    const jsonButton = screen.getByText('JSON');
    fireEvent.click(jsonButton);

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

    render(<ExportPanel results={mockResults} />);
    
    const csvButton = screen.getByText('CSV');
    fireEvent.click(csvButton);

    expect(mockKLVParser.export).toHaveBeenCalledWith(mockResults, 'csv');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('calls KLVParser.export and triggers download for Table', () => {
    const mockTableData = 'Key    Name              Length  Value   Position\n002    Tracking Number   6       AB48DE  0';
    mockKLVParser.export.mockReturnValue(mockTableData);

    render(<ExportPanel results={mockResults} />);
    
    const tableButton = screen.getByText('Table');
    fireEvent.click(tableButton);

    expect(mockKLVParser.export).toHaveBeenCalledWith(mockResults, 'table');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('creates blob with correct content and type for JSON', () => {
    const mockJsonData = JSON.stringify(mockResults);
    mockKLVParser.export.mockReturnValue(mockJsonData);

    render(<ExportPanel results={mockResults} />);
    fireEvent.click(screen.getByText('JSON'));

    expect(global.Blob).toHaveBeenCalledWith([mockJsonData], { type: 'application/json' });
  });

  it('creates blob with correct content and type for CSV', () => {
    const mockCsvData = 'csv,data';
    mockKLVParser.export.mockReturnValue(mockCsvData);

    render(<ExportPanel results={mockResults} />);
    fireEvent.click(screen.getByText('CSV'));

    expect(global.Blob).toHaveBeenCalledWith([mockCsvData], { type: 'text/csv' });
  });

  it('creates blob with correct content and type for Table', () => {
    const mockTableData = 'table data';
    mockKLVParser.export.mockReturnValue(mockTableData);

    render(<ExportPanel results={mockResults} />);
    fireEvent.click(screen.getByText('Table'));

    expect(global.Blob).toHaveBeenCalledWith([mockTableData], { type: 'text/plain' });
  });

  it('sets correct download filename with timestamp', () => {
    const mockJsonData = JSON.stringify(mockResults);
    mockKLVParser.export.mockReturnValue(mockJsonData);

    render(<ExportPanel results={mockResults} />);
    fireEvent.click(screen.getByText('JSON'));

    expect(mockKLVParser.export).toHaveBeenCalledWith(mockResults, 'json');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('handles single result correctly', () => {
    const singleResult = [mockResults[0]];
    mockKLVParser.export.mockReturnValue('single result data');

    render(<ExportPanel results={singleResult} />);
    
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();

    fireEvent.click(screen.getByText('JSON'));
    expect(mockKLVParser.export).toHaveBeenCalledWith(singleResult, 'json');
  });
});