'use client';

import { useState } from 'react';

interface Section {
  id: string;
  icon: string;
  title: string;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'dashboard',
    icon: '🏠',
    title: 'Dashboard',
    content: (
      <div>
        <p>The <strong>Dashboard</strong> gives you a live overview of your shop&apos;s performance at a glance.</p>
        <ul>
          <li><strong>Today&apos;s Sales</strong> — total rung up so far today on the tally board.</li>
          <li><strong>Total Deposits</strong> — sum of all recorded payments into your accounts.</li>
          <li><strong>Total Expenses</strong> — sum of all recorded costs.</li>
          <li><strong>Net Position</strong> — Deposits minus Expenses (rough cash position).</li>
          <li><strong>7-Day Trend</strong> — line chart of daily sales revenue over the last week.</li>
          <li><strong>Printer Revenue</strong> — bar chart showing earnings broken down per printer.</li>
          <li><strong>Service Breakdown</strong> — doughnut chart showing the split of revenue by service type.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'tally',
    icon: '🧾',
    title: 'Sales Tally',
    content: (
      <div>
        <p>The <strong>Tally Board</strong> is where cashiers record sales in real time.</p>
        <ul>
          <li>Tap any service button to instantly add a sale entry with the current time.</li>
          <li>Services are grouped by printer. Printer-less services appear under <em>General Products &amp; Services</em>.</li>
          <li>The live feed on the right shows every entry for today — tap the <strong>×</strong> button to cancel an individual entry.</li>
          <li><strong>Undo Last</strong> removes the most recent entry if you tapped the wrong button.</li>
          <li><strong>Clear Today</strong> wipes the current day&apos;s tally completely (prompt confirms before clearing).</li>
          <li>The daily tally resets automatically at midnight each day.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'services',
    icon: '🛠️',
    title: 'Services Manager',
    content: (
      <div>
        <p>Define every product and service your shop offers.</p>
        <ul>
          <li>Set a <strong>name</strong>, <strong>price</strong> (in Pula), <strong>icon</strong>, and <strong>badge colour</strong>.</li>
          <li>Link a service to a specific printer — or choose <em>No printer</em> for general items like pens, CV writing, laminating, etc.</li>
          <li>Toggle services <strong>Active / Inactive</strong>; inactive services are hidden from the tally board.</li>
          <li>Active service count is shown in the sidebar badge next to <em>Services</em>.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'printers',
    icon: '🖨️',
    title: 'Printers Manager',
    content: (
      <div>
        <p>Track all printers in your shop.</p>
        <ul>
          <li>Record printer <strong>model</strong>, <strong>type</strong>, <strong>location</strong>, and <strong>capabilities</strong> (A4, A3, Color, B&amp;W, Duplex, etc.).</li>
          <li>Monitor <strong>paper remaining</strong> (sheets) and <strong>toner level</strong> (%).</li>
          <li>Set <strong>toner cost</strong> and <strong>expected page yield</strong> to track consumable costs.</li>
          <li>Mark a printer as Online, Offline, or Under Maintenance.</li>
          <li>Low toner / low paper warnings appear in the sidebar <em>Inventory</em> badge.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'inventory',
    icon: '📦',
    title: 'Inventory',
    content: (
      <div>
        <p>Keep stock levels accurate for all consumables and supplies.</p>
        <ul>
          <li>Categories: <em>Paper, Toner, Ink, Binding, Stationery, Other</em>.</li>
          <li>Set a <strong>minimum quantity</strong> threshold — items below this show as low stock.</li>
          <li>The sidebar badge shows the number of low-stock items in real time.</li>
          <li>Use <strong>Edit</strong> to update quantities after a restock.</li>
          <li>Record <strong>cost per unit</strong> and <strong>supplier</strong> for reorder reference.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'deposits',
    icon: '💰',
    title: 'Deposits',
    content: (
      <div>
        <p>Record every payment received into your shop accounts.</p>
        <ul>
          <li>First, create your <strong>accounts</strong> (Cash Box, FNB Business, Orange Money, etc.) in the Accounts panel on the left.</li>
          <li>Each deposit must be assigned to an account, with a <strong>payment method</strong>, <strong>payer name</strong>, <strong>date</strong>, and optional reference.</li>
          <li>Deposits feed directly into the <strong>Net Position</strong> KPI on the Dashboard.</li>
          <li>Use the payment method filter to reconcile cash vs bank vs mobile money.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'expenses',
    icon: '🧾',
    title: 'Expenses',
    content: (
      <div>
        <p>Log every business cost to track profitability.</p>
        <ul>
          <li>Categories: <em>Supplies, Utilities, Maintenance, Rent, Salaries, Transport, Equipment, Other</em>.</li>
          <li>Each expense has an <strong>amount</strong>, <strong>vendor</strong>, <strong>date</strong>, and optional reference/notes.</li>
          <li>The category breakdown chart shows where money is going.</li>
          <li>Expenses are subtracted from deposits to compute the <strong>Net Position</strong> on the Dashboard.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'transactions',
    icon: '📋',
    title: 'Transactions History',
    content: (
      <div>
        <p>Full searchable log of every sale ever recorded on the tally board.</p>
        <ul>
          <li>Filter by <strong>service name</strong>, <strong>printer</strong>, or a <strong>date range</strong>.</li>
          <li>KPIs show total sales, total revenue, average sale value, and services count for the filtered view.</li>
          <li>Service breakdown pills show tallies per service within the filtered results.</li>
          <li>Entries persist across days — the log is never cleared unless you use Clear All Data in Settings.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'settings',
    icon: '⚙️',
    title: 'Settings',
    content: (
      <div>
        <p>Configure your shop profile and manage app data.</p>
        <ul>
          <li>Set <strong>business name, phone, email, address</strong> for display purposes.</li>
          <li>Choose the <strong>currency symbol</strong> and <strong>timezone</strong> for your region.</li>
          <li><strong>Export Backup</strong> — download all your data as a JSON file for safe storage or migration.</li>
          <li><strong>Clear All Data</strong> — wipes all localStorage records and resets the app (use with caution).</li>
        </ul>
      </div>
    ),
  },
];

const FAQ = [
  {
    q: 'Where is my data stored?',
    a: 'All data is stored in your browser\'s localStorage — no server is required. This means data is private to this device and browser. Use Export Backup in Settings to save a copy.',
  },
  {
    q: 'What happens to the tally at midnight?',
    a: 'The daily tally resets automatically — each day gets its own storage key (cs_tally_YYYY-MM-DD). Your sales history is preserved forever in the Transactions log.',
  },
  {
    q: 'Can I use the app on multiple devices?',
    a: 'Not simultaneously — data lives only in the browser where you entered it. To move data, export a JSON backup from Settings, then re-import it manually once import functionality is added.',
  },
  {
    q: 'What does "Net Position" mean on the Dashboard?',
    a: 'It is Deposits Total minus Expenses Total. A positive number means more money came in than went out. It is a rough indicator — it does not account for sales revenue that hasn\'t been deposited yet.',
  },
  {
    q: 'How do I add a general product like a pen or lamination?',
    a: 'In Services Manager, when you create or edit a service, choose "No printer (general product / service)" from the Printer dropdown. That service will appear under "General Products & Services" on the tally board.',
  },
  {
    q: 'Can I recover a cancelled sale?',
    a: 'No — once a sale is cancelled (the × button on the live feed) it is removed from both today\'s tally and the permanent history. Use the Undo Last button immediately after a mis-tap instead.',
  },
];

export default function HelpPage() {
  const [openSection, setOpenSection] = useState<string | null>('dashboard');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function toggle(id: string) {
    setOpenSection((prev) => (prev === id ? null : id));
  }

  function toggleFaq(i: number) {
    setOpenFaq((prev) => (prev === i ? null : i));
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center mb-4">
        <span style={{ fontSize: '1.6rem' }} className="me-2">❓</span>
        <div>
          <h4 className="mb-0 fw-bold">Help &amp; User Guide</h4>
          <small className="text-muted">Learn how to use every part of CopyShop</small>
        </div>
      </div>

      {/* Quick tip banner */}
      <div className="alert alert-info d-flex align-items-start gap-2 mb-4">
        <i className="fa fa-lightbulb mt-1"></i>
        <div>
          <strong>Quick tip:</strong> All data is saved automatically in your browser.
          No login needed. Export a backup from <strong>Settings → Export All Data</strong> to keep a copy safe.
        </div>
      </div>

      <div className="row g-4">
        {/* ── Module Guide ─────────────────────────────────────────────── */}
        <div className="col-12 col-lg-7">
          <h5 className="fw-bold mb-3">
            <i className="fa fa-book-open me-2 text-primary"></i>Module Guide
          </h5>
          <div className="accordion" id="moduleAccordion">
            {SECTIONS.map((s) => (
              <div className="accordion-item border mb-2 rounded overflow-hidden" key={s.id}>
                <h2 className="accordion-header">
                  <button
                    className={`accordion-button fw-semibold ${openSection === s.id ? '' : 'collapsed'}`}
                    type="button"
                    onClick={() => toggle(s.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="me-2" style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                    {s.title}
                  </button>
                </h2>
                {openSection === s.id && (
                  <div className="accordion-body">
                    {s.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">

          {/* FAQ */}
          <div>
            <h5 className="fw-bold mb-3">
              <i className="fa fa-circle-question me-2 text-warning"></i>Frequently Asked Questions
            </h5>
            <div className="accordion">
              {FAQ.map((item, i) => (
                <div className="accordion-item border mb-2 rounded overflow-hidden" key={i}>
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button fw-semibold ${openFaq === i ? '' : 'collapsed'}`}
                      type="button"
                      onClick={() => toggleFaq(i)}
                      style={{ cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      {item.q}
                    </button>
                  </h2>
                  {openFaq === i && (
                    <div className="accordion-body text-muted" style={{ fontSize: '0.9rem' }}>
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-success text-white d-flex align-items-center gap-2">
              <i className="fa fa-bolt"></i>
              <strong>Tips &amp; Tricks</strong>
            </div>
            <ul className="list-group list-group-flush">
              {[
                'Tap the service button, not the price label — either works, both register the same sale.',
                'Use the badge colours in Services Manager to quickly spot different service types at a glance.',
                'Keep inactive services deactivated rather than deleting them — history still references their names.',
                'The Transactions date range filter uses "from midnight" on the start date and "end of day" on the end date.',
                'Low-stock badge on the sidebar updates live — restock any item above its minimum to clear the count.',
                'Export a backup weekly so you never lose your history if you clear the browser.',
              ].map((tip, i) => (
                <li key={i} className="list-group-item d-flex align-items-start gap-2" style={{ fontSize: '0.88rem' }}>
                  <span className="text-success fw-bold mt-1">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-dark text-white d-flex align-items-center gap-2">
              <i className="fa fa-circle-info"></i>
              <strong>About CopyShop</strong>
            </div>
            <div className="card-body text-muted" style={{ fontSize: '0.9rem' }}>
              <p className="mb-2">
                CopyShop is a lightweight, offline-first point-of-sale and business management app
                built for small copy/print shops in Botswana.
              </p>
              <p className="mb-0">
                Built with <strong>Next.js 16</strong>, <strong>Bootstrap 5</strong>, and <strong>Chart.js</strong>.
                All data lives in your browser — no cloud, no subscriptions, no data sharing.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
