import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, Store, Crown, User, Bell, X } from 'lucide-react';

interface TopBarProps {
  user?: {
    name: string;
    role: 'owner' | 'employee';
  } | null;
}

interface Notification {
  id: string;
  type: 'stock' | 'debt' | 'info' | 'warning';
  title: string;
  message: string;
}

export const TopBar = ({ user }: TopBarProps) => {
  const { logout } = useAuth();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Cargar notificaciones al montar y cada 60 segundos
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await window.dajhoAPI.dashboard.getSummary();
        const list: Notification[] = [];

        // Stock bajo
        if (data.stockBajo > 0) {
          list.push({
            id: 'stock-bajo',
            type: 'warning',
            title: `⚠️ ${data.stockBajo} producto(s) con stock bajo`,
            message: 'Revisa el inventario para reabastecer.',
          });
        }

        // Sin stock
        if (data.sinStock > 0) {
          list.push({
            id: 'sin-stock',
            type: 'warning',
            title: `❌ ${data.sinStock} producto(s) sin stock`,
            message: 'Hay productos agotados que necesitan reposición.',
          });
        }

        // Deuda de clientes
        if (data.deudaClientes > 0) {
          list.push({
            id: 'deuda-clientes',
            type: 'debt',
            title: `Clientes deben $${data.deudaClientes.toFixed(2)}`,
            message: 'Hay deudas pendientes por cobrar.',
          });
        }

        // Sin ventas hoy
        if (!data.hayVentasHoy) {
          list.push({
            id: 'sin-ventas',
            type: 'info',
            title: 'Sin ventas hoy',
            message: 'Aún no se han registrado ventas en el día.',
          });
        }

        setNotifications(list);
      } catch (err) {
        console.error('Error al cargar notificaciones:', err);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, { icon: React.ReactNode; text: string }> = {
      owner: { icon: <Crown size={16} style={{ marginRight: 4 }} />, text: 'Propietario' },
      employee: { icon: <User size={16} style={{ marginRight: 4 }} />, text: 'Empleado' },
    };
    return labels[role] || { icon: null, text: role };
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
          display: 'flex',
          alignItems: 'center',
        }}>
          {user?.role === 'owner' ? (
            <><Crown size={16} style={{ marginRight: 4 }} /> Propietario</>
          ) : (
            <><User size={16} style={{ marginRight: 4 }} /> Empleado</>
          )}
        </span>
      </div>
      <div style={styles.rightSection}>
        {/* Notificaciones */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              ...styles.notifButton,
              backgroundColor: showNotifications ? colors.bgTertiary : 'transparent',
            }}
            title="Notificaciones"
          >
            <Bell size={20} style={{ color: colors.textSecondary }} />
            {notifications.length > 0 && (
              <span style={styles.notifBadge}>
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              ...styles.notifDropdown,
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{
                ...styles.notifHeader,
                color: colors.textHeading,
                borderBottom: `1px solid ${colors.borderLight}`,
              }}>
                <strong>Notificaciones</strong>
                <span style={{ color: colors.textSecondary, fontSize: '12px' }}>
                  {notifications.length} pendiente(s)
                </span>
              </div>
              {notifications.length === 0 ? (
                <div style={{
                  ...styles.notifEmpty,
                  color: colors.textSecondary,
                }}>
                  ✅ Todo está en orden
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} style={{
                    ...styles.notifItem,
                    borderBottom: `1px solid ${colors.borderLight}`,
                  }}>
                    <div style={styles.notifContent}>
                      <div style={{ ...styles.notifTitle, color: colors.textHeading }}>
                        {n.title}
                      </div>
                      <div style={{ ...styles.notifMessage, color: colors.textSecondary }}>
                        {n.message}
                      </div>
                    </div>
                    <button
                      onClick={() => removeNotification(n.id)}
                      style={styles.notifDismiss}
                      title="Descartar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

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
              display: 'flex',
              alignItems: 'center',
            }}>{getRoleLabel(user.role).icon}{getRoleLabel(user.role).text}</span>
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
  notifButton: {
    position: 'relative',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  notifBadge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  notifDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '340px',
    maxHeight: '400px',
    overflowY: 'auto',
    borderRadius: '10px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    zIndex: 1000,
  },
  notifHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    fontSize: '14px',
    fontWeight: '600',
  },
  notifEmpty: {
    padding: '24px 16px',
    textAlign: 'center',
    fontSize: '14px',
  },
  notifItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px 16px',
    gap: '8px',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  notifMessage: {
    fontSize: '12px',
    lineHeight: '1.4',
  },
  notifDismiss: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: '2px',
    flexShrink: 0,
    marginTop: '2px',
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