import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '../../app/page';

// Mock the clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock URL.createObjectURL and revokeObjectURL for export functionality
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document methods for download functionality
const mockClick = jest.fn();
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        click: mockClick,
        style: {}
      };
    }
    return {};
  })
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn()
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn()
});

describe('HomePage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the complete application layout', () => {
    render(<HomePage />);

    // Check header
    expect(screen.getByText('KLV Data Extraction Suite')).toBeInTheDocument();
    expect(screen.getByText('Complete toolkit for KLV data processing, parsing, and analysis')).toBeInTheDocument();

    // Check navigation tabs
    expect(screen.getByText('Extractor')).toBeInTheDocument();
    expect(screen.getByText('Builder')).toBeInTheDocument();
    expect(screen.getByText('Batch')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();

    // Check initial content (Extractor tab should be active)
    expect(screen.getByPlaceholderText(/Enter KLV data/)).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    render(<HomePage />);

    // Initially on Extractor tab
    expect(screen.getByPlaceholderText(/Enter KLV data/)).toBeInTheDocument();

    // Switch to Builder tab
    fireEvent.click(screen.getByText('Builder'));
    expect(screen.getByText('KLV Builder')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Enter KLV data/)).not.toBeInTheDocument();

    // Switch to Batch tab
    fireEvent.click(screen.getByText('Batch'));
    expect(screen.getByText('Batch Processor')).toBeInTheDocument();

    // Switch to History tab
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByText('No processing history yet')).toBeInTheDocument();
  });

  it('parses KLV data and displays results', async () => {
    render(<HomePage />);

    const textarea = screen.getByPlaceholderText(/Enter KLV data/) as HTMLTextAreaElement;
    
    // Clear default value and enter test data
    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.change(textarea, { target: { value: '00206AB48DE026044577' } });

    await waitFor(() => {
      expect(screen.getByText('Parsed KLV Data (2 entries)')).toBeInTheDocument();
      expect(screen.getByText('Key 002')).toBeInTheDocument();
      expect(screen.getByText('Key 026')).toBeInTheDocument();
      expect(screen.getByText('Tracking Number')).toBeInTheDocument();
      expect(screen.getByText('Merchant Category Code')).toBeInTheDocument();
    });
  });

  it('shows sample data buttons and they work', async () => {
    render(<HomePage />);

    const sample1Button = screen.getByText('Sample 1');
    fireEvent.click(sample1Button);

    const textarea = screen.getByPlaceholderText(/Enter KLV data/) as HTMLTextAreaElement;
    expect(textarea.value).toBe('00206AB48DE026044577');

    await waitFor(() => {
      expect(screen.getByText('Parsed KLV Data (2 entries)')).toBeInTheDocument();
    });
  });

  it('searches and filters results', async () => {
    render(<HomePage />);

    // Enter data that will create multiple entries
    const textarea = screen.getByPlaceholderText(/Enter KLV data/);
    fireEvent.change(textarea, { target: { value: '00206AB48DE026044577' } });

    await waitFor(() => {
      expect(screen.getByText('Parsed KLV Data (2 entries)')).toBeInTheDocument();
    });

    // Search for specific key
    const searchInput = screen.getByPlaceholderText('Search keys, values, names...');
    fireEvent.change(searchInput, { target: { value: '002' } });

    await waitFor(() => {
      expect(screen.getByText('Key 002')).toBeInTheDocument();
      expect(screen.queryByText('Key 026')).not.toBeInTheDocument();
    });

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText('Key 002')).toBeInTheDocument();
      expect(screen.getByText('Key 026')).toBeInTheDocument();
    });
  });

  it('shows and hides raw data', async () => {
    render(<HomePage />);

    const textarea = screen.getByPlaceholderText(/Enter KLV data/);
    fireEvent.change(textarea, { target: { value: '00206AB48DE' } });

    await waitFor(() => {
      expect(screen.getByText('Parsed KLV Data (1 entries)')).toBeInTheDocument();
    });

    // Raw data should not be visible initially
    expect(screen.queryByText('Raw KLV:')).not.toBeInTheDocument();

    // Click Show Raw button
    const showRawButton = screen.getByText('Show Raw');
    fireEvent.click(showRawButton);

    // Raw data should now be visible
    expect(screen.getByText('Raw KLV:')).toBeInTheDocument();
    expect(screen.getByText('00206AB48DE')).toBeInTheDocument();

    // Click Hide Raw button
    fireEvent.click(screen.getByText('Hide Raw'));

    // Raw data should be hidden again
    expect(screen.queryByText('Raw KLV:')).not.toBeInTheDocument();
  });

  it('copies values to clipboard', async () => {
    render(<HomePage />);

    const textarea = screen.getByPlaceholderText(/Enter KLV data/);
    fireEvent.change(textarea, { target: { value: '00206AB48DE' } });

    await waitFor(() => {
      expect(screen.getByText('Parsed KLV Data (1 entries)')).toBeInTheDocument();
    });

    // Find and click copy button
    const copyButton = screen.getByTitle('Copy value');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('AB48DE');
  });

  it('exports data in different formats', async () => {
    render(<HomePage />);

    const textarea = screen.getByPlaceholderText(/Enter KLV data/);
    fireEvent.change(textarea, { target: { value: '00206AB48DE' } });

    await waitFor(() => {
      expect(screen.getByText('Parsed KLV Data (1 entries)')).toBeInTheDocument();
    });

    // Test JSON export
    const jsonButton = screen.getByTitle('Export as JSON');
    fireEvent.click(jsonButton);
    expect(mockClick).toHaveBeenCalled();

    // Test CSV export
    const csvButton = screen.getByTitle('Export as CSV');
    fireEvent.click(csvButton);
    expect(mockClick).toHaveBeenCalled();

    // Test Table export
    const tableButton = screen.getByTitle('Export as Table');
    fireEvent.click(tableButton);
    expect(mockClick).toHaveBeenCalled();
  });

  it('integrates with KLVBuilder to create KLV strings', () => {
    render(<HomePage />);

    // Switch to Builder tab
    fireEvent.click(screen.getByText('Builder'));

    // Add value to builder
    const valueInput = screen.getByPlaceholderText('Enter value...');
    fireEvent.change(valueInput, { target: { value: 'TEST123' } });

    // Build KLV
    fireEvent.click(screen.getByText('Build KLV'));

    // Should switch back to Extractor tab and parse the built KLV
    expect(screen.getByText('Extractor')).toHaveClass('text-blue-600');
  });

  it('manages history correctly', async () => {
    render(<HomePage />);

    // Parse some data
    const textarea = screen.getByPlaceholderText(/Enter KLV data/);
    fireEvent.change(textarea, { target: { value: '00206AB48DE' } });

    await waitFor(() => {
      expect(screen.getByText('Parsed KLV Data (1 entries)')).toBeInTheDocument();
    });

    // Save to history
    fireEvent.click(screen.getByText('Save to History'));

    // Go to History tab
    fireEvent.click(screen.getByText('History'));

    // Should see the history entry
    expect(screen.queryByText('No processing history yet')).not.toBeInTheDocument();
    expect(screen.getByText(/1 entries/)).toBeInTheDocument();

    // Should be able to load from history
    const loadButton = screen.getByText('Load');
    fireEvent.click(loadButton);

    // Should switch back to Extractor tab
    expect(screen.getByText('Extractor')).toHaveClass('text-blue-600');
  });

  it('clears input and results', async () => {
    render(<HomePage />);

    const textarea = screen.getByPlaceholderText(/Enter KLV data/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '00206AB48DE' } });

    await waitFor(() => {
      expect(screen.getByText('Parsed KLV Data (1 entries)')).toBeInTheDocument();
    });

    // Click Clear button
    fireEvent.click(screen.getByText('Clear'));

    expect(textarea.value).toBe('');
    expect(screen.queryByText('Parsed KLV Data')).not.toBeInTheDocument();
  });

  it('displays error messages for invalid KLV data', async () => {
    render(<HomePage />);

    const textarea = screen.getByPlaceholderText(/Enter KLV data/);
    fireEvent.change(textarea, { target: { value: 'INVALID' } });

    await waitFor(() => {
      expect(screen.getByText('Parsing Errors')).toBeInTheDocument();
    });
  });

  it('shows Quick Reference footer', () => {
    render(<HomePage />);

    expect(screen.getByText('KLV Format Quick Reference')).toBeInTheDocument();
    expect(screen.getByText('Format Structure:')).toBeInTheDocument();
    expect(screen.getByText('KKKLLVVV...')).toBeInTheDocument();
    expect(screen.getByText('Example:')).toBeInTheDocument();
    expect(screen.getByText('00206AB48DE')).toBeInTheDocument();
  });

  it('handles file upload integration', async () => {
    render(<HomePage />);

    // Create a mock file
    const file = new File(['00206AB48DE026044577'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText('Upload KLV data file') as HTMLInputElement;

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Parsed KLV Data (2 entries)')).toBeInTheDocument();
      expect(screen.getByText('File: test.txt')).toBeInTheDocument(); // Should appear in history
    });
  });

  it('integrates BatchProcessor correctly', () => {
    render(<HomePage />);

    // Switch to Batch tab
    fireEvent.click(screen.getByText('Batch'));

    // Should show BatchProcessor component
    expect(screen.getByText('Batch Processor')).toBeInTheDocument();
    expect(screen.getByText('Load Sample')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter multiple KLV strings/)).toBeInTheDocument();
  });

  it('maintains active tab styling', () => {
    render(<HomePage />);

    // Extractor should be active initially
    const extractorTab = screen.getByText('Extractor');
    expect(extractorTab).toHaveClass('text-blue-600', 'bg-blue-50');

    // Switch to Builder
    fireEvent.click(screen.getByText('Builder'));
    const builderTab = screen.getByText('Builder');
    expect(builderTab).toHaveClass('text-blue-600', 'bg-blue-50');
    expect(extractorTab).not.toHaveClass('text-blue-600', 'bg-blue-50');
  });
});