'use client';

import { useState, useMemo } from 'react';
import { useSales } from '../lib/SalesContext';
import { Investment, InvestmentType } from '../lib/types';

const TYPE_META: Record<InvestmentType, { label: string; icon: string; color: string }> = {
  cash:      { label: 'Cash',      icon: 'fas fa-money-bill-wave', color: 'bg-success' },
  equipment: { label: 'Equipment', icon: 'fas fa-tools',           color: 'bg-primary' },
  material:  { label: 'Material',  icon: 'fas fa-box-open',        color: 'bg-warning text-dark' },
  property:  { label: 'Property',  icon: 'fas fa-building',        color: 'bg-info' },
  vehicle:   { label: 'Vehicle',   icon: 'fas fa-truck',           color: 'bg-secondary' },
  other:     { label: 'Other',     icon: 'fas fa-circle-dot',      color: 'bg-dark' },
};

interface FormState {
  type:      InvestmentType;
  name:      string;
  investor:  string;
  value:     string;
  quantity:  string;
  unit:      string;
  date:      string;
  reference: string;
  notes:     string;
}

const BLANK: FormState = {
  type: 'cash', name: '', investor: '', value: '', quantity: '1',
  unit: '', date: new Date().toISOString().slice(0, 10), reference: '', notes: '',
};

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function InvestmentsManager() {
  const { investments, addInvestment, updateInvestment, deleteInvestment, investmentsTotal } = useSales();

  const [showModal,   setShowModal]   = useState(false);
  const [editing,     setEditing]     = useState<Investment | null>(null);
  const [form,        setForm]        = useState<FormState>(BLANK);
  const [errors,      setErrors]      = useState<Partial<Record<keyof FormState, string>>>({});
  const [deleteTarget,setDeleteTarget]= useState<Investment | null>(null);
  const [filterType,  setFilterType]  = useState<InvestmentType | ''>('');
  const [search,      setSearch]      = useState('');

  // ── Breakdowns ────────────────────────────────────────────────────────────
  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    investments.forEach((i) => {
      map[i.type] = (map[i.type] || 0) + i.value * i.quantity;
    });
    return map;
  }, [investments]);

  const displayed = useMemo(() => {
    let list = [...investments];
    if (filterType) list = list.filter((i) => i.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.investor.toLowerCase().includes(q) ||
        i.reference.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [investments, filterType, search]);

  const filteredTotal = useMemo(() => displayed.reduce((s, i) => s + i.value * i.quantity, 0), [displayed]);

  // ── Modal ─────────────────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null);
    setForm({ ...BLANK, date: todayStr() });
    setErrors({});
    setShowModal(true);
  }

  function openEdit(inv: Investment) {
    setEditing(inv);
    setForm({
      type: inv.type, name: inv.name, investor: inv.investor,
      value: String(inv.value), quantity: String(inv.quantity), unit: inv.unit,
      date: inv.date, reference: inv.reference, notes: inv.notes,
    });
    setErrors({});
    setShowModal(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  }

  function validate() {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.investor.trim()) errs.investor = 'Investor name is required';
    if (!form.value || isNaN(+form.value) || +form.value < 0) errs.value = 'Enter a valid amount';
    if (!form.quantity || isNaN(+form.quantity) || +form.quantity < 1) errs.quantity = 'Quantity must be at least 1';
    if (!form.date) errs.date = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      type:      form.type,
      name:      form.name.trim(),
      investor:  form.investor.trim(),
      value:     parseFloat(form.value),
      quantity:  parseInt(form.quantity),
      unit:      form.type === 'cash' ? '' : form.unit.trim(),
      date:      form.date,
      reference: form.reference.trim(),
      notes:     form.notes.trim(),
    };
    if (editing) {
      updateInvestment(editing.id, payload);
    } else {
      addInvestment(payload);
    }
    setShowModal(false);
  }

  const isCash = form.type === 'cash';

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.6rem' }}>💼</span>
          <div>
            <h4 className="mb-0 fw-bold">Investments</h4>
            <small className="text-muted">Track capital — cash, equipment, materials &amp; more</small>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="fas fa-plus me-2"></i>Record Investment
        </button>
      </div>

      {/* KPI strip */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <p className="text-muted small text-uppercase fw-semibold mb-1">Total Capital</p>
              <h4 className="fw-bold text-success">P{investmentsTotal.toFixed(2)}</h4>
              <p className="text-muted small mb-0">{investments.length} record{investments.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        {(Object.entries(byType) as [InvestmentType, number][]).map(([type, val]) => (
          <div key={type} className="col-6 col-xl-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small text-uppercase fw-semibold mb-1">
                  <i className={`${TYPE_META[type].icon} me-1`}></i>{TYPE_META[type].label}
                </p>
                <h5 className="fw-bold mb-0">P{val.toFixed(2)}</h5>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Type breakdown pills */}
      {investments.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button
            className={`btn btn-sm rounded-pill ${filterType === '' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => setFilterType('')}
          >
            All ({investments.length})
          </button>
          {(Object.entries(byType) as [InvestmentType, number][]).map(([type, val]) => {
            const count = investments.filter((i) => i.type === type).length;
            return (
              <button
                key={type}
                className={`btn btn-sm rounded-pill ${filterType === type ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilterType(filterType === type ? '' : type)}
              >
                <i className={`${TYPE_META[type].icon} me-1`}></i>
                {TYPE_META[type].label} ({count}) — P{val.toFixed(2)}
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-5">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-transparent"><i className="fas fa-search text-secondary"></i></span>
            <input type="text" className="form-control border-start-0 ps-0"
              placeholder="Search name, investor, reference…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="col-auto d-flex align-items-center gap-2">
          {(search || filterType) && (
            <button className="btn btn-sm btn-outline-secondary rounded-pill"
              onClick={() => { setSearch(''); setFilterType(''); }}>
              <i className="fas fa-times me-1"></i>Clear
            </button>
          )}
          <span className="text-muted small">{displayed.length} result{displayed.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table */}
      {investments.length === 0 ? (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-5 text-muted">
            <i className="fas fa-briefcase fa-3x mb-3 d-block opacity-25"></i>
            No investments recorded yet.
            <div className="mt-3">
              <button className="btn btn-primary rounded-pill px-4" onClick={openAdd}>
                <i className="fas fa-plus me-2"></i>Record First Investment
              </button>
            </div>
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-4 text-muted">
            No investments match the current filter.
          </div>
        </div>
      ) : (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Name / Description</th>
                  <th>Investor</th>
                  <th className="text-center">Qty</th>
                  <th className="text-end">Unit Value</th>
                  <th className="text-end">Total Value</th>
                  <th className="text-center" style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((inv) => {
                  const meta = TYPE_META[inv.type];
                  return (
                    <tr key={inv.id}>
                      <td className="text-muted small text-nowrap">
                        {new Date(inv.date + 'T12:00:00').toLocaleDateString([], {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td>
                        <span className={`badge ${meta.color}`}>
                          <i className={`${meta.icon} me-1`}></i>{meta.label}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold">{inv.name}</div>
                        {inv.reference && (
                          <div className="text-muted small">Ref: {inv.reference}</div>
                        )}
                        {inv.notes && (
                          <div className="text-muted small fst-italic text-truncate" style={{ maxWidth: 200 }}>
                            {inv.notes}
                          </div>
                        )}
                      </td>
                      <td>{inv.investor}</td>
                      <td className="text-center">
                        {inv.type === 'cash' ? '—' : `${inv.quantity}${inv.unit ? ` ${inv.unit}` : ''}`}
                      </td>
                      <td className="text-end">P{inv.value.toFixed(2)}</td>
                      <td className="text-end fw-bold text-success">
                        P{(inv.value * inv.quantity).toFixed(2)}
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <button className="btn btn-sm btn-outline-secondary" title="Edit"
                            onClick={() => openEdit(inv)}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" title="Delete"
                            onClick={() => setDeleteTarget(inv)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="table-light fw-bold">
                <tr>
                  <td colSpan={6} className="text-end">
                    {(search || filterType) ? 'Filtered Total' : 'Grand Total'}
                    <span className="text-muted ms-2 small">({displayed.length})</span>
                  </td>
                  <td className="text-end text-success">P{filteredTotal.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`fas ${editing ? 'fa-edit' : 'fa-plus'} me-2`}></i>
                  {editing ? 'Edit Investment' : 'Record Investment'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="row g-3">
                    {/* Type */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fw-semibold">
                        Investment Type <span className="text-danger">*</span>
                      </label>
                      <select name="type" className="form-select" value={form.type} onChange={handleChange}>
                        {(Object.entries(TYPE_META) as [InvestmentType, typeof TYPE_META[InvestmentType]][]).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fw-semibold">
                        Date <span className="text-danger">*</span>
                      </label>
                      <input type="date" name="date"
                        className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                        value={form.date} onChange={handleChange} />
                      {errors.date && <div className="invalid-feedback">{errors.date}</div>}
                    </div>

                    {/* Name */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Name / Description <span className="text-danger">*</span>
                      </label>
                      <input type="text" name="name" maxLength={120}
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        placeholder={isCash ? 'e.g. Initial capital injection' : 'e.g. Spiral binding coils, Canon IR-ADV printer'}
                        value={form.name} onChange={handleChange} />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>

                    {/* Investor */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fw-semibold">
                        Investor / Source <span className="text-danger">*</span>
                      </label>
                      <input type="text" name="investor" maxLength={80}
                        className={`form-control ${errors.investor ? 'is-invalid' : ''}`}
                        placeholder="e.g. Dr Mpoma, Business Partner"
                        value={form.investor} onChange={handleChange} />
                      {errors.investor && <div className="invalid-feedback">{errors.investor}</div>}
                    </div>

                    {/* Reference */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fw-semibold">Reference</label>
                      <input type="text" name="reference" maxLength={80}
                        className="form-control" placeholder="Receipt / invoice / agreement no."
                        value={form.reference} onChange={handleChange} />
                    </div>

                    {/* Unit value */}
                    <div className={`col-12 ${isCash ? '' : 'col-sm-4'}`}>
                      <label className="form-label fw-semibold">
                        {isCash ? 'Amount (P)' : 'Unit Value (P)'} <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">P</span>
                        <input type="number" name="value" min="0" step="0.01"
                          className={`form-control ${errors.value ? 'is-invalid' : ''}`}
                          placeholder="0.00"
                          value={form.value} onChange={handleChange} />
                        {errors.value && <div className="invalid-feedback">{errors.value}</div>}
                      </div>
                    </div>

                    {/* Quantity (non-cash only) */}
                    {!isCash && (
                      <>
                        <div className="col-12 col-sm-4">
                          <label className="form-label fw-semibold">
                            Quantity <span className="text-danger">*</span>
                          </label>
                          <input type="number" name="quantity" min="1"
                            className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                            value={form.quantity} onChange={handleChange} />
                          {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
                        </div>
                        <div className="col-12 col-sm-4">
                          <label className="form-label fw-semibold">Unit</label>
                          <input type="text" name="unit" maxLength={20}
                            className="form-control" placeholder="e.g. units, reams, kg"
                            value={form.unit} onChange={handleChange} />
                        </div>
                        {form.value && form.quantity && !isNaN(+form.value) && !isNaN(+form.quantity) && (
                          <div className="col-12">
                            <div className="alert alert-success py-2 mb-0">
                              <i className="fas fa-calculator me-2"></i>
                              Total value: <strong>P{(+form.value * +form.quantity).toFixed(2)}</strong>
                              ({form.quantity} × P{(+form.value).toFixed(2)})
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Notes */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">Notes</label>
                      <textarea name="notes" className="form-control" rows={2} maxLength={300}
                        placeholder="Any additional notes…"
                        value={form.notes} onChange={handleChange}></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editing ? 'Save Changes' : 'Record Investment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title text-danger">
                  <i className="fas fa-trash me-2"></i>Delete Investment
                </h5>
                <button className="btn-close" onClick={() => setDeleteTarget(null)}></button>
              </div>
              <div className="modal-body">
                Remove <strong>{deleteTarget.name}</strong>?
                <div className="text-muted small mt-1">
                  Value: P{(deleteTarget.value * deleteTarget.quantity).toFixed(2)} — this cannot be undone.
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => {
                  deleteInvestment(deleteTarget.id);
                  setDeleteTarget(null);
                }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
