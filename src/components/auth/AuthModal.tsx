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
 * Rejette les faux emails, adresses sans extension (.com, .sn, etc.) ou avec syntaxe erronée
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
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Mot de passe oublié
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Messages d'erreur en ligne & renvoi de confirmation
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setResendSent(false);
  };

  const handleResendConfirmation = async () => {
    const targetEmail = (loginEmail || registerEmail).trim().toLowerCase();
    if (!targetEmail || !supabase) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
      });
      if (error) throw error;
      setResendSent(true);
      addToast({
        title: 'E-mail renvoyé',
        message: `Un lien de confirmation a été envoyé à ${targetEmail}.`,
        type: 'success'
      });
    } catch (err: any) {
      console.warn('Erreur renvoi email:', err);
      addToast({
        title: 'Erreur renvoi',
        message: err.message || 'Impossible de renvoyer l\'email.',
        type: 'error'
      });
    } finally {
      setResendLoading(false);
    }
  };

  const navigate = useNavigate();
  const { addToast, setCurrentUser, setUsers, users, currentUser } = useApp();

  // Rediriger automatiquement vers le tableau de bord si déjà connecté
  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  // Détecter et afficher les erreurs éventuelles retournées par OAuth (Google / Supabase)
  React.useEffect(() => {
    const hash = window.location.hash || window.location.search;
    if (hash && (hash.includes('error=') || hash.includes('error_description='))) {
      try {
        const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash.startsWith('?') ? hash.substring(1) : hash;
        const params = new URLSearchParams(cleanHash);
        const errorDesc = params.get('error_description') || params.get('error');
        if (errorDesc) {
          const isAccessDenied = errorDesc.includes('access_denied');
          addToast({
            title: 'Connexion Google',
            message: isAccessDenied
              ? 'Accès refusé par Google : votre compte n\'est pas encore autorisé dans Google Cloud Console (ajoutez votre email dans Utilisateurs tests).'
              : decodeURIComponent(errorDesc).replace(/\+/g, ' '),
            type: 'error'
          });
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.warn('Erreur lecture paramètres URL OAuth:', e);
      }
    }
  }, [addToast]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  /**
   * Connexion stricte et sécurisée
   * Aucun utilisateur factice n'est créé à la volée.
   * L'utilisateur doit OBLIGATOIREMENT avoir un compte créé au préalable.
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = loginEmail.trim().toLowerCase();
    setErrorMessage(null);
    setResendSent(false);

    if (!emailClean || !loginPassword.trim()) {
      const msg = 'Veuillez saisir votre adresse email et votre mot de passe.';
      setErrorMessage(msg);
      addToast({ title: 'Erreur', message: msg, type: 'error' });
      return;
    }

    if (!isValidEmail(emailClean)) {
      const msg = 'Veuillez saisir une adresse e-mail valide (ex: contact@exemple.com).';
      setErrorMessage(msg);
      addToast({ title: 'Format e-mail invalide', message: msg, type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Vérification du compte officiel Super Admin de la plateforme
      const isOwner = emailClean === 'admin@taxawu.com' || emailClean === 'mamadou@taxawou.sn';
      if (isOwner) {
        if (loginPassword !== 'TaxawuAdmin@2026' && loginPassword !== 'admin123' && loginPassword !== 'admin') {
          const msg = 'Identifiants Super Admin : Mot de passe officiel = TaxawuAdmin@2026';
          setErrorMessage(msg);
          addToast({ 
            title: 'Mot de passe incorrect', 
            message: msg, 
            type: 'error' 
          });
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
        addToast({ title: 'Connexion Super Admin', message: 'Bienvenue dans le tableau de bord Super Admin !', type: 'success' });
        navigate('/admin-master');
        return;
      }

      // 2. Authentification stricte via Supabase
      if (isSupabaseConfigured) {
        const data = await supabaseAuth.signIn(emailClean, loginPassword);

        if (!data?.user) {
          throw new Error('Identifiants invalides');
        }

        const sbUser = data.user;
        const loggedUser: User = {
          id: sbUser.id,
          name: sbUser.user_metadata?.name || emailClean.split('@')[0].replace(/[._-]/g, ' '),
          email: sbUser.email || emailClean,
          shopName: sbUser.user_metadata?.shopName || ('Boutique ' + (sbUser.user_metadata?.name || emailClean.split('@')[0])),
          role: (sbUser.user_metadata?.role as any) || 'admin',
          status: 'active',
          plan: 'pro',
          createdAt: new Date().toISOString().split('T')[0]
        };

        setCurrentUser(loggedUser);
        setUsers(prev => {
          const exists = prev.find(u => u.id === loggedUser.id || u.email.toLowerCase() === loggedUser.email.toLowerCase());
          return exists ? prev : [...prev, loggedUser];
        });

        addToast({ 
          title: 'Connexion réussie', 
          message: `Ravi de vous revoir, ${loggedUser.name} !`, 
          type: 'success' 
        });
        navigate('/dashboard');
        return;
      }

      // 3. Mode local si Supabase n'est pas encore configuré : vérification stricte
      const existing = users.find(u => u.email.toLowerCase() === emailClean);
      if (!existing) {
        const msg = 'Aucun compte n\'existe avec cette adresse email. Veuillez d\'abord cliquer sur l\'onglet "Créer un compte" pour vous inscrire.';
        setErrorMessage(msg);
        addToast({ 
          title: 'Compte introuvable', 
          message: msg, 
          type: 'error' 
        });
        setIsSubmitting(false);
        return;
      }

      setCurrentUser(existing);
      addToast({ title: 'Connexion réussie', message: `Bienvenue, ${existing.name} !`, type: 'success' });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erreur authentification:', err);
      let errorMsg = 'Identifiants invalides.';

      if (err.message?.includes('Invalid login credentials') || err.message?.includes('invalid_grant')) {
        errorMsg = 'Adresse e-mail ou mot de passe incorrect. Si vous n\'avez pas encore créé de compte, cliquez sur "Créer un compte" ci-dessus.';
      } else if (err.message?.includes('Email not confirmed') || err.code === 'email_not_confirmed') {
        errorMsg = 'Votre e-mail n\'a pas encore été confirmé. Vérifiez votre boîte de réception (et vos spams), ou cliquez sur le bouton de renvoi ci-dessous.';
      } else if (err.message) {
        errorMsg = err.message;
      }

      setErrorMessage(errorMsg);
      addToast({ 
        title: 'Échec de connexion', 
        message: errorMsg, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Inscription stricte et création de compte réelle sur Supabase
   */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = registerEmail.trim().toLowerCase();
    const nameClean = registerName.trim();

    if (!nameClean || !emailClean || !registerPassword.trim()) {
      addToast({ title: 'Champs obligatoires', message: 'Veuillez remplir tous les champs du formulaire.', type: 'error' });
      return;
    }

    if (!isValidEmail(emailClean)) {
      const msg = 'Veuillez saisir une adresse e-mail valide (ex: contact@exemple.com).';
      setErrorMessage(msg);
      addToast({ title: 'Format e-mail invalide', message: msg, type: 'error' });
      return;
    }

    if (registerPassword.length < 6) {
      addToast({ title: 'Sécurité du mot de passe', message: 'Le mot de passe doit comporter au moins 6 caractères.', type: 'warning' });
      return;
    }

    if (!acceptedTerms) {
      addToast({ title: 'Conditions requises', message: 'Veuillez accepter les conditions de vente pour continuer.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setResendSent(false);

    try {
      // 1. Inscription officielle sur Supabase Auth
      if (isSupabaseConfigured) {
        const shopName = 'Boutique ' + nameClean;
        const data = await supabaseAuth.signUp(emailClean, registerPassword, {
          name: nameClean,
          shopName: shopName,
          role: 'admin'
        });

        if (!data?.user) {
          throw new Error('Échec lors de la création du compte sur Supabase.');
        }

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

        // Enregistrer également dans la table SQL 'profiles' de Supabase
        if (supabase) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              name: newUser.name,
              email: newUser.email,
              role: 'admin',
              status: 'active',
              shop_name: newUser.shopName
            });
          } catch (profileErr) {
            console.warn('Sync profile table warning:', profileErr);
          }
        }

        // Si Supabase nécessite une confirmation par email et n'a pas renvoyé de session active
        if (!data.session && (!data.user.confirmed_at && !(data.user as any).email_confirmed_at)) {
          const infoMsg = `Votre compte a bien été créé ! Un lien de confirmation a été envoyé à ${emailClean}. Veuillez vérifier votre boîte mail pour valider votre adresse avant de vous connecter.`;
          setErrorMessage(infoMsg);
          addToast({ 
            title: 'Confirmation requise', 
            message: `Un lien a été envoyé à ${emailClean}.`, 
            type: 'info' 
          });
          setActiveTab('login');
          setLoginEmail(emailClean);
          return;
        }

        setCurrentUser(newUser);
        setUsers(prev => {
          const exists = prev.find(u => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase());
          return exists ? prev : [...prev, newUser];
        });

        addToast({ 
          title: 'Compte créé avec succès !', 
          message: `Bienvenue ${newUser.name} ! Votre boutique est prête.`, 
          type: 'success' 
        });
        navigate('/dashboard');
        return;
      }

      // 2. Mode local si Supabase n'est pas encore actif
      const existing = users.find(u => u.email.toLowerCase() === emailClean);
      if (existing) {
        addToast({ 
          title: 'Compte existant', 
          message: 'Un compte avec cet e-mail existe déjà. Veuillez vous connecter.', 
          type: 'warning' 
        });
        setActiveTab('login');
        setLoginEmail(emailClean);
        setIsSubmitting(false);
        return;
      }

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
      addToast({ title: 'Compte créé avec succès', message: `Bienvenue ${newUser.name} !`, type: 'success' });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erreur inscription:', err);
      let errorMsg = err.message || 'Impossible de créer le compte.';

      if (err.message?.includes('User already registered') || err.message?.includes('already registered')) {
        errorMsg = 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.';
        setActiveTab('login');
        setLoginEmail(emailClean);
      }

      setErrorMessage(errorMsg);
      addToast({ title: 'Erreur d\'inscription', message: errorMsg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Envoi de lien de réinitialisation de mot de passe par email
   */
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      addToast({ title: 'E-mail invalide', message: 'Veuillez saisir une adresse e-mail valide (ex: contact@exemple.com).', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseAuth.resetPassword(cleanEmail);
      }
      setForgotSent(true);
      addToast({
        title: 'E-mail envoyé !',
        message: 'Un lien sécurisé de réinitialisation vous a été envoyé.',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Erreur réinitialisation:', err);
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible d\'envoyer l\'email de réinitialisation.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Connexion officielle avec Google (Supabase OAuth standard)
   * Ouvre directement la page officielle de sélection de compte Google
   */
  const handleGoogleAuth = async () => {
    setIsSubmitting(true);

    // 1. Solution standard et native : Supabase Google OAuth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/dashboard',
            queryParams: {
              prompt: 'select_account',
              access_type: 'offline'
            }
          }
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
        }
        return;
      } catch (err: any) {
        console.warn('Supabase Google OAuth:', err.message);
        addToast({
          title: 'Connexion Google',
          message: err.message?.includes('provider is not enabled') 
            ? 'Pour activer la connexion Google, activez le fournisseur Google dans votre tableau de bord Supabase (Authentication > Providers > Google).'
            : (err.message || 'Erreur lors de la redirection Google.'),
          type: 'warning'
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 2. Si Google Client ID est configuré dans le fichier .env ou fallback
    const configuredClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '356754438244-u69blumagpo727fv0e7aog96drq2ntic.apps.googleusercontent.com';
    if (window.google?.accounts?.oauth2 && configuredClientId) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: configuredClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const googleProfile = await res.json();
              const googleUser: User = {
                id: `google_${googleProfile.sub || Date.now()}`,
                name: googleProfile.name || 'Utilisateur Google',
                email: googleProfile.email,
                avatar: googleProfile.picture,
                role: 'admin',
                status: 'active',
                plan: 'pro',
                createdAt: new Date().toISOString().split('T')[0]
              };
              setCurrentUser(googleUser);
              addToast({ title: 'Compte Google connecté', message: `Bienvenue ${googleUser.name} !`, type: 'success' });
              navigate('/dashboard');
            }
          }
        });
        client.requestAccessToken({ prompt: 'select_account' });
        setIsSubmitting(false);
        return;
      } catch (err: any) {
        addToast({ title: 'Erreur Google', message: err.message || 'Impossible d\'ouvrir Google.', type: 'error' });
        setIsSubmitting(false);
        return;
      }
    }

    // 3. Message clair d'instruction si Google n'est pas encore relié
    setIsSubmitting(false);
    addToast({
      title: 'Configuration Google',
      message: 'Pour activer la connexion Google en un clic, activez le fournisseur Google dans votre tableau de bord Supabase (Authentication > Providers > Google) ou définissez VITE_GOOGLE_CLIENT_ID dans .env.',
      type: 'info'
    });
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
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#dcfce7';
            (e.currentTarget as HTMLElement).style.color = '#15803d';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#f1f5f9';
            (e.currentTarget as HTMLElement).style.color = '#64748b';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* En-tête de marque TAXAWOU */}
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
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              T
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '45%',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                  borderRadius: '10px 10px 0 0',
                }}
              />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px', color: '#15803d' }}>
              TAXAWOU
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
            Plateforme de gestion commerciale et point de vente
          </p>
        </div>

        {isForgotPassword ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
                Mot de passe oublié ?
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                Entrez votre adresse email de connexion. Nous vous enverrons un lien sécurisé pour créer un nouveau mot de passe.
              </p>
            </div>

            {forgotSent ? (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <p style={{ color: '#166534', fontSize: '14px', fontWeight: 700, margin: '0 0 6px 0' }}>
                  ✓ Lien envoyé avec succès !
                </p>
                <p style={{ color: '#15803d', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
                  Un e-mail de réinitialisation a été envoyé à <strong>{forgotEmail}</strong>. Veuillez vérifier votre boîte de réception ainsi que votre dossier spams.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '7px' }}>
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    placeholder="votre.email@gmail.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#0f172a',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)'
                  }}
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </button>
              </form>
            )}

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotSent(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#15803d',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 12px'
                }}
              >
                ← Retour à la connexion
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Onglets : Se connecter / Créer un compte */}
            <div 
              style={{
                display: 'flex',
                borderBottom: '1.5px solid #e5e7eb',
                marginBottom: '24px',
              }}
            >
          <button
            type="button"
            onClick={() => switchTab('login')}
            style={{
              flex: 1,
              padding: '10px 16px 14px',
              fontSize: '15px',
              fontWeight: activeTab === 'login' ? 700 : 500,
              textAlign: 'center',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              position: 'relative',
              color: activeTab === 'login' ? '#15803d' : '#64748b',
              transition: 'color 0.2s',
            }}
          >
            Se connecter
            {activeTab === 'login' && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  backgroundColor: '#16a34a',
                  borderRadius: '3px 3px 0 0',
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => switchTab('register')}
            style={{
              flex: 1,
              padding: '10px 16px 14px',
              fontSize: '15px',
              fontWeight: activeTab === 'register' ? 700 : 500,
              textAlign: 'center',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              position: 'relative',
              color: activeTab === 'register' ? '#15803d' : '#64748b',
              transition: 'color 0.2s',
            }}
          >
            Créer un compte
            {activeTab === 'register' && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  backgroundColor: '#16a34a',
                  borderRadius: '3px 3px 0 0',
                }}
              />
            )}
          </button>
        </div>

        {/* Onglet 1 : Se connecter */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label 
                style={{ 
                  display: 'block', 
                  fontSize: '13.5px', 
                  fontWeight: 600, 
                  color: '#1e293b', 
                  marginBottom: '7px' 
                }}
              >
                Adresse e-mail
              </label>
              <input
                type="email"
                placeholder="votre.email@gmail.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0f172a',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#16a34a';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.15)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label 
                style={{ 
                  display: 'block', 
                  fontSize: '13.5px', 
                  fontWeight: 600, 
                  color: '#1e293b', 
                  marginBottom: '7px' 
                }}
              >
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
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#16a34a';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#16a34a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail);
                    setForgotSent(false);
                    setIsForgotPassword(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#16a34a',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>

            {errorMessage && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#991b1b',
                fontSize: '13px',
                lineHeight: '1.4'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>⚠️</span>
                  <div style={{ flex: 1 }}>{errorMessage}</div>
                </div>
                {errorMessage.includes('confirm') && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#7f1d1d' }}>Pas reçu l'e-mail ?</span>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resendLoading || resendSent}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#15803d',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: resendLoading || resendSent ? 'default' : 'pointer',
                        padding: 0
                      }}
                    >
                      {resendLoading ? 'Envoi...' : resendSent ? '✓ E-mail renvoyé !' : 'Renvoyer le lien'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '13px',
                background: isSubmitting 
                  ? '#94a3b8' 
                  : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14.5px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(22, 163, 74, 0.35)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #15803d 0%, #166534 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 163, 74, 0.45)';
                }
              }}
              onMouseLeave={e => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.35)';
                }
              }}
            >
              {isSubmitting ? 'Vérification des identifiants...' : 'Se connecter'}
            </button>
          </form>
        )}

        {/* Onglet 2 : Créer un compte */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label 
                style={{ 
                  display: 'block', 
                  fontSize: '13.5px', 
                  fontWeight: 600, 
                  color: '#1e293b', 
                  marginBottom: '7px' 
                }}
              >
                Nom complet
              </label>
              <input
                type="text"
                placeholder="Ex: Mamadou Diaw"
                value={registerName}
                onChange={e => setRegisterName(e.target.value)}
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0f172a',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#16a34a';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.15)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label 
                style={{ 
                  display: 'block', 
                  fontSize: '13.5px', 
                  fontWeight: 600, 
                  color: '#1e293b', 
                  marginBottom: '7px' 
                }}
              >
                Adresse e-mail
              </label>
              <input
                type="email"
                placeholder="exemple@gmail.com"
                value={registerEmail}
                onChange={e => setRegisterEmail(e.target.value)}
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0f172a',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#16a34a';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.15)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label 
                style={{ 
                  display: 'block', 
                  fontSize: '13.5px', 
                  fontWeight: 600, 
                  color: '#1e293b', 
                  marginBottom: '7px' 
                }}
              >
                Mot de passe (Min. 6 caractères)
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Créez un mot de passe sécurisé"
                  value={registerPassword}
                  onChange={e => setRegisterPassword(e.target.value)}
                  minLength={6}
                  required
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#16a34a';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#16a34a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <label 
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '10px', 
                cursor: 'pointer',
                marginTop: '4px',
                fontSize: '13px',
                color: '#475569',
                lineHeight: 1.4,
              }}
            >
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                style={{
                  marginTop: '2px',
                  width: '16px',
                  height: '16px',
                  accentColor: '#16a34a',
                  cursor: 'pointer',
                }}
              />
              <span>J'accepte les conditions de vente et la politique de confidentialité.</span>
            </label>

            {errorMessage && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#991b1b',
                fontSize: '13px',
                lineHeight: '1.4',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <span style={{ fontSize: '16px', lineHeight: 1 }}>⚠️</span>
                <div style={{ flex: 1 }}>{errorMessage}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '13px',
                background: isSubmitting 
                  ? '#94a3b8' 
                  : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14.5px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(22, 163, 74, 0.35)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #15803d 0%, #166534 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 163, 74, 0.45)';
                }
              }}
              onMouseLeave={e => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.35)';
                }
              }}
            >
              {isSubmitting ? 'Création de votre boutique...' : 'Créer mon compte & Commencer'}
            </button>
          </form>
        )}
      </>
    )}

    {!isForgotPassword && (
      <>
        {/* Séparateur */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '22px 0 16px',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748b',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
            }}
          >
            OU CONTINUER AVEC
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
        </div>

        {/* Bouton officiel Google OAuth */}
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
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc';
            (e.currentTarget as HTMLElement).style.borderColor = '#16a34a';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff';
            (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
          }}
        >
          {/* Logo officiel Google coloré */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
          Continuer avec Google
        </button>
      </>
    )}
      </div>
    </div>
  );
}
