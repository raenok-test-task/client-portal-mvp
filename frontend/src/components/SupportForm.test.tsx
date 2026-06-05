import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SupportForm from './SupportForm';
import * as apiModule from '../api';

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof apiModule>('../api');
  return { ...actual, createSupportTicket: vi.fn() };
});

describe('SupportForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a validation error when the message is too short', async () => {
    render(<SupportForm />);
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Hi there' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 10 characters/i);
    expect(apiModule.createSupportTicket).not.toHaveBeenCalled();
  });

  it('submits a valid ticket and shows success', async () => {
    (apiModule.createSupportTicket as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 't1',
      subject: 'Valid subject',
      message: 'This is a valid message.',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    });

    render(<SupportForm />);
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Valid subject' } });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'This is a valid message.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() =>
      expect(apiModule.createSupportTicket).toHaveBeenCalledWith({
        subject: 'Valid subject',
        message: 'This is a valid message.',
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(/ticket created/i);
  });
});
