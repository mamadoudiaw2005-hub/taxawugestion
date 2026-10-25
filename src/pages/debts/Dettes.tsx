import { useState } from 'react';
import jsPDF from 'jspdf';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../data/mockData';
import type { Debt } from '../../types';

export default function Dettes({ hideHeader = false }: { hideHeader?: boolean }) {
  const { debts, setDebts, deleteDebt, toggleDebtStatus, customers, addToast, currency } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [debtAmount, setDebtAmount] = useState<number | ''>('');
  const [debtDate, setDebtDate] = useState(() => new Date().toISOString().slice(0, 10));

  const filteredDebts = debts.filter(d => 
    d.customerName.toLowerCase().includes(search.toLowerCase()) ||
    (d.customerPhone && d.customerPhone.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectCustomer = (name: string) => {
    setCustomerName(name);
    const existing = customers?.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing && existing.phone && !customerPhone) {
      setCustomerPhone(existing.phone);
    }
  };

  const handleSaveDebt = () => {
    if (!customerName.trim() || !debtAmount || Number(debtAmount) <= 0) {
      addToast({ title: 'Erreur', message: 'Veuillez renseigner le nom du client et le montant de la dette.', type: 'error' });
      return;
    }

    const selectedDateTime = debtDate ? new Date(debtDate) : new Date();
    // Preserve current time if today
    const now = new Date();
    if (selectedDateTime.toDateString() === now.toDateString()) {
      selectedDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    }

    const newDebt: Debt = {
      id: `d${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      amount: Number(debtAmount),
      date: selectedDateTime.toISOString(),
      status: 'unpaid',
    };

    setDebts([newDebt, ...debts]);
    addToast({ title: 'Dette enregistrée', message: 'La dette a été enregistrée avec succès.', type: 'success' });
    
    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setDebtAmount('');
    setDebtDate(new Date().toISOString().slice(0, 10));
    setShowModal(false);
  };

  const downloadPDF = (debt: Debt) => {
    const doc = new jsPDF();
    
    // Simplification du ticket de reçu (Ticket de caisse style)
    doc.setFontSize(16);
    doc.text('TICKET DE CAISSE / REÇU DE DETTE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Identifiant: ${debt.id}`, 14, 30);
    doc.text(`Client: ${debt.customerName}`, 14, 36);
    doc.text(`Téléphone: ${debt.customerPhone || 'Non renseigné'}`, 14, 42);
    const dateObj = new Date(debt.date);
    doc.text(`Date: ${dateObj.toLocaleDateString('fr-FR')} ${dateObj.toLocaleTimeString('fr-FR')}`, 14, 48);
    
    doc.setFontSize(14);
    doc.text(`Montant Total Emprunté: ${formatCurrency(debt.amount)}`, 14, 60);

    doc.setFontSize(10);
    const finalY = 70;
    doc.text('Signature du client:', 14, finalY + 20);
    doc.line(14, finalY + 30, 70, finalY + 30);

    doc.text('Signature du responsable:', 120, finalY + 20);
    doc.line(120, finalY + 30, 190, finalY + 30);

    doc.save(`decharge_dette_${debt.id}.pdf`);
  };

  const handleDeleteDebt = (id: string) => {
    deleteDebt(id);
    addToast({ title: 'Dette supprimée', message: 'La dette a été retirée.', type: 'success' });
  };

  return (
    <div>
      {!hideHeader && (
        <div className="page-header">
          <div className="page-header-top">
            <div>
              <h1>Dettes</h1>
              <p>Gérez les emprunts de clients et générez les fiches de décharge.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Enregistrer une dette
            </button>
          </div>
        </div>
      )}
      {hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Enregistrer une dette
          </button>
        </div>
      )}

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Rechercher par client ou téléphone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebts.map(debt => (
                <tr key={debt.id}>
                  <td>{formatDateTime(debt.date)}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{debt.customerName}</div>
                    {debt.customerPhone && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                        📞 {debt.customerPhone}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: debt.status === 'paid' ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {formatCurrency(debt.amount)}
                  </td>
                  <td>
                    <span 
                      className={`badge ${debt.status === 'paid' ? 'badge-success' : 'badge-error'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleDebtStatus(debt.id)}
                      title="Cliquer pour changer de statut"
                    >
                      {debt.status === 'paid' ? 'Payé' : 'Non payé'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button className="btn-ghost" style={{ padding: '4px', color: 'var(--primary)' }} onClick={() => downloadPDF(debt)} title="Télécharger Fiche PDF">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    <button className="btn-ghost" style={{ padding: '4px', color: 'var(--color-error)' }} onClick={() => handleDeleteDebt(debt.id)} title="Supprimer la dette">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDebts.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-title">Aucune dette trouvée</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>Enregistrer une dette</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Prénom & Nom du client *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Moussa Diop" 
                  list="debts-customer-list"
                  value={customerName} 
                  onChange={e => handleSelectCustomer(e.target.value)} 
                  autoFocus
                />
                {customers && customers.length > 0 && (
                  <datalist id="debts-customer-list">
                    {customers.map(c => (
                      <option key={c.id} value={c.name}>{c.phone ? `(${c.phone})` : ''}</option>
                    ))}
                  </datalist>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Numéro de téléphone <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optionnel / Facultatif)</span>
                </label>
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="Ex: 77 123 45 67 (facultatif)" 
                  value={customerPhone} 
                  onChange={e => setCustomerPhone(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Montant de la dette ({currency}) *</label>
                <input 
                  type="number" 
                  min="0" 
                  className="form-input" 
                  placeholder="Ex: 25000" 
                  value={debtAmount} 
                  onChange={e => setDebtAmount(e.target.value === '' ? '' : Number(e.target.value))} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date de la dette</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={debtDate} 
                  onChange={e => setDebtDate(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSaveDebt}>Enregistrer la dette</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
