import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../data/mockData';
import type { Product } from '../../types';

export default function Products({ hideHeader = false }: { hideHeader?: boolean }) {
  const { products, setProducts, deleteProduct, categories, addToast, shopSettings, isSuspended, checkCanPerformAction, currency } = useApp();
  const activeCurrency = currency || shopSettings?.currency || 'FCFA';

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formRef, setFormRef] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBuyPrice, setFormBuyPrice] = useState<number | ''>('');
  const [formSellPrice, setFormSellPrice] = useState<number | ''>('');
  const [formStock, setFormStock] = useState<number | ''>('');
  const [formMinStock, setFormMinStock] = useState<number | ''>('');
  const [formUnit, setFormUnit] = useState('pièce');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormName('');
    setFormRef('');
    setFormCategory('');
    setFormBuyPrice('');
    setFormSellPrice('');
    setFormStock('');
    setFormMinStock('');
    setFormUnit('pièce');
    setShowAdvanced(false);
    setEditingProduct(null);
  };

  const openNew = () => {
    if (!checkCanPerformAction("l'ajout de produit")) return;
    resetForm();
    setFormRef(`PRD-${String(products.length + 1).padStart(3, '0')}`);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    if (!checkCanPerformAction("la modification de produit")) return;
    setEditingProduct(product);
    setFormName(product.name);
    setFormRef(product.reference);
    setFormCategory(product.category || '');
    setFormBuyPrice(product.buyPrice ? product.buyPrice : '');
    setFormSellPrice(product.sellPrice ? product.sellPrice : '');
    setFormStock(typeof product.stock === 'number' ? product.stock : '');
    setFormMinStock(product.minStock ? product.minStock : '');
    setFormUnit(product.unit || 'pièce');
    setShowAdvanced(Boolean((product.buyPrice && product.buyPrice > 0) || (product.minStock && product.minStock > 0)));
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!checkCanPerformAction("l'enregistrement de produit")) return;
    if (!formName.trim()) {
      addToast({ title: 'Erreur', message: 'Le nom du produit est obligatoire.', type: 'error' });
      return;
    }

    const finalCategory = formCategory.trim() || 'Général';
    const buyPriceNum = formBuyPrice === '' ? 0 : Number(formBuyPrice);
    const sellPriceNum = formSellPrice === '' ? 0 : Number(formSellPrice);
    const stockNum = formStock === '' ? 0 : Number(formStock);
    const minStockNum = formMinStock === '' ? 0 : Number(formMinStock);

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p,
        name: formName.trim(),
        reference: formRef || p.reference,
        category: finalCategory,
        buyPrice: buyPriceNum,
        sellPrice: sellPriceNum,
        stock: stockNum,
        minStock: minStockNum,
        unit: formUnit || 'pièce',
      } : p));
      addToast({ title: 'Produit modifié', message: `${formName} a été mis à jour avec succès.`, type: 'success' });
    } else {
      const newProduct: Product = {
        id: `p${Date.now()}`,
        name: formName.trim(),
        reference: formRef || `PRD-${String(products.length + 1).padStart(3, '0')}`,
        category: finalCategory,
        buyPrice: buyPriceNum,
        sellPrice: sellPriceNum,
        stock: stockNum,
        minStock: minStockNum,
        unit: formUnit || 'pièce',
        createdAt: new Date().toISOString(),
      };
      setProducts(prev => [newProduct, ...prev]);
      addToast({ title: 'Produit ajouté', message: `${formName} a été ajouté au catalogue.`, type: 'success' });
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!checkCanPerformAction("la suppression de produit")) return;
    deleteProduct(id);
    addToast({ title: 'Produit supprimé', message: 'Le produit a été retiré du catalogue.', type: 'success' });
  };

  const downloadCatalogPDF = () => {
    try {
      const doc = new jsPDF();
      const shopTitle = shopSettings?.shopName || 'Taxawu Gestion';

      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CATALOGUE DES PRODUITS & PRIX', 14, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${shopTitle} - Exporté le : ${formatDateTime(new Date().toISOString())}`, 14, 21);

      autoTable(doc, {
        startY: 34,
        head: [['Réf.', 'Article', 'Catégorie', 'Prix Achat', 'Prix Vente', 'Stock', 'Unité']],
        body: filteredProducts.map(p => [
          p.reference,
          p.name,
          p.category,
          formatCurrency(p.buyPrice),
          formatCurrency(p.sellPrice),
          `${p.stock}`,
          p.unit || 'pcs'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8.5 },
      });

      doc.save(`catalogue_produits_${new Date().toISOString().slice(0, 10)}.pdf`);
      addToast({ title: 'Catalogue PDF généré', message: 'Le catalogue a été téléchargé en PDF.', type: 'success' });
    } catch (err) {
      console.error(err);
      addToast({ title: 'Erreur', message: 'Échec de génération du catalogue PDF.', type: 'error' });
    }
  };

  return (
    <div>
      {!hideHeader && (
        <div className="page-header">
          <div className="page-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1>Produits</h1>
              <p>Gérez votre catalogue d'articles et vos prix.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                className="btn btn-outline" 
                onClick={downloadCatalogPDF}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Télécharger le catalogue (PDF)
              </button>
              <button 
                className="btn btn-primary" 
                onClick={openNew}
                disabled={isSuspended}
                style={{ opacity: isSuspended ? 0.6 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }}
                title={isSuspended ? "Action bloquée : Compte suspendu" : undefined}
              >
                + Ajouter un produit
              </button>
            </div>
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
            + Ajouter un produit
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
            <select className="form-select" style={{ padding: '8px 32px 8px 12px' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Nom du produit</th>
                <th>Catégorie</th>
                <th>Prix d'achat</th>
                <th>Prix de vente</th>
                <th>Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td style={{ fontWeight: 500 }}>{product.reference}</td>
                  <td>{product.name}</td>
                  <td><span className="badge badge-gray">{product.category}</span></td>
                  <td>{formatCurrency(product.buyPrice)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>{formatCurrency(product.sellPrice)}</td>
                  <td>
                    <span className={`badge ${product.stock <= product.minStock ? (product.stock === 0 ? 'badge-error' : 'badge-warning') : 'badge-success'}`}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '4px', opacity: isSuspended ? 0.4 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }} 
                      onClick={() => openEdit(product)} 
                      disabled={isSuspended}
                      title={isSuspended ? "Compte suspendu : Modification impossible" : "Modifier"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '4px', color: 'var(--color-error)', opacity: isSuspended ? 0.4 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }} 
                      onClick={() => handleDelete(product.id)} 
                      disabled={isSuspended}
                      title={isSuspended ? "Compte suspendu : Suppression impossible" : "Supprimer"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-title">
                        {products.length === 0 ? 'Votre catalogue est vide' : 'Aucun produit trouvé'}
                      </div>
                      <div className="empty-state-text">
                        {products.length === 0 
                          ? 'Cliquez sur « + Ajouter un produit » pour enregistrer votre premier article.'
                          : 'Modifiez vos critères de recherche.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="data-table-footer">
          <div>Affichage de {filteredProducts.length} produits</div>
        </div>
      </div>

      {/* Modal Ajouter/Modifier Produit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Nom du produit *</label>
                <input 
                  className="form-input" 
                  type="text" 
                  value={formName} 
                  onChange={e => setFormName(e.target.value)} 
                  placeholder="Ex: Riz Brisé 25kg, Huile Dinor 5L, Sucre..." 
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Catégorie</label>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(Facultatif)</span>
                </div>
                <select className="form-select" value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                  <option value="">-- Sans catégorie (Général) --</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Prix de vente</label>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: 'var(--color-primary-600)', 
                      background: 'var(--color-primary-50, rgba(99, 102, 241, 0.1))', 
                      padding: '2px 8px', 
                      borderRadius: '4px' 
                    }}>
                      {activeCurrency}
                    </span>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      className="form-input" 
                      type="number" 
                      min={0}
                      step="any"
                      value={formSellPrice} 
                      onChange={e => setFormSellPrice(e.target.value === '' ? '' : Number(e.target.value))} 
                      onFocus={e => e.target.select()}
                      placeholder="0"
                      style={{ paddingRight: '64px' }}
                    />
                    <span style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      fontSize: '12px', 
                      fontWeight: 700, 
                      color: 'var(--color-primary-600)', 
                      pointerEvents: 'none' 
                    }}>
                      {activeCurrency}
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Stock initial</label>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({formUnit || 'pièce'})</span>
                  </div>
                  <input 
                    className="form-input" 
                    type="number" 
                    min={0}
                    step="any"
                    value={formStock} 
                    onChange={e => setFormStock(e.target.value === '' ? '' : Number(e.target.value))} 
                    onFocus={e => e.target.select()}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Options avancées (Prix d'achat, Unité, Réf) */}
              <div style={{ marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary-600)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 0'
                  }}
                >
                  <span>{showAdvanced ? '▼ Masquer les options supplémentaires' : '▶ Plus d\'options (Prix d\'achat, unité, référence)'}</span>
                </button>

                {showAdvanced && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '12px', 
                    background: 'var(--bg-secondary, #f8fafc)', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color, #e2e8f0)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                  }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '13px' }}>Prix d'achat ({activeCurrency})</label>
                      <input 
                        className="form-input" 
                        type="number" 
                        min={0}
                        step="any"
                        value={formBuyPrice} 
                        onChange={e => setFormBuyPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        onFocus={e => e.target.select()}
                        placeholder="0"
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '13px' }}>Unité de mesure</label>
                      <select className="form-select" value={formUnit} onChange={e => setFormUnit(e.target.value)}>
                        <option value="pièce">pièce</option>
                        <option value="kg">kg</option>
                        <option value="sac">sac</option>
                        <option value="carton">carton</option>
                        <option value="paquet">paquet</option>
                        <option value="bouteille">bouteille</option>
                        <option value="litre">litre</option>
                        <option value="mètre">mètre</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '13px' }}>Alerte stock minimum</label>
                      <input 
                        className="form-input" 
                        type="number" 
                        min={0}
                        value={formMinStock} 
                        onChange={e => setFormMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                        onFocus={e => e.target.select()}
                        placeholder="5"
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '13px' }}>Référence interne</label>
                      <input 
                        className="form-input" 
                        type="text" 
                        value={formRef} 
                        onChange={e => setFormRef(e.target.value)} 
                        placeholder="PRD-001"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingProduct ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
