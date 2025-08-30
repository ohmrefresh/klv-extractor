import React from 'react';
import { render, screen } from '@testing-library/react';
import Statistics from '../../components/Statistics';
import { KLVEntry } from '../../utils/KLVParser';

describe('Statistics', () => {
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
    },
    {
      key: '999',
      len: 5,
      value: 'TEST1',
      pos: 20,
      name: 'Unknown'
    }
  ];

  it('should render statistics for provided results', () => {
    render(<Statistics results={mockResults} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Total entries
    expect(screen.getByText('Total Entries')).toBeInTheDocument();
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Known keys
    expect(screen.getByText('Known Keys')).toBeInTheDocument();
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Unknown keys
    expect(screen.getByText('Unknown Keys')).toBeInTheDocument();
    
    expect(screen.getByText('15')).toBeInTheDocument(); // Total length (6+4+5)
    expect(screen.getByText('Total Length')).toBeInTheDocument();
  });

  it('should calculate statistics correctly for all known keys', () => {
    const knownResults: KLVEntry[] = [
      {
        key: '002',
        len: 3,
        value: 'ABC',
        pos: 0,
        name: 'Tracking Number'
      },
      {
        key: '026',
        len: 2,
        value: 'XY',
        pos: 8,
        name: 'Merchant Category Code'
      }
    ];

    render(<Statistics results={knownResults} />);
    
    // Use more specific selectors
    const statsContainer = screen.getByText('Total Entries').parentElement;
    expect(statsContainer).toHaveTextContent('2');
    
    const knownKeysContainer = screen.getByText('Known Keys').parentElement;
    expect(knownKeysContainer).toHaveTextContent('2');
    
    const unknownKeysContainer = screen.getByText('Unknown Keys').parentElement;
    expect(unknownKeysContainer).toHaveTextContent('0');
    
    const lengthContainer = screen.getByText('Total Length').parentElement;
    expect(lengthContainer).toHaveTextContent('5');
  });

  it('should calculate statistics correctly for all unknown keys', () => {
    const unknownResults: KLVEntry[] = [
      {
        key: '800',
        len: 4,
        value: 'TEST',
        pos: 0,
        name: 'Unknown'
      },
      {
        key: '801',
        len: 3,
        value: 'XYZ',
        pos: 9,
        name: 'Unknown'
      }
    ];

    render(<Statistics results={unknownResults} />);
    
    const statsContainer = screen.getByText('Total Entries').parentElement;
    expect(statsContainer).toHaveTextContent('2');
    
    const knownKeysContainer = screen.getByText('Known Keys').parentElement;
    expect(knownKeysContainer).toHaveTextContent('0');
    
    const unknownKeysContainer = screen.getByText('Unknown Keys').parentElement;
    expect(unknownKeysContainer).toHaveTextContent('2');
    
    const lengthContainer = screen.getByText('Total Length').parentElement;
    expect(lengthContainer).toHaveTextContent('7');
  });

  it('should handle empty results array', () => {
    const { container } = render(<Statistics results={[]} />);
    
    // Component should not render when results are empty
    expect(container.firstChild).toBeNull();
  });

  it('should handle zero-length values correctly', () => {
    const zeroLengthResults: KLVEntry[] = [
      {
        key: '002',
        len: 0,
        value: '',
        pos: 0,
        name: 'Tracking Number'
      },
      {
        key: '026',
        len: 3,
        value: 'ABC',
        pos: 5,
        name: 'Merchant Category Code'
      }
    ];

    render(<Statistics results={zeroLengthResults} />);
    
    const statsContainer = screen.getByText('Total Entries').parentElement;
    expect(statsContainer).toHaveTextContent('2');
    
    const knownKeysContainer = screen.getByText('Known Keys').parentElement;
    expect(knownKeysContainer).toHaveTextContent('2');
    
    const unknownKeysContainer = screen.getByText('Unknown Keys').parentElement;
    expect(unknownKeysContainer).toHaveTextContent('0');
    
    const lengthContainer = screen.getByText('Total Length').parentElement;
    expect(lengthContainer).toHaveTextContent('3');
  });

  it('should have correct styling classes', () => {
    render(<Statistics results={mockResults} />);
    
    const container = screen.getByText('Total Entries').closest('div')?.parentElement?.parentElement;
    expect(container).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4', 'gap-4', 'p-4', 'bg-gray-50', 'rounded-lg');
  });

  it('should display correct colors for different statistics', () => {
    render(<Statistics results={mockResults} />);
    
    // Check text color classes for statistics
    const totalElement = screen.getByText('3');
    const knownElement = screen.getByText('2');
    const unknownElement = screen.getByText('1');
    const lengthElement = screen.getByText('15');
    
    expect(totalElement).toHaveClass('text-blue-600');
    expect(knownElement).toHaveClass('text-green-600');
    expect(unknownElement).toHaveClass('text-yellow-600');
    expect(lengthElement).toHaveClass('text-purple-600');
  });

  it('should recalculate statistics when results change', () => {
    const initialResults: KLVEntry[] = [
      {
        key: '002',
        len: 3,
        value: 'ABC',
        pos: 0,
        name: 'Tracking Number'
      }
    ];

    const { rerender } = render(<Statistics results={initialResults} />);
    
    const statsContainer = screen.getByText('Total Entries').parentElement;
    expect(statsContainer).toHaveTextContent('1');
    
    const updatedResults: KLVEntry[] = [
      ...initialResults,
      {
        key: '026',
        len: 2,
        value: 'XY',
        pos: 8,
        name: 'Merchant Category Code'
      }
    ];

    rerender(<Statistics results={updatedResults} />);
    
    const updatedStatsContainer = screen.getByText('Total Entries').parentElement;
    expect(updatedStatsContainer).toHaveTextContent('2');
  });
});