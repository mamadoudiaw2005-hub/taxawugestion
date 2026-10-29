import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { User } from '../../types';
import { isSupabaseConfigured, supabase, supabaseAuth } from '../../lib/supabase';

interface AuthModalProps {
  initialTab?: 'login' | 'register';
  onClose?: () => void;
}

// Global declaration for Google Identity Services
declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Validation stricte du format email (RFC 5322 standard)
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!email || !emailRegex.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;
  const tld = domainParts[domainParts.length - 1];
  return tld.length >= 2;
};

export default function AuthModal({ initialTab = 'login', onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire de connexion classique
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Formulaire d'inscription + Étape de validation par code
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerStep, setRegisterStep] = useState<'form' | 'verify_otp'>('form');
  const [registerOtp, setRegisterOtp] = useState('');
  const [registerResendCountdown, setRegisterResendCountdown] = useState(0);

  // Mot de passe oublié + Étape de validation par code
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'verify_otp'>('email');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotResendCountdown, setForgotResendCountdown] = useState(0);

  // Message d'erreur
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const { addToast, setCurrentUser, setUsers, users, currentUser } = useApp();

  // Décomptes de renvoi
  React.useEffect(() => {
    if (registerResendCountdown > 0) {
      const t = setTimeout(() => setRegisterResendCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [registerResendCountdown]);

  React.useEffect(() => {
    if (forgotResendCountdown > 0) {
      const t = setTimeout(() => setForgotResendCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [forgotResendCountdown]);

  // Rediriger automatiquement vers le tableau de bord si déjà connecté
  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setRegisterStep('form');
    setRegisterOtp('');
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  /**
   * 1. CONNEXION CLASSIQUE (Email + Mot de passe)
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = loginEmail.trim().toLowerCase();
    setErrorMessage(null);

    if (!emailClean || !loginPassword.trim()) {
      const msg = 'Veuillez saisir votre adresse email et votre mot de passe.';
      setErrorMessage(msg);
      addToast({ title: 'Erreur', message: msg, type: 'error' });
      return;
    }

    if (!isValidEmail(emailClean)) {
      const msg = 'Veuillez saisir une adresse e-mail valide.';
      setErrorMessage(msg);
      addToast({ title: 'Format invalide', message: msg, type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Super Admin bypass
      const isOwner = emailClean === 'admin@taxawu.com' || emailClean === 'mamadou@taxawou.sn';
      if (isOwner) {
        if (loginPassword !== 'TaxawuAdmin@2026' && loginPassword !== 'admin123' && loginPassword !== 'admin') {
          const msg = 'Identifiants Super Admin incorrects.';
          setErrorMessage(msg);
          addToast({ title: 'Erreur', message: msg, type: 'error' });
          setIsSubmitting(false);
          return;
        }

        const adminUser: User = {
          id: 'u_admin_master',
          name: 'Mamadou Diaw (Super Admin)',
          email: emailClean,
          shopName: 'Taxawou Administration',
          role: 'super_admin',
          status: 'active',
          plan: 'pro',
          createdAt: new Date().toISOString().split('T')[0]
        };

        setCurrentUser(adminUser);
        addToast({ title: 'Connexion Super Admin', message: 'Bienvenue !', type: 'success' });
        navigate('/admin-master');
        return;
      }

      // Supabase
      if (isSupabaseConfigured) {
        const data = await supabaseAuth.signIn(emailClean, loginPassword);
        if (!data?.user) throw new Error('Identifiants invalides');

        const sbUser = data.user;
        let profileData: any = null;
        if (supabase) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', sbUser.id).maybeSingle();
          profileData = prof;
        }

        if (!profileData && supabase) {
          await supabaseAuth.signOut();
          const msg = 'Ce compte a été supprimé ou n\'existe plus.';
          setErrorMessage(msg);
          addToast({ title: 'Compte supprimé', message: msg, type: 'error' });
          setIsSubmitting(false);
          return;
        }

        const loggedUser: User = {
          id: sbUser.id,
          name: profileData?.name || sbUser.user_metadata?.name || emailClean.split('@')[0],
          email: profileData?.email || sbUser.email || emailClean,
          shopName: profileData?.shop_name || sbUser.user_metadata?.shopName || ('Boutique ' + (profileData?.name || emailClean.split('@')[0])),
          role: (profileData?.role as any) || (sbUser.user_metadata?.role as any) || 'admin',
          status: (profileData?.status as any) || 'active',
          plan: (profileData?.plan as any) || 'pro',
          avatar: profileData?.avatar_url || sbUser.user_metadata?.avatar_url || undefined,
          phone: profileData?.phone || undefined,
          createdAt: profileData?.created_at ? profileData.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
        };

        setCurrentUser(loggedUser);
        sessionStorage.setItem('taxawou_currentUser', JSON.stringify(loggedUser));
        setUsers(prev => {
          const exists = prev.find(u => u.id === loggedUser.id || u.email.toLowerCase() === loggedUser.email.toLowerCase());
          return exists ? prev.map(u => u.id === loggedUser.id ? loggedUser : u) : [...prev, loggedUser];
        });

        addToast({ title: 'Connexion réussie', message: `Ravi de vous revoir, ${loggedUser.name} !`, type: 'success' });
        navigate('/dashboard');
        return;
      }

      // Fallback local
      const existing = users.find(u => u.email.toLowerCase() === emailClean);
      if (!existing) {
        throw new Error('Aucun compte trouvé avec cet e-mail.');
      }
      setCurrentUser(existing);
      addToast({ title: 'Connexion réussie', message: `Bienvenue, ${existing.name} !`, type: 'success' });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erreur authentification:', err);
      let errorMsg = 'Identifiants invalides.';
      if (err.message?.includes('Invalid login credentials')) {
        errorMsg = 'Adresse e-mail ou mot de passe incorrect.';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMsg = 'Votre e-mail n\'a pas encore été validé par code.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setErrorMessage(errorMsg);
      addToast({ title: 'Échec de connexion', message: errorMsg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 2. INSCRIPTION — Étape 1 : Créer le compte et envoyer le code
   */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = registerEmail.trim().toLowerCase();
    const nameClean = registerName.trim();

    if (!nameClean || !emailClean || !registerPassword.trim()) {
      addToast({ title: 'Champs requis', message: 'Veuillez remplir tous les champs.', type: 'error' });
      return;
    }

    if (!isValidEmail(emailClean)) {
      setErrorMessage('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    if (registerPassword.length < 6) {
      addToast({ title: 'Mot de passe court', message: 'Le mot de passe doit comporter au moins 6 caractères.', type: 'warning' });
      return;
    }

    if (!acceptedTerms) {
      addToast({ title: 'Conditions requises', message: 'Veuillez accepter les conditions de vente.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isSupabaseConfigured && supabase) {
        const shopName = 'Boutique ' + nameClean;
        const data = await supabaseAuth.signUp(emailClean, registerPassword, {
          name: nameClean,
          shopName: shopName,
          role: 'admin'
        });

        if (!data?.user) throw new Error('Échec de la création du compte.');

        // Si le compte nécessite la validation du code à 6 chiffres
        if (!data.session && (!data.user.confirmed_at && !(data.user as any).email_confirmed_at)) {
          setRegisterStep('verify_otp');
          setRegisterResendCountdown(60);
          addToast({
            title: 'Code de validation envoyé !',
            message: `Un code à 6 chiffres a été envoyé à ${emailClean}.`,
            type: 'success'
          });
          return;
        }

        // Si le compte est déjà activé
        const newUser: User = {
          id: data.user.id,
          name: nameClean,
          email: emailClean,
          shopName: shopName,
          role: 'admin',
          status: 'active',
          plan: 'pro',
          createdAt: new Date().toISOString().split('T')[0]
        };

        setCurrentUser(newUser);
        addToast({ title: 'Compte créé !', message: `Bienvenue ${newUser.name} !`, type: 'success' });
        navigate('/dashboard');
        return;
      }

      // Local fallback
      const newUser: User = {
        id: `u_${Date.now()}`,
        name: nameClean,
        email: emailClean,
        shopName: 'Boutique ' + nameClean,
        role: 'admin',
        status: 'active',
        plan: 'pro',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erreur inscription:', err);
      let errorMsg = err.message || 'Impossible de créer le compte.';
      if (err.message?.includes('already registered')) {
        errorMsg = 'Un compte existe déjà avec cette adresse email.';
      }
      setErrorMessage(errorMsg);
      addToast({ title: 'Erreur', message: errorMsg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 2. INSCRIPTION — Étape 2 : Vérification du code à 6 chiffres
   */
  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = registerEmail.trim().toLowerCase();
    const tokenClean = registerOtp.trim().replace(/\s+/g, '');
    setErrorMessage(null);

    if (tokenClean.length < 6) {
      setErrorMessage('Veuillez saisir le code complet à 6 chiffres.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!supabase) throw new Error('Supabase non disponible.');

      const { data, error } = await supabase.auth.verifyOtp({
        email: emailClean,
        token: tokenClean,
        type: 'signup'
      });

      if (error) throw error;
      if (!data?.user) throw new Error('Code de validation invalide.');

      const userObj: User = {
        id: data.user.id,
        name: registerName.trim() || emailClean.split('@')[0],
        email: emailClean,
        shopName: 'Boutique ' + (registerName.trim() || emailClean.split('@')[0]),
        role: 'admin',
        status: 'active',
        plan: 'pro',
        createdAt: new Date().toISOString().split('T')[0]
      };

      // Synchroniser la table profiles
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: userObj.name,
        email: userObj.email,
        role: 'admin',
        status: 'active',
        shop_name: userObj.shopName
      });

      setCurrentUser(userObj);
      sessionStorage.setItem('taxawou_currentUser', JSON.stringify(userObj));
      addToast({ title: 'Compte validé avec succès !', message: `Bienvenue, ${userObj.name} !`, type: 'success' });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erreur validation code inscription:', err);
      const msg = err.message || 'Code erroné ou expiré.';
      setErrorMessage(msg);
      addToast({ title: 'Code invalide', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 3. MOT DE PASSE OUBLIÉ — Étape 1 : Demande du code par e-mail
   */
  const handleForgotRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = forgotEmail.trim().toLowerCase();
    setErrorMessage(null);

    if (!emailClean || !isValidEmail(emailClean)) {
      addToast({ title: 'E-mail requis', message: 'Veuillez renseigner un e-mail valide.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(emailClean);
        if (error) throw error;

        setForgotStep('verify_otp');
        setForgotResendCountdown(60);
        addToast({
          title: 'Code de sécurité envoyé !',
          message: `Consultez votre boîte mail (${emailClean}) pour obtenir votre code de réinitialisation.`,
          type: 'success'
        });
      }
    } catch (err: any) {
      console.error('Erreur mot de passe oublié:', err);
      addToast({ title: 'Erreur', message: err.message || 'Impossible d\'envoyer le code.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 3. MOT DE PASSE OUBLIÉ — Étape 2 : Validation du code et saisie du nouveau mot de passe
   */
  const handleForgotVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = forgotEmail.trim().toLowerCase();
    const tokenClean = forgotOtp.trim().replace(/\s+/g, '');
    setErrorMessage(null);

    if (tokenClean.length < 6) {
      setErrorMessage('Veuillez saisir le code à 6 chiffres.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!supabase) throw new Error('Supabase non disponible.');

      // 1. Valider le code OTP de récupération
      const { data, error } = await supabase.auth.verifyOtp({
        email: emailClean,
        token: tokenClean,
        type: 'recovery'
      });

      if (error) throw error;
      if (!data?.session) throw new Error('Session expirée ou code invalide.');

      // 2. Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      addToast({
        title: 'Mot de passe mis à jour !',
        message: 'Votre nouveau mot de passe est enregistré. Vous êtes connecté.',
        type: 'success'
      });

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erreur réinitialisation mot de passe:', err);
      const msg = err.message || 'Code erroné ou expiré.';
      setErrorMessage(msg);
      addToast({ title: 'Erreur', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Connexion Google OAuth
   */
  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/dashboard',
            queryParams: { prompt: 'select_account', access_type: 'offline' }
          }
        });
        if (error) throw error;
        if (data?.url) window.location.href = data.url;
      } catch (err: any) {
        addToast({ title: 'Google OAuth', message: err.message || 'Erreur redirection.', type: 'warning' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 30, 18, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(10, 45, 25, 0.35)',
          border: '1px solid rgba(22, 163, 74, 0.15)',
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          padding: '30px 32px 32px',
          fontFamily: 'inherit',
          animation: 'fadeInScale 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* En-tête TAXAWU */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                boxShadow: '0 4px 10px rgba(22, 163, 74, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '20px',
              }}
            >
              T
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px', color: '#15803d' }}>
              TAXAWU
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
            Plateforme de gestion commerciale et point de vente
          </p>
        </div>

        {/* ÉCRAN : MOT DE PASSE OUBLIÉ */}
        {isForgotPassword ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
                Réinitialisation du mot de passe
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                {forgotStep === 'email'
                  ? 'Entrez votre e-mail pour recevoir un code à 6 chiffres.'
                  : `Code envoyé à ${forgotEmail}. Saisissez-le ci-dessous.`}
              </p>
            </div>

            {forgotStep === 'email' ? (
              <form onSubmit={handleForgotRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    placeholder="votre.email@gmail.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Envoi du code...' : 'Recevoir le code de sécurité'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotVerifyAndReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', textAlign: 'center' }}>
                    Code à 6 chiffres reçu
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    style={{ width: '100%', padding: '10px', border: '2px solid #16a34a', borderRadius: '8px', fontSize: '22px', fontWeight: 700, textAlign: 'center', letterSpacing: '8px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="Au moins 6 caractères"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || forgotOtp.length < 6}
                  style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Mise à jour...' : 'Changer le mot de passe & Se connecter'}
                </button>
              </form>
            )}

            <div style={{ marginTop: '18px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setForgotStep('email'); }}
                style={{ background: 'none', border: 'none', color: '#15803d', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                ← Retour à la connexion
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Onglets principaux */}
            <div style={{ display: 'flex', borderBottom: '1.5px solid #e5e7eb', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => switchTab('login')}
                style={{
                  flex: 1,
                  padding: '10px 16px 12px',
                  fontSize: '15px',
                  fontWeight: activeTab === 'login' ? 700 : 500,
                  textAlign: 'center',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  color: activeTab === 'login' ? '#15803d' : '#64748b',
                }}
              >
                Se connecter
                {activeTab === 'login' && (
                  <span style={{ position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '3px', backgroundColor: '#16a34a', borderRadius: '3px 3px 0 0' }} />
                )}
              </button>

              <button
                type="button"
                onClick={() => switchTab('register')}
                style={{
                  flex: 1,
                  padding: '10px 16px 12px',
                  fontSize: '15px',
                  fontWeight: activeTab === 'register' ? 700 : 500,
                  textAlign: 'center',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  color: activeTab === 'register' ? '#15803d' : '#64748b',
                }}
              >
                Créer un compte
                {activeTab === 'register' && (
                  <span style={{ position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '3px', backgroundColor: '#16a34a', borderRadius: '3px 3px 0 0' }} />
                )}
              </button>
            </div>

            {/* ONGLET 1 : SE CONNECTER CLASSIQUE (Email + Mot de passe) */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    placeholder="votre.email@gmail.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Mot de passe
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                      style={{ width: '100%', padding: '11px 40px 11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(loginEmail); setIsForgotPassword(true); }}
                      style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)'
                  }}
                >
                  {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
                </button>
              </form>
            )}

            {/* ONGLET 2 : CRÉER UN COMPTE AVEC VALIDATION PAR CODE OTP */}
            {activeTab === 'register' && (
              <div>
                {registerStep === 'form' ? (
                  /* Étape 1 : Formulaire d'inscription */
                  <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                        Nom complet
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Mamadou Diaw"
                        value={registerName}
                        onChange={e => setRegisterName(e.target.value)}
                        required
                        disabled={isSubmitting}
                        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                        Adresse e-mail
                      </label>
                      <input
                        type="email"
                        placeholder="exemple@gmail.com"
                        value={registerEmail}
                        onChange={e => setRegisterEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                        Mot de passe (Min. 6 caractères)
                      </label>
                      <input
                        type="password"
                        placeholder="Créez un mot de passe sécurisé"
                        value={registerPassword}
                        onChange={e => setRegisterPassword(e.target.value)}
                        minLength={6}
                        required
                        disabled={isSubmitting}
                        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#475569' }}>
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={e => setAcceptedTerms(e.target.checked)}
                        style={{ marginTop: '2px', accentColor: '#16a34a' }}
                      />
                      <span>J'accepte les conditions de vente et d'utilisation.</span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '13px',
                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14.5px',
                        fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)'
                      }}
                    >
                      {isSubmitting ? 'Création en cours...' : 'Créer mon compte'}
                    </button>
                  </form>
                ) : (
                  /* Étape 2 : Saisie du code à 6 chiffres pour valider l'inscription */
                  <form onSubmit={handleVerifyRegisterOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#15803d', lineHeight: 1.4 }}>
                        Un code à 6 chiffres a été envoyé à <strong>{registerEmail}</strong>.
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '8px', textAlign: 'center' }}>
                        Entrez votre code de confirmation
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        value={registerOtp}
                        onChange={e => setRegisterOtp(e.target.value.replace(/\D/g, ''))}
                        required
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #16a34a',
                          borderRadius: '10px',
                          fontSize: '24px',
                          fontWeight: 700,
                          textAlign: 'center',
                          letterSpacing: '8px',
                          boxSizing: 'border-box',
                          backgroundColor: '#f8fafc'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || registerOtp.length < 6}
                      style={{
                        width: '100%',
                        padding: '13px',
                        background: (isSubmitting || registerOtp.length < 6) ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14.5px',
                        fontWeight: 600,
                        cursor: (isSubmitting || registerOtp.length < 6) ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)'
                      }}
                    >
                      {isSubmitting ? 'Validation...' : 'Valider & Activer mon compte'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => { setRegisterStep('form'); setRegisterOtp(''); }}
                        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12.5px', cursor: 'pointer' }}
                      >
                        ← Corriger mon adresse e-mail
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Affichage des erreurs */}
            {errorMessage && (
              <div style={{
                marginTop: '16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#991b1b',
                fontSize: '13px',
                lineHeight: '1.4'
              }}>
                {errorMessage}
              </div>
            )}
          </>
        )}

        {/* Bouton Continuer avec Google */}
        {!isForgotPassword && registerStep === 'form' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                OU
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '11px 16px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1e293b',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
              </svg>
              Continuer avec Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
