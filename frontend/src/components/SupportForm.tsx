import { useState, type FormEvent } from 'react';
import { createSupportTicket, extractError } from '../api';

export default function SupportForm() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (subject.trim().length < 3) {
      setError('Subject must be at least 3 characters.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Message must be at least 10 characters.');
      return;
    }

    setLoading(true);
    try {
      const ticket = await createSupportTicket({ subject, message });
      setSuccess(`Ticket created (status: ${ticket.status}). Our team will get back to you.`);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(extractError(err, 'Failed to submit the ticket.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card support-card">
      <h2 className="card-title">Contact support</h2>
      <form onSubmit={onSubmit} noValidate className="support-form">
        <label htmlFor="subject">Subject</label>
        <input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="What is this about?"
        />

        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your question or issue…"
        />

        {error && <div className="form-error" role="alert">{error}</div>}
        {success && <div className="form-success" role="status">{success}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Sending…' : 'Submit ticket'}
        </button>
      </form>
    </section>
  );
}
