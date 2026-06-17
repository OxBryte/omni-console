import { useNavigate } from 'react-router-dom';
import omniWide from '../omni-wide.svg';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="app-footer">
      <div className="section-container footer-content">
        <div className="footer-left">
          <span className="footer-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src={omniWide} alt="Omni Logo" style={{ height: '14px', width: 'auto', objectFit: 'contain', marginRight: '6px' }} />
            Console
          </span>
          <span className="footer-copy">© {new Date().getFullYear()} OmniConsole. All rights reserved.</span>
        </div>
        <div className="footer-links">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://npmjs.com" target="_blank" rel="noopener noreferrer">NPM</a>
          <span className="footer-link-item" onClick={() => navigate('/docs')}>Documentation</span>
          <span className="footer-link-item" onClick={() => navigate('/playground')}>Playground</span>
        </div>
      </div>
    </footer>
  );
}
