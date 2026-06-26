/// <reference types="vite/client" />

interface DajhoAPI {
  platform: string;
  version: string;
  products: {
    getAll: () => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    create: (data: any) => Promise<number>;
    update: (id: number, data: any) => Promise<boolean>;
    delete: (id: number) => Promise<boolean>;
    updateStock: (id: number, stock: number) => Promise<boolean>;
  };
  clients: {
    getAll: () => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    create: (data: any) => Promise<number>;
    update: (id: number, data: any) => Promise<boolean>;
    delete: (id: number) => Promise<boolean>;
  };
  sales: {
    getAll: () => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    create: (data: any) => Promise<number>;
    getByDate: (date: string) => Promise<any[]>;
    getByDateRange: (start: string, end: string) => Promise<any[]>;
  };
  employees: {
    getAll: () => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    create: (data: any) => Promise<number>;
    update: (id: number, data: any) => Promise<boolean>;
    delete: (id: number) => Promise<boolean>;
  };
  suppliers: {
    getAll: () => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    create: (data: any) => Promise<number>;
    update: (id: number, data: any) => Promise<boolean>;
    delete: (id: number) => Promise<boolean>;
  };
  expenses: {
    getAll: () => Promise<any[]>;
    create: (data: any) => Promise<number>;
    update: (id: number, data: any) => Promise<boolean>;
    delete: (id: number) => Promise<boolean>;
  };
  settings: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<boolean>;
    getAll: () => Promise<Record<string, string>>;
  };
  users: {
    getByEmail: (email: string) => Promise<any>;
    getAll: () => Promise<any[]>;
    login: (username: string, password: string) => Promise<any>;
    create: (data: any) => Promise<{ success: boolean; id?: number; error?: string }>;
  };
  business: {
    getFirst: () => Promise<any>;
    update: (data: any) => Promise<boolean>;
  };
  file: {
    saveDialog: (filename: string, buffer: ArrayBuffer) => Promise<boolean>;
  };
}

interface Window {
  dajhoAPI: DajhoAPI;
}