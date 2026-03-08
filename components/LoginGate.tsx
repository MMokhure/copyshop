'use client';

import { useState, useEffect } from 'react';
import { useSales } from '@/lib/SalesContext';
import { UserRole } from '@/lib/types';

const ROLE_COLORS: Record<UserRole, string> = {
  admin:   'bg-danger',
  manager: 'bg-warning text-dark',
  cashier: 'bg-primary',
  viewer:  'bg-secondary',
};

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #0d6efd 0%, #0a4ccc 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div className="text-center text-white">
        <div className="rounded-circle bg-white d-inline-flex align-items-center justify-content-center shadow mb-3"
          style={{ width: 72, height: 72 }}>
          <i className="fas fa-print text-primary" style={{ fontSize: '2rem' }}></i>
        </div>
        <h2 className="fw-bold mb-1">CopyShop</h2>
        <p className="text-white-50 small mb-3">Sales Tally System</p>
        <div className="spinner-border spinner-border-sm text-white opacity-75" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const { users, currentUser, loginUser } = useSales();
  const [mounted, setMounted]       = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pin, setPin]               = useState('');
  const [showPin, setShowPin]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => { setMounted(true); }, []);

  // Before client-side hydration, show branded loader
  if (!mounted) return <LoadingScreen />;

  // If a user is already signed in, render the app
  if (currentUser) return <>{children}</>;

  const activeUsers   = users.filter((u) => u.isActive);
  const selectedUser  = users.find((u) => u.id === selectedId);

  function handleSelect(id: string) {
    setSelectedId(id);
    setPin('');
    setError('');
    setShowPin(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    const ok = loginUser(selectedId, pin);
    if (!ok) {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #0d6efd 0%, #0a4ccc 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '2rem 1rem' }}>

        {/* Brand */}
        <div className="text-center mb-4">
          <div className="rounded-circle bg-white d-inline-flex align-items-center justify-content-center shadow mb-3"
            style={{ width: 76, height: 76 }}>
            <i className="fas fa-print text-primary" style={{ fontSize: '2rem' }}></i>
          </div>
          <h2 className="text-white fw-bold mb-0">CopyShop</h2>
          <p className="text-white-50 small">Sales Tally System · Botswana</p>
        </div>

        <div className="card border-0 shadow-lg">
          <div className="card-body p-4">

            {/* ── Step 1: pick an account ─────────────────────────────── */}
            {!selectedUser ? (
              <>
                <h6 className="fw-semibold text-center mb-1">Welcome back</h6>
                <p className="text-secondary small text-center mb-3">Select your account to sign in</p>

                {activeUsers.length === 0 ? (
                  <div className="alert alert-warning small py-2 mb-0">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    No active accounts found. Add users in the <strong>Users</strong> module.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {activeUsers.map((u) => (
                      <button
                        key={u.id}
                        className="btn btn-outline-primary d-flex align-items-center gap-3 text-start py-2 px-3"
                        style={{ borderRadius: 10 }}
                        onClick={() => handleSelect(u.id)}
                      >
                        <span
                          className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                          style={{ width: 40, height: 40, fontSize: '0.82rem' }}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="fw-semibold small">{u.name}</div>
                          <div className="text-secondary" style={{ fontSize: '0.72rem' }}>
                            {u.email || u.role}
                          </div>
                        </div>
                        <span className={`badge ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                        <i className="fas fa-chevron-right text-secondary" style={{ fontSize: '0.75rem' }}></i>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (

              /* ── Step 2: enter PIN ─────────────────────────────────── */
              <>
                <button
                  className="btn btn-link btn-sm text-secondary p-0 mb-3 d-flex align-items-center gap-1"
                  onClick={() => { setSelectedId(null); setError(''); }}
                >
                  <i className="fas fa-arrow-left"></i> Back
                </button>

                <div className="text-center mb-3">
                  <span
                    className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold mb-2"
                    style={{ width: 54, height: 54, fontSize: '1rem' }}
                  >
                    {selectedUser.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="fw-semibold">{selectedUser.name}</div>
                  <small className="text-secondary">{selectedUser.role}</small>
                </div>

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="alert alert-danger py-2 small mb-3">
                      <i className="fas fa-circle-xmark me-1"></i>{error}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary text-uppercase">
                      Enter 4-digit PIN
                    </label>
                    <div className="input-group">
                      <input
                        type={showPin ? 'text' : 'password'}
                        inputMode="numeric"
                        className="form-control form-control-lg text-center fw-bold"
                        placeholder="• • • •"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                          setError('');
                        }}
                        autoFocus
                        style={{ letterSpacing: '0.5em' }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPin((s) => !s)}
                        tabIndex={-1}
                      >
                        <i className={`fas ${showPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={pin.length !== 4}
                  >
                    <i className="fas fa-unlock me-2"></i>Sign In
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-white-50 small mt-3">
          <i className="fas fa-shield-halved me-1"></i>Secured with PIN authentication
        </p>
      </div>
    </div>
  );
}
