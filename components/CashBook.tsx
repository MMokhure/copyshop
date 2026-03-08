'use client';

import { useState, useMemo } from 'react';
import { useSales } from '../lib/SalesContext';

function monthLabel(m: string) {
  const [y, mo] = m.split('-');
  return new Date(+y, +mo - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function CashBook() {
  const { salesHistory, deposits, expenses, investmentsTotal } = useSales();
  const [activeTab, setActiveTab] = useState<'monthly' | 'daily'>('monthly');
  const [viewMonth, setViewMonth]   = useState(new Date().toISOString().slice(0, 7));
  const [workingDays, setWorkingDays] = useState(26);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const daysElapsed = new Date().getDate();

  // ── Aggregate by month ───────────────────────────────────────────────────
  const salesByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    salesHistory.forEach((e) => {
      const m = e.timestamp.slice(0, 7);
      map[m] = (map[m] || 0) + e.price;
    });
    return map;
  }, [salesHistory]);

  const depositsByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    deposits.forEach((d) => {
      const m = d.date.slice(0, 7);
      map[m] = (map[m] || 0) + d.amount;
    });
    return map;
  }, [deposits]);

  const expensesByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const m = e.date.slice(0, 7);
      map[m] = (map[m] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const allMonths = useMemo(() => {
    const set = new Set([
      ...Object.keys(salesByMonth),
      ...Object.keys(depositsByMonth),
      ...Object.keys(expensesByMonth),
      thisMonth,
    ]);
    return Array.from(set).sort().reverse();
  }, [salesByMonth, depositsByMonth, expensesByMonth, thisMonth]);

  // ── Current month KPIs ───────────────────────────────────────────────────
  const curSales    = salesByMonth[thisMonth]    || 0;
  const curDeposits = depositsByMonth[thisMonth] || 0;
  const curExpenses = expensesByMonth[thisMonth] || 0;
  const curNet      = curSales + curDeposits - curExpenses;

  // ── Break-even ───────────────────────────────────────────────────────────
  const avgDailySales  = daysElapsed > 0 ? curSales / daysElapsed : 0;
  const dailyTarget    = workingDays > 0 ? curExpenses / workingDays : 0;
  const beProgress     = dailyTarget > 0 ? Math.min((avgDailySales / dailyTarget) * 100, 100) : 0;
  const isAboveBE      = avgDailySales >= dailyTarget;
  const gapPerDay      = avgDailySales - dailyTarget;

  // ── All-time totals ──────────────────────────────────────────────────────
  const allSales    = salesHistory.reduce((s, e) => s + e.price, 0);
  const allDeposits = deposits.reduce((s, d) => s + d.amount, 0);
  const allExpenses = expenses.reduce((s, e) => s + e.amount, 0);  const allNet      = allSales + allDeposits - allExpenses;
  // ── Daily detail for viewMonth ───────────────────────────────────────────
  const dailyData = useMemo(() => {
    const s: Record<string, number> = {};
    const d: Record<string, number> = {};
    const ex: Record<string, number> = {};

    salesHistory.filter((e) => e.timestamp.slice(0, 7) === viewMonth)
      .forEach((e) => { const day = e.timestamp.slice(0, 10); s[day] = (s[day] || 0) + e.price; });
    deposits.filter((dep) => dep.date.slice(0, 7) === viewMonth)
      .forEach((dep) => { d[dep.date] = (d[dep.date] || 0) + dep.amount; });
    expenses.filter((exp) => exp.date.slice(0, 7) === viewMonth)
      .forEach((exp) => { ex[exp.date] = (ex[exp.date] || 0) + exp.amount; });

    const days = new Set([...Object.keys(s), ...Object.keys(d), ...Object.keys(ex)]);
    let running = 0;
    return Array.from(days).sort().map((date) => {
      const sales   = s[date]  || 0;
      const deps    = d[date]  || 0;
      const expAmt  = ex[date] || 0;
      const net     = sales + deps - expAmt;
      running += net;
      return { date, sales, deposits: deps, expenses: expAmt, net, balance: running };
    });
  }, [salesHistory, deposits, expenses, viewMonth]);

  const dailyTotals = useMemo(() => ({
    sales:    dailyData.reduce((s, r) => s + r.sales,    0),
    deposits: dailyData.reduce((s, r) => s + r.deposits, 0),
    expenses: dailyData.reduce((s, r) => s + r.expenses, 0),
    net:      dailyData.reduce((s, r) => s + r.net,      0),
  }), [dailyData]);

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <span style={{ fontSize: '1.6rem' }} className="me-2">📒</span>
        <div>
          <h4 className="mb-0 fw-bold">Cash Book</h4>
          <small className="text-muted">Revenue, expenses &amp; break-even analysis</small>
        </div>
      </div>

      {/* KPI Row — this month */}
      <div className="row g-3 mb-4">
        {[
          { label: 'This Month Sales',    val: curSales,    color: 'text-success', sub: 'Tally revenue' },
          { label: 'This Month Deposits', val: curDeposits, color: 'text-primary', sub: 'Account deposits' },
          { label: 'This Month Expenses', val: curExpenses, color: 'text-danger',  sub: 'Operating costs' },
          { label: 'Net Position',        val: curNet,      color: curNet >= 0 ? 'text-success' : 'text-danger',
            sub: curNet >= 0 ? '▲ Surplus' : '▼ Deficit' },
        ].map((kpi) => (
          <div key={kpi.label} className="col-6 col-xl-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small text-uppercase fw-semibold mb-1">{kpi.label}</p>
                <h4 className={`fw-bold ${kpi.color}`}>P{kpi.val.toFixed(2)}</h4>
                <p className="text-muted small mb-0">{kpi.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* All-time strip */}
      <div className="card shadow-sm border-0 mb-4 bg-light">
        <div className="card-body py-2">
          <div className="row g-3 text-center">
            <div className="col-3">
              <p className="text-muted small mb-0">All-time Sales</p>
              <span className="fw-bold text-success">P{allSales.toFixed(2)}</span>
            </div>
            <div className="col-3">
              <p className="text-muted small mb-0">All-time Expenses</p>
              <span className="fw-bold text-danger">P{allExpenses.toFixed(2)}</span>
            </div>
            <div className="col-3">
              <p className="text-muted small mb-0">Total Investments</p>
              <span className="fw-bold text-primary">P{investmentsTotal.toFixed(2)}</span>
            </div>
            <div className="col-3">
              <p className="text-muted small mb-0">All-time Net</p>
              <span className={`fw-bold ${allNet >= 0 ? 'text-success' : 'text-danger'}`}>
                P{allNet.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Break-Even Analysis */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-warning bg-opacity-10 border-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-chart-line text-warning"></i>
            <strong>Break-Even Analysis — {monthLabel(thisMonth)}</strong>
          </div>
          <div className="d-flex align-items-center gap-2">
            <label className="small text-muted mb-0">Working days/month:</label>
            <input type="number" className="form-control form-control-sm" style={{ width: 70 }}
              min={1} max={31} value={workingDays}
              onChange={(e) => setWorkingDays(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
        </div>
        <div className="card-body">
          <div className="row g-3 text-center">
            <div className="col-md-3">
              <p className="text-muted small mb-1">Monthly Expenses</p>
              <div className="h5 fw-bold text-danger">P{curExpenses.toFixed(2)}</div>
            </div>
            <div className="col-md-3">
              <p className="text-muted small mb-1">Daily Revenue Target</p>
              <div className="h5 fw-bold text-warning">P{dailyTarget.toFixed(2)}</div>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>Expenses ÷ {workingDays} days</p>
            </div>
            <div className="col-md-3">
              <p className="text-muted small mb-1">Avg Daily Revenue</p>
              <div className={`h5 fw-bold ${isAboveBE ? 'text-success' : 'text-danger'}`}>
                P{avgDailySales.toFixed(2)}
              </div>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>{daysElapsed} days elapsed</p>
            </div>
            <div className="col-md-3">
              <p className="text-muted small mb-1">Break-Even Status</p>
              <div className={`h5 fw-bold ${isAboveBE ? 'text-success' : 'text-danger'}`}>
                {isAboveBE ? '✅ Above' : '⚠️ Below'}
              </div>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                {gapPerDay >= 0 ? '+' : ''}P{gapPerDay.toFixed(2)}/day vs target
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="d-flex justify-content-between small text-muted mb-1">
              <span>Progress toward daily target</span>
              <span>{beProgress.toFixed(0)}%</span>
            </div>
            <div className="progress" style={{ height: 10 }}>
              <div
                className={`progress-bar ${isAboveBE ? 'bg-success' : 'bg-warning'}`}
                style={{ width: `${beProgress}%`, transition: 'width 0.5s' }}
              ></div>
            </div>
            {!isAboveBE && dailyTarget > 0 && (
              <p className="text-muted small mt-2 mb-0">
                <i className="fas fa-info-circle me-1"></i>
                You need <strong>P{(dailyTarget - avgDailySales).toFixed(2)}</strong> more average daily sales to reach break-even this month.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        {(['monthly', 'daily'] as const).map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab ? 'active fw-semibold' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'monthly' ? '📅 Monthly Summary' : '📆 Daily Detail'}
            </button>
          </li>
        ))}
      </ul>

      {/* ── Monthly Summary ──────────────────────────────────────────────── */}
      {activeTab === 'monthly' && (
        <div className="card shadow-sm border-0">
          {allMonths.length === 0 ? (
            <div className="card-body text-center text-muted py-5">No data yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Month</th>
                    <th className="text-end">Sales Revenue</th>
                    <th className="text-end">Deposits</th>
                    <th className="text-end">Expenses</th>
                    <th className="text-end">Net</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allMonths.map((m) => {
                    const s  = salesByMonth[m]    || 0;
                    const d  = depositsByMonth[m] || 0;
                    const ex = expensesByMonth[m] || 0;
                    const net = s + d - ex;
                    return (
                      <tr key={m} className={m === thisMonth ? 'table-primary' : ''}>
                        <td className="fw-semibold">
                          {monthLabel(m)}
                          {m === thisMonth && <span className="badge bg-primary ms-2 small">Current</span>}
                        </td>
                        <td className="text-end text-success fw-semibold">P{s.toFixed(2)}</td>
                        <td className="text-end text-primary">P{d.toFixed(2)}</td>
                        <td className="text-end text-danger">P{ex.toFixed(2)}</td>
                        <td className={`text-end fw-bold ${net >= 0 ? 'text-success' : 'text-danger'}`}>
                          P{net.toFixed(2)}
                        </td>
                        <td className="text-center">
                          <span className={`badge ${net >= 0 ? 'bg-success' : 'bg-danger'}`}>
                            {net >= 0 ? 'Profit' : 'Loss'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td>All Time</td>
                    <td className="text-end text-success">P{allSales.toFixed(2)}</td>
                    <td className="text-end text-primary">P{allDeposits.toFixed(2)}</td>
                    <td className="text-end text-danger">P{allExpenses.toFixed(2)}</td>
                    <td className={`text-end ${allNet >= 0 ? 'text-success' : 'text-danger'}`}>
                      P{allNet.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Daily Detail ─────────────────────────────────────────────────── */}
      {activeTab === 'daily' && (
        <div>
          <div className="d-flex align-items-center gap-3 mb-3">
            <label className="fw-semibold mb-0">Month:</label>
            <select className="form-select" style={{ maxWidth: 220 }}
              value={viewMonth} onChange={(e) => setViewMonth(e.target.value)}>
              {allMonths.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
          </div>

          {dailyData.length === 0 ? (
            <div className="card shadow-sm border-0">
              <div className="card-body text-center py-5 text-muted">
                No data for {monthLabel(viewMonth)}.
              </div>
            </div>
          ) : (
            <div className="card shadow-sm border-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th className="text-end">Sales</th>
                      <th className="text-end">Deposits</th>
                      <th className="text-end">Expenses</th>
                      <th className="text-end">Day Net</th>
                      <th className="text-end">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.map((row) => (
                      <tr key={row.date}>
                        <td className="fw-semibold">
                          {new Date(row.date + 'T12:00:00').toLocaleDateString([], {
                            weekday: 'short', day: '2-digit', month: 'short',
                          })}
                        </td>
                        <td className="text-end text-success">P{row.sales.toFixed(2)}</td>
                        <td className="text-end text-primary">P{row.deposits.toFixed(2)}</td>
                        <td className="text-end text-danger">P{row.expenses.toFixed(2)}</td>
                        <td className={`text-end fw-semibold ${row.net >= 0 ? 'text-success' : 'text-danger'}`}>
                          {row.net >= 0 ? '+' : ''}P{row.net.toFixed(2)}
                        </td>
                        <td className={`text-end fw-bold ${row.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                          P{row.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light fw-bold">
                    <tr>
                      <td>Total</td>
                      <td className="text-end text-success">P{dailyTotals.sales.toFixed(2)}</td>
                      <td className="text-end text-primary">P{dailyTotals.deposits.toFixed(2)}</td>
                      <td className="text-end text-danger">P{dailyTotals.expenses.toFixed(2)}</td>
                      <td className={`text-end ${dailyTotals.net >= 0 ? 'text-success' : 'text-danger'}`}>
                        P{dailyTotals.net.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
