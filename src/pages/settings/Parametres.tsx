import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../data/mockData';

interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
  flag: string;
  description: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'FCFA', label: 'FCFA (Franc CFA)', symbol: 'FCFA', flag: '🇸🇳', description: 'Afrique de l’Ouest et Centrale (XOF / XAF)' },
  { code: 'EUR', label: 'EUR (€ - Euro)', symbol: '€', flag: '🇪🇺', description: 'Zone Euro (France, Europe)' },
  { code: 'USD', label: 'USD ($ - Dollar US)', symbol: '$', flag: '🇺🇸', description: 'Dollar des États-Unis' },
  { code: 'GNF', label: 'GNF (Franc Guinéen)', symbol: 'GNF', flag: '🇬🇳', description: 'Guinée' },
  { code: 'MAD', label: 'MAD (Dirham Marocain)', symbol: 'MAD', flag: '🇲🇦', description: 'Maroc' },
  { code: 'GBP', label: 'GBP (£ - Livre Sterling)', symbol: '£', flag: '🇬🇧', description: 'Royaume-Uni' },
  { code: 'CAD', label: 'CAD ($ - Dollar Canadien)', symbol: 'CAD', flag: '🇨🇦', description: 'Canada' },
];

export default function Parametres() {
  const { 
    currency, 
    setCurrency, 
    shopSettings, 
    updateShopSettings, 
    addToast, 
    formatCurrency,
    products,
    sales,
    customers,
    currentUser
  } = useApp();

  // Local state for the settings form
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currency || 'FCFA');
  const [shopName, setShopName] = useState<string>(shopSettings?.shopName || currentUser?.shopName || 'Ma Boutique');
  const [phone, setPhone] = useState<string>(shopSettings?.phone || currentUser?.phone || '');
  const [email, setEmail] = useState<string>(shopSettings?.email || currentUser?.email || '');
  const [address, setAddress] = useState<string>(shopSettings?.address || 'Dakar, Sénégal');
  const [taxRate, setTaxRate] = useState<number>(shopSettings?.taxRate ?? 0);
  const [receiptFooter, setReceiptFooter] = useState<string>(
    shopSettings?.receiptFooter || 'Merci pour votre confiance et à très bientôt !'
  );
  const [autoChange, setAutoChange] = useState<boolean>(shopSettings?.autoChange ?? true);

  const [activeTab, setActiveTab] = useState<'general' | 'shop' | 'pos' | 'backup'>('general');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Sync when context changes
  useEffect(() => {
    if (currency) setSelectedCurrency(currency);
  }, [currency]);

  useEffect(() => {
    if (shopSettings) {
      if (shopSettings.shopName) setShopName(shopSettings.shopName);
      if (shopSettings.phone) setPhone(shopSettings.phone);
      if (shopSettings.email) setEmail(shopSettings.email);
      if (shopSettings.address) setAddress(shopSettings.address);
      if (typeof shopSettings.taxRate === 'number') setTaxRate(shopSettings.taxRate);
      if (shopSettings.receiptFooter) setReceiptFooter(shopSettings.receiptFooter);
      if (typeof shopSettings.autoChange === 'boolean') setAutoChange(shopSettings.autoChange);
    }
  }, [shopSettings]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Sauvegarder la nouvelle devise
      setCurrency(selectedCurrency);

      // 2. Sauvegarder les paramètres de la boutique
      updateShopSettings({
        shopName,
        phone,
        email,
        address,
        currency: selectedCurrency,
        taxRate: Number(taxRate) || 0,
        receiptFooter,
        autoChange,
      });

      // Feedback visuel et notification Toast
      setTimeout(() => {
        setIsSaving(false);
        setSavedSuccess(true);
        addToast({
          title: 'Paramètres enregistrés !',
          message: `La devise "${selectedCurrency}" et vos préférences ont été sauvegardées avec succès. Tous vos prix s'affichent maintenant en ${selectedCurrency}.`,
          type: 'success',
        });
        setTimeout(() => setSavedSuccess(false), 3000);
      }, 350);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      addToast({
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la sauvegarde.',
        type: 'error',
      });
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const now = new Date();
      const dateFormatted = formatDateTime(now.toISOString());

      // Header Banner
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('TAXAWOU GESTION - RAPPORT DE SAUVEGARDE', 14, 14);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Commerce : ${shopName || 'Ma Boutique'}`, 14, 21);
      doc.text(`Exportation générée le : ${dateFormatted}`, 14, 27);

      // Coordonnées de la boutique
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1. INFORMATIONS COMMERCIALES', 14, 42);

      autoTable(doc, {
        startY: 46,
        head: [['Paramètre', 'Valeur Actuelle']],
        body: [
          ['Nom de l\'établissement', shopName || 'Non renseigné'],
          ['Téléphone de contact', phone || 'Non renseigné'],
          ['Email professionnel', email || 'Non renseigné'],
          ['Adresse physique', address || 'Non renseignée'],
          ['Devise principale active', `${selectedCurrency}`],
          ['Taux de TVA par défaut', `${taxRate}%`],
          ['Date d\'exportation', dateFormatted],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
      });

      // Synthèse financière & métriques
      const afterShopY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('2. SYNTHÈSE GLOBALE DE L\'ACTIVITÉ', 14, afterShopY);

      const totalStockItems = products.reduce((sum, p) => sum + (p.stock || 0), 0);
      const totalStockBuyValue = products.reduce((sum, p) => sum + ((p.buyPrice || 0) * (p.stock || 0)), 0);
      const totalStockSellValue = products.reduce((sum, p) => sum + ((p.sellPrice || 0) * (p.stock || 0)), 0);
      const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);

      autoTable(doc, {
        startY: afterShopY + 4,
        head: [['Indicateur Clé', 'Statistique', 'Valeur Financière Estimée']],
        body: [
          ['Articles au Catalogue', `${products.length} référence(s)`, `Valeur Marchande: ${formatCurrency(totalStockSellValue, selectedCurrency)}`],
          ['Stock Physique Total', `${totalStockItems} unité(s)`, `Valeur d'Achat: ${formatCurrency(totalStockBuyValue, selectedCurrency)}`],
          ['Ventes Enregistrées', `${sales.length} transaction(s)`, `Chiffre d'Affaires: ${formatCurrency(totalSalesRevenue, selectedCurrency)}`],
          ['Portefeuille Clients', `${customers.length} contact(s)`, `Fichier client à jour`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
      });

      // Inventaire des produits
      const afterMetricsY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('3. INVENTAIRE DES PRODUITS & STOCKS', 14, afterMetricsY);

      autoTable(doc, {
        startY: afterMetricsY + 4,
        head: [['Réf', 'Produit', 'Catégorie', 'Stock', 'Prix Vente', 'Valeur Stock']],
        body: products.map(p => [
          p.reference,
          p.name,
          p.category,
          `${p.stock} ${p.unit || 'pcs'}`,
          formatCurrency(p.sellPrice, selectedCurrency),
          formatCurrency(p.sellPrice * p.stock, selectedCurrency)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8, cellPadding: 2 },
      });

      // Ventes récentes
      if (sales.length > 0) {
        const afterProductsY = (doc as any).lastAutoTable.finalY + 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('4. HISTORIQUE RÉCENT DES VENTES', 14, afterProductsY);

        autoTable(doc, {
          startY: afterProductsY + 4,
          head: [['Réf Vente', 'Date', 'Client', 'Paiement', 'Statut', 'Montant']],
          body: sales.slice(0, 30).map(s => [
            s.reference,
            new Date(s.createdAt).toLocaleDateString('fr-FR'),
            s.customerName,
            s.paymentMethod,
            s.status === 'completed' ? 'Payée' : s.status,
            formatCurrency(s.total, selectedCurrency)
          ]),
          foot: [['', '', '', '', 'Total CA', formatCurrency(totalSalesRevenue, selectedCurrency)]],
          theme: 'striped',
          headStyles: { fillColor: [22, 163, 74] },
          styles: { fontSize: 8, cellPadding: 2 },
        });
      }

      // Numérotation des pages
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(140);
        doc.text(
          `Page ${i} sur ${pageCount} - Taxawou Gestion - Sauvegarde PDF officielle`,
          105,
          290,
          { align: 'center' }
        );
      }

      const safeShopName = (shopName || 'Boutique').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`sauvegarde_${safeShopName}_${selectedCurrency}_${now.toISOString().slice(0, 10)}.pdf`);

      addToast({
        title: 'Fichier PDF généré',
        message: 'Votre rapport de sauvegarde PDF complet a été téléchargé avec succès.',
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la génération du PDF.',
        type: 'error',
      });
    }
  };

  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      shopSettings: {
        shopName,
        phone,
        email,
        address,
        currency: selectedCurrency,
        taxRate,
        receiptFooter,
      },
      productsCount: products.length,
      salesCount: sales.length,
      customersCount: customers.length,
      products,
      sales,
      customers,
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taxawou_backup_${selectedCurrency}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({
      title: 'Sauvegarde JSON exportée',
      message: 'Le fichier JSON de vos données a été téléchargé.',
      type: 'info',
    });
  };

  const currentCurrencyInfo = CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];

  return (
    <div className="page-container" style={{ paddingBottom: '60px' }}>
      {/* En-tête de la page */}
      <div className="page-header">
        <div className="page-header-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--color-primary-50, rgba(99, 102, 241, 0.1))',
                color: 'var(--color-primary-600, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                Paramètres de la Boutique
              </h1>
            </div>
            <p className="page-subtitle" style={{ margin: '6px 0 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '14px' }}>
              Personnalisez la monnaie principale, les coordonnées et les préférences de caisse de Taxawou Gestion.
            </p>
          </div>

          {/* Bouton de sauvegarde principal (Header) */}
          <button 
            type="button"
            className="btn btn-primary"
            onClick={() => handleSave()}
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              transition: 'all 0.2s ease',
              backgroundColor: savedSuccess ? '#16a34a' : undefined,
              borderColor: savedSuccess ? '#16a34a' : undefined,
              cursor: isSaving ? 'not-allowed' : 'pointer'
            }}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
                Sauvegarde en cours...
              </>
            ) : savedSuccess ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Enregistré !
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Sauvegarder
              </>
            )}
          </button>
        </div>

        {/* Barre d'onglets moderne */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '24px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          paddingBottom: '2px',
          overflowX: 'auto'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: activeTab === 'general' ? 600 : 500,
              color: activeTab === 'general' ? 'var(--color-primary-600, #4f46e5)' : 'var(--text-secondary, #64748b)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'general' ? '2px solid var(--color-primary-600, #4f46e5)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>💰</span> Monnaie & Devises
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: activeTab === 'shop' ? 600 : 500,
              color: activeTab === 'shop' ? 'var(--color-primary-600, #4f46e5)' : 'var(--text-secondary, #64748b)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'shop' ? '2px solid var(--color-primary-600, #4f46e5)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🏪</span> Coordonnées Boutique
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: activeTab === 'pos' ? 600 : 500,
              color: activeTab === 'pos' ? 'var(--color-primary-600, #4f46e5)' : 'var(--text-secondary, #64748b)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'pos' ? '2px solid var(--color-primary-600, #4f46e5)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🧾</span> Caisse & Facturation
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: activeTab === 'backup' ? 600 : 500,
              color: activeTab === 'backup' ? 'var(--color-primary-600, #4f46e5)' : 'var(--text-secondary, #64748b)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'backup' ? '2px solid var(--color-primary-600, #4f46e5)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>💾</span> Sauvegarde & Export
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <form onSubmit={handleSave} style={{ marginTop: '24px' }}>
        {/* ===================== ONGLET 1 : MONNAIE & DEVISES ===================== */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="data-table-wrapper" style={{ padding: '28px', backgroundColor: 'var(--bg-card, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                    Monnaie Principale du Système
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #64748b)' }}>
                    Tous les prix, totaux de vente, dettes et bilans financiers utiliseront cette devise.
                  </p>
                </div>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: 'var(--color-primary-50, rgba(99, 102, 241, 0.1))',
                  color: 'var(--color-primary-700, #4338ca)',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>Devise actuelle :</span>
                  <strong>{currency}</strong>
                </div>
              </div>

              {/* Sélection visuelle rapide par cartes */}
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '12px' }}>
                  Sélection rapide de la devise :
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '12px',
                }}>
                  {CURRENCIES.map(curr => {
                    const isSelected = selectedCurrency === curr.code;
                    return (
                      <div
                        key={curr.code}
                        onClick={() => setSelectedCurrency(curr.code)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '10px',
                          border: isSelected 
                            ? '2px solid var(--color-primary-600, #4f46e5)' 
                            : '1px solid var(--border-color, #e2e8f0)',
                          backgroundColor: isSelected 
                            ? 'var(--color-primary-50, rgba(99, 102, 241, 0.08))' 
                            : 'var(--bg-primary, #ffffff)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.15)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: '26px' }}>{curr.flag}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? 'var(--color-primary-700, #4338ca)' : 'var(--text-primary, #0f172a)' }}>
                            {curr.code}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {curr.symbol}
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{ color: 'var(--color-primary-600, #4f46e5)', fontWeight: 'bold' }}>
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sélecteur déroulant standard */}
              <div style={{ maxWidth: '500px', marginBottom: '24px' }}>
                <label className="form-label" htmlFor="currency-select" style={{ display: 'block', marginBottom: '8px' }}>
                  Liste complète des devises supportées :
                </label>
                <select 
                  id="currency-select"
                  className="form-select"
                  value={selectedCurrency}
                  onChange={e => setSelectedCurrency(e.target.value)}
                  style={{ width: '100%', fontSize: '15px', fontWeight: 500 }}
                >
                  {CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.flag} {curr.label} - {curr.description}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '6px' }}>
                  {currentCurrencyInfo.description}
                </div>
              </div>

              {/* Aperçu en direct dynamique */}
              <div style={{
                marginTop: '28px',
                padding: '20px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.04) 0%, rgba(99, 102, 241, 0.08) 100%)',
                border: '1px solid rgba(79, 70, 229, 0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '18px' }}>👁️</span>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-primary-800, #3730a3)' }}>
                    Aperçu en direct dans votre application
                  </h4>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    color: '#4f46e5',
                    fontWeight: 600,
                    border: '1px solid rgba(79, 70, 229, 0.2)'
                  }}>
                    Simulation temps réel
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '14px', backgroundColor: 'var(--bg-card, #ffffff)', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginBottom: '4px' }}>Prix unitaire produit</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                      {formatCurrency(15000, selectedCurrency)}
                    </div>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: 'var(--bg-card, #ffffff)', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginBottom: '4px' }}>Total panier en caisse</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary-600, #4f46e5)' }}>
                      {formatCurrency(78500, selectedCurrency)}
                    </div>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: 'var(--bg-card, #ffffff)', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginBottom: '4px' }}>Rendu monnaie au client</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#16a34a' }}>
                      {formatCurrency(1500, selectedCurrency)}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-secondary, #64748b)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>ℹ️</span>
                  <span>Cliquez sur <strong>"Sauvegarder les modifications"</strong> pour propager ce format sur l'ensemble de votre espace de gestion.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== ONGLET 2 : COORDONNÉES BOUTIQUE ===================== */}
        {activeTab === 'shop' && (
          <div className="data-table-wrapper" style={{ padding: '28px', backgroundColor: 'var(--bg-card, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              Identité & Coordonnées de votre commerce
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-secondary, #64748b)' }}>
              Ces coordonnées s'afficheront sur l'en-tête de vos reçus, devis et factures clients.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '800px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="shop-name">Nom de la Boutique / Enseigne *</label>
                <input 
                  id="shop-name"
                  type="text" 
                  className="form-input" 
                  value={shopName} 
                  onChange={e => setShopName(e.target.value)} 
                  placeholder="Ex: Épicerie Centrale Dakar" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="shop-phone">Téléphone de contact *</label>
                <input 
                  id="shop-phone"
                  type="text" 
                  className="form-input" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="Ex: +221 77 123 45 67" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="shop-email">Email professionnel</label>
                <input 
                  id="shop-email"
                  type="email" 
                  className="form-input" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="Ex: contact@maboutique.sn" 
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="shop-address">Adresse physique / Ville</label>
                <input 
                  id="shop-address"
                  type="text" 
                  className="form-input" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  placeholder="Ex: Médina, Rue 6 angle 11, Dakar" 
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== ONGLET 3 : CAISSE & FACTURATION ===================== */}
        {activeTab === 'pos' && (
          <div className="data-table-wrapper" style={{ padding: '28px', backgroundColor: 'var(--bg-card, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              Configuration Caisse & Reçus
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-secondary, #64748b)' }}>
              Personnalisez les calculs de vente et les messages imprimés pour vos clients.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="tax-rate">Taux de TVA par défaut (%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    id="tax-rate"
                    type="number" 
                    min={0}
                    max={100}
                    className="form-input" 
                    value={taxRate} 
                    onChange={e => setTaxRate(Number(e.target.value))} 
                    style={{ maxWidth: '140px' }}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary, #64748b)' }}>
                    (0% si franchise en base ou exonération TVA)
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="receipt-footer">Message en bas de ticket / reçu</label>
                <textarea 
                  id="receipt-footer"
                  className="form-input" 
                  rows={3} 
                  value={receiptFooter} 
                  onChange={e => setReceiptFooter(e.target.value)} 
                  placeholder="Ex: Merci pour votre confiance ! Les articles vendus ne sont ni repris ni échangés."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)'
              }}>
                <input 
                  type="checkbox" 
                  id="auto-change"
                  checked={autoChange} 
                  onChange={e => setAutoChange(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="auto-change" style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary, #0f172a)' }}>
                  Calculer et afficher automatiquement le rendu de monnaie en caisse
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ===================== ONGLET 4 : SAUVEGARDE & EXPORT ===================== */}
        {activeTab === 'backup' && (
          <div className="data-table-wrapper" style={{ padding: '28px', backgroundColor: 'var(--bg-card, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              Sauvegarde et Sécurité de vos données
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-secondary, #64748b)' }}>
              Exportez à tout moment l'intégralité de vos stocks, ventes et clients sous format sécurisé.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-primary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>Produits au catalogue</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary-600, #4f46e5)', marginTop: '4px' }}>
                  {products.length} articles
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-primary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>Ventes enregistrées</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                  {sales.length} transactions
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-primary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>Clients enregistrés</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0284c7', marginTop: '4px' }}>
                  {customers.length} contacts
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleExportPDF}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 24px',
                  fontWeight: 600,
                  fontSize: '14px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.28)',
                  backgroundColor: '#4f46e5',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Télécharger la Sauvegarde Complète (PDF)</span>
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.5px'
                }}>
                  PDF
                </span>
              </button>

              <button 
                type="button" 
                className="btn btn-outline"
                onClick={handleExportData}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 18px',
                  fontSize: '13px',
                  color: 'var(--text-secondary, #64748b)'
                }}
                title="Format JSON technique pour restauration avancée"
              >
                <span>Copie technique (JSON)</span>
              </button>
            </div>
          </div>
        )}

        {/* Bouton de sauvegarde du bas */}
        <div style={{
          marginTop: '32px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '16px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color, #e2e8f0)'
        }}>
          {savedSuccess && (
            <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ✓ Modifications enregistrées avec succès !
            </span>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
              backgroundColor: savedSuccess ? '#16a34a' : undefined,
              borderColor: savedSuccess ? '#16a34a' : undefined,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
                Enregistrement...
              </>
            ) : savedSuccess ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Sauvegardé avec succès !
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Sauvegarder les modifications
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
