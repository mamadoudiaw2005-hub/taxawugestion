import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../data/mockData';
import type { Product, Sale } from '../../types';

export default function PointOfSale() {
  const { products: allProducts, setProducts, setSales, addToast } = useApp();
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState<{ type: 'percent' | 'fixed', value: number }>({ type: 'percent', value: 0 });
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  const products = allProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or F3 to focus search
      if ((e.ctrlKey && e.key === 'f') || e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // F2 to checkout
      if (e.key === 'F2') {
        e.preventDefault();
        checkout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, paidAmount]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.sellPrice, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = discount.type === 'percent' ? (subtotal * discount.value) / 100 : discount.value;
  const total = Math.max(0, subtotal - discountAmount);
  const change = typeof paidAmount === 'number' ? Math.max(0, paidAmount - total) : 0;

  const checkout = () => {
    if (cart.length === 0) return;
    if (typeof paidAmount === 'number' && paidAmount < total) {
      addToast({ title: 'Erreur', message: 'Le montant payé est insuffisant', type: 'error' });
      return;
    }

    // Record sale
    const newSale: Sale = {
      id: `s${Date.now()}`,
      reference: `VNT-${Date.now().toString().slice(-4)}`,
      customerName: 'Client Comptant',
      items: cart.map(i => ({ productId: i.id, productName: i.name, quantity: i.qty, unitPrice: i.price, total: i.price * i.qty })),
      subtotal,
      discount: discountAmount,
      total,
      paid: typeof paidAmount === 'number' ? paidAmount : total,
      change,
      paymentMethod: 'cash',
      status: 'completed',
      createdAt: new Date().toISOString(),
      createdBy: 'Mamadou Diaw'
    };
    setSales(prev => [newSale, ...prev]);

    // Deduct stock
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.qty) };
      }
      return p;
    }));

    addToast({ title: 'Vente enregistrée', message: `La vente a été validée avec succès. Rendu : ${formatCurrency(change)}`, type: 'success' });
    setCart([]);
    setPaidAmount('');
    setDiscount({ type: 'percent', value: 0 });
  };

  return (
    <div className="pos-layout">
      <div className="pos-products">
        <div className="pos-products-header">
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input ref={searchInputRef} type="text" placeholder="Chercher un produit (Ctrl+F)..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
        <div className="pos-products-grid">
          {products.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: 'var(--text-primary)' }}>Aucun produit disponible en caisse</p>
              <p style={{ fontSize: 13 }}>Ajoutez d'abord vos articles dans le Catalogue pour pouvoir enregistrer des ventes.</p>
            </div>
          ) : (
            products.map(product => (
              <div key={product.id} className="pos-product-card" onClick={() => addToCart(product)}>
                <div className="pos-product-name" title={product.name}>{product.name}</div>
                <div className="pos-product-price">{formatCurrency(product.sellPrice)}</div>
                <div className="pos-product-stock">Stock: {product.stock} {product.unit}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pos-cart">
        <div className="pos-cart-header">
          <h3>Panier Actuel</h3>
        </div>
        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Le panier est vide</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="pos-cart-item">
                <div className="pos-cart-item-info">
                  <div className="pos-cart-item-name">{item.name}</div>
                  <div className="pos-cart-item-price">{formatCurrency(item.price)} x {item.qty}</div>
                </div>
                <div className="pos-cart-item-qty">
                  <button onClick={() => updateQty(item.id, -1)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <div className="pos-cart-item-total">{formatCurrency(item.price * item.qty)}</div>
                <button className="btn-icon pos-cart-item-delete" onClick={() => updateQty(item.id, -item.qty)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            ))
          )}
        </div>
        <div className="pos-cart-summary">
          <div className="pos-cart-summary-row">
            <span>Sous-total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="pos-cart-summary-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Remise</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <select value={discount.type} onChange={e => setDiscount({ ...discount, type: e.target.value as 'percent' | 'fixed' })} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                <option value="percent">%</option>
                <option value="fixed">Montant</option>
              </select>
              <input type="number" value={discount.value} onChange={e => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })} style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
            </div>
          </div>
          {discountAmount > 0 && (
            <div className="pos-cart-summary-row" style={{ color: 'var(--color-error)' }}>
              <span>Montant Remise</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="pos-cart-summary-row total">
            <span>Total TTC</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="pos-cart-summary-row" style={{ marginTop: '8px' }}>
            <span>Montant Reçu</span>
            <input type="number" value={paidAmount} onChange={e => setPaidAmount(parseFloat(e.target.value) || '')} placeholder="0" style={{ width: '100px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', textAlign: 'right' }} />
          </div>
          {typeof paidAmount === 'number' && paidAmount > 0 && (
            <div className="pos-cart-summary-row" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
              <span>Rendu</span>
              <span>{formatCurrency(change)}</span>
            </div>
          )}
        </div>
        <div className="pos-cart-actions">
          <button className="btn btn-primary" onClick={checkout} disabled={cart.length === 0} style={{ padding: '14px', fontSize: 16 }}>
            Encaisser {formatCurrency(total)}
          </button>
        </div>
      </div>
    </div>
  );
}
