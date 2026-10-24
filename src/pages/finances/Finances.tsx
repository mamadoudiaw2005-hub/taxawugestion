import { useState } from 'react';
import ChiffreAffaires from './ChiffreAffaires';
import Expenses from '../expenses/Expenses';
import Achats from '../purchases/Achats';
import Dettes from '../debts/Dettes';

export default function Finances() {
  const [activeTab, setActiveTab] = useState<'ca' | 'expenses' | 'purchases' | 'debts'>('ca');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1>Finances & Chiffre d'Affaires</h1>
            <p>Analysez votre chiffre d'affaires, suivez vos dépenses, achats fournisseurs et créances clients.</p>
          </div>
        </div>
        <div style={{ marginTop: '24px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('ca')}
            style={{ 
              background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
              fontWeight: 600, fontSize: '15px', color: activeTab === 'ca' ? 'var(--color-primary-600)' : 'var(--text-muted)',
              borderBottom: activeTab === 'ca' ? '2.5px solid var(--color-primary-600)' : '2.5px solid transparent',
              marginBottom: '-1px'
            }}
          >
            📈 Chiffre d'Affaires
          </button>
          <button 
            onClick={() => setActiveTab('expenses')}
            style={{ 
              background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
              fontWeight: 500, fontSize: '15px', color: activeTab === 'expenses' ? 'var(--color-primary-600)' : 'var(--text-muted)',
              borderBottom: activeTab === 'expenses' ? '2.5px solid var(--color-primary-600)' : '2.5px solid transparent',
              marginBottom: '-1px'
            }}
          >
            Dépenses
          </button>
          <button 
            onClick={() => setActiveTab('purchases')}
            style={{ 
              background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
              fontWeight: 500, fontSize: '15px', color: activeTab === 'purchases' ? 'var(--color-primary-600)' : 'var(--text-muted)',
              borderBottom: activeTab === 'purchases' ? '2.5px solid var(--color-primary-600)' : '2.5px solid transparent',
              marginBottom: '-1px'
            }}
          >
            Achats
          </button>
          <button 
            onClick={() => setActiveTab('debts')}
            style={{ 
              background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
              fontWeight: 500, fontSize: '15px', color: activeTab === 'debts' ? 'var(--color-primary-600)' : 'var(--text-muted)',
              borderBottom: activeTab === 'debts' ? '2.5px solid var(--color-primary-600)' : '2.5px solid transparent',
              marginBottom: '-1px'
            }}
          >
            Dettes
          </button>
        </div>
      </div>

      <div style={{ paddingTop: '16px' }}>
        {activeTab === 'ca' && <ChiffreAffaires hideHeader />}
        {activeTab === 'expenses' && <Expenses hideHeader />}
        {activeTab === 'purchases' && <Achats hideHeader />}
        {activeTab === 'debts' && <Dettes hideHeader />}
      </div>
    </div>
  );
}
