import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSales, useExpenses } from '../hooks/useDB';
import { Plus, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown, Clock, CreditCard } from 'lucide-react';

// Traducción de categorías de gastos (inglés → español)
const CATEGORY_LABELS: Record<string, string> = {
  transport: 'Transporte',
  lodging: 'Hospedaje',
  food: 'Alimentación',
  merchandise: 'Mercadería',
  store: 'Tienda',
  other: 'Otros',
  Ventas: 'Ventas',
  Gastos: 'Gastos',
};

function translateCategory(cat: string): string {
  return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

interface Transaction {
  id: number;
  date: string;
  time: string;
  concept: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
}

export const Balance = () => {
  const { colors } = useTheme();
  const styles: Record<string, React.CSSProperties> = useMemo(() => ({
    ...baseStyles,
    title: { ...baseStyles.title, color: colors.textHeading },
    filterButton: { ...baseStyles.filterButton, backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderInput}`, color: colors.textHeading },
    filterButtonActive: { ...baseStyles.filterButtonActive, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary, borderColor: colors.buttonPrimary },
    searchInput: { ...baseStyles.searchInput, border: `1px solid ${colors.borderInput}`, backgroundColor: colors.bgInput, color: colors.textHeading },
    summaryCard: { ...baseStyles.summaryCard, backgroundColor: colors.bgCard, boxShadow: colors.shadowSm, border: `1px solid ${colors.border}` },
    summaryLabel: { ...baseStyles.summaryLabel, color: colors.textSecondary },
    tableContainer: { ...baseStyles.tableContainer, backgroundColor: colors.bgCard, boxShadow: colors.shadowMd, border: `1px solid ${colors.border}` },
    tableTitle: { ...baseStyles.tableTitle, color: colors.textHeading },
    addButton: { ...baseStyles.addButton, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    tableRowHeader: { ...baseStyles.tableRowHeader, backgroundColor: colors.bgTableHeader, color: colors.textHeading },
    tableRow: { ...baseStyles.tableRow, borderBottom: `1px solid ${colors.borderLight}` },
    tableCell: { ...baseStyles.tableCell, color: colors.textHeading },
    categoryBadge: { ...baseStyles.categoryBadge, backgroundColor: colors.bgTertiary, color: colors.textHeading },
    typeIncome: { ...baseStyles.typeIncome, backgroundColor: colors.bgSuccess, color: colors.success },
    typeExpense: { ...baseStyles.typeExpense, backgroundColor: colors.bgDanger, color: colors.danger },
    emptyText: { ...baseStyles.emptyText, color: colors.textSecondary },
    emptyButton: { ...baseStyles.emptyButton, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    modalOverlay: { ...baseStyles.modalOverlay, backgroundColor: 'rgba(0,0,0,0.5)' },
    modal: { ...baseStyles.modal, backgroundColor: colors.bgCard },
    modalTitle: { ...baseStyles.modalTitle, color: colors.textHeading },
    formLabel: { ...baseStyles.formLabel, color: colors.textHeading },
    formInput: { ...baseStyles.formInput, border: `1px solid ${colors.borderInput}`, backgroundColor: colors.bgInput, color: colors.textHeading },
    formSelect: { ...baseStyles.formSelect, border: `1px solid ${colors.borderInput}`, backgroundColor: colors.bgInput, color: colors.textHeading },
    modalCancel: { ...baseStyles.modalCancel, backgroundColor: colors.buttonSecondary, border: `1px solid ${colors.buttonSecondaryBorder}`, color: colors.textHeading },
    modalSubmit: { ...baseStyles.modalSubmit, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
  }), [colors]);
  const { sales } = useSales();
  const { expenses, createExpense } = useExpenses();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  useEffect(() => {
    const income: Transaction[] = sales.map((s: any) => ({
      id: s.id,
      date: s.date,
      time: s.time || '',
      concept: `Venta #${s.id} - ${s.items_count || 0} productos`,
      type: 'income' as const,
      amount: s.total || 0,
      category: 'Ventas',
    }));
    const outcome: Transaction[] = expenses.map((e: any) => ({
      id: e.id + 10000,
      date: e.date,
      time: '',
      concept: e.description,
      type: 'expense' as const,
      amount: e.amount || 0,
      category: e.category || 'Gastos',
    }));
    // Ordenar por fecha descendente, luego por hora descendente, luego por ID descendente
    const combined = [...income, ...outcome].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      const timeCmp = b.time.localeCompare(a.time);
      if (timeCmp !== 0) return timeCmp;
      return b.id - a.id;
    });
    setTransactions(combined);
  }, [sales, expenses]);
  const [filter, setFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'income',
    category: 'Ventas',
    amount: 0,
  });

  // Filtrar transacciones por fecha
  const getFilteredTransactions = () => {
    let filtered = transactions;
    const today = new Date().toISOString().split('T')[0];
    
    if (filter === 'today') {
      filtered = filtered.filter(t => t.date === today);
    } else if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      filtered = filtered.filter(t => t.date >= weekAgoStr);
    } else if (filter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];
      filtered = filtered.filter(t => t.date >= monthAgoStr);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalPending = 0; // Por implementar (por cobrar)
  const totalPayable = 0; // Por implementar (por pagar)

  const handleAddTransaction = async () => {
    if (!newTransaction.concept || !newTransaction.amount || newTransaction.amount <= 0) {
      alert('Por favor completa todos los campos');
      return;
    }
    const dateStr = new Date().toISOString().split('T')[0];

    if (newTransaction.type === 'expense') {
      await createExpense({
        date: dateStr,
        category: newTransaction.category || 'other',
        description: newTransaction.concept || '',
        amount: newTransaction.amount || 0,
        payment_method: 'cash',
      });
    }
    // Para income, la venta se registra desde el módulo Vender

    setShowModal(false);
    setNewTransaction({ type: 'income', category: 'Ventas', amount: 0 });
  };

  const formatDate = (dateStr: string, timeStr?: string) => {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    if (timeStr) {
      return `${dateFormatted} ${timeStr}`;
    }
    return dateFormatted;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}><Wallet size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Balance</h1>

      {/* Filtros */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <button
            onClick={() => setFilter('today')}
            style={{
              ...styles.filterButton,
              ...(filter === 'today' ? styles.filterButtonActive : {})
            }}
          >
            Hoy
          </button>
          <button
            onClick={() => setFilter('week')}
            style={{
              ...styles.filterButton,
              ...(filter === 'week' ? styles.filterButtonActive : {})
            }}
          >
            Semana
          </button>
          <button
            onClick={() => setFilter('month')}
            style={{
              ...styles.filterButton,
              ...(filter === 'month' ? styles.filterButtonActive : {})
            }}
          >
            Mes
          </button>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...styles.filterButton,
              ...(filter === 'all' ? styles.filterButtonActive : {})
            }}
          >
            Todos
          </button>
        </div>
        
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Buscar concepto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Resumen de balances */}
      <div style={styles.summary}>
        <div style={styles.summaryCard}>
          <TrendingUp size={24} color="#2ecc71" />
          <div>
            <div style={styles.summaryLabel}>Ingresos</div>
            <div style={{ ...styles.summaryValue, color: '#2ecc71' }}>
              ${totalIncome.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div style={styles.summaryCard}>
          <TrendingDown size={24} color="#e74c3c" />
          <div>
            <div style={styles.summaryLabel}>Egresos</div>
            <div style={{ ...styles.summaryValue, color: '#e74c3c' }}>
              ${totalExpense.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div style={styles.summaryCard}>
          <Clock size={24} color="#f39c12" />
          <div>
            <div style={styles.summaryLabel}>Por cobrar</div>
            <div style={{ ...styles.summaryValue, color: '#f39c12' }}>
              ${totalPending.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div style={styles.summaryCard}>
          <CreditCard size={24} color="#e67e22" />
          <div>
            <div style={styles.summaryLabel}>Por pagar</div>
            <div style={{ ...styles.summaryValue, color: '#e67e22' }}>
              ${totalPayable.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h2 style={styles.tableTitle}>Transacciones</h2>
          <button
            onClick={() => setShowModal(true)}
            style={styles.addButton}
          >
            <Plus size={16} style={{ marginRight: 6 }} /> Crear movimiento
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Aún no tienes registros creados en esta fecha.</p>
            <button
              onClick={() => setShowModal(true)}
              style={styles.emptyButton}
            >
              Crear un movimiento
            </button>
          </div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableRowHeader}>
              <div style={styles.tableCell}>Fecha</div>
              <div style={styles.tableCell}>Concepto</div>
              <div style={styles.tableCell}>Categoría</div>
              <div style={styles.tableCell}>Tipo</div>
              <div style={{ ...styles.tableCell, textAlign: 'right' }}>Monto</div>
            </div>
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} style={styles.tableRow}>
                <div style={styles.tableCell}>{formatDate(transaction.date, transaction.time)}</div>
                <div style={styles.tableCell}>{transaction.concept}</div>
                <div style={styles.tableCell}>
                  <span style={styles.categoryBadge}>{translateCategory(transaction.category)}</span>
                </div>
                <div style={styles.tableCell}>
                  <span style={{
                    ...styles.typeBadge,
                    ...(transaction.type === 'income' ? styles.typeIncome : styles.typeExpense)
                  }}>
                    {transaction.type === 'income' ? (
                      <span><ArrowUpRight size={14} style={{ marginRight: 2 }} /> Ingreso </span>
                    ) : (
                      <span><ArrowDownRight size={14} style={{ marginRight: 2 }} /> Egreso </span>
                    )}
                  </span>
                </div>
                <div style={{
                  ...styles.tableCell,
                  textAlign: 'right',
                  color: transaction.type === 'income' ? '#2ecc71' : '#e74c3c',
                  fontWeight: '600'
                }}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Crear movimiento</h2>
            
            <div style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tipo</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({
                    ...newTransaction,
                    type: e.target.value as 'income' | 'expense'
                  })}
                  style={styles.formSelect}
                >
                  <option value="income">Ingreso</option>
                  <option value="expense">Egreso</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Categoría</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({
                    ...newTransaction,
                    category: e.target.value
                  })}
                  style={styles.formSelect}
                >
                  <option value="Ventas">Ventas</option>
                  <option value="Compras">Compras</option>
                  <option value="Gastos Fijos">Gastos Fijos</option>
                  <option value="Gastos Variables">Gastos Variables</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Concepto</label>
                <input
                  type="text"
                  placeholder="Descripción del movimiento"
                  value={newTransaction.concept || ''}
                  onChange={(e) => setNewTransaction({
                    ...newTransaction,
                    concept: e.target.value
                  })}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Monto ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newTransaction.amount || ''}
                  onChange={(e) => setNewTransaction({
                    ...newTransaction,
                    amount: parseFloat(e.target.value) || 0
                  })}
                  style={styles.formInput}
                  min="0"
                  step="0.01"
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  onClick={() => setShowModal(false)}
                  style={styles.modalCancel}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddTransaction}
                  style={styles.modalSubmit}
                >
                  Guardar movimiento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
    marginBottom: '24px',
  },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
    justifyContent: 'space-between',
  },
  filterGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f4f9',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#1a2332',
    transition: 'all 0.3s',
  },
  filterButtonActive: {
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    borderColor: '#4a9eff',
  },
  searchWrapper: {
    flex: 1,
    minWidth: '200px',
  },
  searchInput: {
    width: '100%',
    padding: '8px 16px',
    fontSize: '14px',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  summaryIcon: {
    fontSize: '32px',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#6b7a8a',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: '700',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  tableTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a2332',
    margin: 0,
  },
  addButton: {
    padding: '8px 20px',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  table: {
    width: '100%',
    overflowX: 'auto',
  },
  tableRowHeader: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 150px 100px 120px',
    backgroundColor: '#f8faff',
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '8px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 150px 100px 120px',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f4f9',
    alignItems: 'center',
    transition: 'background-color 0.3s',
  },
  tableCell: {
    fontSize: '14px',
    color: '#1a2332',
  },
  categoryBadge: {
    backgroundColor: '#f0f4f9',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#1a2332',
  },
  typeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  typeIncome: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  typeExpense: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
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
    maxWidth: '500px',
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

export default Balance;