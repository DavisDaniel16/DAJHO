import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProducts, useSales, Product } from '../hooks/useDB';
import { saveRecibo, generarNumeroRecibo, generarId } from '../store/recibosStore';
import { ReciboPDF } from '../components/ReciboPDF';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ShoppingCart, Trash2, Search, X, XCircle, CheckCircle, DollarSign, Building, Loader, FileText } from 'lucide-react';

interface CartItem {
  product: any;
  quantity: number;
  price: number; // Precio de venta real (puede diferir del precio base)
}

const useSalesStyles = () => {
  const { colors } = useTheme();
  return useMemo(() => ({
    wrapper: { ...styles.wrapper },
    leftCol: { ...styles.leftCol },
    title: { ...styles.title, color: colors.textHeading },
    searchBox: { ...styles.searchBox, backgroundColor: colors.bgCard, borderColor: colors.borderInput },
    searchIcon: { ...styles.searchIcon },
    searchInput: { ...styles.searchInput, color: colors.textHeading },
    clearSearch: { ...styles.clearSearch, color: colors.textMuted },
    productGrid: { ...styles.productGrid },
    productCard: { ...styles.productCard, backgroundColor: colors.bgCard, borderColor: colors.border },
    productBadge: { ...styles.productBadge, color: colors.textMuted, backgroundColor: colors.bgTertiary },
    productBody: { ...styles.productBody },
    productName: { ...styles.productName, color: colors.textHeading },
    productPrice: { ...styles.productPrice },
    productStock: { ...styles.productStock, color: colors.textSecondary },
    addBtn: { ...styles.addBtn, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    addBtnDisabled: { ...styles.addBtnDisabled, backgroundColor: colors.borderInput, color: colors.textMuted },
    emptyMsg: { ...styles.emptyMsg, color: colors.textSecondary },
    rightCol: { ...styles.rightCol, backgroundColor: colors.bgCard, borderColor: colors.border },
    cartHeader: { ...styles.cartHeader, borderBottomColor: colors.border },
    cartTitle: { ...styles.cartTitle, color: colors.textHeading },
    clearCartBtn: { ...styles.clearCartBtn },
    cartList: { ...styles.cartList },
    cartRow: { ...styles.cartRow, borderBottomColor: colors.borderLight },
    cartRowInfo: { ...styles.cartRowInfo },
    cartRowName: { ...styles.cartRowName, color: colors.textHeading },
    cartRowUnit: { ...styles.cartRowUnit, color: colors.textSecondary },
    cartRowQty: { ...styles.cartRowQty },
    qtyBtn: { ...styles.qtyBtn, borderColor: colors.borderInput, backgroundColor: colors.bgTertiary, color: colors.textHeading },
    qtyBtnDisabled: { ...styles.qtyBtnDisabled, borderColor: colors.borderLight, backgroundColor: colors.bgHover, color: colors.textMuted },
    qtyValue: { ...styles.qtyValue, color: colors.textHeading },
    removeBtn: { ...styles.removeBtn },
    emptyCart: { ...styles.emptyCart, color: colors.textSecondary },
    cartSummary: { ...styles.cartSummary, borderTopColor: colors.border },
    summaryRow: { ...styles.summaryRow },
    summaryLabel: { ...styles.summaryLabel, color: colors.textSecondary },
    summaryValue: { ...styles.summaryValue, color: colors.textHeading },
    summaryTotal: { ...styles.summaryTotal, color: colors.textHeading },
    totalValue: { ...styles.totalValue, color: colors.accent },
    continueBtn: { ...styles.continueBtn, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    clienteBox: { ...styles.clienteBox, backgroundColor: colors.bgCard, borderColor: colors.border },
    clienteInput: { ...styles.clienteInput, color: colors.textHeading, backgroundColor: colors.bgInput, borderColor: colors.borderInput },
    clienteIcon: { ...styles.clienteIcon },
    // Modal
    modalOverlay: { ...styles.modalOverlay, backgroundColor: 'rgba(0,0,0,0.5)' },
    modal: { ...styles.modal, backgroundColor: colors.bgCard, borderColor: colors.border },
    modalIcon: { ...styles.modalIcon },
    modalTitle: { ...styles.modalTitle, color: colors.textHeading },
    modalPrintBtn: { ...styles.modalPrintBtn, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    modalCloseBtn: { ...styles.modalCloseBtn, backgroundColor: colors.buttonSecondary, color: colors.textHeading, borderColor: colors.buttonSecondaryBorder },
    modalReceipt: { ...styles.modalReceipt, backgroundColor: colors.bgSecondary, borderColor: colors.border },
    modalBody: { ...styles.modalBody, backgroundColor: colors.bgCard, color: colors.textPrimary },
    modalRow: { ...styles.modalRow, borderBottomColor: colors.borderLight, color: colors.textPrimary },
    modalDivider: { ...styles.modalDivider, borderTopColor: colors.border },
    modalTotalRow: { ...styles.modalTotalRow, color: colors.textHeading },
    modalActions: { ...styles.modalActions },
    modalConfirm: { ...styles.modalConfirm, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    modalCancel: { ...styles.modalCancel, backgroundColor: colors.buttonSecondary, color: colors.textHeading, borderColor: colors.buttonSecondaryBorder },
    footer: { ...styles.footer, backgroundColor: colors.bgCard, borderTopColor: colors.border },
    totalRow: { ...styles.totalRow },
    totalLabel: { ...styles.totalLabel, color: colors.textSecondary },
    continueBtnDisabled: { ...styles.continueBtnDisabled, backgroundColor: colors.borderInput, color: colors.textMuted },
    emptyCartIcon: { ...styles.emptyCartIcon },
    emptyCartHint: { ...styles.emptyCartHint, color: colors.textSecondary },
    cartRowSubtotal: { ...styles.cartRowSubtotal, color: colors.textHeading },
    qtyVal: { ...styles.qtyVal, color: colors.textHeading },
  }), [colors]);
};

export const Sales = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const s = useSalesStyles();
  const { products } = useProducts();
  const { createSale } = useSales();
  const [search, setSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showNotaVenta, setShowNotaVenta] = useState(false);
  const [ventaRecibo, setVentaRecibo] = useState<any>(null);
  const [cliente, setCliente] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentReference, setPaymentReference] = useState('');
  const [ivaPorcentaje, setIvaPorcentaje] = useState(0);
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
    const cargarIVA = async () => {
      try {
        const iva = await window.dajhoAPI.settings.get('iva_porcentaje');
        setIvaPorcentaje(iva ? parseFloat(iva) : 0);
      } catch {
        setIvaPorcentaje(0);
      }
    };
    cargarIVA();
  }, []);

    const [negocioData, setNegocioData] = useState({
    nombre: 'Nombre de tu negocio',
    ruc: 'Tu RUC/Cédula',
    direccion: 'Tu dirección',
    telefono: 'Tu número de celular',
    email: 'tuemail@ejemplo.com',
  });

  useEffect(() => {
    const cargarNegocio = async () => {
      try {
        const data = await window.dajhoAPI.business.getFirst();
        if (data) {
          setNegocioData({
            nombre: data.name || negocioData.nombre,
            ruc: data.ruc || negocioData.ruc,
            direccion: data.address || negocioData.direccion,
            telefono: data.phone || negocioData.telefono,
            email: data.email || negocioData.email,
          });
        }
      } catch (err) {
        console.error('Error al cargar datos del negocio:', err);
      }
    };
    cargarNegocio();
  }, []);

    useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

    useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter(
          (p: any) =>
            p.name.toLowerCase().includes(q) ||
            p.id.toString() === q
        )
      );
    }
  }, [search, products]);

  // ── Soporte para lector de código de barras ──
  useEffect(() => {
    const timer: { current: ReturnType<typeof setTimeout> | null } = { current: null };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement === searchRef.current) {
        const code = search.trim();
        const product = products.find(
          (p: any) => p.id.toString() === code || p.name.toLowerCase() === code.toLowerCase()
        );
        if (product && code.length > 0) {
          addToCart(product);
          setSearch('');
          e.preventDefault();
        }
      }
    };

    const el = searchRef.current;
    if (el) {
      el.addEventListener('keydown', handleKeyDown);
      return () => {
        el.removeEventListener('keydown', handleKeyDown);
        if (timer.current) clearTimeout(timer.current);
      };
    }
  }, [search]);

    const addToCart = (product: Product) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.product.id === product.id);
      if (exist) {
        if (exist.quantity >= product.stock) {
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (product.stock <= 0) return prev;
      return [...prev, { product, quantity: 1, price: product.price }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== id) return i;
        const newQty = Math.max(1, i.quantity + delta);
        // No permitir superar el stock disponible
        if (delta > 0 && newQty > i.product.stock) return i;
        return { ...i, quantity: newQty };
      })
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setEditingPriceId(null);
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const finishSale = async () => {
    if (cart.length === 0) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const productos = cart.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }));
    const subtotal = productos.reduce((s, p) => s + p.subtotal, 0);
    // Asegurar que ivaPorcentaje sea un número válido para evitar NaN
    const iva = typeof ivaPorcentaje === 'number' && !isNaN(ivaPorcentaje) ? ivaPorcentaje : 0;
    const total = subtotal + subtotal * (iva / 100);

    // Guardar en BD
    try {
      await createSale({
        date: dateStr,
        time: timeStr,
        subtotal,
        iva: subtotal * (iva / 100),
        total,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        status: 'completed',
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
      });
    } catch (err) {
      console.error('Error al guardar venta en BD:', err);
    }

    // Guardar recibo en el historial local
    const recibo = {
      id: generarId(),
      numero: await generarNumeroRecibo(),
      fecha: now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
      fechaRaw: now.toISOString(),
      hora: timeStr,
      cliente: cliente.trim() || 'Consumidor Final',
      productos,
      subtotal,
      iva,
      total,
      metodoPago: paymentMethod,
      vendedor: user?.name || 'Vendedor',
      negocioNombre: negocioData.nombre,
      negocioRuc: negocioData.ruc,
    };
    await saveRecibo(recibo);

    // Guardar recibo para posible Nota de Venta
    setVentaRecibo(recibo);

    setShowModal(false);
    setShowNotaVenta(true);
  };

  const handleCerrarNotaVenta = () => {
    setShowNotaVenta(false);
    setVentaRecibo(null);
    setCliente('');
    setPaymentMethod('Efectivo');
    setPaymentReference('');
    clearCart();
  };

  const renderPaymentButton = (metodo: string) => {
    if (metodo === 'Efectivo') return React.createElement('span', null, React.createElement(DollarSign, { size: 16, style: { marginRight: 4 } }), ' Efectivo');
    return React.createElement('span', null, React.createElement(Building, { size: 16, style: { marginRight: 4 } }), ' Transferencia');
  };
  const renderPdfLink = (loading: boolean) => {
    if (loading) return React.createElement('span', null, React.createElement(Loader, { size: 16, style: { marginRight: 6 } }), ' Generando PDF');
    return React.createElement('span', null, React.createElement(FileText, { size: 16, style: { marginRight: 6 } }), ' Descargar Nota de Venta');
  };

  return (
    <div style={s.wrapper}>
      <div style={s.leftCol}>
        <h1 style={s.title}><ShoppingCart size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Nueva venta</h1>

        <div style={s.searchBox}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar productos (nombre o código de barras)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')} style={s.clearSearch}>
              <X size={16} />
            </button>
          )}
        </div>

        <div style={s.productGrid}>
          {filteredProducts.map((p) => (
            <div key={p.id} style={s.productCard}>
              <div style={s.productBadge}>#{p.id}</div>
              <div style={s.productBody}>
                <span style={s.productName}>{p.name}</span>
                <span style={s.productPrice}>${p.price.toFixed(2)}</span>
                <span style={s.productStock}>
                  Stock: {p.stock}{' '}
                  {p.stock <= 2 && (
                    <span style={{ color: '#e74c3c', fontWeight: 600 }}>¡bajo!</span>
                  )}
                </span>
              </div>
              <button
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                style={{
                  ...s.addBtn,
                  ...(p.stock <= 0 ? s.addBtnDisabled : {}),
                }}
              >
                {p.stock <= 0 ? 'Agotado' : 'Agregar'}
              </button>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <p style={s.emptyMsg}><XCircle size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> No se encontraron productos</p>
          )}
        </div>
      </div>

      <div style={s.rightCol}>
        <div style={s.cartHeader}>
          <h2 style={s.cartTitle}><ShoppingCart size={20} style={{ marginRight: 6 }} /> Carrito ({cart.length})</h2>
          {cart.length > 0 && (
            <button onClick={clearCart} style={s.clearCartBtn}>
              <Trash2 size={16} style={{ marginRight: 4 }} /> Vaciar carrito
            </button>
          )}
        </div>

        <div style={s.cartList}>
          {cart.map((item) => (
            <div key={item.product.id} style={s.cartRow}>
              <div style={s.cartRowInfo}>
                <span style={s.cartRowName}>{item.product.name}</span>
                <div style={s.cartRowUnit}>
                  {editingPriceId === item.product.id ? (
                    <input
                      type="number"
                      value={editingPriceValue}
                      onChange={(e) => setEditingPriceValue(e.target.value)}
                      onBlur={() => {
                        const newPrice = parseFloat(editingPriceValue);
                        if (!isNaN(newPrice) && newPrice > 0) {
                          setCart((prev) =>
                            prev.map((i) =>
                              i.product.id === item.product.id ? { ...i, price: newPrice } : i
                            )
                          );
                        }
                        setEditingPriceId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                        if (e.key === 'Escape') {
                          setEditingPriceId(null);
                        }
                      }}
                      style={{
                        width: 80,
                        padding: '2px 6px',
                        fontSize: 13,
                        border: `1px solid ${colors.accent}`,
                        borderRadius: 4,
                        outline: 'none',
                        backgroundColor: colors.bgInput,
                        color: colors.textHeading,
                        textAlign: 'right',
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setEditingPriceId(item.product.id);
                        setEditingPriceValue(String(item.price));
                      }}
                      style={{ cursor: 'pointer', borderBottom: `1px dashed ${colors.borderInput}`, padding: '0 2px' }}
                      title="Click para cambiar precio"
                    >
                      ${item.price.toFixed(2)} c/u
                    </span>
                  )}
                </div>
              </div>

              <div style={s.cartRowQty}>
                <button
                  onClick={() => updateQty(item.product.id, -1)}
                  style={s.qtyBtn}
                >
                  −
                </button>
                <span style={s.qtyVal}>{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.product.id, 1)}
                  style={s.qtyBtn}
                >
                  +
                </button>
              </div>

              <span style={s.cartRowSubtotal}>
                ${(item.price * item.quantity).toFixed(2)}
              </span>

              <button
                onClick={() => removeItem(item.product.id)}
                style={s.removeBtn}
              >
                <X size={16} />
              </button>
            </div>
          ))}

          {cart.length === 0 && (
            <div style={s.emptyCart}>
              <ShoppingCart size={40} color={colors.textSecondary} style={{ marginBottom: 8 }} />
              <p>El carrito está vacío</p>
              <p style={s.emptyCartHint}>
                Busque productos y presione <strong>Agregar</strong>
              </p>
            </div>
          )}
        </div>

          <div style={s.footer}>
          <div style={s.totalRow}>
            <span style={s.totalLabel}>Total</span>
            <span style={s.totalValue}>${total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={cart.length === 0}
            style={{
              ...s.continueBtn,
              ...(cart.length === 0 ? s.continueBtnDisabled : {}),
            }}
          >
            {cart.length === 0 ? '0 Continuar' : `${cart.length} Continuar`}
          </button>
        </div>
      </div>

      {showModal && (
        <div style={s.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}><CheckCircle size={20} style={{ marginRight: 8, verticalAlign: 'middle', color: '#22c55e' }} /> Finalizar venta</h2>

            <div style={s.modalBody}>
              {/* Cliente */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: colors.textHeading, display: 'block', marginBottom: 4 }}>
                  Cliente
                </label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 14,
                    border: `1px solid ${colors.borderInput}`,
                    borderRadius: 6,
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: colors.bgInput,
                    color: colors.textHeading,
                  }}
                  placeholder="Nombre del cliente (opcional)"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>

              {/* Método de pago */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: colors.textHeading, display: 'block', marginBottom: 4 }}>
                  Método de pago
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Efectivo', 'Transferencia'].map((metodo) => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(metodo);
                        if (metodo !== 'Transferencia') setPaymentReference('');
                      }}
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: paymentMethod === metodo ? 600 : 400,
                        border: `2px solid ${paymentMethod === metodo ? colors.accent : colors.borderInput}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        backgroundColor: paymentMethod === metodo ? colors.accent + '20' : colors.bgInput,
                        color: paymentMethod === metodo ? colors.accent : colors.textHeading,
                        transition: 'all 0.2s',
                        flex: 1,
                        minWidth: 100,
                      }}
                    >
                      {renderPaymentButton(metodo)}
                    </button>
                  ))}
                </div>

                {/* Campo de comprobante para Transferencia */}
                {paymentMethod === 'Transferencia' && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: colors.textHeading, display: 'block', marginBottom: 4 }}>
                      N° de comprobante de transferencia *
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: 14,
                        border: `1px solid ${colors.borderInput}`,
                        borderRadius: 6,
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: colors.bgInput,
                        color: colors.textHeading,
                      }}
                      placeholder="Ej. TRANS-123456"
                      autoComplete="off"
                    />
                  </div>
                )}
              </div>

              {cart.map((item) => (
                <div key={item.product.id} style={s.modalRow}>
                  <span>
                    {item.product.name} <strong>×{item.quantity}</strong>
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={s.modalDivider} />
              <div style={s.modalTotalRow}>
                <strong>Total</strong>
                <strong>${total.toFixed(2)}</strong>
              </div>
            </div>

            <div style={s.modalActions}>
              <button onClick={finishSale} style={s.modalConfirm}>
                <DollarSign size={18} style={{ marginRight: 6 }} /> Cobrar ${total.toFixed(2)}
              </button>
              <button onClick={() => setShowModal(false)} style={s.modalCancel}>
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotaVenta && ventaRecibo && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 8 }} />
              <h2 style={s.modalTitle}>Venta completada</h2>
              <p style={{ color: colors.textSecondary, marginBottom: 8 }}>
                Recibo <strong>{ventaRecibo.numero}</strong> — ${ventaRecibo.total.toFixed(2)}
              </p>
              <p style={{ color: colors.textSecondary, fontSize: 14 }}>
                ¿Deseas descargar la Nota de Venta?
              </p>
            </div>

            <div style={{ ...s.modalActions, flexDirection: 'column', gap: 10 }}>
              <PDFDownloadLink
                document={<ReciboPDF data={{
                  numero: ventaRecibo.numero,
                  fecha: ventaRecibo.fecha,
                  hora: ventaRecibo.hora,
                  cliente: ventaRecibo.cliente,
                  productos: ventaRecibo.productos,
                  subtotal: ventaRecibo.subtotal,
                  iva: ventaRecibo.iva,
                  total: ventaRecibo.total,
                  metodoPago: ventaRecibo.metodoPago,
                  vendedor: ventaRecibo.vendedor,
                  negocio: negocioData,
                  piePagina: '¡Gracias por tu preferencia!',
                }} />}
                fileName={`nota-venta-${ventaRecibo.numero}.pdf`}
                style={{ ...s.modalConfirm, textDecoration: 'none', display: 'block', textAlign: 'center' }}
              >
                {({ loading }) => renderPdfLink(loading)}
              </PDFDownloadLink>
              <button onClick={handleCerrarNotaVenta} style={s.modalCancel}>
                <X size={16} style={{ marginRight: 6 }} /> Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    gap: '24px',
    height: '100%',
    padding: '0',
  },

  /* ── Columna izquierda ── */
  leftCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: 0,
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a2332',
    margin: 0,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #d0d5dd',
    borderRadius: '10px',
    padding: '0 14px',
    transition: 'border-color 0.2s',
  },
  searchIcon: {
    fontSize: '16px',
    marginRight: '10px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    padding: '12px 0',
    color: '#1a2332',
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
  },
  clearSearch: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9aa6b2',
    fontSize: '14px',
    padding: '4px',
  },
  productGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
    overflowY: 'auto',
  },
  productCard: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '12px 16px',
    border: '1px solid #e8ecf0',
    gap: '12px',
    transition: 'box-shadow 0.2s',
  },
  productBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#9aa6b2',
    backgroundColor: '#f0f4f9',
    borderRadius: '6px',
    padding: '2px 8px',
    whiteSpace: 'nowrap',
  },
  productBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  productName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a2332',
  },
  productPrice: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#2e7d32',
  },
  productStock: {
    fontSize: '11px',
    color: '#6b7a8a',
  },
  addBtn: {
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.2s',
  },
  addBtnDisabled: {
    backgroundColor: '#d0d5dd',
    color: '#9aa6b2',
    cursor: 'not-allowed',
  },
  emptyMsg: {
    color: '#6b7a8a',
    textAlign: 'center',
    padding: '40px 0',
    fontSize: '14px',
  },

  /* ── Columna derecha ── */
  rightCol: {
    width: '400px',
    minWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e8ecf0',
    overflow: 'hidden',
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e8ecf0',
  },
  cartTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a2332',
    margin: 0,
  },
  clearCartBtn: {
    background: 'none',
    border: 'none',
    color: '#e74c3c',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  cartList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  cartRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 20px',
    borderBottom: '1px solid #f0f4f9',
  },
  cartRowInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  cartRowName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a2332',
  },
  cartRowUnit: {
    fontSize: '11px',
    color: '#6b7a8a',
  },
  cartRowQty: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  qtyBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid #d0d5dd',
    backgroundColor: '#f8fafc',
    color: '#1a2332',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  qtyVal: {
    minWidth: '24px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a2332',
  },
  cartRowSubtotal: {
    minWidth: '70px',
    textAlign: 'right',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a2332',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#9aa6b2',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
    borderRadius: '4px',
  },
  emptyCart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#9aa6b2',
    textAlign: 'center',
    gap: '8px',
  },
  emptyCartIcon: {
    fontSize: '40px',
    marginBottom: '8px',
  },
  emptyCartHint: {
    fontSize: '12px',
    color: '#b0b8c4',
  },

  /* ── Footer total ── */
  footer: {
    borderTop: '1px solid #e8ecf0',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: '#f8fafc',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7a8a',
  },
  totalValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1a2332',
  },
  continueBtn: {
    width: '100%',
    padding: '14px 0',
    backgroundColor: '#2e7d32',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  continueBtnDisabled: {
    backgroundColor: '#d0d5dd',
    color: '#9aa6b2',
    cursor: 'not-allowed',
  },

  /* ── Modal ── */
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '420px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a2332',
    padding: '20px 24px 0',
    margin: 0,
  },
  modalBody: {
    padding: '16px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  modalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    color: '#1a2332',
  },
  modalDivider: {
    height: '1px',
    backgroundColor: '#e8ecf0',
    margin: '8px 0',
  },
  modalTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    color: '#1a2332',
    padding: '8px 0',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    padding: '16px 24px 20px',
  },
  modalConfirm: {
    flex: 1,
    padding: '14px 0',
    backgroundColor: '#2e7d32',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  modalCancel: {
    flex: 1,
    padding: '14px 0',
    backgroundColor: '#f0f4f9',
    color: '#1a2332',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};