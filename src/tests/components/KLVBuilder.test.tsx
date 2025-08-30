import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KLVBuilder from '../../components/KLVBuilder';

describe('KLVBuilder', () => {
  const mockOnBuild = jest.fn();

  beforeEach(() => {
    mockOnBuild.mockClear();
  });

  describe('Initial Rendering', () => {
    it('should render KLV Builder with initial state', () => {
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      expect(screen.getByText('KLV Builder')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
      expect(screen.getByText('Add Entry')).toBeInTheDocument();
      expect(screen.getByText('Build KLV')).toBeInTheDocument();
      
      // Should have one initial entry
      expect(screen.getByText('Key')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter value...')).toBeInTheDocument();
    });

    it('should have correct initial entry values', () => {
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const keySelect = screen.getByDisplayValue('002 - Tracking Number...');
      expect(keySelect).toBeInTheDocument();
      
      const valueInput = screen.getByPlaceholderText('Enter value...');
      expect(valueInput).toHaveValue('');
    });

    it('should show length of 0 for empty value', () => {
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      expect(screen.getByText('Value (Length: 0)')).toBeInTheDocument();
    });

    it('should have Build KLV button disabled initially', () => {
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const buildButton = screen.getByText('Build KLV');
      expect(buildButton).toBeDisabled();
    });

    it('should not show preview initially', () => {
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      expect(screen.queryByText('Preview:')).not.toBeInTheDocument();
    });
  });

  describe('Adding Entries', () => {
    it('should add new entry when Add Entry button is clicked', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const addButton = screen.getByText('Add Entry');
      await user.click(addButton);
      
      // Should have 2 entries now
      const keyLabels = screen.getAllByText('Key');
      expect(keyLabels).toHaveLength(2);
      
      const valueInputs = screen.getAllByPlaceholderText('Enter value...');
      expect(valueInputs).toHaveLength(2);
    });

    it('should add multiple entries', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const addButton = screen.getByText('Add Entry');
      await user.click(addButton);
      await user.click(addButton);
      await user.click(addButton);
      
      const keyLabels = screen.getAllByText('Key');
      expect(keyLabels).toHaveLength(4);
    });

    it('should have new entry with default key 002', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const addButton = screen.getByText('Add Entry');
      await user.click(addButton);
      
      const keySelects = screen.getAllByDisplayValue('002 - Tracking Number...');
      expect(keySelects).toHaveLength(2);
    });
  });

  describe('Removing Entries', () => {
    it('should not allow removing the last entry', () => {
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const removeButton = screen.getByTitle('Remove entry');
      expect(removeButton).toBeDisabled();
    });

    it('should allow removing entry when there are multiple entries', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      // Add an entry first
      const addButton = screen.getByText('Add Entry');
      await user.click(addButton);
      
      // Now remove buttons should be enabled
      const removeButtons = screen.getAllByTitle('Remove entry');
      expect(removeButtons).toHaveLength(2);
      removeButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should remove correct entry when remove button is clicked', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      // Add entries and set different values
      await user.click(screen.getByText('Add Entry'));
      
      const valueInputs = screen.getAllByPlaceholderText('Enter value...');
      await user.type(valueInputs[0], 'First');
      await user.type(valueInputs[1], 'Second');
      
      // Remove first entry
      const removeButtons = screen.getAllByTitle('Remove entry');
      await user.click(removeButtons[0]);
      
      // Should have only one entry with 'Second' value
      const remainingInput = screen.getByPlaceholderText('Enter value...');
      expect(remainingInput).toHaveValue('Second');
    });
  });

  describe('Updating Entries', () => {
    it('should update entry key when select value changes', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const keySelect = screen.getByDisplayValue('002 - Tracking Number...');
      await user.selectOptions(keySelect, '026');
      
      // Check if the select now has the 026 value
      expect(keySelect).toHaveValue('026');
    });

    it('should update entry value when input changes', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const valueInput = screen.getByPlaceholderText('Enter value...');
      await user.type(valueInput, 'TEST123');
      
      expect(valueInput).toHaveValue('TEST123');
    });

    it('should update length display when value changes', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const valueInput = screen.getByPlaceholderText('Enter value...');
      await user.type(valueInput, 'TEST');
      
      expect(screen.getByText('Value (Length: 4)')).toBeInTheDocument();
    });

    it('should enable Build KLV button when value is entered', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const valueInput = screen.getByPlaceholderText('Enter value...');
      await user.type(valueInput, 'TEST');
      
      const buildButton = screen.getByText('Build KLV');
      expect(buildButton).not.toBeDisabled();
    });
  });

  describe('Clear All Functionality', () => {
    it('should reset to single empty entry when Clear All is clicked', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      // Add entries and values
      await user.click(screen.getByText('Add Entry'));
      const valueInputs = screen.getAllByPlaceholderText('Enter value...');
      await user.type(valueInputs[0], 'First');
      await user.type(valueInputs[1], 'Second');
      
      // Clear all
      await user.click(screen.getByText('Clear All'));
      
      // Should have only one empty entry
      const keyLabels = screen.getAllByText('Key');
      expect(keyLabels).toHaveLength(1);
      
      const valueInput = screen.getByPlaceholderText('Enter value...');
      expect(valueInput).toHaveValue('');
      
      expect(screen.getByDisplayValue('002 - Tracking Number...')).toBeInTheDocument();
    });
  });

  describe('Building KLV', () => {
    it('should call onBuild with correct KLV string when Build KLV is clicked', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const valueInput = screen.getByPlaceholderText('Enter value...');
      await user.type(valueInput, 'TEST');
      
      const buildButton = screen.getByText('Build KLV');
      await user.click(buildButton);
      
      expect(mockOnBuild).toHaveBeenCalledWith('00204TEST');
    });

    it('should not call onBuild when KLV string is empty', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      // Build KLV without entering any values (button should be disabled)
      const buildButton = screen.getByText('Build KLV');
      expect(buildButton).toBeDisabled();
      
      expect(mockOnBuild).not.toHaveBeenCalled();
    });

    it('should build KLV with multiple entries', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      // Add second entry
      await user.click(screen.getByText('Add Entry'));
      
      // Set values for both entries
      const valueInputs = screen.getAllByPlaceholderText('Enter value...');
      await user.type(valueInputs[0], 'ABC');
      await user.type(valueInputs[1], 'XYZ');
      
      // Change second entry key
      const keySelects = screen.getAllByDisplayValue('002 - Tracking Number...');
      await user.selectOptions(keySelects[1], '026');
      
      const buildButton = screen.getByText('Build KLV');
      await user.click(buildButton);
      
      expect(mockOnBuild).toHaveBeenCalledWith('00203ABC02603XYZ');
    });
  });

  describe('Preview Functionality', () => {
    it('should show preview when entry has value', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const valueInput = screen.getByPlaceholderText('Enter value...');
      await user.type(valueInput, 'TEST');
      
      expect(screen.getByText('Preview:')).toBeInTheDocument();
      expect(screen.getByText('00204TEST')).toBeInTheDocument();
    });

    it('should update preview when values change', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const valueInput = screen.getByPlaceholderText('Enter value...');
      await user.type(valueInput, 'ABC');
      
      expect(screen.getByText('00203ABC')).toBeInTheDocument();
      
      await user.clear(valueInput);
      await user.type(valueInput, 'DEFGH');
      
      expect(screen.getByText('00205DEFGH')).toBeInTheDocument();
    });

    it('should hide preview when all values are empty', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const valueInput = screen.getByPlaceholderText('Enter value...');
      await user.type(valueInput, 'TEST');
      
      expect(screen.getByText('Preview:')).toBeInTheDocument();
      
      await user.clear(valueInput);
      
      expect(screen.queryByText('Preview:')).not.toBeInTheDocument();
    });
  });

  describe('Key Selection', () => {
    it('should show all available KLV definitions in key select', () => {
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const keySelect = screen.getByDisplayValue('002 - Tracking Number...');
      const options = within(keySelect).getAllByRole('option');
      
      // Should have options for all defined keys (100+ keys)
      expect(options.length).toBeGreaterThan(100);
      
      // Check some specific keys that we know exist
      expect(within(keySelect).getByText('002 - Tracking Number...')).toBeInTheDocument();
      expect(within(keySelect).getByText('042 - Merchant Identifier...')).toBeInTheDocument();
    });

    it('should truncate long key names in options', () => {
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const keySelect = screen.getByDisplayValue('002 - Tracking Number...');
      
      // Names should be truncated to 20 characters + "..."
      const options = within(keySelect).getAllByRole('option');
      options.forEach(option => {
        const text = option.textContent || '';
        if (text.includes('...')) {
          const namepart = text.split(' - ')[1];
          expect(namepart.length).toBeLessThanOrEqual(23); // 20 + "..."
        }
      });
    });
  });

  describe('Styling and Accessibility', () => {
    it('should have correct CSS classes for layout', () => {
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const container = screen.getByText('KLV Builder').parentElement?.parentElement;
      expect(container).toHaveClass('space-y-4');
    });

    it('should have proper labels for form elements', () => {
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      expect(screen.getByText('Key')).toBeInTheDocument();
      expect(screen.getByText('Value (Length: 0)')).toBeInTheDocument();
    });

    it('should have proper button styling', () => {
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const addButton = screen.getByText('Add Entry');
      expect(addButton).toHaveClass('bg-blue-500', 'text-white');
      
      const buildButton = screen.getByText('Build KLV');
      expect(buildButton).toHaveClass('bg-green-500', 'text-white');
      
      const clearButton = screen.getByText('Clear All');
      expect(clearButton).toHaveClass('text-red-600', 'border-red-300');
    });

    it('should have proper disabled state styling', () => {
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const buildButton = screen.getByText('Build KLV');
      expect(buildButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
      
      const removeButton = screen.getByTitle('Remove entry');
      expect(removeButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long values', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const longValue = 'A'.repeat(50);
      const valueInput = screen.getByPlaceholderText('Enter value...');
      await user.type(valueInput, longValue);
      
      expect(screen.getByText(`Value (Length: ${longValue.length})`)).toBeInTheDocument();
      expect(screen.getByText('Preview:')).toBeInTheDocument();
    });

    it('should handle special characters in values', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const specialValue = 'Test@#$%^&*()';
      const valueInput = screen.getByPlaceholderText('Enter value...');
      await user.type(valueInput, specialValue);
      
      expect(valueInput).toHaveValue(specialValue);
      expect(screen.getByText(`Value (Length: ${specialValue.length})`)).toBeInTheDocument();
    });

    it('should handle rapid key changes', async () => {
      const user = userEvent.setup();
      render(<KLVBuilder onBuild={mockOnBuild} />);
      
      const keySelect = screen.getByDisplayValue('002 - Tracking Number...');
      
      await user.selectOptions(keySelect, '026');
      await user.selectOptions(keySelect, '042');
      await user.selectOptions(keySelect, '999');
      
      expect(screen.getByDisplayValue('999 - Generic Key...')).toBeInTheDocument();
    });
  });
});