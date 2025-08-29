import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KLVBuilder from '../../components/KLVBuilder';

// Mock the KLVParser
jest.mock('../../utils/KLVParser', () => ({
  __esModule: true,
  default: {
    definitions: {
      '002': 'Tracking Number',
      '026': 'Merchant Category Code',
      '032': 'Acquiring Institution Code'
    },
    build: jest.fn()
  }
}));

const mockKLVParser = require('../../utils/KLVParser').default;

describe('KLVBuilder Component', () => {
  let mockOnBuild: jest.Mock;

  beforeEach(() => {
    mockOnBuild = jest.fn();
    jest.clearAllMocks();
  });

  it('renders initial state with one empty entry', () => {
    render(<KLVBuilder onBuild={mockOnBuild} />);

    expect(screen.getByText('KLV Builder')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
    expect(screen.getByText('Add Entry')).toBeInTheDocument();
    expect(screen.getByText('Build KLV')).toBeInTheDocument();
    
    // Should have one key selector with default value '002'
    const keySelect = screen.getByDisplayValue('002 - Tracking Number...');
    expect(keySelect).toBeInTheDocument();
    
    // Should have one value input
    const valueInput = screen.getByPlaceholderText('Enter value...');
    expect(valueInput).toBeInTheDocument();
  });

  it('adds new entry when Add Entry button is clicked', () => {
    render(<KLVBuilder onBuild={mockOnBuild} />);

    const addButton = screen.getByText('Add Entry');
    fireEvent.click(addButton);

    // Should now have two key selectors
    const keySelects = screen.getAllByDisplayValue('002 - Tracking Number...');
    expect(keySelects).toHaveLength(2);

    // Should have two value inputs
    const valueInputs = screen.getAllByPlaceholderText('Enter value...');
    expect(valueInputs).toHaveLength(2);
  });

  it('removes entry when remove button is clicked', () => {
    render(<KLVBuilder onBuild={mockOnBuild} />);

    // Add a second entry first
    fireEvent.click(screen.getByText('Add Entry'));
    expect(screen.getAllByPlaceholderText('Enter value...')).toHaveLength(2);

    // Remove the first entry
    const removeButtons = screen.getAllByTitle('Remove entry');
    fireEvent.click(removeButtons[0]);

    // Should be back to one entry
    expect(screen.getAllByPlaceholderText('Enter value...')).toHaveLength(1);
  });

  it('prevents removing entry when only one exists', () => {
    render(<KLVBuilder onBuild={mockOnBuild} />);

    const removeButton = screen.getByTitle('Remove entry');
    expect(removeButton).toBeDisabled();
  });

  it('updates entry values correctly', () => {
    render(<KLVBuilder onBuild={mockOnBuild} />);

    const valueInput = screen.getByPlaceholderText('Enter value...');
    fireEvent.change(valueInput, { target: { value: 'TEST123' } });

    expect(valueInput).toHaveValue('TEST123');
  });

  it('updates entry keys correctly', () => {
    render(<KLVBuilder onBuild={mockOnBuild} />);

    const keySelect = screen.getByDisplayValue('002 - Tracking Number...');
    fireEvent.change(keySelect, { target: { value: '026' } });

    expect(keySelect).toHaveValue('026');
  });

  it('displays value length dynamically', () => {
    render(<KLVBuilder onBuild={mockOnBuild} />);

    const valueInput = screen.getByPlaceholderText('Enter value...');
    
    // Initially should show length 0
    expect(screen.getByText('Value (Length: 0)')).toBeInTheDocument();

    // After entering text, should update length
    fireEvent.change(valueInput, { target: { value: 'ABCDE' } });
    expect(screen.getByText('Value (Length: 5)')).toBeInTheDocument();
  });

  it('builds KLV and calls onBuild when Build KLV button is clicked', () => {
    mockKLVParser.build.mockReturnValue('00205ABCDE');

    render(<KLVBuilder onBuild={mockOnBuild} />);

    // Enter a value
    const valueInput = screen.getByPlaceholderText('Enter value...');
    fireEvent.change(valueInput, { target: { value: 'ABCDE' } });

    // Click build button
    const buildButton = screen.getByText('Build KLV');
    fireEvent.click(buildButton);

    expect(mockKLVParser.build).toHaveBeenCalledWith([
      { key: '002', value: 'ABCDE' }
    ]);
    expect(mockOnBuild).toHaveBeenCalledWith('00205ABCDE');
  });

  it('does not build when KLVParser returns null/empty', () => {
    mockKLVParser.build.mockReturnValue(null);

    render(<KLVBuilder onBuild={mockOnBuild} />);

    const valueInput = screen.getByPlaceholderText('Enter value...');
    fireEvent.change(valueInput, { target: { value: 'ABCDE' } });

    const buildButton = screen.getByText('Build KLV');
    fireEvent.click(buildButton);

    expect(mockKLVParser.build).toHaveBeenCalled();
    expect(mockOnBuild).not.toHaveBeenCalled();
  });

  it('disables Build KLV button when all entries are empty', () => {
    render(<KLVBuilder onBuild={mockOnBuild} />);

    const buildButton = screen.getByText('Build KLV');
    expect(buildButton).toBeDisabled();
  });

  it('enables Build KLV button when at least one entry has value', () => {
    render(<KLVBuilder onBuild={mockOnBuild} />);

    const valueInput = screen.getByPlaceholderText('Enter value...');
    fireEvent.change(valueInput, { target: { value: 'A' } });

    const buildButton = screen.getByText('Build KLV');
    expect(buildButton).not.toBeDisabled();
  });

  it('shows preview when entries have values', () => {
    mockKLVParser.build.mockReturnValue('00201A02604TEST');

    render(<KLVBuilder onBuild={mockOnBuild} />);

    // Add values to entries
    const valueInput = screen.getByPlaceholderText('Enter value...');
    fireEvent.change(valueInput, { target: { value: 'A' } });

    // Should show preview
    expect(screen.getByText('Preview:')).toBeInTheDocument();
    expect(screen.getByText('00201A02604TEST')).toBeInTheDocument();
  });

  it('does not show preview when no entries have values', () => {
    render(<KLVBuilder onBuild={mockOnBuild} />);

    expect(screen.queryByText('Preview:')).not.toBeInTheDocument();
  });

  it('clears all entries when Clear All is clicked', () => {
    render(<KLVBuilder onBuild={mockOnBuild} />);

    // Add some entries and values
    fireEvent.click(screen.getByText('Add Entry'));
    const valueInputs = screen.getAllByPlaceholderText('Enter value...');
    fireEvent.change(valueInputs[0], { target: { value: 'TEST1' } });
    fireEvent.change(valueInputs[1], { target: { value: 'TEST2' } });

    // Clear all
    fireEvent.click(screen.getByText('Clear All'));

    // Should be back to one empty entry
    const remainingInputs = screen.getAllByPlaceholderText('Enter value...');
    expect(remainingInputs).toHaveLength(1);
    expect(remainingInputs[0]).toHaveValue('');
  });

  it('handles multiple entries with different keys and values', () => {
    mockKLVParser.build.mockReturnValue('00205ABCDE02604WXYZ');

    render(<KLVBuilder onBuild={mockOnBuild} />);

    // Add second entry
    fireEvent.click(screen.getByText('Add Entry'));

    const keySelects = screen.getAllByDisplayValue('002 - Tracking Number...');
    const valueInputs = screen.getAllByPlaceholderText('Enter value...');

    // Update first entry
    fireEvent.change(valueInputs[0], { target: { value: 'ABCDE' } });

    // Update second entry
    fireEvent.change(keySelects[1], { target: { value: '026' } });
    fireEvent.change(valueInputs[1], { target: { value: 'WXYZ' } });

    // Build KLV
    fireEvent.click(screen.getByText('Build KLV'));

    expect(mockKLVParser.build).toHaveBeenCalledWith([
      { key: '002', value: 'ABCDE' },
      { key: '026', value: 'WXYZ' }
    ]);
    expect(mockOnBuild).toHaveBeenCalledWith('00205ABCDE02604WXYZ');
  });

  it('has correct styling classes', () => {
    render(<KLVBuilder onBuild={mockOnBuild} />);

    const addButton = screen.getByText('Add Entry');
    expect(addButton).toHaveClass(
      'flex', 'items-center', 'gap-1', 'px-4', 'py-2', 
      'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-600'
    );

    const buildButton = screen.getByText('Build KLV');
    expect(buildButton).toHaveClass(
      'px-4', 'py-2', 'bg-green-500', 'text-white', 'rounded', 
      'hover:bg-green-600', 'disabled:opacity-50', 'disabled:cursor-not-allowed'
    );

    const clearButton = screen.getByText('Clear All');
    expect(clearButton).toHaveClass(
      'px-3', 'py-1', 'text-red-600', 'border', 'border-red-300', 
      'rounded', 'text-sm', 'hover:bg-red-50'
    );
  });

  it('handles empty string values correctly', () => {
    mockKLVParser.build.mockReturnValue('00200');

    render(<KLVBuilder onBuild={mockOnBuild} />);

    const valueInput = screen.getByPlaceholderText('Enter value...');
    fireEvent.change(valueInput, { target: { value: 'A' } });
    fireEvent.change(valueInput, { target: { value: '' } });

    expect(screen.getByText('Value (Length: 0)')).toBeInTheDocument();
    
    const buildButton = screen.getByText('Build KLV');
    expect(buildButton).toBeDisabled();
  });
});