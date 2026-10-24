import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useApp } from '../../context/AppContext';

export default function AppLayout() {
  const { sidebarCollapsed, currentUser, isLoadingAuth } = useApp();
  const navigate = useNavigate();

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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
