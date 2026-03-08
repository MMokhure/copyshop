'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSales } from '@/lib/SalesContext';
import { UserRole } from '@/lib/types';

const ROLE_COLORS: Record<UserRole, string> = {
  admin:   'bg-danger',
  manager: 'bg-warning text-dark',
  cashier: 'bg-primary',
  viewer:  'bg-secondary',
};

export default function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { currentUser, logoutUser, inventory } = useSales();
  const [today, setToday]           = useState('');
  const [showNotif, setShowNotif]   = useState(false);
  const [showUser, setShowUser]     = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString('en-US', {
        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
      })
    );
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setShowUser(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Real notifications from inventory ──────────────────────────────────────
  const lowItems = inventory.filter((i) => i.quantity <= i.minQuantity);
  const notifCount = lowItems.length;

  const initials = currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'CS';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container-fluid px-3">

        {/* Brand + sidebar toggle */}
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-link text-white p-0 me-1" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <i className="fas fa-bars fs-5"></i>
          </button>
          <span className="navbar-brand fw-bold mb-0 text-white">
            <i className="fas fa-print me-2"></i>CopyShop
          </span>
        </div>

        {/* Right side */}
        <div className="d-flex align-items-center gap-2 ms-auto">

          {/* Date */}
          <span className="d-none d-md-inline badge bg-white text-primary fw-medium px-3 py-2">
            <i className="fas fa-calendar-alt me-1"></i>{today}
          </span>

          {/* ── Notification bell ────────────────────────────────── */}
          <div className="position-relative" ref={notifRef}>
            <button
              className="btn btn-link text-white p-0 position-relative"
              aria-label="Notifications"
              onClick={() => { setShowNotif((s) => !s); setShowUser(false); }}
            >
              <i className="fas fa-bell fs-5"></i>
              {notifCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: '0.6rem' }}
                >
                  {notifCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div
                className="dropdown-menu show shadow border-0 p-0 mt-2"
                style={{ right: 0, left: 'auto', minWidth: 300, position: 'absolute' }}
              >
                {/* Header */}
                <div className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
                  <span className="fw-semibold small">Notifications</span>
                  {notifCount > 0 && (
                    <span className="badge bg-danger rounded-pill">{notifCount}</span>
                  )}
                </div>

                {/* Body */}
                {lowItems.length === 0 ? (
                  <div className="text-center py-4 text-secondary">
                    <i className="fas fa-check-circle fa-2x mb-2 d-block text-success opacity-75"></i>
                    <span className="small">All clear — no alerts</span>
                  </div>
                ) : (
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {lowItems.map((item) => (
                      <Link
                        key={item.id}
                        href="/inventory"
                        className="dropdown-item d-flex align-items-start gap-2 py-2 px-3 border-bottom"
                        onClick={() => setShowNotif(false)}
                      >
                        <i className="fas fa-box text-warning mt-1 flex-shrink-0"></i>
                        <div>
                          <div className="small fw-semibold">Low Stock</div>
                          <div className="text-secondary" style={{ fontSize: '0.77rem' }}>
                            {item.name}: <strong>{item.quantity}</strong> {item.unit} left
                            {' '}(min {item.minQuantity})
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="px-3 py-2 border-top">
                  <Link href="/inventory" className="small text-primary" onClick={() => setShowNotif(false)}>
                    View Inventory →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── User menu ────────────────────────────────────────── */}
          <div className="position-relative" ref={userRef}>
            <button
              className="btn btn-link text-white p-0 d-flex align-items-center gap-2"
              onClick={() => { setShowUser((s) => !s); setShowNotif(false); }}
            >
              <span
                className="rounded-circle bg-white text-primary d-inline-flex align-items-center justify-content-center fw-bold"
                style={{ width: 34, height: 34, fontSize: '0.82rem' }}
              >
                {initials}
              </span>
              <span className="d-none d-lg-inline small">
                {currentUser ? currentUser.name : 'Guest'}
              </span>
              <i className="fas fa-chevron-down d-none d-lg-inline" style={{ fontSize: '0.6rem' }}></i>
            </button>

            {showUser && (
              <div
                className="dropdown-menu show shadow border-0 mt-2"
                style={{ right: 0, left: 'auto', minWidth: 230, position: 'absolute' }}
              >
                {currentUser ? (
                  <>
                    {/* User info header */}
                    <div className="px-3 py-2 border-bottom">
                      <div className="fw-semibold small">{currentUser.name}</div>
                      <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                        {currentUser.email || '—'}
                      </div>
                      <span className={`badge mt-1 ${ROLE_COLORS[currentUser.role]}`}>
                        {currentUser.role}
                      </span>
                    </div>

                    <Link
                      className="dropdown-item small"
                      href="/settings"
                      onClick={() => setShowUser(false)}
                    >
                      <i className="fas fa-cog me-2 text-secondary"></i>Settings
                    </Link>
                    {currentUser.role === 'admin' && (
                      <Link
                        className="dropdown-item small"
                        href="/users"
                        onClick={() => setShowUser(false)}
                      >
                        <i className="fas fa-users me-2 text-secondary"></i>Manage Users
                      </Link>
                    )}

                    <hr className="dropdown-divider my-1" />

                    <button
                      className="dropdown-item small text-danger"
                      onClick={() => { logoutUser(); setShowUser(false); }}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i>Sign Out
                    </button>
                  </>
                ) : (
                  <div className="px-3 py-3 text-center text-secondary">
                    <i className="fas fa-user-slash fa-lg d-block mb-1 opacity-50"></i>
                    <span className="small">Not signed in</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
