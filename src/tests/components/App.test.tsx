import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// Mock clipboard API
const mockWriteText = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('App Integration Tests', () => {
  beforeEach(() => {
    mockWriteText.mockClear();
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the main app with header and navigation', () => {
      render(<App />);
      
      expect(screen.getByText('KLV Data Extraction Suite')).toBeInTheDocument();
      expect(screen.getByText('Complete toolkit for KLV data processing, parsing, and analysis')).toBeInTheDocument();
      
      // Check navigation tabs
      expect(screen.getByText('Extractor')).toBeInTheDocument();
      expect(screen.getByText('Builder')).toBeInTheDocument();
      expect(screen.getByText('Batch')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
    });

    it('should start with extractor tab active', () => {
      render(<App />);
      
      const extractorTab = screen.getByRole('button', { name: /extractor/i });
      expect(extractorTab).toHaveClass('border-blue-500', 'text-blue-600');
      
      // Should show the KLV input textarea
      expect(screen.getByPlaceholderText(/Enter KLV data/)).toBeInTheDocument();
    });

    it('should show default sample KLV data', () => {
      render(<App />);
      
      const textarea = screen.getByPlaceholderText(/Enter KLV data/);
      expect(textarea).toHaveValue('00206AB48DE026044577');
    });

    it('should render quick reference footer', () => {
      render(<App />);
      
      expect(screen.getByText('KLV Format Quick Reference')).toBeInTheDocument();
      expect(screen.getByText('Format Structure:')).toBeInTheDocument();
      expect(screen.getByText('Example:')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to builder tab when clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const builderTab = screen.getByRole('button', { name: /builder/i });
      await user.click(builderTab);
      
      expect(builderTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(screen.getByText('KLV Builder')).toBeInTheDocument();
    });

    it('should switch to batch tab when clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const batchTab = screen.getByRole('button', { name: /batch/i });
      await user.click(batchTab);
      
      expect(batchTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(screen.getByText('Batch Processor')).toBeInTheDocument();
    });

    it('should switch to history tab when clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const historyTab = screen.getByRole('button', { name: /history/i });
      await user.click(historyTab);
      
      expect(historyTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(screen.getByText('Processing History')).toBeInTheDocument();
      expect(screen.getByText('No processing history yet')).toBeInTheDocument();
    });

    it('should maintain tab state during navigation', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Switch to builder
      await user.click(screen.getByRole('button', { name: /builder/i }));
      expect(screen.getByText('KLV Builder')).toBeInTheDocument();
      
      // Switch back to extractor
      await user.click(screen.getByRole('button', { name: /extractor/i }));
      expect(screen.getByPlaceholderText(/Enter KLV data/)).toBeInTheDocument();
    });
  });

  describe('KLV Parsing Integration', () => {
    it('should parse default KLV data and show results', () => {
      render(<App />);
      
      // Default data should parse and show results
      expect(screen.getByText('Parsed KLV Data (2 entries)')).toBeInTheDocument();
      expect(screen.getByText('Key 002')).toBeInTheDocument();
      expect(screen.getByText('Key 026')).toBeInTheDocument();
      expect(screen.getByText('AB48DE')).toBeInTheDocument();
      expect(screen.getByText('4577')).toBeInTheDocument();
    });

    it('should update results when KLV input changes', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const textarea = screen.getByPlaceholderText(/Enter KLV data/);
      await user.clear(textarea);
      await user.type(textarea, '04210000050010008USD');
      
      await waitFor(() => {
        expect(screen.getByText('Parsed KLV Data (3 entries)')).toBeInTheDocument();
        expect(screen.getByText('Key 042')).toBeInTheDocument();
        expect(screen.getByText('Key 100')).toBeInTheDocument();
        expect(screen.getByText('Key 043')).toBeInTheDocument();
      });
    });

    it('should show statistics for parsed data', () => {
      render(<App />);
      
      expect(screen.getByText('Total Entries')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Data Length')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('should handle invalid KLV data with error display', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const textarea = screen.getByPlaceholderText(/Enter KLV data/);
      await user.clear(textarea);
      await user.type(textarea, 'INVALID_KLV_DATA');
      
      await waitFor(() => {
        expect(screen.getByText('Parsing Errors')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter Functionality', () => {
    it('should filter results based on search term', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Search for key 002
      const searchInput = screen.getByPlaceholderText('Search keys, values, names...');
      await user.type(searchInput, '002');
      
      expect(screen.getByText('Key 002')).toBeInTheDocument();
      expect(screen.queryByText('Key 026')).not.toBeInTheDocument();
    });

    it('should show no results message for invalid search', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const searchInput = screen.getByPlaceholderText('Search keys, values, names...');
      await user.type(searchInput, 'NONEXISTENT');
      
      expect(screen.getByText('No entries match "NONEXISTENT"')).toBeInTheDocument();
      expect(screen.getByText('Clear search')).toBeInTheDocument();
    });

    it('should clear search when clear search button is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const searchInput = screen.getByPlaceholderText('Search keys, values, names...');
      await user.type(searchInput, 'NONEXISTENT');
      
      const clearButton = screen.getByText('Clear search');
      await user.click(clearButton);
      
      expect(searchInput).toHaveValue('');
      expect(screen.getByText('Key 002')).toBeInTheDocument();
      expect(screen.getByText('Key 026')).toBeInTheDocument();
    });
  });

  describe('Raw Data Toggle', () => {
    it('should show raw data when toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const showRawButton = screen.getByText('Show Raw');
      await user.click(showRawButton);
      
      expect(screen.getByText('Hide Raw')).toBeInTheDocument();
      expect(screen.getByText('Raw KLV:')).toBeInTheDocument();
      expect(screen.getByText('00206AB48DE026044577')).toBeInTheDocument();
    });

    it('should hide raw data when toggle is clicked again', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Show raw data first
      await user.click(screen.getByText('Show Raw'));
      expect(screen.getByText('Raw KLV:')).toBeInTheDocument();
      
      // Hide raw data
      await user.click(screen.getByText('Hide Raw'));
      expect(screen.queryByText('Raw KLV:')).not.toBeInTheDocument();
      expect(screen.getByText('Show Raw')).toBeInTheDocument();
    });
  });

  describe('Sample Data Loading', () => {
    it('should load sample data when sample buttons are clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const sample2Button = screen.getByText('Sample 2');
      await user.click(sample2Button);
      
      const textarea = screen.getByPlaceholderText(/Enter KLV data/);
      expect(textarea).toHaveValue('04210000050010008USD04305Test Merchant25103EMV25107Visa');
    });

    it('should clear input when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);
      
      const textarea = screen.getByPlaceholderText(/Enter KLV data/);
      expect(textarea).toHaveValue('');
    });
  });

  describe('Copy to Clipboard Functionality', () => {
    it('should copy individual values when copy button is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const copyButtons = screen.getAllByTitle('Copy value');
      await user.click(copyButtons[0]);
      
      expect(mockWriteText).toHaveBeenCalledWith('AB48DE');
    });

    it('should handle clipboard errors gracefully', async () => {
      const user = userEvent.setup();
      mockWriteText.mockRejectedValue(new Error('Clipboard error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<App />);
      
      const copyButtons = screen.getAllByTitle('Copy value');
      await user.click(copyButtons[0]);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('History Management', () => {
    it('should add entry to history when Save to History is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const saveToHistoryButton = screen.getByText('Save to History');
      await user.click(saveToHistoryButton);
      
      // Switch to history tab
      await user.click(screen.getByRole('button', { name: /history/i }));
      
      expect(screen.queryByText('No processing history yet')).not.toBeInTheDocument();
      expect(screen.getByText('2 entries')).toBeInTheDocument();
    });

    it('should load data from history when Load button is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Add to history first
      await user.click(screen.getByText('Save to History'));
      
      // Change input
      const textarea = screen.getByPlaceholderText(/Enter KLV data/);
      await user.clear(textarea);
      await user.type(textarea, 'DIFFERENT_DATA');
      
      // Go to history and load previous entry
      await user.click(screen.getByRole('button', { name: /history/i }));
      const loadButton = screen.getByText('Load');
      await user.click(loadButton);
      
      // Should switch back to extractor tab with original data
      expect(screen.getByRole('button', { name: /extractor/i })).toHaveClass('border-blue-500');
      const updatedTextarea = screen.getByPlaceholderText(/Enter KLV data/);
      expect(updatedTextarea).toHaveValue('00206AB48DE026044577');
    });

    it('should clear all history when Clear All History is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Add to history first
      await user.click(screen.getByText('Save to History'));
      
      // Go to history tab
      await user.click(screen.getByRole('button', { name: /history/i }));
      
      // Clear all history
      const clearAllButton = screen.getByText('Clear All History');
      await user.click(clearAllButton);
      
      expect(screen.getByText('No processing history yet')).toBeInTheDocument();
    });

    it('should copy history entry data when Copy button is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Add to history first
      await user.click(screen.getByText('Save to History'));
      
      // Go to history tab and copy
      await user.click(screen.getByRole('button', { name: /history/i }));
      const copyButton = screen.getByText('Copy');
      await user.click(copyButton);
      
      expect(mockWriteText).toHaveBeenCalledWith('00206AB48DE026044577');
    });
  });

  describe('Builder Integration', () => {
    it('should navigate to extractor when KLV is built', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Go to builder tab
      await user.click(screen.getByRole('button', { name: /builder/i }));
      
      // Add a value and build KLV
      const valueInput = screen.getByPlaceholderText('Enter value...');
      await user.type(valueInput, 'TEST123');
      
      const buildButton = screen.getByText('Build KLV');
      await user.click(buildButton);
      
      // Should switch to extractor tab with built KLV
      expect(screen.getByRole('button', { name: /extractor/i })).toHaveClass('border-blue-500');
      const textarea = screen.getByPlaceholderText(/Enter KLV data/);
      expect(textarea).toHaveValue('00207TEST123');
    });
  });

  describe('File Upload Integration', () => {
    it('should handle file upload and switch to extractor', async () => {
      render(<App />);
      
      const fileInput = screen.getByLabelText('Upload KLV data file');
      const mockFile = new File(['04210000050010008USD'], 'test.txt', { type: 'text/plain' });
      
      // Mock the text() method
      File.prototype.text = jest.fn().mockResolvedValue('04210000050010008USD');
      
      // Simulate file upload
      const event = {
        target: { files: [mockFile] }
      };
      
      fireEvent.change(fileInput, event);
      
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/Enter KLV data/);
        expect(textarea).toHaveValue('04210000050010008USD');
      });
    });
  });

  describe('Export Integration', () => {
    it('should show export buttons when data is present', () => {
      render(<App />);
      
      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('Table')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have proper grid layouts for responsive design', () => {
      render(<App />);
      
      const inputGrid = screen.getByText('KLV Data Input').closest('.grid');
      expect(inputGrid).toHaveClass('md:grid-cols-2');
      
      const referenceGrid = screen.getByText('Format Structure:').closest('.grid');
      expect(referenceGrid).toHaveClass('md:grid-cols-4');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty input gracefully', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const textarea = screen.getByPlaceholderText(/Enter KLV data/);
      await user.clear(textarea);
      
      // Should not show results section when empty
      expect(screen.queryByText(/Parsed KLV Data/)).not.toBeInTheDocument();
      expect(screen.queryByText('Total Entries')).not.toBeInTheDocument();
    });

    it('should maintain state consistency across tab switches', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const textarea = screen.getByPlaceholderText(/Enter KLV data/);
      await user.clear(textarea);
      await user.type(textarea, 'CUSTOM_DATA');
      
      // Switch tabs and come back
      await user.click(screen.getByRole('button', { name: /builder/i }));
      await user.click(screen.getByRole('button', { name: /extractor/i }));
      
      const updatedTextarea = screen.getByPlaceholderText(/Enter KLV data/);
      expect(updatedTextarea).toHaveValue('CUSTOM_DATA');
    });
  });
});

const { fireEvent } = require('@testing-library/react');