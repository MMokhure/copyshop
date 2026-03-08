'use client';

import { useState } from 'react';
import { useSales } from '@/lib/SalesContext';
import { Service } from '@/lib/types';
const ICONS = ['📄', '🖨️', '📃', '🖼️', '📋', '📑', '🗒️', '🖋️', '✂️', '📦', '🗃️', '🖱️', '📝', '✍️', '💼', '🪪', '🖊️', '🗂️', '📊', '🔖', '🖇️', '📌'];
const BADGE_OPTIONS = [
  { label: 'Grey',   value: 'bg-secondary' },
  { label: 'Blue',   value: 'bg-primary' },
  { label: 'Green',  value: 'bg-success' },
  { label: 'Yellow', value: 'bg-warning text-dark' },
  { label: 'Red',    value: 'bg-danger' },
  { label: 'Purple', value: 'bg-purple' },
  { label: 'Teal',   value: 'bg-info text-dark' },
];

interface FormState {
  name: string;
  printer: string;
  customPrinter: string;
  price: string;
  icon: string;
  badgeVariant: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  printer: '',      // set dynamically from live printers list
  customPrinter: '',
  price: '',
  icon: '📄',
  badgeVariant: 'bg-secondary',
  active: true,
};

export default function ServicesManager() {
  const { services, addService, updateService, deleteService, printers } = useSales();
  const printerNames = printers.map((p) => p.name);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const displayed = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.printer.toLowerCase().includes(search.toLowerCase()) ||
      (s.printer === '' && 'general product service'.includes(search.toLowerCase()))
  );

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, printer: printerNames[0] ?? '' });
    setErrors({});
    setShowModal(true);
  }

  function openEdit(svc: Service) {
    // '' = no printer; known printer name; otherwise custom
    const isNoPrinter  = svc.printer === '';
    const isKnown      = printerNames.includes(svc.printer);
    const isCustom     = !isNoPrinter && !isKnown;
    setEditingId(svc.id);
    setForm({
      name: svc.name,
      printer: isNoPrinter ? '' : isCustom ? '__custom__' : svc.printer,
      customPrinter: isCustom ? svc.printer : '',
      price: String(svc.price),
      icon: svc.icon,
      badgeVariant: svc.badgeVariant,
      active: svc.active,
    });
    setErrors({});
    setShowModal(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Service name is required.';
    const parsedPrice = parseFloat(form.price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) e.price = 'Enter a valid price greater than 0.';
    if (form.printer === '__custom__' && !form.customPrinter.trim())
      e.customPrinter = 'Enter a printer name.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const resolvedPrinter =
      form.printer === '__custom__' ? form.customPrinter.trim() : form.printer;
    const payload = {
      name: form.name.trim(),
      printer: resolvedPrinter,
      price: parseFloat(form.price),
      icon: form.icon,
      badgeVariant: form.badgeVariant,
      active: form.active,
    };
    if (editingId) {
      updateService(editingId, payload);
    } else {
      addService(payload);
    }
    setShowModal(false);
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setShowModal(false);
  }

  const activeCount = services.filter((s) => s.active).length;
  const inactiveCount = services.length - activeCount;

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h4 className="fw-semibold text-dark mb-0">
            <i className="fas fa-tags text-primary me-2"></i>Manage Services
          </h4>
          <p className="text-secondary small mb-0">
            Define print services &amp; prices — they appear as tally buttons
          </p>
        </div>
        <button className="btn btn-primary rounded-pill px-4" onClick={openAdd}>
          <i className="fas fa-plus me-2"></i>Add Service
        </button>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="card border-top-blue shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Total Services</p>
              <h3 className="fw-bold mb-0">{services.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card border-top-green shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Active</p>
              <h3 className="fw-bold mb-0">{activeCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card border-top-red shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Inactive</p>
              <h3 className="fw-bold mb-0">{inactiveCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white border-0 pt-3 pb-2 d-flex flex-wrap gap-2 align-items-center">
          <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
            <span className="input-group-text bg-transparent border-end-0">
              <i className="fas fa-search text-secondary"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search service or printer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-secondary small ms-auto">
            {displayed.length} result{displayed.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Service</th>
                <th>Printer</th>
                <th className="text-end">Price</th>
                <th className="text-center">Badge</th>
                <th className="text-center">Active</th>
                <th className="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-secondary py-5">
                    {services.length === 0
                      ? 'No services yet — click Add Service to create your first one.'
                      : 'No services match your search.'}
                  </td>
                </tr>
              )}
              {displayed.map((svc) => (
                <tr key={svc.id}>
                  <td className="ps-3 fw-medium">
                    <span className="me-2 fs-5">{svc.icon}</span>
                    {svc.name}
                  </td>
                  <td>
                    {svc.printer === '' ? (
                      <span className="text-secondary">
                        <i className="fas fa-store text-secondary me-1"></i>
                        General / No printer
                      </span>
                    ) : (
                      <><i className="fas fa-print text-secondary me-1"></i>{svc.printer}</>
                    )}
                  </td>
                  <td className="text-end fw-bold">P{svc.price.toFixed(2)}</td>
                  <td className="text-center">
                    <span className={`badge ${svc.badgeVariant}`} style={{ fontSize: '0.7rem' }}>
                      sample
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="form-check form-switch d-flex justify-content-center mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={svc.active}
                        onChange={() => updateService(svc.id, { active: !svc.active })}
                        id={`sw-${svc.id}`}
                      />
                    </div>
                  </td>
                  <td className="text-end pe-3">
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => openEdit(svc)}
                      title="Edit"
                    >
                      <i className="fas fa-pen"></i>
                    </button>
                    {deleteConfirmId === svc.id ? (
                      <>
                        <button
                          className="btn btn-sm btn-danger me-1"
                          onClick={() => {
                            deleteService(svc.id);
                            setDeleteConfirmId(null);
                          }}
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
                        onClick={() => setDeleteConfirmId(svc.id)}
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
          onClick={handleBackdropClick}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-semibold">
                  <i
                    className={`fas ${editingId ? 'fa-pen' : 'fa-plus-circle'} text-primary me-2`}
                  ></i>
                  {editingId ? 'Edit Service' : 'Add New Service'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <div className="modal-body pt-3">
                {/* Service name */}
                <div className="mb-3">
                  <label className="form-label fw-medium small">
                    Service Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control${errors.name ? ' is-invalid' : ''}`}
                    placeholder="e.g. A4 Black &amp; White"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    autoFocus
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                {/* Printer */}
                <div className="mb-3">
                  <label className="form-label fw-medium small">Printer / Machine</label>
                  <select
                    className="form-select"
                    value={form.printer}
                    onChange={(e) => setForm((p) => ({ ...p, printer: e.target.value }))}
                  >
                    <option value="">🏪 No printer (general product / service)</option>
                    {printerNames.map((pr) => (
                      <option key={pr} value={pr}>
                        🖨️ {pr}
                      </option>
                    ))}
                    <option value="__custom__">✏️ Other (type custom name)</option>
                  </select>
                  {form.printer === '__custom__' && (
                    <input
                      type="text"
                      className={`form-control mt-2${errors.customPrinter ? ' is-invalid' : ''}`}
                      placeholder="Enter printer / machine name"
                      value={form.customPrinter}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, customPrinter: e.target.value }))
                      }
                    />
                  )}
                  {errors.customPrinter && (
                    <div className="text-danger small mt-1">{errors.customPrinter}</div>
                  )}
                </div>

                {/* Price */}
                <div className="mb-3">
                  <label className="form-label fw-medium small">
                    Price <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">P</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={`form-control${errors.price ? ' is-invalid' : ''}`}
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    />
                    {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                  </div>
                </div>

                {/* Icon picker */}
                <div className="mb-3">
                  <label className="form-label fw-medium small">Icon</label>
                  <div className="d-flex flex-wrap gap-2">
                    {ICONS.map((ico) => (
                      <button
                        key={ico}
                        type="button"
                        className={`btn btn-sm ${
                          form.icon === ico ? 'btn-primary' : 'btn-outline-secondary'
                        }`}
                        style={{ fontSize: '1.15rem', width: 42, height: 42, lineHeight: 1 }}
                        onClick={() => setForm((p) => ({ ...p, icon: ico }))}
                      >
                        {ico}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Badge colour */}
                <div className="mb-3">
                  <label className="form-label fw-medium small">Badge Colour</label>
                  <div className="d-flex flex-wrap gap-2">
                    {BADGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, badgeVariant: opt.value }))}
                        className={`badge border-0 px-3 py-2 ${opt.value}`}
                        style={{
                          cursor: 'pointer',
                          opacity: form.badgeVariant === opt.value ? 1 : 0.4,
                          outline:
                            form.badgeVariant === opt.value ? '2px solid #0d6efd' : 'none',
                          outlineOffset: 2,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active toggle */}
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="modal-active"
                    checked={form.active}
                    onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                  />
                  <label className="form-check-label small fw-medium" htmlFor="modal-active">
                    Active{' '}
                    <span className="text-secondary fw-normal">
                      (visible as a tally button)
                    </span>
                  </label>
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
                  {editingId ? 'Save Changes' : 'Add Service'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
