import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../data/mockData';
import type { Sale } from '../../types';

export default function Sales() {
  const { sales, deleteSale, addToast, shopSettings, currency } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const filteredSales = sales.filter(s => {
    const matchesSearch = s.reference.toLowerCase().includes(search.toLowerCase()) || 
      s.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const downloadJournalPDF = () => {
    try {
      const doc = new jsPDF();
      const shopTitle = shopSettings?.shopName || 'Taxawou Gestion';

      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('JOURNAL DES VENTES & COMMANDES', 14, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${shopTitle} - Exporté le : ${formatDateTime(new Date().toISOString())}`, 14, 21);

      const totalCA = filteredSales.reduce((acc, s) => acc + s.total, 0);

      autoTable(doc, {
        startY: 34,
        head: [['Réf.', 'Client', 'Date', 'Mode Règlement', 'Statut', 'Total']],
        body: filteredSales.map(s => [
          s.reference,
          s.customerName || 'Client Comptant',
          formatDateTime(s.createdAt),
          s.paymentMethod || 'Espèces',
          s.status === 'completed' ? 'Payée' : s.status === 'pending' ? 'En attente' : 'Annulée',
          formatCurrency(s.total)
        ]),
        foot: [['', '', '', '', 'Total CA', formatCurrency(totalCA)]],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8.5 },
      });

      doc.save(`journal_ventes_${new Date().toISOString().slice(0, 10)}.pdf`);
      addToast({ title: 'PDF généré', message: 'Le journal des ventes a été téléchargé en PDF.', type: 'success' });
    } catch (err) {
      console.error(err);
      addToast({ title: 'Erreur', message: 'Échec de génération du journal PDF.', type: 'error' });
    }
  };

  const downloadSaleInvoice = (sale: Sale) => {
    try {
      const doc = new jsPDF();
      const shopTitle = shopSettings?.shopName || 'Taxawou Gestion';

      // Header Facture
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURE / REÇU DE VENTE', 14, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${shopTitle} - ${shopSettings?.address || 'Dakar, Sénégal'} - Tél : ${shopSettings?.phone || '+221 77 123 45 67'}`, 14, 22);
      doc.text(`Devise : ${currency}`, 14, 27);

      // Détails client & facture
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.text(`Réf Facture : ${sale.reference}`, 14, 42);
      doc.text(`Date & Heure : ${formatDateTime(sale.createdAt)}`, 14, 48);
      doc.text(`Client : ${sale.customerName || 'Client Comptant'}`, 14, 54);
      doc.text(`Mode de paiement : ${sale.paymentMethod || 'Espèces'}`, 130, 42);
      doc.text(`Statut : ${sale.status === 'completed' ? 'RÉGLÉ' : 'EN ATTENTE'}`, 130, 48);

      autoTable(doc, {
        startY: 60,
        head: [['Désignation', 'Quantité', 'Prix Unitaire', 'Total']],
        body: sale.items && sale.items.length > 0 ? sale.items.map(item => [
          item.productName,
          `${item.quantity}`,
          formatCurrency(item.unitPrice),
          formatCurrency(item.total)
        ]) : [
          ['Articles divers / Vente comptoir', '1', formatCurrency(sale.total), formatCurrency(sale.total)]
        ],
        foot: [
          ['', '', 'Total Net à Payer', formatCurrency(sale.total)],
          ['', '', 'Montant Reçu', formatCurrency(sale.paid || sale.total)],
          ['', '', 'Monnaie Rendue', formatCurrency(sale.change || 0)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100);
      doc.text(
        shopSettings?.receiptFooter || 'Merci pour votre confiance et à très bientôt !',
        105,
        finalY,
        { align: 'center' }
      );

      doc.save(`facture_${sale.reference}.pdf`);
      addToast({ title: 'Facture PDF générée', message: `Facture ${sale.reference} téléchargée avec succès.`, type: 'success' });
    } catch (err) {
      console.error(err);
      addToast({ title: 'Erreur', message: 'Échec de génération de la facture PDF.', type: 'error' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1>Commandes</h1>
            <p>Suivez l'historique de vos ventes et encaissements.</p>
          </div>
          <button 
            className="btn btn-outline" 
            onClick={downloadJournalPDF}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Télécharger le journal (PDF)
          </button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Chercher par réf. ou client..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="data-table-filters">
            <select className="form-select" style={{ padding: '8px 32px 8px 12px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="completed">Payée</option>
              <option value="pending">En attente</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Date</th>
                <th>Total</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => (
                <tr key={sale.id}>
                  <td style={{ fontWeight: 500 }}>{sale.reference}</td>
                  <td>{sale.customerName}</td>
                  <td>{formatDateTime(sale.createdAt)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>
                    {formatCurrency(sale.total)}
                  </td>
                  <td>
                    <span className={`badge ${sale.status === 'completed' ? 'badge-success' : sale.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                      {sale.status === 'completed' ? 'Payée' : sale.status === 'pending' ? 'En attente' : 'Annulée'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '6px', color: 'var(--color-primary-600, #4f46e5)' }}
                      onClick={() => downloadSaleInvoice(sale)}
                      title="Télécharger la facture PDF"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                    </button>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '6px', color: 'var(--color-error)' }}
                      onClick={() => {
                        deleteSale(sale.id);
                        addToast({ title: 'Commande supprimée', message: `Commande ${sale.reference} retirée.`, type: 'success' });
                      }}
                      title="Supprimer la commande"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-title">Aucune commande trouvée</div>
                      <div className="empty-state-text">Modifiez vos critères de recherche.</div>
                    </div>
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
