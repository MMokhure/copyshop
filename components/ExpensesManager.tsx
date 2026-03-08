'use client';

import { useState, useMemo } from 'react';
import { useSales } from '@/lib/SalesContext';
import { Expense, ExpenseCategory } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES: { value: ExpenseCategory; label: string; icon: string; badge: string }[] = [
  { value: 'supplies',    label: 'Supplies',    icon: 'fas fa-boxes',         badge: 'bg-primary-subtle text-primary' },
  { value: 'utilities',   label: 'Utilities',   icon: 'fas fa-bolt',          badge: 'bg-warning-subtle text-warning' },
  { value: 'maintenance', label: 'Maintenance', icon: 'fas fa-tools',         badge: 'bg-danger-subtle text-danger' },
  { value: 'rent',        label: 'Rent',        icon: 'fas fa-building',      badge: 'bg-info-subtle text-info' },
  { value: 'salaries',    label: 'Salaries',    icon: 'fas fa-user-tie',      badge: 'bg-success-subtle text-success' },
  { value: 'transport',   label: 'Transport',   icon: 'fas fa-truck',         badge: 'bg-secondary-subtle text-secondary' },
  { value: 'equipment',   label: 'Equipment',   icon: 'fas fa-desktop',       badge: 'bg-purple-subtle text-purple' },
  { value: 'other',       label: 'Other',       icon: 'fas fa-ellipsis-h',    badge: 'bg-dark-subtle text-dark' },
];

function catMeta(c: ExpenseCategory) {
  return CATEGORIES.find((x) => x.value === c) ?? CATEGORIES[7];
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── Form interface ─────────────────────────────────────────────────────────────
interface ExpenseForm {
  amount: string;
  category: ExpenseCategory;
  description: string;
  vendor: string;
  reference: string;
  notes: string;
  date: string;
}

const EMPTY_FORM: ExpenseForm = {
  amount: '',
  category: 'supplies',
  description: '',
  vendor: '',
  reference: '',
  notes: '',
  date: todayISO(),
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ExpensesManager() {
  const { expenses, addExpense, updateExpense, deleteExpense, expensesTotal } = useSales();

  const [showModal, setShowModal]             = useState(false);
  const [editingId, setEditingId]             = useState<string | null>(null);
  const [form, setForm]                       = useState<ExpenseForm>(EMPTY_FORM);
  const [errors, setErrors]                   = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filters
  const [search, setSearch]                     = useState('');
  const [filterCategory, setFilterCategory]     = useState<ExpenseCategory | 'all'>('all');
  const [filterMonth, setFilterMonth]           = useState('');

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = useMemo(
    () => expenses.filter((e) => e.date.startsWith(thisMonthKey)).reduce((s, e) => s + e.amount, 0),
    [expenses, thisMonthKey]
  );
  const todayTotal = useMemo(
    () => expenses.filter((e) => e.date === todayISO()).reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + e.amount; });
    return map;
  }, [expenses]);

  const monthOptions = useMemo(() => {
    const set = new Set(expenses.map((e) => e.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const displayed = useMemo(() => {
    let list = [...expenses];
    if (filterCategory !== 'all') list = list.filter((e) => e.category === filterCategory);
    if (filterMonth)              list = list.filter((e) => e.date.startsWith(filterMonth));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.description.toLowerCase().includes(q) ||
        e.vendor.toLowerCase().includes(q) ||
        e.reference.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [expenses, filterCategory, filterMonth, search]);

  const filteredTotal = useMemo(() => displayed.reduce((s, e) => s + e.amount, 0), [displayed]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, date: todayISO() });
    setErrors({});
    setShowModal(true);
  }

  function openEdit(exp: Expense) {
    setEditingId(exp.id);
    setForm({
      amount: String(exp.amount), category: exp.category, description: exp.description,
      vendor: exp.vendor, reference: exp.reference, notes: exp.notes, date: exp.date,
    });
    setErrors({});
    setShowModal(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) e.amount      = 'Enter a valid amount greater than 0.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.date)               e.date        = 'Date is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const payload: Omit<Expense, 'id' | 'createdAt'> = {
      amount: parseFloat(form.amount), category: form.category,
      description: form.description.trim(), vendor: form.vendor.trim(),
      reference: form.reference.trim(), notes: form.notes.trim(), date: form.date,
    };
    if (editingId) { updateExpense(editingId, payload); } else { addExpense(payload); }
    setShowModal(false);
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setShowModal(false);
  }

  // ── Top categories for the breakdown bar ──────────────────────────────────
  const categoryBreakdown = useMemo(() =>
    CATEGORIES
      .map((c) => ({ ...c, total: categoryTotals[c.value] ?? 0 }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total),
    [categoryTotals]
  );

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h4 className="fw-semibold text-dark mb-0">
            <i className="fas fa-receipt text-danger me-2"></i>Expenses
          </h4>
          <p className="text-secondary small mb-0">Track all business expenditures</p>
        </div>
        <button className="btn btn-primary rounded-pill px-4" onClick={openAdd}>
          <i className="fas fa-plus me-2"></i>New Expense
        </button>
      </div>

      {/* KPI row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="card border-top-red shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">All-time Total</p>
              <h3 className="fw-bold mb-0 text-danger">P{expensesTotal.toFixed(2)}</h3>
              <p className="text-secondary small mb-0">{expenses.length} record{expenses.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card border-top-yellow shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">This Month</p>
              <h3 className="fw-bold mb-0">P{thisMonthTotal.toFixed(2)}</h3>
              <p className="text-secondary small mb-0">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card border-top-blue shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Today</p>
              <h3 className="fw-bold mb-0">P{todayTotal.toFixed(2)}</h3>
              <p className="text-secondary small mb-0">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-body py-3">
            <p className="fw-semibold small text-secondary text-uppercase mb-2">Spending by Category</p>
            <div className="d-flex flex-wrap gap-2">
              {categoryBreakdown.map((c) => (
                <div key={c.value}
                  className="d-flex align-items-center gap-2 rounded-pill px-3 py-1 border"
                  style={{ fontSize: '0.82rem', cursor: 'pointer' }}
                  onClick={() => setFilterCategory(filterCategory === c.value ? 'all' : c.value)}
                >
                  <i className={`${c.icon} small`}></i>
                  <span className="fw-medium">{c.label}</span>
                  <span className="fw-bold text-danger">P{c.total.toFixed(2)}</span>
                  {expensesTotal > 0 && (
                    <span className="text-secondary">({Math.round((c.total / expensesTotal) * 100)}%)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card shadow-sm mb-3">
        <div className="card-body py-2 d-flex flex-wrap gap-2 align-items-center">
          <button
            className={`btn btn-sm rounded-pill px-3 ${filterCategory === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilterCategory('all')}
          >All Categories</button>
          {CATEGORIES.map((c) => (
            <button key={c.value}
              className={`btn btn-sm rounded-pill px-3 ${filterCategory === c.value ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilterCategory(c.value)}
            >
              <i className={`${c.icon} me-1`}></i>{c.label}
            </button>
          ))}
          <div className="vr mx-1 d-none d-md-block"></div>
          <select className="form-select form-select-sm rounded-pill" style={{ maxWidth: 165 }} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="input-group input-group-sm ms-auto" style={{ maxWidth: 240 }}>
            <span className="input-group-text bg-transparent"><i className="fas fa-search text-secondary"></i></span>
            <input type="text" className="form-control border-start-0 ps-0" placeholder="Search description, vendor…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="text-secondary small">{displayed.length} record{displayed.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5 text-secondary">
            <i className="fas fa-receipt fa-3x mb-3 d-block opacity-25"></i>
            {expenses.length === 0 ? 'No expenses recorded yet. Click New Expense to get started.' : 'No expenses match the current filter.'}
          </div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Vendor</th>
                  <th>Reference</th>
                  <th>Notes</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((exp) => {
                  const meta = catMeta(exp.category);
                  return (
                    <tr key={exp.id}>
                      <td className="text-nowrap fw-medium">{exp.date}</td>
                      <td>
                        <span className={`badge ${meta.badge}`} style={{ fontSize: '0.72rem' }}>
                          <i className={`${meta.icon} me-1`}></i>{meta.label}
                        </span>
                      </td>
                      <td className="fw-medium">{exp.description}</td>
                      <td className="text-secondary">{exp.vendor || '—'}</td>
                      <td className="small text-secondary">{exp.reference || '—'}</td>
                      <td className="small text-secondary" style={{ maxWidth: 180 }}>
                        <span className="text-truncate d-block" title={exp.notes}>{exp.notes || '—'}</span>
                      </td>
                      <td className="text-end fw-bold text-danger text-nowrap">P{exp.amount.toFixed(2)}</td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(exp)} title="Edit">
                            <i className="fas fa-pen"></i>
                          </button>
                          {deleteConfirmId === exp.id ? (
                            <>
                              <button className="btn btn-sm btn-danger" onClick={() => { deleteExpense(exp.id); setDeleteConfirmId(null); }}>Confirm</button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                            </>
                          ) : (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirmId(exp.id)} title="Delete">
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan={6} className="text-end fw-semibold">
                    {filterCategory !== 'all' || filterMonth || search ? 'Filtered Total' : 'Grand Total'}
                  </td>
                  <td className="text-end fw-bold text-danger">P{filteredTotal.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} onClick={handleBackdrop}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-semibold">
                  <i className={`fas ${editingId ? 'fa-pen' : 'fa-plus-circle'} text-danger me-2`}></i>
                  {editingId ? 'Edit Expense' : 'Record New Expense'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body pt-3">
                <div className="row g-3">
                  {/* Amount */}
                  <div className="col-sm-6">
                    <label className="form-label fw-medium small">Amount <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text fw-semibold">P</span>
                      <input
                        type="number" min={0} step="0.01" autoFocus
                        className={`form-control${errors.amount ? ' is-invalid' : ''}`}
                        placeholder="0.00" value={form.amount}
                        onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                      />
                      {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-sm-6">
                    <label className="form-label fw-medium small">Date <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className={`form-control${errors.date ? ' is-invalid' : ''}`}
                      value={form.date}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    />
                    {errors.date && <div className="invalid-feedback">{errors.date}</div>}
                  </div>

                  {/* Description */}
                  <div className="col-12">
                    <label className="form-label fw-medium small">Description <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control${errors.description ? ' is-invalid' : ''}`}
                      placeholder="e.g. Bought A4 paper reams, Fixed printer roller"
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    />
                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                  </div>

                  {/* Category */}
                  <div className="col-12">
                    <label className="form-label fw-medium small">Category</label>
                    <div className="d-flex flex-wrap gap-2">
                      {CATEGORIES.map((c) => (
                        <button key={c.value} type="button"
                          onClick={() => setForm((p) => ({ ...p, category: c.value }))}
                          className={`btn btn-sm rounded-pill ${form.category === c.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                        >
                          <i className={`${c.icon} me-1`}></i>{c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vendor */}
                  <div className="col-sm-6">
                    <label className="form-label fw-medium small">Vendor / Payee</label>
                    <input type="text" className="form-control" placeholder="e.g. OfficeWorld, Eskom"
                      value={form.vendor} onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))} />
                  </div>

                  {/* Reference */}
                  <div className="col-sm-6">
                    <label className="form-label fw-medium small">Reference / Invoice No.</label>
                    <input type="text" className="form-control" placeholder="e.g. INV-00456"
                      value={form.reference} onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))} />
                  </div>

                  {/* Notes */}
                  <div className="col-12">
                    <label className="form-label fw-medium small">Notes</label>
                    <textarea className="form-control" rows={2} placeholder="Optional details…"
                      value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-danger rounded-pill px-4" onClick={handleSubmit}>
                  <i className={`fas ${editingId ? 'fa-save' : 'fa-plus'} me-2`}></i>
                  {editingId ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
