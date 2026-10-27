import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { mockProducts, mockStockMovements, formatDate } from '../../data/mockData';
import type { StockMovement, Product } from '../../types';

export default function Stocks({ hideHeader = false }: { hideHeader?: boolean }) {
  const { products, setProducts, stockMovements: movements, setStockMovements: setMovements, addToast, isSuspended, checkCanPerformAction } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Movement form state
  const [mvtProductId, setMvtProductId] = useState('');
  const [mvtProductName, setMvtProductName] = useState('');
  const [mvtType, setMvtType] = useState<'in' | 'out'>('in');
  const [mvtQuantity, setMvtQuantity] = useState<number | ''>(1);
  const [mvtReason, setMvtReason] = useState('');

  // Edit stock form state
  const [editProduct, setEditProduct] = useState<typeof mockProducts[0] | null>(null);
  const [editStock, setEditStock] = useState<number | ''>(0);
  const [editMinStock, setEditMinStock] = useState<number | ''>(0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase());
    const isAlert = p.stock <= p.minStock;
    const matchesStatus = !statusFilter ||
      (statusFilter === 'alert' && isAlert) ||
      (statusFilter === 'ok' && !isAlert);
    return matchesSearch && matchesStatus;
  });

  const openMovement = () => {
    if (!checkCanPerformAction("le mouvement de stock")) return;
    setMvtProductId('');
    setMvtProductName('');
    setMvtType('in');
    setMvtQuantity(1);
    setMvtReason('');
    setShowModal(true);
  };

  const openEdit = (product: typeof mockProducts[0]) => {
    if (!checkCanPerformAction("l'ajustement de stock")) return;
    setEditProduct(product);
    setEditStock(product.stock);
    setEditMinStock(product.minStock);
    setShowEditModal(true);
  };

  const handleMovement = () => {
    if (!checkCanPerformAction("le mouvement de stock")) return;

    // Trouver le produit soit par son ID soit par son nom saisi
    let product = products.find(p => 
      (mvtProductId && p.id === mvtProductId) || 
      (mvtProductName.trim() && p.name.toLowerCase() === mvtProductName.trim().toLowerCase())
    );

    // Recherche souple si l'utilisateur a tapé une partie du nom
    if (!product && mvtProductName.trim()) {
      product = products.find(p => p.name.toLowerCase().includes(mvtProductName.trim().toLowerCase()));
    }

    if (!product && !mvtProductName.trim()) {
      addToast({ title: 'Erreur', message: 'Veuillez saisir ou sélectionner un produit.', type: 'error' });
      return;
    }

    const qty = mvtQuantity === '' ? 1 : Number(mvtQuantity);
    if (qty <= 0) {
      addToast({ title: 'Quantité invalide', message: 'La quantité doit être supérieure à zéro.', type: 'error' });
      return;
    }

    // Si le produit n'existe pas encore dans le catalogue et que c'est une entrée de stock
    if (!product && mvtProductName.trim()) {
      if (mvtType === 'out') {
        addToast({ title: 'Stock indisponible', message: `Le produit "${mvtProductName}" n'existe pas encore dans votre catalogue.`, type: 'error' });
        return;
      }
      const newProduct: Product = {
        id: `p${Date.now()}`,
        name: mvtProductName.trim(),
        reference: `PRD-${String(products.length + 1).padStart(3, '0')}`,
        category: 'Général',
        buyPrice: 0,
        sellPrice: 0,
        stock: qty,
        minStock: 5,
        unit: 'pièce',
        createdAt: new Date().toISOString()
      };
      setProducts(prev => [newProduct, ...prev]);
      product = newProduct;
    } else if (product) {
      if (mvtType === 'out' && qty > product.stock) {
        addToast({ title: 'Stock insuffisant', message: `Stock actuel de ${product.name}: ${product.stock} ${product.unit}`, type: 'error' });
        return;
      }

      // Mettre à jour le stock du produit existant
      const existingId = product.id;
      setProducts(prev => prev.map(p => p.id === existingId ? {
        ...p, stock: mvtType === 'in' ? p.stock + qty : p.stock - qty,
      } : p));
    }

    if (!product) return;

    // Raison facultative (valeur par défaut si non spécifiée)
    const defaultReason = mvtType === 'in' ? 'Entrée de stock' : 'Sortie de stock';
    const finalReason = mvtReason.trim() || defaultReason;

    // Ajouter l'enregistrement de mouvement
    const newMovement: StockMovement = {
      id: `sm${Date.now()}`,
      productId: product.id,
      productName: product.name,
      type: mvtType,
      quantity: qty,
      reason: finalReason,
      date: new Date().toISOString(),
      createdBy: 'Mamadou Diaw',
    };
    setMovements(prev => [newMovement, ...prev]);

    addToast({
      title: mvtType === 'in' ? 'Entrée de stock' : 'Sortie de stock',
      message: `${qty} ${product.unit} de ${product.name} ${mvtType === 'in' ? 'ajouté(s)' : 'retiré(s)'}`,
      type: 'success',
    });
    setShowModal(false);
  };

  const handleEditStock = () => {
    if (!checkCanPerformAction("l'ajustement de stock")) return;
    if (!editProduct) return;
    const stockVal = editStock === '' ? 0 : Number(editStock);
    const minStockVal = editMinStock === '' ? 0 : Number(editMinStock);
    setProducts(prev => prev.map(p => p.id === editProduct.id ? {
      ...p, stock: stockVal, minStock: minStockVal,
    } : p));
    addToast({ title: 'Stock mis à jour', message: `Stock de ${editProduct.name} ajusté à ${stockVal} ${editProduct.unit}.`, type: 'success' });
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
            <button 
              className="btn btn-primary" 
              onClick={openMovement}
              disabled={isSuspended}
              style={{ opacity: isSuspended ? 0.6 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }}
              title={isSuspended ? "Action bloquée : Compte suspendu" : undefined}
            >
              + Mouvement de stock
            </button>
          </div>
        </div>
      )}
      {hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button 
            className="btn btn-primary" 
            onClick={openMovement}
            disabled={isSuspended}
            style={{ opacity: isSuspended ? 0.6 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }}
            title={isSuspended ? "Action bloquée : Compte suspendu" : undefined}
          >
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
                      <button 
                        className="btn-ghost" 
                        style={{ padding: '4px', opacity: isSuspended ? 0.4 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }} 
                        onClick={() => openEdit(product)} 
                        disabled={isSuspended}
                        title={isSuspended ? "Compte suspendu : Ajustement impossible" : "Ajuster le stock"}
                      >
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Produit *</label>
                  {(() => {
                    const matchedProd = products.find(p => (mvtProductId && p.id === mvtProductId) || (mvtProductName.trim() && p.name.toLowerCase() === mvtProductName.trim().toLowerCase()));
                    if (!matchedProd) return null;
                    const isAlert = matchedProd.stock <= matchedProd.minStock;
                    return (
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        color: isAlert ? 'var(--color-error)' : 'var(--color-success)',
                        background: isAlert ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        Stock actuel : {matchedProd.stock} {matchedProd.unit}
                      </span>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Saisie directe du nom avec suggestions */}
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text"
                      list="stock-products-datalist"
                      className="form-input"
                      placeholder="Tapez le nom du produit (ex: Riz Brisé 25kg, Huile...)"
                      value={mvtProductName}
                      onChange={e => {
                        const val = e.target.value;
                        setMvtProductName(val);
                        const matched = products.find(p => p.name.toLowerCase() === val.trim().toLowerCase());
                        if (matched) {
                          setMvtProductId(matched.id);
                        } else {
                          setMvtProductId('');
                        }
                      }}
                      autoFocus
                    />
                    <datalist id="stock-products-datalist">
                      {products.map(p => (
                        <option key={p.id} value={p.name}>
                          En stock : {p.stock} {p.unit} ({p.reference})
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {/* Sélecteur déroulant alternatif */}
                  <select 
                    className="form-select" 
                    style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
                    value={mvtProductId} 
                    onChange={e => {
                      const pId = e.target.value;
                      setMvtProductId(pId);
                      const p = products.find(x => x.id === pId);
                      if (p) setMvtProductName(p.name);
                      else setMvtProductName('');
                    }}
                  >
                    <option value="">-- Ou choisir dans la liste déroulante ({products.length} articles) --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock actuel : {p.stock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Quantité *</label>
                <input 
                  className="form-input" 
                  type="number" 
                  min={1} 
                  value={mvtQuantity} 
                  onChange={e => setMvtQuantity(e.target.value === '' ? '' : Number(e.target.value))} 
                  onFocus={e => e.target.select()}
                  placeholder="1"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Raison</label>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(Facultatif)</span>
                </div>
                <input 
                  className="form-input" 
                  type="text" 
                  value={mvtReason} 
                  onChange={e => setMvtReason(e.target.value)} 
                  placeholder={mvtType === 'in' ? "Ex: Achat fournisseur, Réapprovisionnement (facultatif)" : "Ex: Vente directe, Ajustement, Perte (facultatif)"} 
                />
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
                  <input 
                    className="form-input" 
                    type="number" 
                    value={editStock} 
                    onChange={e => setEditStock(e.target.value === '' ? '' : Number(e.target.value))} 
                    onFocus={e => e.target.select()}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock minimum</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    value={editMinStock} 
                    onChange={e => setEditMinStock(e.target.value === '' ? '' : Number(e.target.value))} 
                    onFocus={e => e.target.select()}
                    placeholder="0"
                  />
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
