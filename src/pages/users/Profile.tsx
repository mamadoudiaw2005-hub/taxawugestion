import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { isSupabaseConfigured, supabase, supabaseAuth } from '../../lib/supabase';
import type { User } from '../../types';

export default function Profile() {
  const { currentUser, setCurrentUser, setUsers, addToast, isSuperAdmin } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [shopName, setShopName] = useState(currentUser?.shopName || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sécurité / Mot de passe
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setShopName(currentUser.shopName || '');
    }
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!name.trim()) {
      addToast({ title: 'Nom requis', message: 'Veuillez saisir votre nom complet.', type: 'error' });
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser: User = {
        ...currentUser,
        name: name.trim(),
        phone: phone.trim(),
        shopName: shopName.trim() || currentUser.shopName
      };

      // 1. Mettre à jour l'état local et la mémoire
      setCurrentUser(updatedUser);
      localStorage.setItem('taxawou_currentUser', JSON.stringify(updatedUser));
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

      // 2. Synchroniser sur Supabase (Auth + Table profiles)
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('profiles').upsert({
            id: updatedUser.id,
            name: updatedUser.name,
            phone: updatedUser.phone,
            shop_name: updatedUser.shopName,
            email: updatedUser.email
          });

          await supabase.auth.updateUser({
            data: {
              name: updatedUser.name,
              phone: updatedUser.phone,
              shopName: updatedUser.shopName
            }
          });
        } catch (sbErr) {
          console.warn('Sync Supabase profile warning:', sbErr);
        }
      }

      addToast({ 
        title: 'Profil mis à jour', 
        message: 'Vos informations personnelles ont été enregistrées avec succès.', 
        type: 'success' 
      });
    } catch (err: any) {
      console.error('Erreur mise à jour profil:', err);
      addToast({ 
        title: 'Erreur', 
        message: err.message || 'Impossible de mettre à jour le profil.', 
        type: 'error' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast({ title: 'Mot de passe trop court', message: 'Le mot de passe doit comporter au moins 6 caractères.', type: 'warning' });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({ title: 'Mots de passe différents', message: 'Les deux mots de passe saisis ne correspondent pas.', type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseAuth.updatePassword(newPassword);
      }
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      addToast({
        title: 'Sécurité renforcée',
        message: 'Votre mot de passe a été modifié avec succès.',
        type: 'success'
      });
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      console.error('Erreur modification mot de passe:', err);
      addToast({
        title: 'Erreur mot de passe',
        message: err.message || 'Impossible de modifier le mot de passe actuellement.',
        type: 'error'
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '60px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Mon Compte & Profil</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0' }}>
          Gérez vos informations de compte personnelles et vos paramètres de sécurité.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', maxWidth: '1000px' }}>
        
        {/* CARTE 1: INFORMATIONS PERSONNELLES */}
        <div style={{ 
          backgroundColor: 'var(--bg-card, #ffffff)', 
          padding: '28px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {/* Avatar & En-tête */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <div style={{ 
              width: '72px', 
              height: '72px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '28px', 
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
              overflow: 'hidden'
            }}>
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                name ? name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {name || 'Votre Profil'}
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backgroundColor: isSuperAdmin ? 'rgba(21, 128, 61, 0.15)' : 'rgba(37, 99, 235, 0.12)',
                  color: isSuperAdmin ? '#15803d' : '#2563eb'
                }}>
                  {isSuperAdmin ? '👑 Super Admin' : '👤 Commerçant (Boutique)'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {currentUser?.email || 'Aucune adresse enregistrée'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Nom complet *
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Ex: Moussa Ndiaye"
                required
                style={{ 
                  width: '100%', 
                  padding: '11px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color, #e2e8f0)', 
                  backgroundColor: 'var(--bg-input, #ffffff)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Nom de votre boutique / enseigne
              </label>
              <input 
                type="text" 
                value={shopName} 
                onChange={e => setShopName(e.target.value)} 
                placeholder="Ex: Boutique Moderne"
                style={{ 
                  width: '100%', 
                  padding: '11px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color, #e2e8f0)', 
                  backgroundColor: 'var(--bg-input, #ffffff)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Numéro de Téléphone
              </label>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="Ex: +221 77 000 00 00"
                style={{ 
                  width: '100%', 
                  padding: '11px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color, #e2e8f0)', 
                  backgroundColor: 'var(--bg-input, #ffffff)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} 
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Adresse Email (Identifiant)
                </label>
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>🔒 Compte vérifié</span>
              </div>
              <input 
                type="email" 
                value={currentUser?.email || ''} 
                disabled 
                readOnly
                style={{ 
                  width: '100%', 
                  padding: '11px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color, #e2e8f0)', 
                  backgroundColor: 'var(--bg-primary, #f8fafc)',
                  color: 'var(--text-muted, #64748b)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed'
                }} 
              />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Votre e-mail est votre identifiant unique sur Taxawou et ne peut pas être modifié manuellement.
              </span>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSaving}
              style={{ marginTop: '12px', padding: '12px 24px', fontWeight: 600 }}
            >
              {isSaving ? 'Enregistrement en cours...' : 'Enregistrer mes informations'}
            </button>
          </form>
        </div>

        {/* CARTE 2: SÉCURITÉ & MOT DE PASSE */}
        <div style={{ 
          backgroundColor: 'var(--bg-card, #ffffff)', 
          padding: '28px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🔐</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Sécurité & Mot de passe
              </h3>
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Changez votre mot de passe pour sécuriser l'accès à votre boutique.
            </p>
          </div>

          {passwordSuccess && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '12px 14px',
              color: '#166534',
              fontSize: '13.5px',
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              ✓ Votre mot de passe a été mis à jour avec succès !
            </div>
          )}

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Nouveau mot de passe
              </label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
                style={{ 
                  width: '100%', 
                  padding: '11px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color, #e2e8f0)', 
                  backgroundColor: 'var(--bg-input, #ffffff)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Confirmer le nouveau mot de passe
              </label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Répétez le mot de passe"
                style={{ 
                  width: '100%', 
                  padding: '11px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color, #e2e8f0)', 
                  backgroundColor: 'var(--bg-input, #ffffff)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} 
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-outline"
              disabled={isUpdatingPassword || !newPassword}
              style={{ marginTop: '8px', padding: '12px 20px', fontWeight: 600 }}
            >
              {isUpdatingPassword ? 'Modification...' : 'Changer mon mot de passe'}
            </button>
          </form>

          {/* Informations sur l'isolation des données */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '24px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            lineHeight: '1.5'
          }}>
            🛡️ <strong>Isolation des données :</strong> Vos données de vente, vos produits et vos paramètres sont strictement personnels à votre boutique et ne peuvent être vus ou modifiés par d'autres commerçants.
          </div>
        </div>

      </div>
    </div>
  );
}
