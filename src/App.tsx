import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ToastContainer from './components/common/ToastContainer';
import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Dashboard from './pages/dashboard/Dashboard';

import PointOfSale from './pages/pos/PointOfSale';
import Sales from './pages/sales/Sales';
import Products from './pages/products/Products';
import Categories from './pages/categories/Categories';
import Stocks from './pages/stocks/Stocks';
import Clients from './pages/clients/Clients';
import Suppliers from './pages/suppliers/Suppliers';
import Expenses from './pages/expenses/Expenses';
import Achats from './pages/purchases/Achats';
import Dettes from './pages/debts/Dettes';
import ChiffreAffaires from './pages/finances/ChiffreAffaires';
import Finances from './pages/finances/Finances';
import Utilisateurs from './pages/users/Utilisateurs';
import Parametres from './pages/settings/Parametres';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';
import Profile from './pages/users/Profile';
import SuperAdmin from './pages/admin/SuperAdmin';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ventes" element={<Sales />} />
            <Route path="/caisse" element={<PointOfSale />} />
            <Route path="/produits" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/fournisseurs" element={<Suppliers />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/chiffre-affaires" element={<ChiffreAffaires />} />
            <Route path="/depenses" element={<Expenses />} />
            <Route path="/achats" element={<Achats />} />
            <Route path="/dettes" element={<Dettes />} />
            <Route path="/utilisateurs" element={<Utilisateurs />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/parametres" element={<Parametres />} />
            <Route path="/admin-master" element={<SuperAdmin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
