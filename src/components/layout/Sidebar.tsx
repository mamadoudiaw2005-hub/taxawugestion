import React, { JSX, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const navItems = [
  { section: 'NAVIGATION' },
  { path: '/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
  { path: '/chiffre-affaires', label: "Chiffre d'affaires", icon: 'trending' },
  { path: '/ventes', label: 'Commandes', icon: 'receipt' },
  { path: '/caisse', label: 'Caisse', icon: 'pos' },
  { section: 'CATALOGUE' },
  { 
    label: 'Catalogue', icon: 'box', isGroup: true, id: 'catalogue',
    children: [
      { path: '/produits', label: 'Produits' },
      { path: '/categories', label: 'Catégories' },
      { path: '/stocks', label: 'Stocks & Mouvements' },
    ]
  },
  { section: 'GESTION' },
  {
    label: 'Contacts', icon: 'users', isGroup: true, id: 'contacts',
    children: [
      { path: '/clients', label: 'Clients' },
      { path: '/fournisseurs', label: 'Fournisseurs' },
    ]
  },
  {
    label: 'Finances', icon: 'wallet', isGroup: true, id: 'finances',
    children: [
      { path: '/depenses', label: 'Dépenses' },
      { path: '/achats', label: 'Achats' },
      { path: '/dettes', label: 'Dettes' },
    ]
  },
  { section: 'SYSTÈME' },
  { path: '/parametres', label: 'Paramètres', icon: 'settings' },
];

const icons: Record<string, JSX.Element> = {
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  trending: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  receipt: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2Z"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>,
  pos: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M14 12h.01"/><path d="M18 12h.01"/><path d="M6 16h12"/></svg>,
  box: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  wallet: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  people: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

export default function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, isSuperAdmin } = useApp();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Fermer systématiquement le tiroir de navigation mobile à chaque changement de page
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, setMobileSidebarOpen]);

  const allNavItems = [
    ...navItems,
    ...(isSuperAdmin ? [
      { section: 'ADMINISTRATION' },
      { path: '/utilisateurs', label: 'Utilisateurs', icon: 'people' },
      { path: '/admin-master', label: 'Super Admin', icon: 'shield' }
    ] : [])
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isGroupActive = (children: { path: string }[]) => {
    return children.some(child => isActive(child.path));
  };

  // Ouvrir automatiquement le groupe parent correspondant à la route lors d'une nouvelle navigation
  useEffect(() => {
    allNavItems.forEach(item => {
      if ('isGroup' in item && item.isGroup && item.id && item.children) {
        if (item.children.some(child => isActive(child.path))) {
          setOpenGroups(prev => ({ ...prev, [item.id!]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      let isCurrentlyOpen = prev[id];
      if (typeof isCurrentlyOpen !== 'boolean') {
        const matchingGroup = allNavItems.find(item => 'id' in item && item.id === id && 'children' in item);
        isCurrentlyOpen = matchingGroup && 'children' in matchingGroup ? isGroupActive(matchingGroup.children || []) : false;
      }
      return {
        ...prev,
        [id]: !isCurrentlyOpen
      };
    });
  };

  const isCollapsed = sidebarCollapsed && !mobileSidebarOpen;

  const handleNavClick = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <>
      {mobileSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={handleNavClick} 
          onTouchStart={handleNavClick}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">T</div>
          <div className="sidebar-brand" onClick={handleNavClick} style={{ cursor: 'pointer' }}>
            <h1>Taxawu</h1>
            <p>Pilotage de votre activité</p>
          </div>
          <button 
            type="button" 
            className="sidebar-mobile-close" 
            onClick={handleNavClick} 
            onTouchStart={handleNavClick}
            aria-label="Fermer le menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {allNavItems.map((item, index) => {
            if ('section' in item && item.section) {
              return (
                <div key={`section-${index}`} className="sidebar-section-label">
                  {item.section}
                </div>
              );
            }
            if ('isGroup' in item && item.isGroup) {
              const active = isGroupActive(item.children || []);
              const open = typeof openGroups[item.id!] === 'boolean' 
                ? openGroups[item.id!] 
                : active;
              return (
                <div key={item.id} className="sidebar-group">
                  <div 
                    className={`sidebar-link ${active ? 'active' : ''}`} 
                    onClick={() => toggleGroup(item.id!)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="sidebar-link-icon">
                      {item.icon && icons[item.icon]}
                    </span>
                    <span className="sidebar-link-text">{item.label}</span>
                    <span className="sidebar-link-arrow" style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                    </span>
                  </div>
                  {open && !isCollapsed && (
                    <div className="sidebar-submenu" style={{ paddingLeft: '40px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {item.children?.map(child => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={`sidebar-link ${isActive(child.path) ? 'active' : ''}`}
                          style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                          onClick={handleNavClick}
                        >
                          <span className="sidebar-link-text">{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            if ('path' in item && item.path) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <span className="sidebar-link-icon">
                    {item.icon && icons[item.icon]}
                  </span>
                  <span className="sidebar-link-text">{item.label}</span>
                </NavLink>
              );
            }
            return null;
          })}
        </nav>
      </aside>
    </>
  );
}
