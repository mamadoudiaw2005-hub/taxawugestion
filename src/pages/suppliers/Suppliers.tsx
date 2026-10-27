import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Supplier } from '../../types';

export default function Suppliers({ hideHeader = false }: { hideHeader?: boolean }) {
  const { suppliers, setSuppliers, deleteSupplier, addToast, isSuspended, checkCanPerformAction } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formName, setFormName] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.contactName ? s.contactName.toLowerCase().includes(search.toLowerCase()) : false) ||
    s.phone.includes(search)
  );

  const resetForm = () => {
    setFormName('');
    setFormContactName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setEditingSupplier(null);
  };

  const openNew = () => {
    if (!checkCanPerformAction("l'ajout de fournisseur")) return;
    resetForm();
    setShowModal(true);
  };

  const openEdit = (supplier: Supplier) => {
    if (!checkCanPerformAction("la modification de fournisseur")) return;
    setEditingSupplier(supplier);
    setFormName(supplier.name);
    setFormContactName(supplier.contactName || '');
    setFormPhone(supplier.phone);
    setFormEmail(supplier.email || '');
    setFormAddress(supplier.address || '');
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!checkCanPerformAction("l'enregistrement de fournisseur")) return;
    if (!formName.trim() || !formPhone.trim()) {
      addToast({ title: 'Erreur', message: 'L\'entreprise et le téléphone sont obligatoires.', type: 'error' });
      return;
    }

    if (editingSupplier) {
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? {
        ...s, name: formName, contactName: formContactName, phone: formPhone, email: formEmail, address: formAddress
      } : s));
      addToast({ title: 'Fournisseur modifié', message: `${formName} a été mis à jour.`, type: 'success' });
    } else {
      const newSupplier: Supplier = {
        id: `supp${Date.now()}`,
        name: formName,
        contactName: formContactName,
        phone: formPhone,
        email: formEmail,
        address: formAddress,
        totalPurchases: 0,
        balance: 0,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setSuppliers(prev => [...prev, newSupplier]);
      addToast({ title: 'Fournisseur ajouté', message: `${formName} a été ajouté.`, type: 'success' });
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!checkCanPerformAction("la suppression de fournisseur")) return;
    const supplier = suppliers.find(s => s.id === id);
    deleteSupplier(id);
    addToast({ title: 'Fournisseur supprimé', message: `${supplier?.name || 'Le fournisseur'} a été retiré.`, type: 'success' });
  };

  return (
    <div>
      {!hideHeader && (
        <div className="page-header">
          <div className="page-header-top">
            <div>
              <h1>Fournisseurs</h1>
              <p>Gérez vos fournisseurs et vos contacts d'approvisionnement.</p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={openNew}
              disabled={isSuspended}
              style={{ opacity: isSuspended ? 0.6 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }}
              title={isSuspended ? "Action bloquée : Compte suspendu" : undefined}
            >
              + Ajouter un fournisseur
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
            + Ajouter un fournisseur
          </button>
        </div>
      )}

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Rechercher par entreprise ou contact..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Contact</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td style={{ fontWeight: 600 }}>{supplier.name}</td>
                  <td>{supplier.contactName || '-'}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.email || '-'}</td>
                  <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '4px', opacity: isSuspended ? 0.4 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }} 
                      onClick={() => openEdit(supplier)} 
                      disabled={isSuspended}
                      title={isSuspended ? "Compte suspendu : Modification impossible" : "Modifier"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '4px', color: 'var(--color-error)', opacity: isSuspended ? 0.4 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }} 
                      onClick={() => handleDelete(supplier.id)} 
                      disabled={isSuspended}
                      title={isSuspended ? "Compte suspendu : Suppression impossible" : "Supprimer"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-title">Aucun fournisseur trouvé</div>
                      <div className="empty-state-text">Modifiez vos critères de recherche.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouveau/Modifier Fournisseur */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>{editingSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Entreprise *</label>
                <input className="form-input" type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nom de l'entreprise" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact</label>
                <input className="form-input" type="text" value={formContactName} onChange={e => setFormContactName(e.target.value)} placeholder="Nom du contact" />
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone *</label>
                <input className="form-input" type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="Ex: 77 123 45 67" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Ex: contact@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Adresse</label>
                <input className="form-input" type="text" value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="Adresse du fournisseur" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingSupplier ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
