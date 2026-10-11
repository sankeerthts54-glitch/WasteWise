import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicForm } from './DynamicForm';
import { DOMAINS } from 'wastewise-shared';

describe('DynamicForm & Formulation Studio', () => {
  const wasteDomain = DOMAINS[0]; // waste-segregation

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all configured fields and default values for waste-segregation', () => {
    render(<DynamicForm domain={wasteDomain} onSubmit={() => {}} />);

    // Check heading and key fields
    expect(screen.getByText('Domain Questionnaire')).toBeInTheDocument();
    expect(screen.getByText('City / Town')).toBeInTheDocument();
    expect(screen.getByText('Setting')).toBeInTheDocument();
    expect(screen.getByText('Types of waste you generate')).toBeInTheDocument();
    expect(screen.getByText('Advisory Depth')).toBeInTheDocument();
    expect(screen.getByText('Output Language')).toBeInTheDocument();
  });

  it('validates required fields and shows errors on empty submission', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<DynamicForm domain={wasteDomain} onSubmit={handleSubmit} />);

    // Click submit without entering city
    const submitBtn = screen.getByRole('button', {
      name: /Generate Personalized Advisory/i,
    });
    await user.click(submitBtn);

    // Submission should be blocked
    expect(handleSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Please fill in all required fields accurately/i)
    ).toBeInTheDocument();
  });

  it('validates successfully and passes typed payload on complete input', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<DynamicForm domain={wasteDomain} onSubmit={handleSubmit} />);

    // Fill location
    const locationInput = screen.getByLabelText(/City \/ Town/i);
    await user.type(locationInput, 'Bengaluru');

    // Select setting
    await user.click(screen.getByText('Household'));

    // Select waste types
    await user.click(screen.getByText('Food scraps / kitchen waste'));

    // Select current practice
    const practiceSelect = screen.getByLabelText(/Current disposal practice/i);
    await user.selectOptions(practiceSelect, 'some_segregation');

    // Select composting radio
    await user.click(screen.getByText('Yes (garden / balcony)'));

    // Submit form
    const submitBtn = screen.getByRole('button', {
      name: /Generate Personalized Advisory/i,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const callArg = handleSubmit.mock.calls[0][0];
    expect(callArg.inputs.location).toBe('Bengaluru');
    expect(callArg.inputs.settingType).toBe('household');
    expect(callArg.inputs.wasteTypes).toContain('food_scraps');
    expect(callArg.inputs.currentPractice).toBe('some_segregation');
    expect(callArg.style).toBe('concise');
    expect(callArg.language).toBe('en');
  });

  it('supports toggling advisory depth style and output language', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<DynamicForm domain={wasteDomain} onSubmit={handleSubmit} />);

    // Toggle to Detailed
    const detailedBtn = screen.getByRole('button', { name: /Detailed/i });
    await user.click(detailedBtn);

    // Change language to Hindi
    const languageSelect = screen.getByDisplayValue('English');
    await user.selectOptions(languageSelect, 'hi');

    // Fill minimum required fields
    await user.type(screen.getByLabelText(/City \/ Town/i), 'Delhi');
    await user.click(screen.getByText('Household'));
    await user.click(screen.getByText('Paper & cardboard'));
    await user.selectOptions(
      screen.getByLabelText(/Current disposal practice/i),
      'full_segregation'
    );
    await user.click(screen.getByText('No'));

    const submitBtn = screen.getByRole('button', {
      name: /Generate Personalized Advisory/i,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const callArg = handleSubmit.mock.calls[0][0];
    expect(callArg.style).toBe('detailed');
    expect(callArg.language).toBe('hi');
  });

  it('respects visibleWhen conditions for conditional fields', async () => {
    const user = userEvent.setup();
    const recyclingDomain = DOMAINS[2]; // recycling-upcycling has diySkillLevel visible when goal is upcycle_diy

    render(<DynamicForm domain={recyclingDomain} onSubmit={() => {}} />);

    // Initially diySkillLevel should not be in the document
    expect(
      screen.queryByLabelText(/DIY \/ crafting skill level/i)
    ).not.toBeInTheDocument();

    // Select goal = upcycle_diy
    await user.click(screen.getByText('DIY upcycling / craft projects'));

    // Now it should be visible
    expect(
      await screen.findByLabelText(/DIY \/ crafting skill level/i)
    ).toBeInTheDocument();
  });
});
