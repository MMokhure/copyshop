'use client';

import { useState, useMemo } from 'react';
import { useSales } from '@/lib/SalesContext';
import { Deposit, DepositMethod, CopyShopAccount, AccountType } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────
const METHODS: { value: DepositMethod; label: string; icon: string; badge: string }[] = [
  { value: 'cash',          label: 'Cash',          icon: 'fas fa-money-bill-wave', badge: 'bg-success-subtle text-success' },
  { value: 'bank_transfer', label: 'Bank Transfer',  icon: 'fas fa-university',      badge: 'bg-primary-subtle text-primary' },
  { value: 'mobile_money',  label: 'Mobile Money',  icon: 'fas fa-mobile-alt',      badge: 'bg-warning-subtle text-warning' },
  { value: 'card',          label: 'Card',          icon: 'fas fa-credit-card',     badge: 'bg-info-subtle text-info' },
  { value: 'cheque',        label: 'Cheque',        icon: 'fas fa-file-invoice',    badge: 'bg-secondary-subtle text-secondary' },
  { value: 'other',         label: 'Other',         icon: 'fas fa-coins',           badge: 'bg-dark-subtle text-dark' },
];

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'bank',         label: 'Bank Account',  icon: 'fas fa-university' },
  { value: 'cash_box',     label: 'Cash Box',      icon: 'fas fa-box-open' },
  { value: 'mobile_money', label: 'Mobile Money',  icon: 'fas fa-mobile-alt' },
  { value: 'other',        label: 'Other',         icon: 'fas fa-wallet' },
];

function methodMeta(m: DepositMethod) {
  return METHODS.find((x) => x.value === m) ?? METHODS[5];
}

function accountTypeMeta(t: AccountType) {
  return ACCOUNT_TYPES.find((x) => x.value === t) ?? ACCOUNT_TYPES[3];
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── Deposit form ──────────────────────────────────────────────────────────────
interface DepositForm {
  amount: string;
  method: DepositMethod;
  accountId: string;
  paidBy: string;
  reference: string;
  notes: string;
  date: string;
}

const EMPTY_DEPOSIT_FORM: DepositForm = {
  amount: '',
  method: 'cash',
  accountId: '',
  paidBy: '',
  reference: '',
  notes: '',
  date: todayISO(),
};

// ── Account form ──────────────────────────────────────────────────────────────
interface AccountForm {
  name: string;
  type: AccountType;
  bankName: string;
  accountNumber: string;
  notes: string;
  isActive: boolean;
}

const EMPTY_ACCOUNT_FORM: AccountForm = {
  name: '',
  type: 'bank',
  bankName: '',
  accountNumber: '',
  notes: '',
  isActive: true,
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function DepositsManager() {
  const {
    deposits, addDeposit, updateDeposit, deleteDeposit, depositsTotal,
    accounts, addAccount, updateAccount, deleteAccount,
  } = useSales();

  // Deposit state
  const [showModal, setShowModal]               = useState(false);
  const [editingId, setEditingId]               = useState<string | null>(null);
  const [form, setForm]                         = useState<DepositForm>(EMPTY_DEPOSIT_FORM);
  const [errors, setErrors]                     = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId]   = useState<string | null>(null);

  // Account management state
  const [showAccounts, setShowAccounts]               = useState(false);
  const [showAccountModal, setShowAccountModal]       = useState(false);
  const [editingAccId, setEditingAccId]               = useState<string | null>(null);
  const [accForm, setAccForm]                         = useState<AccountForm>(EMPTY_ACCOUNT_FORM);
  const [accErrors, setAccErrors]                     = useState<Record<string, string>>({});
  const [deleteAccConfirmId, setDeleteAccConfirmId]   = useState<string | null>(null);

  // Filters
  const [search, setSearch]               = useState('');
  const [filterMethod, setFilterMethod]   = useState<DepositMethod | 'all'>('all');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterMonth, setFilterMonth]     = useState('');

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = useMemo(
    () => deposits.filter((d) => d.date.startsWith(thisMonthKey)).reduce((s, d) => s + d.amount, 0),
    [deposits, thisMonthKey]
  );
  const todayTotal = useMemo(
    () => deposits.filter((d) => d.date === todayISO()).reduce((s, d) => s + d.amount, 0),
    [deposits]
  );

  const accountTotals = useMemo(() => {
    const map: Record<string, number> = {};
    deposits.forEach((d) => { map[d.accountId] = (map[d.accountId] ?? 0) + d.amount; });
    return map;
  }, [deposits]);

  const monthOptions = useMemo(() => {
    const set = new Set(deposits.map((d) => d.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [deposits]);

  const displayed = useMemo(() => {
    let list = [...deposits];
    if (filterMethod !== 'all') list = list.filter((d) => d.method === filterMethod);
    if (filterAccount)          list = list.filter((d) => d.accountId === filterAccount);
    if (filterMonth)            list = list.filter((d) => d.date.startsWith(filterMonth));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.paidBy.toLowerCase().includes(q) ||
        d.reference.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [deposits, filterMethod, filterAccount, filterMonth, search]);

  const filteredTotal = useMemo(() => displayed.reduce((s, d) => s + d.amount, 0), [displayed]);

  // ── Deposit helpers ───────────────────────────────────────────────────────
  const defaultAccountId = accounts.find((a) => a.isActive)?.id ?? '';

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_DEPOSIT_FORM, date: todayISO(), accountId: defaultAccountId });
    setErrors({});
    setShowModal(true);
  }

  function openEdit(dep: Deposit) {
    setEditingId(dep.id);
    setForm({
      amount: String(dep.amount), method: dep.method, accountId: dep.accountId,
      paidBy: dep.paidBy, reference: dep.reference, notes: dep.notes, date: dep.date,
    });
    setErrors({});
    setShowModal(true);
  }

  function validateDeposit() {
    const e: Record<string, string> = {};
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) e.amount    = 'Enter a valid amount greater than 0.';
    if (!form.date)              e.date      = 'Date is required.';
    if (!form.accountId)         e.accountId = 'Select an account.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validateDeposit()) return;
    const payload: Omit<Deposit, 'id' | 'createdAt'> = {
      amount: parseFloat(form.amount), method: form.method, accountId: form.accountId,
      paidBy: form.paidBy.trim(), reference: form.reference.trim(),
      notes: form.notes.trim(), date: form.date,
    };
    if (editingId) { updateDeposit(editingId, payload); } else { addDeposit(payload); }
    setShowModal(false);
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setShowModal(false);
  }

  // ── Account helpers ───────────────────────────────────────────────────────
  function openAddAccount() {
    setEditingAccId(null);
    setAccForm(EMPTY_ACCOUNT_FORM);
    setAccErrors({});
    setShowAccountModal(true);
  }

  function openEditAccount(acc: CopyShopAccount) {
    setEditingAccId(acc.id);
    setAccForm({ name: acc.name, type: acc.type, bankName: acc.bankName, accountNumber: acc.accountNumber, notes: acc.notes, isActive: acc.isActive });
    setAccErrors({});
    setShowAccountModal(true);
  }

  function validateAccount() {
    const e: Record<string, string> = {};
    if (!accForm.name.trim()) e.name = 'Account name is required.';
    setAccErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleAccountSubmit() {
    if (!validateAccount()) return;
    const payload: Omit<CopyShopAccount, 'id' | 'createdAt'> = {
      name: accForm.name.trim(), type: accForm.type, bankName: accForm.bankName.trim(),
      accountNumber: accForm.accountNumber.trim(), notes: accForm.notes.trim(), isActive: accForm.isActive,
    };
    if (editingAccId) { updateAccount(editingAccId, payload); } else { addAccount(payload); }
    setShowAccountModal(false);
  }

  function handleAccBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setShowAccountModal(false);
  }

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h4 className="fw-semibold text-dark mb-0">
            <i className="fas fa-piggy-bank text-primary me-2"></i>Deposits
          </h4>
          <p className="text-secondary small mb-0">Record payments deposited into CopyShop accounts</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-secondary rounded-pill px-3" onClick={() => setShowAccounts((v) => !v)}>
            <i className="fas fa-university me-2"></i>{showAccounts ? 'Hide' : 'Manage'} Accounts
            <span className="badge bg-secondary ms-2">{accounts.length}</span>
          </button>
          <button className="btn btn-primary rounded-pill px-4" onClick={openAdd}>
            <i className="fas fa-plus me-2"></i>New Deposit
          </button>
        </div>
      </div>

      {/* Accounts panel */}
      {showAccounts && (
        <div className="card shadow-sm mb-4 border-top border-primary border-3">
          <div className="card-header bg-white d-flex align-items-center justify-content-between py-2">
            <span className="fw-semibold"><i className="fas fa-university text-primary me-2"></i>CopyShop Accounts</span>
            <button className="btn btn-sm btn-primary rounded-pill px-3" onClick={openAddAccount}>
              <i className="fas fa-plus me-1"></i>Add Account
            </button>
          </div>
          <div className="card-body p-0">
            {accounts.length === 0 ? (
              <p className="text-secondary text-center py-4">No accounts yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Account Name</th>
                      <th>Type</th>
                      <th>Bank / Provider</th>
                      <th>Account No.</th>
                      <th className="text-end">Total Deposited</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc) => {
                      const meta = accountTypeMeta(acc.type);
                      const total = accountTotals[acc.id] ?? 0;
                      return (
                        <tr key={acc.id}>
                          <td className="fw-medium">
                            <i className={`${meta.icon} me-2 text-secondary`}></i>{acc.name}
                          </td>
                          <td>{meta.label}</td>
                          <td className="text-secondary">{acc.bankName || '—'}</td>
                          <td className="text-secondary">{acc.accountNumber || '—'}</td>
                          <td className="text-end fw-bold text-success">P{total.toFixed(2)}</td>
                          <td>
                            {acc.isActive
                              ? <span className="badge bg-success">Active</span>
                              : <span className="badge bg-secondary">Inactive</span>}
                          </td>
                          <td className="text-secondary">{acc.notes || '—'}</td>
                          <td className="text-end">
                            <div className="d-flex gap-1 justify-content-end">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => openEditAccount(acc)} title="Edit">
                                <i className="fas fa-pen"></i>
                              </button>
                              {deleteAccConfirmId === acc.id ? (
                                <>
                                  <button className="btn btn-sm btn-danger" onClick={() => { deleteAccount(acc.id); setDeleteAccConfirmId(null); }}>Confirm</button>
                                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setDeleteAccConfirmId(null)}>Cancel</button>
                                </>
                              ) : (
                                <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteAccConfirmId(acc.id)} title="Delete">
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
                      <td colSpan={4} className="text-end fw-semibold">Grand Total</td>
                      <td className="text-end fw-bold text-success">P{depositsTotal.toFixed(2)}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="card border-top-blue shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">All-time Total</p>
              <h3 className="fw-bold mb-0">P{depositsTotal.toFixed(2)}</h3>
              <p className="text-secondary small mb-0">{deposits.length} record{deposits.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card border-top-green shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">This Month</p>
              <h3 className="fw-bold mb-0 text-success">P{thisMonthTotal.toFixed(2)}</h3>
              <p className="text-secondary small mb-0">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card border-top-purple shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Today</p>
              <h3 className="fw-bold mb-0">P{todayTotal.toFixed(2)}</h3>
              <p className="text-secondary small mb-0">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-3">
        <div className="card-body py-2 d-flex flex-wrap gap-2 align-items-center">
          <button
            className={`btn btn-sm rounded-pill px-3 ${filterMethod === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilterMethod('all')}
          >All Methods</button>
          {METHODS.map((m) => (
            <button key={m.value}
              className={`btn btn-sm rounded-pill px-3 ${filterMethod === m.value ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilterMethod(m.value)}
            >
              <i className={`${m.icon} me-1`}></i>{m.label}
            </button>
          ))}
          <div className="vr mx-1 d-none d-md-block"></div>
          <select className="form-select form-select-sm rounded-pill" style={{ maxWidth: 190 }} value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}>
            <option value="">All Accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className="form-select form-select-sm rounded-pill" style={{ maxWidth: 165 }} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="input-group input-group-sm ms-auto" style={{ maxWidth: 240 }}>
            <span className="input-group-text bg-transparent"><i className="fas fa-search text-secondary"></i></span>
            <input type="text" className="form-control border-start-0 ps-0" placeholder="Search payer, ref, notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="text-secondary small">{displayed.length} record{displayed.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5 text-secondary">
            <i className="fas fa-piggy-bank fa-3x mb-3 d-block opacity-25"></i>
            {deposits.length === 0 ? 'No deposits recorded yet. Click New Deposit to get started.' : 'No deposits match the current filter.'}
          </div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Paid By</th>
                  <th>Method</th>
                  <th>Deposited To</th>
                  <th>Reference</th>
                  <th>Notes</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((dep) => {
                  const meta = methodMeta(dep.method);
                  const acc  = accounts.find((a) => a.id === dep.accountId);
                  return (
                    <tr key={dep.id}>
                      <td className="text-nowrap fw-medium">{dep.date}</td>
                      <td>
                        {dep.paidBy
                          ? <span><i className="fas fa-user me-1 text-secondary" style={{ fontSize: '0.75rem' }}></i>{dep.paidBy}</span>
                          : <span className="text-secondary">—</span>}
                      </td>
                      <td>
                        <span className={`badge ${meta.badge}`} style={{ fontSize: '0.72rem' }}>
                          <i className={`${meta.icon} me-1`}></i>{meta.label}
                        </span>
                      </td>
                      <td>
                        {acc
                          ? <span className="fw-medium small"><i className={`${accountTypeMeta(acc.type).icon} me-1 text-secondary`}></i>{acc.name}</span>
                          : <span className="text-secondary small">—</span>}
                      </td>
                      <td className="small text-secondary">{dep.reference || '—'}</td>
                      <td className="small text-secondary" style={{ maxWidth: 180 }}>
                        <span className="text-truncate d-block" title={dep.notes}>{dep.notes || '—'}</span>
                      </td>
                      <td className="text-end fw-bold text-success text-nowrap">P{dep.amount.toFixed(2)}</td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(dep)} title="Edit">
                            <i className="fas fa-pen"></i>
                          </button>
                          {deleteConfirmId === dep.id ? (
                            <>
                              <button className="btn btn-sm btn-danger" onClick={() => { deleteDeposit(dep.id); setDeleteConfirmId(null); }}>Confirm</button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                            </>
                          ) : (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirmId(dep.id)} title="Delete">
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
                    {filterMethod !== 'all' || filterAccount || filterMonth || search ? 'Filtered Total' : 'Grand Total'}
                  </td>
                  <td className="text-end fw-bold text-success">P{filteredTotal.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Deposit Add / Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} onClick={handleBackdrop}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-semibold">
                  <i className={`fas ${editingId ? 'fa-pen' : 'fa-plus-circle'} text-primary me-2`}></i>
                  {editingId ? 'Edit Deposit' : 'Record New Deposit'}
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
                        type="number" min={0} step="0.01"
                        className={`form-control${errors.amount ? ' is-invalid' : ''}`}
                        placeholder="0.00" value={form.amount} autoFocus
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

                  {/* Deposited To Account */}
                  <div className="col-12">
                    <label className="form-label fw-medium small">
                      Deposited To Account <span className="text-danger">*</span>
                    </label>
                    {accounts.filter((a) => a.isActive).length === 0 ? (
                      <div className="alert alert-warning py-2 small mb-0">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        No active accounts.{' '}
                        <button type="button" className="btn btn-link btn-sm py-0 px-0"
                          onClick={() => { setShowModal(false); setShowAccounts(true); }}>
                          Manage Accounts
                        </button>{' '}to add one first.
                      </div>
                    ) : (
                      <div className="d-flex flex-wrap gap-2">
                        {accounts.filter((a) => a.isActive).map((a) => (
                          <button key={a.id} type="button"
                            onClick={() => setForm((p) => ({ ...p, accountId: a.id }))}
                            className={`btn btn-sm rounded-pill d-flex align-items-center gap-1 ${form.accountId === a.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                          >
                            <i className={accountTypeMeta(a.type).icon}></i>
                            <span>{a.name}</span>
                            {a.accountNumber && <span className="opacity-75" style={{ fontSize: '0.7rem' }}>{a.accountNumber}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.accountId && <div className="text-danger small mt-1">{errors.accountId}</div>}
                  </div>

                  {/* Payment method */}
                  <div className="col-12">
                    <label className="form-label fw-medium small">Payment Method</label>
                    <div className="d-flex flex-wrap gap-2">
                      {METHODS.map((m) => (
                        <button key={m.value} type="button"
                          onClick={() => setForm((p) => ({ ...p, method: m.value }))}
                          className={`btn btn-sm rounded-pill ${form.method === m.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                        >
                          <i className={`${m.icon} me-1`}></i>{m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paid By */}
                  <div className="col-sm-6">
                    <label className="form-label fw-medium small">Paid By</label>
                    <input type="text" className="form-control" placeholder="Customer / payer name"
                      value={form.paidBy} onChange={(e) => setForm((p) => ({ ...p, paidBy: e.target.value }))} />
                  </div>

                  {/* Reference */}
                  <div className="col-sm-6">
                    <label className="form-label fw-medium small">Reference / Receipt No.</label>
                    <input type="text" className="form-control" placeholder="e.g. TXN-00123"
                      value={form.reference} onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))} />
                  </div>

                  {/* Notes */}
                  <div className="col-12">
                    <label className="form-label fw-medium small">Notes</label>
                    <textarea className="form-control" rows={2} placeholder="Optional description…"
                      value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary rounded-pill px-4" onClick={handleSubmit}>
                  <i className={`fas ${editingId ? 'fa-save' : 'fa-plus'} me-2`}></i>
                  {editingId ? 'Save Changes' : 'Record Deposit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Add / Edit Modal */}
      {showAccountModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} onClick={handleAccBackdrop}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-semibold">
                  <i className={`fas ${editingAccId ? 'fa-pen' : 'fa-plus-circle'} text-primary me-2`}></i>
                  {editingAccId ? 'Edit Account' : 'Add Account'}
                </h5>
                <button className="btn-close" onClick={() => setShowAccountModal(false)}></button>
              </div>
              <div className="modal-body pt-3">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-medium small">Account Name <span className="text-danger">*</span></label>
                    <input type="text"
                      className={`form-control${accErrors.name ? ' is-invalid' : ''}`}
                      placeholder="e.g. FNB Business Account, Cash Box"
                      value={accForm.name} autoFocus
                      onChange={(e) => setAccForm((p) => ({ ...p, name: e.target.value }))}
                    />
                    {accErrors.name && <div className="invalid-feedback">{accErrors.name}</div>}
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-medium small">Account Type</label>
                    <div className="d-flex flex-wrap gap-2">
                      {ACCOUNT_TYPES.map((t) => (
                        <button key={t.value} type="button"
                          onClick={() => setAccForm((p) => ({ ...p, type: t.value }))}
                          className={`btn btn-sm rounded-pill ${accForm.type === t.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                        >
                          <i className={`${t.icon} me-1`}></i>{t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label fw-medium small">Bank / Provider</label>
                    <input type="text" className="form-control" placeholder="e.g. First National Bank"
                      value={accForm.bankName} onChange={(e) => setAccForm((p) => ({ ...p, bankName: e.target.value }))} />
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label fw-medium small">Account No. / Identifier</label>
                    <input type="text" className="form-control" placeholder="e.g. ****4201"
                      value={accForm.accountNumber} onChange={(e) => setAccForm((p) => ({ ...p, accountNumber: e.target.value }))} />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-medium small">Notes</label>
                    <input type="text" className="form-control" placeholder="Optional description"
                      value={accForm.notes} onChange={(e) => setAccForm((p) => ({ ...p, notes: e.target.value }))} />
                  </div>

                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" role="switch" id="accActiveSwitch"
                        checked={accForm.isActive}
                        onChange={(e) => setAccForm((p) => ({ ...p, isActive: e.target.checked }))}
                      />
                      <label className="form-check-label small" htmlFor="accActiveSwitch">
                        Active (visible when recording deposits)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowAccountModal(false)}>Cancel</button>
                <button className="btn btn-primary rounded-pill px-4" onClick={handleAccountSubmit}>
                  <i className={`fas ${editingAccId ? 'fa-save' : 'fa-plus'} me-2`}></i>
                  {editingAccId ? 'Save Changes' : 'Add Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
