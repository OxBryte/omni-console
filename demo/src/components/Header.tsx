import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import omniWide from '../omni-wide.svg';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`app-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="logo-container" onClick={() => navigate('/')}>
        <img src={omniWide} alt="Omni Logo" style={{ height: '16px', width: 'auto', objectFit: 'contain' }} />
      </div>

      <nav className="header-nav">
        <NavLink
          to="/playground"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Playground
        </NavLink>
        <NavLink
          to="/docs"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Documentation
        </NavLink>
      </nav>
    </header>
  );
}
