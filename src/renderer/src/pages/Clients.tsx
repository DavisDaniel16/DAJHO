import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useClients } from '../hooks/useDB';

interface ClientForm {
  name: string;
  phone: string;
  email: string;
  document: string;
}

const emptyForm = (): ClientForm => ({ name: '', phone: '', email: '', document: '' });

export const Clients = () => {
  const { colors } = useTheme();
  const styles: Record<string, React.CSSProperties> = useMemo(() => ({
    ...baseStyles,
    title: { ...baseStyles.title, color: colors.textHeading },
    statCard: { ...baseStyles.statCard, backgroundColor: colors.bgCard, boxShadow: colors.shadowSm, border: `1px solid ${colors.border}` },
    statValue: { ...baseStyles.statValue, color: colors.textHeading },
    statLabel: { ...baseStyles.statLabel, color: colors.textSecondary },
    searchInput: { ...baseStyles.searchInput, border: `1px solid ${colors.borderInput}`, backgroundColor: colors.bgInput, color: colors.textHeading },
    addButton: { ...baseStyles.addButton, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    tableContainer: { ...baseStyles.tableContainer, backgroundColor: colors.bgCard, boxShadow: colors.shadowMd, border: `1px solid ${colors.border}` },
    tableRowHeader: { ...baseStyles.tableRowHeader, backgroundColor: colors.bgTableHeader, color: colors.textHeading },
    tableRow: { ...baseStyles.tableRow, borderBottom: `1px solid ${colors.borderLight}` },
    tableCell: { ...baseStyles.tableCell, color: colors.textHeading },
    emailText: { ...baseStyles.emailText, color: colors.textSecondary },
    debtBadgePositive: { ...baseStyles.debtBadgePositive, backgroundColor: colors.bgDanger, color: colors.danger },
    debtBadgeZero: { ...baseStyles.debtBadgeZero, backgroundColor: colors.bgSuccess, color: colors.success },
    readOnlyText: { ...baseStyles.readOnlyText, color: colors.textSecondary },
    emptyText: { ...baseStyles.emptyText, color: colors.textSecondary },
    emptyButton: { ...baseStyles.emptyButton, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    modalOverlay: { ...baseStyles.modalOverlay, backgroundColor: 'rgba(0,0,0,0.5)' },
    modal: { ...baseStyles.modal, backgroundColor: colors.bgCard },
    modalTitle: { ...baseStyles.modalTitle, color: colors.textHeading },
    formLabel: { ...baseStyles.formLabel, color: colors.textHeading },
    formInput: { ...baseStyles.formInput, border: `1px solid ${colors.borderInput}`, backgroundColor: colors.bgInput, color: colors.textHeading },
    modalCancel: { ...baseStyles.modalCancel, backgroundColor: colors.buttonSecondary, border: `1px solid ${colors.buttonSecondaryBorder}`, color: colors.textHeading },
    modalSubmit: { ...baseStyles.modalSubmit, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    infoMessage: { ...baseStyles.infoMessage, backgroundColor: colors.bgTertiary, color: colors.textSecondary },
  }), [colors]);
  const { user } = useAuth();
  const { clients, createClient, updateClient, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm());

  const canEdit = user?.role === 'owner';
  const totalClients = clients.length;
  const totalDebt = clients.reduce((sum, c) => sum + (c.total_debt || 0), 0);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone || '').includes(searchTerm) ||
    (client.document || '').includes(searchTerm)
  );

  const handleAddClient = async () => {
    if (!form.name || !form.phone) {
      alert('Por favor completa al menos el nombre y teléfono');
      return;
    }
    await createClient({ ...form, total_debt: 0, total_purchases: 0 });
    setShowModal(false);
    setForm(emptyForm());
  };

  const handleEditClient = (client: any) => {
    if (!canEdit) { alert('No tienes permisos para editar clientes'); return; }
    setEditingId(client.id);
    setForm({ name: client.name || '', phone: client.phone || '', email: client.email || '', document: client.document || '' });
    setShowModal(true);
  };

  const handleUpdateClient = async () => {
    if (!editingId || !canEdit) return;
    await updateClient(editingId, form);
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleDeleteClient = async (id: number) => {
    if (!canEdit) { alert('No tienes permisos para eliminar clientes'); return; }
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  // Resetear formulario
  const resetForm = () => { setForm(emptyForm()); };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Renderizar acciones según rol
  const renderActions = (client: Client) => {
    if (!canEdit) {
      return <span style={styles.readOnlyText}>👀 Ver</span>;
    }
    return (
      <div style={styles.actionButtonsCell}>
        <button
          onClick={() => handleEditClient(client)}
          style={styles.editButton}
          title="Editar cliente"
        >
          ✏️
        </button>
        <button
          onClick={() => handleDeleteClient(client.id)}
          style={styles.deleteButton}
          title="Eliminar cliente"
        >
          🗑️
        </button>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👤 Clientes</h1>

      {/* Estadísticas */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{totalClients}</div>
          <div style={styles.statLabel}>Total de clientes</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>${totalDebt.toFixed(2)}</div>
          <div style={styles.statLabel}>Total por cobrar</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{canEdit ? '👑 Propietario' : '👤 Empleado'}</div>
          <div style={styles.statLabel}>Tu rol</div>
        </div>
      </div>

      {/* Acciones */}
      <div style={styles.actions}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, teléfono o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        {/* Todos pueden crear clientes (para registrar compradores) */}
        <button
          onClick={() => { setEditingId(null); setForm(emptyForm()); setShowModal(true); }}
          style={styles.addButton}
        >
          ➕ Nuevo cliente
        </button>
      </div>

      {/* Tabla de clientes */}
      <div style={styles.tableContainer}>
        {filteredClients.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No se encontraron clientes</p>
            <button
              onClick={() => { setEditingId(null); setForm(emptyForm()); setShowModal(true); }}
              style={styles.emptyButton}
            >
              Crear cliente
            </button>
          </div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableRowHeader}>
              <div style={styles.tableCell}>Nombre</div>
              <div style={styles.tableCell}>Teléfono</div>
              <div style={styles.tableCell}>Email</div>
              <div style={styles.tableCell}>Documento</div>
              <div style={styles.tableCell}>Fecha registro</div>
              <div style={styles.tableCell}>Por cobrar</div>
              <div style={styles.tableCell}>Compras</div>
              <div style={styles.tableCell}>Acciones</div>
            </div>
            {filteredClients.map((client) => (
              <div key={client.id} style={styles.tableRow}>
                <div style={styles.tableCell}>
                  <div style={styles.clientName}>{client.name}</div>
                </div>
                <div style={styles.tableCell}>{client.phone}</div>
                <div style={styles.tableCell}>
                  <span style={styles.emailText}>{client.email || '-'}</span>
                </div>
                <div style={styles.tableCell}>{client.document || '-'}</div>
                <div style={styles.tableCell}>{formatDate(client.createdAt)}</div>
                <div style={styles.tableCell}>
                  <span style={{
                    ...styles.debtBadge,
                    ...(client.totalDebt > 0 ? styles.debtBadgePositive : styles.debtBadgeZero)
                  }}>
                    ${client.totalDebt.toFixed(2)}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  <span style={styles.purchasesBadge}>
                    ${(client.total_purchases || 0).toFixed(2)}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  {renderActions(client)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para crear/editar cliente */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {editingId ? '✏️ Editar cliente' : '🆕 Nuevo cliente'}
            </h2>
            
            <div style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej. María González"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Teléfono *</label>
                  <input
                    type="text"
                    placeholder="0987654321"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Documento</label>
                  <input
                    type="text"
                    placeholder="Cédula o RUC"
                    value={form.document}
                    onChange={(e) => setForm({ ...form, document: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>

              {canEdit && (
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Total por cobrar</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={form.totalDebt !== undefined ? form.totalDebt : ''}
                      onChange={(e) => setForm({ ...form, totalDebt: parseFloat(e.target.value) || 0 })}
                      style={styles.formInput}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Total compras</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={form.totalPurchases !== undefined ? form.totalPurchases : ''}
                      onChange={(e) => setForm({ ...form, totalPurchases: parseFloat(e.target.value) || 0 })}
                      style={styles.formInput}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              {!canEdit && (
                <div style={styles.infoMessage}>
                  <span style={styles.infoIcon}>ℹ️</span>
                  <span style={styles.infoText}>Los campos de deuda y compras solo pueden ser editados por el propietario.</span>
                </div>
              )}

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
                  onClick={editingId ? handleUpdateClient : handleAddClient}
                  style={styles.modalSubmit}
                >
                  {editingId ? 'Actualizar cliente' : 'Guardar cliente'}
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
    minWidth: '250px',
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
    gridTemplateColumns: '180px 120px 160px 120px 110px 130px 130px 100px',
    backgroundColor: '#f8faff',
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '8px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '180px 120px 160px 120px 110px 130px 130px 100px',
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
  clientName: {
    fontWeight: '500',
  },
  emailText: {
    color: '#6b7a8a',
    fontSize: '13px',
  },
  debtBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
  },
  debtBadgePositive: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  debtBadgeZero: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  purchasesBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  actionButtonsCell: {
    display: 'flex',
    gap: '4px',
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
  readOnlyText: {
    fontSize: '12px',
    color: '#6b7a8a',
    fontStyle: 'italic',
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
  infoMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#f0f4f9',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#6b7a8a',
  },
  infoIcon: {
    fontSize: '16px',
  },
  infoText: {
    flex: 1,
  },
};

export default Clients;