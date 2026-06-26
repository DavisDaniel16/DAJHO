import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const Login = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const styles: Record<string, React.CSSProperties> = useMemo(() => ({
    ...baseStyles,
    container: { ...baseStyles.container, backgroundColor: colors.bgTertiary },
    card: { ...baseStyles.card, backgroundColor: colors.bgCard, boxShadow: colors.shadowLg },
    logo: { ...baseStyles.logo, color: colors.textHeading },
    title: { ...baseStyles.title, color: colors.textHeading },
    subtitle: { ...baseStyles.subtitle, color: colors.textSecondary },
    errorAlert: { ...baseStyles.errorAlert, backgroundColor: colors.bgDanger, color: colors.danger },
    label: { ...baseStyles.label, color: colors.textHeading },
    inputIcon: { ...baseStyles.inputIcon, color: colors.textSecondary },
    input: { ...baseStyles.input, border: `1px solid ${colors.borderInput}`, backgroundColor: colors.bgInput, color: colors.textHeading },
    demoCredentials: { ...baseStyles.demoCredentials, backgroundColor: colors.bgTertiary, border: `1px solid ${colors.border}` },
    demoText: { ...baseStyles.demoText, color: colors.textHeading },
    demoLabel: { ...baseStyles.demoLabel, color: colors.textHeading },
    demoValue: { ...baseStyles.demoValue, color: colors.textSecondary },
    submitButton: { ...baseStyles.submitButton, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    footer: { ...baseStyles.footer, borderTopColor: colors.border },
    footerText: { ...baseStyles.footerText, color: colors.textSecondary },
  }), [colors]);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/vender', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    const success = await login(username, password);
    if (!success) {
      setError('Usuario o contraseña incorrectos');
    }
    // Si el login es exitoso, el useEffect se encargará de redirigir
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🚀 DAJHO</div>
          <h1 style={styles.title}>Iniciar sesión</h1>
          <p style={styles.subtitle}>Gestiona tu negocio de manera fácil y rápida</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorAlert}>
              <span style={styles.errorIcon}>❌</span>
              {error}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Usuario</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>👤</span>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          

          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(isLoading ? styles.submitButtonDisabled : {}),
            }}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Cargando...' : '🚀 Iniciar sesión'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>DAJHO v1.0.0 - Gestión para tu negocio</p>
        </div>
      </div>
    </div>
  );
};

// Estilos (igual que antes)
const baseStyles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f4f9',
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a2332',
    marginBottom: '8px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7a8a',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
  },
  errorIcon: {
    fontSize: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a2332',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '16px',
    color: '#6b7a8a',
  },
  input: {
    width: '100%',
    padding: '12px 40px 12px 40px',
    fontSize: '14px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
    backgroundColor: '#f8faff',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px',
  },
  demoCredentials: {
    backgroundColor: '#f8faff',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e0e4e8',
  },
  demoText: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1a2332',
    marginBottom: '8px',
  },
  demoRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    padding: '2px 0',
  },
  demoLabel: {
    fontWeight: '600',
    color: '#1a2332',
    minWidth: '60px',
  },
  demoValue: {
    color: '#6b7a8a',
    fontFamily: 'monospace',
  },
  submitButton: {
    padding: '14px',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'background-color 0.3s',
    marginTop: '8px',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #e0e4e8',
  },
  footerText: {
    fontSize: '12px',
    color: '#6b7a8a',
    margin: 0,
  },
};

export default Login;