import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '6rem', color: 'var(--primary)', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', marginTop: '1rem' }}>Page introuvable</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Link to="/" style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-main)', fontWeight: 500 }}>
          Page d'accueil
        </Link>
        <Link to="/dashboard" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 500 }}>
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
