import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { mockNotifications } from '../../data/mockData';

const pageTitles: Record<string, { section: string; title: string }> = {
  '/dashboard': { section: 'MA BOUTIQUE', title: 'Bonjour, bienvenue.' },
  '/ventes': { section: 'VENTES', title: 'Commandes' },
  '/caisse': { section: 'POINT DE VENTE', title: 'Caisse' },
  '/produits': { section: 'CATALOGUE', title: 'Produits' },
  '/categories': { section: 'CATALOGUE', title: 'Catégories' },
  '/stocks': { section: 'INVENTAIRE', title: 'Stocks' },
  '/achats': { section: 'APPROVISIONNEMENT', title: 'Achats' },
  '/clients': { section: 'CONTACTS', title: 'Clients' },
  '/fournisseurs': { section: 'CONTACTS', title: 'Fournisseurs' },
  '/depenses': { section: 'FINANCES', title: 'Dépenses' },
  '/chiffre-affaires': { section: 'FINANCES', title: "Chiffre d'Affaires" },
  '/finances': { section: 'FINANCES', title: 'Finances & Trésorerie' },
  '/dettes': { section: 'FINANCES', title: 'Dettes & Créances' },
  '/utilisateurs': { section: 'ADMINISTRATION', title: 'Utilisateurs' },
  '/parametres': { section: 'SYSTÈME', title: 'Paramètres' },
  '/admin-master': { section: 'ADMINISTRATION', title: 'Gestion Plateforme' },
};

export default function Topbar() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen, notifications, setNotifications, theme, toggleTheme, currentUser, isSuperAdmin, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const pageInfo = pageTitles[location.pathname] || { section: '', title: '' };
  
  // Initialize notifications
  useEffect(() => {
    if (notifications.length === 0) {
      setNotifications(mockNotifications);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className={`topbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="topbar-left">
        <button 
          className="topbar-toggle" 
          onClick={() => {
            if (window.innerWidth <= 900) {
              setMobileSidebarOpen(!mobileSidebarOpen);
            } else {
              toggleSidebar();
            }
          }} 
          aria-label="Menu principal"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="topbar-breadcrumb">
          <span className="topbar-section-label">{pageInfo.section}</span>
          <span className="topbar-title">{pageInfo.title}</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input type="text" placeholder="Rechercher..." aria-label="Recherche globale" />
        </div>

        <button
          className="topbar-icon-btn"
          onClick={toggleTheme}
          aria-label="Thème"
        >
          {theme === 'light' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
            {unreadCount > 0 && <span className="topbar-badge" />}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
                {unreadCount > 0 && (
                  <button style={{ fontSize: 12, color: 'var(--color-primary-600)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }} onClick={markAllRead}>
                    Tout marquer lu
                  </button>
                )}
              </div>
              <div className="notifications-list">
                {notifications.map(notif => (
                  <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                    <div className={`notification-dot ${notif.type}`} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{notif.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{notif.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div ref={profileRef} style={{ position: 'relative' }}>
          <button className="topbar-avatar" onClick={() => setShowProfile(!showProfile)} aria-label="Profil" style={{ overflow: 'hidden', padding: 0 }}>
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'M'
            )}
          </button>
          {showProfile && (
            <div className="dropdown-menu" style={{ minWidth: 200 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{currentUser?.name || 'Mon Compte'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentUser?.email || ''}</div>
              </div>
              <button className="dropdown-item" onClick={() => { setShowProfile(false); navigate('/profil'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Mon profil
              </button>
              <button className="dropdown-item" onClick={() => { setShowProfile(false); navigate('/parametres'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                Paramètres
              </button>
              {isSuperAdmin && (
                <button 
                  className="dropdown-item" 
                  onClick={() => { setShowProfile(false); navigate('/admin-master'); }}
                  style={{ color: '#15803d', fontWeight: 600 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  👑 Espace Super Admin
                </button>
              )}
              <div className="dropdown-separator" />
              <button className="dropdown-item danger" onClick={async () => { setShowProfile(false); await logout(); navigate('/login'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
