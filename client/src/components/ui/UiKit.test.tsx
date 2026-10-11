import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';
import { Select } from './Select';
import { Badge } from './Badge';
import { Alert } from './Alert';
import { Modal } from './Modal';
import { Spinner, Skeleton } from './Spinner';

describe('UI Kit Components', () => {
  describe('Input', () => {
    it('renders label and error message', () => {
      render(<Input label="Username" error="Invalid username" />);
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Invalid username')).toBeInTheDocument();
    });

    it('allows typing into input', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);
      const input = screen.getByPlaceholderText('Type here');
      await user.type(input, 'test-query');
      expect(input).toHaveValue('test-query');
    });
  });

  describe('Select', () => {
    it('renders select with options', () => {
      render(
        <Select
          label="Category"
          options={[
            { value: 'opt1', label: 'Option 1' },
            { value: 'opt2', label: 'Option 2' },
          ]}
        />
      );
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders badge with text and status style', () => {
      render(<Badge variant="success">Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Alert', () => {
    it('renders title, content, and handles dismissal', async () => {
      const handleDismiss = vi.fn();
      const user = userEvent.setup();
      render(
        <Alert variant="warning" title="Warning Note" onDismiss={handleDismiss}>
          Please proceed with caution.
        </Alert>
      );
      expect(screen.getByText('Warning Note')).toBeInTheDocument();
      expect(screen.getByText('Please proceed with caution.')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: /dismiss alert/i });
      await user.click(closeBtn);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Modal', () => {
    it('renders modal when isOpen is true and calls onClose on dismiss', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Dialog Title">
          <div>Modal content body</div>
        </Modal>
      );
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
      expect(screen.getByText('Modal content body')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not render dialog when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="Dialog Title">
          <div>Modal content body</div>
        </Modal>
      );
      expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
    });
  });

  describe('Spinner and Skeleton', () => {
    it('renders spinner with status role', () => {
      render(<Spinner />);
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('renders skeleton element', () => {
      const { container } = render(<Skeleton className="h-4 w-20" />);
      expect(container.firstChild).toHaveClass('animate-pulse');
    });
  });
});
