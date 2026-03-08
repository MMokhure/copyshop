export type PrinterStatus = 'online' | 'offline' | 'maintenance';
export type PrinterType = 'laser' | 'inkjet' | 'dye-sub' | 'dot-matrix' | 'other';

export interface Printer {
  id: string;
  name: string;          // display name used in services e.g. "Canon IR-ADV"
  model: string;         // full model string
  type: PrinterType;
  capabilities: string[]; // e.g. ['A4', 'A3', 'Color', 'B&W', 'Duplex']
  status: PrinterStatus;
  location: string;
  paperRemaining: number; // sheets
  tonerLevel: number;     // 0-100
  tonerCost: number;          // cost to replace toner/ink cartridge
  expectedPaperYield: number; // pages the toner is rated to print
  totalPrints: number;    // lifetime counter
  notes: string;
  addedAt: string;        // ISO
}

export interface Service {
  id: string;
  name: string;
  printer: string;       // matches Printer.name; empty string = no printer (general product/service)
  price: number;
  icon: string;
  badgeVariant: string;  // Bootstrap bg-* class
  active: boolean;
  createdAt: string;
}

export interface SaleEntry {
  id: string;
  serviceId: string;
  serviceName: string;
  printer: string;
  price: number;
  timestamp: string; // ISO
}

export type DepositMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'card' | 'cheque' | 'other';

export type AccountType = 'bank' | 'cash_box' | 'mobile_money' | 'other';

export interface CopyShopAccount {
  id: string;
  name: string;           // e.g. "FNB Main Account", "Cash Box"
  type: AccountType;
  bankName: string;       // e.g. "First National Bank"
  accountNumber: string;  // last 4 digits or full ref
  notes: string;
  isActive: boolean;
  createdAt: string;      // ISO
}

export interface Deposit {
  id: string;
  amount: number;
  method: DepositMethod;
  accountId: string;    // CopyShopAccount.id — which account it was deposited into
  paidBy: string;       // name of depositor / customer
  reference: string;    // bank ref, receipt no., etc.
  notes: string;
  date: string;         // ISO (user-chosen date)
  createdAt: string;    // ISO (when record was created)
}

export type ExpenseCategory =
  | 'supplies'
  | 'utilities'
  | 'maintenance'
  | 'rent'
  | 'salaries'
  | 'transport'
  | 'equipment'
  | 'other';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;   // short label
  vendor: string;        // who was paid
  reference: string;     // receipt / invoice number
  notes: string;
  date: string;          // ISO date (user-chosen)
  createdAt: string;     // ISO (when record was created)
}

export interface AppSettings {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  currency: string;   // display prefix e.g. 'P'
  timezone: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'viewer';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  pin: string;         // 4-digit PIN; local POS only
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type InvestmentType = 'cash' | 'equipment' | 'material' | 'property' | 'vehicle' | 'other';

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;         // description of what was invested
  investor: string;     // name of person / entity
  value: number;        // monetary value (in Pula)
  quantity: number;     // for material/equipment — number of units (1 for cash)
  unit: string;         // e.g. 'units', 'reams', 'kg' — empty for cash
  date: string;         // ISO date (user-chosen)
  reference: string;    // receipt / invoice / agreement ref
  notes: string;
  createdAt: string;    // ISO (when record was created)
}

export type InventoryCategory = 'paper' | 'toner' | 'ink' | 'binding' | 'stationery' | 'other';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;           // e.g. "reams", "cartridges", "boxes"
  quantity: number;
  minQuantity: number;    // reorder threshold
  costPerUnit: number;
  supplier: string;
  notes: string;
  lastRestockedAt: string; // ISO or empty string
  addedAt: string;         // ISO
}
