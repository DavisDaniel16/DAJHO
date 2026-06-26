import { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { applyThemeToStyles } from '../styles/theme';
import { useExpenses } from '../hooks/useDB';

interface ExpenseForm {
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  city: string;
  notes: string;
}

const emptyForm = (): ExpenseForm => ({
  date: new Date().toISOString().split('T')[0],
  category: 'transport',
  description: '',
  amount: 0,
  payment_method: 'cash',
  city: '',
  notes: '',
});

// Resumen por categoría
const categoryLabels = {
  transport: { label: '🚌 Transporte', color: '#3b82f6' },
  lodging: { label: '🏨 Hospedaje', color: '#8b5cf6' },
  food: { label: '🍽️ Alimentación', color: '#f59e0b' },
  merchandise: { label: '👕 Mercadería', color: '#2ecc71' },
  store: { label: '🏪 Tienda', color: '#e74c3c' },
  other: { label: '📦 Otros', color: '#6b7a8a' },
};

const paymentLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

export const Expenses = () => {
  const { colors } = useTheme();
  const styles: Record<string, React.CSSProperties> = useMemo(() => {
    const themed = applyThemeToStyles(baseStyles, colors, true);
    return {
      ...themed,
      searchInput: { ...themed.searchInput, backgroundColor: colors.bgInput, color: colors.textHeading, border: `1px solid ${colors.borderInput}` },
      filterSelect: { ...themed.filterSelect, backgroundColor: colors.bgInput, color: colors.textHeading, border: `1px solid ${colors.borderInput}` },
      addButton: { ...themed.addButton, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
      modalOverlay: { ...themed.modalOverlay, backgroundColor: 'rgba(0,0,0,0.5)' },
      modalCancel: { ...themed.modalCancel, backgroundColor: colors.buttonSecondary, color: colors.textHeading, border: `1px solid ${colors.buttonSecondaryBorder}` },
      modalSubmit: { ...themed.modalSubmit, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    };
  }, [colors]);
  const { expenses, createExpense, updateExpense, deleteExpense } = useExpenses();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());

  const cities = ['all', ...new Set(expenses.map(e => e.city).filter(Boolean))];

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalMerchandise = expenses
    .filter(e => e.category === 'merchandise')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalTransport = expenses
    .filter(e => ['transport', 'lodging', 'food'].includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);
  const totalStore = expenses
    .filter(e => e.category === 'store')
    .reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (expense.notes && expense.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    const matchesCity = filterCity === 'all' || (expense.city || '') === filterCity;
    return matchesSearch && matchesCategory && matchesCity;
  });

  const handleAddExpense = async () => {
    if (!form.description || !form.amount || form.amount <= 0) {
      alert('Por favor completa la descripción y el monto');
      return;
    }
    await createExpense(form);
    setShowModal(false);
    setForm(emptyForm());
  };

  // Editar gasto
  const handleEditExpense = (expense: any) => {
    setEditingId(expense.id);
    setForm({
      date: expense.date || new Date().toISOString().split('T')[0],
      category: expense.category || 'transport',
      description: expense.description || '',
      amount: expense.amount || 0,
      payment_method: expense.payment_method || 'cash',
      city: expense.city || '',
      notes: expense.notes || '',
    });
    setShowModal(true);
  };

  const handleUpdateExpense = async () => {
    if (!editingId) return;
    await updateExpense(editingId, form);
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  // Eliminar gasto
  const handleDeleteExpense = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      await deleteExpense(id);
    }
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
      <h1 style={styles.title}>💸 Gastos y Egresos</h1>

      {/* Resumen */}
      <div style={styles.summary}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>${totalExpenses.toFixed(2)}</div>
          <div style={styles.summaryLabel}>Total gastos</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>${totalMerchandise.toFixed(2)}</div>
          <div style={styles.summaryLabel}>👕 Mercadería</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>${totalTransport.toFixed(2)}</div>
          <div style={styles.summaryLabel}>🚌 Viajes y alimentación</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>${totalStore.toFixed(2)}</div>
          <div style={styles.summaryLabel}>🏪 Tienda (arriendo, servicios)</div>
        </div>
      </div>

      {/* Controles */}
      <div style={styles.controls}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="🔍 Buscar por descripción o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.filterGroup}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">📂 Todas las categorías</option>
            <option value="transport">🚌 Transporte</option>
            <option value="lodging">🏨 Hospedaje</option>
            <option value="food">🍽️ Alimentación</option>
            <option value="merchandise">👕 Mercadería</option>
            <option value="store">🏪 Tienda</option>
            <option value="other">📦 Otros</option>
          </select>
          
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">📍 Todas las ciudades</option>
            {cities.filter(c => c !== 'all').map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm());
            setShowModal(true);
          }}
          style={styles.addButton}
        >
          ➕ Nuevo gasto
        </button>
      </div>

      {/* Tabla de gastos */}
      <div style={styles.tableContainer}>
        {filteredExpenses.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No se encontraron gastos</p>
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
                setShowModal(true);
              }}
              style={styles.emptyButton}
            >
              Registrar gasto
            </button>
          </div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableRowHeader}>
              <div style={styles.tableCell}>Fecha</div>
              <div style={styles.tableCell}>Categoría</div>
              <div style={styles.tableCell}>Descripción</div>
              <div style={styles.tableCell}>Ciudad</div>
              <div style={styles.tableCell}>Proveedor</div>
              <div style={styles.tableCell}>Monto</div>
              <div style={styles.tableCell}>Acciones</div>
            </div>
            {filteredExpenses.map((expense) => (
              <div key={expense.id} style={styles.tableRow}>
                <div style={styles.tableCell}>{formatDate(expense.date)}</div>
                <div style={styles.tableCell}>
                  <span style={styles.categoryBadge}>
                    {categoryLabels[expense.category]?.label || expense.category}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  <div style={styles.expenseDescription}>{expense.description}</div>
                  {expense.notes && <div style={styles.expenseNotes}>{expense.notes}</div>}
                </div>
                <div style={styles.tableCell}>
                  <span style={styles.cityBadge}>
                    📍 {expense.city || '-'}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  <span style={styles.supplierText}>
                    {expense.supplier || '-'}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  <span style={{
                    ...styles.amountBadge,
                    color: ['merchandise', 'store'].includes(expense.category) ? '#e74c3c' : '#f59e0b',
                  }}>
                    ${expense.amount.toFixed(2)}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  <button
                    onClick={() => handleEditExpense(expense)}
                    style={styles.editButton}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    style={styles.deleteButton}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para crear/editar gasto */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {editingId ? '✏️ Editar gasto' : '🆕 Nuevo gasto'}
            </h2>
            
            <div style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Fecha</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Categoría</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={styles.formSelect}
                  >
                    <option value="transport">🚌 Transporte</option>
                    <option value="lodging">🏨 Hospedaje</option>
                    <option value="food">🍽️ Alimentación</option>
                    <option value="merchandise">👕 Mercadería</option>
                    <option value="store">🏪 Tienda</option>
                    <option value="other">📦 Otros</option>
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Descripción *</label>
                  <input
                    type="text"
                    placeholder="Ej. Pasaje bus, Compra de mercadería..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Monto ($) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    style={styles.formInput}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Ciudad</label>
                  <input
                    type="text"
                    placeholder="Ej. Quito, Guayaquil..."
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Proveedor</label>
                  <input
                    type="text"
                    placeholder="Nombre del proveedor"
                    value={form.supplier || ''}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Método de pago</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    style={styles.formSelect}
                  >
                    <option value="cash">💵 Efectivo</option>
                    <option value="card">💳 Tarjeta</option>
                    <option value="transfer">🏦 Transferencia</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Notas</label>
                  <input
                    type="text"
                    placeholder="Observaciones adicionales..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
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
                  onClick={editingId ? handleUpdateExpense : handleAddExpense}
                  style={styles.modalSubmit}
                >
                  {editingId ? 'Actualizar gasto' : 'Guardar gasto'}
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
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a2332',
    marginBottom: '4px',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#6b7a8a',
    fontWeight: '500',
  },
  controls: {
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
  filterGroup: {
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
    gridTemplateColumns: '100px 140px 1fr 100px 120px 100px 100px',
    backgroundColor: '#f8faff',
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '8px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '100px 140px 1fr 100px 120px 100px 100px',
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
    flexWrap: 'wrap',
  },
  expenseDescription: {
    fontWeight: '500',
  },
  expenseNotes: {
    fontSize: '12px',
    color: '#6b7a8a',
  },
  categoryBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#f0f4f9',
    color: '#1a2332',
  },
  cityBadge: {
    fontSize: '13px',
    color: '#6b7a8a',
  },
  supplierText: {
    fontSize: '13px',
    color: '#1a2332',
  },
  amountBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    backgroundColor: '#fef3c7',
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
    marginBottom: '24px',
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

export default Expenses;