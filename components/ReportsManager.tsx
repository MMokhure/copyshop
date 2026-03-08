'use client';

import { useState, useMemo } from 'react';
import { useSales } from '@/lib/SalesContext';

function fmtMonth(key: string) {
  return new Date(key + '-01T12:00:00').toLocaleDateString([], { month: 'long', year: 'numeric' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReportsManager() {
  const { salesHistory, services, expenses, deposits } = useSales();

  const [tab, setTab]             = useState<'overview' | 'services' | 'printers' | 'daily'>('overview');
  const [monthFilter, setMonthFilter] = useState('');

  // ── Month options ──────────────────────────────────────────────────────────
  const allMonths = useMemo(() => {
    const s = new Set(salesHistory.map((e) => e.timestamp.slice(0, 7)));
    return Array.from(s).sort().reverse();
  }, [salesHistory]);

  const currentMonthKey = new Date().toISOString().slice(0, 7);

  // ── Apply month filter ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!monthFilter) return salesHistory;
    return salesHistory.filter((e) => e.timestamp.startsWith(monthFilter));
  }, [salesHistory, monthFilter]);

  const filteredExpenses = useMemo(() => {
    if (!monthFilter) return expenses;
    return expenses.filter((e) => (e.date || e.createdAt).startsWith(monthFilter));
  }, [expenses, monthFilter]);

  const filteredDeposits = useMemo(() => {
    if (!monthFilter) return deposits;
    return deposits.filter((d) => d.createdAt.startsWith(monthFilter));
  }, [deposits, monthFilter]);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalRevenue   = filtered.reduce((s, e) => s + e.price, 0);
  const totalExpenses  = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalDeposits  = filteredDeposits.reduce((s, e) => s + e.amount, 0);
  const netPosition    = totalRevenue + totalDeposits - totalExpenses;
  const totalTxns      = filtered.length;
  const avgSaleValue   = totalTxns > 0 ? totalRevenue / totalTxns : 0;

  // ── Service performance ───────────────────────────────────────────────────
  const serviceStats = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    filtered.forEach((e) => {
      if (!map[e.serviceName]) map[e.serviceName] = { count: 0, revenue: 0 };
      map[e.serviceName].count++;
      map[e.serviceName].revenue += e.price;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, avg: v.count > 0 ? v.revenue / v.count : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  // ── Printer performance ───────────────────────────────────────────────────
  const printerStats = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    filtered.forEach((e) => {
      const key = e.printer || 'General';
      if (!map[key]) map[key] = { count: 0, revenue: 0 };
      map[key].count++;
      map[key].revenue += e.price;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  // ── Daily breakdown ───────────────────────────────────────────────────────
  const dailyStats = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    filtered.forEach((e) => {
      const day = e.timestamp.slice(0, 10);
      if (!map[day]) map[day] = { count: 0, revenue: 0 };
      map[day].count++;
      map[day].revenue += e.price;
    });
    return Object.entries(map)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered]);

  // ── Monthly trend (for overview, always all-time) ─────────────────────────
  const monthlyRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    salesHistory.forEach((e) => {
      const m = e.timestamp.slice(0, 7);
      map[m] = (map[m] ?? 0) + e.price;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [salesHistory]);

  const maxMonthly = Math.max(1, ...monthlyRevenue.map((x) => x[1]));

  // ── CSV export ────────────────────────────────────────────────────────────
  function exportCSV() {
    const rows = [
      ['Date', 'Time', 'Service', 'Printer', 'Price (P)'],
      ...filtered.map((e) => [
        e.timestamp.slice(0, 10),
        new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        e.serviceName,
        e.printer || 'General',
        e.price.toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copyshop-report-${monthFilter || 'all-time'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filterLabel = monthFilter ? fmtMonth(monthFilter) : 'All Time';

  return (
    <div className="container-fluid py-3">

      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h4 className="fw-semibold text-dark mb-0">
            <i className="fas fa-chart-line text-info me-2"></i>Reports
          </h4>
          <p className="text-secondary small mb-0">Performance analysis — {filterLabel}</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            style={{ minWidth: 180 }}
          >
            <option value="">All Time</option>
            {allMonths.map((m) => (
              <option key={m} value={m}>{fmtMonth(m)}{m === currentMonthKey ? ' (current)' : ''}</option>
            ))}
          </select>
          <button className="btn btn-outline-success btn-sm" onClick={exportCSV}>
            <i className="fas fa-file-csv me-1"></i>Export CSV
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-sm-4 col-lg-2">
          <div className="card border-top-green shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Sales Revenue</p>
              <h5 className="fw-bold mb-0 text-success">P{totalRevenue.toFixed(2)}</h5>
              <p className="text-secondary small mb-0">{totalTxns} transactions</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-4 col-lg-2">
          <div className="card border-top-yellow shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Avg Sale</p>
              <h5 className="fw-bold mb-0">P{avgSaleValue.toFixed(2)}</h5>
              <p className="text-secondary small mb-0">per transaction</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-4 col-lg-2">
          <div className="card border-top-blue shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Deposits</p>
              <h5 className="fw-bold mb-0">P{totalDeposits.toFixed(2)}</h5>
              <p className="text-secondary small mb-0">{filteredDeposits.length} records</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-4 col-lg-2">
          <div className="card border-top-red shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Expenses</p>
              <h5 className="fw-bold mb-0">P{totalExpenses.toFixed(2)}</h5>
              <p className="text-secondary small mb-0">{filteredExpenses.length} records</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-4 col-lg-2">
          <div className={`card shadow-sm h-100 ${netPosition >= 0 ? 'border-top-purple' : 'border-top-red'}`}>
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Net Position</p>
              <h5 className={`fw-bold mb-0 ${netPosition >= 0 ? 'text-success' : 'text-danger'}`}>
                {netPosition >= 0 ? '' : '-'}P{Math.abs(netPosition).toFixed(2)}
              </h5>
              <p className="text-secondary small mb-0">sales + dep − exp</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-4 col-lg-2">
          <div className="card border-top-blue shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Services Used</p>
              <h5 className="fw-bold mb-0">{serviceStats.length}</h5>
              <p className="text-secondary small mb-0">distinct services</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        {([['overview', 'fas fa-chart-bar', 'Overview'], ['services', 'fas fa-tags', 'Services'], ['printers', 'fas fa-print', 'Printers'], ['daily', 'fas fa-calendar-check', 'Daily']] as const).map(([key, icon, label]) => (
          <li key={key} className="nav-item">
            <button className={`nav-link${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
              <i className={`${icon} me-1`}></i>{label}
            </button>
          </li>
        ))}
      </ul>

      {/* ── Overview Tab ──────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div>
          {monthlyRevenue.length === 0 ? (
            <div className="card shadow-sm">
              <div className="card-body text-center py-5 text-secondary">
                <i className="fas fa-chart-bar fa-3x mb-3 d-block opacity-25"></i>
                No sales data yet. Record sales on the Tally board to see reports here.
              </div>
            </div>
          ) : (
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <span className="fw-semibold">
                  <i className="fas fa-chart-bar me-2 text-info"></i>Monthly Revenue Trend
                </span>
              </div>
              <div className="card-body">
                {monthlyRevenue.map(([month, rev]) => (
                  <div key={month} className="mb-3">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className={`fw-medium ${month === currentMonthKey ? 'text-primary' : ''}`}>
                        {fmtMonth(month)}{month === currentMonthKey ? ' ●' : ''}
                      </span>
                      <span className="fw-bold text-success">P{rev.toFixed(2)}</span>
                    </div>
                    <div className="progress" style={{ height: 14, borderRadius: 6 }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${(rev / maxMonthly) * 100}%`, borderRadius: 6 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Services Tab ──────────────────────────────────────────────────── */}
      {tab === 'services' && (
        <div className="card shadow-sm">
          {serviceStats.length === 0 ? (
            <div className="card-body text-center py-5 text-secondary">
              <i className="fas fa-tags fa-3x mb-3 d-block opacity-25"></i>
              No service data for this period.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Service</th>
                    <th className="text-center">Transactions</th>
                    <th className="text-center">Avg Price</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceStats.map((s, i) => (
                    <tr key={s.name}>
                      <td className="text-secondary small">{i + 1}</td>
                      <td className="fw-semibold">{s.name}</td>
                      <td className="text-center">
                        <span className="badge bg-secondary rounded-pill">{s.count}</span>
                      </td>
                      <td className="text-center text-secondary small">P{s.avg.toFixed(2)}</td>
                      <td className="text-end fw-bold text-success">P{s.revenue.toFixed(2)}</td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          <div className="progress flex-grow-1" style={{ height: 8, minWidth: 60 }}>
                            <div
                              className="progress-bar bg-primary"
                              style={{ width: `${totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="small text-secondary text-nowrap" style={{ minWidth: 40 }}>
                            {totalRevenue > 0 ? ((s.revenue / totalRevenue) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan={2} className="fw-semibold text-end">Total</td>
                    <td className="text-center fw-semibold">{totalTxns}</td>
                    <td></td>
                    <td className="text-end fw-bold text-success">P{totalRevenue.toFixed(2)}</td>
                    <td className="text-end">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Printers Tab ──────────────────────────────────────────────────── */}
      {tab === 'printers' && (
        <div className="card shadow-sm">
          {printerStats.length === 0 ? (
            <div className="card-body text-center py-5 text-secondary">
              <i className="fas fa-print fa-3x mb-3 d-block opacity-25"></i>
              No printer data for this period.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Printer / Category</th>
                    <th className="text-center">Jobs</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {printerStats.map((p, i) => (
                    <tr key={p.name}>
                      <td className="text-secondary small">{i + 1}</td>
                      <td>
                        <i className={`fas ${p.name === 'General' ? 'fa-store' : 'fa-print'} me-2 text-secondary`}></i>
                        <span className="fw-semibold">{p.name}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-secondary rounded-pill">{p.count}</span>
                      </td>
                      <td className="text-end fw-bold text-success">P{p.revenue.toFixed(2)}</td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          <div className="progress flex-grow-1" style={{ height: 8, minWidth: 60 }}>
                            <div
                              className="progress-bar bg-info"
                              style={{ width: `${totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="small text-secondary text-nowrap" style={{ minWidth: 40 }}>
                            {totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan={2} className="fw-semibold text-end">Total</td>
                    <td className="text-center fw-semibold">{totalTxns}</td>
                    <td className="text-end fw-bold text-success">P{totalRevenue.toFixed(2)}</td>
                    <td className="text-end">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Daily Tab ──────────────────────────────────────────────────────── */}
      {tab === 'daily' && (
        <div className="card shadow-sm">
          {dailyStats.length === 0 ? (
            <div className="card-body text-center py-5 text-secondary">
              <i className="fas fa-calendar fa-3x mb-3 d-block opacity-25"></i>
              No daily data for this period.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th className="text-center">Transactions</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyStats.map((d) => (
                    <tr key={d.date}>
                      <td className="fw-medium text-nowrap">{fmtDate(d.date + 'T12:00:00')}</td>
                      <td className="text-center">
                        <span className="badge bg-secondary rounded-pill">{d.count}</span>
                      </td>
                      <td className="text-end fw-bold text-success">P{d.revenue.toFixed(2)}</td>
                      <td style={{ minWidth: 120 }}>
                        <div className="progress" style={{ height: 10 }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${(d.revenue / Math.max(...dailyStats.map((x) => x.revenue))) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td className="fw-semibold">{dailyStats.length} days</td>
                    <td className="text-center fw-semibold">{totalTxns}</td>
                    <td className="text-end fw-bold text-success">P{totalRevenue.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
