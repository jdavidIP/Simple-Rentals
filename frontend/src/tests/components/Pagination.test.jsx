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
    expect(screen.getByText('3')).toHaveClass('active');
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('disables prev button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);
    expect(screen.getByText('« Prev')).toBeDisabled();
    expect(screen.getByText('Next »')).not.toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={onPageChange} />);
    expect(screen.getByText('Next »')).toBeDisabled();
    expect(screen.getByText('« Prev')).not.toBeDisabled();
  });

  it('calls onPageChange with correct value when a page is clicked', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('4'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange when next/prev buttons are clicked', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('Next »'));
    expect(onPageChange).toHaveBeenCalledWith(4);

    fireEvent.click(screen.getByText('« Prev'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders ellipses when pages are omitted on the left or right', () => {
    const { container } = render(<Pagination currentPage={8} totalPages={10} onPageChange={onPageChange} />);
    expect(container.textContent).toContain('...');
  });

  it('shows only totalPages if less than maxVisible', () => {
    render(<Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />);
    expect(screen.queryByText('...')).not.toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
