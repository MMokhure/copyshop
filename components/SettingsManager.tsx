'use client';

import { useState, useEffect } from 'react';
import { useSales } from '../lib/SalesContext';

const APP_VERSION = '1.0.0';

export default function SettingsManager() {
  const { settings, updateSettings, expenses, deposits, accounts, inventory, printers, services, salesHistory, investments, users } = useSales();

  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Keep form in sync if settings change externally
  useEffect(() => { setForm({ ...settings }); }, [settings]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      version: APP_VERSION,
      settings,
      accounts,
      deposits,
      expenses,
      inventory,
      printers,
      services,
      salesHistory,
      investments,
      users: users.map((u) => ({ ...u, pin: '****' })), // redact PINs for safety
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copyshop-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearAllData() {
    const keys = ['cs_accounts', 'cs_deposits', 'cs_expenses', 'cs_inventory', 'cs_investments',
      'cs_printers', 'cs_services', 'cs_sales_history', 'cs_settings', 'cs_users', 'cs_current_user_id'];
    Object.keys(localStorage).forEach((k) => { if (k.startsWith('cs_tally_')) localStorage.removeItem(k); });
    keys.forEach((k) => localStorage.removeItem(k));
    setClearConfirm(false);
    window.location.reload();
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = evt.target?.result as string;
        const data = JSON.parse(raw);
        // Validate it looks like a CopyShop backup
        if (!data.exportedAt || !data.settings) {
          setImportStatus({ type: 'error', msg: 'Invalid backup file. Please select a CopyShop JSON backup.' });
          return;
        }
        const keyMap: Record<string, string> = {
          accounts: 'cs_accounts', deposits: 'cs_deposits', expenses: 'cs_expenses',
          inventory: 'cs_inventory', printers: 'cs_printers', services: 'cs_services',
          salesHistory: 'cs_sales_history', settings: 'cs_settings',
          investments: 'cs_investments',
        };
        const imported: string[] = [];
        Object.entries(keyMap).forEach(([field, lsKey]) => {
          if (data[field] !== undefined) {
            localStorage.setItem(lsKey, JSON.stringify(data[field]));
            imported.push(field);
          }
        });
        setImportStatus({ type: 'success', msg: `Imported: ${imported.join(', ')}. Reloading…` });
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        setImportStatus({ type: 'error', msg: 'Could not parse file. Make sure it is a valid JSON backup.' });
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be picked again if needed
    e.target.value = '';
  }

  const storageStats = [
    { label: 'Sales history',    count: salesHistory.length },
    { label: 'Deposits',         count: deposits.length },
    { label: 'Expenses',         count: expenses.length },
    { label: 'Investments',      count: investments.length },
    { label: 'Services',         count: services.length },
    { label: 'Printers',         count: printers.length },
    { label: 'Inventory items',  count: inventory.length },
    { label: 'Accounts',         count: accounts.length },
    { label: 'User accounts',    count: users.length },
  ];

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center mb-4">
        <span style={{ fontSize: '1.6rem' }} className="me-2">⚙️</span>
        <div>
          <h4 className="mb-0 fw-bold">Settings</h4>
          <small className="text-muted">Manage your shop profile and data</small>
        </div>
      </div>

      <div className="row g-4">
        {/* ── Shop Profile ─────────────────────────────────────────────── */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white d-flex align-items-center gap-2">
              <i className="fa fa-store"></i>
              <strong>Shop Profile</strong>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Business Name</label>
                  <input
                    type="text"
                    name="shopName"
                    className="form-control"
                    value={form.shopName}
                    onChange={handleChange}
                    placeholder="e.g. CopyShop Gaborone"
                    maxLength={80}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Phone Number</label>
                  <input
                    type="tel"
                    name="shopPhone"
                    className="form-control"
                    value={form.shopPhone}
                    onChange={handleChange}
                    placeholder="e.g. +267 7123 4567"
                    maxLength={30}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email Address</label>
                  <input
                    type="email"
                    name="shopEmail"
                    className="form-control"
                    value={form.shopEmail}
                    onChange={handleChange}
                    placeholder="e.g. info@copyshop.co.bw"
                    maxLength={80}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Address</label>
                  <input
                    type="text"
                    name="shopAddress"
                    className="form-control"
                    value={form.shopAddress}
                    onChange={handleChange}
                    placeholder="e.g. Plot 123, Main Mall, Gaborone"
                    maxLength={120}
                  />
                </div>
                <div className="row g-3 mb-4">
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">Currency Symbol</label>
                    <select name="currency" className="form-select" value={form.currency} onChange={handleChange}>
                      <option value="P">P — Botswana Pula</option>
                      <option value="R">R — South African Rand</option>
                      <option value="$">$ — US Dollar</option>
                      <option value="€">€ — Euro</option>
                      <option value="£">£ — British Pound</option>
                    </select>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">Timezone</label>
                    <select name="timezone" className="form-select" value={form.timezone} onChange={handleChange}>
                      <option value="Africa/Gaborone">Africa/Gaborone (CAT +2)</option>
                      <option value="Africa/Johannesburg">Africa/Johannesburg (SAST +2)</option>
                      <option value="Africa/Nairobi">Africa/Nairobi (EAT +3)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary px-4">
                  <i className="fa fa-save me-2"></i>Save Changes
                </button>
                {saved && (
                  <span className="ms-3 text-success fw-semibold">
                    <i className="fa fa-check-circle me-1"></i>Saved!
                  </span>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">

          {/* Data stats */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-info text-white d-flex align-items-center gap-2">
              <i className="fa fa-database"></i>
              <strong>Data Summary</strong>
            </div>
            <ul className="list-group list-group-flush">
              {storageStats.map((s) => (
                <li key={s.label} className="list-group-item d-flex justify-content-between align-items-center">
                  <span className="text-muted">{s.label}</span>
                  <span className="badge bg-secondary rounded-pill">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Data management */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-secondary text-white d-flex align-items-center gap-2">
              <i className="fa fa-cog"></i>
              <strong>Data Management</strong>
            </div>
            <div className="card-body d-flex flex-column gap-3">
              <div>
                <p className="mb-1 fw-semibold">Export Backup</p>
                <p className="text-muted small mb-2">Download all your shop data as a JSON file for safekeeping.</p>
                <button className="btn btn-outline-primary btn-sm" onClick={exportData}>
                  <i className="fa fa-download me-2"></i>Export All Data
                </button>
              </div>
              <hr className="my-1" />
              <div>
                <p className="mb-1 fw-semibold">Import / Restore Backup</p>
                <p className="text-muted small mb-2">Restore data from a previously exported CopyShop JSON backup. Existing data will be overwritten.</p>
                {importStatus && (
                  <div className={`alert alert-${importStatus.type === 'success' ? 'success' : 'danger'} py-2 small mb-2`}>
                    <i className={`fas ${importStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-1`}></i>
                    {importStatus.msg}
                  </div>
                )}
                <label className="btn btn-outline-success btn-sm mb-0" style={{ cursor: 'pointer' }}>
                  <i className="fa fa-upload me-2"></i>Import Backup File
                  <input type="file" accept=".json" className="d-none" onChange={importData} />
                </label>
              </div>
              <hr className="my-1" />
              <div>
                <p className="mb-1 fw-semibold text-danger">Clear All Data</p>
                <p className="text-muted small mb-2">Permanently removes all records from this device. Cannot be undone.</p>
                {!clearConfirm ? (
                  <button className="btn btn-outline-danger btn-sm" onClick={() => setClearConfirm(true)}>
                    <i className="fa fa-trash me-2"></i>Clear All Data
                  </button>
                ) : (
                  <div className="alert alert-danger py-2 mb-0">
                    <p className="fw-semibold mb-2">⚠️ Are you absolutely sure? This cannot be undone.</p>
                    <div className="d-flex gap-2">
                      <button className="btn btn-danger btn-sm" onClick={clearAllData}>Yes, delete everything</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setClearConfirm(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* App info */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-dark text-white d-flex align-items-center gap-2">
              <i className="fa fa-info-circle"></i>
              <strong>About</strong>
            </div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between">
                <span className="text-muted">App Version</span>
                <span className="fw-semibold">{APP_VERSION}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span className="text-muted">Framework</span>
                <span className="fw-semibold">Next.js 16 + React</span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span className="text-muted">Storage</span>
                <span className="fw-semibold">Browser localStorage</span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span className="text-muted">Currency</span>
                <span className="fw-semibold">{settings.currency} (Pula)</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
