import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { applyThemeToStyles } from '../styles/theme';
import { PasswordConfirm } from '../components/PasswordConfirm';
import { Store, Settings as SettingsIcon, Package, Database, Shield, Sun, Moon, AlertTriangle, Trash2, Download, Upload, RefreshCw, HardDrive, Wrench, FileText, Save } from 'lucide-react';

// Definir tipos
interface BusinessInfo {
  name: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  ruc: string;
  logo?: string;
}

interface Preferences {
  currency: string;
  language: string;
  darkMode: boolean;
  receiptFooter: string;
  lowStockAlert: number;
  ivaPorcentaje: number;
}

interface Backup {
  lastBackup: string;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

const defaultBusinessInfo: BusinessInfo = {
  name: 'Nombre de tu negocio',
  owner: 'Tu nombre',
  phone: 'Tu número de celular',
  email: 'tuemail@ejemplo.com',
  address: 'Tu dirección',
  city: 'Tu ciudad',
  ruc: 'Tu RUC/Cédula',
};

const defaultPreferences: Preferences = {
  currency: 'USD',
  language: 'es',
  darkMode: false,
  receiptFooter: '¡Gracias por tu compra!',
  lowStockAlert: 5,
  ivaPorcentaje: 12,
};

const defaultBackup: Backup = {
  lastBackup: 'Nunca',
  autoBackup: true,
  backupFrequency: 'weekly',
};

export const Settings = () => {
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const styles = useMemo(() => applyThemeToStyles(baseStyles, colors, isDarkMode), [colors, isDarkMode]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(defaultBusinessInfo);
  const [preferences, setPreferences] = useState<Preferences>({ ...defaultPreferences, darkMode: isDarkMode });
  const [backup, setBackup] = useState<Backup>(defaultBackup);
  const [activeTab, setActiveTab] = useState<'business' | 'preferences' | 'backup' | 'database'>('business');
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  const [dbPath, setDbPath] = useState('Cargando...');

  useEffect(() => {
    const loadDbPath = async () => {
      try {
        const path = await window.dajhoAPI.system.getDbPath();
        setDbPath(path || 'No disponible');
      } catch (err) {
        console.error('Error al cargar ruta de BD:', err);
        setDbPath('No disponible');
      }
    };
    loadDbPath();
  }, []);

  // Cargar info del backup al activar la pestaña
  useEffect(() => {
    if (activeTab === 'backup') {
      const loadBackupInfo = async () => {
        try {
          const info = await window.dajhoAPI.backup.info();
          if (info.exists) {
            const sizeKB = (info.size / 1024).toFixed(1);
            const mainSizeKB = (info.mainDbSize / 1024).toFixed(1);
            setBackup(prev => ({
              ...prev,
              lastBackup: `${info.modified} (${sizeKB} KB)`,
            }));
          }
        } catch (err) {
          console.error('Error al cargar info de backup:', err);
        }
      };
      loadBackupInfo();
    }
  }, [activeTab]);

  // Cargar datos del negocio desde la BD al iniciar
  useEffect(() => {
    const loadBusiness = async () => {
      try {
        // Cargar IVA desde settings
        const ivaVal = await window.dajhoAPI.settings.get('iva_porcentaje');
        if (ivaVal !== null) {
          setPreferences(prev => ({ ...prev, ivaPorcentaje: parseFloat(ivaVal) }));
        }
        // Cargar idioma desde settings
        const langVal = await window.dajhoAPI.settings.get('app_language');
        if (langVal !== null) {
          setPreferences(prev => ({ ...prev, language: langVal }));
        }
        const data = await window.dajhoAPI.business.getFirst();
        if (data) {
          setBusinessInfo({
            name: data.name || defaultBusinessInfo.name,
            owner: data.owner || defaultBusinessInfo.owner,
            phone: data.phone || defaultBusinessInfo.phone,
            email: data.email || defaultBusinessInfo.email,
            address: data.address || defaultBusinessInfo.address,
            city: data.city || defaultBusinessInfo.city,
            ruc: data.ruc || defaultBusinessInfo.ruc,
          });
        }
      } catch (err) {
        console.error('Error al cargar datos del negocio:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBusiness();
  }, []);

  // Guardar configuración del negocio en la BD
  const handleSave = async () => {
    setPendingAction(() => async () => {
      try {
        await window.dajhoAPI.business.update(businessInfo);
        await window.dajhoAPI.settings.set('iva_porcentaje', String(preferences.ivaPorcentaje));
        await window.dajhoAPI.settings.set('app_language', preferences.language);
        setShowSaveAlert(true);
        const langChanged = preferences.language !== 'es';
        setSaveMessage(langChanged
          ? 'Configuración guardada. Reinicia la aplicación para aplicar el cambio de idioma.'
          : 'Configuración guardada exitosamente');
        setTimeout(() => setShowSaveAlert(false), 4000);
      } catch (err) {
        console.error('Error al guardar:', err);
        alert('Error al guardar la configuración');
      }
    });
  };

  // Realizar backup (copia física del archivo database.db)
  const handleBackup = async () => {
    try {
      const result = await window.dajhoAPI.backup.manual();
      if (result.success) {
        setShowSaveAlert(true);
        setSaveMessage('Backup físico realizado exitosamente');
        setBackup({
          ...backup,
          lastBackup: new Date().toLocaleString('es-ES'),
        });
      } else {
        alert('Error al crear backup: ' + (result.error || 'Desconocido'));
      }
    } catch (err) {
      alert('Error al crear backup');
      console.error(err);
    }
    setTimeout(() => setShowSaveAlert(false), 3000);
  };

  // Restaurar backup (requiere reinicio de la app)
  const handleRestore = async () => {
    if (window.confirm('¿Estás seguro de que quieres restaurar desde el backup? Esto SOBRESCRIBIRÁ todos los datos actuales. La aplicación se cerrará después de restaurar.')) {
      try {
        const result = await window.dajhoAPI.backup.restore();
        if (result.success) {
          alert((result.message || 'Backup restaurado. La aplicación se cerrará.'));
          window.close();
        } else {
          alert('Error al restaurar: ' + (result.error || 'Desconocido'));
        }
      } catch (err) {
        alert('Error al restaurar backup');
        console.error(err);
      }
    }
  };

  // Exportar datos
  const handleExport = () => {
    const data = {
      business: businessInfo,
      preferences: preferences,
      backup: backup,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dajho-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowSaveAlert(true);
    setSaveMessage('Datos exportados exitosamente');
    setTimeout(() => {
      setShowSaveAlert(false);
    }, 3000);
  };

  // Importar datos
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.business) setBusinessInfo(data.business);
        if (data.preferences) setPreferences(data.preferences);
        setShowSaveAlert(true);
        setSaveMessage('Datos importados exitosamente');
        setTimeout(() => {
          setShowSaveAlert(false);
        }, 3000);
      } catch (error) {
        alert('Error al importar el archivo. Asegúrate de que sea un backup válido.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Resetear datos
  const handleReset = () => {
    if (window.confirm('¿Estás seguro de que quieres resetear todos los datos? Esta acción no se puede deshacer.')) {
      if (window.confirm('Confirmación final: ¿Resetear todos los datos?')) {
        // Aquí iría la lógica para resetear la base de datos
        setShowSaveAlert(true);
        setSaveMessage('Todos los datos han sido reseteados');
        setTimeout(() => {
          setShowSaveAlert(false);
        }, 3000);
      }
    }
  };

  // Renderizar pestaña de negocio
  const renderBusinessTab = () => (
    <div style={styles.tabContent}>
      <h3 style={styles.tabTitle}><Store size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Información del negocio</h3>
      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Nombre del negocio</label>
          <input
            type="text"
            value={businessInfo.name}
            onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
            style={styles.formInput}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Propietario</label>
          <input
            type="text"
            value={businessInfo.owner}
            onChange={(e) => setBusinessInfo({ ...businessInfo, owner: e.target.value })}
            style={styles.formInput}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Teléfono</label>
          <input
            type="text"
            value={businessInfo.phone}
            onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
            style={styles.formInput}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Email</label>
          <input
            type="email"
            value={businessInfo.email}
            onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
            style={styles.formInput}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Dirección</label>
          <input
            type="text"
            value={businessInfo.address}
            onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
            style={styles.formInput}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Ciudad</label>
          <input
            type="text"
            value={businessInfo.city}
            onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
            style={styles.formInput}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>RUC/Cédula</label>
          <input
            type="text"
            value={businessInfo.ruc}
            onChange={(e) => setBusinessInfo({ ...businessInfo, ruc: e.target.value })}
            style={styles.formInput}
          />
        </div>
      </div>
    </div>
  );

  // Renderizar pestaña de preferencias
  const renderPreferencesTab = () => (
    <div style={styles.tabContent}>
      <h3 style={styles.tabTitle}><SettingsIcon size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Preferencias</h3>
      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Moneda</label>
          <select
            value={preferences.currency}
            onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
            style={styles.formSelect}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="COP">COP ($)</option>
            <option value="MXN">MXN ($)</option>
            <option value="ARS">ARS ($)</option>
          </select>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Idioma</label>
          <select
            value={preferences.language}
            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
            style={styles.formSelect}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
          <p style={{ fontSize: '11px', color: '#6b7a8a', margin: '4px 0 0 0' }}>
            El cambio de idioma se aplica al reiniciar la aplicación
          </p>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Modo oscuro</label>
          <div style={styles.toggleContainer}>
            <button
              onClick={() => {
                toggleDarkMode();
                setPreferences({ ...preferences, darkMode: !isDarkMode });
              }}
              style={{
                ...styles.toggleButton,
                ...(isDarkMode ? styles.toggleButtonActive : {}),
              }}
            >
              {isDarkMode ? 'Activo' : 'Inactivo'}
            </button>
          </div>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>IVA (%)</label>
          <input
            type="number"
            value={preferences.ivaPorcentaje}
            onChange={(e) => setPreferences({ ...preferences, ivaPorcentaje: parseFloat(e.target.value) || 0 })}
            style={styles.formInput}
            min="0"
            max="100"
            step="0.5"
          />
          <span style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, display: 'block' }}>
            Porcentaje de IVA que se aplicará en las ventas
          </span>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Alerta de stock bajo</label>
          <input
            type="number"
            value={preferences.lowStockAlert}
            onChange={(e) => setPreferences({ ...preferences, lowStockAlert: parseInt(e.target.value) || 0 })}
            style={styles.formInput}
            min="0"
            step="1"
          />
          <span style={styles.fieldHint}>Número de unidades para alertar stock bajo</span>
        </div>
        <div style={styles.formGroupFull}>
          <label style={styles.formLabel}>Pie de página de tickets</label>
          <textarea
            value={preferences.receiptFooter}
            onChange={(e) => setPreferences({ ...preferences, receiptFooter: e.target.value })}
            style={styles.formTextarea}
            rows={3}
            placeholder="Mensaje que aparecerá en los tickets de venta"
          />
        </div>
      </div>
    </div>
  );

  // Renderizar pestaña de backup
  const renderBackupTab = () => (
    <div style={styles.tabContent}>
      <h3 style={styles.tabTitle}><Package size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Backup y Restauración</h3>
      
      <div style={styles.backupInfo}>
        <div style={styles.backupItem}>
          <span style={styles.backupLabel}>Último backup:</span>
          <span style={styles.backupValue}>{backup.lastBackup || 'Nunca'}</span>
        </div>
        <div style={styles.backupItem}>
          <span style={styles.backupLabel}>Backup automático:</span>
          <span style={styles.backupValue}>
            <button
              onClick={() => setBackup({ ...backup, autoBackup: !backup.autoBackup })}
              style={{
                ...styles.toggleButton,
                ...(backup.autoBackup ? styles.toggleButtonActive : {}),
              }}
            >
              {backup.autoBackup ? 'Activado' : 'Desactivado'}
            </button>
          </span>
        </div>
        {backup.autoBackup && (
          <div style={styles.backupItem}>
            <span style={styles.backupLabel}>Frecuencia:</span>
            <select
              value={backup.backupFrequency}
              onChange={(e) => setBackup({ ...backup, backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
              style={styles.formSelectSmall}
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>
        )}
      </div>

      <div style={styles.backupActions}>
        <button onClick={handleBackup} style={styles.backupButton}>
          <Package size={16} style={{ marginRight: 6 }} /> Crear backup ahora
        </button>
        <button onClick={handleRestore} style={styles.restoreButton}>
          <RefreshCw size={16} style={{ marginRight: 6 }} /> Restaurar backup
        </button>
        <button onClick={handleExport} style={styles.exportButton}>
          <Upload size={16} style={{ marginRight: 6 }} /> Exportar datos
        </button>
        <div style={styles.importWrapper}>
          <button style={styles.importButton}>
            <Download size={16} style={{ marginRight: 6 }} /> Importar datos
          </button>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={styles.importFileInput}
          />
        </div>
      </div>

      <div style={styles.dangerZone}>
        <h4 style={styles.dangerTitle}><AlertTriangle size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Zona peligrosa</h4>
        <p style={styles.dangerText}>Esta acción eliminará todos los datos de la aplicación.</p>
        <button onClick={handleReset} style={styles.dangerButton}>
          <Trash2 size={16} style={{ marginRight: 6 }} /> Resetear todos los datos
        </button>
      </div>
    </div>
  );

  // Renderizar pestaña de base de datos
  const renderDatabaseTab = () => (
    <div style={styles.tabContent}>
      <h3 style={styles.tabTitle}><Database size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Base de datos</h3>
      
      <div style={styles.dbInfo}>
        <div style={styles.dbItem}>
          <span style={styles.dbLabel}>Tamaño de la base de datos:</span>
          <span style={styles.dbValue}>~ 2.4 MB</span>
        </div>
        <div style={styles.dbItem}>
          <span style={styles.dbLabel}>Total de productos:</span>
          <span style={styles.dbValue}>45</span>
        </div>
        <div style={styles.dbItem}>
          <span style={styles.dbLabel}>Total de clientes:</span>
          <span style={styles.dbValue}>28</span>
        </div>
        <div style={styles.dbItem}>
          <span style={styles.dbLabel}>Total de proveedores:</span>
          <span style={styles.dbValue}>8</span>
        </div>
        <div style={styles.dbItem}>
          <span style={styles.dbLabel}>Total de ventas:</span>
          <span style={styles.dbValue}>156</span>
        </div>
        <div style={styles.dbItem}>
          <span style={styles.dbLabel}>Última venta:</span>
          <span style={styles.dbValue}>22/06/2026 15:30</span>
        </div>
      </div>

      <div style={styles.dbActions}>
        <button style={styles.dbOptimizeButton}>
          <Wrench size={16} style={{ marginRight: 6 }} /> Optimizar base de datos
        </button>
        <button style={styles.dbVacuumButton}>
          <HardDrive size={16} style={{ marginRight: 6 }} /> Vaciar base de datos (limpiar espacio)
        </button>
      </div>

      <div style={styles.dbLocation}>
        <p style={styles.dbLocationText}>
          <FileText size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Ubicación de la base de datos: <br />
          <code style={styles.dbLocationCode}>{dbPath}</code>
        </p>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}><SettingsIcon size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Configuraciones</h1>

      {/* Alertas */}
      {showSaveAlert && (
        <div style={styles.saveAlert}>
          <span style={styles.saveAlertText}>{saveMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('business')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'business' ? styles.tabButtonActive : {}),
          }}
        >
          <Store size={16} style={{ marginRight: 6 }} /> Negocio
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'preferences' ? styles.tabButtonActive : {}),
          }}
        >
          <SettingsIcon size={16} style={{ marginRight: 6 }} /> Preferencias
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'backup' ? styles.tabButtonActive : {}),
          }}
        >
          <Package size={16} style={{ marginRight: 6 }} /> Backup
        </button>
        <button
          onClick={() => setActiveTab('database')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'database' ? styles.tabButtonActive : {}),
          }}
        >
          <Database size={16} style={{ marginRight: 6 }} /> Base de datos
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div style={styles.tabPanel}>
        {activeTab === 'business' && renderBusinessTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
        {activeTab === 'backup' && renderBackupTab()}
        {activeTab === 'database' && renderDatabaseTab()}
      </div>

      {/* Botón Guardar */}
      {activeTab !== 'backup' && activeTab !== 'database' && (
        <div style={styles.saveContainer}>
          <button onClick={handleSave} style={styles.saveButton}>
            <Save size={16} style={{ marginRight: 6 }} /> Guardar configuración
          </button>
        </div>
      )}

      {pendingAction && (
        <PasswordConfirm
          title="Confirmar cambios"
          message="Ingresa la contraseña del propietario para guardar los cambios"
          onConfirm={pendingAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
};

// Estilos
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
  saveAlert: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #c3e6cb',
  },
  saveAlertText: {
    fontSize: '14px',
    fontWeight: '500',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: '2px solid #e0e4e8',
    paddingBottom: '0',
  },
  tabButton: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7a8a',
    transition: 'all 0.3s',
  },
  tabButtonActive: {
    color: '#1a2332',
    borderBottomColor: '#4a9eff',
  },
  tabPanel: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
    minHeight: '400px',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  tabTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '8px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    gridColumn: '1 / -1',
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
  formSelectSmall: {
    padding: '6px 12px',
    fontSize: '13px',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: '#ffffff',
  },
  fieldHint: {
    fontSize: '12px',
    color: '#6b7a8a',
    marginTop: '2px',
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  toggleButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f4f9',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#1a2332',
    transition: 'all 0.3s',
  },
  toggleButtonActive: {
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    borderColor: '#4a9eff',
  },
  saveContainer: {
    marginTop: '24px',
    textAlign: 'right',
  },
  saveButton: {
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
  backupInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f8faff',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  backupItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backupLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a2332',
    minWidth: '160px',
  },
  backupValue: {
    fontSize: '14px',
    color: '#1a2332',
  },
  backupActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '24px',
  },
  backupButton: {
    padding: '10px 20px',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  restoreButton: {
    padding: '10px 20px',
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  exportButton: {
    padding: '10px 20px',
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  importWrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  importButton: {
    padding: '10px 20px',
    backgroundColor: '#6b7a8a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
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
  dangerZone: {
    border: '2px solid #fee2e2',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: '#fef2f2',
    marginTop: '20px',
  },
  dangerTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: '8px',
  },
  dangerText: {
    fontSize: '14px',
    color: '#6b7a8a',
    marginBottom: '12px',
  },
  dangerButton: {
    padding: '10px 24px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.3s',
  },
  dbInfo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f8faff',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  dbItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #e0e4e8',
  },
  dbLabel: {
    fontSize: '14px',
    color: '#6b7a8a',
  },
  dbValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a2332',
  },
  dbActions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  dbOptimizeButton: {
    padding: '10px 20px',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  dbVacuumButton: {
    padding: '10px 20px',
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  dbLocation: {
    padding: '16px',
    backgroundColor: '#f0f4f9',
    borderRadius: '8px',
    marginTop: '12px',
  },
  dbLocationText: {
    fontSize: '14px',
    color: '#1a2332',
    margin: 0,
    lineHeight: 1.6,
  },
  dbLocationCode: {
    backgroundColor: '#1a2332',
    color: '#b0b8c4',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'monospace',
  },
};

export default Settings;