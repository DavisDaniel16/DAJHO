import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================
// IMPORTAR BASE DE DATOS Y HANDLERS
// ============================================
import './database.js';
import './ipc-handlers.js';

// ============================================
// CONFIGURACIÓN DE MÓDULOS ES
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// VARIABLES GLOBALES
// ============================================
let mainWindow: BrowserWindow | null = null;

// ============================================
// CREAR VENTANA PRINCIPAL
// ============================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'DAJHO - Gestión de tu negocio',
    icon: path.join(__dirname, '../../build/icon.ico'), // Opcional
  });

  // ============================================
  // CARGAR LA APLICACIÓN
  // ============================================
  if (process.env.NODE_ENV === 'development') {
    // Modo desarrollo: conectar a Vite
    mainWindow.loadURL('http://localhost:5173');
    // Presiona F12 para abrir DevTools si las necesitas
    // mainWindow.webContents.openDevTools();
  } else {
    // Modo producción: cargar archivo estático
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // ============================================
  // MANEJAR CIERRE DE VENTANA
  // ============================================
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // ============================================
  // MANEJAR EVENTOS DE CARGA
  // ============================================
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ DAJHO cargado correctamente');
  });

  mainWindow.webContents.on('did-fail-load', (_event, _errorCode, errorDescription) => {
    console.error('❌ Error al cargar DAJHO:', errorDescription);
  });
}

// ============================================
// INICIAR APLICACIÓN
// ============================================
app.whenReady().then(() => {
  console.log('🚀 DAJHO iniciando...');
  createWindow();

  // ============================================
  // RE-CREAR VENTANA EN macOS
  // ============================================
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// ============================================
// CERRAR APLICACIÓN
// ============================================
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================
// MANEJAR ERRORES NO CAPTURADOS
// ============================================
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});