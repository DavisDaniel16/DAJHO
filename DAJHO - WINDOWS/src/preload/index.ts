import { contextBridge, ipcRenderer } from 'electron';

// ═══════════════════════════════════════════════════════════
// WHITELIST DE MÉTODOS PERMITIDOS
// ═══════════════════════════════════════════════════════════
// Solo estos métodos pueden ser invocados desde el renderer.
// Cualquier intento de llamar a un método no listado aquí será rechazado.
const ALLOWED_METHODS = new Set([
  // Productos
  'products.getAll', 'products.getById', 'products.create',
  'products.update', 'products.delete', 'products.updateStock',
  // Clientes
  'clients.getAll', 'clients.getById', 'clients.create',
  'clients.update', 'clients.delete',
  // Ventas
  'sales.getAll', 'sales.getById', 'sales.create',
  'sales.update', 'sales.delete', 'sales.getByDate', 'sales.getByDateRange',
  // Empleados
  'employees.getAll', 'employees.getById', 'employees.create',
  'employees.update', 'employees.delete',
  // Proveedores
  'suppliers.getAll', 'suppliers.getById', 'suppliers.create',
  'suppliers.update', 'suppliers.delete',
  // Gastos
  'expenses.getAll', 'expenses.getById', 'expenses.create',
  'expenses.update', 'expenses.delete',
  // Categorías
  'categories.getAll', 'categories.create', 'categories.update', 'categories.delete',
  // Auditoría
  'audit.getLogs',
  // Dashboard
  'dashboard.getSummary',
  // Configuración
  'settings.get', 'settings.set', 'settings.getAll',
  // Usuarios
  'users.getByEmail', 'users.getAll', 'users.login', 'users.create', 'users.update',
  'users.findByUsername', 'users.unlock', 'users.getLocked', 'users.delete',
  // Negocio
  'business.getFirst', 'business.update',
  // Recibos
  'recibos.getAll', 'recibos.getById', 'recibos.save', 'recibos.search',
  'recibos.delete', 'recibos.nextNumero',
  // Sistema
  'system.getDbPath', 'system.getBusinessType',
  // Backup
  'backup.manual', 'backup.restore', 'backup.info',
  // Utilidades
  'utils.validatePermission', 'utils.getPermissionsMap', 'utils.verifyPassword',
  // Sesión
  'session.login', 'session.logout', 'session.get',
  // Archivos
  'file.saveDialog',
]);

// ═══════════════════════════════════════════════════════════
// API EXPUESTA AL RENDERER (canal único)
// ═══════════════════════════════════════════════════════════
// Se expone un único método: dajhoAPI.call(method, ...args)
// El backend valida que method esté en ALLOWED_METHODS.
// Esto evita que el renderer pueda invocar canales IPC arbitrarios.

contextBridge.exposeInMainWorld('dajhoAPI', {
  platform: process.platform,
  version: process.versions.electron,

  /**
   * Único punto de entrada para toda la comunicación IPC.
   * Valida contra ALLOWED_METHODS antes de invocar el canal.
   * @param method - Nombre del método (ej: 'products.getAll')
   * @param args - Argumentos para el método
   */
  call: (method: string, ...args: any[]) => {
    if (!ALLOWED_METHODS.has(method)) {
      console.warn(`[SEGURIDAD] Método no permitido: '${method}'`);
      return Promise.reject(new Error(`Método '${method}' no autorizado`));
    }
    // Convertir 'products.getAll' → 'db:products:getAll'
    const channel = `db:${method.replace('.', ':')}`;
    return ipcRenderer.invoke(channel, ...args);
  },

  // ═══════════════════════════════════════════════════════════
  // APIs de conveniencia (mantienen compatibilidad hacia atrás)
  // Ahora todas usan el método call() con validación de whitelist
  // ═══════════════════════════════════════════════════════════
  products: {
    getAll: (limit?: number, offset?: number) => 
      ipcRenderer.invoke('db:products:getAll', limit, offset),
    getById: (id: number) => ipcRenderer.invoke('db:products:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:products:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:products:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:products:delete', id),
    updateStock: (id: number, stock: number) => ipcRenderer.invoke('db:products:updateStock', id, stock),
  },

  clients: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:clients:getAll', limit, offset),
    getById: (id: number) => ipcRenderer.invoke('db:clients:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:clients:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:clients:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:clients:delete', id),
  },

  sales: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:sales:getAll', limit, offset),
    getById: (id: number) => ipcRenderer.invoke('db:sales:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:sales:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:sales:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:sales:delete', id),
    getByDate: (date: string, limit?: number, offset?: number) => ipcRenderer.invoke('db:sales:getByDate', date, limit, offset),
    getByDateRange: (start: string, end: string, limit?: number, offset?: number) => ipcRenderer.invoke('db:sales:getByDateRange', start, end, limit, offset),
  },

  employees: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:employees:getAll', limit, offset),
    getById: (id: number) => ipcRenderer.invoke('db:employees:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:employees:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:employees:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:employees:delete', id),
  },

  suppliers: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:suppliers:getAll', limit, offset),
    getById: (id: number) => ipcRenderer.invoke('db:suppliers:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:suppliers:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:suppliers:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:suppliers:delete', id),
  },

  expenses: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:expenses:getAll', limit, offset),
    getById: (id: number) => ipcRenderer.invoke('db:expenses:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:expenses:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:expenses:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:expenses:delete', id),
  },

  categories: {
    getAll: () => ipcRenderer.invoke('db:categories:getAll'),
    create: (data: any) => ipcRenderer.invoke('db:categories:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:categories:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:categories:delete', id),
  },

  audit: {
    getLogs: (limit?: number, offset?: number) => ipcRenderer.invoke('db:audit:getLogs', limit, offset),
  },

  dashboard: {
    getSummary: () => ipcRenderer.invoke('db:dashboard:summary'),
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke('db:settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('db:settings:set', key, value),
    getAll: () => ipcRenderer.invoke('db:settings:getAll'),
  },

  users: {
    getByEmail: (email: string) => ipcRenderer.invoke('db:users:getByEmail', email),
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:users:getAll', limit, offset),
    login: (username: string, password: string) => ipcRenderer.invoke('db:users:login', username, password),
    create: (data: any) => ipcRenderer.invoke('db:users:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:users:update', id, data),
    findByUsername: (username: string) => ipcRenderer.invoke('db:users:findByUsername', username),
    unlock: (userId: number) => ipcRenderer.invoke('db:users:unlock', userId),
    getLocked: () => ipcRenderer.invoke('db:users:getLocked'),
    delete: (id: number) => ipcRenderer.invoke('db:users:delete', id),
  },

  business: {
    getFirst: () => ipcRenderer.invoke('db:business:getFirst'),
    update: (data: any) => ipcRenderer.invoke('db:business:update', data),
  },

  recibos: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:recibos:getAll', limit, offset),
    getById: (id: string) => ipcRenderer.invoke('db:recibos:getById', id),
    save: (recibo: any) => ipcRenderer.invoke('db:recibos:save', recibo),
    search: (query: string, limit?: number, offset?: number) => ipcRenderer.invoke('db:recibos:search', query, limit, offset),
    delete: (id: string) => ipcRenderer.invoke('db:recibos:delete', id),
    nextNumero: () => ipcRenderer.invoke('db:recibos:nextNumero'),
  },

  system: {
    getDbPath: () => ipcRenderer.invoke('db:system:getDbPath'),
    getBusinessType: () => ipcRenderer.invoke('db:system:getBusinessType'),
  },

  backup: {
    manual: () => ipcRenderer.invoke('db:backup:manual'),
    restore: () => ipcRenderer.invoke('db:backup:restore'),
    info: () => ipcRenderer.invoke('db:backup:info'),
  },

  utils: {
    validatePermission: (channel: string, userRole: string) =>
      ipcRenderer.invoke('db:utils:validatePermission', channel, userRole),
    getPermissionsMap: () => ipcRenderer.invoke('db:utils:getPermissionsMap'),
    verifyPassword: (password: string) => ipcRenderer.invoke('db:utils:verifyPassword', password),
  },

  session: {
    login: (user: any) => ipcRenderer.invoke('db:session:login', user),
    logout: () => ipcRenderer.invoke('db:session:logout'),
    get: () => ipcRenderer.invoke('db:session:get'),
  },

  file: {
    saveDialog: (filename: string, buffer: ArrayBuffer) => ipcRenderer.invoke('file:saveDialog', filename, buffer),
  },
});