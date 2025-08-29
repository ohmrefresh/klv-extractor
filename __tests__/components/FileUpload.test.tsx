import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUpload from '../../components/FileUpload';

// Mock file reading functionality
const mockFile = (name: string, content: string, type = 'text/plain') => {
  const file = new File([content], name, { type });
  // Mock the text() method to return the content
  file.text = jest.fn().mockResolvedValue(content);
  return file;
};

describe('FileUpload Component', () => {
  let mockOnFileLoad: jest.Mock;

  beforeEach(() => {
    mockOnFileLoad = jest.fn();
  });

  it('renders file upload interface', () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    expect(screen.getByText('Upload KLV data file (.txt, .log, .csv)')).toBeInTheDocument();
    expect(screen.getByText('Choose File')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload KLV data file')).toBeInTheDocument();
  });

  it('triggers file selection when Choose File button is clicked', () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file') as HTMLInputElement;
    const chooseButton = screen.getByText('Choose File');
    
    // Mock the click method
    const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => {});
    
    fireEvent.click(chooseButton);
    
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('handles file selection and calls onFileLoad', async () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file') as HTMLInputElement;
    const testFile = mockFile('test.txt', '00206AB48DE026044577');
    
    fireEvent.change(fileInput, {
      target: { files: [testFile] }
    });
    
    await waitFor(() => {
      expect(mockOnFileLoad).toHaveBeenCalledWith('00206AB48DE026044577', 'test.txt');
    });
  });

  it('accepts correct file types', () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file');
    expect(fileInput).toHaveAttribute('accept', '.txt,.log,.csv,.json');
  });

  it('handles multiple file types correctly', async () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file') as HTMLInputElement;
    
    // Test .txt file
    const txtFile = mockFile('data.txt', 'txt content');
    fireEvent.change(fileInput, { target: { files: [txtFile] } });
    
    await waitFor(() => {
      expect(mockOnFileLoad).toHaveBeenCalledWith('txt content', 'data.txt');
    });
    
    // Test .csv file
    const csvFile = mockFile('data.csv', 'csv content', 'text/csv');
    fireEvent.change(fileInput, { target: { files: [csvFile] } });
    
    await waitFor(() => {
      expect(mockOnFileLoad).toHaveBeenCalledWith('csv content', 'data.csv');
    });
  });

  it('does nothing when no file is selected', async () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file') as HTMLInputElement;
    
    fireEvent.change(fileInput, {
      target: { files: null }
    });
    
    // Wait a bit to ensure no calls are made
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockOnFileLoad).not.toHaveBeenCalled();
  });

  it('clears file input after processing', async () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file') as HTMLInputElement;
    const testFile = mockFile('test.txt', 'test content');
    
    fireEvent.change(fileInput, {
      target: { files: [testFile] }
    });
    
    await waitFor(() => {
      expect(mockOnFileLoad).toHaveBeenCalled();
    });
    
    // File input should be cleared
    expect(fileInput.value).toBe('');
  });

  it('handles file reading errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file') as HTMLInputElement;
    
    // Create a mock file that will fail to read
    const failingFile = {
      name: 'failing.txt',
      text: () => Promise.reject(new Error('Read failed'))
    } as File;
    
    fireEvent.change(fileInput, {
      target: { files: [failingFile] }
    });
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error reading file:', expect.any(Error));
      expect(alertSpy).toHaveBeenCalledWith('Error reading file. Please try again.');
    });
    
    expect(mockOnFileLoad).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('has proper styling classes', () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const container = screen.getByText('Upload KLV data file (.txt, .log, .csv)').closest('div');
    expect(container).toHaveClass('border-2', 'border-dashed', 'border-gray-300', 'rounded', 'p-4', 'text-center');
    
    const button = screen.getByText('Choose File');
    expect(button).toHaveClass('px-4', 'py-2', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-600');
  });

  it('has hidden file input', () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file');
    expect(fileInput).toHaveClass('hidden');
  });
});