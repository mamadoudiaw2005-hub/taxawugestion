import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useApp } from '../../context/AppContext';

class PageErrorBoundary extends React.Component<{ children: React.ReactNode; pathname: string; onReset: () => void }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.pathname !== this.props.pathname && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '32px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '40px auto'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Une erreur d'affichage est survenue</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            Cette section a rencontré un imprévu. Vous pouvez retourner au tableau de bord ou recharger vos données en toute sécurité.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={this.props.onReset}
            >
              Retour au Tableau de bord
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => window.location.reload()}
            >
              Actualiser la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppLayout() {
  const { sidebarCollapsed, currentUser, isLoadingAuth, isSuspended } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoadingAuth && !currentUser) {
      navigate('/login');
    }
  }, [isLoadingAuth, currentUser, navigate]);

  if (isLoadingAuth) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            border: '4px solid #e2e8f0', 
            borderTop: '4px solid #16a34a', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite', 
            margin: '0 auto 16px' 
          }} />
          <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Vérification de la session en cours...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar />
        <main className="main-content">
          {isSuspended && (
            <div style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              border: '1.5px solid #fdba74',
              borderRadius: '12px',
              padding: '14px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#ea580c',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0
                }}>
                  🔒
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#9a3412', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Compte suspendu — Mode Consultation uniquement
                    <span style={{
                      fontSize: '11px',
                      background: '#ffedd5',
                      color: '#c2410c',
                      border: '1px solid #fdba74',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600
                    }}>
                      Lecture Seule
                    </span>
                  </div>
                  <div style={{ color: '#c2410c', fontSize: '13px', marginTop: '3px', lineHeight: 1.4 }}>
                    Votre compte a été suspendu par l'administration. Vos données et votre historique restent visibles, mais la création, modification et suppression de produits, ventes, achats et dépenses sont bloquées.
                  </div>
                </div>
              </div>
            </div>
          )}
          <PageErrorBoundary pathname={location.pathname} onReset={() => navigate('/dashboard')}>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  );
}
