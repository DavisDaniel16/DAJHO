import { useState, useEffect, useCallback } from 'react';

// ============================================
// TIPOS COMPARTIDOS
// ============================================
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
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  document: string;
  total_debt: number;
  total_purchases: number;
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
  last_purchase: string;
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  supplier_id?: number;
  city?: string;
  notes?: string;
}

export interface Sale {
  id: number;
  date: string;
  time: string;
  client_id: number;
  employee_id: number;
  subtotal: number;
  iva: number;
  total: number;
  payment_method: string;
  status: string;
  client_name?: string;
  employee_name?: string;
  items?: SaleItem[];
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

// ============================================
// HOOK FACTORY (patrón genérico)
// ============================================
function useEntity<T>(
  fetchFn: () => Promise<T[]>,
  options?: { autoLoad?: boolean }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(options?.autoLoad !== false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (options?.autoLoad !== false) load();
  }, [load]);

  return { data, loading, error, load, setData };
}

// ============================================
// HOOK: useProducts
// ============================================
export const useProducts = () => {
  const { data: products, loading, error, load: loadProducts, setData } = useEntity<Product>(
    () => window.dajhoAPI.products.getAll()
  );

  const createProduct = useCallback(async (data: Omit<Product, 'id'>) => {
    try {
      const id = await window.dajhoAPI.products.create(data);
      await loadProducts();
      return id;
    } catch (err) {
      console.error('Error al crear producto:', err);
      return null;
    }
  }, [loadProducts]);

  const updateProduct = useCallback(async (id: number, data: Partial<Product>) => {
    try {
      await window.dajhoAPI.products.update(id, data);
      await loadProducts();
      return true;
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      return false;
    }
  }, [loadProducts]);

  const deleteProduct = useCallback(async (id: number) => {
    try {
      await window.dajhoAPI.products.delete(id);
      await loadProducts();
      return true;
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      return false;
    }
  }, [loadProducts]);

  const updateStock = useCallback(async (id: number, stock: number) => {
    try {
      await window.dajhoAPI.products.updateStock(id, stock);
      await loadProducts();
      return true;
    } catch (err) {
      console.error('Error al actualizar stock:', err);
      return false;
    }
  }, [loadProducts]);

  return { products, loading, error, loadProducts, createProduct, updateProduct, deleteProduct, updateStock };
};

// ============================================
// HOOK: useClients
// ============================================
export const useClients = () => {
  const { data: clients, loading, error, load: loadClients } = useEntity<Client>(
    () => window.dajhoAPI.clients.getAll()
  );

  const createClient = useCallback(async (data: any) => {
    try {
      const id = await window.dajhoAPI.clients.create(data);
      await loadClients();
      return id;
    } catch (err) {
      console.error('Error al crear cliente:', err);
      return null;
    }
  }, [loadClients]);

  const updateClient = useCallback(async (id: number, data: any) => {
    try {
      await window.dajhoAPI.clients.update(id, data);
      await loadClients();
      return true;
    } catch (err) {
      console.error('Error al actualizar cliente:', err);
      return false;
    }
  }, [loadClients]);

  const deleteClient = useCallback(async (id: number) => {
    try {
      await window.dajhoAPI.clients.delete(id);
      await loadClients();
      return true;
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      return false;
    }
  }, [loadClients]);

  return { clients, loading, error, loadClients, createClient, updateClient, deleteClient };
};

// ============================================
// HOOK: useEmployees
// ============================================
export const useEmployees = () => {
  const { data: employees, loading, error, load: loadEmployees } = useEntity<Employee>(
    () => window.dajhoAPI.employees.getAll()
  );

  const createEmployee = useCallback(async (data: any) => {
    try {
      const id = await window.dajhoAPI.employees.create(data);
      await loadEmployees();
      return id;
    } catch (err) {
      console.error('Error al crear empleado:', err);
      return null;
    }
  }, [loadEmployees]);

  const updateEmployee = useCallback(async (id: number, data: any) => {
    try {
      await window.dajhoAPI.employees.update(id, data);
      await loadEmployees();
      return true;
    } catch (err) {
      console.error('Error al actualizar empleado:', err);
      return false;
    }
  }, [loadEmployees]);

  const deleteEmployee = useCallback(async (id: number) => {
    try {
      await window.dajhoAPI.employees.delete(id);
      await loadEmployees();
      return true;
    } catch (err) {
      console.error('Error al eliminar empleado:', err);
      return false;
    }
  }, [loadEmployees]);

  return { employees, loading, error, loadEmployees, createEmployee, updateEmployee, deleteEmployee };
};

// ============================================
// HOOK: useSuppliers
// ============================================
export const useSuppliers = () => {
  const { data: suppliers, loading, error, load: loadSuppliers } = useEntity<Supplier>(
    () => window.dajhoAPI.suppliers.getAll()
  );

  const createSupplier = useCallback(async (data: any) => {
    try {
      const id = await window.dajhoAPI.suppliers.create(data);
      await loadSuppliers();
      return id;
    } catch (err) {
      console.error('Error al crear proveedor:', err);
      return null;
    }
  }, [loadSuppliers]);

  const updateSupplier = useCallback(async (id: number, data: any) => {
    try {
      await window.dajhoAPI.suppliers.update(id, data);
      await loadSuppliers();
      return true;
    } catch (err) {
      console.error('Error al actualizar proveedor:', err);
      return false;
    }
  }, [loadSuppliers]);

  const deleteSupplier = useCallback(async (id: number) => {
    try {
      await window.dajhoAPI.suppliers.delete(id);
      await loadSuppliers();
      return true;
    } catch (err) {
      console.error('Error al eliminar proveedor:', err);
      return false;
    }
  }, [loadSuppliers]);

  return { suppliers, loading, error, loadSuppliers, createSupplier, updateSupplier, deleteSupplier };
};

// ============================================
// HOOK: useExpenses
// ============================================
export const useExpenses = () => {
  const { data: expenses, loading, error, load: loadExpenses } = useEntity<Expense>(
    () => window.dajhoAPI.expenses.getAll()
  );

  const createExpense = useCallback(async (data: any) => {
    try {
      const id = await window.dajhoAPI.expenses.create(data);
      await loadExpenses();
      return id;
    } catch (err) {
      console.error('Error al crear gasto:', err);
      return null;
    }
  }, [loadExpenses]);

  const updateExpense = useCallback(async (id: number, data: any) => {
    try {
      await window.dajhoAPI.expenses.update(id, data);
      await loadExpenses();
      return true;
    } catch (err) {
      console.error('Error al actualizar gasto:', err);
      return false;
    }
  }, [loadExpenses]);

  const deleteExpense = useCallback(async (id: number) => {
    try {
      await window.dajhoAPI.expenses.delete(id);
      await loadExpenses();
      return true;
    } catch (err) {
      console.error('Error al eliminar gasto:', err);
      return false;
    }
  }, [loadExpenses]);

  return { expenses, loading, error, loadExpenses, createExpense, updateExpense, deleteExpense };
};

// ============================================
// HOOK: useSales
// ============================================
export const useSales = () => {
  const { data: sales, loading, error, load: loadSales } = useEntity<Sale>(
    () => window.dajhoAPI.sales.getAll()
  );

  const createSale = useCallback(async (data: any) => {
    try {
      const id = await window.dajhoAPI.sales.create(data);
      await loadSales();
      return id;
    } catch (err) {
      console.error('Error al crear venta:', err);
      return null;
    }
  }, [loadSales]);

  const getSaleById = useCallback(async (id: number) => {
    try {
      return await window.dajhoAPI.sales.getById(id);
    } catch (err) {
      console.error('Error al obtener venta:', err);
      return null;
    }
  }, []);

  const getSalesByDate = useCallback(async (date: string) => {
    try {
      return await window.dajhoAPI.sales.getByDate(date);
    } catch (err) {
      console.error('Error al obtener ventas por fecha:', err);
      return [];
    }
  }, []);

  const getSalesByDateRange = useCallback(async (start: string, end: string) => {
    try {
      return await window.dajhoAPI.sales.getByDateRange(start, end);
    } catch (err) {
      console.error('Error al obtener ventas por rango:', err);
      return [];
    }
  }, []);

  return { sales, loading, error, loadSales, createSale, getSaleById, getSalesByDate, getSalesByDateRange };
};