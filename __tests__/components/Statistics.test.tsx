import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Statistics from '../../components/Statistics';
import { KLVEntry } from '../../utils/KLVParser';

describe('Statistics Component', () => {
  const createMockEntry = (key: string, name: string, len: number): KLVEntry => ({
    key,
    len,
    value: 'A'.repeat(len),
    pos: 0,
    name
  });

  it('renders nothing when no results provided', () => {
    const { container } = render(<Statistics results={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays basic statistics correctly', () => {
    const results: KLVEntry[] = [
      createMockEntry('002', 'Tracking Number', 6),
      createMockEntry('026', 'Merchant Category Code', 4),
      createMockEntry('999', 'Unknown', 3)
    ];

    render(<Statistics results={results} />);

    // Check total entries
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total Entries')).toBeInTheDocument();

    // Check known keys
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Known Keys')).toBeInTheDocument();

    // Check unknown keys
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Unknown Keys')).toBeInTheDocument();

    // Check total length
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('Total Length')).toBeInTheDocument();
  });

  it('handles all known keys correctly', () => {
    const results: KLVEntry[] = [
      createMockEntry('002', 'Tracking Number', 5),
      createMockEntry('026', 'Merchant Category Code', 4),
      createMockEntry('032', 'Acquiring Institution Code', 3)
    ];

    render(<Statistics results={results} />);

    expect(screen.getByText('Total Entries').parentElement?.querySelector('.text-2xl')).toHaveTextContent('3');
    expect(screen.getByText('Known Keys').parentElement?.querySelector('.text-2xl')).toHaveTextContent('3');
    expect(screen.getByText('Unknown Keys').parentElement?.querySelector('.text-2xl')).toHaveTextContent('0');
    expect(screen.getByText('Total Length').parentElement?.querySelector('.text-2xl')).toHaveTextContent('12');
  });

  it('handles all unknown keys correctly', () => {
    const results: KLVEntry[] = [
      createMockEntry('999', 'Unknown', 5),
      createMockEntry('998', 'Unknown', 3),
      createMockEntry('997', 'Unknown', 2)
    ];

    render(<Statistics results={results} />);

    expect(screen.getByText('Total Entries').parentElement?.querySelector('.text-2xl')).toHaveTextContent('3');
    expect(screen.getByText('Known Keys').parentElement?.querySelector('.text-2xl')).toHaveTextContent('0');
    expect(screen.getByText('Unknown Keys').parentElement?.querySelector('.text-2xl')).toHaveTextContent('3');
    expect(screen.getByText('Total Length').parentElement?.querySelector('.text-2xl')).toHaveTextContent('10');
  });

  it('handles single entry correctly', () => {
    const results: KLVEntry[] = [
      createMockEntry('002', 'Tracking Number', 8)
    ];

    render(<Statistics results={results} />);

    expect(screen.getByText('Total Entries').parentElement?.querySelector('.text-2xl')).toHaveTextContent('1');
    expect(screen.getByText('Known Keys').parentElement?.querySelector('.text-2xl')).toHaveTextContent('1');
    expect(screen.getByText('Unknown Keys').parentElement?.querySelector('.text-2xl')).toHaveTextContent('0');
    expect(screen.getByText('Total Length').parentElement?.querySelector('.text-2xl')).toHaveTextContent('8');
  });

  it('handles entries with zero length', () => {
    const results: KLVEntry[] = [
      createMockEntry('002', 'Tracking Number', 0),
      createMockEntry('026', 'Merchant Category Code', 5)
    ];

    render(<Statistics results={results} />);

    expect(screen.getByText('Total Entries').parentElement?.querySelector('.text-2xl')).toHaveTextContent('2');
    expect(screen.getByText('Known Keys').parentElement?.querySelector('.text-2xl')).toHaveTextContent('2');
    expect(screen.getByText('Unknown Keys').parentElement?.querySelector('.text-2xl')).toHaveTextContent('0');
    expect(screen.getByText('Total Length').parentElement?.querySelector('.text-2xl')).toHaveTextContent('5');
  });

  it('has correct styling classes', () => {
    const results: KLVEntry[] = [
      createMockEntry('002', 'Tracking Number', 5)
    ];

    const { container } = render(<Statistics results={results} />);
    const statsContainer = container.firstChild;

    expect(statsContainer).toHaveClass(
      'grid', 
      'grid-cols-2', 
      'md:grid-cols-4', 
      'gap-4', 
      'p-4', 
      'bg-gray-50', 
      'rounded-lg'
    );
  });

  it('displays correct color classes for each statistic', () => {
    const results: KLVEntry[] = [
      createMockEntry('002', 'Tracking Number', 5)
    ];

    render(<Statistics results={results} />);

    // Total entries should be blue
    const totalValue = screen.getByText('Total Entries').parentElement?.querySelector('.text-2xl');
    expect(totalValue).toHaveClass('text-2xl', 'font-bold', 'text-blue-600');

    // Known keys should be green
    const knownValue = screen.getByText('Known Keys').parentElement?.querySelector('.text-2xl');
    expect(knownValue).toHaveClass('text-2xl', 'font-bold', 'text-green-600');

    // Unknown keys should be yellow
    const unknownValue = screen.getByText('Unknown Keys').parentElement?.querySelector('.text-2xl');
    expect(unknownValue).toHaveClass('text-2xl', 'font-bold', 'text-yellow-600');

    // Total length should be purple
    const lengthValue = screen.getByText('Total Length').parentElement?.querySelector('.text-2xl');
    expect(lengthValue).toHaveClass('text-2xl', 'font-bold', 'text-purple-600');
  });

  it('computes statistics correctly with mixed entries', () => {
    const results: KLVEntry[] = [
      createMockEntry('002', 'Tracking Number', 10),
      createMockEntry('999', 'Unknown', 5),
      createMockEntry('026', 'Merchant Category Code', 3),
      createMockEntry('998', 'Unknown', 7),
      createMockEntry('032', 'Acquiring Institution Code', 2)
    ];

    render(<Statistics results={results} />);

    // Total: 5 entries
    expect(screen.getByText('Total Entries').parentElement?.querySelector('.text-2xl')).toHaveTextContent('5');
    
    // Known: 3 entries (002, 026, 032)
    expect(screen.getByText('Known Keys').parentElement?.querySelector('.text-2xl')).toHaveTextContent('3');
    
    // Unknown: 2 entries (999, 998)
    expect(screen.getByText('Unknown Keys').parentElement?.querySelector('.text-2xl')).toHaveTextContent('2');
    
    // Total length: 10 + 5 + 3 + 7 + 2 = 27
    expect(screen.getByText('Total Length').parentElement?.querySelector('.text-2xl')).toHaveTextContent('27');
  });
});