import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../data/mockData';
import type { Expense } from '../../types';

export default function Expenses({ hideHeader = false }: { hideHeader?: boolean }) {
  const { expenses, setExpenses, deleteExpense, addToast, currency } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Fonctionnement');

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const downloadSummaryPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Facture des Dépenses - Taxawou Gestion', 14, 20);
    doc.setFontSize(10);
    doc.text(`Généré le : ${formatDateTime(new Date().toISOString())}`, 14, 28);
    
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Description', 'Catégorie', 'Montant']],
      body: filteredExpenses.map(expense => [
        new Date(expense.date).toLocaleDateString('fr-FR'),
        expense.description,
        expense.category,
        formatCurrency(expense.amount)
      ]),
      foot: [['', '', 'Total', formatCurrency(totalAmount)]],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save('facture_depenses.pdf');
  };

  const downloadExpensePDF = (expense: Expense) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Facture / Reçu de Dépense', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`ID: ${expense.id}`, 20, 40);
    doc.text(`Date: ${formatDateTime(expense.date)}`, 20, 50);
    doc.text(`Description: ${expense.description}`, 20, 60);
    doc.text(`Catégorie: ${expense.category}`, 20, 70);
    doc.text(`Montant: ${formatCurrency(expense.amount)}`, 20, 80);
    
    doc.save(`facture_depense_${expense.id}.pdf`);
  };

  const resetForm = () => {
    setFormDesc('');
    setFormAmount('');
    setFormCategory('Fonctionnement');
  };

  const openNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formDesc.trim() || !formAmount || isNaN(Number(formAmount))) {
      addToast({ title: 'Erreur', message: 'La description et un montant valide sont obligatoires.', type: 'error' });
      return;
    }

    const newExpense: Expense = {
      id: `exp${Date.now()}`,
      date: new Date().toISOString(),
      description: formDesc,
      amount: Number(formAmount),
      category: formCategory,
      paymentMethod: 'cash',
      createdBy: 'Mamadou Diaw'
    };

    setExpenses(prev => [newExpense, ...prev]);
    addToast({ title: 'Dépense enregistrée', message: `Dépense de ${formatCurrency(Number(formAmount))} ajoutée.`, type: 'success' });
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    addToast({ title: 'Dépense supprimée', message: 'La dépense a été retirée.', type: 'success' });
  };

  return (
    <div>
      {!hideHeader && (
        <div className="page-header">
          <div className="page-header-top">
            <div>
              <h1>Dépenses</h1>
              <p>Suivez et gérez les sorties d'argent de l'entreprise.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" onClick={downloadSummaryPDF}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Télécharger PDF
              </button>
              <button className="btn btn-primary" onClick={openNew}>
                + Enregistrer une dépense
              </button>
            </div>
          </div>
        </div>
      )}
      {hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
          <button className="btn btn-outline" onClick={downloadSummaryPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Télécharger PDF
          </button>
          <button className="btn btn-primary" onClick={openNew}>
            + Enregistrer une dépense
          </button>
        </div>
      )}

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Rechercher une dépense..." 
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
                <th>Description</th>
                <th>Catégorie</th>
                <th>Montant</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => (
                <tr key={expense.id}>
                  <td>{formatDateTime(expense.date)}</td>
                  <td style={{ fontWeight: 500 }}>{expense.description}</td>
                  <td><span className="badge badge-gray">{expense.category}</span></td>
                  <td style={{ fontWeight: 600, color: 'var(--color-error)' }}>
                    - {formatCurrency(expense.amount)}
                  </td>
                  <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button className="btn-ghost" style={{ padding: '4px', color: 'var(--primary)' }} onClick={() => downloadExpensePDF(expense)} title="Télécharger">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    <button className="btn-ghost" style={{ padding: '4px', color: 'var(--color-error)' }} onClick={() => handleDelete(expense.id)} title="Supprimer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouvelle Dépense */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>Enregistrer une dépense</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input className="form-input" type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Ex: Achat fournitures" />
              </div>
              <div className="form-group">
                <label className="form-label">Montant ({currency}) *</label>
                <input className="form-input" type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Catégorie</label>
                <select className="form-input" value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                  <option value="Fonctionnement">Fonctionnement</option>
                  <option value="Logistique">Logistique</option>
                  <option value="Charges fixes">Charges fixes</option>
                  <option value="Salaires">Salaires</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
