'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Printer, Service, SaleEntry, InventoryItem, InventoryCategory, Deposit, CopyShopAccount, Expense, ExpenseCategory, AppSettings, AppUser, UserRole, Investment, InvestmentType } from './types';

// ── Investment seed data ────────────────────────────────────────────────────
const DEFAULT_INVESTMENTS: Investment[] = [];

// ── Printer seed data ───────────────────────────────────────────────────────
const DEFAULT_SETTINGS: AppSettings = {
  shopName: 'CopyShop',
  shopAddress: '',
  shopPhone: '',
  shopEmail: '',
  currency: 'P',
  timezone: 'Africa/Gaborone',
};

const DEFAULT_PRINTERS: Printer[] = [
  {
    id: 'p1', name: 'Canon IR-ADV', model: 'Canon imageRUNNER ADVANCE C3530i',
    type: 'laser', capabilities: ['A4', 'A3', 'Color', 'B&W', 'Duplex'],
    status: 'online', location: 'Front desk', paperRemaining: 420,
    tonerLevel: 72, tonerCost: 85.00, expectedPaperYield: 15000, totalPrints: 18340, notes: '', addedAt: new Date().toISOString(),
  },
  {
    id: 'p2', name: 'HP LaserJet', model: 'HP LaserJet Pro MFP M428fdw',
    type: 'laser', capabilities: ['A4', 'A3', 'B&W', 'Duplex'],
    status: 'online', location: 'Back office', paperRemaining: 210,
    tonerLevel: 35, tonerCost: 60.00, expectedPaperYield: 10000, totalPrints: 9870, notes: 'Toner low – order replacement', addedAt: new Date().toISOString(),
  },
  {
    id: 'p3', name: 'Epson EcoTank', model: 'Epson EcoTank ET-16650',
    type: 'inkjet', capabilities: ['A4', 'Color', 'Photo'],
    status: 'online', location: 'Photo station', paperRemaining: 85,
    tonerLevel: 58, tonerCost: 45.00, expectedPaperYield: 7500, totalPrints: 4120, notes: '', addedAt: new Date().toISOString(),
  },
];

// ── Inventory seed data ──────────────────────────────────────────────────────
const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: 'i1', name: 'A4 Paper',              category: 'paper',      unit: 'reams',       quantity: 8,  minQuantity: 10, costPerUnit: 4.50,  supplier: 'OfficeWorld',  notes: '',                         lastRestockedAt: '', addedAt: new Date().toISOString() },
  { id: 'i2', name: 'A3 Paper',              category: 'paper',      unit: 'reams',       quantity: 3,  minQuantity: 5,  costPerUnit: 7.00,  supplier: 'OfficeWorld',  notes: '',                         lastRestockedAt: '', addedAt: new Date().toISOString() },
  { id: 'i3', name: 'A5 Paper',              category: 'paper',      unit: 'reams',       quantity: 5,  minQuantity: 4,  costPerUnit: 3.00,  supplier: 'OfficeWorld',  notes: '',                         lastRestockedAt: '', addedAt: new Date().toISOString() },
  { id: 'i4', name: 'Canon Black Toner',     category: 'toner',      unit: 'cartridges',  quantity: 1,  minQuantity: 2,  costPerUnit: 85.00, supplier: 'Canon Direct', notes: 'For Canon IR-ADV',         lastRestockedAt: '', addedAt: new Date().toISOString() },
  { id: 'i5', name: 'HP Black Toner',        category: 'toner',      unit: 'cartridges',  quantity: 2,  minQuantity: 2,  costPerUnit: 60.00, supplier: 'HP Store',     notes: 'For HP LaserJet',          lastRestockedAt: '', addedAt: new Date().toISOString() },
  { id: 'i6', name: 'Epson Ink Set',         category: 'ink',        unit: 'sets',        quantity: 3,  minQuantity: 2,  costPerUnit: 45.00, supplier: 'Epson Direct', notes: 'For Epson EcoTank',        lastRestockedAt: '', addedAt: new Date().toISOString() },
  { id: 'i7', name: 'Binding Covers A4',     category: 'binding',    unit: 'packs',       quantity: 6,  minQuantity: 3,  costPerUnit: 8.00,  supplier: 'PrintSupplies Co', notes: '',                     lastRestockedAt: '', addedAt: new Date().toISOString() },
  { id: 'i8', name: 'Spiral Coils (A4)',     category: 'binding',    unit: 'boxes',       quantity: 2,  minQuantity: 2,  costPerUnit: 12.00, supplier: 'PrintSupplies Co', notes: '100 coils per box',    lastRestockedAt: '', addedAt: new Date().toISOString() },
  { id: 'i9', name: 'Staples',               category: 'stationery', unit: 'boxes',       quantity: 4,  minQuantity: 2,  costPerUnit: 3.50,  supplier: 'OfficeWorld',  notes: '',                         lastRestockedAt: '', addedAt: new Date().toISOString() },
  { id: 'i10', name: 'Binder Clips (Large)', category: 'stationery', unit: 'boxes',       quantity: 3,  minQuantity: 2,  costPerUnit: 2.50,  supplier: 'OfficeWorld',  notes: '',                         lastRestockedAt: '', addedAt: new Date().toISOString() },
];

// ── Seed data ────────────────────────────────────────────────────────────────
const now = new Date().toISOString();
const DEFAULT_ACCOUNTS: CopyShopAccount[] = [
  { id: 'acc1', name: 'Cash Box',        type: 'cash_box',     bankName: '',                  accountNumber: '',      notes: 'On-site cash drawer',       isActive: true, createdAt: now },
  { id: 'acc2', name: 'FNB Business',    type: 'bank',         bankName: 'First National Bank', accountNumber: '****4201', notes: 'Main business account',  isActive: true, createdAt: now },
  { id: 'acc3', name: 'Orange Money',    type: 'mobile_money', bankName: 'Orange',            accountNumber: '7612****', notes: 'Mobile payments wallet',    isActive: true, createdAt: now },
];
const DEFAULT_DEPOSITS: Deposit[] = [];
const DEFAULT_EXPENSES: Expense[] = [];
const DEFAULT_USERS: AppUser[] = [
  { id: 'u1', name: 'Admin', email: 'admin@copyshop.co.bw', pin: '1234', role: 'admin', isActive: true, createdAt: now },
];

const DEFAULT_SERVICES: Service[] = [
  { id: 's1', name: 'A4 B&W',    printer: 'Canon IR-ADV',  price: 0.50, icon: '📄', badgeVariant: 'bg-secondary', active: true, createdAt: now },
  { id: 's2', name: 'A4 Color',  printer: 'Canon IR-ADV',  price: 2.00, icon: '🖨️', badgeVariant: 'bg-primary',   active: true, createdAt: now },
  { id: 's3', name: 'A4 B&W',    printer: 'HP LaserJet',   price: 0.50, icon: '📄', badgeVariant: 'bg-secondary', active: true, createdAt: now },
  { id: 's4', name: 'A3 B&W',    printer: 'HP LaserJet',   price: 1.50, icon: '📃', badgeVariant: 'bg-secondary', active: true, createdAt: now },
  { id: 's5', name: 'A4 Color',  printer: 'Epson EcoTank', price: 2.00, icon: '🖨️', badgeVariant: 'bg-primary',   active: true, createdAt: now },
  { id: 's6', name: 'Photo 4x6', printer: 'Epson EcoTank', price: 3.00, icon: '🖼️', badgeVariant: 'bg-warning text-dark', active: true, createdAt: now },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayDateKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silent
  }
}

// ── Context types ─────────────────────────────────────────────────────────────
interface SalesContextType {
  // Expenses
  expenses: Expense[];
  addExpense: (e: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  expensesTotal: number;

  // Deposits
  deposits: Deposit[];
  addDeposit: (d: Omit<Deposit, 'id' | 'createdAt'>) => void;
  updateDeposit: (id: string, patch: Partial<Deposit>) => void;
  deleteDeposit: (id: string) => void;
  depositsTotal: number;

  // CopyShop Accounts
  accounts: CopyShopAccount[];
  addAccount: (a: Omit<CopyShopAccount, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, patch: Partial<CopyShopAccount>) => void;
  deleteAccount: (id: string) => void;

  // Inventory (admin)
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'addedAt'>) => void;
  updateInventoryItem: (id: string, patch: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  lowStockCount: number;

  // Printers (admin)
  printers: Printer[];
  addPrinter: (p: Omit<Printer, 'id' | 'addedAt'>) => void;
  updatePrinter: (id: string, patch: Partial<Printer>) => void;
  deletePrinter: (id: string) => void;

  // Services (admin)
  services: Service[];
  addService: (s: Omit<Service, 'id' | 'createdAt'>) => void;
  updateService: (id: string, patch: Partial<Service>) => void;
  deleteService: (id: string) => void;

  // Sales history (all-time, every recorded sale)
  salesHistory: SaleEntry[];
  updateSaleEntry: (id: string, patch: Partial<SaleEntry>) => void;
  deleteSaleEntry: (id: string) => void;

  // Tally (cashier)
  todayEntries: SaleEntry[];
  addSale: (serviceId: string) => void;
  cancelSale: (id: string) => void;
  undoLastSale: () => void;
  clearToday: () => void;

  // Derived
  todayTotal: number;
  todayCount: number;
  countByService: (id: string) => number;

  // Settings
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;

  // Users
  users: AppUser[];
  addUser: (u: Omit<AppUser, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, patch: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  currentUser: AppUser | null;
  loginUser: (id: string, pin: string) => boolean;
  logoutUser: () => void;

  // Manual history entry
  addManualSale: (entry: Omit<SaleEntry, 'id'>) => void;

  // Investments
  investments: Investment[];
  addInvestment: (inv: Omit<Investment, 'id' | 'createdAt'>) => void;
  updateInvestment: (id: string, patch: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  investmentsTotal: number;
}

const SalesContext = createContext<SalesContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function SalesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [accounts, setAccounts] = useState<CopyShopAccount[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  // Ref so addSale can read services without closing over stale state
  const servicesRef = useRef<Service[]>([]);
  useEffect(() => { servicesRef.current = services; }, [services]);

  const [salesHistory, setSalesHistory] = useState<SaleEntry[]>([]);
  const [todayEntries, setTodayEntries] = useState<SaleEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<AppUser[]>([]);
  // Ref so loginUser can read users without a side-effect inside a setter
  const usersRef = useRef<AppUser[]>([]);
  useEffect(() => { usersRef.current = users; }, [users]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on the client
  useEffect(() => {
    setExpenses(lsGet('cs_expenses', DEFAULT_EXPENSES));
    setDeposits(lsGet('cs_deposits', DEFAULT_DEPOSITS));
    setAccounts(lsGet('cs_accounts', DEFAULT_ACCOUNTS));
    setInventory(lsGet('cs_inventory', DEFAULT_INVENTORY));
    setPrinters(lsGet('cs_printers', DEFAULT_PRINTERS));
    setServices(lsGet('cs_services', DEFAULT_SERVICES));
    setSalesHistory(lsGet('cs_sales_history', []));
    setTodayEntries(lsGet(`cs_tally_${todayDateKey()}`, []));
    setSettings(lsGet('cs_settings', DEFAULT_SETTINGS));
    const csUsers = lsGet<AppUser[]>('cs_users', DEFAULT_USERS);
    setUsers(csUsers);
    const cuid = typeof window !== 'undefined' ? localStorage.getItem('cs_current_user_id') : null;
    setCurrentUserId(cuid);
    setInvestments(lsGet('cs_investments', DEFAULT_INVESTMENTS));
    // Purge daily tally keys older than 7 days to prevent localStorage bloat
    if (typeof window !== 'undefined') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      Object.keys(localStorage)
        .filter((k) => k.startsWith('cs_tally_') && k.slice(9) < cutoffStr)
        .forEach((k) => localStorage.removeItem(k));
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration)
  useEffect(() => { if (hydrated) lsSet('cs_expenses', expenses); }, [expenses, hydrated]);
  useEffect(() => { if (hydrated) lsSet('cs_deposits', deposits); }, [deposits, hydrated]);
  useEffect(() => { if (hydrated) lsSet('cs_accounts', accounts); }, [accounts, hydrated]);
  useEffect(() => { if (hydrated) lsSet('cs_inventory', inventory); }, [inventory, hydrated]);
  useEffect(() => { if (hydrated) lsSet('cs_printers', printers); }, [printers, hydrated]);
  useEffect(() => { if (hydrated) lsSet('cs_services', services); }, [services, hydrated]);
  useEffect(() => { if (hydrated) lsSet('cs_sales_history', salesHistory); }, [salesHistory, hydrated]);
  useEffect(() => { if (hydrated) lsSet(`cs_tally_${todayDateKey()}`, todayEntries); }, [todayEntries, hydrated]);
  useEffect(() => { if (hydrated) lsSet('cs_settings', settings); }, [settings, hydrated]);
  useEffect(() => { if (hydrated) lsSet('cs_users', users); }, [users, hydrated]);
  useEffect(() => { if (hydrated) lsSet('cs_investments', investments); }, [investments, hydrated]);

  // ── Expense CRUD ───────────────────────────────────────────────────────────
  const addExpense = useCallback((e: Omit<Expense, 'id' | 'createdAt'>) => {
    const exp: Expense = { ...e, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setExpenses((prev) => [exp, ...prev]);
  }, []);

  const updateExpense = useCallback((id: string, patch: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const expensesTotal = expenses.reduce((s, e) => s + e.amount, 0);

  // ── Deposit CRUD ───────────────────────────────────────────────────────────
  const addDeposit = useCallback((d: Omit<Deposit, 'id' | 'createdAt'>) => {
    const dep: Deposit = { ...d, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setDeposits((prev) => [dep, ...prev]);
  }, []);

  const updateDeposit = useCallback((id: string, patch: Partial<Deposit>) => {
    setDeposits((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const deleteDeposit = useCallback((id: string) => {
    setDeposits((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const depositsTotal = deposits.reduce((s, d) => s + d.amount, 0);

  // ── Account CRUD ───────────────────────────────────────────────────────────
  const addAccount = useCallback((a: Omit<CopyShopAccount, 'id' | 'createdAt'>) => {
    const acc: CopyShopAccount = { ...a, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setAccounts((prev) => [...prev, acc]);
  }, []);

  const updateAccount = useCallback((id: string, patch: Partial<CopyShopAccount>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ── Inventory CRUD ───────────────────────────────────────────────────────────
  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'addedAt'>) => {
    const newItem: InventoryItem = { ...item, id: crypto.randomUUID(), addedAt: new Date().toISOString() };
    setInventory((prev) => [...prev, newItem]);
  }, []);

  const updateInventoryItem = useCallback((id: string, patch: Partial<InventoryItem>) => {
    setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const lowStockCount = inventory.filter((i) => i.quantity <= i.minQuantity).length;

  // ── Printer CRUD ────────────────────────────────────────────────────────────
  const addPrinter = useCallback((p: Omit<Printer, 'id' | 'addedAt'>) => {
    const printer: Printer = { ...p, id: crypto.randomUUID(), addedAt: new Date().toISOString() };
    setPrinters((prev) => [...prev, printer]);
  }, []);

  const updatePrinter = useCallback((id: string, patch: Partial<Printer>) => {
    setPrinters((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const deletePrinter = useCallback((id: string) => {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── Service CRUD ────────────────────────────────────────────────────────────
  const addService = useCallback((s: Omit<Service, 'id' | 'createdAt'>) => {
    const svc: Service = { ...s, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setServices((prev) => [...prev, svc]);
  }, []);

  const updateService = useCallback((id: string, patch: Partial<Service>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const deleteService = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ── Tally ───────────────────────────────────────────────────────────────────
  const addSale = useCallback((serviceId: string) => {
    // Read from ref — avoids calling setState inside another setState updater
    const svc = servicesRef.current.find((s) => s.id === serviceId);
    if (!svc) return;
    const entry: SaleEntry = {
      id: crypto.randomUUID(),
      serviceId: svc.id,
      serviceName: svc.name,
      printer: svc.printer,
      price: svc.price,
      timestamp: new Date().toISOString(),
    };
    setTodayEntries((prev) => [...prev, entry]);
    setSalesHistory((prev) => [...prev, entry]);
  }, []);

  const cancelSale = useCallback((id: string) => {
    setTodayEntries((prev) => prev.filter((e) => e.id !== id));
    setSalesHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const undoLastSale = useCallback(() => {
    setTodayEntries((prev) => {
      if (prev.length === 0) return prev;
      const removed = prev[prev.length - 1];
      setSalesHistory((h) => h.filter((e) => e.id !== removed.id));
      return prev.slice(0, -1);
    });
  }, []);

  const clearToday = useCallback(() => setTodayEntries([]), []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const todayTotal = todayEntries.reduce((sum, e) => sum + e.price, 0);
  const todayCount = todayEntries.length;

  const countByService = useCallback(
    (id: string) => todayEntries.filter((e) => e.serviceId === id).length,
    [todayEntries]
  );

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── User CRUD ────────────────────────────────────────────────────────────────
  const addUser = useCallback((u: Omit<AppUser, 'id' | 'createdAt'>) => {
    const user: AppUser = { ...u, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setUsers((prev) => [...prev, user]);
  }, []);

  const updateUser = useCallback((id: string, patch: Partial<AppUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const loginUser = useCallback((id: string, pin: string): boolean => {
    const user = usersRef.current.find((u) => u.id === id && u.pin === pin && u.isActive);
    if (user) {
      setCurrentUserId(id);
      if (typeof window !== 'undefined') localStorage.setItem('cs_current_user_id', id);
      return true;
    }
    return false;
  }, []);

  const logoutUser = useCallback(() => {
    setCurrentUserId(null);
    if (typeof window !== 'undefined') localStorage.removeItem('cs_current_user_id');
  }, []);

  const addManualSale = useCallback((entry: Omit<SaleEntry, 'id'>) => {
    const newEntry: SaleEntry = { ...entry, id: crypto.randomUUID() };
    setSalesHistory((prev) => [...prev, newEntry]);
    const today = new Date().toISOString().slice(0, 10);
    if (entry.timestamp.slice(0, 10) === today) {
      setTodayEntries((prev) => [...prev, newEntry]);
    }
  }, []);

  const updateSaleEntry = useCallback((id: string, patch: Partial<SaleEntry>) => {
    setSalesHistory((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    setTodayEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const deleteSaleEntry = useCallback((id: string) => {
    setSalesHistory((prev) => prev.filter((e) => e.id !== id));
    setTodayEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) ?? null;

  // ── Investment CRUD ──────────────────────────────────────────────────────────
  const addInvestment = useCallback((inv: Omit<Investment, 'id' | 'createdAt'>) => {
    const item: Investment = { ...inv, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setInvestments((prev) => [item, ...prev]);
  }, []);

  const updateInvestment = useCallback((id: string, patch: Partial<Investment>) => {
    setInvestments((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const deleteInvestment = useCallback((id: string) => {
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const investmentsTotal = investments.reduce((s, i) => s + i.value * i.quantity, 0);

  return (
    <SalesContext.Provider
      value={{
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        expensesTotal,
        deposits,
        addDeposit,
        updateDeposit,
        deleteDeposit,
        depositsTotal,
        accounts,
        addAccount,
        updateAccount,
        deleteAccount,
        inventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        lowStockCount,
        printers,
        addPrinter,
        updatePrinter,
        deletePrinter,
        services,
        addService,
        updateService,
        deleteService,
        salesHistory,
        todayEntries,
        addSale,
        cancelSale,
        undoLastSale,
        clearToday,
        todayTotal,
        todayCount,
        countByService,
        settings,
        updateSettings,
        users,
        addUser,
        updateUser,
        deleteUser,
        currentUser,
        loginUser,
        logoutUser,
        addManualSale,
        updateSaleEntry,
        deleteSaleEntry,
        investments,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        investmentsTotal,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSales() {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error('useSales must be used within <SalesProvider>');
  return ctx;
}
