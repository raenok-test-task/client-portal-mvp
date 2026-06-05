import { useEffect, useRef, useState, type FormEvent } from 'react';
import { askAssistant, extractError } from '../api';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTIONS = [
  'Show my last orders',
  'How many orders in the last month?',
  'What did I spend in total?',
];

export default function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hi! I can answer questions about your orders and account. Ask me anything.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  // Close on Escape and lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(scrollToBottom);
  }, [open, messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);
    try {
      const res = await askAssistant(trimmed);
      setMessages((m) => [...m, { role: 'assistant', text: res.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: extractError(err, 'I had trouble answering that.') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          className="assistant-fab"
          onClick={() => setOpen(true)}
          aria-label="Open AI Assistant"
          aria-expanded={false}
        >
          <span className="assistant-fab-icon" aria-hidden="true">
            ✦
          </span>
          <span className="assistant-fab-label">AI Assistant</span>
        </button>
      )}

      <div
        className={`assistant-overlay ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside
        className={`assistant-drawer ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-label="AI Assistant"
        aria-hidden={!open}
      >
        <header className="assistant-drawer-head">
          <div>
            <h2 className="card-title">AI Assistant</h2>
            <span className="muted assistant-drawer-sub">Ask about your orders &amp; account</span>
          </div>
          <button
            type="button"
            className="btn-ghost assistant-close"
            onClick={() => setOpen(false)}
            aria-label="Close AI Assistant"
          >
            ✕
          </button>
        </header>

        <div className="assistant-drawer-body">
          <div className="chat-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                {m.text.split('\n').map((line, j) => (
                  <div key={j}>{line}</div>
                ))}
              </div>
            ))}
            {loading && (
              <div className="bubble assistant typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            )}
          </div>
        </div>

        <footer className="assistant-drawer-footer">
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => void send(s)}>
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your orders…"
              aria-label="Message the assistant"
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              Send
            </button>
          </form>
        </footer>
      </aside>
    </>
  );
}
