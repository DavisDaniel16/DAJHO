import { contextBridge, ipcRenderer } from 'electron';

// Exponer APIs al renderer
contextBridge.exposeInMainWorld('dajhoAPI', {
  platform: process.platform,
  version: process.versions.electron,

  // ============================================
  // PRODUCTOS
  // ============================================
  products: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:products:getAll', limit, offset),
    getById: (id: number) => ipcRenderer.invoke('db:products:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:products:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:products:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:products:delete', id),
    updateStock: (id: number, stock: number) => ipcRenderer.invoke('db:products:updateStock', id, stock),
  },

  // ============================================
  // CLIENTES
  // ============================================
  clients: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:clients:getAll', limit, offset),
    getById: (id: number) => ipcRenderer.invoke('db:clients:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:clients:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:clients:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:clients:delete', id),
  },

  // ============================================
  // VENTAS
  // ============================================
  sales: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:sales:getAll', limit, offset),
    getById: (id: number) => ipcRenderer.invoke('db:sales:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:sales:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:sales:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:sales:delete', id),
    getByDate: (date: string, limit?: number, offset?: number) => ipcRenderer.invoke('db:sales:getByDate', date, limit, offset),
    getByDateRange: (start: string, end: string, limit?: number, offset?: number) => ipcRenderer.invoke('db:sales:getByDateRange', start, end, limit, offset),
  },

  // ============================================
  // EMPLEADOS
  // ============================================
  employees: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:employees:getAll', limit, offset),
    getById: (id: number) => ipcRenderer.invoke('db:employees:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:employees:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:employees:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:employees:delete', id),
  },

  // ============================================
  // PROVEEDORES
  // ============================================
  suppliers: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:suppliers:getAll', limit, offset),
    getById: (id: number) => ipcRenderer.invoke('db:suppliers:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:suppliers:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:suppliers:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:suppliers:delete', id),
  },

  // ============================================
  // GASTOS
  // ============================================
  expenses: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:expenses:getAll', limit, offset),
    getById: (id: number) => ipcRenderer.invoke('db:expenses:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:expenses:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:expenses:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:expenses:delete', id),
  },

  // ============================================
  // CATEGORÍAS
  // ============================================
  categories: {
    getAll: () => ipcRenderer.invoke('db:categories:getAll'),
    create: (data: any) => ipcRenderer.invoke('db:categories:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:categories:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:categories:delete', id),
  },

  // ============================================
  // AUDITORÍA
  // ============================================
  audit: {
    getLogs: (limit?: number, offset?: number) => ipcRenderer.invoke('db:audit:getLogs', limit, offset),
  },

  // ============================================
  // DASHBOARD
  // ============================================
  dashboard: {
    getSummary: () => ipcRenderer.invoke('db:dashboard:summary'),
  },

  // ============================================
  // CONFIGURACIÓN
  // ============================================
  settings: {
    get: (key: string) => ipcRenderer.invoke('db:settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('db:settings:set', key, value),
    getAll: () => ipcRenderer.invoke('db:settings:getAll'),
  },

  // ============================================
  // USUARIOS
  // ============================================
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

  // ============================================
  // NEGOCIO
  // ============================================
  business: {
    getFirst: () => ipcRenderer.invoke('db:business:getFirst'),
    update: (data: any) => ipcRenderer.invoke('db:business:update', data),
  },

  // ============================================
  // RECIBOS (SQLite)
  // ============================================
  recibos: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke('db:recibos:getAll', limit, offset),
    getById: (id: string) => ipcRenderer.invoke('db:recibos:getById', id),
    save: (recibo: any) => ipcRenderer.invoke('db:recibos:save', recibo),
    search: (query: string, limit?: number, offset?: number) => ipcRenderer.invoke('db:recibos:search', query, limit, offset),
    delete: (id: string) => ipcRenderer.invoke('db:recibos:delete', id),
    nextNumero: () => ipcRenderer.invoke('db:recibos:nextNumero'),
  },

  // ============================================
  // SISTEMA
  // ============================================
  system: {
    getDbPath: () => ipcRenderer.invoke('db:system:getDbPath'),
  },

  // ============================================
  // BACKUP
  // ============================================
  backup: {
    manual: () => ipcRenderer.invoke('db:backup:manual'),
    restore: () => ipcRenderer.invoke('db:backup:restore'),
    info: () => ipcRenderer.invoke('db:backup:info'),
  },

  // ============================================
  // UTILIDADES (permisos, sistema)
  // ============================================
  utils: {
    validatePermission: (channel: string, userRole: string) =>
      ipcRenderer.invoke('db:utils:validatePermission', channel, userRole),
    getPermissionsMap: () => ipcRenderer.invoke('db:utils:getPermissionsMap'),
    verifyPassword: (password: string) => ipcRenderer.invoke('db:utils:verifyPassword', password),
  },

  // ============================================
  // SESIÓN
  // ============================================
  session: {
    login: (user: any) => ipcRenderer.invoke('db:session:login', user),
    logout: () => ipcRenderer.invoke('db:session:logout'),
    get: () => ipcRenderer.invoke('db:session:get'),
  },

  // ============================================
  // ARCHIVOS
  // ============================================
  file: {
    saveDialog: (filename: string, buffer: ArrayBuffer) => ipcRenderer.invoke('file:saveDialog', filename, buffer),
  },
});