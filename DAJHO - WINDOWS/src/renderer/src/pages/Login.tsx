import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Rocket, Loader, LogIn, AlertCircle, Eye, EyeOff, User, Lock } from 'lucide-react';

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
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePwError, setChangePwError] = useState('');

  useEffect(() => {
    if (isAuthenticated && !showChangePw) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, showChangePw]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    const result = await login(username, password);
    if (result === false) {
      setError('Usuario o contraseña incorrectos');
    } else if (typeof result === 'string') {
      setError(result);
    } else {
      // Si es el propietario con contraseña por defecto, forzar cambio
      const user = await window.dajhoAPI.users.findByUsername(username.toLowerCase().trim());
      if (user?.role === 'owner' && password === 'propietario123') {
        setShowChangePw(true);
      }
    }
  };

  // Desbloquear cuenta (solo propietario, verificando con su contraseña)
  const handleAdminUnlock = async () => {
    const masterPw = prompt('Ingresa tu contraseña de propietario para desbloquear:');
    if (!masterPw) return;
    try {
      // Verificar contra el usuario "propietario"
      const ownerData = await window.dajhoAPI.users.login('propietario', masterPw);
      if (ownerData?.id && ownerData.role === 'owner') {
        // Buscar el usuario bloqueado y desbloquearlo
        const lockedUsers = await window.dajhoAPI.users.getLocked();
        if (lockedUsers && lockedUsers.length > 0) {
          for (const u of lockedUsers) {
            await window.dajhoAPI.users.unlock(u.id);
          }
          alert('Cuenta(s) desbloqueada(s) exitosamente. Intenta iniciar sesion de nuevo.');
          setError('');
        } else {
          alert('No hay cuentas bloqueadas en este momento.');
        }
      } else {
        alert('Contrasena de propietario incorrecta.');
      }
    } catch (err) {
      alert('Error al desbloquear. Intenta de nuevo.');
      console.error(err);
    }
  };

  const handleChangePassword = async () => {
    setChangePwError('');
    if (!newPassword || newPassword.length < 6) {
      setChangePwError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePwError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword === 'propietario123') {
      setChangePwError('Debes elegir una contraseña diferente a la predeterminada');
      return;
    }
    try {
      const user = await window.dajhoAPI.users.findByUsername(username.toLowerCase().trim());
      if (user?.id) {
        await window.dajhoAPI.users.update(user.id, { password: newPassword });
        setShowChangePw(false);
        alert('Contraseña cambiada exitosamente');
      }
    } catch (err) {
      setChangePwError('Error al cambiar la contraseña');
    }
  };

  const renderSubmitButton = () => {
    if (isLoading) return React.createElement('span', null, React.createElement(Loader, { size: 18, className: 'spinner-icon', style: { marginRight: 6 } }), ' Cargando');
    return React.createElement('span', null, React.createElement(LogIn, { size: 18, style: { marginRight: 6 } }), ' Iniciar sesion');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}><Rocket size={32} style={{ marginRight: 8 }} /> DAJHO</div>
          <h1 style={styles.title}>Iniciar sesión</h1>
          <p style={styles.subtitle}>Gestiona tu negocio de manera fácil y rápida</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorAlert}>
              <AlertCircle size={16} style={{ marginRight: 6, flexShrink: 0 }} />
              {error}
            </div>
          )}
          {error && error.includes('bloqueada') && (
            <div style={{ textAlign: 'center', marginTop: 4, marginBottom: 8 }}>
              <button
                onClick={handleAdminUnlock}
                style={{
                  background: 'none', border: 'none',
                  color: colors.accent, fontSize: 12,
                  cursor: 'pointer', textDecoration: 'underline',
                  padding: 0,
                }}
              >
                ¿Eres el propietario? Desbloquear cuenta
              </button>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Usuario</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }} />
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
              <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }} />
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
            {renderSubmitButton()}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>DAJHO v1.0.0 - Gestión para tu negocio</p>
        </div>
      </div>

      {/* Modal: Cambio de contraseña obligatorio */}
      {showChangePw && (
        <div style={styles.modalOverlay}>
          <div style={styles.changePwModal}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.textHeading, marginBottom: 8 }}>
              <Lock size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Cambio de contraseña requerido
            </h2>
            <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
              Por seguridad, debes cambiar la contraseña predeterminada del propietario.
            </p>
            {changePwError && (
              <div style={styles.errorAlert}>
                <AlertCircle size={14} style={{ marginRight: 4 }} />{changePwError}
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                placeholder="Repite la contraseña"
              />
            </div>
            <button onClick={handleChangePassword} style={styles.submitButton}>
              Cambiar contraseña
            </button>
          </div>
        </div>
      )}
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
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  changePwModal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    width: '90%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
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