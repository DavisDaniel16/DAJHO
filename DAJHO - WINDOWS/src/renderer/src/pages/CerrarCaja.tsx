import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DollarSign, Crown, User, Calendar, BarChart3, Wallet, CreditCard, Building, Ban, Eye, EyeOff, Lightbulb } from 'lucide-react';

interface Venta {
  id: number;
  date: string;
  time: string;
  client_name: string | null;
  total: number;
  payment_method: string;
  items_count: number;
}

export const CerrarCaja = () => {
  const { colors } = useTheme();
  const styles: Record<string, React.CSSProperties> = useMemo(() => ({
    ...baseStyles,
    title: { ...baseStyles.title, color: colors.textHeading },
    subtitle: { ...baseStyles.subtitle, color: colors.textSecondary },
    dateSelector: { ...baseStyles.dateSelector, backgroundColor: colors.bgCard, boxShadow: colors.shadowSm, border: `1px solid ${colors.border}` },
    dateLabel: { ...baseStyles.dateLabel, color: colors.textHeading },
    dateInput: { ...baseStyles.dateInput, border: `1px solid ${colors.borderInput}`, backgroundColor: colors.bgInput, color: colors.textHeading },
    resumenContainer: { ...baseStyles.resumenContainer, backgroundColor: colors.bgCard, boxShadow: colors.shadowMd, border: `1px solid ${colors.border}` },
    resumenHeader: { ...baseStyles.resumenHeader, borderBottom: `1px solid ${colors.borderLight}` },
    resumenTitle: { ...baseStyles.resumenTitle, color: colors.textHeading },
    ventasCount: { ...baseStyles.ventasCount, color: colors.textSecondary, backgroundColor: colors.bgTertiary },
    resumenCard: { ...baseStyles.resumenCard, backgroundColor: colors.bgTableHeader, border: `1px solid ${colors.border}` },
    resumenLabel: { ...baseStyles.resumenLabel, color: colors.textSecondary },
    resumenTotal: { ...baseStyles.resumenTotal, color: colors.textHeading },
    resumenTotalEfectivo: { ...baseStyles.resumenTotalEfectivo, color: colors.success },
    resumenTotalTarjeta: { ...baseStyles.resumenTotalTarjeta, color: colors.accent },
    cerrarContainer: { ...baseStyles.cerrarContainer, borderTop: `1px solid ${colors.borderLight}` },
    cerrarButton: { ...baseStyles.cerrarButton, backgroundColor: colors.success, color: colors.textOnPrimary },
    cerrarButtonDisabled: { ...baseStyles.cerrarButtonDisabled, backgroundColor: colors.borderInput },
    detalleButton: { ...baseStyles.detalleButton, backgroundColor: colors.bgTertiary, color: colors.textHeading, border: `1px solid ${colors.borderInput}` },
    detalleContainer: { ...baseStyles.detalleContainer, backgroundColor: colors.bgCard, boxShadow: colors.shadowMd, border: `1px solid ${colors.border}` },
    detalleTitle: { ...baseStyles.detalleTitle, color: colors.textHeading },
    detalleHeader: { ...baseStyles.detalleHeader, backgroundColor: colors.bgTableHeader, color: colors.textHeading },
    detalleRow: { ...baseStyles.detalleRow, borderBottom: `1px solid ${colors.borderLight}`, color: colors.textHeading },
    detalleCell: { ...baseStyles.detalleCell, color: colors.textHeading },
    detalleCellTotal: { ...baseStyles.detalleCellTotal, color: colors.textHeading },
    emptyText: { ...baseStyles.emptyText, color: colors.textSecondary },
    footerInfo: { ...baseStyles.footerInfo, backgroundColor: colors.bgTertiary, border: `1px solid ${colors.border}` },
    footerText: { ...baseStyles.footerText, color: colors.textSecondary },
  }), [colors]);
  const { user } = useAuth();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [, setLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showDetalle, setShowDetalle] = useState(false);

  // Cargar ventas reales desde la BD
  useEffect(() => {
    const loadVentas = async () => {
      setLoading(true);
      try {
        const data = await window.dajhoAPI.sales.getByDate(fechaSeleccionada);
        setVentas(data || []);
      } catch (err) {
        console.error('Error al cargar ventas:', err);
        setVentas([]);
      } finally {
        setLoading(false);
      }
    };
    loadVentas();
  }, [fechaSeleccionada]);

  // Filtrar ventas por fecha
  const ventasDelDia = ventas;
  
  // Calcular totales
  const totalEfectivo = ventasDelDia
    .filter(v => v.payment_method?.toLowerCase() === 'efectivo')
    .reduce((sum, v) => sum + v.total, 0);
  
  const totalTarjeta = ventasDelDia
    .filter(v => v.payment_method?.toLowerCase() === 'tarjeta')
    .reduce((sum, v) => sum + v.total, 0);
  
  const totalTransferencia = ventasDelDia
    .filter(v => v.payment_method?.toLowerCase() === 'transferencia')
    .reduce((sum, v) => sum + v.total, 0);
  
  const totalVentas = ventasDelDia.reduce((sum, v) => sum + v.total, 0);
  const totalVentasCount = ventasDelDia.length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getMetodoIcon = (metodo: string) => {
    switch (metodo?.toLowerCase()) {
      case 'efectivo': return <DollarSign size={14} />;
      case 'tarjeta': return <CreditCard size={14} />;
      case 'transferencia': return <Building size={14} />;
      default: return <Wallet size={14} />;
    }
  };

  // Cerrar caja (simulado)
  const handleCerrarCaja = () => {
    if (ventasDelDia.length === 0) {
      alert('No hay ventas registradas para este día');
      return;
    }
    alert(`Caja cerrada exitosamente\n\n` +
          `Fecha: ${formatDate(fechaSeleccionada)}\n` +
          `Total ventas: $${totalVentas.toFixed(2)}\n` +
          `Efectivo: $${totalEfectivo.toFixed(2)}\n` +
          `Tarjeta: $${totalTarjeta.toFixed(2)}\n` +
          `Transferencia: $${totalTransferencia.toFixed(2)}\n` +
          `Total ventas: ${totalVentasCount}`);
  };

  const renderDetalleButton = () => {
    if (showDetalle) return React.createElement('span', null, React.createElement(EyeOff, { size: 16, style: { marginRight: 6 } }), ' Ocultar detalle');
    return React.createElement('span', null, React.createElement(Eye, { size: 16, style: { marginRight: 6 } }), ' Ver detalle de ventas');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}><Wallet size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Cerrar Caja</h1>
      <p style={styles.subtitle}>
        {user?.name} - {user?.role === 'owner' ? 'Propietario' : 'Empleado'}
      </p>

      <div style={styles.dateSelector}>
        <label style={styles.dateLabel}><Calendar size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Seleccionar fecha:</label>
        <input
          type="date"
          value={fechaSeleccionada}
          onChange={(e) => setFechaSeleccionada(e.target.value)}
          style={styles.dateInput}
        />
      </div>

      <div style={styles.resumenContainer}>
        <div style={styles.resumenHeader}>
          <h2 style={styles.resumenTitle}>
            <BarChart3 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Resumen del día - {formatDate(fechaSeleccionada)}
          </h2>
          <span style={styles.ventasCount}>
            {totalVentasCount} ventas
          </span>
        </div>

        <div style={styles.resumenGrid}>
          <div style={styles.resumenCard}>
            <DollarSign size={24} />
            <div>
              <div style={styles.resumenLabel}>Total ventas</div>
              <div style={styles.resumenTotal}>${totalVentas.toFixed(2)}</div>
            </div>
          </div>
          <div style={styles.resumenCard}>
            <DollarSign size={24} color="#22c55e" />
            <div>
              <div style={styles.resumenLabel}>Efectivo</div>
              <div style={styles.resumenTotalEfectivo}>${totalEfectivo.toFixed(2)}</div>
            </div>
          </div>
          <div style={styles.resumenCard}>
            <CreditCard size={24} color="#3b82f6" />
            <div>
              <div style={styles.resumenLabel}>Tarjeta</div>
              <div style={styles.resumenTotalTarjeta}>${totalTarjeta.toFixed(2)}</div>
            </div>
          </div>
          <div style={styles.resumenCard}>
            <Building size={24} color="#8b5cf6" />
            <div>
              <div style={styles.resumenLabel}>Transferencia</div>
              <div style={styles.resumenTotalTransferencia}>${totalTransferencia.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Botón Cerrar Caja */}
        <div style={styles.cerrarContainer}>
          <button
            onClick={handleCerrarCaja}
            disabled={ventasDelDia.length === 0}
            style={{
              ...styles.cerrarButton,
              ...(ventasDelDia.length === 0 ? styles.cerrarButtonDisabled : {})
            }}
          >
            <Ban size={18} style={{ marginRight: 6 }} /> Cerrar caja
          </button>
          <button
            onClick={() => setShowDetalle(!showDetalle)}
            style={styles.detalleButton}
          >
            {renderDetalleButton()}
          </button>
        </div>
      </div>

      {/* Detalle de ventas */}
      {showDetalle && (
        <div style={styles.detalleContainer}>
          <h3 style={styles.detalleTitle}><BarChart3 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Detalle de ventas</h3>
          {ventasDelDia.length === 0 ? (
            <div style={styles.emptyDetalle}>
              <p style={styles.emptyText}>No hay ventas registradas en esta fecha</p>
            </div>
          ) : (
            <div style={styles.detalleLista}>
              <div style={styles.detalleHeader}>
                <span style={styles.detalleCell}>Hora</span>
                <span style={styles.detalleCell}>Cliente</span>
                <span style={styles.detalleCell}>Items</span>
                <span style={styles.detalleCell}>Pago</span>
                <span style={styles.detalleCellTotal}>Total</span>
              </div>
              {ventasDelDia.map((venta) => (
                <div key={venta.id} style={styles.detalleRow}>
                  <span style={styles.detalleCell}>{venta.time}</span>
                  <span style={styles.detalleCell}>{venta.client_name || 'Consumidor Final'}</span>
                  <span style={styles.detalleCell}>{venta.items_count}</span>
                  <span style={styles.detalleCell}>
                    {getMetodoIcon(venta.payment_method)} {venta.payment_method}
                  </span>
                  <span style={styles.detalleCellTotal}>${venta.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mensaje de cierre */}
      <div style={styles.footerInfo}>
        <p style={styles.footerText}>
          <Lightbulb size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Al cerrar caja, se registra el total del día y se reinicia el conteo para el siguiente día.
        </p>
      </div>
    </div>
  );
};

const baseStyles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7a8a',
    marginBottom: '24px',
  },
  dateSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    backgroundColor: '#ffffff',
    padding: '16px 20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
  },
  dateLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a2332',
  },
  dateInput: {
    padding: '8px 14px',
    fontSize: '14px',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  resumenContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
    marginBottom: '20px',
  },
  resumenHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f0f4f9',
  },
  resumenTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a2332',
    margin: 0,
  },
  ventasCount: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7a8a',
    backgroundColor: '#f0f4f9',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  resumenGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  resumenCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f8faff',
    borderRadius: '8px',
    border: '1px solid #e0e4e8',
  },
  resumenIcon: {
    fontSize: '28px',
  },
  resumenLabel: {
    fontSize: '13px',
    color: '#6b7a8a',
  },
  resumenTotal: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a2332',
  },
  resumenTotalEfectivo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2ecc71',
  },
  resumenTotalTarjeta: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#4a9eff',
  },
  resumenTotalTransferencia: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#8b5cf6',
  },
  cerrarContainer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    paddingTop: '16px',
    borderTop: '1px solid #f0f4f9',
  },
  cerrarButton: {
    padding: '12px 32px',
    backgroundColor: '#2ecc71',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'background-color 0.3s',
  },
  cerrarButtonDisabled: {
    backgroundColor: '#d0d5dd',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  detalleButton: {
    padding: '12px 24px',
    backgroundColor: '#f0f4f9',
    color: '#1a2332',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  detalleContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
    marginTop: '20px',
  },
  detalleTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '16px',
  },
  detalleLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detalleHeader: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 60px 120px 100px',
    padding: '10px 12px',
    backgroundColor: '#f8faff',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    color: '#1a2332',
  },
  detalleRow: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 60px 120px 100px',
    padding: '10px 12px',
    borderBottom: '1px solid #f0f4f9',
    fontSize: '14px',
    color: '#1a2332',
    alignItems: 'center',
  },
  detalleCell: {
    fontSize: '13px',
    color: '#1a2332',
  },
  detalleCellTotal: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a2332',
    textAlign: 'right',
  },
  emptyDetalle: {
    textAlign: 'center',
    padding: '30px',
  },
  emptyText: {
    color: '#6b7a8a',
    fontSize: '14px',
  },
  footerInfo: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#f0f4f9',
    borderRadius: '8px',
    border: '1px solid #e0e4e8',
  },
  footerText: {
    fontSize: '13px',
    color: '#6b7a8a',
    margin: 0,
    textAlign: 'center',
  },
};

export default CerrarCaja;