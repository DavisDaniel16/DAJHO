import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { applyThemeToStyles } from '../styles/theme';
import { useProducts, useCategories, Product } from '../hooks/useDB';
import * as XLSX from 'xlsx';
import { Ban, Search, Edit, Trash2, Package, Crown, User, Upload, Download, Plus, FileText } from 'lucide-react';

interface ProductForm {
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  size: string;
  color: string;
}

const emptyForm = (): ProductForm => ({
  name: '',
  price: 0,
  cost: 0,
  stock: 0,
  category: 'Camisas',
  size: 'M',
  color: '',
});

export const Inventory = () => {
  const { colors, isDarkMode } = useTheme();
  const themedStyles = applyThemeToStyles(baseStyles, colors, isDarkMode);
  const styles: Record<string, React.CSSProperties> = {
    ...themedStyles,
    searchInput: { ...themedStyles.searchInput, backgroundColor: colors.bgInput, color: colors.textHeading, border: `1px solid ${colors.borderInput}` },
    filterSelect: { ...themedStyles.filterSelect, backgroundColor: colors.bgInput, color: colors.textHeading, border: `1px solid ${colors.borderInput}` },
    addButton: { ...themedStyles.addButton, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
    importButton: { ...themedStyles.importButton, backgroundColor: colors.bgTertiary, color: colors.textHeading, border: `1px solid ${colors.borderInput}` },
    stockLow: { ...themedStyles.stockLow, color: colors.danger },
    stockOk: { ...themedStyles.stockOk, color: colors.success },
    modalOverlay: { ...themedStyles.modalOverlay, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalCancel: { ...themedStyles.modalCancel, backgroundColor: colors.buttonSecondary, color: colors.textHeading, border: `1px solid ${colors.buttonSecondaryBorder}` },
    modalSubmit: { ...themedStyles.modalSubmit, backgroundColor: colors.buttonPrimary, color: colors.textOnPrimary },
  };
  const { user, hasPermission } = useAuth();
  const { products, loadProducts, createProduct, updateProduct, deleteProduct, updateStock } = useProducts();
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ loading: boolean; message: string; success: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar permisos
  const canEdit = user?.role === 'owner';
  const canView = hasPermission('inventario') || hasPermission('inventario-view');

  // Si no tiene permiso para ver inventario
  if (!canView) {
    return (
      <div style={styles.unauthorizedContainer}>
        <Ban size={48} style={{ marginBottom: 16, color: '#ef4444' }} />
        <h2 style={styles.unauthorizedTitle}>Acceso denegado</h2>
        <p style={styles.unauthorizedText}>No tienes permisos para ver el inventario.</p>
        <p style={styles.unauthorizedSubtext}>Contacta al administrador si necesitas acceso.</p>
      </div>
    );
  }

  const totalProducts = products.length;
  const totalInventoryCost = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
  const outOfStock = products.filter(p => p.stock === 0).length;

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'outofstock') {
      return matchesSearch && product.stock === 0;
    }
    return matchesSearch;
  });

  const handleAddProduct = async () => {
    if (!canEdit) { alert('No tienes permisos para crear productos'); return; }
    if (!form.name || !form.price || !form.cost) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }
    await createProduct({ ...form, min_stock: 5, barcode: '' });
    setShowModal(false);
    setForm(emptyForm());
  };

  const handleEditProduct = (product: any) => {
    if (!canEdit) { alert('No tienes permisos para editar productos'); return; }
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      price: product.price || 0,
      cost: product.cost || 0,
      stock: product.stock || 0,
      category: product.category || 'Camisas',
      size: product.size || 'M',
      color: product.color || '',
    });
    setShowModal(true);
  };

  const renderModalTitle = () => {
    if (editingId) return React.createElement('span', null, React.createElement(Edit, { size: 18, style: { marginRight: 8, verticalAlign: 'middle' } }), ' Editar producto');
    return React.createElement('span', null, React.createElement(Package, { size: 18, style: { marginRight: 8, verticalAlign: 'middle' } }), ' Crear producto');
  };

  const handleUpdateProduct = async () => {
    if (!editingId || !canEdit) return;
    await updateProduct(editingId, form);
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleDeleteProduct = async (id: number) => {
    if (!canEdit) { alert('No tienes permisos para eliminar productos'); return; }
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      await deleteProduct(id);
    }
  };

  const handleUpdateStock = async (id: number, newStock: number) => {
    if (!canEdit || newStock < 0) return;
    await updateStock(id, newStock);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFileName(file.name);
      setImportStatus(null);
    }
  };

  const handleImportProcess = async () => {
    if (!canEdit) return;

    const fileInput = fileInputRef.current;
    const file = fileInput?.files?.[0];
    if (!file) return;

    setImportStatus({ loading: true, message: 'Leyendo archivo...', success: false });

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];

      if (rows.length === 0) {
        setImportStatus({ loading: false, message: 'El archivo está vacío', success: false });
        return;
      }

      let imported = 0;
      let errors = 0;

      for (const row of rows) {
        const name = row['Nombre'] || row['nombre'] || row['NAME'] || '';
        const price = parseFloat(row['Precio'] || row['precio'] || row['PRICE'] || 0);
        const cost = parseFloat(row['Costo'] || row['costo'] || row['COST'] || 0);
        const stock = parseInt(row['Stock'] || row['stock'] || row['STOCK'] || 0);
        const category = row['Categoría'] || row['categoria'] || row['CATEGORY'] || 'General';
        const size = row['Talla'] || row['talla'] || row['SIZE'] || '';
        const color = row['Color'] || row['color'] || row['COLOR'] || '';

        if (!name) { errors++; continue; }

        try {
          await window.dajhoAPI.products.create({
            name: String(name),
            price: isNaN(price) ? 0 : price,
            cost: isNaN(cost) ? 0 : cost,
            stock: isNaN(stock) ? 0 : stock,
            category: String(category),
            size: String(size),
            color: String(color),
            barcode: '',
            min_stock: 5,
          });
          imported++;
        } catch {
          errors++;
        }

        setImportStatus({
          loading: true,
          message: `Procesados ${imported + errors} de ${rows.length}...`,
          success: false,
        });
      }

      setImportStatus({
        loading: false,
        message: `Importación completa: ${imported} productos agregados${errors > 0 ? `, ${errors} errores` : ''}`,
        success: errors === 0,
      });

      await loadProducts();
    } catch (err) {
      console.error('Error al importar Excel:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setImportStatus({
        loading: false,
        message: `Error: ${errorMsg}`,
        success: false,
      });
    }
  };

  const handleCloseImport = () => {
    setShowImportModal(false);
    setImportFileName('');
    setImportStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Exportar a Excel
  const handleExport = async () => {
    if (!canEdit) {
      alert('No tienes permisos para exportar productos');
      return;
    }

    try {
      const data = products.map(p => ({
        Nombre: p.name,
        Precio: p.price,
        Costo: p.cost,
        Stock: p.stock,
        'Categoría': p.category,
        Talla: p.size || '',
        Color: p.color || '',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');

      // Ajustar ancho de columnas
      ws['!cols'] = [
        { wch: 30 }, { wch: 12 }, { wch: 12 },
        { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
      ];

      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
      const saved = await window.dajhoAPI.file.saveDialog('productos.xlsx', buffer);

      if (saved) {
        alert('Productos exportados correctamente');
      }
    } catch (err) {
      alert('Error al exportar productos');
      console.error(err);
    }
  };

  // Renderizar acciones según rol
  const renderActions = (product: Product) => {
    if (!canEdit) {
      return <span style={styles.readOnlyText}><Search size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Solo lectura</span>;
    }
    return (
      <div style={styles.actionButtonsCell}>
        <button
          onClick={() => handleEditProduct(product)}
          style={styles.editButton}
          title="Editar producto"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={() => handleDeleteProduct(product.id)}
          style={styles.deleteButton}
          title="Eliminar producto"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}><Package size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Inventario</h1>

      {/* Estadísticas */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{totalProducts}</div>
          <div style={styles.statLabel}>Total de referencias</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>${totalInventoryCost.toFixed(2)}</div>
          <div style={styles.statLabel}>Costo total de inventario</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{outOfStock}</div>
          <div style={styles.statLabel}>Sin stock</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{canEdit ? 'Propietario' : 'Solo lectura'}</div>
          <div style={styles.statLabel}>Tu rol</div>
        </div>
      </div>

      {/* Filtros y acciones */}
      <div style={styles.actions}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.filterGroup}>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...styles.filterButton,
              ...(filter === 'all' ? styles.filterButtonActive : {})
            }}
          >
            Ver todos
          </button>
          <button
            onClick={() => setFilter('outofstock')}
            style={{
              ...styles.filterButton,
              ...(filter === 'outofstock' ? styles.filterButtonActive : {})
            }}
          >
            Sin stock
          </button>
        </div>

        {/* Botones de acción - solo visibles para admin */}
        {canEdit && (
          <div style={styles.actionButtons}>
            <button
              onClick={() => setShowImportModal(true)}
              style={styles.importButton}
            >
              <Upload size={16} style={{ marginRight: 6 }} /> Subir desde Excel
            </button>
            <button
              onClick={handleExport}
              style={styles.exportButton}
            >
              <Download size={16} style={{ marginRight: 6 }} /> Exportar
            </button>
            <button
              onClick={() => { setEditingId(null); setForm(emptyForm()); setShowModal(true); }}
              style={styles.addButton}
            >
              <Plus size={16} style={{ marginRight: 6 }} /> Crear manualmente
            </button>
          </div>
        )}
      </div>

      {/* Tabla de productos */}
      {filteredProducts.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Aún no tienes productos creados</p>
          {canEdit ? (
            <div style={styles.emptyActions}>
              <button
                onClick={() => { setEditingId(null); setForm(emptyForm()); setShowModal(true); }}
                style={styles.emptyButton}
              >
                Crear manualmente
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                style={styles.emptyButtonSecondary}
              >
                Subir productos desde excel
              </button>
            </div>
          ) : (
            <p style={styles.emptySubtext}>No hay productos disponibles en el inventario.</p>
          )}
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <div style={styles.table}>
            <div style={styles.tableRowHeader}>
              <div style={styles.tableCell}>Nombre</div>
              <div style={styles.tableCell}>Categoría</div>
              <div style={styles.tableCell}>Precio</div>
              <div style={styles.tableCell}>Costo</div>
              <div style={styles.tableCell}>Stock</div>
              <div style={styles.tableCell}>Talla</div>
              <div style={styles.tableCell}>Color</div>
              <div style={styles.tableCell}>Acciones</div>
            </div>
            {filteredProducts.map((product) => (
              <div key={product.id} style={styles.tableRow}>
                <div style={styles.tableCell}>
                  <div style={styles.productName}>{product.name}</div>
                </div>
                <div style={styles.tableCell}>
                  <span style={styles.categoryBadge}>{product.category}</span>
                </div>
                <div style={styles.tableCell}>${product.price.toFixed(2)}</div>
                <div style={styles.tableCell}>${product.cost.toFixed(2)}</div>
                <div style={styles.tableCell}>
                  {canEdit ? (
                    <div style={styles.stockControls}>
                      <button
                        onClick={() => handleUpdateStock(product.id, product.stock - 1)}
                        style={styles.stockButton}
                      >
                        -
                      </button>
                      <span style={{
                        ...styles.stockValue,
                        ...(product.stock === 0 ? styles.stockValueEmpty : {})
                      }}>
                        {product.stock}
                      </span>
                      <button
                        onClick={() => handleUpdateStock(product.id, product.stock + 1)}
                        style={styles.stockButton}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span style={{
                      ...styles.stockValue,
                      ...(product.stock === 0 ? styles.stockValueEmpty : {})
                    }}>
                      {product.stock}
                    </span>
                  )}
                </div>
                <div style={styles.tableCell}>{product.size || '-'}</div>
                <div style={styles.tableCell}>
                  <span style={styles.colorDot}></span>
                  {product.color || '-'}
                </div>
                <div style={styles.tableCell}>
                  {renderActions(product)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para crear/editar producto (solo admin) */}
      {showModal && canEdit && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {renderModalTitle()}
            </h2>
            
            <div style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej. Camisa Blanca"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Categoría *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={styles.formSelect}
                  >
                    {categories.length === 0 ? (
                      <option value="General">General</option>
                    ) : (
                      categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Precio ($) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.price || ''}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    style={styles.formInput}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Costo ($) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.cost || ''}
                    onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })}
                    style={styles.formInput}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Stock *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.stock || ''}
                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                    style={styles.formInput}
                    min="0"
                    step="1"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Talla</label>
                  <select
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    style={styles.formSelect}
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="32">32</option>
                    <option value="34">34</option>
                    <option value="36">36</option>
                    <option value="38">38</option>
                    <option value="40">40</option>
                    <option value="Único">Único</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Color</label>
                <input
                  type="text"
                  placeholder="Ej. Blanco, Azul, Negro"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  onClick={() => { setShowModal(false); setEditingId(null); }}
                  style={styles.modalCancel}
                >
                  Cancelar
                </button>
                <button
                  onClick={editingId ? handleUpdateProduct : handleAddProduct}
                  style={styles.modalSubmit}
                >
                  {editingId ? 'Actualizar producto' : 'Guardar producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para importar desde Excel */}
      {showImportModal && canEdit && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}><Upload size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Subir productos desde Excel</h2>
            
            <div style={styles.importContent}>
              <p style={styles.importText}>
                Sube un archivo Excel con tus productos. El archivo debe tener las siguientes columnas:
              </p>
              <div style={styles.importColumns}>
                <span style={styles.importColumn}>Nombre</span>
                <span style={styles.importColumn}>Precio</span>
                <span style={styles.importColumn}>Costo</span>
                <span style={styles.importColumn}>Stock</span>
                <span style={styles.importColumn}>Categoría</span>
                <span style={styles.importColumn}>Talla</span>
                <span style={styles.importColumn}>Color</span>
              </div>
              
              {importStatus ? (
                <div style={{
                  ...styles.importArea,
                  backgroundColor: importStatus.success ? '#e8f5e9' : importStatus.loading ? '#fff3e0' : '#ffebee',
                }}>
                  <p style={{
                    ...styles.importText,
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: importStatus.success ? '#2e7d32' : importStatus.loading ? '#e65100' : '#c62828',
                  }}>
                    {importStatus.message}
                  </p>
                  {importStatus.loading && (
                    <p style={styles.importText}>Por favor espera...</p>
                  )}
                  {!importStatus.loading && (
                    <button onClick={handleCloseImport} style={styles.modalSubmit}>
                      Cerrar
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div style={styles.importArea}>
                    <FileText size={40} color={colors.textSecondary} style={{ marginBottom: 8 }} />
                    <p style={styles.importText}>
                      {importFileName ? `Archivo seleccionado: ${importFileName}` : 'Selecciona un archivo Excel (.xlsx o .xls)'}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      style={styles.importFileInput}
                      onChange={handleFileSelect}
                    />
                  </div>

                  <div style={styles.modalActions}>
                    <button onClick={handleCloseImport} style={styles.modalCancel}>
                      Cancelar
                    </button>
                    <button
                      onClick={handleImportProcess}
                      style={{
                        ...styles.modalSubmit,
                        opacity: importFileName ? 1 : 0.5,
                      }}
                      disabled={!importFileName}
                    >
                      <Download size={16} style={{ marginRight: 6 }} /> Importar
                    </button>
                  </div>
                </>
              )}
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
  actionButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  importButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f4f9',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#1a2332',
    transition: 'all 0.3s',
  },
  exportButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f4f9',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#1a2332',
    transition: 'all 0.3s',
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
    gridTemplateColumns: '150px 120px 80px 80px 100px 70px 100px 120px',
    backgroundColor: '#f8faff',
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '8px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '150px 120px 80px 80px 100px 70px 100px 120px',
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
  productName: {
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: '#f0f4f9',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#1a2332',
  },
  stockControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stockButton: {
    width: '24px',
    height: '24px',
    backgroundColor: '#f0f4f9',
    border: '1px solid #d0d5dd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
  },
  stockValue: {
    fontSize: '14px',
    fontWeight: '600',
    minWidth: '24px',
    textAlign: 'center',
  },
  stockValueEmpty: {
    color: '#e74c3c',
  },
  colorDot: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#000000',
    marginRight: '4px',
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
    padding: '60px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e0e4e8',
  },
  emptyText: {
    color: '#6b7a8a',
    fontSize: '18px',
    marginBottom: '24px',
  },
  emptySubtext: {
    color: '#6b7a8a',
    fontSize: '16px',
  },
  emptyActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  emptyButton: {
    padding: '12px 24px',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  emptyButtonSecondary: {
    padding: '12px 24px',
    backgroundColor: '#f0f4f9',
    color: '#1a2332',
    border: '1px solid #d0d5dd',
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
  importContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  importText: {
    fontSize: '14px',
    color: '#6b7a8a',
    lineHeight: 1.5,
  },
  importColumns: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    padding: '12px',
    backgroundColor: '#f8faff',
    borderRadius: '8px',
  },
  importColumn: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a2332',
    padding: '4px 12px',
    backgroundColor: '#e0e4e8',
    borderRadius: '4px',
  },
  importArea: {
    border: '2px dashed #d0d5dd',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    position: 'relative',
    transition: 'border-color 0.3s',
  },
  importIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  importFileInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
  },
  unauthorizedContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '80vh',
    backgroundColor: '#f5f7fa',
    padding: '20px',
  },
  unauthorizedIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  unauthorizedTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '8px',
  },
  unauthorizedText: {
    fontSize: '16px',
    color: '#6b7a8a',
    textAlign: 'center',
  },
  unauthorizedSubtext: {
    fontSize: '14px',
    color: '#6b7a8a',
    textAlign: 'center',
    marginTop: '4px',
  },
};

export default Inventory;