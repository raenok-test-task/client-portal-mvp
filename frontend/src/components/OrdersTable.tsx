import { useEffect, useMemo, useRef, useState } from 'react';
import { getOrders, extractError } from '../api';
import { ORDER_STATUSES, type Order, type OrderStatus } from '../types';

const PAGE_SIZE = 6;

const statusClass: Record<OrderStatus, string> = {
  PENDING: 'badge badge-pending',
  PAID: 'badge badge-paid',
  SHIPPED: 'badge badge-shipped',
  DELIVERED: 'badge badge-delivered',
  CANCELLED: 'badge badge-cancelled',
};

function pageNumbers(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    let active = true;
    const handle = setTimeout(async () => {
      if (!hasLoadedOnce.current) setInitialLoading(true);
      setError(null);
      try {
        const data = await getOrders({ search, status });
        if (active) {
          setOrders(data);
          hasLoadedOnce.current = true;
        }
      } catch (err) {
        if (active) setError(extractError(err, 'Failed to load orders.'));
      } finally {
        if (active) setInitialLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [search, status]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return orders.slice(start, start + PAGE_SIZE);
  }, [orders, page]);

  const total = useMemo(
    () => orders.reduce((sum, o) => (o.status === 'CANCELLED' ? sum : sum + o.amount), 0),
    [orders],
  );

  const showInitialPlaceholder = initialLoading && !hasLoadedOnce.current;
  const showPagination = !showInitialPlaceholder && orders.length > PAGE_SIZE;
  const rangeStart = orders.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, orders.length);
  const pages = pageNumbers(page, totalPages);

  return (
    <section className="card orders-card">
      <div className="card-header">
        <h2 className="card-title">Order history</h2>
        <span className="muted orders-count">
          {showInitialPlaceholder ? '—' : `${orders.length} order(s)`}
        </span>
      </div>

      <div className="orders-controls">
        <input
          type="search"
          placeholder="Search by order number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search by order number"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="orders-card-body">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Status</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {showInitialPlaceholder ? (
                <tr className="empty-row">
                  <td colSpan={4} className="empty">
                    Loading…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={4} className="empty">
                    No orders match your filters.
                  </td>
                </tr>
              ) : (
                <>
                  {pageOrders.map((o) => (
                    <tr key={o.id} className="data-row">
                      <td className="mono">{o.number}</td>
                      <td>{new Date(o.date).toLocaleDateString()}</td>
                      <td>
                        <span className={statusClass[o.status]}>{o.status}</span>
                      </td>
                      <td className="num">
                        {o.amount.toFixed(2)} {o.currency}
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: PAGE_SIZE - pageOrders.length }, (_, i) => (
                    <tr key={`placeholder-${i}`} className="row-placeholder" aria-hidden="true">
                      <td colSpan={4} />
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        <nav
          className={`orders-pagination is-reserved ${showPagination ? 'is-visible' : ''}`}
          aria-label="Orders pagination"
          aria-hidden={!showPagination}
        >
          {showPagination && (
            <>
              <span className="pagination-info">
                {rangeStart}–{rangeEnd} of {orders.length}
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn pagination-btn-nav"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {pages.map((p, i) => {
                  const prev = pages[i - 1];
                  const gap = prev !== undefined && p - prev > 1;
                  return (
                    <span key={p} className="pagination-page-wrap">
                      {gap && <span className="pagination-ellipsis">…</span>}
                      <button
                        type="button"
                        className={`pagination-btn ${p === page ? 'is-active' : ''}`}
                        onClick={() => setPage(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  className="pagination-btn pagination-btn-nav"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </>
          )}
        </nav>
      </div>

      <div className="orders-total" aria-hidden={orders.length === 0 && !showInitialPlaceholder}>
        {orders.length > 0 ? (
          <>
            Total (excl. cancelled): <strong>{total.toFixed(2)} USD</strong>
          </>
        ) : (
          <span className="orders-total-placeholder">&nbsp;</span>
        )}
      </div>
    </section>
  );
}
