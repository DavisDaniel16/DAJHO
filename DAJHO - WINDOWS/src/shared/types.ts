/**
 * types.ts — Tipos compartidos entre main process, preload y renderer.
 * 
 * Define las interfaces para toda la comunicación IPC y modelos de datos.
 * El preload y el renderer usan estos tipos para tener type-safety.
 */

// ═══════════════════════════════════════════════════════════
// MODELOS DE DATOS
// ═══════════════════════════════════════════════════════════

export interface Product {
  id: number;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  size?: string;
  color?: string;
  barcode?: string;
  min_stock: number;
  business_id?: number;
  active: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  name: string;
  price: number;
  cost: number;
  stock?: number;
  category?: string;
  size?: string;
  color?: string;
  barcode?: string;
  min_stock?: number;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  document: string;
  total_debt: number;
  total_purchases: number;
  business_id?: number;
  active: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientInput {
  name: string;
  phone?: string;
  email?: string;
  document?: string;
  total_debt?: number;
  total_purchases?: number;
}

export interface Employee {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  hire_date: string;
  salary: number;
  sales_count: number;
  notes: string;
  business_id?: number;
  active: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeInput {
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  status?: string;
  hire_date?: string;
  salary?: number;
  notes?: string;
}

export interface Sale {
  id: number;
  date: string;
  time: string;
  client_id: number | null;
  employee_id: number | null;
  subtotal: number;
  iva: number;
  total: number;
  payment_method: string;
  payment_reference: string;
  status: string;
  business_id?: number;
  active: number;
  deleted_at: string | null;
  created_at: string;
  client_name?: string;
  employee_name?: string;
  items?: SaleItem[];
  items_count?: number;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
  product_name?: string;
}

export interface SaleInput {
  date: string;
  time?: string;
  client_id?: number | null;
  employee_id?: number | null;
  payment_method?: string;
  payment_reference?: string;
  status?: string;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  contact_person: string;
  city: string;
  address: string;
  products_type: string;
  notes: string;
  total_purchases: number;
  total_pending: number;
  last_purchase: string | null;
  business_id?: number;
  active: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierInput {
  name: string;
  phone?: string;
  contact_person?: string;
  city?: string;
  address?: string;
  products_type?: string;
  notes?: string;
  total_purchases?: number;
  total_pending?: number;
  last_purchase?: string | null;
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  supplier_id: number | null;
  city: string;
  notes: string;
  business_id?: number;
  active: number;
  deleted_at: string | null;
  created_at: string;
}

export interface ExpenseInput {
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method?: string;
  supplier_id?: number | null;
  city?: string;
  notes?: string;
}

export interface Category {
  id: number;
  name: string;
  business_id?: number;
  active: number;
  deleted_at: string | null;
  created_at: string;
}

export interface CategoryInput {
  name: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'owner' | 'employee';
  business_id?: number;
  active: number;
  created_at: string;
}

export interface UserInput {
  name: string;
  username: string;
  email: string;
  password: string;
  role?: 'owner' | 'employee';
}

export interface Business {
  id: number;
  name: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  ruc: string;
  logo?: string;
}

export interface BusinessInput {
  name: string;
  owner?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  ruc?: string;
}

export interface Recibo {
  id: string;
  numero: string;
  fecha: string;
  fecha_raw: string;
  hora: string;
  cliente: string;
  productos: any[];
  subtotal: number;
  iva: number;
  total: number;
  metodo_pago: string;
  vendedor: string;
  negocio_nombre: string;
  negocio_ruc: string;
}

export interface DashboardSummary {
  ventasHoy: number;
  cantidadVentasHoy: number;
  ventasSemana: Array<{ date: string; total: number }>;
  gastosHoy: number;
  totalProductos: number;
  totalClientes: number;
  totalProveedores: number;
  totalEmpleados: number;
  deudaClientes: number;
  stockBajo: number;
  sinStock: number;
  ventasRecientes: Array<{
    id: number;
    date: string;
    total: number;
    payment_method: string;
    client_name: string | null;
  }>;
  productosStockBajo: Array<{
    id: number;
    name: string;
    stock: number;
    min_stock: number;
  }>;
  hayVentasHoy: boolean;
}

export interface BackupInfo {
  exists: boolean;
  size: number;
  modified: string;
  mainDbSize: number;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  details: string;
  created_at: string;
}

export interface Session {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'owner' | 'employee';
}

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

// ═══════════════════════════════════════════════════════════
// INTERFAZ DEL API (window.dajhoAPI)
// ═══════════════════════════════════════════════════════════

export interface DajhoAPI {
  platform: string;
  version: string;

  call: (method: string, ...args: any[]) => Promise<any>;

  products: {
    getAll: (limit?: number, offset?: number) => Promise<Product[]>;
    getById: (id: number) => Promise<Product | undefined>;
    create: (data: ProductInput) => Promise<number>;
    update: (id: number, data: Partial<ProductInput>) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
    updateStock: (id: number, stock: number) => Promise<{ success: boolean }>;
  };

  clients: {
    getAll: (limit?: number, offset?: number) => Promise<Client[]>;
    getById: (id: number) => Promise<Client | undefined>;
    create: (data: ClientInput) => Promise<number>;
    update: (id: number, data: Partial<ClientInput>) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
  };

  sales: {
    getAll: (limit?: number, offset?: number) => Promise<Sale[]>;
    getById: (id: number) => Promise<Sale | undefined>;
    create: (data: SaleInput) => Promise<number>;
    update: (id: number, data: Partial<SaleInput>) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
    getByDate: (date: string, limit?: number, offset?: number) => Promise<Sale[]>;
    getByDateRange: (start: string, end: string, limit?: number, offset?: number) => Promise<Sale[]>;
  };

  employees: {
    getAll: (limit?: number, offset?: number) => Promise<Employee[]>;
    getById: (id: number) => Promise<Employee | undefined>;
    create: (data: EmployeeInput) => Promise<number>;
    update: (id: number, data: Partial<EmployeeInput>) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
  };

  suppliers: {
    getAll: (limit?: number, offset?: number) => Promise<Supplier[]>;
    getById: (id: number) => Promise<Supplier | undefined>;
    create: (data: SupplierInput) => Promise<number>;
    update: (id: number, data: Partial<SupplierInput>) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
  };

  expenses: {
    getAll: (limit?: number, offset?: number) => Promise<Expense[]>;
    getById: (id: number) => Promise<Expense | undefined>;
    create: (data: ExpenseInput) => Promise<number>;
    update: (id: number, data: Partial<ExpenseInput>) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
  };

  categories: {
    getAll: () => Promise<Category[]>;
    create: (data: CategoryInput) => Promise<number>;
    update: (id: number, data: Partial<CategoryInput>) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
  };

  audit: {
    getLogs: (limit?: number, offset?: number) => Promise<{ logs: AuditLog[]; total: number }>;
  };

  dashboard: {
    getSummary: () => Promise<DashboardSummary>;
  };

  settings: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<{ success: boolean }>;
    getAll: () => Promise<Record<string, string>>;
  };

  users: {
    getByEmail: (email: string) => Promise<User | undefined>;
    getAll: (limit?: number, offset?: number) => Promise<User[]>;
    login: (username: string, password: string) => Promise<(User & { blocked?: boolean; message?: string }) | null>;
    create: (data: UserInput) => Promise<{ success: boolean; id: number }>;
    update: (id: number, data: Partial<UserInput>) => Promise<{ success: boolean }>;
    findByUsername: (username: string) => Promise<User | null>;
    unlock: (userId: number) => Promise<{ success: boolean }>;
    getLocked: () => Promise<User[]>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
  };

  business: {
    getFirst: () => Promise<Business | null>;
    update: (data: BusinessInput) => Promise<{ success: boolean }>;
  };

  recibos: {
    getAll: (limit?: number, offset?: number) => Promise<Recibo[]>;
    getById: (id: string) => Promise<Recibo | null>;
    save: (recibo: Partial<Recibo>) => Promise<{ success: boolean }>;
    search: (query: string, limit?: number, offset?: number) => Promise<Recibo[]>;
    delete: (id: string) => Promise<{ success: boolean }>;
    nextNumero: () => Promise<string>;
  };

  system: {
    getDbPath: () => Promise<string>;
    getBusinessType: () => Promise<string>;
  };

  backup: {
    manual: () => Promise<{ success: boolean; path?: string }>;
    restore: () => Promise<{ success: boolean; message?: string; error?: string }>;
    info: () => Promise<BackupInfo>;
  };

  utils: {
    validatePermission: (channel: string, userRole: string) => Promise<{ allowed: boolean }>;
    getPermissionsMap: () => Promise<Record<string, string[]>>;
    verifyPassword: (password: string) => Promise<{ valid: boolean; error?: string }>;
  };

  session: {
    login: (user: Session) => Promise<{ success: boolean }>;
    logout: () => Promise<{ success: boolean }>;
    get: () => Promise<Session | null>;
  };

  file: {
    saveDialog: (filename: string, buffer: ArrayBuffer) => Promise<boolean>;
  };
}

// ═══════════════════════════════════════════════════════════
// DECLARACIÓN GLOBAL PARA window.dajhoAPI
// ═══════════════════════════════════════════════════════════

declare global {
  interface Window {
    dajhoAPI: DajhoAPI;
  }
}
