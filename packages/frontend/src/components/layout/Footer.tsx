import { Link } from 'react-router-dom';

const footerLinks = [
  {
    title: 'Platform',
    links: [
      { label: 'Browse Notes', to: '/notes' },
      { label: 'Leaderboard', to: '/leaderboard' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help & FAQ', to: '/support' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: 20 }}>Note</span>
            <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 20 }}>UniX</span>
          </Link>
          <p className="footer-tagline">
            Nepal's student note-sharing platform. Share knowledge, help each other succeed.
          </p>
        </div>
        {footerLinks.map(section => (
          <div className="footer-col" key={section.title}>
            <h4 className="footer-heading">{section.title}</h4>
            <ul className="footer-links" role="list" aria-label={section.title}>
              {section.links.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="footer-link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} NoteUniX. Built with care for Nepali students.</p>
      </div>
    </footer>
  );
}