import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '../../components/FileUpload';

// Mock file reading
const mockFileContent = '00206AB48DE026044577';
const mockFileName = 'test-klv-data.txt';

describe('FileUpload', () => {
  const mockOnFileLoad = jest.fn();

  beforeEach(() => {
    mockOnFileLoad.mockClear();
  });

  it('should render file upload component', () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    expect(screen.getByText('Upload KLV data file (.txt, .log, .csv)')).toBeInTheDocument();
    expect(screen.getByText('Choose File')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload KLV data file')).toBeInTheDocument();
  });

  it('should have correct file input attributes', () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file');
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.txt,.log,.csv,.json');
    expect(fileInput).toHaveClass('hidden');
  });

  it('should trigger file input when choose file button is clicked', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const chooseFileButton = screen.getByText('Choose File');
    const fileInput = screen.getByLabelText('Upload KLV data file');
    
    const clickSpy = jest.spyOn(fileInput, 'click');
    
    await user.click(chooseFileButton);
    
    expect(clickSpy).toHaveBeenCalled();
    
    clickSpy.mockRestore();
  });

  it('should handle file selection and call onFileLoad', async () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file');
    
    // Create a mock file with text() method
    const mockFile = new File([mockFileContent], mockFileName, { type: 'text/plain' });
    
    // Mock the text() method on the File prototype
    const originalText = File.prototype.text;
    File.prototype.text = jest.fn().mockResolvedValue(mockFileContent);
    
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    await waitFor(() => {
      expect(mockOnFileLoad).toHaveBeenCalledWith(mockFileContent, mockFileName);
    });
    
    // Restore original method
    File.prototype.text = originalText;
  });

  it('should clear input value after file processing', async () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file') as HTMLInputElement;
    const mockFile = new File([mockFileContent], mockFileName, { type: 'text/plain' });
    
    // Mock the text() method
    File.prototype.text = jest.fn().mockResolvedValue(mockFileContent);
    
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    await waitFor(() => {
      expect(mockOnFileLoad).toHaveBeenCalled();
    });
    
    expect(fileInput.value).toBe('');
  });

  it('should handle file reading errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file');
    const mockFile = new File([mockFileContent], mockFileName, { type: 'text/plain' });
    
    // Mock text() to throw an error
    File.prototype.text = jest.fn().mockRejectedValue(new Error('File read error'));
    
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error reading file:', expect.any(Error));
      expect(alertSpy).toHaveBeenCalledWith('Error reading file. Please try again.');
    });
    
    expect(mockOnFileLoad).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('should not process when no file is selected', async () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const fileInput = screen.getByLabelText('Upload KLV data file');
    
    fireEvent.change(fileInput, { target: { files: [] } });
    
    expect(mockOnFileLoad).not.toHaveBeenCalled();
  });

  it('should have proper styling classes', () => {
    render(<FileUpload onFileLoad={mockOnFileLoad} />);
    
    const uploadArea = screen.getByText('Upload KLV data file (.txt, .log, .csv)').closest('div');
    expect(uploadArea).toHaveClass('border-2', 'border-dashed', 'border-gray-300', 'rounded', 'p-4');
    
    const button = screen.getByText('Choose File');
    expect(button).toHaveClass('px-4', 'py-2', 'bg-blue-500', 'text-white', 'rounded');
  });
});