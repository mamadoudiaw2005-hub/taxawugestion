import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../data/mockData';
import type { Product } from '../../types';

export default function Products({ hideHeader = false }: { hideHeader?: boolean }) {
  const { products, setProducts, deleteProduct, categories, addToast, shopSettings } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formRef, setFormRef] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBuyPrice, setFormBuyPrice] = useState(0);
  const [formSellPrice, setFormSellPrice] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [formMinStock, setFormMinStock] = useState(0);
  const [formUnit, setFormUnit] = useState('pièce');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormName(''); setFormRef(''); setFormCategory(''); setFormBuyPrice(0);
    setFormSellPrice(0); setFormStock(0); setFormMinStock(0); setFormUnit('pièce');
    setEditingProduct(null);
  };

  const openNew = () => {
    resetForm();
    setFormRef(`PRD-${String(products.length + 1).padStart(3, '0')}`);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name); setFormRef(product.reference); setFormCategory(product.category);
    setFormBuyPrice(product.buyPrice); setFormSellPrice(product.sellPrice);
    setFormStock(product.stock); setFormMinStock(product.minStock); setFormUnit(product.unit);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formName || !formCategory) {
      addToast({ title: 'Erreur', message: 'Le nom et la catégorie sont obligatoires.', type: 'error' });
      return;
    }
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p, name: formName, reference: formRef, category: formCategory, buyPrice: formBuyPrice,
        sellPrice: formSellPrice, stock: formStock, minStock: formMinStock, unit: formUnit,
      } : p));
      addToast({ title: 'Produit modifié', message: `${formName} a été mis à jour.`, type: 'success' });
    } else {
      const newProduct: Product = {
        id: `p${Date.now()}`, name: formName, reference: formRef, category: formCategory,
        buyPrice: formBuyPrice, sellPrice: formSellPrice, stock: formStock, minStock: formMinStock,
        unit: formUnit, createdAt: new Date().toISOString(),
      };
      setProducts(prev => [newProduct, ...prev]);
      addToast({ title: 'Produit ajouté', message: `${formName} a été ajouté au catalogue.`, type: 'success' });
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    addToast({ title: 'Produit supprimé', message: 'Le produit a été retiré du catalogue.', type: 'success' });
  };

  const downloadCatalogPDF = () => {
    try {
      const doc = new jsPDF();
      const shopTitle = shopSettings?.shopName || 'Taxawou Gestion';

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
              <button className="btn btn-primary" onClick={openNew}>
                + Ajouter un produit
              </button>
            </div>
          </div>
        </div>
      )}
      {hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button className="btn btn-primary" onClick={openNew}>
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
                    <button className="btn-ghost" style={{ padding: '4px' }} onClick={() => openEdit(product)} title="Modifier">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button className="btn-ghost" style={{ padding: '4px', color: 'var(--color-error)' }} onClick={() => handleDelete(product.id)} title="Supprimer">
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
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nom du produit *</label>
                <input className="form-input" type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Riz Brisé 25kg" />
              </div>
              <div className="form-group">
                <label className="form-label">Catégorie *</label>
                <select className="form-select" value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                  <option value="">-- Sélectionner --</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Montant (Prix de vente)</label>
                  <input className="form-input" type="number" value={formSellPrice} onChange={e => setFormSellPrice(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock initial</label>
                  <input className="form-input" type="number" value={formStock} onChange={e => setFormStock(Number(e.target.value))} />
                </div>
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
