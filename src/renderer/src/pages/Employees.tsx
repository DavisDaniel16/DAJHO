import { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useEmployees } from '../hooks/useDB';
import { useAuth } from '../context/AuthContext';

interface EmployeeForm {
  name: string;
  phone: string;
  email: string;
  role: string;
  salary: number;
  notes: string;
  username: string;
  password: string;
}

const emptyForm = (): EmployeeForm => ({
  name: '', phone: '', email: '', role: 'employee', salary: 0, notes: '', username: '', password: '',
});

export const Employees = () => {
  const { colors } = useTheme();
  const styles: Record<string, React.CSSProperties> = useMemo(() => ({
    ...baseStyles,
    title: { ...baseStyles.title, color: colors.textHeading },
    statCard: { ...baseStyles.statCard, backgroundColor: colors.bgCard, boxShadow: colors.shadowSm, border: `1px solid ${colors.border}` },
    statValue: { ...baseStyles.statValue, color: colors.textHeading },
    statLabel: { ...baseStyles.statLabel, color: colors.textSecondary },
    searchInput: { ...baseStyles.searchInput, border: `1px solid ${colors.borderInput}`, backgroundColor: colors.bgInput, color: colors.textHeading },
    filterSelect: { ...baseStyles.filterSelect, border: `1px solid ${colors.borderInput}`, backgroundColor: colors.bgInput, color: colors.textHeading },
    addButton: { ...baseStyles.addButton, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    tableContainer: { ...baseStyles.tableContainer, backgroundColor: colors.bgCard, boxShadow: colors.shadowMd, border: `1px solid ${colors.border}` },
    tableRowHeader: { ...baseStyles.tableRowHeader, backgroundColor: colors.bgTableHeader, color: colors.textHeading },
    tableRow: { ...baseStyles.tableRow, borderBottom: `1px solid ${colors.borderLight}` },
    tableCell: { ...baseStyles.tableCell, color: colors.textHeading },
    roleBadge: { ...baseStyles.roleBadge },
    statusBadge: { ...baseStyles.statusBadge },
    statusActive: { ...baseStyles.statusActive, backgroundColor: colors.bgSuccess, color: colors.success },
    statusInactive: { ...baseStyles.statusInactive, backgroundColor: colors.bgDanger, color: colors.danger },
    emptyText: { ...baseStyles.emptyText, color: colors.textSecondary },
    modalOverlay: { ...baseStyles.modalOverlay, backgroundColor: 'rgba(0,0,0,0.5)' },
    modal: { ...baseStyles.modal, backgroundColor: colors.bgCard },
    modalTitle: { ...baseStyles.modalTitle, color: colors.textHeading },
    formLabel: { ...baseStyles.formLabel, color: colors.textHeading },
    formInput: { ...baseStyles.formInput, border: `1px solid ${colors.borderInput}`, backgroundColor: colors.bgInput, color: colors.textHeading },
    formSelect: { ...baseStyles.formSelect, border: `1px solid ${colors.borderInput}`, backgroundColor: colors.bgInput, color: colors.textHeading },
    modalCancel: { ...baseStyles.modalCancel, backgroundColor: colors.buttonSecondary, border: `1px solid ${colors.buttonSecondaryBorder}`, color: colors.textHeading },
    modalSubmit: { ...baseStyles.modalSubmit, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
  }), [colors]);
  const { user } = useAuth();
  const { employees, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
      const [form, setForm] = useState<EmployeeForm>(emptyForm());
  const [formStatus, setFormStatus] = useState<string>('active');

  const resetForm = () => {
    setForm(emptyForm());
    setFormStatus('active');
    setEditingId(null);
  };

  // Calcular estadísticas
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const totalSales = employees.reduce((sum, e) => sum + (e.sales_count || 0), 0);

  // Filtrar empleados
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employee.phone.includes(searchTerm) ||
                          employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || employee.role === filterRole;
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

    // Agregar empleado
  const handleAddEmployee = async () => {
    if (!form.name || !form.phone) {
      alert('Por favor completa al menos el nombre y teléfono');
      return;
    }
    if (!form.username || !form.password) {
      alert('Debes asignar un usuario y contraseña para el nuevo empleado');
      return;
    }
    const empId = await createEmployee({
      ...form,
      status: formStatus,
      hire_date: new Date().toISOString().split('T')[0],
    });
    if (empId) {
      const result = await window.dajhoAPI.users.create({
        name: form.name,
        username: form.username.toLowerCase().trim(),
        email: form.email || `${form.username.toLowerCase().trim()}@dajho.com`,
        password: form.password,
        role: form.role === 'owner' ? 'owner' : 'employee',
      });
      if (!result.success) {
        alert(`⚠️ Empleado creado pero hubo un error al crear el usuario: ${result.error}`);
      } else {
        alert('✅ Empleado y usuario creados correctamente');
      }
    }
    setShowModal(false);
    resetForm();
  };

    // Editar empleado
  const handleEditEmployee = (employee: any) => {
    setEditingId(employee.id);
    setForm({
      name: employee.name || '',
      phone: employee.phone || '',
      email: employee.email || '',
      role: employee.role || 'employee',
      salary: employee.salary || 0,
      notes: employee.notes || '',
      username: '',
      password: '',
    });
    setFormStatus(employee.status || 'active');
    setShowModal(true);
  };

    const handleUpdateEmployee = async () => {
    if (!editingId) return;
    if (!form.name || !form.phone) {
      alert('Por favor completa al menos el nombre y teléfono');
      return;
    }
    await updateEmployee(editingId, { ...form, status: formStatus });
    setShowModal(false);
    resetForm();
  };

  // Eliminar empleado
  const handleDeleteEmployee = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      await deleteEmployee(id);
    }
  };

  // Cambiar estado
  const toggleStatus = async (id: number) => {
    const emp = employees.find(e => e.id === id);
    if (emp) {
      await updateEmployee(id, { status: emp.status === 'active' ? 'inactive' : 'active' } as any);
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

  // Obtener etiqueta de rol
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Propietario',
      employee: 'Empleado',
    };
    return labels[role] || role;
  };

  // Obtener color de rol
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: '#8b5cf6',
      employee: '#3b82f6',
    };
    return colors[role] || '#6b7a8a';
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👥 Empleados</h1>

      {/* Estadísticas */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{totalEmployees}</div>
          <div style={styles.statLabel}>Total empleados</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{activeEmployees}</div>
          <div style={styles.statLabel}>Activos</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{totalSales}</div>
          <div style={styles.statLabel}>Ventas totales</div>
        </div>
      </div>

      {/* Acciones */}
      <div style={styles.actions}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.filterGroup}>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">Todos los roles</option>
            <option value="owner">Propietario</option>
            <option value="employee">Empleado</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

                <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          style={styles.addButton}
        >
          ➕ Nuevo empleado
        </button>
      </div>

      {/* Tabla de empleados */}
      <div style={styles.tableContainer}>
        {filteredEmployees.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No se encontraron empleados</p>
                        <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              style={styles.emptyButton}
            >
              Crear empleado
            </button>
          </div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableRowHeader}>
              <div style={styles.tableCell}>Nombre</div>
              <div style={styles.tableCell}>Teléfono</div>
              <div style={styles.tableCell}>Rol</div>
              <div style={styles.tableCell}>Estado</div>
              <div style={styles.tableCell}>Fecha ingreso</div>
              <div style={styles.tableCell}>Salario</div>
              <div style={styles.tableCell}>Ventas</div>
              <div style={styles.tableCell}>Acciones</div>
            </div>
            {filteredEmployees.map((employee) => (
              <div key={employee.id} style={styles.tableRow}>
                <div style={styles.tableCell}>
                  <div style={styles.employeeName}>{employee.name}</div>
                  <div style={styles.employeeEmail}>{employee.email}</div>
                </div>
                <div style={styles.tableCell}>{employee.phone}</div>
                <div style={styles.tableCell}>
                  <span style={{
                    ...styles.roleBadge,
                    backgroundColor: getRoleColor(employee.role) + '20',
                    color: getRoleColor(employee.role),
                  }}>
                    {getRoleLabel(employee.role)}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  <button
                    onClick={() => toggleStatus(employee.id)}
                    style={{
                      ...styles.statusButton,
                      ...(employee.status === 'active' ? styles.statusActive : styles.statusInactive)
                    }}
                  >
                    {employee.status === 'active' ? '✅ Activo' : '⛔ Inactivo'}
                  </button>
                </div>
                <div style={styles.tableCell}>{formatDate(employee.hire_date)}</div>
                <div style={styles.tableCell}>${employee.salary.toFixed(2)}</div>
                <div style={styles.tableCell}>
                  <span style={styles.salesBadge}>
                    {employee.sales_count || 0}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  <button
                    onClick={() => handleEditEmployee(employee)}
                    style={styles.editButton}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(employee.id)}
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

      {/* Modal para crear/editar empleado */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {editingId ? '✏️ Editar empleado' : '🆕 Nuevo empleado'}
            </h2>
            
            <div style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej. Ana Martínez"
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
                    placeholder="empleado@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Salario ($)</label>
                  <input
                    type="number"
                    placeholder="500"
                    value={form.salary || ''}
                    onChange={(e) => setForm({ ...form, salary: parseFloat(e.target.value) || 0 })}
                    style={styles.formInput}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

                            {/* Campos de usuario y contraseña - siempre visibles para el propietario */}
              {user?.role === 'owner' && (
                <>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Usuario {!editingId && <span style={{ color: '#dc2626' }}>*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={editingId ? "Dejar vacío para no cambiar" : "ej. nuevoempleado"}
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        style={styles.formInput}
                        autoComplete="off"
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Contraseña {!editingId && <span style={{ color: '#dc2626' }}>*</span>}
                      </label>
                      <input
                        type="password"
                        placeholder={editingId ? "Dejar vacío para no cambiar" : "••••••"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        style={styles.formInput}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  {editingId && (
                    <p style={{ fontSize: '12px', color: '#6b7a8a', margin: '-8px 0 0 0' }}>
                      💡 Solo completa estos campos si quieres cambiar el usuario o la contraseña
                    </p>
                  )}
                </>
              )}

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Rol</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    style={styles.formSelect}
                  >
                    <option value="owner">Propietario</option>
                    <option value="employee">Empleado</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Estado</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={styles.formSelect}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Notas</label>
                <textarea
                  placeholder="Observaciones sobre el empleado..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  style={styles.formTextarea}
                />
              </div>

              <div style={styles.modalActions}>
                                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  style={styles.modalCancel}
                >
                  Cancelar
                </button>
                <button
                  onClick={editingId ? handleUpdateEmployee : handleAddEmployee}
                  style={styles.modalSubmit}
                >
                  {editingId ? 'Actualizar empleado' : 'Guardar empleado'}
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
  filterGroup: {
    display: 'flex',
    gap: '8px',
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
    gridTemplateColumns: '180px 120px 120px 120px 110px 100px 80px 110px',
    backgroundColor: '#f8faff',
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '8px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '180px 120px 120px 120px 110px 100px 80px 110px',
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
  employeeName: {
    fontWeight: '500',
  },
  employeeEmail: {
    fontSize: '12px',
    color: '#6b7a8a',
  },
  roleBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusButton: {
    padding: '4px 12px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  statusActive: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusInactive: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  salesBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
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

export default Employees;