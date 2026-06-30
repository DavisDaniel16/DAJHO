import { ipcMain, dialog, app } from 'electron';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from './database.js';
import { HANDLER_PERMISSIONS, validatePermission, checkRateLimit } from './security.js';

const SALT_ROUNDS = 10;

// ═══════════════════════════════════════════════════════════
// DETECCIÓN DEL TIPO DE NEGOCIO
// ═══════════════════════════════════════════════════════════
// Detecta el tipo desde:
// 1. Variable de entorno DAJHO_TYPE
// 2. Nombre del ejecutable (DAJHO-Tienda.exe, DAJHO-Ropa.exe, etc.)
const BUSINESS_TYPES = ['tienda', 'ropa', 'ferreteria'] as const;
type BusinessType = (typeof BUSINESS_TYPES)[number];

function detectBusinessType(): BusinessType {
  // 1. Variable de entorno
  const envType = process.env.DAJHO_TYPE?.toLowerCase();
  if (envType && BUSINESS_TYPES.includes(envType as BusinessType)) {
    return envType as BusinessType;
  }

  // 2. Nombre del ejecutable
  try {
    const exeName = path.basename(app.getPath('exe')).toLowerCase();
    for (const bt of BUSINESS_TYPES) {
      if (exeName.includes(bt)) return bt;
    }
  } catch {}

  // 3. Default
  return 'tienda';
}

const currentBusinessType: BusinessType = detectBusinessType();

// ═══════════════════════════════════════════════════════════
// ESQUEMAS DE VALIDACIÓN (Zod)
// ═══════════════════════════════════════════════════════════
// Toda validación de entrada se hace aquí en el backend.
// Nunca confiar en datos del renderer sin validar.

const productSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200).trim(),
  price: z.number().positive('Precio debe ser positivo'),
  cost: z.number().min(0, 'Costo no puede ser negativo'),
  stock: z.number().int().min(0, 'Stock no puede ser negativo').default(0),
  category: z.string().max(100).default(''),
  size: z.string().max(50).default(''),
  color: z.string().max(50).default(''),
  barcode: z.string().max(100).default(''),
  min_stock: z.number().int().min(0).default(5),
});

const clientSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200).trim(),
  phone: z.string().max(50).default(''),
  email: z.string().email('Email inválido').or(z.literal('')).default(''),
  document: z.string().max(50).default(''),
  total_debt: z.number().min(0).default(0),
  total_purchases: z.number().min(0).default(0),
});

const employeeSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200).trim(),
  phone: z.string().max(50).default(''),
  email: z.string().email('Email inválido').or(z.literal('')).default(''),
  role: z.string().max(50).default('employee'),
  status: z.string().max(20).default('active'),
  hire_date: z.string().max(20).default(() => new Date().toISOString().split('T')[0]),
  salary: z.number().min(0).default(0),
  notes: z.string().max(500).default(''),
});

const supplierSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200).trim(),
  phone: z.string().max(50).default(''),
  contact_person: z.string().max(100).default(''),
  city: z.string().max(100).default(''),
  address: z.string().max(200).default(''),
  products_type: z.string().max(200).default(''),
  notes: z.string().max(500).default(''),
  total_purchases: z.number().min(0).default(0),
  total_pending: z.number().min(0).default(0),
  last_purchase: z.string().nullable().default(null),
});

const expenseSchema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  category: z.string().min(1, 'Categoría requerida').max(100).trim(),
  description: z.string().min(1, 'Descripción requerida').max(300).trim(),
  amount: z.number().positive('Monto debe ser positivo'),
  payment_method: z.string().max(50).default('cash'),
  supplier_id: z.number().int().nullable().default(null),
  city: z.string().max(100).default(''),
  notes: z.string().max(500).default(''),
});

const categorySchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100).trim(),
});

const saleItemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive('Cantidad debe ser positiva'),
  price: z.number().positive().optional(), // Se ignora — el precio se obtiene de la BD
  subtotal: z.number().optional(), // Se ignora — se calcula en backend
});

const saleSchema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  time: z.string().optional().default(''),
  client_id: z.number().int().nullable().default(null),
  employee_id: z.number().int().nullable().default(null),
  subtotal: z.number().optional(), // Se ignora — se calcula en backend
  iva: z.number().optional(), // Se ignora — se calcula en backend
  total: z.number().optional(), // Se ignora — se calcula en backend
  payment_method: z.string().max(50).default('Efectivo'),
  payment_reference: z.string().max(100).default(''),
  status: z.string().max(20).default('completed'),
  items: z.array(saleItemSchema).min(1, 'Debe haber al menos un producto'),
});

const userSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100).trim(),
  username: z.string().min(3, 'Usuario debe tener al menos 3 caracteres').max(50).trim().toLowerCase(),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['owner', 'employee']).default('employee'),
});

const reciboSchema = z.object({
  id: z.string().optional(),
  numero: z.string().optional(),
  fecha: z.string().optional(),
  fechaRaw: z.string().optional(),
  hora: z.string().optional(),
  cliente: z.string().max(200).default('Consumidor Final'),
  productos: z.any().default([]),
  subtotal: z.number().default(0),
  iva: z.number().default(0),
  total: z.number().default(0),
  metodoPago: z.string().max(50).default('Efectivo'),
  vendedor: z.string().max(100).default('Vendedor'),
  negocioNombre: z.string().max(200).default(''),
  negocioRuc: z.string().max(100).default(''),
});

// Helper: sanitizar string para evitar XSS básico
function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ═══════════════════════════════════════════════════════════
// SISTEMA DE SESIÓN (main process)
// ═══════════════════════════════════════════════════════════
// Almacena el usuario autenticado en el proceso principal.
// El renderer NO puede modificar esto — solo el login/logout.
let currentSession: { id: number; name: string; username: string; email: string; role: string } | null = null;

function getCurrentRole(): string | null {
  return currentSession?.role || null;
}

ipcMain.handle('db:session:login', handleError(async (_, user: { id: number; name: string; username: string; email: string; role: string }) => {
  currentSession = user;
  console.log(`Sesión iniciada: ${user.name} (${user.role})`);
  return { success: true };
}));

ipcMain.handle('db:session:logout', handleError(async () => {
  const name = currentSession?.name || 'desconocido';
  currentSession = null;
  console.log(`Sesión cerrada: ${name}`);
  return { success: true };
}));

ipcMain.handle('db:session:get', handleError(async () => {
  return currentSession;
}));

// ═══════════════════════════════════════════════════════════
// SEGURIDAD: PERMISOS + RATE LIMITING + AUDITORÍA
// ═══════════════════════════════════════════════════════════
// Los permisos se definen en security.ts (única fuente de verdad).
// validatePermission y HANDLER_PERMISSIONS se importan desde allí.

// Inserta un registro en la tabla de auditoría.
function auditLog(action: string, details: string = ''): void {
  try {
    const user = currentSession;
    if (!user) return;
    db.prepare(
      `INSERT INTO audit_log (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`
    ).run(user.id, user.name, action, details);
  } catch (err) {
    console.error('Error al escribir auditoría:', err);
  }
}

/**
 * Envuelve handlers con try/catch, validación de permisos y rate limiting.
 * Usa la sesión del main process para verificar el rol.
 * No necesita que el renderer envíe el rol — es seguro.
 */
function handleError<T>(handler: (...args: any[]) => T) {
  return async (...args: any[]) => {
    try {
      // Obtener el channel desde el evento (primer arg)
      const event = args[0];
      const channel = event?.channel || '';

      // 1. Rate limiting
      if (!checkRateLimit(channel)) {
        console.warn(`[RATE LIMIT] Demasiadas peticiones a '${channel}'`);
        return { success: false, error: 'Demasiadas peticiones. Intenta de nuevo en un minuto.' };
      }
      
      // 2. Validar permiso automáticamente según la sesión actual
      const role = getCurrentRole();
      if (!validatePermission(channel, role)) {
        console.warn(`[SEGURIDAD] Acceso denegado a '${channel}': rol actual: '${role || 'ninguno'}'`);
        return { success: false, error: 'No tienes permisos para realizar esta operación' };
      }

      return await handler(...args);
    } catch (err: unknown) {
      // Si el error es de validación Zod, devolver mensaje claro
      if (err instanceof z.ZodError) {
        const messages = err.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ');
        console.warn(`[VALIDACIÓN] Error de validación: ${messages}`);
        return { success: false, error: `Datos inválidos: ${messages}` };
      }
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`Error en IPC handler:`, error);
      return { success: false, error: error.message || 'Error interno del servidor' };
    }
  };
}

ipcMain.handle('db:products:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT * FROM products WHERE active = 1 ORDER BY name LIMIT ? OFFSET ?'
    : 'SELECT * FROM products WHERE active = 1 ORDER BY name';
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:products:getById', handleError(async (_, id) => {
  const stmt = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1');
  return stmt.get(id);
}));

ipcMain.handle('db:products:create', handleError(async (_, data) => {
  // Validar con Zod
  const parsed = productSchema.parse(data);
  const stmt = db.prepare(`
    INSERT INTO products (name, price, cost, stock, category, size, color, barcode, min_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    parsed.name, parsed.price, parsed.cost, parsed.stock,
    parsed.category, parsed.size, parsed.color,
    parsed.barcode, parsed.min_stock
  );
  auditLog('Crear producto', `Creó el producto "${parsed.name}"`);
  return result.lastInsertRowid;
}));

ipcMain.handle('db:products:update', handleError(async (_, id, data) => {
  // Validar con Zod
  const parsed = productSchema.partial().parse(data);
  // Construir SET dinámicamente solo con campos proporcionados
  const updates: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  }
  if (updates.length === 0) return { success: true, message: 'Sin cambios' };
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  const stmt = db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ? AND active = 1`);
  const result = stmt.run(...params);
  if (result.changes > 0) auditLog('Editar producto', `Editó producto ID: ${id}`);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:products:delete', handleError(async (_, id) => {
  // Soft delete: no se elimina físicamente
  const prod = db.prepare('SELECT name FROM products WHERE id = ? AND active = 1').get(id) as { name: string } | undefined;
  if (!prod) return { success: false, error: 'Producto no encontrado' };
  
  // Verificar si hay ventas activas con este producto
  const salesUsing = db.prepare(
    'SELECT COUNT(*) as count FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE si.product_id = ? AND s.active = 1'
  ).get(id) as { count: number };
  
  db.prepare('UPDATE products SET active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  const msg = salesUsing.count > 0
    ? `Desactivó el producto "${prod.name}" (estaba en ${salesUsing.count} venta(s))`
    : `Desactivó el producto "${prod.name}"`;
  auditLog('Desactivar producto', `${msg} (ID: ${id})`);
  return { success: true };
}));

ipcMain.handle('db:products:updateStock', handleError(async (_, id, stock) => {
  if (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock)) {
    return { success: false, error: 'Stock debe ser un entero no negativo' };
  }
  const stmt = db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND active = 1');
  const result = stmt.run(stock, id);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:clients:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT * FROM clients WHERE active = 1 ORDER BY name LIMIT ? OFFSET ?'
    : 'SELECT * FROM clients WHERE active = 1 ORDER BY name';
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:clients:getById', handleError(async (_, id) => {
  const stmt = db.prepare('SELECT * FROM clients WHERE id = ? AND active = 1');
  return stmt.get(id);
}));

ipcMain.handle('db:clients:create', handleError(async (_, data) => {
  // Validar con Zod
  const parsed = clientSchema.parse(data);
  const stmt = db.prepare(`
    INSERT INTO clients (name, phone, email, document, total_debt, total_purchases)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    parsed.name, parsed.phone, parsed.email, parsed.document,
    parsed.total_debt, parsed.total_purchases
  );
  auditLog('Crear cliente', `Creó al cliente "${parsed.name}"`);
  return result.lastInsertRowid;
}));

ipcMain.handle('db:clients:update', handleError(async (_, id, data) => {
  // Validar con Zod (partial para permitir actualizaciones parciales)
  const parsed = clientSchema.partial().parse(data);
  const updates: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  }
  if (updates.length === 0) return { success: true, message: 'Sin cambios' };
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  const stmt = db.prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ? AND active = 1`);
  const result = stmt.run(...params);
  if (result.changes > 0) auditLog('Editar cliente', `Editó cliente ID: ${id}`);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:clients:delete', handleError(async (_, id) => {
  // Soft delete
  const client = db.prepare('SELECT name FROM clients WHERE id = ? AND active = 1').get(id) as { name: string } | undefined;
  if (!client) return { success: false, error: 'Cliente no encontrado' };
  db.prepare('UPDATE clients SET active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  auditLog('Desactivar cliente', `Desactivó al cliente "${client.name}" (ID: ${id})`);
  return { success: true };
}));

ipcMain.handle('db:sales:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? `SELECT s.*, c.name as client_name, e.name as employee_name,
       (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = s.id) as items_count
     FROM sales s
     LEFT JOIN clients c ON s.client_id = c.id
     LEFT JOIN employees e ON s.employee_id = e.id
     WHERE s.active = 1
     ORDER BY s.date DESC, s.id DESC LIMIT ? OFFSET ?`
    : `SELECT s.*, c.name as client_name, e.name as employee_name,
       (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = s.id) as items_count
     FROM sales s
     LEFT JOIN clients c ON s.client_id = c.id
     LEFT JOIN employees e ON s.employee_id = e.id
     WHERE s.active = 1
     ORDER BY s.date DESC, s.id DESC`;
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:sales:getById', handleError(async (_, id) => {
  const sale = db.prepare(`
    SELECT s.*, c.name as client_name, e.name as employee_name FROM sales s
    LEFT JOIN clients c ON s.client_id = c.id
    LEFT JOIN employees e ON s.employee_id = e.id
    WHERE s.id = ? AND s.active = 1
  `).get(id) as Record<string, unknown> | undefined;

  const items = db.prepare(`
    SELECT si.*, p.name as product_name FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = ?
  `).all(id);

  return { ...(sale || {}), items };
}));

ipcMain.handle('db:sales:create', handleError(async (_, data) => {
  // Validar esquema completo con Zod
  const parsed = saleSchema.parse(data);

  const insertSale = db.transaction((saleData: z.infer<typeof saleSchema>) => {
    // 1. Validar stock de cada producto ANTES de insertar
    for (const item of saleData.items) {
      const product = db.prepare('SELECT id, name, price, stock FROM products WHERE id = ? AND active = 1')
        .get(item.product_id) as { id: number; name: string; price: number; stock: number } | undefined;

      if (!product) {
        throw new Error(`Producto ID ${item.product_id} no encontrado o desactivado`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${product.name}": disponible ${product.stock}, requerido ${item.quantity}`);
      }

      // 2. El precio de venta viene de la BD, NO del frontend
      item.price = product.price;
      item.subtotal = Math.round(product.price * item.quantity * 100) / 100;
    }

    // 3. Calcular totales en el backend (no confiar en lo que envía el frontend)
    const subtotal = Math.round(saleData.items.reduce((sum: number, i: any) => sum + i.subtotal, 0) * 100) / 100;
    // Leer IVA de settings
    const ivaRow = db.prepare("SELECT value FROM settings WHERE key = 'iva_porcentaje'").get() as { value: string } | undefined;
    const ivaPorcentaje = ivaRow ? parseInt(ivaRow.value, 10) / 100 : 0.12;
    const iva = Math.round(subtotal * ivaPorcentaje * 100) / 100;
    const total = Math.round((subtotal + iva) * 100) / 100;

    // 4. Insertar venta
    const stmt = db.prepare(`
      INSERT INTO sales (date, time, client_id, employee_id, subtotal, iva, total, payment_method, payment_reference, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      saleData.date, saleData.time || '', saleData.client_id, saleData.employee_id,
      subtotal, iva, total,
      saleData.payment_method, saleData.payment_reference, saleData.status
    );
    const saleId = result.lastInsertRowid;

    // 5. Insertar items y actualizar stock
    for (const item of saleData.items) {
      db.prepare(`INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)`)
        .run(saleId, item.product_id, item.quantity, item.price, item.subtotal);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
        .run(item.quantity, item.product_id);
    }

    return { saleId, total };
  });

  const { saleId, total } = insertSale(parsed);
  auditLog('Registrar venta', `Registró venta #${saleId} por $${total} (${parsed.payment_method})`);
  return saleId;
}));

ipcMain.handle('db:sales:getByDate', handleError(async (_, date, limit?: number, offset?: number) => {
  const query = limit
    ? `SELECT s.*, c.name as client_name,
       (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = s.id) as items_count
     FROM sales s LEFT JOIN clients c ON s.client_id = c.id
     WHERE s.date = ? AND s.active = 1 ORDER BY s.id DESC LIMIT ? OFFSET ?`
    : `SELECT s.*, c.name as client_name,
       (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = s.id) as items_count
     FROM sales s LEFT JOIN clients c ON s.client_id = c.id
     WHERE s.date = ? AND s.active = 1 ORDER BY s.id DESC`;
  return limit ? db.prepare(query).all(date, limit, offset || 0) : db.prepare(query).all(date);
}));

ipcMain.handle('db:sales:getByDateRange', handleError(async (_, start, end, limit?: number, offset?: number) => {
  const query = limit
    ? `SELECT s.*, c.name as client_name FROM sales s
     LEFT JOIN clients c ON s.client_id = c.id
     WHERE s.date BETWEEN ? AND ? AND s.active = 1 ORDER BY s.date DESC LIMIT ? OFFSET ?`
    : `SELECT s.*, c.name as client_name FROM sales s
     LEFT JOIN clients c ON s.client_id = c.id
     WHERE s.date BETWEEN ? AND ? AND s.active = 1 ORDER BY s.date DESC`;
  return limit ? db.prepare(query).all(start, end, limit, offset || 0) : db.prepare(query).all(start, end);
}));

ipcMain.handle('db:sales:update', handleError(async (_, id: number, data: any) => {
  // Solo permitir actualizar campos no críticos de una venta
  const allowedFields = ['payment_method', 'payment_reference', 'status', 'client_id', 'employee_id'];
  const updates: string[] = [];
  const params: any[] = [];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(data[field]);
    }
  }
  if (updates.length === 0) return { success: true, message: 'Sin cambios' };
  params.push(id);
  const stmt = db.prepare(`UPDATE sales SET ${updates.join(', ')} WHERE id = ? AND active = 1`);
  const result = stmt.run(...params);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:sales:delete', handleError(async (_, id: number) => {
  // Soft delete: restaurar stock y marcar como inactiva
  const deleteSale = db.transaction((saleId: number) => {
    const sale = db.prepare('SELECT id FROM sales WHERE id = ? AND active = 1').get(saleId) as { id: number } | undefined;
    if (!sale) throw new Error('Venta no encontrada');

    // Restaurar stock
    const items = db.prepare('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?').all(saleId) as Array<{ product_id: number; quantity: number }>;
    for (const item of items) {
      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id);
    }
    // Soft delete: no eliminar físicamente
    db.prepare('UPDATE sales SET active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(saleId);
    return true;
  });
  deleteSale(id);
  auditLog('Anular venta', `Anuló venta #${id}`);
  return { success: true };
}));

ipcMain.handle('db:employees:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT * FROM employees WHERE active = 1 ORDER BY name LIMIT ? OFFSET ?'
    : 'SELECT * FROM employees WHERE active = 1 ORDER BY name';
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:employees:getById', handleError(async (_, id) => {
  const stmt = db.prepare('SELECT * FROM employees WHERE id = ? AND active = 1');
  return stmt.get(id);
}));

ipcMain.handle('db:employees:create', handleError(async (_, data) => {
  const parsed = employeeSchema.parse(data);
  const stmt = db.prepare(`
    INSERT INTO employees (name, phone, email, role, status, hire_date, salary, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    parsed.name, parsed.phone, parsed.email, parsed.role,
    parsed.status, parsed.hire_date, parsed.salary, parsed.notes
  );
  auditLog('Crear empleado', `Creó al empleado "${parsed.name}"`);
  return result.lastInsertRowid;
}));

ipcMain.handle('db:employees:update', handleError(async (_, id, data) => {
  const old = db.prepare('SELECT name FROM employees WHERE id = ? AND active = 1').get(id) as { name: string } | undefined;
  const parsed = employeeSchema.partial().parse(data);
  const updates: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  }
  if (updates.length === 0) return { success: true, message: 'Sin cambios' };
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  const stmt = db.prepare(`UPDATE employees SET ${updates.join(', ')} WHERE id = ? AND active = 1`);
  const result = stmt.run(...params);
  if (result.changes > 0) auditLog('Editar empleado', `Editó al empleado "${old?.name || id}"`);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:employees:delete', handleError(async (_, id) => {
  const emp = db.prepare('SELECT name FROM employees WHERE id = ? AND active = 1').get(id) as { name: string } | undefined;
  if (!emp) return { success: false, error: 'Empleado no encontrado' };
  db.prepare('UPDATE employees SET active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  auditLog('Desactivar empleado', `Desactivó al empleado "${emp.name}" (ID: ${id})`);
  return { success: true };
}));

ipcMain.handle('db:suppliers:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT * FROM suppliers WHERE active = 1 ORDER BY name LIMIT ? OFFSET ?'
    : 'SELECT * FROM suppliers WHERE active = 1 ORDER BY name';
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:suppliers:getById', handleError(async (_, id) => {
  const stmt = db.prepare('SELECT * FROM suppliers WHERE id = ? AND active = 1');
  return stmt.get(id);
}));

ipcMain.handle('db:suppliers:create', handleError(async (_, data) => {
  const parsed = supplierSchema.parse(data);
  const stmt = db.prepare(`
    INSERT INTO suppliers (name, phone, contact_person, city, address, products_type, notes, total_purchases, total_pending, last_purchase)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    parsed.name, parsed.phone, parsed.contact_person, parsed.city,
    parsed.address, parsed.products_type, parsed.notes,
    parsed.total_purchases, parsed.total_pending, parsed.last_purchase
  );
  return result.lastInsertRowid;
}));

ipcMain.handle('db:suppliers:update', handleError(async (_, id, data) => {
  const parsed = supplierSchema.partial().parse(data);
  const updates: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  }
  if (updates.length === 0) return { success: true, message: 'Sin cambios' };
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  const stmt = db.prepare(`UPDATE suppliers SET ${updates.join(', ')} WHERE id = ? AND active = 1`);
  const result = stmt.run(...params);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:suppliers:delete', handleError(async (_, id) => {
  const sup = db.prepare('SELECT name FROM suppliers WHERE id = ? AND active = 1').get(id) as { name: string } | undefined;
  if (!sup) return { success: false, error: 'Proveedor no encontrado' };
  db.prepare('UPDATE suppliers SET active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  auditLog('Desactivar proveedor', `Desactivó al proveedor "${sup.name}" (ID: ${id})`);
  return { success: true };
}));

ipcMain.handle('db:expenses:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT * FROM expenses WHERE active = 1 ORDER BY date DESC LIMIT ? OFFSET ?'
    : 'SELECT * FROM expenses WHERE active = 1 ORDER BY date DESC';
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:expenses:getById', handleError(async (_, id: number) => {
  const stmt = db.prepare('SELECT * FROM expenses WHERE id = ? AND active = 1');
  return stmt.get(id);
}));

ipcMain.handle('db:expenses:create', handleError(async (_, data) => {
  const parsed = expenseSchema.parse(data);
  const stmt = db.prepare(`
    INSERT INTO expenses (date, category, description, amount, payment_method, supplier_id, city, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    parsed.date, parsed.category, parsed.description, parsed.amount,
    parsed.payment_method, parsed.supplier_id, parsed.city, parsed.notes
  );
  auditLog('Registrar gasto', `Registró gasto "${parsed.description}" por $${parsed.amount}`);
  return result.lastInsertRowid;
}));

ipcMain.handle('db:expenses:update', handleError(async (_, id, data) => {
  const parsed = expenseSchema.partial().parse(data);
  const updates: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  }
  if (updates.length === 0) return { success: true, message: 'Sin cambios' };
  params.push(id);
  const stmt = db.prepare(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ? AND active = 1`);
  const result = stmt.run(...params);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:expenses:delete', handleError(async (_, id) => {
  const exp = db.prepare('SELECT description FROM expenses WHERE id = ? AND active = 1').get(id) as { description: string } | undefined;
  if (!exp) return { success: false, error: 'Gasto no encontrado' };
  db.prepare('UPDATE expenses SET active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  auditLog('Desactivar gasto', `Desactivó gasto "${exp.description}" (ID: ${id})`);
  return { success: true };
}));

// ═══════════════════════════════════════════════════════════
// CATEGORÍAS
// ═══════════════════════════════════════════════════════════
ipcMain.handle('db:categories:getAll', handleError(async () => {
  return db.prepare('SELECT * FROM categories WHERE active = 1 ORDER BY name').all();
}));

ipcMain.handle('db:categories:create', handleError(async (_, data) => {
  const parsed = categorySchema.parse(data);
  const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const result = stmt.run(parsed.name);
  return result.lastInsertRowid;
}));

ipcMain.handle('db:categories:update', handleError(async (_, id, data) => {
  const parsed = categorySchema.partial().parse(data);
  const updates: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  }
  if (updates.length === 0) return { success: true, message: 'Sin cambios' };
  params.push(id);
  const stmt = db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND active = 1`);
  const result = stmt.run(...params);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:categories:delete', handleError(async (_, id) => {
  const cat = db.prepare('SELECT name FROM categories WHERE id = ? AND active = 1').get(id) as { name: string } | undefined;
  if (!cat) return { success: false, error: 'Categoría no encontrada' };
  db.prepare('UPDATE categories SET active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  auditLog('Desactivar categoría', `Desactivó categoría "${cat.name}" (ID: ${id})`);
  return { success: true };
}));

// ═══════════════════════════════════════════════════════════
// AUDITORÍA - recuperar logs (solo owner)
// ═══════════════════════════════════════════════════════════
ipcMain.handle('db:audit:getLogs', handleError(async (_, limit: number = 100, offset: number = 0) => {
  const logs = db.prepare(
    'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset) as Array<Record<string, unknown>>;
  const total = (db.prepare('SELECT COUNT(*) as count FROM audit_log').get() as { count: number }).count;
  return { logs, total };
}));

// ═══════════════════════════════════════════════════════════
// DASHBOARD - datos agregados
// ═══════════════════════════════════════════════════════════
ipcMain.handle('db:dashboard:summary', handleError(async () => {
  const today = new Date().toISOString().split('T')[0];

  const ventasHoy = db.prepare(`
    SELECT COALESCE(COUNT(*), 0) as count, COALESCE(SUM(total), 0) as total
    FROM sales WHERE date = ? AND active = 1
  `).get(today) as { count: number; total: number };

  const ventasSemana = db.prepare(`
    SELECT date, COALESCE(SUM(total), 0) as total
    FROM sales WHERE date >= date('now', '-7 days') AND active = 1
    GROUP BY date ORDER BY date
  `).all() as Array<{ date: string; total: number }>;

  const gastosHoy = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM expenses WHERE date = ? AND active = 1
  `).get(today) as { total: number };

  const totalProductos = db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1').get() as { count: number };
  const totalClientes = db.prepare('SELECT COUNT(*) as count FROM clients WHERE active = 1').get() as { count: number };
  const totalProveedores = db.prepare('SELECT COUNT(*) as count FROM suppliers WHERE active = 1').get() as { count: number };
  const totalEmpleados = db.prepare('SELECT COUNT(*) as count FROM employees WHERE active = 1').get() as { count: number };
  const deudaClientes = db.prepare('SELECT COALESCE(SUM(total_debt), 0) as total FROM clients WHERE active = 1').get() as { total: number };
  const stockBajo = db.prepare("SELECT COUNT(*) as count FROM products WHERE active = 1 AND stock <= min_stock AND stock > 0").get() as { count: number };
  const sinStock = db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1 AND stock = 0').get() as { count: number };

  const ventasRecientes = db.prepare(`
    SELECT s.id, s.date, s.total, s.payment_method, c.name as client_name
    FROM sales s LEFT JOIN clients c ON s.client_id = c.id
    WHERE s.active = 1
    ORDER BY s.id DESC LIMIT 5
  `).all() as Array<{ id: number; date: string; total: number; payment_method: string; client_name: string | null }>;

  const productosStockBajo = db.prepare(`
    SELECT id, name, stock, min_stock FROM products
    WHERE active = 1 AND stock <= min_stock ORDER BY stock ASC LIMIT 10
  `).all() as Array<{ id: number; name: string; stock: number; min_stock: number }>;

  const verificarCajaAbierta = db.prepare(`
    SELECT COUNT(*) as count FROM sales WHERE date = ? AND active = 1
  `).get(today) as { count: number };

  return {
    ventasHoy: ventasHoy.total,
    cantidadVentasHoy: ventasHoy.count,
    ventasSemana,
    gastosHoy: gastosHoy.total,
    totalProductos: totalProductos.count,
    totalClientes: totalClientes.count,
    totalProveedores: totalProveedores.count,
    totalEmpleados: totalEmpleados.count,
    deudaClientes: deudaClientes.total,
    stockBajo: stockBajo.count,
    sinStock: sinStock.count,
    ventasRecientes,
    productosStockBajo,
    hayVentasHoy: verificarCajaAbierta.count > 0,
  };
}));

ipcMain.handle('db:settings:get', handleError(async (_, key) => {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const result = stmt.get(key) as { value: string } | undefined;
  return result ? result.value : null;
}));

ipcMain.handle('db:settings:set', handleError(async (_, key, value) => {
  const old = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  const stmt = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?`);
  const result = stmt.run(key, value, value);
  if (result.changes > 0) auditLog('Cambiar configuración', `Cambió "${key}" de "${old?.value || '(vacío)'}" a "${value}"`);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:settings:getAll', handleError(async () => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings: Record<string, string> = {};
  for (const row of rows as Array<{ key: string; value: string }>) {
    settings[row.key] = row.value;
  }
  return settings;
}));

ipcMain.handle('db:recibos:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT * FROM recibos ORDER BY fecha_raw DESC, created_at DESC LIMIT ? OFFSET ?'
    : 'SELECT * FROM recibos ORDER BY fecha_raw DESC, created_at DESC';
  const params = limit ? [limit, offset || 0] : [];
  const rows = db.prepare(query).all(...params) as Array<Record<string, unknown>>;
  return rows.map(r => ({
    ...r,
    productos: typeof r.productos === 'string' ? JSON.parse(r.productos as string) : r.productos,
  }));
}));

ipcMain.handle('db:recibos:getById', handleError(async (_, id: string) => {
  const row = db.prepare('SELECT * FROM recibos WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return { ...row, productos: typeof row.productos === 'string' ? JSON.parse(row.productos as string) : row.productos };
}));

ipcMain.handle('db:recibos:save', handleError(async (_, recibo: any) => {
  // Validar con Zod
  const parsed = reciboSchema.parse(recibo);
  
  const safeRecibo = {
    id: parsed.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    numero: parsed.numero || `R-${Date.now()}`,
    fecha: parsed.fecha || new Date().toLocaleDateString(),
    fechaRaw: parsed.fechaRaw || new Date().toISOString(),
    hora: parsed.hora || new Date().toLocaleTimeString(),
    cliente: sanitize(parsed.cliente || 'Consumidor Final'),
    productos: JSON.stringify(parsed.productos || []),
    subtotal: parsed.subtotal ?? 0,
    iva: parsed.iva ?? 0,
    total: parsed.total ?? 0,
    metodoPago: parsed.metodoPago || 'Efectivo',
    vendedor: sanitize(parsed.vendedor || 'Vendedor'),
    negocioNombre: sanitize(parsed.negocioNombre || ''),
    negocioRuc: sanitize(parsed.negocioRuc || ''),
  };

  db.prepare(`
    INSERT INTO recibos (id, numero, fecha, fecha_raw, hora, cliente, productos, subtotal, iva, total, metodo_pago, vendedor, negocio_nombre, negocio_ruc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    safeRecibo.id, safeRecibo.numero, safeRecibo.fecha, safeRecibo.fechaRaw, safeRecibo.hora,
    safeRecibo.cliente, safeRecibo.productos, safeRecibo.subtotal, safeRecibo.iva,
    safeRecibo.total, safeRecibo.metodoPago, safeRecibo.vendedor, safeRecibo.negocioNombre, safeRecibo.negocioRuc
  );
  return { success: true };
}));

ipcMain.handle('db:recibos:search', handleError(async (_, query: string, limit?: number, offset?: number) => {
  const q = `%${query.toLowerCase()}%`;
  const sql = limit
    ? `SELECT * FROM recibos 
       WHERE LOWER(cliente) LIKE ? OR LOWER(numero) LIKE ? OR LOWER(vendedor) LIKE ?
       ORDER BY fecha_raw DESC, created_at DESC LIMIT ? OFFSET ?`
    : `SELECT * FROM recibos 
       WHERE LOWER(cliente) LIKE ? OR LOWER(numero) LIKE ? OR LOWER(vendedor) LIKE ?
       ORDER BY fecha_raw DESC, created_at DESC`;
  const params = limit ? [q, q, q, limit, offset || 0] : [q, q, q];
  const rows = db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
  return rows.map(r => ({
    ...r,
    productos: typeof r.productos === 'string' ? JSON.parse(r.productos as string) : r.productos,
  }));
}));

ipcMain.handle('db:recibos:delete', handleError(async (_, id: string) => {
  const result = db.prepare('DELETE FROM recibos WHERE id = ?').run(id);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:users:getByEmail', handleError(async (_, email) => {
  const stmt = db.prepare('SELECT id, name, username, email, role, created_at FROM users WHERE email = ? AND active = 1');
  return stmt.get(email);
}));

ipcMain.handle('db:users:delete', handleError(async (_, id: number) => {
  // Soft delete: no eliminar físicamente al usuario
  const user = db.prepare('SELECT name, role FROM users WHERE id = ?').get(id) as { name: string; role: string } | undefined;
  if (!user) return { success: false, error: 'Usuario no encontrado' };
  if (user.role === 'owner') return { success: false, error: 'No se puede desactivar al propietario' };
  // Evitar desactivarse a sí mismo
  if (currentSession?.id === id) return { success: false, error: 'No puedes desactivar tu propio usuario' };
  db.prepare('UPDATE users SET active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  auditLog('Desactivar usuario', `Desactivó al usuario "${user.name}" (ID: ${id})`);
  return { success: true };
}));

ipcMain.handle('db:users:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT id, name, username, email, role, created_at FROM users WHERE active = 1 ORDER BY name LIMIT ? OFFSET ?'
    : 'SELECT id, name, username, email, role, created_at FROM users WHERE active = 1 ORDER BY name';
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:users:login', handleError(async (_, username: string, password: string) => {
  let user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username) as Record<string, unknown> | undefined;

  if (!user) {
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(username) as Record<string, unknown> | undefined;
  }

  if (!user) return null;

  // ═══════════════════════════════════════════════════════════
  // BLOQUEO POR INTENTOS FALLIDOS
  // ═══════════════════════════════════════════════════════════
  const loginAttempts = (user.login_attempts as number) || 0;
  const lockedUntil = user.locked_until as string | null;

  if (lockedUntil) {
    const lockedTime = new Date(lockedUntil).getTime();
    if (Date.now() < lockedTime) {
      const minutesLeft = Math.ceil((lockedTime - Date.now()) / 60000);
      return {
        blocked: true,
        message: `Cuenta bloqueada. Intenta de nuevo en ${minutesLeft} minuto(s).`,
      };
    } else {
      // El tiempo de bloqueo expiró, resetear
      db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
    }
  }

  const storedPassword = user.password as string;
  let passwordMatch = false;

  if (storedPassword.startsWith('$2')) {
    passwordMatch = bcrypt.compareSync(password, storedPassword);
  } else {
    passwordMatch = (password === storedPassword);
    if (passwordMatch) {
      const hashed = bcrypt.hashSync(password, SALT_ROUNDS);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.id);
      console.log(`Contraseña migrada a bcrypt para: ${username}`);
    }
  }

  if (!passwordMatch) {
    const newAttempts = loginAttempts + 1;
    if (newAttempts >= 5) {
      // Bloquear por 15 minutos
      const lockTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      db.prepare('UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?').run(newAttempts, lockTime, user.id);
      auditLog('Bloqueo de cuenta', `Usuario ${username} bloqueado por 15 minutos (${newAttempts} intentos fallidos)`);
      return { blocked: true, message: 'Cuenta bloqueada por 15 minutos por demasiados intentos fallidos.' };
    } else {
      db.prepare('UPDATE users SET login_attempts = ? WHERE id = ?').run(newAttempts, user.id);
    }
    return null;
  }

  // Login exitoso — resetear contador
  db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
  auditLog('Inicio de sesión', `Usuario ${username} inició sesión`);

  return {
    id: user.id, name: user.name, username: user.username,
    email: user.email, role: user.role,
  };
}));

ipcMain.handle('db:users:create', handleError(async (_, data) => {
  // Validar con Zod
  const parsed = userSchema.parse(data);
  const hashedPassword = bcrypt.hashSync(parsed.password, SALT_ROUNDS);
  const stmt = db.prepare(`INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)`);
  const result = stmt.run(parsed.name, parsed.username, parsed.email, hashedPassword, parsed.role);
  auditLog('Crear usuario', `Creó al usuario "${parsed.name}" (${parsed.role})`);
  return { success: true, id: result.lastInsertRowid };
}));

ipcMain.handle('db:users:update', handleError(async (_, id: number, data) => {
  // Validar con Zod (partial)
  const parsed = userSchema.partial().parse(data);
  const updates: string[] = [];
  const params: any[] = [];

  if (parsed.name !== undefined) { updates.push('name = ?'); params.push(parsed.name); }
  if (parsed.username !== undefined) { updates.push('username = ?'); params.push(parsed.username); }
  if (parsed.email !== undefined) { updates.push('email = ?'); params.push(parsed.email); }
  if (parsed.role !== undefined) { updates.push('role = ?'); params.push(parsed.role); }
  if (parsed.password !== undefined) {
    const hashed = bcrypt.hashSync(parsed.password, SALT_ROUNDS);
    updates.push('password = ?');
    params.push(hashed);
  }

  if (updates.length === 0) return { success: true, message: 'Sin cambios' };

  params.push(id);
  const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ? AND active = 1`);
  const result = stmt.run(...params);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:users:findByUsername', handleError(async (_, username: string) => {
  const user = db.prepare('SELECT id, name, username, email, role FROM users WHERE username = ? AND active = 1').get(username);
  return user || null;
}));

// ═══════════════════════════════════════════════════════════
// DESBLOQUEO DE CUENTA (solo owner)
// ═══════════════════════════════════════════════════════════
ipcMain.handle('db:users:unlock', handleError(async (_, userId: number) => {
  db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?').run(userId);
  const user = db.prepare('SELECT id, name, username FROM users WHERE id = ?').get(userId) as { name: string; username: string } | undefined;
  if (user) auditLog('Desbloquear cuenta', `Desbloqueó la cuenta de "${user.name}" (${user.username})`);
  return { success: true };
}));

// ═══════════════════════════════════════════════════════════
// LISTAR USUARIOS BLOQUEADOS (solo owner)
// ═══════════════════════════════════════════════════════════
ipcMain.handle('db:users:getLocked', handleError(async () => {
  const now = new Date().toISOString();
  return db.prepare(
    "SELECT id, name, username, login_attempts, locked_until FROM users WHERE locked_until IS NOT NULL AND locked_until > ?"
  ).all(now);
}));

ipcMain.handle('db:business:getFirst', handleError(async () => {
  const stmt = db.prepare('SELECT * FROM business LIMIT 1');
  return stmt.get() || null;
}));

ipcMain.handle('db:business:update', handleError(async (_, data: {
  name: string; owner: string; phone: string; email: string;
  address: string; city: string; ruc: string;
}) => {
  const existing = db.prepare('SELECT id FROM business LIMIT 1').get() as { id: number } | undefined;
  if (existing) {
    db.prepare(`UPDATE business SET name=?, owner=?, phone=?, email=?, address=?, city=?, ruc=? WHERE id=?`)
      .run(data.name, data.owner, data.phone, data.email, data.address, data.city, data.ruc, existing.id);
  } else {
    db.prepare(`INSERT INTO business (name, owner, phone, email, address, city, ruc) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(data.name, data.owner, data.phone, data.email, data.address, data.city, data.ruc);
  }
  return { success: true };
}));

ipcMain.handle('db:system:getDbPath', handleError(async () => {
  const { dbPath } = await import('./database.js');
  return dbPath;
}));

// ═══════════════════════════════════════════════════════════
// TIPO DE NEGOCIO (expuesto al renderer)
// ═══════════════════════════════════════════════════════════
ipcMain.handle('db:system:getBusinessType', handleError(async () => {
  return currentBusinessType;
}));

// ═══════════════════════════════════════════════════════════
// VALIDACIÓN DE PERMISOS (expuesto al renderer)
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
ipcMain.handle('db:utils:validatePermission', handleError(async (_, channel: string, userRole: string) => {
  return { allowed: validatePermission(channel, userRole) };
}));

// ═══════════════════════════════════════════════════════════
// VERIFICACIÓN DE CONTRASEÑA (seguridad en operaciones sensibles)
// ═══════════════════════════════════════════════════════════
ipcMain.handle('db:utils:verifyPassword', handleError(async (_, password: string) => {
  // Verificar contra el usuario que tiene la sesión activa actualmente
  if (!currentSession) return { valid: false, error: 'No hay sesión activa' };

  const user = db.prepare("SELECT id, password FROM users WHERE id = ?").get(currentSession.id) as { id: number; password: string } | undefined;
  if (!user) return { valid: false, error: 'Usuario de sesión no encontrado' };

  const storedPassword = user.password;
  let match = false;

  if (storedPassword && storedPassword.startsWith('$2')) {
    match = bcrypt.compareSync(password, storedPassword);
  } else if (storedPassword) {
    match = (password === storedPassword);
    // Migrar a bcrypt si era texto plano
    if (match) {
      const hashed = bcrypt.hashSync(password, SALT_ROUNDS);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.id);
    }
  }

  return { valid: match };
}));

// ═══════════════════════════════════════════════════════════
// LISTA COMPLETA DE HANDLERS Y SUS PERMISOS (para depuración)
// ═══════════════════════════════════════════════════════════
ipcMain.handle('db:utils:getPermissionsMap', handleError(async () => {
  return HANDLER_PERMISSIONS;
}));

// ═══════════════════════════════════════════════════════════
// GENERACIÓN DE NÚMERO SECUENCIAL RIMPE (001-001-XXXXXX)
// ═══════════════════════════════════════════════════════════
ipcMain.handle('db:recibos:nextNumero', handleError(async () => {
  // Leer contador actual
  const row = db.prepare("SELECT value FROM settings WHERE key = 'recibo_secuencial'").get() as { value: string } | undefined;
  const current = row ? parseInt(row.value, 10) : 0;
  const next = current + 1;

  // Actualizar contador (UPDATE primero, si no afecta filas → INSERT)
  const updateResult = db.prepare("UPDATE settings SET value = ? WHERE key = 'recibo_secuencial'").run(String(next));
  if (updateResult.changes === 0) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('recibo_secuencial', ?)").run(String(next));
  }

  // Formato RIMPE oficial: 001-001-XXXXXX
  return `001-001-${String(next).padStart(6, '0')}`;
}));

function getBackupPath(dbPath: string): string {
  return dbPath.replace('.db', '.backup.db');
}

ipcMain.handle('db:backup:manual', handleError(async () => {
  const { dbPath: dp } = await import('./database.js');
  const backupPath = getBackupPath(dp);
  db.pragma('wal_checkpoint(TRUNCATE)');
  if (fs.existsSync(dp)) {
    fs.copyFileSync(dp, backupPath);
    return { success: true, path: backupPath };
  }
  return { success: false, error: 'La base de datos no existe' };
}));

ipcMain.handle('db:backup:restore', handleError(async () => {
  const { dbPath: dp } = await import('./database.js');
  const backupPath = getBackupPath(dp);
  if (!fs.existsSync(backupPath)) {
    return { success: false, error: 'No hay ningún backup disponible' };
  }
  db.close();
  fs.copyFileSync(backupPath, dp);
  return { success: true, message: 'Backup restaurado. Reinicia la aplicación para aplicar los cambios.' };
}));

ipcMain.handle('db:backup:info', handleError(async () => {
  const { dbPath: dp } = await import('./database.js');
  const backupPath = getBackupPath(dp);
  const exists = fs.existsSync(backupPath);
  let size = 0;
  let modified = '';
  if (exists) {
    const stats = fs.statSync(backupPath);
    size = stats.size;
    modified = stats.mtime.toLocaleString('es-ES');
  }
  return {
    exists, size, modified,
    mainDbSize: fs.existsSync(dp) ? fs.statSync(dp).size : 0,
  };
}));

ipcMain.handle('file:saveDialog', handleError(async (_, filename: string, buffer: ArrayBuffer) => {
  const result = await dialog.showSaveDialog({
    title: 'Guardar archivo',
    defaultPath: filename,
    filters: [
      { name: 'Excel', extensions: ['xlsx'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, Buffer.from(buffer));
    return true;
  }
  return false;
}));

console.log('IPC handlers registrados');
