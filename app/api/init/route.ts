import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Default seed data (mirrors SalesContext defaults)
const now = new Date().toISOString();

const DEFAULT_SETTINGS = { shopName: 'CopyShop', shopAddress: '', shopPhone: '', shopEmail: '', currency: 'P', timezone: 'Africa/Gaborone' };
const DEFAULT_USERS = [{ id: 'u1', name: 'Admin', email: 'admin@copyshop.co.bw', pin: '1234', role: 'admin', isActive: true, createdAt: now }];
const DEFAULT_SERVICES = [
  { id: 's1', name: 'A4 B&W',    printer: 'Canon IR-ADV',  price: 0.50, icon: '📄', badgeVariant: 'bg-secondary', active: true, createdAt: now },
  { id: 's2', name: 'A4 Color',  printer: 'Canon IR-ADV',  price: 2.00, icon: '🖨️', badgeVariant: 'bg-primary',   active: true, createdAt: now },
  { id: 's3', name: 'A4 B&W',    printer: 'HP LaserJet',   price: 0.50, icon: '📄', badgeVariant: 'bg-secondary', active: true, createdAt: now },
  { id: 's4', name: 'A3 B&W',    printer: 'HP LaserJet',   price: 1.50, icon: '📃', badgeVariant: 'bg-secondary', active: true, createdAt: now },
  { id: 's5', name: 'A4 Color',  printer: 'Epson EcoTank', price: 2.00, icon: '🖨️', badgeVariant: 'bg-primary',   active: true, createdAt: now },
  { id: 's6', name: 'Photo 4x6', printer: 'Epson EcoTank', price: 3.00, icon: '🖼️', badgeVariant: 'bg-warning text-dark', active: true, createdAt: now },
];
const DEFAULT_PRINTERS = [
  { id: 'p1', name: 'Canon IR-ADV', model: 'Canon imageRUNNER ADVANCE C3530i', type: 'laser', capabilities: ['A4','A3','Color','B&W','Duplex'], status: 'online', location: 'Front desk', paperRemaining: 420, tonerLevel: 72, tonerCost: 85, expectedPaperYield: 15000, totalPrints: 18340, notes: '', addedAt: now },
  { id: 'p2', name: 'HP LaserJet',  model: 'HP LaserJet Pro MFP M428fdw', type: 'laser', capabilities: ['A4','A3','B&W','Duplex'], status: 'online', location: 'Back office', paperRemaining: 210, tonerLevel: 35, tonerCost: 60, expectedPaperYield: 10000, totalPrints: 9870, notes: 'Toner low – order replacement', addedAt: now },
  { id: 'p3', name: 'Epson EcoTank', model: 'Epson EcoTank ET-16650', type: 'inkjet', capabilities: ['A4','Color','Photo'], status: 'online', location: 'Photo station', paperRemaining: 85, tonerLevel: 58, tonerCost: 45, expectedPaperYield: 7500, totalPrints: 4120, notes: '', addedAt: now },
];
const DEFAULT_ACCOUNTS = [
  { id: 'acc1', name: 'Cash Box',     type: 'cash_box',     bankName: '',                    accountNumber: '',         notes: 'On-site cash drawer',        isActive: true, createdAt: now },
  { id: 'acc2', name: 'FNB Business', type: 'bank',         bankName: 'First National Bank', accountNumber: '****4201', notes: 'Main business account',      isActive: true, createdAt: now },
  { id: 'acc3', name: 'Orange Money', type: 'mobile_money', bankName: 'Orange',              accountNumber: '7612****', notes: 'Mobile payments wallet',      isActive: true, createdAt: now },
];
const DEFAULT_INVENTORY = [
  { id: 'i1',  name: 'A4 Paper',              category: 'paper',      unit: 'reams',      quantity: 8,  minQuantity: 10, costPerUnit: 4.50,  supplier: 'OfficeWorld',      notes: '',                      lastRestockedAt: '', addedAt: now },
  { id: 'i2',  name: 'A3 Paper',              category: 'paper',      unit: 'reams',      quantity: 3,  minQuantity: 5,  costPerUnit: 7.00,  supplier: 'OfficeWorld',      notes: '',                      lastRestockedAt: '', addedAt: now },
  { id: 'i3',  name: 'A5 Paper',              category: 'paper',      unit: 'reams',      quantity: 5,  minQuantity: 4,  costPerUnit: 3.00,  supplier: 'OfficeWorld',      notes: '',                      lastRestockedAt: '', addedAt: now },
  { id: 'i4',  name: 'Canon Black Toner',     category: 'toner',      unit: 'cartridges', quantity: 1,  minQuantity: 2,  costPerUnit: 85.00, supplier: 'Canon Direct',     notes: 'For Canon IR-ADV',      lastRestockedAt: '', addedAt: now },
  { id: 'i5',  name: 'HP Black Toner',        category: 'toner',      unit: 'cartridges', quantity: 2,  minQuantity: 2,  costPerUnit: 60.00, supplier: 'HP Store',         notes: 'For HP LaserJet',       lastRestockedAt: '', addedAt: now },
  { id: 'i6',  name: 'Epson Ink Set',         category: 'ink',        unit: 'sets',       quantity: 3,  minQuantity: 2,  costPerUnit: 45.00, supplier: 'Epson Direct',     notes: 'For Epson EcoTank',     lastRestockedAt: '', addedAt: now },
  { id: 'i7',  name: 'Binding Covers A4',     category: 'binding',    unit: 'packs',      quantity: 6,  minQuantity: 3,  costPerUnit: 8.00,  supplier: 'PrintSupplies Co', notes: '',                      lastRestockedAt: '', addedAt: now },
  { id: 'i8',  name: 'Spiral Coils (A4)',     category: 'binding',    unit: 'boxes',      quantity: 2,  minQuantity: 2,  costPerUnit: 12.00, supplier: 'PrintSupplies Co', notes: '100 coils per box',     lastRestockedAt: '', addedAt: now },
  { id: 'i9',  name: 'Staples',               category: 'stationery', unit: 'boxes',      quantity: 4,  minQuantity: 2,  costPerUnit: 3.50,  supplier: 'OfficeWorld',      notes: '',                      lastRestockedAt: '', addedAt: now },
  { id: 'i10', name: 'Binder Clips (Large)',  category: 'stationery', unit: 'boxes',      quantity: 3,  minQuantity: 2,  costPerUnit: 2.50,  supplier: 'OfficeWorld',      notes: '',                      lastRestockedAt: '', addedAt: now },
];

export async function GET() {
  try {
    // Create tables
    await sql`CREATE TABLE IF NOT EXISTS settings      (id TEXT PRIMARY KEY, data JSONB NOT NULL DEFAULT '{}')`;
    await sql`CREATE TABLE IF NOT EXISTS users         (id TEXT PRIMARY KEY, data JSONB NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS services      (id TEXT PRIMARY KEY, data JSONB NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS printers      (id TEXT PRIMARY KEY, data JSONB NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS inventory     (id TEXT PRIMARY KEY, data JSONB NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS accounts      (id TEXT PRIMARY KEY, data JSONB NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS deposits      (id TEXT PRIMARY KEY, data JSONB NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS expenses      (id TEXT PRIMARY KEY, data JSONB NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS investments   (id TEXT PRIMARY KEY, data JSONB NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS sales_history (id TEXT PRIMARY KEY, ts TIMESTAMPTZ, data JSONB NOT NULL)`;
    await sql`CREATE INDEX IF NOT EXISTS sales_ts_idx ON sales_history (ts)`;

    // Seed defaults if empty
    const s = await sql`SELECT id FROM settings WHERE id = 'main'`;
    if (s.length === 0) {
      await sql`INSERT INTO settings (id, data) VALUES ('main', ${JSON.stringify(DEFAULT_SETTINGS)}::jsonb)`;
    }
    const u = await sql`SELECT id FROM users LIMIT 1`;
    if (u.length === 0) {
      for (const user of DEFAULT_USERS) {
        await sql`INSERT INTO users (id, data) VALUES (${user.id}, ${JSON.stringify(user)}::jsonb) ON CONFLICT (id) DO NOTHING`;
      }
    }
    const sv = await sql`SELECT id FROM services LIMIT 1`;
    if (sv.length === 0) {
      for (const svc of DEFAULT_SERVICES) {
        await sql`INSERT INTO services (id, data) VALUES (${svc.id}, ${JSON.stringify(svc)}::jsonb) ON CONFLICT (id) DO NOTHING`;
      }
    }
    const pr = await sql`SELECT id FROM printers LIMIT 1`;
    if (pr.length === 0) {
      for (const p of DEFAULT_PRINTERS) {
        await sql`INSERT INTO printers (id, data) VALUES (${p.id}, ${JSON.stringify(p)}::jsonb) ON CONFLICT (id) DO NOTHING`;
      }
    }
    const ac = await sql`SELECT id FROM accounts LIMIT 1`;
    if (ac.length === 0) {
      for (const a of DEFAULT_ACCOUNTS) {
        await sql`INSERT INTO accounts (id, data) VALUES (${a.id}, ${JSON.stringify(a)}::jsonb) ON CONFLICT (id) DO NOTHING`;
      }
    }
    const inv = await sql`SELECT id FROM inventory LIMIT 1`;
    if (inv.length === 0) {
      for (const item of DEFAULT_INVENTORY) {
        await sql`INSERT INTO inventory (id, data) VALUES (${item.id}, ${JSON.stringify(item)}::jsonb) ON CONFLICT (id) DO NOTHING`;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
