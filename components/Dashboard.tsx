'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSales } from '@/lib/SalesContext';
import PrinterRevenueChart from './PrinterRevenueChart';
import PaperConsumptionChart from './PaperConsumptionChart';
import SalesTrendChart from './SalesTrendChart';

export default function Dashboard() {
  const {
    services, addSale, todayTotal, todayCount, countByService,
    salesHistory, deposits, depositsTotal, expenses, expensesTotal,
    printers,
  } = useSales();

  const activeServices = services.filter((s) => s.active);
  const printerNames = [...new Set(activeServices.map((s) => s.printer))];
  const allSalesRevenue = useMemo(
    () => salesHistory.reduce((s, e) => s + e.price, 0),
    [salesHistory]
  );
  const netProfit = allSalesRevenue + depositsTotal - expensesTotal;

  // â”€â”€ 7-day trend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { trendLabels, trendAmounts } = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    return {
      trendLabels: days.map((d) =>
        new Date(d + 'T12:00:00').toLocaleDateString([], { weekday: 'short', day: 'numeric' })
      ),
      trendAmounts: days.map((d) =>
        salesHistory.filter((e) => e.timestamp.startsWith(d)).reduce((s, e) => s + e.price, 0)
      ),
    };
  }, [salesHistory]);

  // â”€â”€ Printer revenue chart data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { printerLabels, printerAmounts } = useMemo(() => {
    const map: Record<string, number> = {};
    salesHistory.forEach((e) => { map[e.printer] = (map[e.printer] ?? 0) + e.price; });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return { printerLabels: sorted.map((x) => x[0]), printerAmounts: sorted.map((x) => x[1]) };
  }, [salesHistory]);

  // â”€â”€ Service breakdown chart data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { serviceLabels, serviceCounts } = useMemo(() => {
    const map: Record<string, number> = {};
    salesHistory.forEach((e) => { map[e.serviceName] = (map[e.serviceName] ?? 0) + 1; });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return { serviceLabels: sorted.map((x) => x[0]), serviceCounts: sorted.map((x) => x[1]) };
  }, [salesHistory]);

  // â”€â”€ Recent deposits & expenses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const recentDeposits = useMemo(
    () => [...deposits].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    [deposits]
  );
  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    [expenses]
  );

  return (
    <div className="container-fluid py-3">
      {/* Page title */}
      <div className="mb-4">
        <h4 className="fw-semibold text-dark mb-0">
          <i className="fas fa-tachometer-alt text-primary me-2"></i>Sales Dashboard
        </h4>
        <p className="text-secondary small mb-0">Live overview â€” all figures in Pula (P)</p>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card h-100 border-top-blue shadow-sm">
            <div className="card-body">
              <p className="text-secondary text-uppercase small fw-semibold">Today&apos;s Sales</p>
              <h3 className="fw-bold text-dark">P{todayTotal.toFixed(2)}</h3>
              <span className="text-secondary small">
                {todayCount} transaction{todayCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card h-100 border-top-green shadow-sm">
            <div className="card-body">
              <p className="text-secondary text-uppercase small fw-semibold">Total Deposits</p>
              <h3 className="fw-bold text-dark">P{depositsTotal.toFixed(2)}</h3>
              <span className="text-secondary small">{deposits.length} record{deposits.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card h-100 border-top-red shadow-sm">
            <div className="card-body">
              <p className="text-secondary text-uppercase small fw-semibold">Total Expenses</p>
              <h3 className="fw-bold text-dark">P{expensesTotal.toFixed(2)}</h3>
              <span className="text-secondary small">{expenses.length} record{expenses.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className={`card h-100 shadow-sm ${netProfit >= 0 ? 'border-top-purple' : 'border-top-red'}`}>
            <div className="card-body">
              <p className="text-secondary text-uppercase small fw-semibold">Net Position</p>
              <h3 className={`fw-bold ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                {netProfit >= 0 ? '' : '-'}P{Math.abs(netProfit).toFixed(2)}
              </h3>
              <span className="text-secondary small">sales + deposits &minus; expenses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="row g-4">
        {/* LEFT COLUMN */}
        <div className="col-lg-4">
          {/* Quick tally panel */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white border-0 pt-4 pb-0 d-flex align-items-center justify-content-between">
              <div>
                <h5 className="fw-semibold mb-0">
                  <i className="fas fa-cash-register text-primary me-2"></i>Quick Tally
                </h5>
                <p className="text-secondary small mb-0">Click to record a sale</p>
              </div>
              <Link href="/tally" className="btn btn-outline-primary btn-sm rounded-pill">
                Full board <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </div>
            <div className="card-body pt-3">
              {activeServices.length === 0 ? (
                <div className="text-center text-secondary py-3">
                  <Link href="/services" className="btn btn-sm btn-outline-primary rounded-pill">
                    <i className="fas fa-plus me-1"></i>Add services
                  </Link>
                </div>
              ) : (
                printerNames.map((printer) => {
                  const svcs = activeServices.filter((s) => s.printer === printer);
                  const isGeneral = printer === '';
                  return (
                    <div key={printer || '__general__'} className="mb-3 pb-2 border-bottom">
                      <div className="d-flex align-items-center mb-2">
                        {isGeneral
                          ? <><i className="fas fa-store text-secondary me-2 small"></i><span className="fw-medium small">General Products &amp; Services</span></>
                          : <><i className="fas fa-print text-secondary me-2 small"></i><span className="fw-medium small">{printer}</span></>}
                      </div>
                      <div className="row g-2">
                        {svcs.map((svc) => (
                          <div key={svc.id} className="col-6">
                            <button className="tally-btn" onClick={() => addSale(svc.id)}>
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
                  );
                })
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="fw-semibold mb-3">Recent Activity</h5>
              <div className="d-flex gap-2 mb-3">
                <Link href="/deposits" className="btn btn-outline-success btn-sm rounded-pill">
                  <i className="fas fa-piggy-bank me-1"></i>Deposits
                </Link>
                <Link href="/expenses" className="btn btn-outline-danger btn-sm rounded-pill">
                  <i className="fas fa-receipt me-1"></i>Expenses
                </Link>
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <h6 className="fw-semibold text-success small">
                    <i className="fas fa-arrow-down me-1"></i>Latest Deposits
                  </h6>
                  {recentDeposits.length === 0 ? (
                    <p className="text-secondary small">No deposits yet.</p>
                  ) : (
                    <ul className="list-group list-group-flush small">
                      {recentDeposits.map((d) => (
                        <li key={d.id} className="list-group-item d-flex justify-content-between px-0 py-1">
                          <span className="text-secondary text-truncate me-1" style={{ maxWidth: 80 }}>
                            {d.paidBy || d.date}
                          </span>
                          <span className="fw-medium text-success text-nowrap">+P{d.amount.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="col-6">
                  <h6 className="fw-semibold text-danger small">
                    <i className="fas fa-arrow-up me-1"></i>Latest Expenses
                  </h6>
                  {recentExpenses.length === 0 ? (
                    <p className="text-secondary small">No expenses yet.</p>
                  ) : (
                    <ul className="list-group list-group-flush small">
                      {recentExpenses.map((e) => (
                        <li key={e.id} className="list-group-item d-flex justify-content-between px-0 py-1">
                          <span className="text-secondary text-truncate me-1" style={{ maxWidth: 80 }}>
                            {e.description}
                          </span>
                          <span className="fw-medium text-danger text-nowrap">-P{e.amount.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-lg-8">

          {/* 7-day sales trend */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-semibold text-secondary mb-0">
                  <i className="fas fa-chart-line text-primary me-2"></i>7-Day Sales Trend
                </h6>
                <span className="small text-secondary">
                  Total: <span className="fw-bold text-success">P{trendAmounts.reduce((s, v) => s + v, 0).toFixed(2)}</span>
                </span>
              </div>
              <SalesTrendChart labels={trendLabels} amounts={trendAmounts} />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="fw-semibold text-secondary mb-3">
                    <i className="fas fa-chart-bar text-primary me-2"></i>Revenue per Printer
                  </h6>
                  <PrinterRevenueChart labels={printerLabels} amounts={printerAmounts} />
                  {printerLabels.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 small text-secondary mt-2">
                      {printerLabels.map((p, i) => (
                        <span key={p}>{p}: P{printerAmounts[i].toFixed(0)}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="fw-semibold text-secondary mb-3">
                    <i className="fas fa-chart-pie text-success me-2"></i>Sales by Service
                  </h6>
                  <PaperConsumptionChart labels={serviceLabels} counts={serviceCounts} />
                  {serviceLabels.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 small text-secondary mt-2">
                      {serviceLabels.map((s, i) => (
                        <span key={s}>{s}: {serviceCounts[i]}Ã—</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Live tally summary table */}
          <div className="card shadow-sm">
            <div className="card-header bg-white border-0 pt-3 pb-0 d-flex align-items-center justify-content-between">
              <h5 className="fw-semibold mb-0">
                <i className="fas fa-table me-2 text-secondary"></i>
                Today&apos;s Tally by Service
              </h5>
              <Link href="/tally" className="btn btn-sm btn-outline-primary rounded-pill">
                Open tally board
              </Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle small mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Service</th>
                      <th>Printer</th>
                      <th className="text-end">Price</th>
                      <th className="text-end">Count</th>
                      <th className="text-end pe-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeServices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-secondary py-4">
                          No active services.{' '}
                          <Link href="/services" className="text-primary">Add some</Link>{' '}
                          to see tally data here.
                        </td>
                      </tr>
                    ) : (
                      activeServices.map((svc) => {
                        const cnt = countByService(svc.id);
                        return (
                          <tr key={svc.id}>
                            <td className="ps-3 fw-medium">
                              <span className="me-2">{svc.icon}</span>{svc.name}
                            </td>
                            <td className="text-secondary">{svc.printer}</td>
                            <td className="text-end">P{svc.price.toFixed(2)}</td>
                            <td className="text-end">
                              <span className={`badge ${svc.badgeVariant}`}>{cnt}</span>
                            </td>
                            <td className="text-end pe-3 text-success fw-medium">
                              P{(cnt * svc.price).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {activeServices.length > 0 && (
                    <tfoot className="table-light">
                      <tr>
                        <td colSpan={3} className="ps-3 fw-semibold">Total</td>
                        <td className="text-end fw-semibold">{todayCount}</td>
                        <td className="text-end pe-3 fw-bold text-success">P{todayTotal.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
