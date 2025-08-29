import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BatchProcessor from '../../components/BatchProcessor';

// Mock the KLVParser
jest.mock('../../utils/KLVParser', () => ({
  __esModule: true,
  default: {
    parse: jest.fn()
  }
}));

const mockKLVParser = require('../../utils/KLVParser').default;

describe('BatchProcessor Component', () => {
  let mockOnProcess: jest.Mock;

  beforeEach(() => {
    mockOnProcess = jest.fn();
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders batch processor interface', () => {
    render(<BatchProcessor onProcess={mockOnProcess} />);

    expect(screen.getByText('Batch Processor')).toBeInTheDocument();
    expect(screen.getByText('Load Sample')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Process Batch')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter multiple KLV strings/)).toBeInTheDocument();
  });

  it('loads sample data when Load Sample button is clicked', () => {
    render(<BatchProcessor onProcess={mockOnProcess} />);

    const loadSampleButton = screen.getByText('Load Sample');
    fireEvent.click(loadSampleButton);

    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/) as HTMLTextAreaElement;
    expect(textarea.value).toContain('00206AB48DE026044577');
    expect(textarea.value).toContain('04210000050010008USD04305Test Merchant');
  });

  it('clears input when Clear button is clicked', () => {
    render(<BatchProcessor onProcess={mockOnProcess} />);

    // First add some content
    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'some test content' } });
    expect(textarea.value).toBe('some test content');

    // Then clear it
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(textarea.value).toBe('');
  });

  it('displays line count correctly', () => {
    render(<BatchProcessor onProcess={mockOnProcess} />);

    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
    
    // Initially should show 0 lines
    expect(screen.getByText('Lines to process: 0')).toBeInTheDocument();

    // Add some lines
    fireEvent.change(textarea, { 
      target: { value: 'line1\nline2\nline3\n\n' } 
    });

    // Should show 3 lines (empty lines are filtered)
    expect(screen.getByText('Lines to process: 3')).toBeInTheDocument();
  });

  it('disables Process Batch button when input is empty', () => {
    render(<BatchProcessor onProcess={mockOnProcess} />);

    const processButton = screen.getByText('Process Batch');
    expect(processButton).toBeDisabled();
  });

  it('enables Process Batch button when input has content', () => {
    render(<BatchProcessor onProcess={mockOnProcess} />);

    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
    fireEvent.change(textarea, { target: { value: '00206AB48DE' } });

    const processButton = screen.getByText('Process Batch');
    expect(processButton).not.toBeDisabled();
  });

  it('processes batch and calls onProcess with results', async () => {
    // Mock successful parse
    mockKLVParser.parse
      .mockReturnValueOnce({
        results: [{ key: '002', len: 6, value: 'AB48DE', pos: 0, name: 'Tracking Number' }],
        errors: []
      })
      .mockReturnValueOnce({
        results: [],
        errors: ['Invalid format']
      });

    render(<BatchProcessor onProcess={mockOnProcess} />);

    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
    fireEvent.change(textarea, { 
      target: { value: '00206AB48DE\n99999INVALID' } 
    });

    const processButton = screen.getByText('Process Batch');
    fireEvent.click(processButton);

    // Should show processing state
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(processButton).toBeDisabled();

    // Fast-forward time to complete processing
    jest.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(mockOnProcess).toHaveBeenCalledWith([
        {
          line: 1,
          input: '00206AB48DE',
          results: [{ key: '002', len: 6, value: 'AB48DE', pos: 0, name: 'Tracking Number' }],
          errors: []
        },
        {
          line: 2,
          input: '99999INVALID',
          results: [],
          errors: ['Invalid format']
        }
      ]);
    });
  });

  it('displays batch results after processing', async () => {
    mockKLVParser.parse
      .mockReturnValueOnce({
        results: [{ key: '002', len: 6, value: 'AB48DE', pos: 0, name: 'Tracking Number' }],
        errors: []
      })
      .mockReturnValueOnce({
        results: [],
        errors: ['Invalid format']
      });

    render(<BatchProcessor onProcess={mockOnProcess} />);

    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
    fireEvent.change(textarea, { 
      target: { value: '00206AB48DE\n99999INVALID' } 
    });

    fireEvent.click(screen.getByText('Process Batch'));
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByText('Batch Results')).toBeInTheDocument();
      expect(screen.getByText('1 successful, 1 failed')).toBeInTheDocument();
    });

    // Check individual result displays
    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();
    expect(screen.getByText('1 entries')).toBeInTheDocument();
    expect(screen.getByText('1 errors')).toBeInTheDocument();
  });

  it('shows success styling for successful results', async () => {
    mockKLVParser.parse.mockReturnValue({
      results: [{ key: '002', len: 6, value: 'AB48DE', pos: 0, name: 'Tracking Number' }],
      errors: []
    });

    render(<BatchProcessor onProcess={mockOnProcess} />);

    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
    fireEvent.change(textarea, { target: { value: '00206AB48DE' } });

    fireEvent.click(screen.getByText('Process Batch'));
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      const resultContainer = screen.getByText('Line 1').closest('.border.rounded.p-3');
      expect(resultContainer).toHaveClass('bg-green-50', 'border-green-200');
    });
  });

  it('shows error styling for failed results', async () => {
    mockKLVParser.parse.mockReturnValue({
      results: [],
      errors: ['Invalid format']
    });

    render(<BatchProcessor onProcess={mockOnProcess} />);

    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
    fireEvent.change(textarea, { target: { value: 'INVALID' } });

    fireEvent.click(screen.getByText('Process Batch'));
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      const resultContainer = screen.getByText('Line 1').closest('.border.rounded.p-3');
      expect(resultContainer).toHaveClass('bg-red-50', 'border-red-200');
    });
  });

  it('displays error messages for failed results', async () => {
    mockKLVParser.parse.mockReturnValue({
      results: [],
      errors: ['Invalid format', 'Incomplete entry']
    });

    render(<BatchProcessor onProcess={mockOnProcess} />);

    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
    fireEvent.change(textarea, { target: { value: 'INVALID' } });

    fireEvent.click(screen.getByText('Process Batch'));
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByText('Errors: Invalid format, Incomplete entry')).toBeInTheDocument();
    });
  });

  it('displays keys found for successful results', async () => {
    mockKLVParser.parse.mockReturnValue({
      results: [
        { key: '002', len: 6, value: 'AB48DE', pos: 0, name: 'Tracking Number' },
        { key: '026', len: 4, value: '4577', pos: 11, name: 'Merchant Category Code' }
      ],
      errors: []
    });

    render(<BatchProcessor onProcess={mockOnProcess} />);

    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
    fireEvent.change(textarea, { target: { value: '00206AB48DE026044577' } });

    fireEvent.click(screen.getByText('Process Batch'));
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByText('Keys found: 002, 026')).toBeInTheDocument();
    });
  });

  it('filters empty lines from input', async () => {
    mockKLVParser.parse.mockReturnValue({
      results: [{ key: '002', len: 6, value: 'AB48DE', pos: 0, name: 'Tracking Number' }],
      errors: []
    });

    render(<BatchProcessor onProcess={mockOnProcess} />);

    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
    fireEvent.change(textarea, { 
      target: { value: '00206AB48DE\n\n\n   \n' } 
    });

    fireEvent.click(screen.getByText('Process Batch'));
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(mockOnProcess).toHaveBeenCalledWith([
        {
          line: 1,
          input: '00206AB48DE',
          results: [{ key: '002', len: 6, value: 'AB48DE', pos: 0, name: 'Tracking Number' }],
          errors: []
        }
      ]);
    });
  });

  it('clears results when Clear button is clicked after processing', async () => {
    mockKLVParser.parse.mockReturnValue({
      results: [{ key: '002', len: 6, value: 'AB48DE', pos: 0, name: 'Tracking Number' }],
      errors: []
    });

    render(<BatchProcessor onProcess={mockOnProcess} />);

    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
    fireEvent.change(textarea, { target: { value: '00206AB48DE' } });

    fireEvent.click(screen.getByText('Process Batch'));
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByText('Batch Results')).toBeInTheDocument();
    });

    // Clear should remove results
    fireEvent.click(screen.getByText('Clear'));
    expect(screen.queryByText('Batch Results')).not.toBeInTheDocument();
  });

  it('handles processing state correctly', () => {
    render(<BatchProcessor onProcess={mockOnProcess} />);

    const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
    fireEvent.change(textarea, { target: { value: '00206AB48DE' } });

    const processButton = screen.getByText('Process Batch');
    fireEvent.click(processButton);

    // Should show processing state
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(processButton).toBeDisabled();
    expect(screen.getByText('Processing...').parentElement?.querySelector('.animate-spin')).toBeInTheDocument();
  });
});