import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Category } from '../../types';

export default function Categories({ hideHeader = false }: { hideHeader?: boolean }) {
  const { categories, setCategories, deleteCategory, addToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#16a34a');

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormColor('#16a34a');
    setEditingCategory(null);
  };

  const openNew = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormColor(category.color);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      addToast({ title: 'Erreur', message: 'Le nom de la catégorie est obligatoire.', type: 'error' });
      return;
    }

    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? {
        ...c, name: formName, description: formDescription, color: formColor,
      } : c));
      addToast({ title: 'Catégorie modifiée', message: `${formName} a été mis à jour.`, type: 'success' });
    } else {
      const newCat: Category = {
        id: `cat${Date.now()}`,
        name: formName,
        description: formDescription,
        productCount: 0,
        color: formColor,
      };
      setCategories(prev => [...prev, newCat]);
      addToast({ title: 'Catégorie créée', message: `${formName} a été ajoutée.`, type: 'success' });
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const cat = categories.find(c => c.id === id);
    deleteCategory(id);
    addToast({ title: 'Catégorie supprimée', message: `${cat?.name || 'La catégorie'} a été retirée.`, type: 'success' });
  };

  return (
    <div>
      {!hideHeader && (
        <div className="page-header">
          <div className="page-header-top">
            <div>
              <h1>Catégories</h1>
              <p>Gérez les familles de produits.</p>
            </div>
            <button className="btn btn-primary" onClick={openNew}>
              + Nouvelle Catégorie
            </button>
          </div>
        </div>
      )}
      {hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button className="btn btn-primary" onClick={openNew}>
            + Nouvelle Catégorie
          </button>
        </div>
      )}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Couleur</th>
              <th>Nom de la catégorie</th>
              <th>Description</th>
              <th>Produits associés</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td>
                  <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: cat.color }} />
                </td>
                <td style={{ fontWeight: 600 }}>{cat.name}</td>
                <td style={{ color: 'var(--text-muted)' }}>{cat.description || '—'}</td>
                <td>{cat.productCount} produits</td>
                <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                  <button className="btn-ghost" style={{ padding: '4px' }} onClick={() => openEdit(cat)} title="Modifier">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                  <button className="btn-ghost" style={{ padding: '4px', color: 'var(--color-error)' }} onClick={() => handleDelete(cat.id)} title="Supprimer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nouvelle/Modifier Catégorie */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nom de la catégorie *</label>
                <input className="form-input" type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Alimentation" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Description de la catégorie..." />
              </div>
              <div className="form-group">
                <label className="form-label">Couleur</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formColor}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingCategory ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
