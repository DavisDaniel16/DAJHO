import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { applyThemeToStyles } from '../styles/theme';
import { Recibo, buscarRecibos } from '../store/recibosStore';

// ─── Datos del negocio ──────────────────────────────────
const negocioData = {
  nombre: 'Tienda de Ropa DAJHO',
  ruc: '1234567890001',
  direccion: 'Calle Principal 123, Quito',
  telefono: '0987654321',
  email: 'tienda@dajho.com',
};

export const Recibos = () => {
  const { colors } = useTheme();
  const themedStyles = applyThemeToStyles(baseStyles, colors, true);
  const styles: Record<string, React.CSSProperties> = {
    ...themedStyles,
    tabButton: { ...themedStyles.tabButton, backgroundColor: colors.bgTertiary, color: colors.textHeading },
    tabButtonActive: { ...themedStyles.tabButtonActive, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    searchInput: { ...themedStyles.searchInput, backgroundColor: colors.bgInput, color: colors.textHeading, border: `1px solid ${colors.borderInput}` },
    modalOverlay: { ...themedStyles.modalOverlay, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalCancel: { ...themedStyles.modalCancel, backgroundColor: colors.buttonSecondary, color: colors.textHeading, border: `1px solid ${colors.buttonSecondaryBorder}` },
    modalSubmit: { ...themedStyles.modalSubmit, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
  };

  // ── Estado: Historial ──
  const [historial, setHistorial] = useState<Recibo[]>([]);
  const [busquedaHistorial, setBusquedaHistorial] = useState('');

  // ── Estado: Modal detalle recibo ──
  const [reciboDetalle, setReciboDetalle] = useState<Recibo | null>(null);

  // ── Cargar datos ──
  useEffect(() => {
    setHistorial(buscarRecibos(busquedaHistorial));
  }, [busquedaHistorial]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📋 Recibos</h1>
      <div style={styles.card}>
          <h2 style={styles.cardTitle}>📋 Historial de Recibos</h2>

          {/* Buscador */}
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              value={busquedaHistorial}
              onChange={(e) => setBusquedaHistorial(e.target.value)}
              style={styles.searchInput}
              placeholder="Buscar por cliente, número o vendedor..."
            />
            {busquedaHistorial && (
              <button onClick={() => setBusquedaHistorial('')} style={styles.clearBtn}>✕</button>
            )}
          </div>

          {/* Tabla */}
          {historial.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 48 }}>📭</span>
              <p>No hay recibos registrados</p>
              <p style={{ color: '#999', fontSize: 13 }}>
                {busquedaHistorial ? 'Intenta con otro término de búsqueda' : 'Los recibos se generan automáticamente al realizar una venta en la sección Vender'}
              </p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <div style={styles.histHeader}>
                <span style={{ flex: 1.5, fontWeight: 600 }}># Recibo</span>
                <span style={{ flex: 2, fontWeight: 600 }}>Cliente</span>
                <span style={{ flex: 1.5, fontWeight: 600 }}>Fecha</span>
                <span style={{ flex: 1, fontWeight: 600, textAlign: 'right' }}>Total</span>
                <span style={{ flex: 1.5, fontWeight: 600, textAlign: 'center' }}>Acciones</span>
              </div>
              {historial.map((r) => (
                <div key={r.id} style={styles.histRow}>
                  <span style={{ flex: 1.5, fontSize: 13, fontWeight: 500 }}>{r.numero}</span>
                  <span style={{ flex: 2, fontSize: 13 }}>{r.cliente}</span>
                  <span style={{ flex: 1.5, fontSize: 12, color: '#666' }}>
                    {r.fecha} {r.hora}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, textAlign: 'right', color: '#27ae60' }}>
                    ${r.total.toFixed(2)}
                  </span>
                  <span style={{ flex: 1.5, textAlign: 'center', display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button
                      onClick={() => setReciboDetalle(r)}
                      style={styles.smallBtn}
                      title="Ver detalle"
                    >👁️</button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* ═══════════════════════════════════════════════════
          MODAL: Detalle de Recibo
          ═══════════════════════════════════════════════════ */}
      {reciboDetalle && (
        <div style={styles.modalOverlay} onClick={() => setReciboDetalle(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>📋 Detalle del Recibo</h2>
            <div style={styles.detailGrid}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Número:</span>
                <span style={styles.detailValue}>{reciboDetalle.numero}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Cliente:</span>
                <span style={styles.detailValue}>{reciboDetalle.cliente}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Fecha:</span>
                <span style={styles.detailValue}>{reciboDetalle.fecha} - {reciboDetalle.hora}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Vendedor:</span>
                <span style={styles.detailValue}>{reciboDetalle.vendedor}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Pago:</span>
                <span style={styles.detailValue}>{reciboDetalle.metodoPago}</span>
              </div>
            </div>

            <div style={styles.tableContainer}>
              <div style={styles.tableHeader}>
                <span style={styles.colProducto}>Producto</span>
                <span style={styles.colCantidad}>Cant.</span>
                <span style={styles.colPrecio}>Precio</span>
                <span style={styles.colSubtotal}>Subtotal</span>
              </div>
              {reciboDetalle.productos.map((p, i) => (
                <div key={i} style={styles.tableRow}>
                  <span style={styles.colProducto}>{p.name}</span>
                  <span style={styles.colCantidad}>{p.quantity}</span>
                  <span style={styles.colPrecio}>${p.price.toFixed(2)}</span>
                  <span style={styles.colSubtotal}>${p.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={styles.totales}>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Subtotal:</span>
                <span>${reciboDetalle.subtotal.toFixed(2)}</span>
              </div>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>IVA:</span>
                <span>${(reciboDetalle.total - reciboDetalle.subtotal).toFixed(2)}</span>
              </div>
              <div style={styles.totalRowFinal}>
                <span style={styles.totalLabelFinal}>TOTAL:</span>
                <span style={styles.totalValueFinal}>${reciboDetalle.total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setReciboDetalle(null)} style={styles.primaryBtn}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Estilos ────────────────────────────────────────────
const baseStyles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    maxWidth: '960px',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '20px',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    backgroundColor: '#f0f4f9',
    borderRadius: '10px',
    padding: '4px',
  },
  tab: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#6b7a8a',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    color: '#1a2332',
    fontWeight: '600',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a2332',
    display: 'block',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  tableContainer: {
    margin: '16px 0',
    border: '1px solid #e0e4e8',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 30px',
    backgroundColor: '#f8faff',
    padding: '10px 14px',
    fontWeight: '600',
    fontSize: '13px',
    color: '#1a2332',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 30px',
    padding: '8px 14px',
    borderTop: '1px solid #f0f4f9',
    fontSize: '14px',
    alignItems: 'center',
  },
  colProducto: { textAlign: 'left' },
  colCantidad: { textAlign: 'center' },
  colPrecio: { textAlign: 'right' },
  colSubtotal: { textAlign: 'right' },
  totales: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e0e4e8',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
    padding: '4px 0',
    fontSize: '14px',
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
    padding: '8px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    borderTop: '2px solid #e0e4e8',
    marginTop: '4px',
  },
  totalLabel: {
    fontWeight: '500',
    color: '#6b7a8a',
    minWidth: '120px',
    textAlign: 'right',
  },
  totalLabelFinal: {
    fontWeight: '700',
    color: '#1a2332',
    minWidth: '120px',
    textAlign: 'right',
  },
  totalValueFinal: {
    fontWeight: '700',
    color: '#2ecc71',
    minWidth: '100px',
    textAlign: 'right',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    textAlign: 'center',
    textDecoration: 'none',
    transition: 'background-color 0.3s',
  },
  secondaryBtn: {
    padding: '12px 24px',
    backgroundColor: '#f0f4f9',
    color: '#1a2332',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    padding: '0 12px',
    marginBottom: '16px',
  },
  searchIcon: {
    fontSize: '14px',
    marginRight: '8px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    padding: '10px 0',
    color: '#1a2332',
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9aa6b2',
    fontSize: '14px',
    padding: '4px 8px',
  },
  histHeader: {
    display: 'flex',
    backgroundColor: '#f8faff',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#1a2332',
    borderBottom: '1px solid #e0e4e8',
  },
  histRow: {
    display: 'flex',
    padding: '10px 14px',
    fontSize: '14px',
    borderBottom: '1px solid #f0f4f9',
    alignItems: 'center',
  },
  smallBtn: {
    padding: '4px 8px',
    backgroundColor: '#f0f4f9',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#1a2332',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#e74c3c',
    fontSize: '14px',
    padding: '2px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6b7a8a',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '8px',
    marginTop: 0,
  },
  detailGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  detailRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '14px',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#6b7a8a',
    minWidth: '80px',
  },
  detailValue: {
    color: '#1a2332',
  },
};

export default Recibos;