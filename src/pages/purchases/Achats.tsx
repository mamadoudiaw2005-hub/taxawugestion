import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { Purchase } from '../../types';

export default function Achats({ hideHeader = false }: { hideHeader?: boolean }) {
  const { purchases, setPurchases, deletePurchase, suppliers, addToast, isSuspended, checkCanPerformAction } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; unitPrice: number; total: number }[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);

  const filteredPurchases = purchases.filter(p =>
    p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    p.reference.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setSupplierId('');
    setItems([]);
    setPaidAmount(0);
    setEditingPurchase(null);
  };

  const openNew = () => {
    if (!checkCanPerformAction("l'enregistrement d'achat")) return;
    resetForm();
    setShowModal(true);
  };

  const openEdit = (purchase: Purchase) => {
    if (!checkCanPerformAction("la modification d'achat")) return;
    setEditingPurchase(purchase);
    setSupplierId(purchase.supplierId);
    setItems([...purchase.items]);
    setPaidAmount(purchase.paid);
    setShowModal(true);
  };

  const addItem = () => {
    setItems([...items, { productId: `prod-${Date.now()}`, productName: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...items];
    if (field === 'productName') {
      updated[index] = { ...updated[index], productName: String(value) };
    } else if (field === 'quantity') {
      updated[index] = { ...updated[index], quantity: Number(value), total: Number(value) * updated[index].unitPrice };
    } else if (field === 'unitPrice') {
      updated[index] = { ...updated[index], unitPrice: Number(value), total: updated[index].quantity * Number(value) };
    }
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = () => {
    if (!checkCanPerformAction("l'enregistrement d'achat")) return;
    if (!supplierId || items.length === 0) {
      addToast({ title: 'Erreur', message: 'Veuillez sélectionner un fournisseur et ajouter des produits.', type: 'error' });
      return;
    }
    const supplier = suppliers.find(s => s.id === supplierId);
    const paymentStatus = paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    if (editingPurchase) {
      setPurchases(prev => prev.map(p => p.id === editingPurchase.id ? {
        ...p, supplierId, supplierName: supplier?.name || '', items, total: totalAmount, paid: paidAmount,
        paymentStatus: paymentStatus as Purchase['paymentStatus'],
      } : p));
      addToast({ title: 'Achat modifié', message: `Commande ${editingPurchase.reference} mise à jour.`, type: 'success' });
    } else {
      const newPurchase: Purchase = {
        id: `a${Date.now()}`, reference: `ACH-${String(purchases.length + 1).padStart(3, '0')}`,
        supplierId, supplierName: supplier?.name || '', items, total: totalAmount, paid: paidAmount,
        status: 'pending', paymentStatus: paymentStatus as Purchase['paymentStatus'],
        createdAt: new Date().toISOString(),
      };
      setPurchases(prev => [newPurchase, ...prev]);
      addToast({ title: 'Achat enregistré', message: `Commande ${newPurchase.reference} créée avec succès.`, type: 'success' });
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!checkCanPerformAction("la suppression d'achat")) return;
    deletePurchase(id);
    addToast({ title: 'Achat supprimé', message: 'La commande a été supprimée.', type: 'success' });
  };

  return (
    <div>
      {!hideHeader && (
        <div className="page-header">
          <div className="page-header-top">
            <div>
              <h1>Achats</h1>
              <p>Historique de vos commandes auprès des fournisseurs.</p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={openNew}
              disabled={isSuspended}
              style={{ opacity: isSuspended ? 0.6 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }}
              title={isSuspended ? "Action bloquée : Compte suspendu" : undefined}
            >
              + Nouvel Achat
            </button>
          </div>
        </div>
      )}
      {hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button 
            className="btn btn-primary" 
            onClick={openNew}
            disabled={isSuspended}
            style={{ opacity: isSuspended ? 0.6 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }}
            title={isSuspended ? "Action bloquée : Compte suspendu" : undefined}
          >
            + Nouvel Achat
          </button>
        </div>
      )}

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" placeholder="Rechercher un achat..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Fournisseur</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payé</th>
                <th>Statut</th>
                <th>Paiement</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map(purchase => (
                <tr key={purchase.id}>
                  <td style={{ fontWeight: 600 }}>{purchase.reference}</td>
                  <td>{purchase.supplierName}</td>
                  <td>{formatDate(purchase.createdAt)}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(purchase.total)}</td>
                  <td>{formatCurrency(purchase.paid)}</td>
                  <td>
                    <span className={`badge ${purchase.status === 'received' ? 'badge-success' : purchase.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                      {purchase.status === 'received' ? 'Reçu' : purchase.status === 'pending' ? 'En attente' : 'Annulé'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${purchase.paymentStatus === 'paid' ? 'badge-success' : purchase.paymentStatus === 'partial' ? 'badge-warning' : 'badge-error'}`}>
                      {purchase.paymentStatus === 'paid' ? 'Payé' : purchase.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '4px', opacity: isSuspended ? 0.4 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }} 
                      onClick={() => openEdit(purchase)} 
                      disabled={isSuspended}
                      title={isSuspended ? "Compte suspendu : Modification impossible" : "Modifier"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '4px', color: 'var(--color-error)', opacity: isSuspended ? 0.4 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }} 
                      onClick={() => handleDelete(purchase.id)} 
                      disabled={isSuspended}
                      title={isSuspended ? "Compte suspendu : Suppression impossible" : "Supprimer"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-title">Aucun achat enregistré</div>
                      <div className="empty-state-text">Vos réapprovisionnements apparaîtront ici.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouvel Achat / Modifier */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2>{editingPurchase ? 'Modifier l\'achat' : 'Nouvel Achat'}</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Fournisseur *</label>
                <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                  <option value="">-- Sélectionner un fournisseur --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="form-label" style={{ margin: 0 }}>Produits</label>
                  <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 13 }} onClick={addItem}>+ Ajouter</button>
                </div>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input className="form-input" type="text" placeholder="Nom du produit" value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)} />
                    <input className="form-input" type="number" placeholder="Qté" min={1} value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                    <input className="form-input" type="number" placeholder="Prix unit." value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                    <button className="btn-ghost" style={{ padding: '4px', color: 'var(--color-error)' }} onClick={() => removeItem(i)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div className="form-group">
                  <label className="form-label">Total</label>
                  <input className="form-input" type="text" value={formatCurrency(totalAmount)} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Montant payé</label>
                  <input className="form-input" type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingPurchase ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
