'use client';

import { useState, useMemo } from 'react';
import { useSales } from '@/lib/SalesContext';
import { InventoryItem, InventoryCategory } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES: { value: InventoryCategory; label: string; icon: string; color: string }[] = [
  { value: 'paper',      label: 'Paper',      icon: 'fas fa-file-alt',    color: 'bg-info-subtle text-info' },
  { value: 'toner',      label: 'Toner',      icon: 'fas fa-ink-bottle',  color: 'bg-dark-subtle text-dark' },
  { value: 'ink',        label: 'Ink',        icon: 'fas fa-tint',        color: 'bg-primary-subtle text-primary' },
  { value: 'binding',    label: 'Binding',    icon: 'fas fa-book',        color: 'bg-warning-subtle text-warning' },
  { value: 'stationery', label: 'Stationery', icon: 'fas fa-pen',         color: 'bg-success-subtle text-success' },
  { value: 'other',      label: 'Other',      icon: 'fas fa-box',         color: 'bg-secondary-subtle text-secondary' },
];

function categoryMeta(cat: InventoryCategory) {
  return CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[5];
}

// ── Form state ────────────────────────────────────────────────────────────────
interface FormState {
  name: string;
  category: InventoryCategory;
  unit: string;
  quantity: string;
  minQuantity: string;
  costPerUnit: string;
  supplier: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  category: 'paper',
  unit: '',
  quantity: '0',
  minQuantity: '5',
  costPerUnit: '',
  supplier: '',
  notes: '',
};

// ── Restock form ──────────────────────────────────────────────────────────────
interface RestockState {
  itemId: string;
  addQty: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function InventoryManager() {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useSales();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<InventoryCategory | 'all'>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [restock, setRestock] = useState<RestockState | null>(null);
  const [restockError, setRestockError] = useState('');

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalValue = useMemo(
    () => inventory.reduce((s, i) => s + i.quantity * i.costPerUnit, 0),
    [inventory]
  );
  const lowCount  = inventory.filter((i) => i.quantity > 0 && i.quantity <= i.minQuantity).length;
  const outCount  = inventory.filter((i) => i.quantity === 0).length;

  // ── Filter / search ───────────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = inventory;
    if (filterCat !== 'all') list = list.filter((i) => i.category === filterCat);
    if (filterStock === 'low') list = list.filter((i) => i.quantity > 0 && i.quantity <= i.minQuantity);
    if (filterStock === 'out') list = list.filter((i) => i.quantity === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.supplier.toLowerCase().includes(q) ||
          i.unit.toLowerCase().includes(q)
      );
    }
    return list;
  }, [inventory, filterCat, filterStock, search]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(item: InventoryItem) {
    setEditingId(item.id);
    setForm({
      name:        item.name,
      category:    item.category,
      unit:        item.unit,
      quantity:    String(item.quantity),
      minQuantity: String(item.minQuantity),
      costPerUnit: item.costPerUnit ? String(item.costPerUnit) : '',
      supplier:    item.supplier,
      notes:       item.notes,
    });
    setErrors({});
    setShowModal(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())              e.name        = 'Name is required.';
    if (!form.unit.trim())              e.unit        = 'Unit is required.';
    const qty = parseInt(form.quantity);
    if (isNaN(qty) || qty < 0)         e.quantity    = 'Enter a valid quantity.';
    const min = parseInt(form.minQuantity);
    if (isNaN(min) || min < 0)         e.minQuantity = 'Enter a valid threshold.';
    if (form.costPerUnit !== '' && (isNaN(parseFloat(form.costPerUnit)) || parseFloat(form.costPerUnit) < 0))
                                        e.costPerUnit = 'Enter a valid cost.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const payload: Omit<InventoryItem, 'id' | 'addedAt'> = {
      name:        form.name.trim(),
      category:    form.category,
      unit:        form.unit.trim(),
      quantity:    parseInt(form.quantity) || 0,
      minQuantity: parseInt(form.minQuantity) || 0,
      costPerUnit: form.costPerUnit !== '' ? parseFloat(form.costPerUnit) : 0,
      supplier:    form.supplier.trim(),
      notes:       form.notes.trim(),
      lastRestockedAt: editingId
        ? (inventory.find((i) => i.id === editingId)?.lastRestockedAt ?? '')
        : '',
    };
    if (editingId) {
      updateInventoryItem(editingId, payload);
    } else {
      addInventoryItem(payload);
    }
    setShowModal(false);
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setShowModal(false);
  }

  function openRestock(item: InventoryItem) {
    setRestock({ itemId: item.id, addQty: '' });
    setRestockError('');
  }

  function confirmRestock() {
    if (!restock) return;
    const add = parseInt(restock.addQty);
    if (isNaN(add) || add <= 0) { setRestockError('Enter a positive number.'); return; }
    const item = inventory.find((i) => i.id === restock.itemId);
    if (!item) return;
    updateInventoryItem(restock.itemId, {
      quantity: item.quantity + add,
      lastRestockedAt: new Date().toISOString(),
    });
    setRestock(null);
  }

  // ── Stock status badge ────────────────────────────────────────────────────
  function stockBadge(item: InventoryItem) {
    if (item.quantity === 0)
      return <span className="badge bg-danger">Out of Stock</span>;
    if (item.quantity <= item.minQuantity)
      return <span className="badge bg-warning text-dark">Low Stock</span>;
    return <span className="badge bg-success">In Stock</span>;
  }

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h4 className="fw-semibold text-dark mb-0">
            <i className="fas fa-boxes text-primary me-2"></i>Inventory
          </h4>
          <p className="text-secondary small mb-0">
            Track supplies, paper stock, toner cartridges and consumables
          </p>
        </div>
        <button className="btn btn-primary rounded-pill px-4" onClick={openAdd}>
          <i className="fas fa-plus me-2"></i>Add Item
        </button>
      </div>

      {/* KPI row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-3">
          <div className="card border-top-blue shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Total Items</p>
              <h3 className="fw-bold mb-0">{inventory.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          <div className="card border-top-green shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Stock Value</p>
              <h3 className="fw-bold mb-0">P{totalValue.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          <div className="card border-top-yellow shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Low Stock</p>
              <h3 className="fw-bold mb-0 text-warning">{lowCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          <div className="card border-top-red shadow-sm h-100">
            <div className="card-body py-3">
              <p className="text-secondary text-uppercase small fw-semibold mb-1">Out of Stock</p>
              <h3 className="fw-bold mb-0 text-danger">{outCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-3">
        <div className="card-body py-2 d-flex flex-wrap gap-2 align-items-center">
          {/* Category pills */}
          <button
            className={`btn btn-sm rounded-pill px-3 ${filterCat === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilterCat('all')}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`btn btn-sm rounded-pill px-3 ${filterCat === c.value ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilterCat(c.value)}
            >
              <i className={`${c.icon} me-1`}></i>{c.label}
            </button>
          ))}

          {/* Separator */}
          <div className="vr mx-1 d-none d-md-block"></div>

          {/* Stock status filter */}
          <button
            className={`btn btn-sm rounded-pill px-3 ${filterStock === 'low' ? 'btn-warning' : 'btn-outline-warning'}`}
            onClick={() => setFilterStock(filterStock === 'low' ? 'all' : 'low')}
          >
            <i className="fas fa-exclamation-triangle me-1"></i>Low
          </button>
          <button
            className={`btn btn-sm rounded-pill px-3 ${filterStock === 'out' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setFilterStock(filterStock === 'out' ? 'all' : 'out')}
          >
            <i className="fas fa-times-circle me-1"></i>Out
          </button>

          {/* Search */}
          <div className="input-group input-group-sm ms-auto" style={{ maxWidth: 260 }}>
            <span className="input-group-text bg-transparent">
              <i className="fas fa-search text-secondary"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-secondary small">{displayed.length} item{displayed.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5 text-secondary">
            <i className="fas fa-boxes fa-3x mb-3 d-block opacity-25"></i>
            {inventory.length === 0
              ? 'No inventory items added yet. Click Add Item to get started.'
              : 'No items match the current filter.'}
          </div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th className="text-end">Qty</th>
                  <th>Unit</th>
                  <th className="text-end">Min</th>
                  <th className="text-end">Cost/Unit</th>
                  <th className="text-end">Stock Value</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Last Restocked</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((item) => {
                  const meta = categoryMeta(item.category);
                  const isLow = item.quantity > 0 && item.quantity <= item.minQuantity;
                  const isOut = item.quantity === 0;
                  return (
                    <tr key={item.id} className={isOut ? 'table-danger' : isLow ? 'table-warning' : ''}>
                      <td>
                        <div className="fw-medium">{item.name}</div>
                        {item.notes && (
                          <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${meta.color}`} style={{ fontSize: '0.7rem' }}>
                          <i className={`${meta.icon} me-1`}></i>{meta.label}
                        </span>
                      </td>
                      <td className="text-end fw-bold">{item.quantity}</td>
                      <td className="text-secondary small">{item.unit}</td>
                      <td className="text-end text-secondary small">{item.minQuantity}</td>
                      <td className="text-end">{item.costPerUnit > 0 ? `P${item.costPerUnit.toFixed(2)}` : '—'}</td>
                      <td className="text-end fw-medium">
                        {item.costPerUnit > 0
                          ? `P${(item.quantity * item.costPerUnit).toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="small text-secondary">{item.supplier || '—'}</td>
                      <td>{stockBadge(item)}</td>
                      <td className="small text-secondary">
                        {item.lastRestockedAt
                          ? new Date(item.lastRestockedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end flex-nowrap">
                          {/* Restock button */}
                          {restock?.itemId === item.id ? (
                            <>
                              <input
                                type="number"
                                min={1}
                                className={`form-control form-control-sm${restockError ? ' is-invalid' : ''}`}
                                style={{ width: 70 }}
                                placeholder="Qty"
                                value={restock.addQty}
                                onChange={(e) => setRestock({ ...restock, addQty: e.target.value })}
                                autoFocus
                              />
                              <button className="btn btn-sm btn-success" onClick={confirmRestock} title="Confirm restock">
                                <i className="fas fa-check"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => setRestock(null)} title="Cancel">
                                <i className="fas fa-times"></i>
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => openRestock(item)}
                              title="Restock"
                            >
                              <i className="fas fa-plus-circle"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openEdit(item)}
                            title="Edit"
                            disabled={restock?.itemId === item.id}
                          >
                            <i className="fas fa-pen"></i>
                          </button>
                          {deleteConfirmId === item.id ? (
                            <>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => { deleteInventoryItem(item.id); setDeleteConfirmId(null); }}
                              >
                                Confirm
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setDeleteConfirmId(item.id)}
                              title="Delete"
                              disabled={restock?.itemId === item.id}
                            >
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
                  <td colSpan={6} className="fw-semibold text-end">Total Stock Value</td>
                  <td className="text-end fw-bold text-success">
                    P{displayed.reduce((s, i) => s + i.quantity * i.costPerUnit, 0).toFixed(2)}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
          onClick={handleBackdrop}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
            <div className="modal-content shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-semibold">
                  <i className={`fas ${editingId ? 'fa-pen' : 'fa-plus-circle'} text-primary me-2`}></i>
                  {editingId ? 'Edit Item' : 'Add Inventory Item'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <div className="modal-body pt-3">
                <div className="row g-3">
                  {/* Name */}
                  <div className="col-sm-8">
                    <label className="form-label fw-medium small">
                      Item Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control${errors.name ? ' is-invalid' : ''}`}
                      placeholder="e.g. A4 Paper, Canon Black Toner"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      autoFocus
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  {/* Category */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">Category</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as InventoryCategory }))}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Unit */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">
                      Unit <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control${errors.unit ? ' is-invalid' : ''}`}
                      placeholder="e.g. reams, cartridges, boxes"
                      value={form.unit}
                      onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                    />
                    {errors.unit && <div className="invalid-feedback">{errors.unit}</div>}
                  </div>

                  {/* Quantity */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">
                      Current Quantity <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      className={`form-control${errors.quantity ? ' is-invalid' : ''}`}
                      value={form.quantity}
                      onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                    />
                    {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
                  </div>

                  {/* Min Quantity */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">
                      Reorder Threshold <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      className={`form-control${errors.minQuantity ? ' is-invalid' : ''}`}
                      value={form.minQuantity}
                      onChange={(e) => setForm((p) => ({ ...p, minQuantity: e.target.value }))}
                    />
                    <div className="form-text">Alert when qty reaches this level.</div>
                    {errors.minQuantity && <div className="invalid-feedback">{errors.minQuantity}</div>}
                  </div>

                  {/* Cost per unit */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">Cost per Unit</label>
                    <div className="input-group">
                      <span className="input-group-text">P</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className={`form-control${errors.costPerUnit ? ' is-invalid' : ''}`}
                        placeholder="0.00"
                        value={form.costPerUnit}
                        onChange={(e) => setForm((p) => ({ ...p, costPerUnit: e.target.value }))}
                      />
                      {errors.costPerUnit && <div className="invalid-feedback">{errors.costPerUnit}</div>}
                    </div>
                  </div>

                  {/* Supplier */}
                  <div className="col-sm-4">
                    <label className="form-label fw-medium small">Supplier</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. OfficeWorld"
                      value={form.supplier}
                      onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
                    />
                  </div>

                  {/* Notes */}
                  <div className="col-12">
                    <label className="form-label fw-medium small">Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g. Compatible printers, storage location…"
                      value={form.notes}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary rounded-pill px-4" onClick={handleSubmit}>
                  <i className={`fas ${editingId ? 'fa-save' : 'fa-plus'} me-2`}></i>
                  {editingId ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
