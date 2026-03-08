'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useSales } from '@/lib/SalesContext';

export default function TallyBoard() {
  const {
    services,
    addSale,
    cancelSale,
    undoLastSale,
    todayEntries,
    todayTotal,
    todayCount,
    countByService,
    clearToday,
  } = useSales();

  const activeServices = services.filter((s) => s.active);
  const printers = [...new Set(activeServices.map((s) => s.printer))];
  const avgSale = todayCount > 0 ? todayTotal / todayCount : 0;

  const FEED_LIMIT = 30;
  const [showAllFeed, setShowAllFeed] = useState(false);
  const allEntries = [...todayEntries].reverse();
  const recentEntries = showAllFeed ? allEntries : allEntries.slice(0, FEED_LIMIT);
  const hiddenCount = allEntries.length - FEED_LIMIT;

  // Prevent rapid double-taps: lock a service button for 400 ms after each tap
  const tapLock = useRef<Record<string, number>>({});
  function handleTap(id: string) {
    const now = Date.now();
    if (tapLock.current[id] && now - tapLock.current[id] < 400) return;
    tapLock.current[id] = now;
    addSale(id);
  }

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h4 className="fw-semibold text-dark mb-0">
            <i className="fas fa-cash-register text-primary me-2"></i>Sales Tally
          </h4>
          <p className="text-secondary small mb-0">
            Click a service button to record a sale instantly
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-warning btn-sm rounded-pill"
            onClick={undoLastSale}
            disabled={todayCount === 0}
          >
            <i className="fas fa-undo me-1"></i>Undo last
          </button>
          <button
            className="btn btn-outline-danger btn-sm rounded-pill"
            onClick={() => setShowClearConfirm(true)}
            disabled={todayCount === 0}
          >
            <i className="fas fa-trash-alt me-1"></i>Clear today
          </button>
        </div>
      </div>

      {/* Clear Today inline confirmation */}
      {showClearConfirm && (
        <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between py-2 mb-3 gap-2">
          <span className="small">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Clear all <strong>{todayCount}</strong> sales for today? This cannot be undone.
          </span>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowClearConfirm(false)}>Cancel</button>
            <button className="btn btn-sm btn-danger" onClick={() => { clearToday(); setShowClearConfirm(false); }}>
              <i className="fas fa-trash-alt me-1"></i>Yes, Clear
            </button>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="card border-top-blue shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Today&apos;s Revenue</p>
              <h3 className="fw-bold mb-0">P{todayTotal.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card border-top-green shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Total Sales</p>
              <h3 className="fw-bold mb-0">{todayCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card border-top-purple shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Avg per Sale</p>
              <h3 className="fw-bold mb-0">P{avgSale.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tally buttons + live feed */}
      <div className="row g-4">
        {/* Tally buttons */}
        <div className="col-lg-7">
          {activeServices.length === 0 ? (
            <div className="card shadow-sm">
              <div className="card-body text-center py-5 text-secondary">
                <i className="fas fa-print fa-3x mb-3 d-block opacity-25"></i>
                <p className="mb-2">No active services configured.</p>
                <Link href="/services" className="btn btn-primary rounded-pill px-4">
                  <i className="fas fa-tags me-2"></i>Manage Services
                </Link>
              </div>
            </div>
          ) : (
            printers.map((printer) => {
              const svcs = activeServices.filter((s) => s.printer === printer);
              const isGeneral = printer === '';
              return (
                <div key={printer || '__general__'} className="card shadow-sm mb-3">
                  <div className="card-header bg-white border-0 pt-3 pb-0 d-flex align-items-center justify-content-between">
                    <h6 className="fw-semibold mb-0">
                      {isGeneral
                        ? <><i className="fas fa-store text-secondary me-2"></i>General Products &amp; Services</>
                        : <><i className="fas fa-print text-secondary me-2"></i>{printer}</>}
                    </h6>
                    <span className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>
                      {svcs.length} service{svcs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="card-body pt-3">
                    <div className="row g-2">
                      {svcs.map((svc) => (
                        <div key={svc.id} className="col-6 col-md-4">
                          <button
                            className="tally-btn"
                            onClick={() => handleTap(svc.id)}
                          >
                            <span className="small fw-medium text-truncate pe-1">
                              {svc.icon} {svc.name}
                              <span className="price-tag">(P{svc.price.toFixed(2)})</span>
                            </span>
                            <span className={`fw-bold badge flex-shrink-0 ${svc.badgeVariant}`}>
                              {countByService(svc.id)}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div className="text-secondary small mt-1">
            <i className="fas fa-info-circle me-1"></i>
            To add or edit services go to{' '}
            <Link href="/services" className="text-primary">
              Manage Services
            </Link>.
          </div>
        </div>

        {/* Live feed */}
        <div className="col-lg-5">
          <div className="card shadow-sm sticky-top" style={{ top: 72 }}>
            <div className="card-header bg-white border-0 pt-3 pb-2 d-flex align-items-center justify-content-between">
              <div>
                <h6 className="fw-semibold mb-0">
                  <i className="fas fa-bolt text-warning me-2"></i>Live Sales Feed
                </h6>
                <p className="text-secondary small mb-0">
                  {todayCount} sale{todayCount !== 1 ? 's' : ''} ·{' '}
                  <span className="text-success fw-medium">P{todayTotal.toFixed(2)}</span>
                </p>
              </div>
              {todayCount > 0 && (
                <span className="badge bg-success rounded-pill">{todayCount}</span>
              )}
            </div>
            <div style={{ maxHeight: 460, overflowY: 'auto' }}>
              {recentEntries.length === 0 ? (
                <div className="text-center text-secondary py-5">
                  <i className="fas fa-receipt fa-2x mb-2 d-block opacity-25"></i>
                  <span className="small">No sales recorded yet</span>
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {recentEntries.map((entry, i) => (
                    <li
                      key={entry.id}
                      className={`list-group-item d-flex align-items-center gap-2 px-3 py-2${i === 0 ? ' bg-success-subtle' : ''}`}
                    >
                      <div className="flex-grow-1 overflow-hidden">
                        <p className="mb-0 small fw-medium text-truncate">
                          {entry.serviceName}
                        </p>
                        <p className="mb-0 text-secondary text-truncate" style={{ fontSize: '0.72rem' }}>
                          <i className="fas fa-print me-1"></i>
                          {entry.printer} ·{' '}
                          {new Date(entry.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className="fw-bold text-success small flex-shrink-0">
                        +P{entry.price.toFixed(2)}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-danger rounded-circle px-1 py-0 flex-shrink-0"
                        style={{ width: 24, height: 24, lineHeight: 1, fontSize: '0.7rem' }}
                        title="Cancel this sale"
                        onClick={() => cancelSale(entry.id)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {recentEntries.length > 0 && (
              <div className="card-footer bg-white border-top py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary small">Total today</span>
                  <span className="fw-bold text-success">P{todayTotal.toFixed(2)}</span>
                </div>
                {hiddenCount > 0 && !showAllFeed && (
                  <button
                    className="btn btn-link btn-sm text-secondary p-0 mt-1"
                    onClick={() => setShowAllFeed(true)}
                  >
                    <i className="fas fa-chevron-down me-1"></i>
                    Show {hiddenCount} more entr{hiddenCount === 1 ? 'y' : 'ies'}
                  </button>
                )}
                {showAllFeed && allEntries.length > FEED_LIMIT && (
                  <button
                    className="btn btn-link btn-sm text-secondary p-0 mt-1"
                    onClick={() => setShowAllFeed(false)}
                  >
                    <i className="fas fa-chevron-up me-1"></i>Show less
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
