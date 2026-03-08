'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSales } from '@/lib/SalesContext';
import { UserRole } from '@/lib/types';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  roles?: UserRole[]; // undefined = all roles
}

const navItems: NavItem[] = [
  { label: 'Dashboard',        href: '/',            icon: 'fas fa-tachometer-alt' },
  { label: 'Sales Tally',      href: '/tally',       icon: 'fas fa-cash-register',  badge: 'Live', badgeColor: 'bg-success' },
  { label: 'Manage Services',  href: '/services',    icon: 'fas fa-tags',           roles: ['admin', 'manager'] },
  { label: 'Transactions',     href: '/transactions', icon: 'fas fa-exchange-alt' },
  { label: 'Cash Book',        href: '/cashbook',     icon: 'fas fa-book-open',      roles: ['admin', 'manager'] },
  { label: 'Investments',      href: '/investments',  icon: 'fas fa-briefcase',      roles: ['admin', 'manager'] },
  { label: 'Printers',         href: '/printers',     icon: 'fas fa-print',          roles: ['admin', 'manager'] },
  { label: 'Inventory',        href: '/inventory',   icon: 'fas fa-boxes',          roles: ['admin', 'manager'] },
  { label: 'Reports',          href: '/reports',     icon: 'fas fa-chart-line',     roles: ['admin', 'manager', 'viewer'] },
  { label: 'Deposits',         href: '/deposits',    icon: 'fas fa-piggy-bank',     roles: ['admin', 'manager'] },
  { label: 'Expenses',         href: '/expenses',    icon: 'fas fa-receipt',        roles: ['admin', 'manager'] },
];

const bottomItems: NavItem[] = [
  { label: 'Users',    href: '/users',    icon: 'fas fa-users',           roles: ['admin'] },
  { label: 'Settings', href: '/settings', icon: 'fas fa-cog',             roles: ['admin', 'manager'] },
  { label: 'Help',     href: '/help',     icon: 'fas fa-question-circle' },
];

export default function Sidebar({ open }: { open: boolean }) {
  const pathname = usePathname();
  const { lowStockCount, currentUser } = useSales();

  const userRole = currentUser?.role;

  function canSee(item: NavItem) {
    if (!item.roles) return true;
    if (!userRole) return true; // not logged in = show all
    return item.roles.includes(userRole);
  }

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className={`sidebar-backdrop${open ? ' show' : ''}`}
        aria-hidden="true"
      />

      <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
        {/* Logo area */}
        <div className="sidebar-logo">
          <i className="fas fa-print me-2 text-primary"></i>
          <span className="fw-bold text-dark">CopyShop</span>
          <span className="ms-1 text-secondary small">Tally</span>
        </div>

        {/* Divider */}
        <hr className="mx-3 my-0" />

        {/* Primary nav */}
        <nav className="sidebar-nav mt-2 flex-grow-1">
          <p className="sidebar-section-label">MAIN MENU</p>
          <ul className="list-unstyled mb-0">
            {navItems.filter(canSee).map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`sidebar-link${active ? ' active' : ''}`}
                  >
                    <i className={`${item.icon} sidebar-icon`}></i>
                    <span className="flex-grow-1">{item.label}</span>
                    {item.href === '/inventory' && lowStockCount > 0 ? (
                      <span className="badge bg-warning text-dark ms-auto" style={{ fontSize: '0.65rem' }}>
                        {lowStockCount} Low
                      </span>
                    ) : item.badge ? (
                      <span className={`badge ${item.badgeColor ?? 'bg-secondary'} ms-auto`} style={{ fontSize: '0.65rem' }}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="sidebar-section-label mt-3">ACCOUNT</p>
          <ul className="list-unstyled mb-0">
            {bottomItems.filter(canSee).map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`sidebar-link${active ? ' active' : ''}`}
                  >
                    <i className={`${item.icon} sidebar-icon`}></i>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="d-flex align-items-center gap-2">
            <span
              className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold flex-shrink-0"
              style={{ width: 34, height: 34, fontSize: '0.8rem' }}
            >
              {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'CS'}
            </span>
            <div className="overflow-hidden">
              <p className="mb-0 small fw-semibold text-dark text-truncate">
                {currentUser ? currentUser.name : 'Guest'}
              </p>
              <p className="mb-0 text-secondary" style={{ fontSize: '0.72rem' }}>
                {currentUser ? currentUser.role : 'No user logged in'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
