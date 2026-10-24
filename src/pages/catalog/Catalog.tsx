import { useState } from 'react';
import Products from '../products/Products';
import Categories from '../categories/Categories';
import Stocks from '../stocks/Stocks';

export default function Catalog() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'stocks'>('products');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1>Catalogue</h1>
            <p>Gérez vos produits, vos catégories et suivez vos stocks.</p>
          </div>
        </div>
        <div style={{ marginTop: '24px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setActiveTab('products')}
            style={{ 
              background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
              fontWeight: 500, fontSize: '15px', color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'products' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            Produits
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            style={{ 
              background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
              fontWeight: 500, fontSize: '15px', color: activeTab === 'categories' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'categories' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            Catégories
          </button>
          <button 
            onClick={() => setActiveTab('stocks')}
            style={{ 
              background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
              fontWeight: 500, fontSize: '15px', color: activeTab === 'stocks' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'stocks' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            Mouvements & Stocks
          </button>
        </div>
      </div>

      <div style={{ paddingTop: '16px' }}>
        {activeTab === 'products' && <Products hideHeader />}
        {activeTab === 'categories' && <Categories hideHeader />}
        {activeTab === 'stocks' && <Stocks hideHeader />}
      </div>
    </div>
  );
}
