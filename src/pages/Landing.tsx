import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Landing() {
  const { platformSettings: contacts } = useApp();

  return (
    <div className="landing-page">
      {/* Full-Screen Hero Section (Desktop Full-Screen & Mobile Responsive) */}
      <section className="landing-hero-fullscreen">
        {/* Header seamlessly integrated in hero */}
        <header className="landing-header-fullscreen">
          <div className="landing-header-inner">
            <div className="landing-logo-container">
              <div className="css-logo">
                <span className="css-logo-letter">T</span>
                <div className="css-logo-gloss"></div>
              </div>
              <span className="css-logo-text-light">TAXAWU</span>
            </div>
            <Link to="/login" className="btn btn-hero-login">
              Se connecter
            </Link>
          </div>
        </header>

        {/* Hero Body Content */}
        <div className="hero-fullscreen-body">
          <div className="hero-fullscreen-container">
            <div className="hero-content animate-fade-up">
              <div className="hero-pill-badge">
                <span className="hero-pill-dot" />
                🇸🇳 Solution N°1 pour Commerçants au Sénégal
              </div>
              <h1 className="hero-title">
                Gérez votre activité avec <span className="hero-title-gradient">simplicité</span>
              </h1>
              <p className="hero-subtitle">
                Taxawou est la solution complète pour piloter vos ventes, vos stocks, et vos finances en temps réel. Une interface moderne conçue pour vous faire gagner du temps.
              </p>
              
              <div className="hero-actions">
                <Link to="/register" className="btn btn-hero-primary">
                  Commencer gratuitement
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Link>
                <a href="#features" className="btn btn-hero-secondary">
                  Découvrir la solution
                </a>
              </div>

              {/* Trust metrics */}
              <div className="hero-stats-row">
                <div className="hero-stat-item">
                  <span className="hero-stat-number">+1 000</span>
                  <span className="hero-stat-label">Commerçants actifs</span>
                </div>
                <div className="hero-stat-sep"></div>
                <div className="hero-stat-item">
                  <span className="hero-stat-number">100%</span>
                  <span className="hero-stat-label">En temps réel</span>
                </div>
                <div className="hero-stat-sep"></div>
                <div className="hero-stat-item">
                  <span className="hero-stat-number">FCFA</span>
                  <span className="hero-stat-label">Multi-devises & Caisse</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating scroll indicator */}
        <a href="#features" className="hero-scroll-indicator" aria-label="Découvrir les fonctionnalités">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
        </a>
      </section>

      {/* Main Content Body */}
      <div className="landing-body-container">
        {/* Features Section */}
        <section id="features" className="features-section animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="features-section-header">
            <span className="features-section-badge">FONCTIONNALITÉS</span>
            <h2 className="features-section-title">Tout ce qu'il vous faut pour réussir</h2>
            <p className="features-section-subtitle">Conçu spécifiquement pour répondre aux réalités du commerce africain et local</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              </div>
              <h3>Tableau de bord</h3>
              <p>Suivez vos indicateurs clés (chiffre d'affaires, dépenses, bénéfices) en un coup d'œil.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
              <h3>Gestion de Stock</h3>
              <p>Contrôlez vos produits, catégories et mouvements de stocks très facilement.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              </div>
              <h3>Finances & Dettes</h3>
              <p>Gérez vos recettes, vos dépenses et suivez précisément les dettes de vos clients.</p>
            </div>
          </div>
        </section>
      </div>

        {/* Modern Footer */}
        <div className="footer-wave">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
          </svg>
        </div>
        <footer className="landing-footer">
          <div className="footer-container">
            <div className="footer-grid">
              
              {/* Brand Column */}
              <div className="footer-brand">
                <div className="footer-logo">
                  <div className="css-logo" style={{ width: 36, height: 36, borderRadius: 8 }}>
                    <span className="css-logo-letter" style={{ fontSize: 20 }}>T</span>
                    <div className="css-logo-gloss" style={{ borderRadius: '6px 6px 0 0' }}></div>
                  </div>
                  <span className="footer-brand-text">TAXAWU</span>
                </div>
                <p className="footer-description">
                  Pilotez vos ventes et suivez vos finances en toute sérénité.
                </p>
              </div>

              {/* Creators Column */}
              <div className="footer-creators">
                <h4 className="footer-heading">L'Équipe</h4>
                <p className="creators-text">
                  Conçu avec passion par <span className="creator-name">Mamadou Diaw</span> et <span className="creator-name">Souleymane Barry</span>.
                </p>
                <div className="creators-badges">
                  <span className="badge-modern">Développement Web</span>
                  <span className="badge-modern">Innovation</span>
                </div>
              </div>
              
              {/* Contacts Column */}
              <div className="footer-contacts">
                <h4 className="footer-heading">Nous contacter</h4>
                <ul className="modern-contact-list">
                  <li>
                    <a href={`tel:${contacts.phone.replace(/\s+/g, '')}`} className="contact-link">
                      <div className="contact-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                      <span>{contacts.phone}</span>
                    </a>
                  </li>
                  <li>
                    <a 
                      href={(() => {
                        const val = contacts.whatsapp || '';
                        if (val.startsWith('http://') || val.startsWith('https://')) return val;
                        const digits = val.replace(/\D/g, '');
                        if (!digits) return '#';
                        const fullPhone = digits.length === 9 ? `221${digits}` : digits;
                        return `https://wa.me/${fullPhone}`;
                      })()} 
                      className="contact-link" 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      <div className="contact-icon whatsapp"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                      <span>WhatsApp</span>
                    </a>
                  </li>
                  <li>
                    <a href={contacts.instagram} className="contact-link" target="_blank" rel="noreferrer">
                      <div className="contact-icon instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></div>
                      <span>Instagram</span>
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${contacts.email}`} className="contact-link">
                      <div className="contact-icon email"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                      <span>{contacts.email}</span>
                    </a>
                  </li>
                </ul>
              </div>

            </div>
            
            <div className="footer-bottom">
              <div className="footer-bottom-content">
                <p>&copy; {new Date().getFullYear()} TAXAWU Gestion. Tous droits réservés.</p>
                <div className="footer-legal">
                  <span>Made in Senegal 🇸🇳</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
    </div>
  );
}
