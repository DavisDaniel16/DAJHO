import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
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
  Rocket,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FileText } from 'lucide-react';

// Definimos los ítems del menú (con su módulo correspondiente para permisos)
const menuItems = [
  { section: 'PANEL PRINCIPAL', items: [
    { path: '/dashboard', label: 'Inicio', icon: BarChart3, module: 'dashboard' },
  ]},
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
    { path: '/categorias', label: 'Categorías', icon: Package, module: 'categorias' },
    { path: '/configuraciones', label: 'Configuraciones', icon: Settings, module: 'configuraciones' },
    { path: '/ayuda', label: 'Ayuda', icon: HelpCircle, module: 'ayuda' },
    { path: '/recibos', label: 'Recibos', icon: FileText, module: 'recibos' },
  ]}
];

export const Sidebar = () => {
  const { hasPermission, user } = useAuth();
  const { collapsed, toggle } = useSidebar();

  const hasInventoryAccess = hasPermission('inventario') || hasPermission('inventario-view');

  // Filtrar ítems según permisos
  const filteredMenuItems = menuItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.module === 'inventario') {
        return hasInventoryAccess;
      }
      return hasPermission(item.module);
    }),
  })).filter(section => section.items.length > 0);

  const getUserRoleLabel = () => {
    if (!user) return '';
    if (user.role === 'owner') return 'Propietario';
    return 'Empleado';
  };

  const s = collapsed ? stylesCollapsed : styles;

  return (
    <aside style={{ ...s.sidebar, width: collapsed ? 60 : 240 }}>
      {/* Logo */}
      <div style={s.logoContainer}>
        {collapsed ? (
          <Rocket size={22} style={{ color: '#ffffff' }} />
        ) : (
          <>
            <h2 style={s.logo}><Rocket size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} /> DAJHO</h2>
            {user && (
              <div style={s.userInfo}>
                <span style={s.userName}>{user.name}</span>
                <span style={s.userRole}>{getUserRoleLabel()}</span>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Items del menú - scroll independiente */}
      <div style={s.menuScroll}>
        {filteredMenuItems.map((section, idx) => (
          <div key={idx} style={s.section}>
            {!collapsed && <p style={s.sectionTitle}>{section.section}</p>}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    ...s.link,
                    ...(isActive ? s.linkActive : {}),
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '12px 0' : '10px 20px',
                  })}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} style={collapsed ? { margin: 0 } : s.icon} />
                  {!collapsed && item.label}
                  {!collapsed && item.module === 'inventario' && user?.role === 'employee' && (
                    <Search size={14} style={{ marginLeft: 'auto', opacity: 0.7, color: '#f59e0b' }} />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Footer con botón colapsar */}
      <div style={s.footer}>
        {!collapsed && <p style={s.version}>v1.0.0</p>}
        <button
          onClick={toggle}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7a8a',
            cursor: 'pointer',
            padding: collapsed ? '8px 0' : '4px 0 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'center',
            width: '100%',
            gap: '6px',
            fontSize: '12px',
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={14} /> Colapsar</>}
        </button>
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
    padding: '0',
    position: 'fixed',
    top: 0,
    left: 0,
    overflow: 'hidden',
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    zIndex: 100,
    transition: 'width 0.25s ease',
  },
  toggleBtn: {}, // No se usa, el botón está inline en el footer
  logoContainer: {
    padding: '16px 20px',
    borderBottom: '1px solid #2a3a4a',
    flexShrink: 0,
  },
  logo: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: '700',
    margin: 0,
    whiteSpace: 'nowrap',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingTop: '8px',
    marginTop: '8px',
    borderTop: '1px solid #2a3a4a',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
    whiteSpace: 'nowrap',
  },
  userRole: {
    fontSize: '12px',
    color: '#6b7a8a',
    whiteSpace: 'nowrap',
  },
  menuScroll: {
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden',
    padding: '8px 0',
  },
  section: {
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    color: '#6b7a8a',
    padding: '0 20px',
    marginBottom: '4px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
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
    whiteSpace: 'nowrap',
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
    padding: '12px 20px',
    borderTop: '1px solid #2a3a4a',
    textAlign: 'center',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  version: {
    fontSize: '12px',
    color: '#6b7a8a',
    margin: 0,
  },
};

const stylesCollapsed: { [key: string]: React.CSSProperties } = {
  ...styles,
  sidebar: {
    ...styles.sidebar,
    width: '60px',
  },
  logoContainer: {
    ...styles.logoContainer,
    padding: '12px 0',
    textAlign: 'center',
  },
  menuScroll: {
    ...styles.menuScroll,
    padding: '4px 0',
  },
  section: {
    marginBottom: '0',
  },
  link: {
    ...styles.link,
    padding: '12px 0',
    justifyContent: 'center',
    borderLeft: '3px solid transparent',
  },
  linkActive: {
    backgroundColor: '#2a3a4a',
    color: '#ffffff',
    borderLeft: '3px solid #4a9eff',
  },
  icon: {
    margin: 0,
  },
  footer: {
    ...styles.footer,
    padding: '8px 0',
  },
};