import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, Store } from 'lucide-react';

interface TopBarProps {
  user?: {
    name: string;
    role: 'admin' | 'employee';
  } | null;
}

export const TopBar = ({ user }: TopBarProps) => {
  const { logout } = useAuth();
  const { colors } = useTheme();

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: '👑 Administradora',
      employee: '👤 Vendedor',
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <header style={{
      ...styles.topbar,
      backgroundColor: colors.bgTopbar,
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <div style={styles.leftSection}>
        <Store size={24} style={{ color: colors.accent }} />
        <h1 style={{
          ...styles.title,
          color: colors.textHeading,
        }}>Caja</h1>
        <span style={{
          ...styles.divider,
          color: colors.borderInput,
        }}>|</span>
        <span style={{
          ...styles.subtitle,
          color: colors.textSecondary,
        }}>Propietario</span>
      </div>
      <div style={styles.rightSection}>
        {user && (
          <div style={{
            ...styles.userInfo,
            borderRight: `1px solid ${colors.border}`,
          }}>
            <span style={{
              ...styles.userName,
              color: colors.textHeading,
            }}>{user.name}</span>
            <span style={{
              ...styles.userRole,
              color: colors.textSecondary,
            }}>{getRoleLabel(user.role)}</span>
          </div>
        )}
        <button onClick={logout} style={{
          ...styles.logoutButton,
          backgroundColor: colors.logoutBg,
          color: colors.logoutText,
        }}>
          <LogOut size={16} style={styles.buttonIcon} />
          Cerrar sesión
        </button>
      </div>
    </header>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  topbar: {
    height: '64px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e0e4e8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  storeIcon: {
    color: '#4a9eff',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a2332',
    margin: 0,
  },
  divider: {
    color: '#d0d5dd',
    fontSize: '18px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7a8a',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    padding: '0 12px',
    borderRight: '1px solid #e0e4e8',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a2332',
  },
  userRole: {
    fontSize: '12px',
    color: '#6b7a8a',
  },
  button: {
    backgroundColor: '#f0f4f9',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    color: '#1a2332',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.2s',
    fontWeight: '500',
  },
  buttonIcon: {
    flexShrink: 0,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    border: '1px solid #e0e4e8',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    color: '#6b7a8a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    fontWeight: '500',
  },
};