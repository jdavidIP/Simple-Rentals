import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, expect, beforeEach } from 'vitest';
import React from 'react';
import Pagination from '../../components/Pagination';

describe('Pagination Component', () => {
  let onPageChange;

  beforeEach(() => {
    onPageChange = vi.fn();
  });

  it('renders pagination buttons with active page', () => {
    render(<Pagination currentPage={3} totalPages={10} onPageChange={onPageChange} />);
    expect(screen.getByRole('listitem', { name: /page 3/i })).toHaveClass('active');
    expect(screen.getByRole('listitem', { name: /page 2/i })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /page 4/i })).toBeInTheDocument();
  });

  it('disables prev button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next page/i })).not.toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /previous page/i })).not.toBeDisabled();
  });

  it('calls onPageChange with correct value when a page is clicked', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('listitem', { name: /page 4/i }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange when next/prev buttons are clicked', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    fireEvent.click(screen.getByRole('button', { name: /previous page/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders ellipses when pages are omitted on the left or right', () => {
    render(<Pagination currentPage={8} totalPages={10} onPageChange={onPageChange} />);
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
  });

  it('shows only totalPages if less than maxVisible', () => {
    render(<Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />);
    expect(screen.queryByText('…')).not.toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /page 1/i })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /page 2/i })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /page 3/i })).toBeInTheDocument();
  });
});
