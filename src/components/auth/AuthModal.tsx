import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // État OTP (Code de validation par e-mail)
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen) return null;

  // 1. Soumission Connexion / Inscription / Mot de passe oublié
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isResetPassword) {
        // Envoi du code pour réinitialiser le mot de passe
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setOtpSent(true);
        setSuccess(`Un code de validation a été envoyé à ${email}.`);
      } else if (isLogin) {
        // Connexion normale
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
        window.location.reload();
      } else {
        // Inscription : création de compte et déclenchement du code Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;

        // Si l'utilisateur doit confirmer son e-mail
        if (data?.user && (!data.session || data.user.identities?.length === 0)) {
          setOtpSent(true);
          setSuccess(`Un code de validation a été envoyé à ${email}.`);
        } else if (data?.user && !data.session) {
          setOtpSent(true);
          setSuccess(`Un code de validation a été envoyé à ${email}.`);
        } else {
          onClose();
          window.location.reload();
        }
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'opération.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Validation du Code reçu (Accepte les 6 et 8 chiffres)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setError('Veuillez entrer le code reçu par e-mail.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: cleanOtp,
          type: 'recovery',
        });
        if (error) throw error;

        if (newPassword) {
          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
          });
          if (updateError) throw updateError;
        }

        setSuccess('Mot de passe mis à jour avec succès !');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: cleanOtp,
          type: 'signup',
        });
        if (error) throw error;

        setSuccess('Compte validé avec succès ! Bienvenue sur Taxawu.');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Code invalide ou expiré. Veuillez vérifier le code reçu par e-mail.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Connexion Google
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion avec Google.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* En-tête avec logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-2xl shadow-lg shadow-emerald-600/30 mb-3">
              T
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">TAXAWU</h2>
            <p className="text-xs text-gray-500 mt-1">
              Plateforme de gestion commerciale et point de vente
            </p>
          </div>

          {/* Messages de succès ou d'erreur */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* ÉCRAN CODE DE VALIDATION */}
          {otpSent ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900">Code de validation</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Un code de confirmation a été envoyé à <br />
                  <strong className="text-gray-800">{email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 text-center">
                  Entrez votre code de confirmation
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  placeholder="Ex: 94499539"
                  className="w-full text-center text-2xl tracking-[0.25em] font-mono font-bold py-3 px-4 border-2 border-emerald-500 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:outline-none uppercase bg-emerald-50/30"
                  required
                  autoFocus
                />
              </div>

              {isResetPassword && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-2.5 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                    required
                    minLength={6}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? 'Validation en cours...' : 'Valider & Activer mon compte'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode('');
                  setError(null);
                }}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-700 pt-2"
              >
                ← Corriger mon adresse e-mail
              </button>
            </form>
          ) : (
            /* ÉCRAN CONNEXION / INSCRIPTION */
            <>
              {/* Onglets */}
              {!isResetPassword && (
                <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setError(null);
                    }}
                    className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                      isLogin
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Se connecter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setError(null);
                    }}
                    className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                      !isLogin
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Créer un compte
                  </button>
                </div>
              )}

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && !isResetPassword && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nom complet
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Mamadou Diaw"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                {!isResetPassword && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-700">
                        Mot de passe
                      </label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsResetPassword(true);
                            setError(null);
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          Mot de passe oublié ?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm transition-all"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    'Chargement...'
                  ) : isResetPassword ? (
                    'Envoyer le code par e-mail'
                  ) : isLogin ? (
                    'Se connecter'
                  ) : (
                    'Recevoir mon code de validation'
                  )}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {isResetPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetPassword(false);
                      setError(null);
                    }}
                    className="w-full text-center text-xs text-gray-500 hover:text-gray-700 pt-2"
                  >
                    ← Retour à la connexion
                  </button>
                )}
              </form>

              {/* Bouton Google */}
              {!isResetPassword && (
                <div className="mt-6">
                  <div className="relative flex items-center justify-center mb-4">
                    <div className="border-t border-gray-200 w-full"></div>
                    <span className="bg-white px-3 text-xs text-gray-400 uppercase font-medium">
                      ou
                    </span>
                    <div className="border-t border-gray-200 w-full"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-2.5 px-4 border border-gray-300 hover:border-gray-400 rounded-xl font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Continuer avec Google
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
