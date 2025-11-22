import styles from './Button.module.css';

export default function Button({ children, href, onClick, variant = 'primary' }) {
  const Component = href ? 'a' : 'button';

  return (
    <Component href={href} onClick={onClick} className={`${styles.button} ${styles[variant]}`}>
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="#2C5F4F"
          d="M54.6,-26.9C67.1,-9.8,71.1,16.8,60.6,35.1C50.1,53.4,25.1,63.5,-1.5,64.3C-28.1,65.2,-56.2,56.9,-69.6,37C-83,17,-81.8,-14.7,-67.7,-32.7C-53.6,-50.7,-26.8,-54.9,-2.9,-53.2C21,-51.5,42,-44,54.6,-26.9Z"
          transform="translate(100 100)"
        />
      </svg>
      <span className={styles.text}>{children}</span>
    </Component>
  );
}
