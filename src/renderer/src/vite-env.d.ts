/// <reference types="vite/client" />

interface DajhoAPI {
  platform: string;
  version: string;
  products: {
    getAll: (limit?: number, offset?: number) => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    create: (data: any) => Promise<number>;
    update: (id: number, data: any) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
    updateStock: (id: number, stock: number) => Promise<{ success: boolean }>;
  };
  clients: {
    getAll: (limit?: number, offset?: number) => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    create: (data: any) => Promise<number>;
    update: (id: number, data: any) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
  };
  sales: {
    getAll: (limit?: number, offset?: number) => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    create: (data: any) => Promise<number>;
    update: (id: number, data: any) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
    getByDate: (date: string, limit?: number, offset?: number) => Promise<any[]>;
    getByDateRange: (start: string, end: string, limit?: number, offset?: number) => Promise<any[]>;
  };
  employees: {
    getAll: (limit?: number, offset?: number) => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    create: (data: any) => Promise<number>;
    update: (id: number, data: any) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
  };
  suppliers: {
    getAll: (limit?: number, offset?: number) => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    create: (data: any) => Promise<number>;
    update: (id: number, data: any) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
  };
  expenses: {
    getAll: (limit?: number, offset?: number) => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    create: (data: any) => Promise<number>;
    update: (id: number, data: any) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
  };
  settings: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<{ success: boolean }>;
    getAll: () => Promise<Record<string, string>>;
  };
  users: {
    getByEmail: (email: string) => Promise<any>;
    getAll: (limit?: number, offset?: number) => Promise<any[]>;
    login: (username: string, password: string) => Promise<any>;
    create: (data: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    update: (id: number, data: any) => Promise<{ success: boolean; message?: string }>;
    findByUsername: (username: string) => Promise<any>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
  };
  business: {
    getFirst: () => Promise<any>;
    update: (data: any) => Promise<{ success: boolean }>;
  };
  recibos: {
    getAll: (limit?: number, offset?: number) => Promise<any[]>;
    getById: (id: string) => Promise<any>;
    save: (recibo: any) => Promise<{ success: boolean }>;
    search: (query: string, limit?: number, offset?: number) => Promise<any[]>;
    delete: (id: string) => Promise<{ success: boolean }>;
    nextNumero: () => Promise<string>;
  };
  utils: {
    validatePermission: (channel: string, userRole: string) => Promise<{ allowed: boolean }>;
    getPermissionsMap: () => Promise<Record<string, string[]>>;
    verifyPassword: (password: string) => Promise<{ valid: boolean }>;
  };
  session: {
    login: (user: any) => Promise<{ success: boolean }>;
    logout: () => Promise<{ success: boolean }>;
    get: () => Promise<any>;
  };
  system: {
    getDbPath: () => Promise<string>;
  };
  backup: {
    manual: () => Promise<{ success: boolean; path?: string; error?: string }>;
    restore: () => Promise<{ success: boolean; message?: string; error?: string }>;
    info: () => Promise<{ exists: boolean; size: number; modified: string; mainDbSize: number }>;
  };
  file: {
    saveDialog: (filename: string, buffer: ArrayBuffer) => Promise<boolean>;
  };
}

interface Window {
  dajhoAPI: DajhoAPI;
}