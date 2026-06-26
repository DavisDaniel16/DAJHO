import { contextBridge, ipcRenderer } from 'electron';

// Exponer APIs al renderer
contextBridge.exposeInMainWorld('dajhoAPI', {
  platform: process.platform,
  version: process.versions.electron,

  // ============================================
  // PRODUCTOS
  // ============================================
  products: {
    getAll: () => ipcRenderer.invoke('db:products:getAll'),
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
    getAll: () => ipcRenderer.invoke('db:clients:getAll'),
    getById: (id: number) => ipcRenderer.invoke('db:clients:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:clients:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:clients:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:clients:delete', id),
  },

  // ============================================
  // VENTAS
  // ============================================
  sales: {
    getAll: () => ipcRenderer.invoke('db:sales:getAll'),
    getById: (id: number) => ipcRenderer.invoke('db:sales:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:sales:create', data),
    getByDate: (date: string) => ipcRenderer.invoke('db:sales:getByDate', date),
    getByDateRange: (start: string, end: string) => ipcRenderer.invoke('db:sales:getByDateRange', start, end),
  },

  // ============================================
  // EMPLEADOS
  // ============================================
  employees: {
    getAll: () => ipcRenderer.invoke('db:employees:getAll'),
    getById: (id: number) => ipcRenderer.invoke('db:employees:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:employees:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:employees:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:employees:delete', id),
  },

  // ============================================
  // PROVEEDORES
  // ============================================
  suppliers: {
    getAll: () => ipcRenderer.invoke('db:suppliers:getAll'),
    getById: (id: number) => ipcRenderer.invoke('db:suppliers:getById', id),
    create: (data: any) => ipcRenderer.invoke('db:suppliers:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:suppliers:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:suppliers:delete', id),
  },

  // ============================================
  // GASTOS
  // ============================================
  expenses: {
    getAll: () => ipcRenderer.invoke('db:expenses:getAll'),
    create: (data: any) => ipcRenderer.invoke('db:expenses:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('db:expenses:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:expenses:delete', id),
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
    getAll: () => ipcRenderer.invoke('db:users:getAll'),
    login: (username: string, password: string) => ipcRenderer.invoke('db:users:login', username, password),
    create: (data: any) => ipcRenderer.invoke('db:users:create', data),
  },

  // ============================================
  // NEGOCIO
  // ============================================
  business: {
    getFirst: () => ipcRenderer.invoke('db:business:getFirst'),
    update: (data: any) => ipcRenderer.invoke('db:business:update', data),
  },

  // ============================================
  // ARCHIVOS
  // ============================================
  file: {
    saveDialog: (filename: string, buffer: ArrayBuffer) => ipcRenderer.invoke('file:saveDialog', filename, buffer),
  },
});