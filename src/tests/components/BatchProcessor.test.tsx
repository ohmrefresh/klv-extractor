import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BatchProcessor from '../../components/BatchProcessor';

describe('BatchProcessor', () => {
  const mockOnProcess = jest.fn();

  beforeEach(() => {
    mockOnProcess.mockClear();
  });

  describe('Initial Rendering', () => {
    it('should render batch processor with initial state', () => {
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      expect(screen.getByText('Batch Processor')).toBeInTheDocument();
      expect(screen.getByText('Load Sample')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
      expect(screen.getByText('KLV Data (one entry per line)')).toBeInTheDocument();
      expect(screen.getByText('Process Batch')).toBeInTheDocument();
    });

    it('should have correct initial textarea state', () => {
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      expect(textarea).toHaveValue('');
      expect(screen.getByText('Lines to process: 0')).toBeInTheDocument();
    });

    it('should have Process Batch button disabled initially', () => {
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const processButton = screen.getByText('Process Batch');
      expect(processButton).toBeDisabled();
    });

    it('should not show results initially', () => {
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      expect(screen.queryByText('Batch Results')).not.toBeInTheDocument();
    });
  });

  describe('Sample Data Loading', () => {
    it('should load sample data when Load Sample button is clicked', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const loadSampleButton = screen.getByText('Load Sample');
      await user.click(loadSampleButton);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      expect(textarea).toHaveValue(expect.stringContaining('00206AB48DE026044577'));
      expect(textarea).toHaveValue(expect.stringContaining('04210000050010008USD04305Test Merchant'));
      expect(screen.getByText('Lines to process: 4')).toBeInTheDocument();
    });

    it('should enable Process Batch button after loading sample', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const loadSampleButton = screen.getByText('Load Sample');
      await user.click(loadSampleButton);
      
      const processButton = screen.getByText('Process Batch');
      expect(processButton).not.toBeDisabled();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear textarea and results when Clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      // Load sample data first
      await user.click(screen.getByText('Load Sample'));
      
      // Clear the data
      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      expect(textarea).toHaveValue('');
      expect(screen.getByText('Lines to process: 0')).toBeInTheDocument();
    });
  });

  describe('Input Management', () => {
    it('should update textarea value and line count when user types', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, '00206AB48DE026044577\n04210000050010008USD');
      
      expect(textarea).toHaveValue('00206AB48DE026044577\n04210000050010008USD');
      expect(screen.getByText('Lines to process: 2')).toBeInTheDocument();
    });

    it('should not count empty lines in line count', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, '00206AB48DE026044577\n\n\n04210000050010008USD\n');
      
      expect(screen.getByText('Lines to process: 2')).toBeInTheDocument();
    });

    it('should enable Process Batch button when input is provided', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, '00206AB48DE026044577');
      
      const processButton = screen.getByText('Process Batch');
      expect(processButton).not.toBeDisabled();
    });
  });

  describe('Batch Processing', () => {
    it('should show processing state when Process Batch is clicked', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, '00206AB48DE026044577');
      
      const processButton = screen.getByText('Process Batch');
      await user.click(processButton);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
    });

    it('should process single valid KLV string and show results', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, '00206AB48DE026044577');
      
      const processButton = screen.getByText('Process Batch');
      await user.click(processButton);
      
      // Fast-forward the processing delay
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('Batch Results')).toBeInTheDocument();
        expect(screen.getByText('1 successful, 0 failed')).toBeInTheDocument();
        expect(screen.getByText('Line 1')).toBeInTheDocument();
        expect(screen.getByText('2 entries')).toBeInTheDocument();
      });
      
      expect(mockOnProcess).toHaveBeenCalledWith([
        expect.objectContaining({
          line: 1,
          input: '00206AB48DE026044577',
          results: expect.arrayContaining([
            expect.objectContaining({ key: '002' }),
            expect.objectContaining({ key: '026' })
          ]),
          errors: []
        })
      ]);
    });

    it('should process multiple KLV strings and show aggregated results', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, '00206AB48DE026044577\n04210000050010008USD');
      
      const processButton = screen.getByText('Process Batch');
      await user.click(processButton);
      
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('Batch Results')).toBeInTheDocument();
        expect(screen.getByText('2 successful, 0 failed')).toBeInTheDocument();
        expect(screen.getByText('Line 1')).toBeInTheDocument();
        expect(screen.getByText('Line 2')).toBeInTheDocument();
      });
      
      expect(mockOnProcess).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            line: 1,
            input: '00206AB48DE026044577'
          }),
          expect.objectContaining({
            line: 2,
            input: '04210000050010008USD'
          })
        ])
      );
    });

    it('should handle invalid KLV strings and show errors', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, 'INVALID_KLV_STRING');
      
      const processButton = screen.getByText('Process Batch');
      await user.click(processButton);
      
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('Batch Results')).toBeInTheDocument();
        expect(screen.getByText('0 successful, 1 failed')).toBeInTheDocument();
        expect(screen.getByText(/errors/)).toBeInTheDocument();
      });
    });

    it('should handle mixed valid and invalid KLV strings', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, '00206AB48DE026044577\nINVALID_STRING\n04210000050010008USD');
      
      const processButton = screen.getByText('Process Batch');
      await user.click(processButton);
      
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('Batch Results')).toBeInTheDocument();
        expect(screen.getByText('2 successful, 1 failed')).toBeInTheDocument();
      });
    });
  });

  describe('Results Display', () => {
    it('should show correct success indicators for valid entries', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, '00206AB48DE026044577');
      
      await user.click(screen.getByText('Process Batch'));
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        const successResult = screen.getByText('Line 1').closest('div');
        expect(successResult).toHaveClass('bg-green-50', 'border-green-200');
        expect(screen.getByText('Keys found: 002, 026')).toBeInTheDocument();
      });
    });

    it('should show correct error indicators for invalid entries', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, 'INVALID_KLV');
      
      await user.click(screen.getByText('Process Batch'));
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        const errorResult = screen.getByText('Line 1').closest('div');
        expect(errorResult).toHaveClass('bg-red-50', 'border-red-200');
        expect(screen.getByText(/Errors:/)).toBeInTheDocument();
      });
    });

    it('should display original input for each result', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const inputString = '00206AB48DE026044577';
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, inputString);
      
      await user.click(screen.getByText('Process Batch'));
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText(inputString)).toBeInTheDocument();
      });
    });

    it('should handle results with scrollable area when many entries', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      // Load sample data which has 4 entries
      await user.click(screen.getByText('Load Sample'));
      await user.click(screen.getByText('Process Batch'));
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        const resultsContainer = screen.getByText('Batch Results').parentElement?.querySelector('.max-h-96');
        expect(resultsContainer).toBeInTheDocument();
        expect(resultsContainer).toHaveClass('overflow-y-auto');
      });
    });
  });

  describe('Styling and Accessibility', () => {
    it('should have correct CSS classes for layout', () => {
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const container = screen.getByText('Batch Processor').closest('div');
      expect(container).toHaveClass('space-y-4');
    });

    it('should have proper button styling', () => {
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const loadSampleButton = screen.getByText('Load Sample');
      expect(loadSampleButton).toHaveClass('bg-blue-100', 'text-blue-700');
      
      const processButton = screen.getByText('Process Batch');
      expect(processButton).toHaveClass('bg-purple-500', 'text-white');
      
      const clearButton = screen.getByText('Clear');
      expect(clearButton).toHaveClass('border', 'rounded');
    });

    it('should have proper textarea styling', () => {
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      expect(textarea).toHaveClass('font-mono', 'text-sm', 'resize-vertical');
      expect(textarea).toHaveAttribute('rows', '8');
    });

    it('should have proper disabled state styling', () => {
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const processButton = screen.getByText('Process Batch');
      expect(processButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('should have proper labels for form elements', () => {
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      expect(screen.getByText('KLV Data (one entry per line)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty lines and whitespace correctly', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, '00206AB48DE026044577\n\n   \n\t\n04210000050010008USD');
      
      await user.click(screen.getByText('Process Batch'));
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(mockOnProcess).toHaveBeenCalledWith([
          expect.objectContaining({ line: 1, input: '00206AB48DE026044577' }),
          expect.objectContaining({ line: 2, input: '04210000050010008USD' })
        ]);
      });
    });

    it('should trim whitespace from input lines', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, '  00206AB48DE026044577  ');
      
      await user.click(screen.getByText('Process Batch'));
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(mockOnProcess).toHaveBeenCalledWith([
          expect.objectContaining({ input: '00206AB48DE026044577' })
        ]);
      });
    });

    it('should handle very long input strings', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const longInput = '00206AB48DE026044577'.repeat(10);
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, longInput);
      
      await user.click(screen.getByText('Process Batch'));
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(mockOnProcess).toHaveBeenCalledWith([
          expect.objectContaining({ input: longInput })
        ]);
      });
    });

    it('should handle special characters in input', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      const specialInput = 'ABC@#$%^&*()DEF';
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, specialInput);
      
      const processButton = screen.getByRole('button', { name: /process batch/i });
      await user.click(processButton);
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(mockOnProcess).toHaveBeenCalledWith([
          expect.objectContaining({ input: specialInput })
        ]);
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should clear results when new processing starts', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      // Process first batch
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      await user.type(textarea, '00206AB48DE026044577');
      const processButton = screen.getByRole('button', { name: /process batch/i });
      await user.click(processButton);
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('Batch Results')).toBeInTheDocument();
      });
      
      // Process second batch
      await user.clear(textarea);
      await user.type(textarea, '04210000050010008USD');
      await user.click(processButton);
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(mockOnProcess).toHaveBeenCalledTimes(2);
      });
    });

    it('should maintain state consistency during rapid interactions', async () => {
      const user = userEvent.setup();
      render(<BatchProcessor onProcess={mockOnProcess} />);
      
      // Rapid sequence of actions
      const loadSampleButton = screen.getByText('Load Sample');
      const clearButton = screen.getByText('Clear');
      
      await user.click(loadSampleButton);
      await user.click(clearButton);
      await user.click(loadSampleButton);
      
      const textarea = screen.getByPlaceholderText(/Enter multiple KLV strings/);
      expect(textarea).toHaveValue(expect.stringContaining('00206AB48DE026044577'));
    });
  });
});