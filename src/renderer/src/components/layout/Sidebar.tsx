import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  DollarSign,
  Wallet,
  BarChart3,
  Package,
  Users,
  User,
  Building2,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { FileText } from 'lucide-react';

// Definimos los ítems del menú (con su módulo correspondiente para permisos)
const menuItems = [
  { section: 'GESTIONA TU NEGOCIO', items: [
    { path: '/vender', label: 'Vender', icon: ShoppingBag, module: 'vender' },
    { path: '/cerrar-caja', label: 'Cerrar Caja', icon: DollarSign, module: 'cerrar-caja' },
    { path: '/balance', label: 'Balance', icon: Wallet, module: 'balance' },
    { path: '/estadisticas', label: 'Estadísticas', icon: BarChart3, module: 'estadisticas' },
    { path: '/inventario', label: 'Inventario', icon: Package, module: 'inventario' },
    { path: '/gastos', label: 'Gastos', icon: DollarSign, module: 'gastos' },
    { path: '/empleados', label: 'Empleados', icon: Users, module: 'empleados' },
  ]},
  { section: 'GESTIONA TUS CONTACTOS', items: [
    { path: '/clientes', label: 'Clientes', icon: User, module: 'clientes' },
    { path: '/proveedores', label: 'Proveedores', icon: Building2, module: 'proveedores' },
    { path: '/configuraciones', label: 'Configuraciones', icon: Settings, module: 'configuraciones' },
    { path: '/ayuda', label: 'Ayuda', icon: HelpCircle, module: 'ayuda' },
    { path: '/recibos', label: 'Recibos', icon: FileText, module: 'recibos' },
  ]}
];

export const Sidebar = () => {
  const { hasPermission, user } = useAuth();

  // Verificar si el usuario tiene acceso a inventario (admin o vendedor con solo lectura)
  const hasInventoryAccess = hasPermission('inventario') || hasPermission('inventario-view');

  // Filtrar ítems según permisos
  const filteredMenuItems = menuItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      // Si es el módulo de inventario, usar la lógica especial
      if (item.module === 'inventario') {
        return hasInventoryAccess;
      }
      // Para el resto de módulos, verificar permiso normal
      return hasPermission(item.module);
    }),
  })).filter(section => section.items.length > 0);

  // Obtener información del usuario para mostrar en el sidebar
  const getUserRoleLabel = () => {
    if (!user) return '';
    if (user.role === 'owner') return '👑 Propietario';
    return '👤 Empleado';
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <h2 style={styles.logo}>🚀 DAJHO</h2>
        {user && (
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.name}</span>
            <span style={styles.userRole}>{getUserRoleLabel()}</span>
          </div>
        )}
      </div>
      
      {filteredMenuItems.map((section, idx) => (
        <div key={idx} style={styles.section}>
          <p style={styles.sectionTitle}>{section.section}</p>
          {section.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  ...styles.link,
                  ...(isActive ? styles.linkActive : {})
                })}
              >
                <Icon size={18} style={styles.icon} />
                {item.label}
                {/* Mostrar indicador de solo lectura en inventario para vendedores */}
                {item.module === 'inventario' && user?.role === 'employee' && (
                  <span style={styles.readOnlyBadge}>🔍</span>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
      
      <div style={styles.footer}>
        <p style={styles.version}>v1.0.0</p>
      </div>
    </aside>
  );
};

// Estilos
const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: '240px',
    height: '100vh',
    backgroundColor: '#1a2332',
    color: '#b0b8c4',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    position: 'fixed',
    top: 0,
    left: 0,
    overflowY: 'auto',
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    zIndex: 100,
  },
  logoContainer: {
    padding: '0 20px 20px 20px',
    borderBottom: '1px solid #2a3a4a',
    marginBottom: '20px',
  },
  logo: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: '700',
    margin: 0,
    marginBottom: '8px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingTop: '8px',
    borderTop: '1px solid #2a3a4a',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
  },
  userRole: {
    fontSize: '12px',
    color: '#6b7a8a',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    color: '#6b7a8a',
    padding: '0 20px',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    color: '#b0b8c4',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'all 0.2s',
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    position: 'relative',
  },
  linkActive: {
    backgroundColor: '#2a3a4a',
    color: '#ffffff',
    borderLeft: '3px solid #4a9eff',
  },
  icon: {
    marginRight: '12px',
    flexShrink: 0,
    color: '#b0b8c4',
  },
  readOnlyBadge: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#f59e0b',
    opacity: 0.7,
  },
  footer: {
    marginTop: 'auto',
    padding: '20px 20px 0',
    borderTop: '1px solid #2a3a4a',
    textAlign: 'center',
  },
  version: {
    fontSize: '12px',
    color: '#6b7a8a',
    margin: 0,
  }
};