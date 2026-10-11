import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';
import { Slider } from './Slider';
import { Multiselect } from './Multiselect';
import { RadioGroup } from './RadioGroup';
import { Checkbox } from './Checkbox';

describe('Form UI Components', () => {
  describe('Textarea', () => {
    it('renders label, character count, and error message', () => {
      render(
        <Textarea
          label="Challenges"
          value="Test text"
          onChange={() => {}}
          maxLength={100}
          error="Field is required"
        />
      );
      expect(screen.getByText('Challenges')).toBeInTheDocument();
      expect(screen.getByText('9 / 100')).toBeInTheDocument();
      expect(screen.getByText('Field is required')).toBeInTheDocument();
    });

    it('handles text changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Textarea placeholder="Describe here" onChange={handleChange} />);
      const textarea = screen.getByPlaceholderText('Describe here');
      await user.type(textarea, 'hello');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Slider', () => {
    it('renders label, range values, and current value', () => {
      render(
        <Slider
          label="Daily Waste"
          min={1}
          max={50}
          step={1}
          value={15}
          unit="kg"
          onChange={() => {}}
        />
      );
      expect(screen.getByText('Daily Waste')).toBeInTheDocument();
      expect(screen.getByText('15 kg')).toBeInTheDocument();
      expect(screen.getByText('1 kg')).toBeInTheDocument();
      expect(screen.getByText('50 kg')).toBeInTheDocument();
    });
  });

  describe('Multiselect', () => {
    it('renders options and allows toggling selection', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const options = [
        { value: 'plastic', label: 'Plastic packaging' },
        { value: 'paper', label: 'Paper & cardboard' },
      ];

      render(
        <Multiselect
          label="Waste Types"
          options={options}
          value={['plastic']}
          onChange={handleChange}
        />
      );

      expect(screen.getByText('Waste Types')).toBeInTheDocument();
      expect(screen.getByText('1 selected')).toBeInTheDocument();

      // Click paper to select it
      await user.click(screen.getByText('Paper & cardboard'));
      expect(handleChange).toHaveBeenCalledWith(['plastic', 'paper']);
    });
  });

  describe('RadioGroup', () => {
    it('renders options and handles selection change', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const options = [
        { value: 'household', label: 'Household' },
        { value: 'apartment', label: 'Apartment Complex' },
      ];

      render(
        <RadioGroup
          label="Setting"
          options={options}
          value="household"
          onChange={handleChange}
        />
      );

      expect(screen.getByText('Setting')).toBeInTheDocument();
      await user.click(screen.getByText('Apartment Complex'));
      expect(handleChange).toHaveBeenCalledWith('apartment');
    });
  });

  describe('Checkbox', () => {
    it('renders checkbox and triggers onChange', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Checkbox
          label="Doorstep pickup required"
          description="Check if you require transport assistance"
          checked={false}
          onChange={handleChange}
        />
      );

      expect(screen.getByText('Doorstep pickup required')).toBeInTheDocument();
      expect(
        screen.getByText('Check if you require transport assistance')
      ).toBeInTheDocument();

      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });
});
