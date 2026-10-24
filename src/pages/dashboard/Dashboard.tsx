import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../data/mockData';

export default function Dashboard() {
  const navigate = useNavigate();
  const { sales, products, expenses } = useApp();

  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  return (
    <div>
      {/* Header with welcome + security badge */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Votre espace simple pour suivre les commandes, les dettes et les dépenses de votre activité.
            </p>
          </div>
          <div className="security-badge">
            <span className="security-badge-dot" />
            Espace sécurisé
          </div>
        </div>
      </div>



      {/* Stats Cards */}
      <div className="stats-grid dashboard-hero-stats">
        <div className="stat-card dashboard-hero-card" onClick={() => navigate('/chiffre-affaires')} style={{ cursor: 'pointer' }} title="Voir le rapport détaillé du Chiffre d'Affaires">
          <div className="stat-card-content">
            <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Chiffre d'affaires (Entrées)
              <span style={{ fontSize: '11px', color: 'var(--color-primary-600)', fontWeight: 600 }}>Détails →</span>
            </span>
            <span className="stat-card-value text-success">{formatCurrency(totalRevenue)}</span>
            <span className="stat-card-sub">Aujourd'hui</span>
          </div>
          <div className="stat-card-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </div>
        </div>

        <div className="stat-card dashboard-hero-card">
          <div className="stat-card-content">
            <span className="stat-card-label">Dépenses (Sorties)</span>
            <span className="stat-card-value text-danger">{formatCurrency(totalExpenses)}</span>
            <span className="stat-card-sub">Aujourd'hui</span>
          </div>
          <div className="stat-card-icon red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
        </div>
      </div>

      {/* Quick Actions / Shortcuts */}
      <div className="shortcuts-section">
        <div className="shortcuts-label">RACCOURCIS</div>
        <div className="shortcuts-title">Actions courantes</div>
        <div className="shortcuts-grid">
          <button className="shortcut-card" onClick={() => navigate('/caisse')}>
            <div className="shortcut-card-left">
              <span className="shortcut-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2Z"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>
              </span>
              <span className="shortcut-card-text">Nouvelle vente</span>
            </div>
            <span className="shortcut-card-arrow">→</span>
          </button>

          <button className="shortcut-card" onClick={() => navigate('/caisse')}>
            <div className="shortcut-card-left">
              <span className="shortcut-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M14 12h.01"/><path d="M18 12h.01"/><path d="M6 16h12"/></svg>
              </span>
              <span className="shortcut-card-text">Ouvrir la caisse</span>
            </div>
            <span className="shortcut-card-arrow">→</span>
          </button>

          <button className="shortcut-card" onClick={() => navigate('/clients')}>
            <div className="shortcut-card-left">
              <span className="shortcut-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              <span className="shortcut-card-text">Ajouter un client</span>
            </div>
            <span className="shortcut-card-arrow">→</span>
          </button>

          <button className="shortcut-card" onClick={() => navigate('/depenses')}>
            <div className="shortcut-card-left">
              <span className="shortcut-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              </span>
              <span className="shortcut-card-text">Enregistrer une dépense</span>
            </div>
            <span className="shortcut-card-arrow">→</span>
          </button>
        </div>
      </div>


      {/* Activity & Debts */}
      <div className="content-grid">
        <div className="content-card">
          <div className="content-card-header">
            <div className="content-card-header-left">
              <span className="content-card-section">ACTIVITÉ RÉCENTE</span>
              <span className="content-card-title">Les dernières opérations</span>
            </div>
            <button className="content-card-link" onClick={() => navigate('/ventes')}>
              Voir toutes les ventes →
            </button>
          </div>
          <div className="content-card-body">
            {sales.length > 0 ? (
              <div>
                {sales.slice(0, 5).map(sale => (
                  <div key={sale.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{sale.reference} — {sale.customerName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDateTime(sale.createdAt)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(sale.total)}</div>
                      <span className={`badge ${sale.status === 'completed' ? 'badge-success' : sale.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                        {sale.status === 'completed' ? 'Payée' : sale.status === 'pending' ? 'En attente' : 'Annulée'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2Z"/></svg>
                </div>
                <div className="empty-state-title">Aucune opération enregistrée</div>
                <div className="empty-state-text">Vos commandes et dépenses apparaîtront ici après leur première saisie.</div>
              </div>
            )}
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <div className="content-card-header-left">
              <span className="content-card-section">À SUIVRE</span>
              <span className="content-card-title">Alertes de stock</span>
            </div>
            <button className="content-card-link" onClick={() => navigate('/stocks')}>
              Tout voir →
            </button>
          </div>
          <div className="content-card-body">
            {lowStockProducts.length > 0 ? (
              <div>
                {lowStockProducts.map(product => (
                  <div key={product.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{product.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Min: {product.minStock} {product.unit}(s)</div>
                    </div>
                    <span className={`badge ${product.stock === 0 ? 'badge-error' : 'badge-warning'}`}>
                      {product.stock === 0 ? 'Rupture' : `${product.stock} restant(s)`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                </div>
                <div className="empty-state-title">Tous les stocks sont OK</div>
                <div className="empty-state-text">Aucun produit en dessous du seuil minimum.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
