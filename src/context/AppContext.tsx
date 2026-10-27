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
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => Promise<void>;
  updateUserPlan: (userId: string, plan: 'free' | 'pro') => Promise<void>;
  deletePlatformUser: (userId: string) => Promise<void>;
  switchUser: (user: User) => void;
  isSuperAdmin: boolean;
  isSuspended: boolean;
  checkCanPerformAction: (actionName?: string) => boolean;

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
      // Purge automatique des anciennes données de démo (catégories/produits mockés résiduels en cache)
      if (
        saved.includes('"id":"cat1"') || 
        saved.includes('"id":"p1"') || 
        saved.includes('RIZ-001') || 
        saved.includes('Patisen SA')
      ) {
        localStorage.removeItem(`taxawou_${key}`);
        return fallback;
      }
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
  whatsapp: '+221 77 000 00 00',
  instagram: 'https://instagram.com/taxawu_gestion',
  email: 'contact@taxawu.com',
  facebook: 'https://facebook.com/taxawugestion',
  tiktok: 'https://tiktok.com/@taxawugestion',
  linkedin: 'https://linkedin.com/company/taxawugestion',
  announcement: 'Plateforme officielle Taxawu Gestion.',
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

const cleanWhatsAppNumber = (val: string): string => {
  if (!val) return '+221 77 000 00 00';
  if (val.includes('wa.me/')) {
    const raw = val.split('wa.me/')[1]?.split('?')[0]?.replace(/\D/g, '') || '';
    if (raw.startsWith('221') && raw.length >= 12) {
      return `+${raw.slice(0, 3)} ${raw.slice(3, 5)} ${raw.slice(5, 8)} ${raw.slice(8, 10)} ${raw.slice(10, 12)}`;
    }
    return raw ? `+${raw}` : '+221 77 000 00 00';
  }
  return val;
};

function loadPlatformSettings(): PlatformSettings {
  try {
    const saved = localStorage.getItem('taxawou_platform_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.whatsapp) parsed.whatsapp = cleanWhatsAppNumber(parsed.whatsapp);
      return { ...defaultPlatformSettings, ...parsed };
    }
    const legacy = localStorage.getItem('footerContacts');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed.whatsapp) parsed.whatsapp = cleanWhatsAppNumber(parsed.whatsapp);
      return { ...defaultPlatformSettings, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load platform settings', e);
  }
  return defaultPlatformSettings;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => loadInitial('notifications', []));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(loadPlatformSettings);

  const [users, setUsers] = useState<User[]>(() => loadInitial('users', []));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      localStorage.removeItem('taxawou_currentUser');
    } catch (e) {
      // ignore
    }
    return loadSessionInitial<User | null>('currentUser', null);
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const currentUserId = currentUser?.id || 'u_default';

  // Multi-tenant isolated entities (clean start for real stores)
  const [products, setProducts] = useState<Product[]>(() => 
    loadInitial(`${currentUserId}_products`, [])
  );
  const [categories, setCategories] = useState<Category[]>(() => 
    loadInitial(`${currentUserId}_categories`, [])
  );
  const [customers, setCustomers] = useState<Customer[]>(() => 
    loadInitial(`${currentUserId}_customers`, [])
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => 
    loadInitial(`${currentUserId}_suppliers`, [])
  );
  const [expenses, setExpenses] = useState<Expense[]>(() => 
    loadInitial(`${currentUserId}_expenses`, [])
  );
  const [debts, setDebts] = useState<Debt[]>(() => 
    loadInitial(`${currentUserId}_debts`, [])
  );
  const [sales, setSales] = useState<Sale[]>(() => 
    loadInitial(`${currentUserId}_sales`, [])
  );
  const [purchases, setPurchases] = useState<Purchase[]>(() => 
    loadInitial(`${currentUserId}_purchases`, [])
  );
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => 
    loadInitial(`${currentUserId}_stockMovements`, [])
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
        const mappedUsers: User[] = data.map(p => {
          const overrideStatus = localStorage.getItem(`taxawou_user_status_${p.id}`) as 'active' | 'suspended' | null;
          const overridePlan = localStorage.getItem(`taxawou_user_plan_${p.id}`) as 'free' | 'pro' | null;

          return {
            id: p.id,
            name: p.name || p.email?.split('@')[0] || 'Utilisateur',
            email: p.email,
            role: (p.role as any) || 'admin',
            shopName: p.shop_name || 'Boutique',
            phone: p.phone || undefined,
            plan: overridePlan || (p.plan as any) || 'pro',
            status: overrideStatus || (p.status as any) || 'active',
            avatar: p.avatar_url || undefined,
            createdAt: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
          };
        });

        // Conserver le Super Admin dans la liste si pas encore présent dans la table SQL
        const hasSuperAdmin = mappedUsers.some(u => u.role === 'super_admin' || u.email === 'admin@taxawu.com');
        const defaultSuperAdmin = mockUsers.find(u => u.role === 'super_admin');
        const mergedUsers = (!hasSuperAdmin && defaultSuperAdmin) ? [defaultSuperAdmin, ...mappedUsers] : mappedUsers;

        setUsers(mergedUsers);
        try {
          localStorage.setItem('taxawou_users', JSON.stringify(mergedUsers));
        } catch (e) {}
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

    const buildUserFromProfile = (u: any, profile?: any): User => {
      const overrideStatus = localStorage.getItem(`taxawou_user_status_${u.id}`) as 'active' | 'suspended' | null;
      const overridePlan = localStorage.getItem(`taxawou_user_plan_${u.id}`) as 'free' | 'pro' | null;

      return {
        id: u.id,
        name: profile?.name || u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Utilisateur',
        email: profile?.email || u.email || '',
        shopName: profile?.shop_name || u.user_metadata?.shopName || ('Boutique ' + (profile?.name || u.user_metadata?.name || 'Taxawu')),
        role: (profile?.role as any) || (u.user_metadata?.role as any) || 'admin',
        avatar: profile?.avatar_url || u.user_metadata?.avatar_url || u.user_metadata?.picture || undefined,
        phone: profile?.phone || undefined,
        status: overrideStatus || (profile?.status as any) || 'active',
        plan: overridePlan || (profile?.plan as any) || 'pro',
        createdAt: profile?.created_at ? profile.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
      };
    };

    const syncProfileToSupabase = async (authUser: any, existingProf?: any) => {
      if (!isSupabaseConfigured || !supabase || !authUser?.id) return;
      try {
        const name = existingProf?.name ||
                     authUser.user_metadata?.name || 
                     authUser.user_metadata?.full_name || 
                     authUser.email?.split('@')[0] || 
                     'Utilisateur';
        const avatarUrl = existingProf?.avatar_url ||
                          authUser.user_metadata?.avatar_url || 
                          authUser.user_metadata?.picture || 
                          null;
        const shopName = existingProf?.shop_name ||
                         authUser.user_metadata?.shopName || 
                         authUser.user_metadata?.shop_name || 
                         ('Boutique ' + name);

        if (existingProf) {
          // Mettre à jour uniquement les métadonnées de présentation SANS écraser le statut ni le plan
          await supabase.from('profiles').update({
            name,
            avatar_url: avatarUrl,
            shop_name: shopName,
            updated_at: new Date().toISOString()
          }).eq('id', authUser.id);
        } else {
          // Nouveau profil
          await supabase.from('profiles').insert({
            id: authUser.id,
            name: name,
            email: authUser.email || '',
            role: authUser.user_metadata?.role || 'admin',
            shop_name: shopName,
            avatar_url: avatarUrl,
            status: 'active',
            plan: 'pro'
          });
        }
      } catch (err) {
        console.warn('Sync profile to Supabase warning:', err);
      }
    };

    const handleAuthUser = async (sessionUser: any) => {
      if (!isSupabaseConfigured || !supabase || !sessionUser) return;
      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle();

        // Si le profil n'existe plus dans la table profiles (supprimé définitivement par le Super Admin)
        if (!profile) {
          console.warn('Compte introuvable dans profiles (supprimé de la base). Déconnexion immédiate.');
          await supabaseAuth.signOut();
          setCurrentUser(null);
          sessionStorage.removeItem('taxawou_currentUser');
          localStorage.removeItem('taxawou_currentUser');
          return;
        }

        const mapped = buildUserFromProfile(sessionUser, profile);
        setCurrentUser(mapped);
        sessionStorage.setItem('taxawou_currentUser', JSON.stringify(mapped));
        await syncProfileToSupabase(sessionUser, profile);
      } catch (err) {
        console.warn('Erreur vérification profil utilisateur:', err);
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
        await handleAuthUser(session.user);
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
        await handleAuthUser(session.user);
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
    setProducts(loadInitial(`${uid}_products`, []));
    setCategories(loadInitial(`${uid}_categories`, []));
    setCustomers(loadInitial(`${uid}_customers`, []));
    setSuppliers(loadInitial(`${uid}_suppliers`, []));
    setExpenses(loadInitial(`${uid}_expenses`, []));
    setDebts(loadInitial(`${uid}_debts`, []));
    setSales(loadInitial(`${uid}_sales`, []));
    setPurchases(loadInitial(`${uid}_purchases`, []));
    setStockMovements(loadInitial(`${uid}_stockMovements`, []));

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

  // Générer des notifications dynamiques basées uniquement sur les données réelles de la boutique
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const realNotifs: Notification[] = [];

    // 1. Alertes de stock critique sur les vrais produits de la boutique
    products.forEach(p => {
      const threshold = p.minStock !== undefined && p.minStock !== null ? p.minStock : 5;
      if (p.stock <= threshold) {
        realNotifs.push({
          id: `stock_${p.id}`,
          title: 'Stock critique',
          message: `${p.name} est presque épuisé (reste ${p.stock} ${p.unit || 'article(s)'})`,
          type: 'warning',
          createdAt: new Date().toISOString(),
          read: false
        });
      }
    });

    // 2. Alertes de dettes impayées réelles
    debts.forEach(d => {
      if (d.status === 'unpaid') {
        realNotifs.push({
          id: `debt_${d.id}`,
          title: 'Dette impayée',
          message: `Dette en attente de règlement pour ${d.customerName || 'Client'} (${formatCurrency(d.amount)})`,
          type: 'error',
          createdAt: d.date || new Date().toISOString(),
          read: false
        });
      }
    });

    setNotifications(realNotifs);
  }, [products, debts, currentUser]);

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

  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.email === 'admin@taxawu.com';
  const isSuspended = Boolean(currentUser && currentUser.status === 'suspended' && !isSuperAdmin);

  // Méthode de vérification des droits d'action
  const checkCanPerformAction = useCallback((actionName = 'cette action'): boolean => {
    if (isSuspended) {
      addToast({
        title: 'Compte suspendu',
        message: `Votre compte est actuellement suspendu par l'administrateur. Vous êtes en mode consultation (lecture seule) : impossible d'effectuer ${actionName}.`,
        type: 'warning'
      });
      return false;
    }
    return true;
  }, [isSuspended, addToast]);

  // Surveillance en temps réel du statut et de l'existence du compte connecté
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client || !currentUser?.id || isSuperAdmin) return;

    let isMounted = true;
    const checkLiveProfile = async () => {
      try {
        const { data: profile } = await client.from('profiles').select('status, plan').eq('id', currentUser.id).maybeSingle();
        if (!isMounted) return;

        // 1. Si le profil n'existe plus dans Supabase -> Compte supprimé par le Super Admin
        if (!profile) {
          addToast({
            title: 'Compte supprimé',
            message: 'Votre compte a été définitivement supprimé par l\'administration. Pour vous reconnecter, vous devez vous réinscrire.',
            type: 'error'
          });
          await logout();
          return;
        }

        // 2. Si le statut de suspension a changé
        const overrideStatus = localStorage.getItem(`taxawou_user_status_${currentUser.id}`) as 'active' | 'suspended' | null;
        if (profile.status && profile.status !== currentUser.status) {
          if (overrideStatus && overrideStatus !== profile.status) {
            // Un changement local récent prime sur l'état non synchronisé de Supabase
          } else {
            setCurrentUser(prev => prev ? { ...prev, status: profile.status as any } : null);
            localStorage.setItem(`taxawou_user_status_${currentUser.id}`, profile.status);
            if (profile.status === 'suspended') {
              addToast({
                title: 'Compte suspendu',
                message: 'Votre compte vient d\'être suspendu par l\'administrateur. Vos données restent visibles en mode consultation (lecture seule).',
                type: 'warning'
              });
            } else if (profile.status === 'active') {
              addToast({
                title: 'Compte réactivé',
                message: 'Votre compte a été réactivé avec succès ! Vous pouvez à nouveau effectuer vos opérations.',
                type: 'success'
              });
            }
          }
        }

        // 3. Si la formule a changé
        if (profile.plan && profile.plan !== currentUser.plan) {
          setCurrentUser(prev => prev ? { ...prev, plan: profile.plan as any } : null);
        }
      } catch (err) {
        // ignorer erreurs réseau ponctuelles
      }
    };

    const timer = setInterval(checkLiveProfile, 4000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [currentUser?.id, currentUser?.status, currentUser?.plan, isSuperAdmin, logout, addToast]);

  // Global deletion handlers sécurisés
  const deleteProduct = useCallback((id: string) => {
    if (!checkCanPerformAction('la suppression de produit')) return;
    setProducts(prev => prev.filter(p => p.id !== id));
  }, [checkCanPerformAction]);

  const deleteCategory = useCallback((id: string) => {
    if (!checkCanPerformAction('la suppression de catégorie')) return;
    setCategories(prev => prev.filter(c => c.id !== id));
  }, [checkCanPerformAction]);

  const deleteCustomer = useCallback((id: string) => {
    if (!checkCanPerformAction('la suppression de client')) return;
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, [checkCanPerformAction]);

  const deleteSupplier = useCallback((id: string) => {
    if (!checkCanPerformAction('la suppression de fournisseur')) return;
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }, [checkCanPerformAction]);

  const deleteExpense = useCallback((id: string) => {
    if (!checkCanPerformAction('la suppression de dépense')) return;
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, [checkCanPerformAction]);

  const deleteDebt = useCallback((id: string) => {
    if (!checkCanPerformAction('la suppression de dette')) return;
    setDebts(prev => prev.filter(d => d.id !== id));
  }, [checkCanPerformAction]);

  const toggleDebtStatus = useCallback((id: string) => {
    if (!checkCanPerformAction('la mise à jour de statut de dette')) return;
    setDebts(prev => prev.map(d => d.id === id ? {
      ...d,
      status: d.status === 'paid' ? 'unpaid' : 'paid'
    } : d));
  }, [checkCanPerformAction]);

  const deleteSale = useCallback((id: string) => {
    if (!checkCanPerformAction('la suppression de vente')) return;
    setSales(prev => prev.filter(s => s.id !== id));
  }, [checkCanPerformAction]);

  const deletePurchase = useCallback((id: string) => {
    if (!checkCanPerformAction('la suppression de commande d\'achat')) return;
    setPurchases(prev => prev.filter(p => p.id !== id));
  }, [checkCanPerformAction]);

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

  const updateUserStatus = useCallback(async (userId: string, status: 'active' | 'suspended') => {
    // 1. Sauvegarde immédiate du statut dans le cache persistant par utilisateur
    try {
      localStorage.setItem(`taxawou_user_status_${userId}`, status);
    } catch (e) {
      console.warn('localStorage error', e);
    }

    // 2. Mise à jour de la mémoire locale et de la liste globale
    setUsers(prev => {
      const updated = prev.map(u => u.id === userId ? { ...u, status } : u);
      try {
        localStorage.setItem('taxawou_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (currentUser?.id === userId) {
      setCurrentUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, status };
        try {
          sessionStorage.setItem('taxawou_currentUser', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    // 3. Persistance dans la base de données Supabase (Table profiles)
    if (isSupabaseConfigured && supabase) {
      try {
        const { error: rpcErr } = await supabase.rpc('update_user_status_by_admin', {
          target_user_id: userId,
          new_status: status
        });
        if (rpcErr) {
          console.warn('RPC update_user_status_by_admin notice:', rpcErr.message);
        }
        // Mise à jour directe de profiles
        const { error: directErr } = await supabase.from('profiles').update({ 
          status, 
          updated_at: new Date().toISOString() 
        }).eq('id', userId);
        if (directErr) {
          console.warn('Direct update profiles status notice:', directErr.message);
        }
      } catch (e) {
        console.warn('Erreur updateUserStatus Supabase:', e);
      }
    }
  }, [currentUser?.id]);

  const updateUserPlan = useCallback(async (userId: string, plan: 'free' | 'pro') => {
    try {
      localStorage.setItem(`taxawou_user_plan_${userId}`, plan);
    } catch (e) {}

    setUsers(prev => {
      const updated = prev.map(u => u.id === userId ? { ...u, plan } : u);
      try {
        localStorage.setItem('taxawou_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (currentUser?.id === userId) {
      setCurrentUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, plan };
        try {
          sessionStorage.setItem('taxawou_currentUser', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: rpcErr } = await supabase.rpc('update_user_plan_by_admin', {
          target_user_id: userId,
          new_plan: plan
        });
        if (rpcErr) {
          console.warn('RPC update_user_plan_by_admin notice:', rpcErr.message);
        }
        await supabase.from('profiles').update({ 
          plan, 
          updated_at: new Date().toISOString() 
        }).eq('id', userId);
      } catch (e) {
        console.warn('Erreur updateUserPlan Supabase:', e);
      }
    }
  }, [currentUser?.id]);

  const deletePlatformUser = useCallback(async (userId: string) => {
    // 1. Suppression de la mémoire locale et du cache
    setUsers(prev => prev.filter(u => u.id !== userId));
    const keys = ['products', 'categories', 'customers', 'suppliers', 'expenses', 'debts', 'sales', 'purchases', 'stockMovements', 'shop_settings', 'currency'];
    keys.forEach(k => localStorage.removeItem(`taxawou_${userId}_${k}`));

    // Si l'utilisateur supprimé est actuellement connecté
    if (currentUser?.id === userId) {
      setCurrentUser(null);
      sessionStorage.removeItem('taxawou_currentUser');
      localStorage.removeItem('taxawou_currentUser');
    }

    // 2. Suppression définitive de la base de données Supabase (BDD et Auth.users)
    if (isSupabaseConfigured && supabase) {
      try {
        const { error: rpcErr } = await supabase.rpc('delete_user_by_admin', {
          target_user_id: userId
        });

        if (rpcErr) {
          console.warn('Fallback suppression tables directe:', rpcErr);
          await supabase.from('stock_movements').delete().eq('user_id', userId);
          await supabase.from('debts').delete().eq('user_id', userId);
          await supabase.from('expenses').delete().eq('user_id', userId);
          await supabase.from('sales').delete().eq('user_id', userId);
          await supabase.from('suppliers').delete().eq('user_id', userId);
          await supabase.from('customers').delete().eq('user_id', userId);
          await supabase.from('products').delete().eq('user_id', userId);
          await supabase.from('categories').delete().eq('user_id', userId);
          await supabase.from('shop_settings').delete().eq('user_id', userId);
          await supabase.from('profiles').delete().eq('id', userId);
        }
      } catch (e) {
        console.warn('Erreur deletePlatformUser Supabase:', e);
      }
    }
  }, [currentUser?.id]);

  const deleteUser = useCallback((id: string) => {
    deletePlatformUser(id);
  }, [deletePlatformUser]);

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
    if (!checkCanPerformAction('la modification des paramètres')) return;
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
  }, [currentUserId, currentUser, setCurrentUser, setUsers, checkCanPerformAction]);

  const formatCurrencyContext = useCallback((amount: number, customCurr?: string) => {
    return formatCurrency(amount, customCurr || currency);
  }, [currency]);

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
      isSuspended,
      checkCanPerformAction,

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
