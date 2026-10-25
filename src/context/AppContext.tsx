import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { 
  Notification, 
  Product, 
  Category, 
  Customer, 
  Supplier, 
  Expense, 
  Debt, 
  Sale, 
  Purchase, 
  StockMovement, 
  User,
  PlatformSettings,
  ShopSettings
} from '../types';
import { 
  mockProducts, 
  mockCategories, 
  mockCustomers, 
  mockSuppliers, 
  mockExpenses, 
  mockDebts, 
  mockSales, 
  mockPurchases, 
  mockStockMovements, 
  mockUsers, 
  mockNotifications,
  formatCurrency
} from '../data/mockData';
import { isSupabaseConfigured, supabase, supabaseAuth } from '../lib/supabase';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface AppContextType {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Persisted state
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  deleteProduct: (id: string) => void;

  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  deleteCategory: (id: string) => void;

  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  deleteCustomer: (id: string) => void;

  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  deleteSupplier: (id: string) => void;

  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  deleteExpense: (id: string) => void;

  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  deleteDebt: (id: string) => void;
  toggleDebtStatus: (id: string) => void;

  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  deleteSale: (id: string) => void;

  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  deletePurchase: (id: string) => void;

  stockMovements: StockMovement[];
  setStockMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;

  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  deleteUser: (id: string) => void;

  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
  isLoadingAuth: boolean;
  refreshUsers: () => Promise<void>;

  // Super Admin & Platform control
  platformSettings: PlatformSettings;
  updatePlatformSettings: (settings: Partial<PlatformSettings>) => void;
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => void;
  updateUserPlan: (userId: string, plan: 'free' | 'pro') => void;
  deletePlatformUser: (userId: string) => void;
  switchUser: (user: User) => void;
  isSuperAdmin: boolean;

  // Shop & Currency settings
  currency: string;
  setCurrency: (currency: string) => void;
  shopSettings: ShopSettings;
  updateShopSettings: (settings: Partial<ShopSettings>) => void;
  formatCurrency: (amount: number, customCurrency?: string) => string;
}

export const OFFICIAL_ADMIN = {
  email: 'admin@taxawu.com',
  password: 'TaxawuAdmin@2026',
  name: 'Mamadou Diaw (Admin)'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadInitial<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(`taxawou_${key}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(`Failed to load taxawou_${key} from localStorage:`, e);
  }
  return fallback;
}

function loadSessionInitial<T>(key: string, fallback: T): T {
  try {
    const saved = sessionStorage.getItem(`taxawou_${key}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(`Failed to load taxawou_${key} from sessionStorage:`, e);
  }
  return fallback;
}

const defaultPlatformSettings: PlatformSettings = {
  phone: '+221 77 000 00 00',
  whatsapp: 'https://wa.me/221770000000',
  instagram: 'https://instagram.com/taxawu_gestion',
  email: 'contact@taxawu.com',
  facebook: 'https://facebook.com/taxawugestion',
  tiktok: 'https://tiktok.com/@taxawugestion',
  linkedin: 'https://linkedin.com/company/taxawugestion',
  announcement: 'Plateforme officielle Taxawou Gestion.',
  enableFreePlan: true,
  enablePaidPlan: true,
  proMonthlyPrice: 15000,
  paymentMethods: {
    wave: true,
    orangeMoney: true
  }
};

const defaultShopSettings: ShopSettings = {
  shopName: 'Ma Boutique',
  phone: '',
  email: '',
  address: 'Dakar, Sénégal',
  currency: 'FCFA',
  taxRate: 0,
  receiptFooter: 'Merci pour votre confiance et à très bientôt !',
  autoChange: true
};

function loadPlatformSettings(): PlatformSettings {
  try {
    const saved = localStorage.getItem('taxawou_platform_settings');
    if (saved) return JSON.parse(saved);
    const legacy = localStorage.getItem('footerContacts');
    if (legacy) return { ...defaultPlatformSettings, ...JSON.parse(legacy) };
  } catch (e) {
    console.error('Failed to load platform settings', e);
  }
  return defaultPlatformSettings;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => loadInitial('notifications', mockNotifications));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(loadPlatformSettings);

  const [users, setUsers] = useState<User[]>(() => loadInitial('users', mockUsers));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      localStorage.removeItem('taxawou_currentUser');
    } catch (e) {
      // ignore
    }
    return loadSessionInitial<User | null>('currentUser', null);
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const currentUserId = currentUser?.id || 'u1';

  // Multi-tenant isolated entities
  const [products, setProducts] = useState<Product[]>(() => 
    loadInitial(`${currentUserId}_products`, currentUserId === 'u1' ? (loadInitial('products', mockProducts)) : [])
  );
  const [categories, setCategories] = useState<Category[]>(() => 
    loadInitial(`${currentUserId}_categories`, mockCategories)
  );
  const [customers, setCustomers] = useState<Customer[]>(() => 
    loadInitial(`${currentUserId}_customers`, currentUserId === 'u1' ? (loadInitial('customers', mockCustomers)) : [])
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => 
    loadInitial(`${currentUserId}_suppliers`, currentUserId === 'u1' ? (loadInitial('suppliers', mockSuppliers)) : [])
  );
  const [expenses, setExpenses] = useState<Expense[]>(() => 
    loadInitial(`${currentUserId}_expenses`, currentUserId === 'u1' ? (loadInitial('expenses', mockExpenses)) : [])
  );
  const [debts, setDebts] = useState<Debt[]>(() => 
    loadInitial(`${currentUserId}_debts`, currentUserId === 'u1' ? (loadInitial('debts', mockDebts)) : [])
  );
  const [sales, setSales] = useState<Sale[]>(() => 
    loadInitial(`${currentUserId}_sales`, currentUserId === 'u1' ? (loadInitial('sales', mockSales)) : [])
  );
  const [purchases, setPurchases] = useState<Purchase[]>(() => 
    loadInitial(`${currentUserId}_purchases`, currentUserId === 'u1' ? (loadInitial('purchases', mockPurchases)) : [])
  );
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => 
    loadInitial(`${currentUserId}_stockMovements`, currentUserId === 'u1' ? (loadInitial('stockMovements', mockStockMovements)) : [])
  );

  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem(`taxawou_${currentUserId}_currency`) 
      || localStorage.getItem('taxawou_currency') 
      || 'FCFA';
  });

  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => {
    const saved = loadInitial<ShopSettings | null>(`${currentUserId}_shop_settings`, null);
    const initialCurrency = localStorage.getItem(`taxawou_${currentUserId}_currency`) || localStorage.getItem('taxawou_currency') || 'FCFA';
    return {
      ...defaultShopSettings,
      shopName: currentUser?.shopName || defaultShopSettings.shopName,
      phone: currentUser?.phone || defaultShopSettings.phone,
      email: currentUser?.email || defaultShopSettings.email,
      currency: initialCurrency,
      ...(saved || {})
    };
  });

  // Synchroniser les profils utilisateurs depuis Supabase (Table profiles)
  const refreshUsers = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const mappedUsers: User[] = data.map(p => ({
          id: p.id,
          name: p.name || p.email?.split('@')[0] || 'Utilisateur',
          email: p.email,
          role: (p.role as any) || 'admin',
          shopName: p.shop_name || 'Boutique',
          phone: p.phone || undefined,
          plan: (p.plan as any) || 'pro',
          status: (p.status as any) || 'active',
          avatar: p.avatar_url || undefined,
          createdAt: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
        }));

        // Conserver le Super Admin dans la liste si pas encore présent dans la table SQL
        const hasSuperAdmin = mappedUsers.some(u => u.role === 'super_admin' || u.email === 'admin@taxawu.com');
        const defaultSuperAdmin = mockUsers.find(u => u.role === 'super_admin');
        const mergedUsers = (!hasSuperAdmin && defaultSuperAdmin) ? [defaultSuperAdmin, ...mappedUsers] : mappedUsers;

        setUsers(mergedUsers);
      }
    } catch (e) {
      console.warn('Erreur chargement utilisateurs Supabase:', e);
    }
  }, []);

  // Synchronisation avec Supabase Auth
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoadingAuth(false);
      return;
    }

    const extractProfile = (u: any): User => ({
      id: u.id,
      name: u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Utilisateur',
      email: u.email || '',
      shopName: u.user_metadata?.shopName || ('Boutique ' + (u.user_metadata?.name || u.user_metadata?.full_name || 'Taxawou')),
      role: (u.user_metadata?.role as any) || 'admin',
      avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || undefined,
      status: 'active',
      plan: 'pro',
      createdAt: new Date().toISOString().split('T')[0]
    });

    const syncProfileToSupabase = async (authUser: any) => {
      if (!isSupabaseConfigured || !supabase || !authUser?.id) return;
      try {
        const name = authUser.user_metadata?.name || 
                     authUser.user_metadata?.full_name || 
                     authUser.email?.split('@')[0] || 
                     'Utilisateur';
        const avatarUrl = authUser.user_metadata?.avatar_url || 
                          authUser.user_metadata?.picture || 
                          null;
        const shopName = authUser.user_metadata?.shopName || 
                         authUser.user_metadata?.shop_name || 
                         ('Boutique ' + name);

        await supabase.from('profiles').upsert({
          id: authUser.id,
          name: name,
          email: authUser.email || '',
          role: authUser.user_metadata?.role || 'admin',
          shop_name: shopName,
          avatar_url: avatarUrl,
          status: 'active'
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('Sync profile to Supabase warning:', err);
      }
    };

    // Purge toute ancienne session Supabase persistante dans le localStorage
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      // ignore
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(extractProfile(session.user));
        await syncProfileToSupabase(session.user);
      } else {
        const sessionUser = loadSessionInitial<User | null>('currentUser', null);
        if (sessionUser && sessionUser.role !== 'super_admin') {
          setCurrentUser(null);
          sessionStorage.removeItem('taxawou_currentUser');
        }
      }
      setIsLoadingAuth(false);
      refreshUsers();
    }).catch(() => {
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(extractProfile(session.user));
        await syncProfileToSupabase(session.user);
        refreshUsers();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        sessionStorage.removeItem('taxawou_currentUser');
      }
      setIsLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUsers]);

  // Déconnexion officielle
  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      try {
        await supabaseAuth.signOut();
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    setCurrentUser(null);
    sessionStorage.removeItem('taxawou_currentUser');
    localStorage.removeItem('taxawou_currentUser');
  }, []);

  // When currentUser changes, reload isolated state
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.id;
    setProducts(loadInitial(`${uid}_products`, uid === 'u1' ? (loadInitial('products', mockProducts)) : []));
    setCategories(loadInitial(`${uid}_categories`, mockCategories));
    setCustomers(loadInitial(`${uid}_customers`, uid === 'u1' ? (loadInitial('customers', mockCustomers)) : []));
    setSuppliers(loadInitial(`${uid}_suppliers`, uid === 'u1' ? (loadInitial('suppliers', mockSuppliers)) : []));
    setExpenses(loadInitial(`${uid}_expenses`, uid === 'u1' ? (loadInitial('expenses', mockExpenses)) : []));
    setDebts(loadInitial(`${uid}_debts`, uid === 'u1' ? (loadInitial('debts', mockDebts)) : []));
    setSales(loadInitial(`${uid}_sales`, uid === 'u1' ? (loadInitial('sales', mockSales)) : []));
    setPurchases(loadInitial(`${uid}_purchases`, uid === 'u1' ? (loadInitial('purchases', mockPurchases)) : []));
    setStockMovements(loadInitial(`${uid}_stockMovements`, uid === 'u1' ? (loadInitial('stockMovements', mockStockMovements)) : []));

    const savedSettings = loadInitial<ShopSettings | null>(`${uid}_shop_settings`, null);
    const userCurr = localStorage.getItem(`taxawou_${uid}_currency`) || savedSettings?.currency || localStorage.getItem('taxawou_currency') || 'FCFA';
    setCurrencyState(userCurr);
    localStorage.setItem('taxawou_currency', userCurr);
    setShopSettings({
      ...defaultShopSettings,
      shopName: currentUser.shopName || defaultShopSettings.shopName,
      phone: currentUser.phone || defaultShopSettings.phone,
      email: currentUser.email || defaultShopSettings.email,
      currency: userCurr,
      ...(savedSettings || {})
    });
  }, [currentUser?.id]);

  // Sync isolated data to localStorage per user
  useEffect(() => { localStorage.setItem(`taxawou_${currentUserId}_products`, JSON.stringify(products)); }, [products, currentUserId]);
  useEffect(() => { localStorage.setItem(`taxawou_${currentUserId}_categories`, JSON.stringify(categories)); }, [categories, currentUserId]);
  useEffect(() => { localStorage.setItem(`taxawou_${currentUserId}_customers`, JSON.stringify(customers)); }, [customers, currentUserId]);
  useEffect(() => { localStorage.setItem(`taxawou_${currentUserId}_suppliers`, JSON.stringify(suppliers)); }, [suppliers, currentUserId]);
  useEffect(() => { localStorage.setItem(`taxawou_${currentUserId}_expenses`, JSON.stringify(expenses)); }, [expenses, currentUserId]);
  useEffect(() => { localStorage.setItem(`taxawou_${currentUserId}_debts`, JSON.stringify(debts)); }, [debts, currentUserId]);
  useEffect(() => { localStorage.setItem(`taxawou_${currentUserId}_sales`, JSON.stringify(sales)); }, [sales, currentUserId]);
  useEffect(() => { localStorage.setItem(`taxawou_${currentUserId}_purchases`, JSON.stringify(purchases)); }, [purchases, currentUserId]);
  useEffect(() => { localStorage.setItem(`taxawou_${currentUserId}_stockMovements`, JSON.stringify(stockMovements)); }, [stockMovements, currentUserId]);
  useEffect(() => { localStorage.setItem('taxawou_users', JSON.stringify(users)); }, [users]);
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('taxawou_currentUser', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('taxawou_currentUser');
    }
    localStorage.removeItem('taxawou_currentUser');
  }, [currentUser]);
  useEffect(() => { localStorage.setItem('taxawou_notifications', JSON.stringify(notifications)); }, [notifications]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Global deletion handlers
  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
  }, []);

  const toggleDebtStatus = useCallback((id: string) => {
    setDebts(prev => prev.map(d => d.id === id ? {
      ...d,
      status: d.status === 'paid' ? 'unpaid' : 'paid'
    } : d));
  }, []);

  const deleteSale = useCallback((id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
  }, []);

  const deletePurchase = useCallback((id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const updatePlatformSettings = useCallback((newSettings: Partial<PlatformSettings>) => {
    setPlatformSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('taxawou_platform_settings', JSON.stringify(updated));
      localStorage.setItem('footerContacts', JSON.stringify({
        phone: updated.phone,
        whatsapp: updated.whatsapp,
        instagram: updated.instagram,
        email: updated.email
      }));
      return updated;
    });
  }, []);

  const updateUserStatus = useCallback((userId: string, status: 'active' | 'suspended') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
  }, []);

  const updateUserPlan = useCallback((userId: string, plan: 'free' | 'pro') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan } : u));
  }, []);

  const deletePlatformUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    const keys = ['products', 'categories', 'customers', 'suppliers', 'expenses', 'debts', 'sales', 'purchases', 'stockMovements'];
    keys.forEach(k => localStorage.removeItem(`taxawou_${userId}_${k}`));
  }, []);

  const switchUser = useCallback((user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('taxawou_currentUser', JSON.stringify(user));
    localStorage.removeItem('taxawou_currentUser');
  }, []);

  const setCurrency = useCallback((newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(`taxawou_${currentUserId}_currency`, newCurrency);
    localStorage.setItem('taxawou_currency', newCurrency);
    setShopSettings(prev => {
      const next = { ...prev, currency: newCurrency };
      localStorage.setItem(`taxawou_${currentUserId}_shop_settings`, JSON.stringify(next));
      return next;
    });
  }, [currentUserId]);

  const updateShopSettings = useCallback((newSettings: Partial<ShopSettings>) => {
    setShopSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(`taxawou_${currentUserId}_shop_settings`, JSON.stringify(updated));
      if (newSettings.currency) {
        setCurrencyState(newSettings.currency);
        localStorage.setItem(`taxawou_${currentUserId}_currency`, newSettings.currency);
        localStorage.setItem('taxawou_currency', newSettings.currency);
      }
      return updated;
    });
    if (newSettings.shopName && currentUser) {
      const updatedUser = { ...currentUser, shopName: newSettings.shopName };
      setCurrentUser(updatedUser);
      setUsers(all => all.map(u => u.id === currentUser.id ? updatedUser : u));
    }
  }, [currentUserId, currentUser, setCurrentUser, setUsers]);

  const formatCurrencyContext = useCallback((amount: number, customCurr?: string) => {
    return formatCurrency(amount, customCurr || currency);
  }, [currency]);

  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.email === 'admin@taxawu.com';

  return (
    <AppContext.Provider value={{
      sidebarCollapsed,
      toggleSidebar,
      mobileSidebarOpen,
      setMobileSidebarOpen,
      notifications,
      setNotifications,
      toasts,
      addToast,
      removeToast,
      theme,
      toggleTheme,

      products,
      setProducts,
      deleteProduct,

      categories,
      setCategories,
      deleteCategory,

      customers,
      setCustomers,
      deleteCustomer,

      suppliers,
      setSuppliers,
      deleteSupplier,

      expenses,
      setExpenses,
      deleteExpense,

      debts,
      setDebts,
      deleteDebt,
      toggleDebtStatus,

      sales,
      setSales,
      deleteSale,

      purchases,
      setPurchases,
      deletePurchase,

      stockMovements,
      setStockMovements,

      users,
      setUsers,
      deleteUser,

      currentUser,
      setCurrentUser,
      logout,
      isLoadingAuth,
      refreshUsers,

      platformSettings,
      updatePlatformSettings,
      updateUserStatus,
      updateUserPlan,
      deletePlatformUser,
      switchUser,
      isSuperAdmin,

      currency,
      setCurrency,
      shopSettings,
      updateShopSettings,
      formatCurrency: formatCurrencyContext,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
