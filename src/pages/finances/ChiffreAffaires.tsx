import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../data/mockData';

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#16a34a',
  wave: '#0284c7',
  orange_money: '#ea580c',
  card: '#6366f1',
  credit: '#eab308'
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  card: 'Carte Bancaire',
  credit: 'Crédit / Dette'
};

type PeriodFilter = 'today' | '7days' | 'month' | 'year' | 'all';

export default function ChiffreAffaires({ hideHeader = false }: { hideHeader?: boolean }) {
  const navigate = useNavigate();
  const { sales = [], expenses = [], products = [] } = useApp();
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [search, setSearch] = useState('');

  // Filtrer les ventes selon la période sélectionnée
  const filteredSales = useMemo(() => {
    const now = new Date();
    const safeSales = Array.isArray(sales) ? sales : [];
    return safeSales.filter(sale => {
      if (!sale || sale.status === 'cancelled') return false;
      const saleDate = sale.createdAt ? new Date(sale.createdAt) : new Date();
      if (isNaN(saleDate.getTime())) return true;

      if (period === 'today') {
        return saleDate.toDateString() === now.toDateString();
      }
      if (period === '7days') {
        const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (period === 'month') {
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }
      if (period === 'year') {
        return saleDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, period]);

  // Filtrer les dépenses selon la même période pour le calcul de marge
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    return safeExpenses.filter(exp => {
      if (!exp) return false;
      const expDate = exp.date ? new Date(exp.date) : new Date();
      if (isNaN(expDate.getTime())) return true;

      if (period === 'today') return expDate.toDateString() === now.toDateString();
      if (period === '7days') return (now.getTime() - expDate.getTime()) / (1000 * 3600 * 24) <= 7;
      if (period === 'month') return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      if (period === 'year') return expDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [expenses, period]);

  // Calculs KPI
  const totalCA = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (Number(s?.total) || 0), 0);
  }, [filteredSales]);

  const totalEncaisse = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (Number(s?.paid) || 0), 0);
  }, [filteredSales]);

  const totalDepenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
  }, [filteredExpenses]);

  // Coût des marchandises vendues (COGS estimé)
  const totalCoutAchat = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    return filteredSales.reduce((acc, sale) => {
      if (!sale) return acc;
      const items = Array.isArray(sale.items) ? sale.items : [];
      const itemsCost = items.reduce((sub, item) => {
        if (!item) return sub;
        const prod = safeProducts.find(p => p.id === item.productId);
        const buyPrice = prod?.buyPrice || (item.unitPrice ? item.unitPrice * 0.7 : 0);
        return sub + (buyPrice * (item.quantity || 0));
      }, 0);
      return acc + itemsCost;
    }, 0);
  }, [filteredSales, products]);

  const margeBrute = totalCA - totalCoutAchat;
  const beneficeNet = margeBrute - totalDepenses;
  const totalCommandes = filteredSales.length;
  const panierMoyen = totalCommandes > 0 ? Math.round(totalCA / totalCommandes) : 0;

  // Données pour le graphique chronologique
  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSales.forEach(s => {
      if (!s) return;
      const d = s.createdAt ? new Date(s.createdAt) : new Date();
      const validDate = isNaN(d.getTime()) ? new Date() : d;
      const key = period === 'today' 
        ? `${validDate.getHours()}h` 
        : `${validDate.getDate()}/${validDate.getMonth() + 1}`;
      map[key] = (map[key] || 0) + (Number(s.total) || 0);
    });

    const entries = Object.entries(map).map(([date, montant]) => ({ date, montant }));
    return entries.length > 0 ? entries : [{ date: 'Période', montant: 0 }];
  }, [filteredSales, period]);

  // Répartition par mode de paiement
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSales.forEach(s => {
      if (!s) return;
      const m = s.paymentMethod || 'cash';
      map[m] = (map[m] || 0) + (Number(s.total) || 0);
    });
    return Object.entries(map).map(([method, total]) => ({
      name: PAYMENT_LABELS[method] || method,
      value: total,
      color: PAYMENT_COLORS[method] || '#6b7280'
    }));
  }, [filteredSales]);

  // Top 5 des produits par CA
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredSales.forEach(s => {
      if (!s) return;
      const items = Array.isArray(s.items) ? s.items : [];
      items.forEach(it => {
        if (!it) return;
        const key = it.productId || it.productName || 'inconnu';
        if (!map[key]) {
          map[key] = { name: it.productName || 'Article', quantity: 0, revenue: 0 };
        }
        map[key].quantity += Number(it.quantity) || 0;
        map[key].revenue += Number(it.total) || 0;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales]);

  // Ventes filtrées par recherche textuelle
  const displayedSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    return filteredSales.filter(s => {
      if (!s) return false;
      if (!q) return true;
      const ref = s.reference || '';
      const cName = s.customerName || '';
      const cBy = s.createdBy || '';
      return ref.toLowerCase().includes(q) ||
        cName.toLowerCase().includes(q) ||
        cBy.toLowerCase().includes(q);
    });
  }, [filteredSales, search]);

  // Export PDF Professionnel
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(22, 101, 52); // Vert Taxawu
    doc.text('Taxawu Gestion - Rapport du Chiffre d\'Affaires', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Période : ${
      period === 'today' ? "Aujourd'hui" :
      period === '7days' ? '7 derniers jours' :
      period === 'month' ? 'Ce mois' :
      period === 'year' ? 'Cette année' : 'Tout l\'historique'
    }`, 14, 28);
    doc.text(`Généré le : ${formatDateTime(new Date().toISOString())}`, 14, 34);

    // Résumé
    autoTable(doc, {
      startY: 42,
      head: [['Indicateur Clé', 'Montant ou Valeur']],
      body: [
        ['Chiffre d\'Affaires Brut', formatCurrency(totalCA)],
        ['Montant Encaissé', formatCurrency(totalEncaisse)],
        ['Nombre de Commandes', `${totalCommandes} commande(s)`],
        ['Panier Moyen', formatCurrency(panierMoyen)],
        ['Total Dépenses', formatCurrency(totalDepenses)],
        ['Bénéfice Net Estimé', formatCurrency(beneficeNet)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] }
    });

    // Détail des Ventes
    const startY = (doc as any).lastAutoTable.finalY + 14;
    doc.setFontSize(14);
    doc.setTextColor(30);
    doc.text('Détail des Encaissements Réalisés', 14, startY);

    autoTable(doc, {
      startY: startY + 6,
      head: [['Réf', 'Date', 'Client', 'Paiement', 'Montant']],
      body: displayedSales.map(s => [
        s.reference,
        formatDateTime(s.createdAt),
        s.customerName || 'Client passage',
        PAYMENT_LABELS[s.paymentMethod] || s.paymentMethod,
        formatCurrency(s.total)
      ]),
      foot: [['', '', '', 'Total CA', formatCurrency(totalCA)]],
      theme: 'grid',
      headStyles: { fillColor: [21, 128, 61] }
    });

    doc.save(`rapport_chiffre_affaires_${period}.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {!hideHeader && (
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="page-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'var(--color-primary-100)', color: 'var(--color-primary-700)'
                }}>
                  📈
                </span>
                Chiffre d'Affaires
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                Analysez vos encaissements, vos marges bénéficiaires et vos performances de vente.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {(['today', '7days', 'month', 'year', 'all'] as PeriodFilter[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      border: 'none',
                      background: period === p ? 'var(--color-primary-600)' : 'transparent',
                      color: period === p ? '#fff' : 'var(--text-secondary)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {p === 'today' ? "Aujourd'hui" :
                     p === '7days' ? '7 Jours' :
                     p === 'month' ? 'Ce Mois' :
                     p === 'year' ? 'Cette Année' : 'Tout'}
                  </button>
                ))}
              </div>

              <button 
                className="btn btn-outline"
                onClick={() => navigate('/dashboard')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Retourner au Tableau de bord"
              >
                ← Tableau de bord
              </button>

              <button 
                className="btn btn-outline"
                onClick={handleExportPDF}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Cartes Clés du Chiffre d'Affaires */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="stat-card-content">
            <span className="stat-card-label">Chiffre d'Affaires Brut</span>
            <span className="stat-card-value text-success">{formatCurrency(totalCA)}</span>
            <span className="stat-card-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              💰 Total facturé ({totalCommandes} ventes)
            </span>
          </div>
          <div className="stat-card-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="stat-card-content">
            <span className="stat-card-label">Montant Encaissé</span>
            <span className="stat-card-value" style={{ color: '#0284c7' }}>{formatCurrency(totalEncaisse)}</span>
            <span className="stat-card-sub">
              {totalCA > 0 ? `${Math.round((totalEncaisse / totalCA) * 100)}% encaissé` : '100% encaissé'}
            </span>
          </div>
          <div className="stat-card-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="stat-card-content">
            <span className="stat-card-label">Panier Moyen</span>
            <span className="stat-card-value" style={{ color: '#8b5cf6' }}>{formatCurrency(panierMoyen)}</span>
            <span className="stat-card-sub">Par transaction</span>
          </div>
          <div className="stat-card-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: `4px solid ${beneficeNet >= 0 ? '#16a34a' : '#dc2626'}` }}>
          <div className="stat-card-content">
            <span className="stat-card-label">Bénéfice Net Estimé</span>
            <span className={`stat-card-value ${beneficeNet >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(beneficeNet)}
            </span>
            <span className="stat-card-sub">
              Après coût d'achat et dépenses
            </span>
          </div>
          <div className={`stat-card-icon ${beneficeNet >= 0 ? 'green' : 'red'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Évolution chronologique */}
        <div className="data-table-wrapper" style={{ padding: '20px', minHeight: '340px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Évolution du Chiffre d'Affaires</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Montants cumulés par période</p>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-600)' }}>
              {formatCurrency(totalCA)}
            </span>
          </div>
          
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'CA']}
                  contentStyle={{ background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
                <Bar dataKey="montant" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition par moyen de paiement */}
        <div className="data-table-wrapper" style={{ padding: '20px', minHeight: '340px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Canaux d'Encaissement</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Répartition par méthode de paiement</p>
          </div>

          {paymentBreakdown.length > 0 ? (
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={4}
                  >
                    {paymentBreakdown.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v) || 0)} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '60px' }}>
              Aucun encaissement sur cette période.
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Produits par CA */}
      <div className="data-table-wrapper" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
          🏆 Meilleurs Produits Générateurs de Chiffre d'Affaires
        </h3>
        {topProducts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topProducts.map((p, idx) => {
              const share = totalCA > 0 ? Math.round((p.revenue / totalCA) * 100) : 0;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ 
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: idx === 0 ? '#fef08a' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#fed7aa' : 'var(--bg-secondary)',
                    color: idx === 0 ? '#854d0e' : '#334155',
                    fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>
                      <span>{p.name}</span>
                      <span style={{ color: 'var(--color-primary-600)' }}>{formatCurrency(p.revenue)} ({share}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '7px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, share)}%`, height: '100%', background: '#16a34a', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '80px', textAlign: 'right' }}>
                    {p.quantity} vendus
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>Aucune vente pour le moment.</p>
        )}
      </div>

      {/* Liste des ventes récentes composant le Chiffre d'Affaires */}
      <div className="data-table-wrapper">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Historique des Encaissements</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              {displayedSales.length} transaction(s) trouvée(s)
            </p>
          </div>
          <div style={{ width: '260px' }}>
            <input 
              type="text" 
              placeholder="Rechercher par référence, client..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date & Heure</th>
                <th>Client</th>
                <th>Moyen de Paiement</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Montant Total (CA)</th>
              </tr>
            </thead>
            <tbody>
              {displayedSales.map(sale => (
                <tr key={sale.id}>
                  <td style={{ fontWeight: 600 }}>{sale.reference}</td>
                  <td>{formatDateTime(sale.createdAt)}</td>
                  <td>{sale.customerName || 'Client passage'}</td>
                  <td>
                    <span 
                      className="badge" 
                      style={{ 
                        background: `${PAYMENT_COLORS[sale.paymentMethod] || '#6b7280'}18`,
                        color: PAYMENT_COLORS[sale.paymentMethod] || '#374151',
                        border: `1px solid ${PAYMENT_COLORS[sale.paymentMethod] || '#6b7280'}40`,
                        fontWeight: 600
                      }}
                    >
                      {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {sale.status === 'completed' ? 'Complétée' : sale.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-600)' }}>
                    {formatCurrency(sale.total)}
                  </td>
                </tr>
              ))}
              {displayedSales.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Aucune vente enregistrée pour cette recherche ou période.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
