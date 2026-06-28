import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCategories, Category } from '../hooks/useDB';
import { AlertCircle, RefreshCw, RotateCcw, Folder, Plus, Search, Edit, Trash2 } from 'lucide-react';

export const Categories = () => {
  const { colors } = useTheme();
  const { categories, loading, error, loadCategories, createCategory, updateCategory, deleteCategory } = useCategories();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setShowModal(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('El nombre de la categoría es obligatorio');
      return;
    }
    if (editingId) {
      await updateCategory(editingId, { name: name.trim() });
    } else {
      await createCategory({ name: name.trim() });
    }
    setShowModal(false);
    setName('');
    setEditingId(null);
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la categoría "${name}"?\n\nLos productos que la usan no se verán afectados.`)) {
      await deleteCategory(id);
    }
  };

  const getModalTitle = () => {
    if (editingId) {
      return React.createElement('span', null, React.createElement(Edit, { size: 18, style: { marginRight: 8, verticalAlign: 'middle' } }), ' Editar categoria');
    }
    return React.createElement('span', null, React.createElement(Plus, { size: 18, style: { marginRight: 8, verticalAlign: 'middle' } }), ' Nueva categoria');
  };

  const styles = {
    container: {
      padding: '20px',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    } as React.CSSProperties,
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: colors.textHeading,
      margin: 0,
    } as React.CSSProperties,
    addButton: {
      padding: '10px 20px',
      backgroundColor: colors.buttonPrimary,
      color: colors.textOnPrimary,
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    } as React.CSSProperties,
    searchInput: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: colors.bgInput,
      color: colors.textHeading,
      border: `1px solid ${colors.borderInput}`,
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      marginBottom: '20px',
      boxSizing: 'border-box' as const,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: '12px',
    } as React.CSSProperties,
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: '10px',
      padding: '16px',
      border: `1px solid ${colors.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'box-shadow 0.2s',
    } as React.CSSProperties,
    cardName: {
      fontSize: '15px',
      fontWeight: '500',
      color: colors.textHeading,
    } as React.CSSProperties,
    cardActions: {
      display: 'flex',
      gap: '6px',
    } as React.CSSProperties,
    editBtn: {
      padding: '6px 10px',
      border: `1px solid ${colors.borderInput}`,
      borderRadius: '6px',
      backgroundColor: colors.bgTertiary,
      color: colors.textHeading,
      cursor: 'pointer',
      fontSize: '13px',
    } as React.CSSProperties,
    deleteBtn: {
      padding: '6px 10px',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      cursor: 'pointer',
      fontSize: '13px',
    } as React.CSSProperties,
    modalOverlay: {
      position: 'fixed' as const,
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: colors.bgCard,
      borderRadius: '12px',
      padding: '24px',
      width: '400px',
      maxWidth: '90vw',
      border: `1px solid ${colors.border}`,
    } as React.CSSProperties,
    modalTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: colors.textHeading,
      marginBottom: '20px',
      margin: 0,
    } as React.CSSProperties,
    input: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: colors.bgInput,
      color: colors.textHeading,
      border: `1px solid ${colors.borderInput}`,
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      marginTop: '16px',
      marginBottom: '20px',
      boxSizing: 'border-box' as const,
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
    } as React.CSSProperties,
    cancelBtn: {
      padding: '10px 20px',
      backgroundColor: colors.buttonSecondary,
      color: colors.textHeading,
      border: `1px solid ${colors.buttonSecondaryBorder}`,
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
    } as React.CSSProperties,
    saveBtn: {
      padding: '10px 20px',
      backgroundColor: colors.buttonPrimary,
      color: colors.textOnPrimary,
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    } as React.CSSProperties,
    emptyState: {
      textAlign: 'center' as const,
      padding: '60px 20px',
      color: colors.textSecondary,
    } as React.CSSProperties,
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '12px',
    } as React.CSSProperties,
    emptyText: {
      fontSize: '16px',
      marginBottom: '16px',
    } as React.CSSProperties,
    loadingText: {
      textAlign: 'center' as const,
      padding: '40px',
      color: colors.textSecondary,
      fontSize: '14px',
    } as React.CSSProperties,
  };

  if (loading) {
    return <div style={styles.loadingText}>Cargando categorías...</div>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#ef4444' }}>Error al cargar categorías</p>
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px', maxWidth: '400px', margin: '0 auto 16px' }}>{error}</p>
          <p style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '16px' }}>
            Si el error persiste, cierra la app completamente y vuelve a abrirla.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={loadCategories} style={{
              padding: '10px 20px',
              backgroundColor: colors.buttonPrimary,
              color: colors.textOnPrimary,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}>
              <RefreshCw size={16} style={{ marginRight: 6 }} /> Reintentar
            </button>
            <button onClick={() => window.location.reload()} style={{
              padding: '10px 20px',
              backgroundColor: colors.buttonSecondary,
              color: colors.textHeading,
              border: `1px solid ${colors.buttonSecondaryBorder}`,
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}>
              <RotateCcw size={16} style={{ marginRight: 6 }} /> Recargar app
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}><Folder size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Categorías</h1>
        <button onClick={handleOpenCreate} style={styles.addButton}>
          <Plus size={18} style={{ marginRight: 6 }} /> Nueva categoría
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar categorías..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchInput}
      />

      {filteredCategories.length === 0 ? (
        <div style={styles.emptyState}>
          <Folder size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <p style={styles.emptyText}>
            {searchTerm ? 'No se encontraron categorías' : 'Aún no tienes categorías creadas'}
          </p>
          {!searchTerm && (
            <button onClick={handleOpenCreate} style={styles.addButton}>
              <Plus size={18} style={{ marginRight: 6 }} /> Crear primera categoría
            </button>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredCategories.map(cat => (
            <div key={cat.id} style={styles.card}>
              <span style={styles.cardName}>{cat.name}</span>
              <div style={styles.cardActions}>
                <button
                  onClick={() => handleOpenEdit(cat)}
                  style={styles.editBtn}
                  title="Editar"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  style={styles.deleteBtn}
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de creación/edición */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {getModalTitle()}
            </h2>
            <input
              type="text"
              placeholder="Nombre de la categoría"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            />
            <div style={styles.modalActions}>
              <button onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                Cancelar
              </button>
              <button onClick={handleSave} style={styles.saveBtn}>
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
