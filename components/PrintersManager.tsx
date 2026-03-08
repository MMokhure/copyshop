'use client';

import { useState } from 'react';
import { useSales } from '@/lib/SalesContext';
import { Printer, PrinterStatus, PrinterType } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────
const PRINTER_TYPES: { value: PrinterType; label: string }[] = [
  { value: 'laser',      label: 'Laser' },
  { value: 'inkjet',     label: 'Inkjet' },
  { value: 'dye-sub',   label: 'Dye-Sub' },
  { value: 'dot-matrix', label: 'Dot Matrix' },
  { value: 'other',      label: 'Other' },
];

const CAPABILITY_OPTIONS = ['A4', 'A3', 'A5', 'B&W', 'Color', 'Photo', 'Duplex', 'Staple', 'Scan', 'Fax'];

const STATUS_CONFIG: Record<PrinterStatus, { label: string; badge: string; icon: string }> = {
  online:      { label: 'Online',      badge: 'bg-success',  icon: 'fas fa-circle' },
  offline:     { label: 'Offline',     badge: 'bg-secondary', icon: 'fas fa-circle' },
  maintenance: { label: 'Maintenance', badge: 'bg-warning text-dark', icon: 'fas fa-wrench' },
};

// ── Form state ────────────────────────────────────────────────────────────────
interface FormState {
  name: string;
  model: string;
  type: PrinterType;
  capabilities: string[];
  status: PrinterStatus;
  location: string;
  paperRemaining: string;
  tonerLevel: string;
  tonerCost: string;
  expectedPaperYield: string;
  totalPrints: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  model: '',
  type: 'laser',
  capabilities: ['A4', 'B&W'],
  status: 'online',
  location: '',
  paperRemaining: '500',
  tonerLevel: '100',
  tonerCost: '',
  expectedPaperYield: '',
  totalPrints: '0',
  notes: '',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function PrintersManager() {
  const {
    printers, addPrinter, updatePrinter, deletePrinter,
    services, todayEntries,
  } = useSales();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // ── Derived stats per printer ─────────────────────────────────────────────
  function statsFor(printerName: string) {
    const todaySales = todayEntries.filter((e) => e.printer === printerName);
    const revenue = todaySales.reduce((s, e) => s + e.price, 0);
    const linked = services.filter((s) => s.printer === printerName);
    return { count: todaySales.length, revenue, linked };
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  const displayed = printers.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.model.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
  );

  // ── Form helpers ──────────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(p: Printer) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      model: p.model,
      type: p.type,
      capabilities: [...p.capabilities],
      status: p.status,
      location: p.location,
      paperRemaining: String(p.paperRemaining),
      tonerLevel: String(p.tonerLevel),
      tonerCost: p.tonerCost ? String(p.tonerCost) : '',
      expectedPaperYield: p.expectedPaperYield ? String(p.expectedPaperYield) : '',
      totalPrints: String(p.totalPrints),
      notes: p.notes,
    });
    setErrors({});
    setShowModal(true);
  }

  function toggleCap(cap: string) {
    setForm((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter((c) => c !== cap)
        : [...prev.capabilities, cap],
    }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Display name is required.';
    if (!form.model.trim()) e.model = 'Model is required.';
    const paper = parseInt(form.paperRemaining);
    if (isNaN(paper) || paper < 0) e.paperRemaining = 'Enter a valid number.';
    const toner = parseInt(form.tonerLevel);
    if (isNaN(toner) || toner < 0 || toner > 100) e.tonerLevel = 'Enter 0–100.';
    if (form.tonerCost !== '' && (isNaN(parseFloat(form.tonerCost)) || parseFloat(form.tonerCost) < 0)) e.tonerCost = 'Enter a valid cost.';
    if (form.expectedPaperYield !== '' && (isNaN(parseInt(form.expectedPaperYield)) || parseInt(form.expectedPaperYield) < 0)) e.expectedPaperYield = 'Enter a valid number.';
    if (form.capabilities.length === 0) e.capabilities = 'Select at least one capability.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      model: form.model.trim(),
      type: form.type,
      capabilities: form.capabilities,
      status: form.status,
      location: form.location.trim(),
      paperRemaining: parseInt(form.paperRemaining) || 0,
      tonerLevel: Math.min(100, Math.max(0, parseInt(form.tonerLevel) || 0)),
      tonerCost: form.tonerCost !== '' ? parseFloat(form.tonerCost) : 0,
      expectedPaperYield: form.expectedPaperYield !== '' ? parseInt(form.expectedPaperYield) : 0,
      totalPrints: parseInt(form.totalPrints) || 0,
      notes: form.notes.trim(),
    };
    if (editingId) {
      updatePrinter(editingId, payload);
    } else {
      addPrinter(payload);
    }
    setShowModal(false);
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setShowModal(false);
  }

  // ── Summary KPIs ──────────────────────────────────────────────────────────
  const online = printers.filter((p) => p.status === 'online').length;
  const maintenance = printers.filter((p) => p.status === 'maintenance').length;
  const offline = printers.filter((p) => p.status === 'offline').length;


  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h4 className="fw-semibold text-dark mb-0">
            <i className="fas fa-print text-primary me-2"></i>Printers
          </h4>
          <p className="text-secondary small mb-0">
            Manage machines, monitor status and view per-printer performance
          </p>
        </div>
        <button className="btn btn-primary rounded-pill px-4" onClick={openAdd}>
          <i className="fas fa-plus me-2"></i>Add Printer
        </button>
      </div>

      {/* KPI row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-3">
          <div className="card border-top-blue shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Total Printers</p>
              <h3 className="fw-bold mb-0">{printers.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          <div className="card border-top-green shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Online</p>
              <h3 className="fw-bold mb-0">{online}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          <div className="card border-top-red shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Offline</p>
              <h3 className="fw-bold mb-0">{offline}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          <div className="card border-top-purple shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Maintenance</p>
              <h3 className="fw-bold mb-0">{maintenance}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-3 d-flex gap-2 align-items-center flex-wrap">
        <div className="input-group input-group-sm" style={{ maxWidth: 300 }}>
          <span className="input-group-text bg-transparent"><i className="fas fa-search text-secondary"></i></span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Search by name, model or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-secondary small ms-auto">
          {displayed.length} printer{displayed.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Printer cards grid */}
      {displayed.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5 text-secondary">
            <i className="fas fa-print fa-3x mb-3 d-block opacity-25"></i>
            {printers.length === 0
              ? 'No printers added yet. Click Add Printer to get started.'
              : 'No printers match your search.'}
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {displayed.map((printer) => {
            const cfg = STATUS_CONFIG[printer.status];
            const stats = statsFor(printer.name);
            const tonerColor =
              printer.tonerLevel > 50 ? 'bg-success' :
              printer.tonerLevel > 20 ? 'bg-warning' : 'bg-danger';
            const paperColor =
              printer.paperRemaining > 200 ? 'bg-success' :
              printer.paperRemaining > 50  ? 'bg-warning' : 'bg-danger';

            return (
              <div key={printer.id} className="col-md-6 col-xl-4">
                <div className="card shadow-sm h-100">
                  {/* Card header */}
                  <div className="card-header bg-white border-0 pt-3 pb-0">
                    <div className="d-flex align-items-start justify-content-between gap-2">
                      <div className="overflow-hidden">
                        <h6 className="fw-bold mb-0 text-truncate">{printer.name}</h6>
                        <p className="text-secondary small mb-0 text-truncate">{printer.model}</p>
                      </div>
                      <span className={`badge ${cfg.badge} flex-shrink-0`}>
                        <i className={`${cfg.icon} me-1`} style={{ fontSize: '0.6rem' }}></i>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  <div className="card-body pt-2 pb-2">
                    {/* Meta row */}
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
                        <i className="fas fa-layer-group me-1 text-secondary"></i>
                        {PRINTER_TYPES.find((t) => t.value === printer.type)?.label ?? printer.type}
                      </span>
                      {printer.location && (
                        <span className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
                          <i className="fas fa-map-marker-alt me-1 text-secondary"></i>
                          {printer.location}
                        </span>
                      )}
                      {printer.capabilities.slice(0, 3).map((cap) => (
                        <span key={cap} className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.65rem' }}>
                          {cap}
                        </span>
                      ))}
                      {printer.capabilities.length > 3 && (
                        <span className="badge bg-light text-secondary" style={{ fontSize: '0.65rem' }}>
                          +{printer.capabilities.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Toner level */}
                    <div className="mb-2">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-secondary">
                          <i className="fas fa-ink-bottle me-1"></i>Toner / Ink
                          {printer.tonerCost > 0 && (
                            <span className="ms-1 text-muted">
                              (P{printer.tonerCost.toFixed(2)}
                              {printer.expectedPaperYield > 0 && ` · ${printer.expectedPaperYield.toLocaleString()} pg`}
                              )
                            </span>
                          )}
                        </span>
                        <span className="fw-medium">{printer.tonerLevel}%</span>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div
                          className={`progress-bar ${tonerColor}`}
                          style={{ width: `${printer.tonerLevel}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Paper remaining */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-secondary">
                          <i className="fas fa-layer-group me-1"></i>Paper
                        </span>
                        <span className="fw-medium">{printer.paperRemaining} sheets</span>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div
                          className={`progress-bar ${paperColor}`}
                          style={{ width: `${Math.min(100, (printer.paperRemaining / 1000) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Today's stats */}
                    <div className="row g-2 mb-2">
                      <div className="col-4 text-center">
                        <p className="mb-0 fw-bold">{printer.totalPrints.toLocaleString()}</p>
                        <p className="text-secondary mb-0" style={{ fontSize: '0.68rem' }}>All-time</p>
                      </div>
                      <div className="col-4 text-center border-start border-end">
                        <p className="mb-0 fw-bold text-primary">{stats.count}</p>
                        <p className="text-secondary mb-0" style={{ fontSize: '0.68rem' }}>Today prints</p>
                      </div>
                      <div className="col-4 text-center">
                        <p className="mb-0 fw-bold text-success">P{stats.revenue.toFixed(2)}</p>
                        <p className="text-secondary mb-0" style={{ fontSize: '0.68rem' }}>Today rev.</p>
                      </div>
                    </div>

                    {/* Services linked */}
                    <p className="text-secondary small mb-0">
                      <i className="fas fa-link me-1"></i>
                      {stats.linked.length} service{stats.linked.length !== 1 ? 's' : ''} linked
                      {stats.linked.length > 0 && (
                        <span className="ms-1 text-muted">
                          ({stats.linked.map((s) => s.name).join(', ')})
                        </span>
                      )}
                    </p>

                    {printer.notes && (
                      <p className="text-warning small mt-1 mb-0">
                        <i className="fas fa-exclamation-triangle me-1"></i>{printer.notes}
                      </p>
                    )}
                  </div>

                  {/* Card footer actions */}
                  <div className="card-footer bg-white border-top d-flex gap-2 py-2">
                    {/* Status quick-toggle */}
                    <select
                      className="form-select form-select-sm rounded-pill flex-grow-1"
                      value={printer.status}
                      onChange={(e) =>
                        updatePrinter(printer.id, { status: e.target.value as PrinterStatus })
                      }
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openEdit(printer)}
                      title="Edit"
                    >
                      <i className="fas fa-pen"></i>
                    </button>
                    {deleteConfirmId === printer.id ? (
                      <>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => { deletePrinter(printer.id); setDeleteConfirmId(null); }}
                        >
                          Confirm
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setDeleteConfirmId(printer.id)}
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
          onClick={handleBackdrop}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
            <div className="modal-content shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-semibold">
                  <i className={`fas ${editingId ? 'fa-pen' : 'fa-plus-circle'} text-primary me-2`}></i>
                  {editingId ? 'Edit Printer' : 'Add New Printer'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <div className="modal-body pt-3">
                <div className="row g-3">
                  {/* Display name */}
                  <div className="col-sm-6">
                    <label className="form-label fw-medium small">
                      Display Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control${errors.name ? ' is-invalid' : ''}`}
                      placeholder="e.g. Canon IR-ADV"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      autoFocus
                    />
                    <div className="form-text">Used to link services to this printer.</div>
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  {/* Model */}
                  <div className="col-sm-6">
                    <label className="form-label fw-medium small">
                      Model / Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control${errors.model ? ' is-invalid' : ''}`}
                      placeholder="e.g. Canon imageRUNNER ADVANCE C3530i"
                      value={form.model}
                      onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                    />
                    {errors.model && <div className="invalid-feedback">{errors.model}</div>}
                  </div>

                  {/* Type */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">Type</label>
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as PrinterType }))}
                    >
                      {PRINTER_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">Status</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as PrinterStatus }))}
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Front desk"
                      value={form.location}
                      onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    />
                  </div>

                  {/* Capabilities */}
                  <div className="col-12">
                    <label className="form-label fw-medium small">
                      Capabilities <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex flex-wrap gap-2">
                      {CAPABILITY_OPTIONS.map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => toggleCap(cap)}
                          className={`btn btn-sm rounded-pill ${
                            form.capabilities.includes(cap)
                              ? 'btn-primary'
                              : 'btn-outline-secondary'
                          }`}
                        >
                          {cap}
                        </button>
                      ))}
                    </div>
                    {errors.capabilities && (
                      <div className="text-danger small mt-1">{errors.capabilities}</div>
                    )}
                  </div>

                  {/* Toner */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">Toner / Ink Level (%)</label>
                    <input
                      type="number"
                      min={0} max={100}
                      className={`form-control${errors.tonerLevel ? ' is-invalid' : ''}`}
                      value={form.tonerLevel}
                      onChange={(e) => setForm((p) => ({ ...p, tonerLevel: e.target.value }))}
                    />
                    {errors.tonerLevel && <div className="invalid-feedback">{errors.tonerLevel}</div>}
                  </div>

                  {/* Toner Cost */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">Cost of Toner / Ink</label>
                    <div className="input-group">
                      <span className="input-group-text">P</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className={`form-control${errors.tonerCost ? ' is-invalid' : ''}`}
                        placeholder="e.g. 75.00"
                        value={form.tonerCost}
                        onChange={(e) => setForm((p) => ({ ...p, tonerCost: e.target.value }))}
                      />
                      {errors.tonerCost && <div className="invalid-feedback">{errors.tonerCost}</div>}
                    </div>
                    <div className="form-text">Replacement cartridge cost.</div>
                  </div>

                  {/* Expected Paper Yield */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">Expected Papers to Print</label>
                    <input
                      type="number"
                      min={0}
                      className={`form-control${errors.expectedPaperYield ? ' is-invalid' : ''}`}
                      placeholder="e.g. 10000"
                      value={form.expectedPaperYield}
                      onChange={(e) => setForm((p) => ({ ...p, expectedPaperYield: e.target.value }))}
                    />
                    {errors.expectedPaperYield && <div className="invalid-feedback">{errors.expectedPaperYield}</div>}
                    <div className="form-text">Pages rated per toner cartridge.</div>
                  </div>

                  {/* Paper */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">Paper Remaining (sheets)</label>
                    <input
                      type="number"
                      min={0}
                      className={`form-control${errors.paperRemaining ? ' is-invalid' : ''}`}
                      value={form.paperRemaining}
                      onChange={(e) => setForm((p) => ({ ...p, paperRemaining: e.target.value }))}
                    />
                    {errors.paperRemaining && <div className="invalid-feedback">{errors.paperRemaining}</div>}
                  </div>

                  {/* Total prints */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">Lifetime Print Count</label>
                    <input
                      type="number"
                      min={0}
                      className="form-control"
                      value={form.totalPrints}
                      onChange={(e) => setForm((p) => ({ ...p, totalPrints: e.target.value }))}
                    />
                  </div>

                  {/* Notes */}
                  <div className="col-12">
                    <label className="form-label fw-medium small">Notes / Alerts</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g. Toner low – order replacement"
                      value={form.notes}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary rounded-pill px-4" onClick={handleSubmit}>
                  <i className={`fas ${editingId ? 'fa-save' : 'fa-plus'} me-2`}></i>
                  {editingId ? 'Save Changes' : 'Add Printer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
