import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useDashboard } from '../hooks/useDB';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart3, DollarSign, TrendingDown, Package, Users, User, Building2, CreditCard, AlertTriangle, CheckCircle, TrendingUp, ShoppingCart, Zap, ShoppingBag, Wallet, Lock } from 'lucide-react';

export const Dashboard = () => {
  const { colors } = useTheme();
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const { summary, loading, loadSummary } = useDashboard();

  useEffect(() => {
    loadSummary();
  }, []);

  const styles = {
    container: {
      padding: '20px',
    } as React.CSSProperties,
    header: {
      marginBottom: '28px',
    } as React.CSSProperties,
    greeting: {
      fontSize: '14px',
      color: colors.textSecondary,
      margin: 0,
    } as React.CSSProperties,
    title: {
      fontSize: '26px',
      fontWeight: '700',
      color: colors.textHeading,
      margin: '4px 0 0 0',
    } as React.CSSProperties,
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '14px',
      marginBottom: '24px',
    } as React.CSSProperties,
    statCard: {
      backgroundColor: colors.bgCard,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    } as React.CSSProperties,
    statIcon: {
      fontSize: '28px',
    } as React.CSSProperties,
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: colors.textHeading,
    } as React.CSSProperties,
    statLabel: {
      fontSize: '13px',
      color: colors.textSecondary,
    } as React.CSSProperties,
    statHighlight: {
      color: colors.accent || '#4a9eff',
    },
    statDanger: {
      color: '#ef4444',
    },
    statWarning: {
      color: '#f59e0b',
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '24px',
    } as React.CSSProperties,
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.border}`,
    } as React.CSSProperties,
    cardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: colors.textHeading,
      marginBottom: '16px',
      margin: 0,
      paddingBottom: '12px',
      borderBottom: `1px solid ${colors.borderLight}`,
    } as React.CSSProperties,
    saleRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: `1px solid ${colors.borderLight}`,
    } as React.CSSProperties,
    saleInfo: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '2px',
    } as React.CSSProperties,
    saleClient: {
      fontSize: '14px',
      fontWeight: '500',
      color: colors.textHeading,
    } as React.CSSProperties,
    saleDate: {
      fontSize: '12px',
      color: colors.textSecondary,
    } as React.CSSProperties,
    saleTotal: {
      fontSize: '15px',
      fontWeight: '600',
      color: colors.textHeading,
    } as React.CSSProperties,
    productRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: `1px solid ${colors.borderLight}`,
    } as React.CSSProperties,
    productName: {
      fontSize: '14px',
      color: colors.textHeading,
    } as React.CSSProperties,
    productStock: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#ef4444',
    } as React.CSSProperties,
    quickAction: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 16px',
      backgroundColor: colors.bgTertiary,
      borderRadius: '8px',
      cursor: 'pointer',
      border: `1px solid ${colors.border}`,
      color: colors.textHeading,
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      textDecoration: 'none',
    } as React.CSSProperties,
    quickActionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '10px',
      marginTop: '8px',
    } as React.CSSProperties,
    loadingText: {
      textAlign: 'center' as const,
      padding: '60px',
      color: colors.textSecondary,
      fontSize: '14px',
    } as React.CSSProperties,
    chart: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '6px',
      height: '100px',
      padding: '10px 0',
    } as React.CSSProperties,
    bar: {
      flex: 1,
      borderRadius: '4px 4px 0 0',
      minHeight: '4px',
      position: 'relative' as const,
    } as React.CSSProperties,
    barValue: {
      position: 'absolute' as const,
      top: '-20px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '10px',
      color: colors.textSecondary,
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,
    dayLabel: {
      fontSize: '10px',
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginTop: '4px',
    } as React.CSSProperties,
    emptyText: {
      textAlign: 'center' as const,
      padding: '20px',
      color: colors.textSecondary,
      fontSize: '13px',
    } as React.CSSProperties,
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getBarColor = (value: number, max: number) => {
    if (max === 0) return colors.borderLight || '#e5e7eb';
    const ratio = value / max;
    if (ratio > 0.7) return '#22c55e';
    if (ratio > 0.4) return '#4a9eff';
    return '#f59e0b';
  };

  if (loading) {
    return <div style={styles.loadingText}>Cargando dashboard...</div>;
  }

  const maxSemana = summary?.ventasSemana?.length
    ? Math.max(...summary.ventasSemana.map(d => d.total), 1)
    : 1;

  return (
    <div style={styles.container}>
      {/* Encabezado */}
      <div style={styles.header}>
        <p style={styles.greeting}>Bienvenido, {user?.name || 'Usuario'}</p>
        <h1 style={styles.title}><BarChart3 size={26} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Panel de Control</h1>
      </div>

      {/* Tarjetas de estadísticas */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <DollarSign size={28} color={colors.accent || '#4a9eff'} />
          <span style={{ ...styles.statValue, ...styles.statHighlight }}>
            ${summary?.ventasHoy?.toFixed(2) || '0.00'}
          </span>
          <span style={styles.statLabel}>Ventas de hoy ({summary?.cantidadVentasHoy || 0} ventas)</span>
        </div>
        <div style={styles.statCard}>
          <TrendingDown size={28} color="#ef4444" />
          <span style={{ ...styles.statValue, ...styles.statDanger }}>
            ${summary?.gastosHoy?.toFixed(2) || '0.00'}
          </span>
          <span style={styles.statLabel}>Gastos de hoy</span>
        </div>
        <div style={styles.statCard}>
          <Package size={28} color={colors.textSecondary} />
          <span style={styles.statValue}>{summary?.totalProductos || 0}</span>
          <span style={styles.statLabel}>Productos en inventario</span>
        </div>
        <div style={styles.statCard}>
          <Users size={28} color={colors.textSecondary} />
          <span style={styles.statValue}>{summary?.totalClientes || 0}</span>
          <span style={styles.statLabel}>Clientes registrados</span>
        </div>
        <div style={styles.statCard}>
          <Building2 size={28} color={colors.textSecondary} />
          <span style={styles.statValue}>{summary?.totalProveedores || 0}</span>
          <span style={styles.statLabel}>Proveedores</span>
        </div>
        <div style={styles.statCard}>
          <User size={28} color={colors.textSecondary} />
          <span style={styles.statValue}>{summary?.totalEmpleados || 0}</span>
          <span style={styles.statLabel}>Empleados</span>
        </div>
        <div style={styles.statCard}>
          <CreditCard size={28} color="#f59e0b" />
          <span style={{ ...styles.statValue, ...styles.statWarning }}>
            ${summary?.deudaClientes?.toFixed(2) || '0.00'}
          </span>
          <span style={styles.statLabel}>Deuda total de clientes</span>
        </div>
        <div style={styles.statCard}>
          {(summary?.stockBajo || 0) > 0 ? <AlertTriangle size={28} color="#f59e0b" /> : <CheckCircle size={28} color="#22c55e" />}
          <span style={{
            ...styles.statValue,
            color: (summary?.stockBajo || 0) > 0 ? '#f59e0b' : '#22c55e'
          }}>
            {summary?.stockBajo || 0}
          </span>
          <span style={styles.statLabel}>Productos con stock bajo</span>
        </div>
      </div>

      {/* Gráfico semanal + Ventas recientes */}
      <div style={styles.row}>
        {/* Gráfico de ventas semanales */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Ventas de los últimos 7 días</h3>
          {summary?.ventasSemana?.length ? (
            <>
              <div style={styles.chart}>
                {summary.ventasSemana.map((d, i) => {
                  const day = new Date(d.date).getDay();
                  const height = maxSemana > 0 ? (d.total / maxSemana) * 100 : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        ...styles.bar,
                        height: `${Math.max(height, 4)}px`,
                        backgroundColor: getBarColor(d.total, maxSemana),
                        width: '100%',
                      }}>
                        <span style={styles.barValue}>${d.total.toFixed(0)}</span>
                      </div>
                      <span style={styles.dayLabel}>{dayNames[day]}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={styles.emptyText}>No hay ventas en los últimos 7 días</div>
          )}
        </div>

        {/* Ventas recientes */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><ShoppingCart size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Ventas recientes</h3>
          {summary?.ventasRecientes?.length ? (
            summary.ventasRecientes.map((sale, i) => (
              <div key={i} style={styles.saleRow}>
                <div style={styles.saleInfo}>
                  <span style={styles.saleClient}>{sale.client_name || 'Consumidor Final'}</span>
                  <span style={styles.saleDate}>
                    {sale.date} · {sale.payment_method}
                  </span>
                </div>
                <span style={styles.saleTotal}>${sale.total.toFixed(2)}</span>
              </div>
            ))
          ) : (
            <div style={styles.emptyText}>No hay ventas recientes</div>
          )}
        </div>
      </div>

      {/* Productos con stock bajo */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}><AlertTriangle size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Productos con stock bajo</h3>
        {summary?.productosStockBajo?.length ? (
          summary.productosStockBajo.map((p, i) => (
            <div key={i} style={styles.productRow}>
              <span style={styles.productName}>{p.name}</span>
              <span style={styles.productStock}>
                {p.stock} / {p.min_stock} mín.
              </span>
            </div>
          ))
        ) : (
          <div style={styles.emptyText}>Todos los productos tienen stock suficiente</div>
        )}
      </div>

      {/* Accesos rápidos - filtrados por permisos */}
      <div style={{ ...styles.card, marginTop: '20px' }}>
        <h3 style={styles.cardTitle}><Zap size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Accesos rápidos</h3>
        <div style={styles.quickActionsGrid}>
          {hasPermission('vender') && (
            <div style={styles.quickAction} onClick={() => navigate('/vender')}>
              <ShoppingBag size={18} /> Ir a vender
            </div>
          )}
          {hasPermission('inventario') && (
            <div style={styles.quickAction} onClick={() => navigate('/inventario')}>
              <Package size={18} /> Ir al inventario
            </div>
          )}
          {hasPermission('balance') && (
            <div style={styles.quickAction} onClick={() => navigate('/balance')}>
              <Wallet size={18} /> Ver balance
            </div>
          )}
          {hasPermission('clientes') && (
            <div style={styles.quickAction} onClick={() => navigate('/clientes')}>
              <Users size={18} /> Ver clientes
            </div>
          )}
          {hasPermission('estadisticas') && (
            <div style={styles.quickAction} onClick={() => navigate('/estadisticas')}>
              <BarChart3 size={18} /> Ver estadísticas
            </div>
          )}
          {hasPermission('cerrar-caja') && (
            <div style={styles.quickAction} onClick={() => navigate('/cerrar-caja')}>
              <Lock size={18} /> Cerrar caja
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
