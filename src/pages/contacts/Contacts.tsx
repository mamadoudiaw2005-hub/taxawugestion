import { useState } from 'react';
import Clients from '../clients/Clients';
import Suppliers from '../suppliers/Suppliers';

export default function Contacts() {
  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers'>('clients');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1>Contacts</h1>
            <p>Gérez vos clients et vos fournisseurs.</p>
          </div>
        </div>
        <div style={{ marginTop: '24px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setActiveTab('clients')}
            style={{ 
              background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
              fontWeight: 500, fontSize: '15px', color: activeTab === 'clients' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'clients' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            Clients
          </button>
          <button 
            onClick={() => setActiveTab('suppliers')}
            style={{ 
              background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
              fontWeight: 500, fontSize: '15px', color: activeTab === 'suppliers' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'suppliers' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            Fournisseurs
          </button>
        </div>
      </div>

      <div style={{ paddingTop: '16px' }}>
        {activeTab === 'clients' && <Clients hideHeader />}
        {activeTab === 'suppliers' && <Suppliers hideHeader />}
      </div>
    </div>
  );
}
