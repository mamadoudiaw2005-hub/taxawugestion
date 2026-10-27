// Données fictives de démonstration pour Taxawu Gestion
// Ces données sont utilisées uniquement pour la simulation front-end

import type { Product, Category, Customer, Supplier, Sale, Purchase, Expense, Debt, StockMovement, Notification, User } from '../types';

// ============ UTILISATEURS ============
export const mockUsers: User[] = [
  { id: 'u1', name: 'Mamadou Diaw', email: 'admin@taxawu.com', role: 'super_admin', phone: '77 123 45 67', createdAt: '2024-01-15', shopName: 'Taxawu Administration', status: 'active', plan: 'pro' },
  { id: 'u2', name: 'Fatou Sall', email: 'fatou@taxawu.sn', role: 'admin', phone: '78 234 56 78', createdAt: '2024-03-10', shopName: 'Épicerie Centrale Dakar', status: 'active', plan: 'free' },
  { id: 'u3', name: 'Ousmane Ba', email: 'ousmane@taxawu.sn', role: 'admin', phone: '76 345 67 89', createdAt: '2024-06-20', shopName: 'Boutique Ba & Frères', status: 'active', plan: 'pro' },
];

// ============ CATÉGORIES ============
export const mockCategories: Category[] = [
  { id: 'cat1', name: 'Alimentation', description: 'Produits alimentaires', productCount: 15, color: '#16a34a' },
  { id: 'cat2', name: 'Boissons', description: 'Boissons et jus', productCount: 12, color: '#2563eb' },
  { id: 'cat3', name: 'Hygiène', description: 'Produits d\'hygiène et soins', productCount: 8, color: '#9333ea' },
  { id: 'cat4', name: 'Fournitures', description: 'Fournitures de bureau et maison', productCount: 6, color: '#ea580c' },
  { id: 'cat5', name: 'Électronique', description: 'Appareils et accessoires électroniques', productCount: 4, color: '#0891b2' },
];

// ============ PRODUITS ============
export const mockProducts: Product[] = [
  { id: 'p1', name: 'Riz Brisé Oncle Sam 25kg', reference: 'RIZ-001', category: 'Alimentation', buyPrice: 9500, sellPrice: 11000, stock: 45, minStock: 10, unit: 'sac', createdAt: '2024-01-20' },
  { id: 'p2', name: 'Huile Niinal 20L', reference: 'HUI-001', category: 'Alimentation', buyPrice: 15000, sellPrice: 17500, stock: 20, minStock: 5, unit: 'bidon', createdAt: '2024-01-20' },
  { id: 'p3', name: 'Sucre en poudre 50kg', reference: 'SUC-001', category: 'Alimentation', buyPrice: 22000, sellPrice: 25000, stock: 30, minStock: 8, unit: 'sac', createdAt: '2024-02-01' },
  { id: 'p4', name: 'Lait en poudre Nido 900g', reference: 'LAI-001', category: 'Alimentation', buyPrice: 4500, sellPrice: 5500, stock: 60, minStock: 15, unit: 'boîte', createdAt: '2024-02-05' },
  { id: 'p5', name: 'Coca-Cola 1.5L', reference: 'COC-001', category: 'Boissons', buyPrice: 500, sellPrice: 700, stock: 120, minStock: 30, unit: 'bouteille', createdAt: '2024-02-10' },
  { id: 'p6', name: 'Eau Kirène 1.5L (pack 6)', reference: 'EAU-001', category: 'Boissons', buyPrice: 1200, sellPrice: 1500, stock: 80, minStock: 20, unit: 'pack', createdAt: '2024-02-10' },
  { id: 'p7', name: 'Jus Pressea Mangue 1L', reference: 'JUS-001', category: 'Boissons', buyPrice: 600, sellPrice: 850, stock: 50, minStock: 15, unit: 'bouteille', createdAt: '2024-02-15' },
  { id: 'p8', name: 'Savon OMO 5kg', reference: 'SAV-001', category: 'Hygiène', buyPrice: 3500, sellPrice: 4200, stock: 35, minStock: 10, unit: 'paquet', createdAt: '2024-03-01' },
  { id: 'p9', name: 'Dentifrice Signal 100ml', reference: 'DEN-001', category: 'Hygiène', buyPrice: 800, sellPrice: 1100, stock: 3, minStock: 10, unit: 'tube', createdAt: '2024-03-01' },
  { id: 'p10', name: 'Tomate concentrée Dieg Bou Diar 400g', reference: 'TOM-001', category: 'Alimentation', buyPrice: 450, sellPrice: 600, stock: 90, minStock: 25, unit: 'boîte', createdAt: '2024-03-05' },
  { id: 'p11', name: 'Bouillon Jumbo (carton)', reference: 'BOU-001', category: 'Alimentation', buyPrice: 5000, sellPrice: 6000, stock: 2, minStock: 5, unit: 'carton', createdAt: '2024-03-10' },
  { id: 'p12', name: 'Cahier 200 pages', reference: 'CAH-001', category: 'Fournitures', buyPrice: 300, sellPrice: 450, stock: 100, minStock: 20, unit: 'pièce', createdAt: '2024-03-15' },
  { id: 'p13', name: 'Chargeur Samsung USB-C', reference: 'CHA-001', category: 'Électronique', buyPrice: 2500, sellPrice: 4000, stock: 15, minStock: 5, unit: 'pièce', createdAt: '2024-04-01' },
  { id: 'p14', name: 'Écouteurs Bluetooth', reference: 'ECO-001', category: 'Électronique', buyPrice: 3000, sellPrice: 5500, stock: 8, minStock: 3, unit: 'pièce', createdAt: '2024-04-05' },
  { id: 'p15', name: 'Café Touba 500g', reference: 'CAF-001', category: 'Alimentation', buyPrice: 1500, sellPrice: 2000, stock: 40, minStock: 10, unit: 'paquet', createdAt: '2024-04-10' },
];

// ============ CLIENTS ============
export const mockCustomers: Customer[] = [
  { id: 'c1', name: 'Amadou Diop', phone: '77 111 22 33', email: 'amadou@gmail.com', address: 'Médina, Dakar', city: 'Dakar', totalPurchases: 450000, balance: 0, status: 'active', createdAt: '2024-01-20' },
  { id: 'c2', name: 'Mariama Fall', phone: '78 222 33 44', address: 'Parcelles Assainies', city: 'Dakar', totalPurchases: 280000, balance: -15000, status: 'active', createdAt: '2024-02-15' },
  { id: 'c3', name: 'Ibrahima Ndiaye', phone: '76 333 44 55', address: 'Thiaroye', city: 'Dakar', totalPurchases: 180000, balance: 0, status: 'active', createdAt: '2024-03-10' },
  { id: 'c4', name: 'Aïssatou Sarr', phone: '77 444 55 66', address: 'HLM Grand Yoff', city: 'Dakar', totalPurchases: 95000, balance: -8000, status: 'active', createdAt: '2024-04-05' },
  { id: 'c5', name: 'Moussa Camara', phone: '78 555 66 77', address: 'Keur Massar', city: 'Dakar', totalPurchases: 350000, balance: 0, status: 'active', createdAt: '2024-05-01' },
  { id: 'c6', name: 'Ndèye Awa Diallo', phone: '76 666 77 88', address: 'Guédiawaye', city: 'Dakar', totalPurchases: 42000, balance: -5000, status: 'inactive', createdAt: '2024-06-15' },
];

// ============ FOURNISSEURS ============
export const mockSuppliers: Supplier[] = [
  { id: 's1', name: 'Patisen SA', phone: '33 849 50 50', email: 'contact@patisen.sn', address: 'Zone industrielle, Dakar', city: 'Dakar', totalPurchases: 2500000, balance: -350000, status: 'active', createdAt: '2024-01-10' },
  { id: 's2', name: 'SOBOA', phone: '33 839 20 20', email: 'info@soboa.sn', address: 'Bel Air, Dakar', city: 'Dakar', totalPurchases: 1800000, balance: 0, status: 'active', createdAt: '2024-01-15' },
  { id: 's3', name: 'Kirène Industries', phone: '33 879 10 10', address: 'Sindia', city: 'Thiès', totalPurchases: 950000, balance: -120000, status: 'active', createdAt: '2024-02-01' },
  { id: 's4', name: 'Grossiste Colobane', phone: '77 899 00 11', address: 'Marché Colobane', city: 'Dakar', totalPurchases: 680000, balance: 0, status: 'active', createdAt: '2024-03-01' },
];

// ============ VENTES ============
export const mockSales: Sale[] = [
  {
    id: 'v1', reference: 'VNT-001', customerId: 'c1', customerName: 'Amadou Diop',
    items: [
      { productId: 'p1', productName: 'Riz Brisé Oncle Sam 25kg', quantity: 2, unitPrice: 11000, total: 22000 },
      { productId: 'p10', productName: 'Tomate concentrée 400g', quantity: 5, unitPrice: 600, total: 3000 },
    ],
    subtotal: 25000, discount: 0, total: 25000, paid: 25000, change: 0,
    paymentMethod: 'cash', status: 'completed', createdAt: '2024-10-10T09:30:00', createdBy: 'Mamadou Diaw'
  },
  {
    id: 'v2', reference: 'VNT-002', customerId: 'c2', customerName: 'Mariama Fall',
    items: [
      { productId: 'p5', productName: 'Coca-Cola 1.5L', quantity: 6, unitPrice: 700, total: 4200 },
      { productId: 'p8', productName: 'Savon OMO 5kg', quantity: 1, unitPrice: 4200, total: 4200 },
    ],
    subtotal: 8400, discount: 400, total: 8000, paid: 10000, change: 2000,
    paymentMethod: 'cash', status: 'completed', createdAt: '2024-10-10T10:15:00', createdBy: 'Ousmane Ba'
  },
  {
    id: 'v3', reference: 'VNT-003', customerName: 'Client passage',
    items: [
      { productId: 'p15', productName: 'Café Touba 500g', quantity: 3, unitPrice: 2000, total: 6000 },
    ],
    subtotal: 6000, discount: 0, total: 6000, paid: 6000, change: 0,
    paymentMethod: 'wave', status: 'completed', createdAt: '2024-10-10T11:00:00', createdBy: 'Ousmane Ba'
  },
  {
    id: 'v4', reference: 'VNT-004', customerId: 'c3', customerName: 'Ibrahima Ndiaye',
    items: [
      { productId: 'p2', productName: 'Huile Niinal 20L', quantity: 1, unitPrice: 17500, total: 17500 },
      { productId: 'p3', productName: 'Sucre en poudre 50kg', quantity: 1, unitPrice: 25000, total: 25000 },
    ],
    subtotal: 42500, discount: 2500, total: 40000, paid: 30000, change: 0,
    paymentMethod: 'credit', status: 'pending', createdAt: '2024-10-09T14:30:00', createdBy: 'Mamadou Diaw'
  },
  {
    id: 'v5', reference: 'VNT-005', customerId: 'c5', customerName: 'Moussa Camara',
    items: [
      { productId: 'p13', productName: 'Chargeur Samsung USB-C', quantity: 2, unitPrice: 4000, total: 8000 },
      { productId: 'p14', productName: 'Écouteurs Bluetooth', quantity: 1, unitPrice: 5500, total: 5500 },
    ],
    subtotal: 13500, discount: 500, total: 13000, paid: 13000, change: 0,
    paymentMethod: 'orange_money', status: 'completed', createdAt: '2024-10-09T16:45:00', createdBy: 'Fatou Sall'
  },
  {
    id: 'v6', reference: 'VNT-006', customerName: 'Client passage',
    items: [
      { productId: 'p4', productName: 'Lait en poudre Nido 900g', quantity: 2, unitPrice: 5500, total: 11000 },
    ],
    subtotal: 11000, discount: 0, total: 11000, paid: 11000, change: 0,
    paymentMethod: 'cash', status: 'completed', createdAt: '2024-10-08T09:00:00', createdBy: 'Ousmane Ba'
  },
];

// ============ ACHATS ============
export const mockPurchases: Purchase[] = [
  {
    id: 'a1', reference: 'ACH-001', supplierId: 's1', supplierName: 'Patisen SA',
    items: [
      { productId: 'p10', productName: 'Tomate concentrée 400g', quantity: 100, unitPrice: 450, total: 45000 },
      { productId: 'p11', productName: 'Bouillon Jumbo (carton)', quantity: 20, unitPrice: 5000, total: 100000 },
    ],
    total: 145000, paid: 100000, status: 'received', paymentStatus: 'partial', createdAt: '2024-10-05'
  },
  {
    id: 'a2', reference: 'ACH-002', supplierId: 's2', supplierName: 'SOBOA',
    items: [
      { productId: 'p5', productName: 'Coca-Cola 1.5L', quantity: 200, unitPrice: 500, total: 100000 },
      { productId: 'p7', productName: 'Jus Pressea Mangue 1L', quantity: 100, unitPrice: 600, total: 60000 },
    ],
    total: 160000, paid: 160000, status: 'received', paymentStatus: 'paid', createdAt: '2024-10-03'
  },
  {
    id: 'a3', reference: 'ACH-003', supplierId: 's3', supplierName: 'Kirène Industries',
    items: [
      { productId: 'p6', productName: 'Eau Kirène 1.5L (pack 6)', quantity: 150, unitPrice: 1200, total: 180000 },
    ],
    total: 180000, paid: 80000, status: 'pending', paymentStatus: 'partial', createdAt: '2024-10-08'
  },
];

// ============ DÉPENSES ============
export const mockExpenses: Expense[] = [
  { id: 'e1', category: 'Loyer', description: 'Loyer boutique octobre', amount: 150000, paymentMethod: 'wave', date: '2024-10-01', createdBy: 'Mamadou Diaw' },
  { id: 'e2', category: 'Électricité', description: 'Facture Senelec septembre', amount: 35000, paymentMethod: 'orange_money', date: '2024-10-02', createdBy: 'Mamadou Diaw' },
  { id: 'e3', category: 'Transport', description: 'Livraison marchandises Colobane', amount: 8000, paymentMethod: 'cash', date: '2024-10-05', createdBy: 'Fatou Sall' },
  { id: 'e4', category: 'Eau', description: 'Facture SDE', amount: 12000, paymentMethod: 'wave', date: '2024-10-03', createdBy: 'Mamadou Diaw' },
  { id: 'e5', category: 'Salaires', description: 'Salaire caissier octobre', amount: 100000, paymentMethod: 'wave', date: '2024-10-07', createdBy: 'Mamadou Diaw' },
  { id: 'e6', category: 'Fournitures', description: 'Sachets et emballages', amount: 5000, paymentMethod: 'cash', date: '2024-10-08', createdBy: 'Fatou Sall' },
];

// ============ MOUVEMENTS DE STOCK ============
export const mockStockMovements: StockMovement[] = [
  { id: 'sm1', productId: 'p1', productName: 'Riz Brisé Oncle Sam 25kg', type: 'in', quantity: 50, reason: 'Achat fournisseur', date: '2024-10-05', createdBy: 'Mamadou Diaw' },
  { id: 'sm2', productId: 'p1', productName: 'Riz Brisé Oncle Sam 25kg', type: 'out', quantity: 5, reason: 'Vente', date: '2024-10-06', createdBy: 'Ousmane Ba' },
  { id: 'sm3', productId: 'p5', productName: 'Coca-Cola 1.5L', type: 'in', quantity: 200, reason: 'Achat fournisseur', date: '2024-10-03', createdBy: 'Fatou Sall' },
  { id: 'sm4', productId: 'p9', productName: 'Dentifrice Signal 100ml', type: 'out', quantity: 7, reason: 'Vente', date: '2024-10-07', createdBy: 'Ousmane Ba' },
  { id: 'sm5', productId: 'p11', productName: 'Bouillon Jumbo (carton)', type: 'out', quantity: 18, reason: 'Vente', date: '2024-10-08', createdBy: 'Ousmane Ba' },
];

// ============ DETTES ============
export const mockDebts: Debt[] = [
  { id: 'd1', customerName: 'Amadou Diop', customerPhone: '77 111 22 33', amount: 25000, date: '2024-10-09T14:30:00Z', status: 'unpaid' },
  { id: 'd2', customerName: 'Mariama Fall', customerPhone: '78 222 33 44', amount: 15000, date: '2024-10-10T11:20:00Z', status: 'unpaid' },
  { id: 'd3', customerName: 'Aïssatou Sarr', customerPhone: '77 444 55 66', amount: 8000, date: '2024-10-11T16:45:00Z', status: 'unpaid' },
];

// ============ NOTIFICATIONS ============
export const mockNotifications: Notification[] = [
  { id: 'n1', title: 'Stock faible', message: 'Dentifrice Signal 100ml - Stock: 3 (min: 10)', type: 'warning', read: false, createdAt: '2024-10-10T08:00:00' },
  { id: 'n2', title: 'Rupture imminente', message: 'Bouillon Jumbo (carton) - Stock: 2 (min: 5)', type: 'error', read: false, createdAt: '2024-10-10T08:00:00' },
  { id: 'n3', title: 'Nouvelle vente', message: 'VNT-001 - 25 000 FCFA par Amadou Diop', type: 'success', read: true, createdAt: '2024-10-10T09:30:00' },
  { id: 'n4', title: 'Paiement en attente', message: 'VNT-004 - 10 000 FCFA restant de Ibrahima Ndiaye', type: 'info', read: false, createdAt: '2024-10-09T14:30:00' },
];

// ============ DONNÉES GRAPHIQUES ============
export const salesChartData = [
  { name: 'Lun', ventes: 45000, depenses: 12000 },
  { name: 'Mar', ventes: 62000, depenses: 8000 },
  { name: 'Mer', ventes: 38000, depenses: 35000 },
  { name: 'Jeu', ventes: 71000, depenses: 5000 },
  { name: 'Ven', ventes: 89000, depenses: 15000 },
  { name: 'Sam', ventes: 125000, depenses: 8000 },
  { name: 'Dim', ventes: 56000, depenses: 3000 },
];

export const monthlySalesData = [
  { name: 'Jan', ventes: 850000, depenses: 320000 },
  { name: 'Fév', ventes: 920000, depenses: 280000 },
  { name: 'Mar', ventes: 780000, depenses: 350000 },
  { name: 'Avr', ventes: 1050000, depenses: 290000 },
  { name: 'Mai', ventes: 1120000, depenses: 310000 },
  { name: 'Jun', ventes: 980000, depenses: 340000 },
  { name: 'Jul', ventes: 890000, depenses: 300000 },
  { name: 'Aoû', ventes: 1200000, depenses: 380000 },
  { name: 'Sep', ventes: 1350000, depenses: 310000 },
  { name: 'Oct', ventes: 486000, depenses: 310000 },
];

export const categoryDistribution = [
  { name: 'Alimentation', value: 45, color: '#16a34a' },
  { name: 'Boissons', value: 25, color: '#2563eb' },
  { name: 'Hygiène', value: 15, color: '#9333ea' },
  { name: 'Électronique', value: 10, color: '#0891b2' },
  { name: 'Fournitures', value: 5, color: '#ea580c' },
];

export const topProducts = [
  { name: 'Riz Brisé Oncle Sam 25kg', sales: 85, revenue: 935000 },
  { name: 'Coca-Cola 1.5L', sales: 320, revenue: 224000 },
  { name: 'Tomate concentrée 400g', sales: 210, revenue: 126000 },
  { name: 'Huile Niinal 20L', sales: 45, revenue: 787500 },
  { name: 'Café Touba 500g', sales: 120, revenue: 240000 },
];

// ============ CATÉGORIES DE DÉPENSES ============
export const expenseCategories = [
  'Loyer', 'Électricité', 'Eau', 'Transport', 'Salaires',
  'Fournitures', 'Maintenance', 'Téléphone', 'Internet', 'Taxes', 'Autre'
];

// ============ HELPER ============
export const formatCurrency = (amount: number, customCurrency?: string): string => {
  let curr = customCurrency;
  if (!curr && typeof window !== 'undefined') {
    try {
      curr = localStorage.getItem('taxawou_currency') || 'FCFA';
    } catch {
      curr = 'FCFA';
    }
  }
  if (!curr) curr = 'FCFA';

  // Remplacement de l'espace insécable fin (\u202F) et insécable (\u00A0) par un espace standard (ASCII 32)
  // pour éliminer définitivement l'apparition de slash '/' dans les exports PDF jsPDF
  const formatted = new Intl.NumberFormat('fr-FR')
    .format(amount || 0)
    .replace(/[\u202F\u00A0\u1680\u2000-\u200A\u205F\u3000]/g, ' ');

  if (curr === 'EUR' || curr === '€' || curr.includes('EUR')) {
    return `${formatted} €`;
  }
  if (curr === 'USD' || curr === '$' || curr.includes('USD')) {
    return `$ ${formatted}`;
  }
  if (curr === 'GNF' || curr.includes('GNF')) {
    return `${formatted} GNF`;
  }
  if (curr === 'MAD' || curr.includes('MAD')) {
    return `${formatted} MAD`;
  }
  if (curr === 'GBP' || curr === '£' || curr.includes('GBP')) {
    return `£ ${formatted}`;
  }
  if (curr === 'CAD' || curr.includes('CAD')) {
    return `${formatted} CAD`;
  }
  return `${formatted} FCFA`;
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
