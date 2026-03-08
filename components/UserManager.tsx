'use client';

import { useState } from 'react';
import { useSales } from '../lib/SalesContext';
import { AppUser, UserRole } from '../lib/types';

const ROLE_COLORS: Record<UserRole, string> = {
  admin:   'bg-danger',
  manager: 'bg-warning text-dark',
  cashier: 'bg-primary',
  viewer:  'bg-secondary',
};

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin:   ['Full system access', 'Manage users', 'CRUD on all data', 'All reports'],
  manager: ['All pages except Users', 'Full CRUD on data', 'All reports & cash book'],
  cashier: ['Sales Tally (record sales)', 'View Transactions', 'Dashboard'],
  viewer:  ['Dashboard (read-only)', 'View Transactions', 'View Reports'],
};

interface FormData {
  name:     string;
  email:    string;
  pin:      string;
  role:     UserRole;
  isActive: boolean;
}

const BLANK: FormData = { name: '', email: '', pin: '', role: 'cashier', isActive: true };

export default function UserManager() {
  const { users, addUser, updateUser, deleteUser, currentUser, loginUser, logoutUser } = useSales();

  const [showModal,    setShowModal]    = useState(false);
  const [editing,      setEditing]      = useState<AppUser | null>(null);
  const [form,         setForm]         = useState<FormData>(BLANK);
  const [showPin,      setShowPin]      = useState(false);
  const [errors,       setErrors]       = useState<Partial<Record<keyof FormData, string>>>({});

  const [switchTarget, setSwitchTarget] = useState<AppUser | null>(null);
  const [pinInput,     setPinInput]     = useState('');
  const [switchErr,    setSwitchErr]    = useState('');

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  // ── Modal helpers ────────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null);
    setForm(BLANK);
    setErrors({});
    setShowPin(false);
    setShowModal(true);
  }

  function openEdit(u: AppUser) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, pin: u.pin, role: u.role, isActive: u.isActive });
    setErrors({});
    setShowPin(false);
    setShowModal(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (name === 'pin') {
      setForm((p) => ({ ...p, pin: value.replace(/\D/g, '').slice(0, 4) }));
    } else if (type === 'checkbox') {
      setForm((p) => ({ ...p, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
    setErrors((p) => ({ ...p, [name]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!/^\d{4}$/.test(form.pin)) errs.pin = 'PIN must be exactly 4 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (editing) {
      updateUser(editing.id, form);
    } else {
      addUser(form);
    }
    setShowModal(false);
  }

  // ── Switch user ──────────────────────────────────────────────────────────
  function openSwitch(u: AppUser) {
    setSwitchTarget(u);
    setPinInput('');
    setSwitchErr('');
  }

  function handleSwitch(e: React.FormEvent) {
    e.preventDefault();
    if (!switchTarget) return;
    const ok = loginUser(switchTarget.id, pinInput);
    if (ok) {
      setSwitchTarget(null);
    } else {
      setSwitchErr('Incorrect PIN. Try again.');
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  function confirmDelete() {
    if (!deleteTarget) return;
    deleteUser(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.6rem' }}>👥</span>
          <div>
            <h4 className="mb-0 fw-bold">User Accounts</h4>
            <small className="text-muted">Manage staff access and roles</small>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="fas fa-user-plus me-2"></i>Add User
        </button>
      </div>

      {/* Active user banner */}
      {currentUser ? (
        <div className="alert alert-success d-flex flex-wrap justify-content-between align-items-center py-2 mb-4 gap-2">
          <div>
            <i className="fas fa-circle-check me-2"></i>
            Logged in as <strong>{currentUser.name}</strong>
            <span className={`badge ms-2 ${ROLE_COLORS[currentUser.role]}`}>{currentUser.role}</span>
          </div>
          <button className="btn btn-sm btn-outline-danger" onClick={logoutUser}>
            <i className="fas fa-right-from-bracket me-1"></i>Log Out
          </button>
        </div>
      ) : (
        <div className="alert alert-warning py-2 mb-4">
          <i className="fas fa-circle-exclamation me-2"></i>
          No user logged in. Click the <i className="fas fa-right-to-bracket"></i> icon next to a user to log in.
        </div>
      )}

      <div className="row g-4">
        {/* ── Users list ────────────────────────────────────────────────── */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header d-flex align-items-center gap-2">
              <i className="fas fa-users text-primary"></i>
              <strong>Staff Accounts ({users.length})</strong>
            </div>
            <div className="list-group list-group-flush">
              {users.length === 0 ? (
                <div className="list-group-item text-center text-muted py-4">
                  No users yet. Add one to get started.
                </div>
              ) : users.map((u) => (
                <div
                  key={u.id}
                  className={`list-group-item d-flex align-items-center gap-3 py-3 ${!u.isActive ? 'opacity-50' : ''}`}
                >
                  {/* Avatar */}
                  <span
                    className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold flex-shrink-0 text-white"
                    style={{ width: 40, height: 40, fontSize: '0.85rem', background: u.isActive ? '#0d6efd' : '#adb5bd' }}
                  >
                    {u.name.slice(0, 2).toUpperCase()}
                  </span>

                  {/* Info */}
                  <div className="flex-grow-1 overflow-hidden">
                    <div className="fw-semibold">
                      {u.name}
                      {currentUser?.id === u.id && (
                        <span className="badge bg-success ms-2 small">Active</span>
                      )}
                      {!u.isActive && (
                        <span className="badge bg-secondary ms-2 small">Inactive</span>
                      )}
                    </div>
                    <div className="small text-muted text-truncate">{u.email || '—'}</div>
                    <div className="small text-muted">
                      Created {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Role badge */}
                  <span className={`badge ${ROLE_COLORS[u.role]}`}>{u.role}</span>

                  {/* Actions */}
                  <div className="d-flex gap-1 flex-shrink-0">
                    <button
                      className="btn btn-sm btn-outline-info"
                      title="Log in as this user"
                      onClick={() => openSwitch(u)}
                    >
                      <i className="fas fa-right-to-bracket"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      title="Edit"
                      onClick={() => openEdit(u)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      title="Delete"
                      disabled={u.id === currentUser?.id}
                      onClick={() => setDeleteTarget(u)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Role reference ────────────────────────────────────────────── */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0">
            <div className="card-header">
              <i className="fas fa-shield-halved me-2 text-warning"></i>
              <strong>Role Permissions</strong>
            </div>
            {(Object.entries(ROLE_PERMISSIONS) as [UserRole, string[]][]).map(([role, perms]) => (
              <div key={role} className="card-body border-bottom py-3">
                <span className={`badge ${ROLE_COLORS[role]} mb-2`}>{role}</span>
                <ul className="list-unstyled small text-muted mb-0">
                  {perms.map((p) => (
                    <li key={p}><i className="fas fa-check text-success me-1"></i>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Switch User Modal ──────────────────────────────────────────────── */}
      {switchTarget && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-right-to-bracket me-2"></i>Log in as {switchTarget.name}
                </h5>
                <button className="btn-close" onClick={() => setSwitchTarget(null)}></button>
              </div>
              <form onSubmit={handleSwitch}>
                <div className="modal-body">
                  <p className="text-muted small mb-3">Enter your 4-digit PIN to continue.</p>
                  {switchErr && <div className="alert alert-danger py-2 small">{switchErr}</div>}
                  <input
                    type="password"
                    inputMode="numeric"
                    className="form-control text-center fw-bold"
                    style={{ fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                    maxLength={4}
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '')); setSwitchErr(''); }}
                    autoFocus
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setSwitchTarget(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Log In</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ───────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`fas ${editing ? 'fa-user-pen' : 'fa-user-plus'} me-2`}></i>
                  {editing ? 'Edit User' : 'Add User'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {/* Name */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input type="text" name="name" maxLength={60}
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      value={form.name} onChange={handleChange} />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email</label>
                    <input type="email" name="email" className="form-control"
                      value={form.email} onChange={handleChange} />
                  </div>

                  {/* PIN */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      4-Digit PIN <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        type={showPin ? 'text' : 'password'}
                        name="pin"
                        inputMode="numeric"
                        maxLength={4}
                        className={`form-control ${errors.pin ? 'is-invalid' : ''}`}
                        value={form.pin}
                        onChange={handleChange}
                        placeholder="e.g. 1234"
                      />
                      <button type="button" className="btn btn-outline-secondary"
                        onClick={() => setShowPin((p) => !p)}>
                        <i className={`fas ${showPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                      {errors.pin && <div className="invalid-feedback">{errors.pin}</div>}
                    </div>
                    <div className="form-text">Staff will enter this PIN to log in on this device.</div>
                  </div>

                  {/* Role */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Role</label>
                    <select name="role" className="form-select" value={form.role} onChange={handleChange}>
                      <option value="admin">Admin — Full access</option>
                      <option value="manager">Manager — All except Users</option>
                      <option value="cashier">Cashier — Tally + view</option>
                      <option value="viewer">Viewer — Read-only dashboard</option>
                    </select>
                  </div>

                  {/* Active */}
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="isActiveChk" name="isActive"
                      checked={form.isActive}
                      onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                    <label className="form-check-label" htmlFor="isActiveChk">
                      Active — can log in
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editing ? 'Save Changes' : 'Create User'}
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
                  <i className="fas fa-trash me-2"></i>Delete User
                </h5>
                <button className="btn-close" onClick={() => setDeleteTarget(null)}></button>
              </div>
              <div className="modal-body">
                Remove <strong>{deleteTarget.name}</strong>? This cannot be undone.
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
