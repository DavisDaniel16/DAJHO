import { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { applyThemeToStyles } from '../styles/theme';
import { useSuppliers } from '../hooks/useDB';

interface SupplierForm {
  name: string;
  phone: string;
  city: string;
  address: string;
  contact_person: string;
  products_type: string;
  notes: string;
}

interface PurchaseTrip {
  id: number;
  supplierId: number;
  date: string;
  city: string;
  products: string[];
  total: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
}

const emptyForm = (): SupplierForm => ({
  name: '', phone: '', city: '', address: '', contact_person: '', products_type: '', notes: '',
});

// Viajes de compra (historial)
const mockPurchaseTrips: PurchaseTrip[] = [
  { id: 1, supplierId: 1, date: '2026-06-15', city: 'Quito', products: ['Camisas', 'Blusas'], total: 450.00, paymentStatus: 'paid' },
  { id: 2, supplierId: 2, date: '2026-06-18', city: 'Guayaquil', products: ['Vestidos', 'Accesorios'], total: 300.00, paymentStatus: 'pending' },
  { id: 3, supplierId: 3, date: '2026-06-10', city: 'Cuenca', products: ['Pantalones', 'Chaquetas'], total: 680.00, paymentStatus: 'paid' },
  { id: 4, supplierId: 4, date: '2026-06-12', city: 'Manta', products: ['Vestidos', 'Blusas'], total: 420.00, paymentStatus: 'partial' },
];

export const Suppliers = () => {
  const { colors } = useTheme();
  const styles: Record<string, React.CSSProperties> = useMemo(() => {
    const themed = applyThemeToStyles(baseStyles, colors, true);
    return {
      ...themed,
      searchInput: { ...themed.searchInput, backgroundColor: colors.bgInput, color: colors.textHeading, border: `1px solid ${colors.borderInput}` },
      filterSelect: { ...themed.filterSelect, backgroundColor: colors.bgInput, color: colors.textHeading, border: `1px solid ${colors.borderInput}` },
      addButton: { ...themed.addButton, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
      cityBadge: { ...themed.cityBadge, backgroundColor: '#1e3a5f', color: '#60a5fa' },
      pendingBadge: { ...themed.pendingBadge, backgroundColor: colors.bgDanger, color: colors.danger },
      paidBadge: { ...themed.paidBadge, backgroundColor: colors.bgSuccess, color: colors.success },
      modalOverlay: { ...themed.modalOverlay, backgroundColor: 'rgba(0,0,0,0.5)' },
      modalCancel: { ...themed.modalCancel, backgroundColor: colors.buttonSecondary, color: colors.textHeading, border: `1px solid ${colors.buttonSecondaryBorder}` },
      modalSubmit: { ...themed.modalSubmit, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    };
  }, [colors]);
  const { suppliers, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [purchaseTrips, setPurchaseTrips] = useState<PurchaseTrip[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm());
  const [newTrip, setNewTrip] = useState<Partial<PurchaseTrip>>({
    supplierId: 0,
    date: new Date().toISOString().split('T')[0],
    city: '',
    products: [],
    total: 0,
    paymentStatus: 'pending',
  });

  const cities = ['all', ...new Set(suppliers.map(s => s.city))];

  const totalSuppliers = suppliers.length;
  const totalPending = suppliers.reduce((sum, s) => sum + (s.total_pending || 0), 0);
  const totalPurchases = suppliers.reduce((sum, s) => sum + (s.total_purchases || 0), 0);

  // Filtrar proveedores
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          supplier.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (supplier.products_type || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity === 'all' || supplier.city === filterCity;
    return matchesSearch && matchesCity;
  });

  // Agregar proveedor
  const handleAddSupplier = async () => {
    if (!form.name || !form.city) {
      alert('Por favor completa al menos el nombre y la ciudad');
      return;
    }
    await createSupplier(form);
    setShowModal(false);
    setForm(emptyForm());
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name || '',
      phone: supplier.phone || '',
      city: supplier.city || '',
      address: supplier.address || '',
      contact_person: supplier.contact_person || '',
      products_type: (supplier.products_type || supplier.productsType || []).toString(),
      notes: supplier.notes || '',
    });
    setShowModal(true);
  };

  const handleUpdateSupplier = async () => {
    if (!editingId) return;
    await updateSupplier(editingId, form);
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleDeleteSupplier = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      await deleteSupplier(id);
    }
  };

  // Agregar viaje de compra
  const handleAddTrip = async () => {
    if (!newTrip.supplierId || !newTrip.total) {
      alert('Por favor selecciona un proveedor y registra el total');
      return;
    }

    const trip: PurchaseTrip = {
      id: purchaseTrips.length + 1,
      supplierId: newTrip.supplierId || 0,
      date: newTrip.date || new Date().toISOString().split('T')[0],
      city: newTrip.city || '',
      products: newTrip.products || [],
      total: newTrip.total || 0,
      paymentStatus: newTrip.paymentStatus as 'paid' | 'pending' | 'partial' || 'pending',
    };

    // Actualizar proveedor con la compra
    const sup = suppliers.find(s => s.id === trip.supplierId);
    if (sup) {
      await updateSupplier(trip.supplierId, {
        total_purchases: (sup.total_purchases || 0) + trip.total,
        total_pending: trip.paymentStatus === 'pending' ? (sup.total_pending || 0) + trip.total : (sup.total_pending || 0),
        last_purchase: trip.date,
      } as any);
    }

    setPurchaseTrips([trip, ...purchaseTrips]);
    setShowTripModal(false);
    setSelectedSupplier(null);
    resetTripForm();
  };

  // Resetear formulario de viaje
  const resetTripForm = () => {
    setNewTrip({
      supplierId: 0,
      date: new Date().toISOString().split('T')[0],
      city: '',
      products: [],
      total: 0,
      paymentStatus: 'pending',
    });
  };

  // Obtener viajes por proveedor
  const getTripsBySupplier = (supplierId: number) => {
    return purchaseTrips.filter(t => t.supplierId === supplierId);
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏢 Proveedores</h1>

      {/* Estadísticas */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{totalSuppliers}</div>
          <div style={styles.statLabel}>Total de proveedores</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>${totalPending.toFixed(2)}</div>
          <div style={styles.statLabel}>Total por pagar</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>${totalPurchases.toFixed(2)}</div>
          <div style={styles.statLabel}>Total en compras</div>
        </div>
      </div>

      {/* Acciones */}
      <div style={styles.actions}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, ciudad o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.actionButtons}>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            style={styles.filterSelect}
          >
            {cities.map(city => (
              <option key={city} value={city}>
                {city === 'all' ? '📌 Todas las ciudades' : city}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm());
              setShowModal(true);
            }}
            style={styles.addButton}
          >
            ➕ Nuevo proveedor
          </button>
        </div>
      </div>

      {/* Tabla de proveedores */}
      <div style={styles.tableContainer}>
        {filteredSuppliers.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No se encontraron proveedores</p>
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
                setShowModal(true);
              }}
              style={styles.emptyButton}
            >
              Crear proveedor
            </button>
          </div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableRowHeader}>
              <div style={styles.tableCell}>Proveedor</div>
              <div style={styles.tableCell}>Ciudad</div>
              <div style={styles.tableCell}>Contacto</div>
              <div style={styles.tableCell}>Productos</div>
              <div style={styles.tableCell}>Últ. compra</div>
              <div style={styles.tableCell}>Por pagar</div>
              <div style={styles.tableCell}>Total</div>
              <div style={styles.tableCell}>Acciones</div>
            </div>
            {filteredSuppliers.map((supplier) => {
              const trips = getTripsBySupplier(supplier.id);
              return (
                <div key={supplier.id} style={styles.tableRow}>
                  <div style={styles.tableCell}>
                    <div style={styles.supplierName}>{supplier.name}</div>
                  </div>
                  <div style={styles.tableCell}>
                    <span style={styles.cityBadge}>📍 {supplier.city}</span>
                  </div>
                  <div style={styles.tableCell}>
                    <div style={styles.contactInfo}>
                      <div>{supplier.contact_person || '-'}</div>
                      <div style={styles.phoneText}>{supplier.phone || '-'}</div>
                    </div>
                  </div>
                  <div style={styles.tableCell}>
                    <div style={styles.productsList}>
                      {(supplier.products_type || '').split(',').slice(0, 3).map((p, i) => (
                        <span key={i} style={styles.productTag}>{p}</span>
                      ))}
                      {(supplier.products_type || '').split(',').length > 3 && (
                        <span style={styles.productTag}>+{(supplier.products_type || '').split(',').length - 3}</span>
                      )}
                    </div>
                  </div>
                  <div style={styles.tableCell}>
                    {supplier.last_purchase ? formatDate(supplier.last_purchase) : '-'}
                  </div>
                  <div style={styles.tableCell}>
                    <span style={{
                      ...styles.pendingBadge,
                      ...((supplier.total_pending || 0) > 0 ? styles.pendingBadgePositive : styles.pendingBadgeZero)
                    }}>
                      ${(supplier.total_pending || 0).toFixed(2)}
                    </span>
                  </div>
                  <div style={styles.tableCell}>
                    <span style={styles.totalBadge}>
                      ${(supplier.total_purchases || 0).toFixed(2)}
                    </span>
                  </div>
                  <div style={styles.tableCell}>
                    <button
                      onClick={() => {
                        setSelectedSupplier(supplier.id);
                        setNewTrip({
                          supplierId: supplier.id,
                          date: new Date().toISOString().split('T')[0],
                          city: supplier.city,
                          products: supplier.productsType,
                          total: 0,
                          paymentStatus: 'pending',
                        });
                        setShowTripModal(true);
                      }}
                      style={styles.tripButton}
                      title="Registrar viaje de compra"
                    >
                      🧳
                    </button>
                    <button
                      onClick={() => handleEditSupplier(supplier)}
                      style={styles.editButton}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      style={styles.deleteButton}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para proveedor */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {editingSupplier ? '✏️ Editar proveedor' : '🆕 Nuevo proveedor'}
            </h2>
            
            <div style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej. Mayorista Textil Quito"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Ciudad *</label>
                  <input
                    type="text"
                    placeholder="Ej. Quito, Guayaquil, Cuenca..."
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Teléfono</label>
                  <input
                    type="text"
                    placeholder="02-1234567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Contacto</label>
                  <input
                    type="text"
                    placeholder="Nombre de la persona de contacto"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Dirección</label>
                <input
                  type="text"
                  placeholder="Dirección del proveedor"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Productos que ofrece</label>
                <input
                  type="text"
                  placeholder="Ej. Camisas, Pantalones, Vestidos (separados por comas)"
                  value={form.products_type}
                  onChange={(e) => setForm({ ...form, products_type: e.target.value })}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Notas</label>
                <textarea
                  placeholder="Observaciones sobre el proveedor..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  style={styles.formTextarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setForm(emptyForm());
                  }}
                  style={styles.modalCancel}
                >
                  Cancelar
                </button>
                <button
                  onClick={editingId ? handleUpdateSupplier : handleAddSupplier}
                  style={styles.modalSubmit}
                >
                  {editingId ? 'Actualizar proveedor' : 'Guardar proveedor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para registrar viaje de compra */}
      {showTripModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>🧳 Registrar viaje de compra</h2>
            <p style={styles.modalSubtitle}>Registra la compra que realizaste en tu viaje</p>
            
            <div style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Proveedor</label>
                  <input
                    type="text"
                    value={suppliers.find(s => s.id === newTrip.supplierId)?.name || ''}
                    style={{ ...styles.formInput, ...styles.formInputReadonly }}
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Ciudad</label>
                  <input
                    type="text"
                    value={suppliers.find(s => s.id === newTrip.supplierId)?.city || ''}
                    style={{ ...styles.formInput, ...styles.formInputReadonly }}
                    disabled
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Fecha de compra *</label>
                  <input
                    type="date"
                    value={newTrip.date || ''}
                    onChange={(e) => setNewTrip({ ...newTrip, date: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Estado de pago</label>
                  <select
                    value={newTrip.paymentStatus || 'pending'}
                    onChange={(e) => setNewTrip({ ...newTrip, paymentStatus: e.target.value as 'paid' | 'pending' | 'partial' })}
                    style={styles.formSelect}
                  >
                    <option value="paid">Pagado ✅</option>
                    <option value="pending">Pendiente ⏳</option>
                    <option value="partial">Parcial 🔄</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Productos comprados</label>
                <input
                  type="text"
                  placeholder="Ej. Camisas, Pantalones, Vestidos (separados por comas)"
                  value={(newTrip.products || []).join(', ')}
                  onChange={(e) => setNewTrip({
                    ...newTrip,
                    products: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Total de la compra ($) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newTrip.total || ''}
                  onChange={(e) => setNewTrip({ ...newTrip, total: parseFloat(e.target.value) || 0 })}
                  style={styles.formInput}
                  min="0"
                  step="0.01"
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  onClick={() => {
                    setShowTripModal(false);
                    resetTripForm();
                  }}
                  style={styles.modalCancel}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddTrip}
                  style={styles.modalSubmit}
                >
                  Registrar compra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos
const baseStyles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '24px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a2332',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7a8a',
    fontWeight: '500',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
    alignItems: 'center',
  },
  searchWrapper: {
    flex: 1,
    minWidth: '200px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '14px',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '10px 16px',
    fontSize: '14px',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    outline: 'none',
  },
  addButton: {
    padding: '10px 24px',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
  },
  tableRowHeader: {
    display: 'grid',
    gridTemplateColumns: '180px 100px 140px 160px 100px 100px 100px 110px',
    backgroundColor: '#f8faff',
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '8px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '180px 100px 140px 160px 100px 100px 100px 110px',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f4f9',
    alignItems: 'center',
    transition: 'background-color 0.3s',
  },
  tableCell: {
    fontSize: '14px',
    color: '#1a2332',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  supplierName: {
    fontWeight: '500',
  },
  cityBadge: {
    backgroundColor: '#dbeafe',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#1e40af',
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  phoneText: {
    fontSize: '12px',
    color: '#6b7a8a',
  },
  productsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  productTag: {
    backgroundColor: '#f0f4f9',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#1a2332',
  },
  pendingBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
  },
  pendingBadgePositive: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  pendingBadgeZero: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  totalBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  tripButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
    opacity: 0.6,
    transition: 'opacity 0.3s',
  },
  editButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
    opacity: 0.6,
    transition: 'opacity 0.3s',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
    opacity: 0.6,
    transition: 'opacity 0.3s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
  },
  emptyText: {
    color: '#6b7a8a',
    fontSize: '16px',
    marginBottom: '16px',
  },
  emptyButton: {
    padding: '10px 24px',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '4px',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#6b7a8a',
    marginBottom: '20px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a2332',
  },
  formInput: {
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  formInputReadonly: {
    backgroundColor: '#f8faff',
    cursor: 'not-allowed',
  },
  formTextarea: {
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.3s',
    resize: 'vertical',
    minHeight: '80px',
    fontFamily: 'inherit',
  },
  formSelect: {
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: '#ffffff',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
  },
  modalCancel: {
    padding: '10px 20px',
    backgroundColor: '#f0f4f9',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#1a2332',
  },
  modalSubmit: {
    padding: '10px 24px',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
};

export default Suppliers;