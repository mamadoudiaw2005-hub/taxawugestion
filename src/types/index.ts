// Types partagés pour Taxawou Gestion

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'cashier';
  shopName?: string;
  status?: 'active' | 'suspended';
  plan?: 'free' | 'pro';
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export interface PlatformSettings {
  phone: string;
  whatsapp: string;
  instagram: string;
  email: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
  announcement?: string;
  // Monétisation et Abonnements
  enableFreePlan: boolean;
  enablePaidPlan: boolean;
  proMonthlyPrice: number;
  paymentMethods: {
    wave: boolean;
    orangeMoney: boolean;
  };
}

export interface ShopSettings {
  shopName: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  taxRate: number;
  receiptFooter: string;
  autoChange: boolean;
}

export interface Product {
  id: string;
  name: string;
  reference: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  description?: string;
  image?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  productCount: number;
  color: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  totalPurchases: number;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  totalPurchases: number;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Sale {
  id: string;
  reference: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
  paymentMethod: 'cash' | 'wave' | 'orange_money' | 'card' | 'credit';
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: string;
  createdBy: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  reference: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  paid: number;
  status: 'received' | 'pending' | 'cancelled';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'wave' | 'orange_money' | 'card';
  date: string;
  createdBy: string;
}

export interface Debt {
  id: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  date: string;
  status: 'paid' | 'unpaid';
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: string;
  createdBy: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  revenueChange: number;
  salesChange: number;
  expensesChange: number;
  profitChange: number;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export type Period = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}
