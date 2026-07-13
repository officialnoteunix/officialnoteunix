import { useTheme } from '../../context/ThemeContext';
import heroLight from '../../assets/hero_light.png';
import heroDark from '../../assets/hero_dark.png';

export default function HeroIllustration() {
  const { theme } = useTheme();

  return (
    <div style={{
      width: '100%', maxWidth: 500, aspectRatio: '1',
      borderRadius: 'var(--radius-lg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <img 
        src={theme === 'dark' ? heroDark : heroLight} 
        alt="Student learning illustration" 
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
}
