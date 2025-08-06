import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import SortDropdown from '../../components/SortDropdown';

describe('SortDropdown Component', () => {
  let setSortOption;

  beforeEach(() => {
    setSortOption = vi.fn();
  });

  it('renders label and all options', () => {
    render(<SortDropdown sortOption="newest" setSortOption={setSortOption} />);

    expect(screen.getByLabelText(/Sort by/i)).toBeInTheDocument();
    expect(screen.getByText(/Newest First/)).toBeInTheDocument();
    expect(screen.getByText(/Oldest First/)).toBeInTheDocument();
    expect(screen.getByText(/Price: Low → High/)).toBeInTheDocument();
    expect(screen.getByText(/Price: High → Low/)).toBeInTheDocument();
  });

  it('has correct default selected option', () => {
    render(<SortDropdown sortOption="priceLowHigh" setSortOption={setSortOption} />);
    const select = screen.getByLabelText(/Sort by/i);
    expect(select.value).toBe('priceLowHigh');
  });

  it('calls setSortOption on selection change', () => {
    render(<SortDropdown sortOption="newest" setSortOption={setSortOption} />);
    const select = screen.getByLabelText(/Sort by/i);
    fireEvent.change(select, { target: { value: 'priceHighLow' } });

    expect(setSortOption).toHaveBeenCalledWith('priceHighLow');
  });
});
