-- =========================================================================
-- SCHÉMA DE BASE DE DONNÉES SUPABASE - TAXAWOU GESTION
-- =========================================================================
-- Ce script SQL crée la structure complète des tables, les clés étrangères,
-- les index et les politiques de sécurité Row Level Security (RLS) pour
-- isoler automatiquement les données par boutique / utilisateur.
--
-- Exécutez ce script dans l'Éditeur SQL de votre tableau de bord Supabase :
-- https://supabase.com/dashboard/project/_/sql
-- =========================================================================

-- Activer l'extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE DES PROFILS UTILISATEURS (Liée à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager', 'cashier')),
    shop_name TEXT DEFAULT 'Ma Boutique',
    phone TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLE DES PARAMÈTRES DE BOUTIQUE & DEVISE
CREATE TABLE IF NOT EXISTS public.shop_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shop_name TEXT NOT NULL DEFAULT 'Ma Boutique',
    phone TEXT,
    email TEXT,
    address TEXT DEFAULT 'Dakar, Sénégal',
    currency TEXT NOT NULL DEFAULT 'FCFA',
    tax_rate NUMERIC(5,2) DEFAULT 0,
    receipt_footer TEXT DEFAULT 'Merci pour votre confiance et à très bientôt !',
    auto_change BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_shop_settings UNIQUE (user_id)
);

-- 3. TABLE DES CATÉGORIES DE PRODUITS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#16a34a',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLE DU CATALOGUE PRODUITS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    reference TEXT NOT NULL,
    category TEXT NOT NULL,
    buy_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    sell_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    unit TEXT NOT NULL DEFAULT 'pièce',
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLE DES CLIENTS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT DEFAULT 'Dakar',
    total_purchases NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLE DES FOURNISSEURS
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT DEFAULT 'Dakar',
    total_purchases NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABLE DES VENTES (COMMANDE CAISSE)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL DEFAULT 'Client Comptant',
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount NUMERIC(15,2) NOT NULL DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    paid NUMERIC(15,2) NOT NULL DEFAULT 0,
    change NUMERIC(15,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'wave', 'orange_money', 'card', 'credit')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
    created_by TEXT DEFAULT 'Administrateur',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. LIGNES D'ARTICLES DE VENTE
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0
);

-- 9. TABLE DES DÉPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'wave', 'orange_money', 'card')),
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by TEXT DEFAULT 'Administrateur'
);

-- 10. TABLE DES CRÉDITS & DETTES CLIENTS
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT, -- Numéro de téléphone facultatif
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la table debts existe déjà dans votre Supabase, exécutez cette commande pour rendre le téléphone facultatif :
-- ALTER TABLE public.debts ALTER COLUMN customer_phone DROP NOT NULL;

-- 11. TABLE DES MOUVEMENTS DE STOCK
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_by TEXT DEFAULT 'Administrateur',
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- ACTIVATION DE LA SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (Chaque utilisateur accède uniquement à ses propres enregistrements)
-- Pour les profils : lecture permise pour l'annuaire d'équipe / admin (y compris compte super admin)
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Anyone can view profiles" ON public.profiles 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or super admin update" ON public.profiles;
CREATE POLICY "Users can update own profile or super admin update" ON public.profiles 
FOR UPDATE TO public 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;
CREATE POLICY "Super admin can delete profiles" ON public.profiles 
FOR DELETE TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'super_admin' OR email = 'admin@taxawu.com')
    )
);

-- =========================================================================
-- PROCÉDURES STOCKÉES SÉCURISÉES POUR LE SUPER ADMINISTRATEUR
-- =========================================================================

-- 1. Suppression définitive d'un compte utilisateur (BDD + Auth Supabase)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Vérifier que l'utilisateur est Super Admin ou que l'action est autorisée
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'super_admin' OR email = 'admin@taxawu.com')
    ) OR auth.uid() IS NULL THEN
        -- Nettoyage des données associées
        DELETE FROM public.stock_movements WHERE user_id = target_user_id;
        DELETE FROM public.debts WHERE user_id = target_user_id;
        DELETE FROM public.expenses WHERE user_id = target_user_id;
        DELETE FROM public.sales WHERE user_id = target_user_id;
        DELETE FROM public.suppliers WHERE user_id = target_user_id;
        DELETE FROM public.customers WHERE user_id = target_user_id;
        DELETE FROM public.products WHERE user_id = target_user_id;
        DELETE FROM public.categories WHERE user_id = target_user_id;
        DELETE FROM public.shop_settings WHERE user_id = target_user_id;
        DELETE FROM public.profiles WHERE id = target_user_id;

        -- Supprimer définitivement du système d'authentification Supabase (auth.users)
        -- L'utilisateur n'aura plus d'accès et devra se réinscrire pour recréer un compte
        DELETE FROM auth.users WHERE id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Action non autorisée : seul le Super Admin peut supprimer un compte.';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated, anon;

-- 2. Modification sécurisée du statut (active / suspended)
CREATE OR REPLACE FUNCTION public.update_user_status_by_admin(target_user_id UUID, new_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    UPDATE public.profiles 
    SET status = new_status, updated_at = timezone('utc'::text, now())
    WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_status_by_admin(UUID, TEXT) TO authenticated, anon;

-- 3. Modification sécurisée de la formule (free / pro)
CREATE OR REPLACE FUNCTION public.update_user_plan_by_admin(target_user_id UUID, new_plan TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    UPDATE public.profiles 
    SET plan = new_plan, updated_at = timezone('utc'::text, now())
    WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_plan_by_admin(UUID, TEXT) TO authenticated, anon;

CREATE POLICY "Users can insert own profile" ON public.profiles 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own shop settings" ON public.shop_settings;
CREATE POLICY "Users can manage own shop settings" ON public.shop_settings FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
CREATE POLICY "Users can manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
CREATE POLICY "Users can manage own products" ON public.products FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own customers" ON public.customers;
CREATE POLICY "Users can manage own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own suppliers" ON public.suppliers;
CREATE POLICY "Users can manage own suppliers" ON public.suppliers FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own sales" ON public.sales;
CREATE POLICY "Users can manage own sales" ON public.sales FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own sale items" ON public.sale_items;
CREATE POLICY "Users can manage own sale items" ON public.sale_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.sales WHERE public.sales.id = public.sale_items.sale_id AND public.sales.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage own expenses" ON public.expenses;
CREATE POLICY "Users can manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own debts" ON public.debts;
CREATE POLICY "Users can manage own debts" ON public.debts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own stock movements" ON public.stock_movements;
CREATE POLICY "Users can manage own stock movements" ON public.stock_movements FOR ALL USING (auth.uid() = user_id);

-- =========================================================================
-- TRIGGER AUTOMATIQUE : CRÉATION DU PROFIL LORS DE L'INSCRIPTION
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, shop_name, avatar_url, status, plan)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'admin'),
        COALESCE(new.raw_user_meta_data->>'shopName', 'Ma Boutique'),
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', NULL),
        'active',
        'pro'
    )
    ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, public.profiles.name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = timezone('utc'::text, now());

    INSERT INTO public.shop_settings (user_id, shop_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'shopName', 'Ma Boutique')
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- SYNCHRONISER IMMÉDIATEMENT LES COMPTES GOOGLE / EMAIL DÉJÀ INSCRITS
-- =========================================================================
INSERT INTO public.profiles (id, name, email, role, shop_name, avatar_url, status, plan)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    email,
    COALESCE(raw_user_meta_data->>'role', 'admin'),
    COALESCE(raw_user_meta_data->>'shopName', 'Ma Boutique'),
    COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', NULL),
    'active',
    'pro'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url;

