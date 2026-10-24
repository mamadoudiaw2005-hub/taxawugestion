import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { User } from '../../types';

export default function Utilisateurs() {
  const { users, setUsers, deleteUser, addToast, isSuperAdmin, currentUser, refreshUsers } = useApp();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const canManageUsers = isSuperAdmin;

  useEffect(() => {
    if (isSuperAdmin) {
      refreshUsers();
    }
  }, [isSuperAdmin, refreshUsers]);

  useEffect(() => {
    if (!canManageUsers) {
      addToast({
        title: 'Accès restreint',
        message: 'La gestion des utilisateurs est strictement réservée au Super Administrateur.',
        type: 'warning'
      });
      navigate('/dashboard', { replace: true });
    }
  }, [canManageUsers, navigate, addToast]);

  if (!canManageUsers) {
    return null;
  }

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('Caissier');

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('Caissier');
  };

  const openNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formEmail.trim()) {
      addToast({ title: 'Erreur', message: 'Le nom et l\'email sont obligatoires.', type: 'error' });
      return;
    }

    const newUser: User = {
      id: `usr${Date.now()}`,
      name: formName,
      email: formEmail,
      role: formRole === 'Administrateur' ? 'admin' : formRole === 'Gestionnaire' ? 'manager' : 'cashier',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers(prev => [...prev, newUser]);
    addToast({ title: 'Utilisateur ajouté', message: `${formName} a été ajouté.`, type: 'success' });
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteUser(id);
    addToast({ title: 'Utilisateur supprimé', message: 'L\'utilisateur a été retiré.', type: 'success' });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1>Utilisateurs</h1>
            <p>Gérez les accès à la plateforme.</p>
          </div>
          <button className="btn btn-primary" onClick={openNew}>
            + Nouvel Utilisateur
          </button>
        </div>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: 600 }}>{user.name}</td>
                <td>{user.email}</td>
                <td><span className="badge badge-gray">{user.role}</span></td>
                <td style={{ textAlign: 'right' }}>
                  {user.id !== '1' ? (
                    <button className="btn-ghost" style={{ padding: '4px', color: 'var(--color-error)' }} onClick={() => handleDelete(user.id)} title="Supprimer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nouvel Utilisateur */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>Nouvel Utilisateur</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nom complet *</label>
                <input className="form-input" type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Moussa Diop" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Ex: moussa@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Rôle</label>
                <select className="form-input" value={formRole} onChange={e => setFormRole(e.target.value)}>
                  <option value="Administrateur">Administrateur</option>
                  <option value="Manager">Manager</option>
                  <option value="Caissier">Caissier</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
