import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { mockProducts, mockStockMovements, formatDate } from '../../data/mockData';
import type { StockMovement } from '../../types';

export default function Stocks({ hideHeader = false }: { hideHeader?: boolean }) {
  const { products, setProducts, stockMovements: movements, setStockMovements: setMovements, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Movement form state
  const [mvtProductId, setMvtProductId] = useState('');
  const [mvtType, setMvtType] = useState<'in' | 'out'>('in');
  const [mvtQuantity, setMvtQuantity] = useState(1);
  const [mvtReason, setMvtReason] = useState('');

  // Edit stock form state
  const [editProduct, setEditProduct] = useState<typeof mockProducts[0] | null>(null);
  const [editStock, setEditStock] = useState(0);
  const [editMinStock, setEditMinStock] = useState(0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase());
    const isAlert = p.stock <= p.minStock;
    const matchesStatus = !statusFilter ||
      (statusFilter === 'alert' && isAlert) ||
      (statusFilter === 'ok' && !isAlert);
    return matchesSearch && matchesStatus;
  });

  const openMovement = () => {
    setMvtProductId('');
    setMvtType('in');
    setMvtQuantity(1);
    setMvtReason('');
    setShowModal(true);
  };

  const openEdit = (product: typeof mockProducts[0]) => {
    setEditProduct(product);
    setEditStock(product.stock);
    setEditMinStock(product.minStock);
    setShowEditModal(true);
  };

  const handleMovement = () => {
    if (!mvtProductId || !mvtReason.trim()) {
      addToast({ title: 'Erreur', message: 'Veuillez sélectionner un produit et indiquer la raison.', type: 'error' });
      return;
    }
    const product = products.find(p => p.id === mvtProductId);
    if (!product) return;

    if (mvtType === 'out' && mvtQuantity > product.stock) {
      addToast({ title: 'Stock insuffisant', message: `Stock actuel de ${product.name}: ${product.stock} ${product.unit}`, type: 'error' });
      return;
    }

    // Update product stock
    setProducts(prev => prev.map(p => p.id === mvtProductId ? {
      ...p, stock: mvtType === 'in' ? p.stock + mvtQuantity : p.stock - mvtQuantity,
    } : p));

    // Add movement record
    const newMovement: StockMovement = {
      id: `sm${Date.now()}`,
      productId: mvtProductId,
      productName: product.name,
      type: mvtType,
      quantity: mvtQuantity,
      reason: mvtReason,
      date: new Date().toISOString(),
      createdBy: 'Mamadou Diaw',
    };
    setMovements(prev => [newMovement, ...prev]);

    addToast({
      title: mvtType === 'in' ? 'Entrée de stock' : 'Sortie de stock',
      message: `${mvtQuantity} ${product.unit} de ${product.name} ${mvtType === 'in' ? 'ajouté(s)' : 'retiré(s)'}`,
      type: 'success',
    });
    setShowModal(false);
  };

  const handleEditStock = () => {
    if (!editProduct) return;
    setProducts(prev => prev.map(p => p.id === editProduct.id ? {
      ...p, stock: editStock, minStock: editMinStock,
    } : p));
    addToast({ title: 'Stock mis à jour', message: `Stock de ${editProduct.name} ajusté à ${editStock} ${editProduct.unit}.`, type: 'success' });
    setShowEditModal(false);
    setEditProduct(null);
  };

  return (
    <div>
      {!hideHeader && (
        <div className="page-header">
          <div className="page-header-top">
            <div>
              <h1>Stocks</h1>
              <p>Supervisez l'inventaire et gérez les alertes de rupture.</p>
            </div>
            <button className="btn btn-primary" onClick={openMovement}>
              + Mouvement de stock
            </button>
          </div>
        </div>
      )}
      {hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button className="btn btn-primary" onClick={openMovement}>
            + Mouvement de stock
          </button>
        </div>
      )}

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="data-table-filters">
            <select className="form-select" style={{ padding: '8px 32px 8px 12px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tous les états</option>
              <option value="alert">En alerte</option>
              <option value="ok">Stock OK</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Produit</th>
                <th>Stock Actuel</th>
                <th>Stock Minimum</th>
                <th>État</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const isAlert = product.stock <= product.minStock;
                return (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 500 }}>{product.reference}</td>
                    <td>{product.name}</td>
                    <td style={{ fontWeight: 600 }}>{product.stock} {product.unit}</td>
                    <td>{product.minStock} {product.unit}</td>
                    <td>
                      <span className={`badge ${isAlert ? (product.stock === 0 ? 'badge-error' : 'badge-warning') : 'badge-success'}`}>
                        {isAlert ? (product.stock === 0 ? 'Rupture' : 'Alerte') : 'Normal'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-ghost" style={{ padding: '4px' }} onClick={() => openEdit(product)} title="Ajuster le stock">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Historique des mouvements */}
        {movements.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Derniers mouvements de stock</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Produit</th>
                  <th>Type</th>
                  <th>Quantité</th>
                  <th>Raison</th>
                  <th>Par</th>
                </tr>
              </thead>
              <tbody>
                {movements.slice(0, 10).map(mv => (
                  <tr key={mv.id}>
                    <td>{formatDate(mv.date)}</td>
                    <td style={{ fontWeight: 500 }}>{mv.productName}</td>
                    <td>
                      <span className={`badge ${mv.type === 'in' ? 'badge-success' : 'badge-error'}`}>
                        {mv.type === 'in' ? '↑ Entrée' : '↓ Sortie'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{mv.quantity}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{mv.reason}</td>
                    <td>{mv.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Mouvement de stock */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>Nouveau mouvement de stock</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Type de mouvement</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`btn ${mvtType === 'in' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setMvtType('in')}>
                    ↑ Entrée
                  </button>
                  <button className={`btn ${mvtType === 'out' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, ...(mvtType === 'out' ? { backgroundColor: 'var(--color-error)', borderColor: 'var(--color-error)' } : {}) }} onClick={() => setMvtType('out')}>
                    ↓ Sortie
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Produit *</label>
                <select className="form-select" value={mvtProductId} onChange={e => setMvtProductId(e.target.value)}>
                  <option value="">-- Sélectionner un produit --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantité *</label>
                <input className="form-input" type="number" min={1} value={mvtQuantity} onChange={e => setMvtQuantity(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Raison *</label>
                <input className="form-input" type="text" value={mvtReason} onChange={e => setMvtReason(e.target.value)} placeholder="Ex: Achat fournisseur, Ajustement inventaire..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleMovement}>Valider le mouvement</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifier le stock */}
      {showEditModal && editProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>Ajuster le stock</h2>
              <button className="btn-ghost" onClick={() => setShowEditModal(false)} style={{ padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 15 }}>{editProduct.name}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Stock actuel ({editProduct.unit})</label>
                  <input className="form-input" type="number" value={editStock} onChange={e => setEditStock(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock minimum</label>
                  <input className="form-input" type="number" value={editMinStock} onChange={e => setEditMinStock(Number(e.target.value))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowEditModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleEditStock}>Mettre à jour</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
