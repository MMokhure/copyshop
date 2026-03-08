'use client';

import { useState, useMemo, Fragment } from 'react';
import { useSales } from '@/lib/SalesContext';
import { SaleEntry } from '@/lib/types';

function nowDateStr() { return new Date().toISOString().slice(0, 10); }
function nowTimeStr() { return new Date().toTimeString().slice(0, 5); }

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TransactionsManager() {
  const { salesHistory, services, printers, addManualSale, updateSaleEntry, deleteSaleEntry } = useSales();

  // ── Add Past Sale modal ───────────────────────────────────────────────────
  const [showPast, setShowPast] = useState(false);
  const [pastService, setPastService] = useState('');
  const [pastDate, setPastDate]   = useState(nowDateStr);
  const [pastTime, setPastTime]   = useState(nowTimeStr);
  const [pastPrice, setPastPrice] = useState('');
  const [pastErr, setPastErr]     = useState('');

  function openPastModal() {
    setPastService(services.find((s) => s.active)?.id ?? '');
    setPastDate(nowDateStr());
    setPastTime(nowTimeStr());
    setPastPrice('');
    setPastErr('');
    setShowPast(true);
  }

  function handlePastServiceChange(id: string) {
    setPastService(id);
    const svc = services.find((s) => s.id === id);
    if (svc) setPastPrice(String(svc.price));
  }

  function submitPastSale(e: React.FormEvent) {
    e.preventDefault();
    const svc = services.find((s) => s.id === pastService);
    if (!svc) { setPastErr('Select a valid service.'); return; }
    const price = parseFloat(pastPrice);
    if (isNaN(price) || price < 0) { setPastErr('Enter a valid price.'); return; }
    if (!pastDate) { setPastErr('Enter a date.'); return; }
    const timestamp = new Date(`${pastDate}T${pastTime || '00:00'}:00`).toISOString();
    addManualSale({ serviceId: svc.id, serviceName: svc.name, printer: svc.printer, price, timestamp });
    setShowPast(false);
  }

  // ── Edit modal ──────────────────────────────────────────────────
  const [editEntry, setEditEntry]   = useState<SaleEntry | null>(null);
  const [showEdit, setShowEdit]     = useState(false);
  const [editService, setEditService] = useState('');
  const [editDate, setEditDate]     = useState('');
  const [editTime, setEditTime]     = useState('');
  const [editPrice, setEditPrice]   = useState('');
  const [editErr, setEditErr]       = useState('');

  function openEdit(entry: SaleEntry) {
    setEditEntry(entry);
    setEditService(entry.serviceId);
    setEditDate(entry.timestamp.slice(0, 10));
    setEditTime(entry.timestamp.slice(11, 16));
    setEditPrice(String(entry.price));
    setEditErr('');
    setShowEdit(true);
  }

  function handleEditServiceChange(id: string) {
    setEditService(id);
    const svc = services.find((s) => s.id === id);
    if (svc) setEditPrice(String(svc.price));
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editEntry) return;
    const svc = services.find((s) => s.id === editService);
    if (!svc) { setEditErr('Select a valid service.'); return; }
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) { setEditErr('Enter a valid price.'); return; }
    if (!editDate) { setEditErr('Enter a date.'); return; }
    const timestamp = new Date(`${editDate}T${editTime || '00:00'}:00`).toISOString();
    updateSaleEntry(editEntry.id, {
      serviceId: svc.id,
      serviceName: svc.name,
      printer: svc.printer,
      price,
      timestamp,
    });
    setShowEdit(false);
  }

  // ── Delete confirm ─────────────────────────────────────────────
  const [deleteEntry, setDeleteEntry] = useState<SaleEntry | null>(null);

  // Filters
  const [search, setSearch]           = useState('');
  const [filterPrinter, setFilterPrinter] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]     = useState('');

  // Unique printer & service lists for filter dropdowns
  const printerNames = useMemo(() => {
    const set = new Set(salesHistory.map((e) => e.printer));
    return Array.from(set).sort();
  }, [salesHistory]);

  const serviceNames = useMemo(() => {
    const set = new Set(salesHistory.map((e) => e.serviceName));
    return Array.from(set).sort();
  }, [salesHistory]);

  const monthOptions = useMemo(() => {
    const set = new Set(salesHistory.map((e) => e.timestamp.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [salesHistory]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const grandTotal   = useMemo(() => salesHistory.reduce((s, e) => s + e.price, 0), [salesHistory]);
  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const monthTotal   = useMemo(
    () => salesHistory.filter((e) => e.timestamp.startsWith(thisMonthKey)).reduce((s, e) => s + e.price, 0),
    [salesHistory, thisMonthKey]
  );
  const todayTotal   = useMemo(
    () => salesHistory.filter((e) => e.timestamp.startsWith(todayISO())).reduce((s, e) => s + e.price, 0),
    [salesHistory]
  );
  const todayCount   = useMemo(
    () => salesHistory.filter((e) => e.timestamp.startsWith(todayISO())).length,
    [salesHistory]
  );
  const avgSale      = salesHistory.length > 0 ? grandTotal / salesHistory.length : 0;

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...salesHistory];
    if (filterPrinter) list = list.filter((e) => e.printer === filterPrinter);
    if (filterService) list = list.filter((e) => e.serviceName === filterService);
    if (filterDateFrom) list = list.filter((e) => e.timestamp.slice(0, 10) >= filterDateFrom);
    if (filterDateTo)   list = list.filter((e) => e.timestamp.slice(0, 10) <= filterDateTo);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.serviceName.toLowerCase().includes(q) ||
        e.printer.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [salesHistory, filterPrinter, filterService, filterDateFrom, filterDateTo, search]);

  const filteredTotal = useMemo(() => displayed.reduce((s, e) => s + e.price, 0), [displayed]);

  // ── Per-service breakdown on filtered set ────────────────────────────────
  const serviceBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    displayed.forEach((e) => {
      if (!map[e.serviceName]) map[e.serviceName] = { count: 0, total: 0 };
      map[e.serviceName].count++;
      map[e.serviceName].total += e.price;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [displayed]);

  function clearFilters() {
    setSearch('');
    setFilterPrinter('');
    setFilterService('');
    setFilterDateFrom('');
    setFilterDateTo('');
  }

  const hasFilter = search || filterPrinter || filterService || filterDateFrom || filterDateTo;

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h4 className="fw-semibold text-dark mb-0">
            <i className="fas fa-exchange-alt text-success me-2"></i>Transactions
          </h4>
          <p className="text-secondary small mb-0">Full history of all sales recorded on the tally</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-secondary fs-6 px-3">{salesHistory.length} total sales</span>
          <button className="btn btn-outline-primary btn-sm" onClick={openPastModal}>
            <i className="fas fa-plus me-1"></i>Add Past Sale
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-sm-3">
          <div className="card border-top-green shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">All-time Revenue</p>
              <h4 className="fw-bold mb-0 text-success">P{grandTotal.toFixed(2)}</h4>
              <p className="text-secondary small mb-0">{salesHistory.length} sales</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="card border-top-blue shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">This Month</p>
              <h4 className="fw-bold mb-0">P{monthTotal.toFixed(2)}</h4>
              <p className="text-secondary small mb-0">{new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="card border-top-purple shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Today</p>
              <h4 className="fw-bold mb-0">P{todayTotal.toFixed(2)}</h4>
              <p className="text-secondary small mb-0">{todayCount} sales today</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="card border-top-yellow shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Avg Sale Value</p>
              <h4 className="fw-bold mb-0">P{avgSale.toFixed(2)}</h4>
              <p className="text-secondary small mb-0">per transaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Service breakdown (for filtered set) */}
      {serviceBreakdown.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-body py-3">
            <p className="fw-semibold small text-secondary text-uppercase mb-2">
              Revenue by Service {hasFilter ? '(filtered)' : '(all time)'}
            </p>
            <div className="d-flex flex-wrap gap-2">
              {serviceBreakdown.map((s) => (
                <div key={s.name}
                  className={`d-flex align-items-center gap-2 rounded-pill px-3 py-1 border ${filterService === s.name ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                  style={{ fontSize: '0.82rem', cursor: 'pointer' }}
                  onClick={() => setFilterService(filterService === s.name ? '' : s.name)}
                >
                  <i className="fas fa-print small text-secondary"></i>
                  <span className="fw-medium">{s.name}</span>
                  <span className="badge bg-secondary">{s.count}×</span>
                  <span className="fw-bold text-success">P{s.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-3">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-transparent"><i className="fas fa-search text-secondary"></i></span>
                <input type="text" className="form-control border-start-0 ps-0"
                  placeholder="Search service, printer…"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select form-select-sm" value={filterPrinter} onChange={(e) => setFilterPrinter(e.target.value)}>
                <option value="">All Printers</option>
                {printerNames.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select form-select-sm" value={filterService} onChange={(e) => setFilterService(e.target.value)}>
                <option value="">All Services</option>
                {serviceNames.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <input type="date" className="form-control form-control-sm" placeholder="From"
                title="From date"
                value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
            </div>
            <div className="col-6 col-md-2">
              <input type="date" className="form-control form-control-sm" placeholder="To"
                title="To date"
                value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
            </div>
            <div className="col-12 col-md-1 d-flex align-items-center gap-2">
              {hasFilter && (
                <button className="btn btn-sm btn-outline-secondary rounded-pill px-3 text-nowrap" onClick={clearFilters}>
                  <i className="fas fa-times me-1"></i>Clear
                </button>
              )}
              <span className="text-secondary small text-nowrap">{displayed.length} results</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {salesHistory.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5 text-secondary">
            <i className="fas fa-exchange-alt fa-3x mb-3 d-block opacity-25"></i>
            No transactions yet. Sales recorded on the Tally board will appear here.
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5 text-secondary">
            <i className="fas fa-filter fa-3x mb-3 d-block opacity-25"></i>
            No transactions match the current filter.
            <div className="mt-2">
              <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={clearFilters}>Clear Filters</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 110 }}>Date</th>
                  <th style={{ width: 80 }}>Time</th>
                  <th>Service</th>
                  <th>Printer</th>
                  <th className="text-end">Price</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((entry, idx) => {
                  const dateStr  = entry.timestamp.slice(0, 10);
                  const isToday  = dateStr === todayISO();
                  const prevDate = idx > 0 ? displayed[idx - 1].timestamp.slice(0, 10) : null;
                  const showDateRow = dateStr !== prevDate;
                  return (
                    <Fragment key={entry.id}>
                      {showDateRow && (
                        <tr className="table-light">
                          <td colSpan={6} className="py-1 px-3">
                            <span className="small fw-semibold text-secondary">
                              <i className="fas fa-calendar-day me-2"></i>
                              {isToday ? 'Today — ' : ''}{formatDate(entry.timestamp)}
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-secondary small text-nowrap">{dateStr}</td>
                        <td className="text-secondary small text-nowrap">{formatTime(entry.timestamp)}</td>
                        <td>
                          <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.78rem' }}>
                            <i className="fas fa-file-alt me-1"></i>{entry.serviceName}
                          </span>
                        </td>
                        <td>
                          <span className="small text-secondary">
                            <i className="fas fa-print me-1 opacity-50"></i>{entry.printer || 'General'}
                          </span>
                        </td>
                        <td className="text-end fw-bold text-success text-nowrap">P{entry.price.toFixed(2)}</td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            <button
                              className="btn btn-sm btn-outline-secondary py-0 px-2"
                              title="Edit transaction"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => openEdit(entry)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger py-0 px-2"
                              title="Delete transaction"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => setDeleteEntry(entry)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan={5} className="text-end fw-semibold">
                    {hasFilter ? 'Filtered Total' : 'Grand Total'}
                    <span className="text-secondary ms-2 small">({displayed.length} transactions)</span>
                  </td>
                  <td className="text-end fw-bold text-success">P{filteredTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Add Past Sale Modal ──────────────────────────────────────────── */}
      {showPast && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="fas fa-history me-2"></i>Add Past Sale</h5>
                <button className="btn-close" onClick={() => setShowPast(false)}></button>
              </div>
              <form onSubmit={submitPastSale}>
                <div className="modal-body">
                  {pastErr && <div className="alert alert-danger py-2 small">{pastErr}</div>}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Service</label>
                    <select className="form-select" value={pastService}
                      onChange={(e) => handlePastServiceChange(e.target.value)}>
                      <option value="">— Select service —</option>
                      {services.filter((s) => s.active).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {s.name}{s.printer ? ` (${s.printer})` : ' (General)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-7">
                      <label className="form-label fw-semibold">Date</label>
                      <input type="date" className="form-control" value={pastDate}
                        max={nowDateStr()} onChange={(e) => setPastDate(e.target.value)} required />
                    </div>
                    <div className="col-5">
                      <label className="form-label fw-semibold">Time</label>
                      <input type="time" className="form-control" value={pastTime}
                        onChange={(e) => setPastTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Price (P)</label>
                    <input type="number" className="form-control" value={pastPrice} min="0" step="0.01"
                      placeholder="Auto-filled from service — can edit"
                      onChange={(e) => setPastPrice(e.target.value)} required />
                  </div>
                  <div className="alert alert-info py-2 small mb-0">
                    <i className="fas fa-info-circle me-1"></i>
                    This sale will be added directly to the history log with the date &amp; time you specify.
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPast(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-save me-1"></i>Save Sale
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Transaction Modal ──────────────────────────────────────── */}
      {showEdit && editEntry && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="fas fa-edit me-2"></i>Edit Transaction</h5>
                <button className="btn-close" onClick={() => setShowEdit(false)}></button>
              </div>
              <form onSubmit={submitEdit}>
                <div className="modal-body">
                  {editErr && <div className="alert alert-danger py-2 small">{editErr}</div>}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Service</label>
                    <select className="form-select" value={editService}
                      onChange={(e) => handleEditServiceChange(e.target.value)}>
                      <option value="">— Select service —</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {s.name}{s.printer ? ` (${s.printer})` : ' (General)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-7">
                      <label className="form-label fw-semibold">Date</label>
                      <input type="date" className="form-control" value={editDate}
                        max={nowDateStr()} onChange={(e) => setEditDate(e.target.value)} required />
                    </div>
                    <div className="col-5">
                      <label className="form-label fw-semibold">Time</label>
                      <input type="time" className="form-control" value={editTime}
                        onChange={(e) => setEditTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Price (P)</label>
                    <input type="number" className="form-control" value={editPrice} min="0" step="0.01"
                      onChange={(e) => setEditPrice(e.target.value)} required />
                  </div>
                  <div className="alert alert-warning py-2 small mb-0">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Editing will update this entry in the full history log.
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-save me-1"></i>Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────────── */}
      {deleteEntry && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title text-danger">
                  <i className="fas fa-trash me-2"></i>Delete Transaction?
                </h5>
                <button className="btn-close" onClick={() => setDeleteEntry(null)}></button>
              </div>
              <div className="modal-body">
                <p className="small text-secondary mb-1">You are about to permanently delete:</p>
                <div className="bg-light rounded p-2 small">
                  <div className="fw-semibold">{deleteEntry.serviceName}</div>
                  <div className="text-secondary">{formatDate(deleteEntry.timestamp)} · {formatTime(deleteEntry.timestamp)}</div>
                  <div className="fw-bold text-success">P{deleteEntry.price.toFixed(2)}</div>
                </div>
                <p className="small text-danger mt-2 mb-0">
                  <i className="fas fa-exclamation-triangle me-1"></i>This cannot be undone.
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-secondary btn-sm" onClick={() => setDeleteEntry(null)}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={() => { deleteSaleEntry(deleteEntry.id); setDeleteEntry(null); }}>
                  <i className="fas fa-trash me-1"></i>Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
