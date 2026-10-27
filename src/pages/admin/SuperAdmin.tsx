import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { PlatformSettings } from '../../types';

export default function SuperAdmin() {
  const { 
    currentUser, 
    users, 
    updateUserStatus, 
    updateUserPlan,
    deletePlatformUser, 
    platformSettings, 
    updatePlatformSettings, 
    addToast,
    refreshUsers,
    isSuperAdmin
  } = useApp();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'contacts' | 'plans' | 'users'>('contacts');

  // Protection stricte : redirection si non Super Admin
  React.useEffect(() => {
    if (!isSuperAdmin) {
      addToast({
        title: 'Accès restreint',
        message: 'Cette console est strictement réservée à l\'administrateur principal de la plateforme.',
        type: 'error'
      });
      navigate('/dashboard', { replace: true });
    }
  }, [isSuperAdmin, navigate, addToast]);

  // Recharger la liste des utilisateurs depuis Supabase si Super Admin
  React.useEffect(() => {
    if (isSuperAdmin) {
      refreshUsers();
    }
  }, [isSuperAdmin, refreshUsers]);

  if (!isSuperAdmin) {
    return null;
  }

  const cleanPhone = (val: string) => {
    if (!val) return '';
    if (val.includes('wa.me/')) {
      const raw = val.split('wa.me/')[1]?.split('?')[0]?.replace(/\D/g, '') || '';
      if (raw.startsWith('221') && raw.length >= 12) {
        return `+${raw.slice(0, 3)} ${raw.slice(3, 5)} ${raw.slice(5, 8)} ${raw.slice(8, 10)} ${raw.slice(10, 12)}`;
      }
      return raw ? `+${raw}` : val;
    }
    return val;
  };

  // Contact form state
  const [formData, setFormData] = useState<PlatformSettings>(() => ({
    ...platformSettings,
    whatsapp: cleanPhone(platformSettings.whatsapp)
  }));

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...platformSettings,
      whatsapp: cleanPhone(platformSettings.whatsapp)
    }));
  }, [platformSettings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformSettings(formData);
    addToast({
      title: 'Paramètres enregistrés',
      message: 'Les modifications ont été sauvegardées et appliquées sur tout le site.',
      type: 'success'
    });
  };

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleToggleStatus = async (userId: string, currentStatus?: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    setProcessingId(userId);
    try {
      await updateUserStatus(userId, nextStatus);
      await refreshUsers();
      addToast({
        title: 'Statut utilisateur modifié',
        message: `Le compte a été ${nextStatus === 'active' ? 'réactivé avec succès' : 'suspendu (mode consultation seule activé)'}.`,
        type: 'info'
      });
    } catch (e) {
      addToast({ title: 'Erreur', message: 'Impossible de modifier le statut.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleTogglePlan = async (userId: string, currentPlan?: 'free' | 'pro') => {
    const nextPlan = currentPlan === 'pro' ? 'free' : 'pro';
    setProcessingId(userId);
    try {
      await updateUserPlan(userId, nextPlan);
      await refreshUsers();
      addToast({
        title: 'Formule mise à jour',
        message: `Le compte est désormais en formule ${nextPlan.toUpperCase()}.`,
        type: 'success'
      });
    } catch (e) {
      addToast({ title: 'Erreur', message: 'Impossible de modifier la formule.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      addToast({ title: 'Action impossible', message: 'Vous ne pouvez pas supprimer votre propre compte Super Admin.', type: 'error' });
      return;
    }
    if (window.confirm(`Confirmez-vous la suppression définitive du compte de ${userName} ?\n\nAttention : L'utilisateur sera éliminé de la base de données. Pour accéder à nouveau au site, il devra impérativement se réinscrire.`)) {
      setProcessingId(userId);
      try {
        await deletePlatformUser(userId);
        await refreshUsers();
        addToast({ 
          title: 'Compte définitivement supprimé', 
          message: `Le compte de ${userName} a été éliminé de la base de données.`, 
          type: 'success' 
        });
      } catch (e) {
        addToast({ title: 'Erreur', message: 'Impossible de supprimer le compte.', type: 'error' });
      } finally {
        setProcessingId(null);
      }
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status !== 'suspended').length;
  const proUsers = users.filter(u => u.plan === 'pro').length;
  const freeUsers = users.filter(u => u.plan !== 'pro').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ 
                background: 'linear-gradient(135deg, #15803d, #166534)', 
                color: '#fff', 
                fontSize: '11px', 
                fontWeight: 700, 
                padding: '3px 8px', 
                borderRadius: '6px',
                letterSpacing: '0.5px'
              }}>
                👑 ESPACE SUPER ADMIN
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-primary-600)', fontWeight: 600 }}>
                Pilotage Plateforme
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '4px 0' }}>Console d'Administration</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Gérez les coordonnées publiques du site, activez les versions gratuites/payantes et supervisez les accès utilisateurs.
            </p>
          </div>
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/dashboard')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ← Retour au Dashboard
          </button>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px', 
        marginBottom: '28px' 
      }}>
        <div className="stat-card" style={{ padding: '20px' }}>
          <div className="stat-card-content">
            <span className="stat-card-label">Total Utilisateurs</span>
            <span className="stat-card-value" style={{ fontSize: '28px', color: 'var(--color-primary-600)' }}>{totalUsers}</span>
            <span className="stat-card-sub">{activeUsers} comptes actifs</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '20px' }}>
          <div className="stat-card-content">
            <span className="stat-card-label">Formules Pro (Payantes)</span>
            <span className="stat-card-value" style={{ fontSize: '28px', color: 'var(--color-success)' }}>{proUsers}</span>
            <span className="stat-card-sub">{freeUsers} en version gratuite</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '20px' }}>
          <div className="stat-card-content">
            <span className="stat-card-label">Mode de la Plateforme</span>
            <span className="stat-card-value" style={{ fontSize: '18px', fontWeight: 700 }}>
              {formData.enablePaidPlan ? 'Paiement Activé' : '100% Gratuit'}
            </span>
            <span className="stat-card-sub">
              {formData.proMonthlyPrice.toLocaleString('fr-FR')} FCFA / mois
            </span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '20px' }}>
          <div className="stat-card-content">
            <span className="stat-card-label">Support & WhatsApp</span>
            <span className="stat-card-value" style={{ fontSize: '16px', fontWeight: 700 }}>{formData.phone}</span>
            <span className="stat-card-sub">{formData.email}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('contacts')}
          style={{
            padding: '12px 18px',
            fontWeight: 600,
            fontSize: '14px',
            color: activeTab === 'contacts' ? 'var(--color-primary-600)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'contacts' ? '2.5px solid var(--color-primary-600)' : '2.5px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📞 Coordonnées & Réseaux Sociaux
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '12px 18px',
            fontWeight: 600,
            fontSize: '14px',
            color: activeTab === 'plans' ? 'var(--color-primary-600)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'plans' ? '2.5px solid var(--color-primary-600)' : '2.5px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          💳 Formules & Paiements (Gratuit / Payant)
        </button>

        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 18px',
            fontWeight: 600,
            fontSize: '14px',
            color: activeTab === 'users' ? 'var(--color-primary-600)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'users' ? '2.5px solid var(--color-primary-600)' : '2.5px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          👥 Utilisateurs & Inscrits ({totalUsers})
        </button>
      </div>

      {/* TAB 1: CONTACTS & SOCIALS */}
      {activeTab === 'contacts' && (
        <div className="content-card" style={{ padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>Coordonnées Publiques du Site</h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Les modifications saisies ici sont directement répercutées sur la page d'accueil et le pied de page du site.
            </p>
          </div>

          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  📞 Numéro d'appel / Support
                </label>
                <input 
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                  placeholder="+221 77 000 00 00"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  💬 Numéro de téléphone WhatsApp
                </label>
                <input 
                  type="text"
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                  placeholder="+221 77 000 00 00"
                  required
                />
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Le lien direct de discussion WhatsApp (wa.me) sera généré automatiquement.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  ✉️ Email officiel de contact
                </label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                  placeholder="contact@taxawu.com"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  📸 Lien Instagram
                </label>
                <input 
                  type="text"
                  value={formData.instagram}
                  onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                  placeholder="https://instagram.com/taxawu_gestion"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  📘 Lien Facebook
                </label>
                <input 
                  type="text"
                  value={formData.facebook || ''}
                  onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                  placeholder="https://facebook.com/taxawugestion"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  🎵 Lien TikTok
                </label>
                <input 
                  type="text"
                  value={formData.tiktok || ''}
                  onChange={e => setFormData({ ...formData, tiktok: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                  placeholder="https://tiktok.com/@taxawugestion"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  💼 Lien LinkedIn
                </label>
                <input 
                  type="text"
                  value={formData.linkedin || ''}
                  onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                  placeholder="https://linkedin.com/company/taxawugestion"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  📢 Slogan / Message d'accueil
                </label>
                <input 
                  type="text"
                  value={formData.announcement || ''}
                  onChange={e => setFormData({ ...formData, announcement: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                  placeholder="Plateforme officielle Taxawu Gestion"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 700 }}
            >
              Enregistrer les coordonnées
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: PLANS & PAYMENTS */}
      {activeTab === 'plans' && (
        <div className="content-card" style={{ padding: '28px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>Configuration des Formules & Paiements</h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Activez ou désactivez la formule gratuite, la formule payante, fixez les prix et configurez les moyens de paiement des abonnements.
            </p>
          </div>

          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', marginBottom: '24px' }}>
              
              {/* Formule Gratuite toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>Formule Gratuite (Accès Découverte)</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Permet aux nouveaux utilisateurs de s'inscrire et démarrer sans frais.</div>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={formData.enableFreePlan}
                    onChange={e => setFormData({ ...formData, enableFreePlan: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#16a34a' }}
                  />
                </label>
              </div>

              {/* Formule Payante toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>Formule Pro Payante (Abonnement)</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active l'abonnement payant pour débloquer les fonctionnalités premium.</div>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={formData.enablePaidPlan}
                    onChange={e => setFormData({ ...formData, enablePaidPlan: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#16a34a' }}
                  />
                </label>
              </div>

              {/* Prix mensuel */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Tarif de l'abonnement mensuel (FCFA)
                </label>
                <input 
                  type="number"
                  value={formData.proMonthlyPrice}
                  onChange={e => setFormData({ ...formData, proMonthlyPrice: Number(e.target.value) || 0 })}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                  min="0"
                  step="500"
                />
              </div>

              {/* Méthodes de paiement acceptées */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
                  Moyens de paiement acceptés pour les abonnements
                </label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={formData.paymentMethods?.wave}
                      onChange={e => setFormData({
                        ...formData,
                        paymentMethods: { ...formData.paymentMethods, wave: e.target.checked }
                      })}
                      style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                    />
                    <span>Wave Sénégal 📲</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={formData.paymentMethods?.orangeMoney}
                      onChange={e => setFormData({
                        ...formData,
                        paymentMethods: { ...formData.paymentMethods, orangeMoney: e.target.checked }
                      })}
                      style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                    />
                    <span>Orange Money 🟠</span>
                  </label>
                </div>
              </div>

            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 700 }}
            >
              Enregistrer les formules
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: USERS & SUBSCRIBERS */}
      {activeTab === 'users' && (
        <div className="data-table-wrapper">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>Liste des Utilisateurs Inscrits ({totalUsers})</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              🔒 <strong>Respect de la vie privée garanti :</strong> Vous ne pouvez pas accéder aux données personnelles ni aux boutiques des commerçants. Vous pouvez uniquement gérer leurs formules d'accès et modérer leurs comptes.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Nom Boutique</th>
                  <th>Email de connexion</th>
                  <th>Date Inscription</th>
                  <th>Formule</th>
                  <th>Statut Compte</th>
                  <th style={{ textAlign: 'right' }}>Gestion Accès</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const isSuper = user.role === 'super_admin';
                  const isCurrentUser = user.id === currentUser?.id;
                  const isPro = user.plan === 'pro';

                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            background: isSuper ? '#15803d' : '#2563eb', 
                            color: '#fff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '14px'
                          }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {user.name} {isCurrentUser && <span style={{ fontSize: '11px', color: 'var(--color-primary-600)' }}>(Vous)</span>}
                            </div>
                            {isSuper && <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 700 }}>Super Admin</span>}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 500 }}>{user.shopName || 'Boutique Taxawu'}</span>
                      </td>

                      <td>
                        <div style={{ fontSize: '13px' }}>{user.email}</div>
                      </td>

                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {user.createdAt}
                      </td>

                      <td>
                        <span className={`badge ${isPro ? 'badge-primary' : 'badge-info'}`}>
                          {isPro ? '👑 Formule Pro' : 'Gratuit'}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${user.status === 'suspended' ? 'badge-error' : 'badge-success'}`}>
                          {user.status === 'suspended' ? 'Suspendu' : 'Actif'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {!isSuper ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleTogglePlan(user.id, user.plan)}
                              disabled={processingId === user.id}
                              style={{ padding: '6px 10px', fontSize: '12px', opacity: processingId === user.id ? 0.6 : 1 }}
                              title="Basculer entre Gratuit et Pro"
                            >
                              {isPro ? 'Passer Gratuit' : 'Passer Pro ⭐'}
                            </button>

                            <button
                              className="btn btn-outline"
                              onClick={() => handleToggleStatus(user.id, user.status)}
                              disabled={processingId === user.id}
                              style={{ 
                                padding: '6px 10px', 
                                fontSize: '12px', 
                                color: user.status === 'suspended' ? 'var(--color-success)' : 'var(--color-warning)',
                                opacity: processingId === user.id ? 0.6 : 1
                              }}
                            >
                              {user.status === 'suspended' ? 'Activer' : 'Suspendre'}
                            </button>

                            <button
                              className="btn btn-outline"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              disabled={processingId === user.id}
                              style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--color-error)', opacity: processingId === user.id ? 0.6 : 1 }}
                            >
                              Supprimer
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Compte Maître</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
