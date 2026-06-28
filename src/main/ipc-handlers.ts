import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { db } from './database.js';

const SALT_ROUNDS = 10;

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
// SEGURIDAD: PERMISOS + AUDITORÍA + BLOQUEO
// ═══════════════════════════════════════════════════════════
// Mapa de permisos por canal IPC.
// Los canales NO listados aquí son accesibles por cualquier rol autenticado.
const HANDLER_PERMISSIONS: Record<string, string[]> = {
  // Usuarios — solo owner
  'db:users:create': ['owner'],
  'db:users:update': ['owner'],
  'db:users:delete': ['owner'],
  // Negocio — solo owner
  'db:business:update': ['owner'],
  // Empleados — solo owner
  'db:employees:create': ['owner'],
  'db:employees:update': ['owner'],
  'db:employees:delete': ['owner'],
  // Productos — escritura solo owner
  'db:products:create': ['owner'],
  'db:products:update': ['owner'],
  'db:products:delete': ['owner'],
  'db:products:updateStock': ['owner'],
  // Clientes — escritura solo owner
  'db:clients:create': ['owner'],
  'db:clients:update': ['owner'],
  'db:clients:delete': ['owner'],
  // Ventas — solo owner
  'db:sales:create': ['owner'],
  'db:sales:delete': ['owner'],
  // Proveedores — escritura solo owner
  'db:suppliers:create': ['owner'],
  'db:suppliers:update': ['owner'],
  'db:suppliers:delete': ['owner'],
  // Gastos — escritura solo owner
  'db:expenses:create': ['owner'],
  'db:expenses:update': ['owner'],
  'db:expenses:delete': ['owner'],
  // Categorías — escritura solo owner
  'db:categories:create': ['owner'],
  'db:categories:update': ['owner'],
  'db:categories:delete': ['owner'],
  // Configuración — solo owner
  'db:settings:set': ['owner'],
  // Backup — solo owner
  'db:backup:manual': ['owner'],
  'db:backup:restore': ['owner'],
  // Recibos — escritura (cualquier autenticado puede guardar recibos)
  'db:recibos:delete': ['owner'],
};

// Verifica si un rol tiene permiso para un canal.
function validatePermission(channel: string, userRole?: string): boolean {
  const requiredRoles = HANDLER_PERMISSIONS[channel];
  if (!requiredRoles) return true;
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

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
 * Envuelve handlers con try/catch y validación de permisos automática.
 * Usa la sesión del main process para verificar el rol.
 * No necesita que el renderer envíe el rol — es seguro.
 */
function handleError<T>(handler: (...args: any[]) => T) {
  return async (...args: any[]) => {
    try {
      // Obtener el channel desde el evento (primer arg)
      const event = args[0];
      const channel = event?.channel || '';
      
      // Validar permiso automáticamente según la sesión actual
      const role = getCurrentRole();
      const requiredRoles = HANDLER_PERMISSIONS[channel];
      if (requiredRoles && (!role || !requiredRoles.includes(role))) {
        console.warn(`[SEGURIDAD] Acceso denegado a '${channel}': se requiere uno de [${requiredRoles}], rol actual: '${role || 'ninguno'}'`);
        return { success: false, error: 'No tienes permisos para realizar esta operación' };
      }

      return await handler(...args);
    } catch (err: any) {
      console.error(`Error en IPC handler:`, err);
      return { success: false, error: err.message || 'Error interno del servidor' };
    }
  };
}

ipcMain.handle('db:products:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT * FROM products ORDER BY name LIMIT ? OFFSET ?'
    : 'SELECT * FROM products ORDER BY name';
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:products:getById', handleError(async (_, id) => {
  const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
  return stmt.get(id);
}));

ipcMain.handle('db:products:create', handleError(async (_, data) => {
  const stmt = db.prepare(`
    INSERT INTO products (name, price, cost, stock, category, size, color, barcode, min_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name, data.price, data.cost, data.stock || 0,
    data.category || '', data.size || '', data.color || '',
    data.barcode || '', data.min_stock || 5
  );
  return result.lastInsertRowid;
}));

ipcMain.handle('db:products:update', handleError(async (_, id, data) => {
  const stmt = db.prepare(`
    UPDATE products SET name=?, price=?, cost=?, stock=?, category=?, size=?, color=?, barcode=?, min_stock=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `);
  const result = stmt.run(
    data.name, data.price, data.cost, data.stock || 0,
    data.category || '', data.size || '', data.color || '',
    data.barcode || '', data.min_stock || 5, id
  );
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:products:delete', handleError(async (_, id) => {
  // Obtener nombre del producto antes de eliminar (para auditoría)
  const prod = db.prepare('SELECT name FROM products WHERE id = ?').get(id) as { name: string } | undefined;
  const deleteProduct = db.transaction((productId: number) => {
    db.prepare('DELETE FROM sale_items WHERE product_id = ?').run(productId);
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    return result.changes > 0;
  });
  const deleted = deleteProduct(id);
  if (deleted && prod) auditLog('Eliminar producto', `Eliminó el producto "${prod.name}" (ID: ${id})`);
  return { success: deleted };
}));

ipcMain.handle('db:products:updateStock', handleError(async (_, id, stock) => {
  const stmt = db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  const result = stmt.run(stock, id);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:clients:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT * FROM clients ORDER BY name LIMIT ? OFFSET ?'
    : 'SELECT * FROM clients ORDER BY name';
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:clients:getById', handleError(async (_, id) => {
  const stmt = db.prepare('SELECT * FROM clients WHERE id = ?');
  return stmt.get(id);
}));

ipcMain.handle('db:clients:create', handleError(async (_, data) => {
  const stmt = db.prepare(`
    INSERT INTO clients (name, phone, email, document, total_debt, total_purchases)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name, data.phone || '', data.email || '', data.document || '',
    data.total_debt || 0, data.total_purchases || 0
  );
  return result.lastInsertRowid;
}));

ipcMain.handle('db:clients:update', handleError(async (_, id, data) => {
  const stmt = db.prepare(`
    UPDATE clients SET name=?, phone=?, email=?, document=?, total_debt=?, total_purchases=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `);
  const result = stmt.run(
    data.name, data.phone || '', data.email || '', data.document || '',
    data.total_debt || 0, data.total_purchases || 0, id
  );
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:clients:delete', handleError(async (_, id) => {
  const client = db.prepare('SELECT name FROM clients WHERE id = ?').get(id) as { name: string } | undefined;
  const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
  const result = stmt.run(id);
  if (result.changes > 0 && client) auditLog('Eliminar cliente', `Eliminó el cliente "${client.name}" (ID: ${id})`);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:sales:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? `SELECT s.*, c.name as client_name, e.name as employee_name,
       (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = s.id) as items_count
     FROM sales s
     LEFT JOIN clients c ON s.client_id = c.id
     LEFT JOIN employees e ON s.employee_id = e.id
     ORDER BY s.date DESC, s.id DESC LIMIT ? OFFSET ?`
    : `SELECT s.*, c.name as client_name, e.name as employee_name,
       (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = s.id) as items_count
     FROM sales s
     LEFT JOIN clients c ON s.client_id = c.id
     LEFT JOIN employees e ON s.employee_id = e.id
     ORDER BY s.date DESC, s.id DESC`;
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:sales:getById', handleError(async (_, id) => {
  const sale = db.prepare(`
    SELECT s.*, c.name as client_name, e.name as employee_name FROM sales s
    LEFT JOIN clients c ON s.client_id = c.id
    LEFT JOIN employees e ON s.employee_id = e.id
    WHERE s.id = ?
  `).get(id) as Record<string, unknown> | undefined;

  const items = db.prepare(`
    SELECT si.*, p.name as product_name FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = ?
  `).all(id);

  return { ...(sale || {}), items };
}));

ipcMain.handle('db:sales:create', handleError(async (_, data) => {
  const insertSale = db.transaction((saleData: any) => {
    const stmt = db.prepare(`
      INSERT INTO sales (date, time, client_id, employee_id, subtotal, iva, total, payment_method, payment_reference, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      saleData.date, saleData.time, saleData.client_id || null, saleData.employee_id || null,
      saleData.subtotal, saleData.iva || 0, saleData.total,
      saleData.payment_method || 'Efectivo', saleData.payment_reference || '', saleData.status || 'completed'
    );
    const saleId = result.lastInsertRowid;

    for (const item of saleData.items) {
      db.prepare(`INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)`)
        .run(saleId, item.product_id, item.quantity, item.price, item.subtotal);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
        .run(item.quantity, item.product_id);
    }
    return saleId;
  });
  const saleId = insertSale(data);
  auditLog('Registrar venta', `Registró venta #${saleId} por $${data.total} (${data.payment_method})`);
  return saleId;
}));

ipcMain.handle('db:sales:getByDate', handleError(async (_, date, limit?: number, offset?: number) => {
  const query = limit
    ? `SELECT s.*, c.name as client_name,
       (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = s.id) as items_count
     FROM sales s LEFT JOIN clients c ON s.client_id = c.id
     WHERE s.date = ? ORDER BY s.id DESC LIMIT ? OFFSET ?`
    : `SELECT s.*, c.name as client_name,
       (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = s.id) as items_count
     FROM sales s LEFT JOIN clients c ON s.client_id = c.id
     WHERE s.date = ? ORDER BY s.id DESC`;
  return limit ? db.prepare(query).all(date, limit, offset || 0) : db.prepare(query).all(date);
}));

ipcMain.handle('db:sales:getByDateRange', handleError(async (_, start, end, limit?: number, offset?: number) => {
  const query = limit
    ? `SELECT s.*, c.name as client_name FROM sales s
     LEFT JOIN clients c ON s.client_id = c.id
     WHERE s.date BETWEEN ? AND ? ORDER BY s.date DESC LIMIT ? OFFSET ?`
    : `SELECT s.*, c.name as client_name FROM sales s
     LEFT JOIN clients c ON s.client_id = c.id
     WHERE s.date BETWEEN ? AND ? ORDER BY s.date DESC`;
  return limit ? db.prepare(query).all(start, end, limit, offset || 0) : db.prepare(query).all(start, end);
}));

ipcMain.handle('db:sales:update', handleError(async (_, id: number, data: any) => {
  const stmt = db.prepare(`
    UPDATE sales SET date=?, time=?, client_id=?, employee_id=?, subtotal=?, iva=?, total=?, payment_method=?, payment_reference=?, status=?
    WHERE id=?
  `);
  const result = stmt.run(
    data.date, data.time, data.client_id || null, data.employee_id || null,
    data.subtotal || 0, data.iva || 0, data.total || 0,
    data.payment_method || 'Efectivo', data.payment_reference || '', data.status || 'completed', id
  );
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:sales:delete', handleError(async (_, id: number) => {
  const deleteSale = db.transaction((saleId: number) => {
    // Restaurar stock antes de eliminar
    const items = db.prepare('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?').all(saleId) as Array<{ product_id: number; quantity: number }>;
    for (const item of items) {
      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id);
    }
    db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(saleId);
    const result = db.prepare('DELETE FROM sales WHERE id = ?').run(saleId);
    return result.changes > 0;
  });
  return { success: deleteSale(id) };
}));

ipcMain.handle('db:employees:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT * FROM employees ORDER BY name LIMIT ? OFFSET ?'
    : 'SELECT * FROM employees ORDER BY name';
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:employees:getById', handleError(async (_, id) => {
  const stmt = db.prepare('SELECT * FROM employees WHERE id = ?');
  return stmt.get(id);
}));

ipcMain.handle('db:employees:create', handleError(async (_, data) => {
  const stmt = db.prepare(`
    INSERT INTO employees (name, phone, email, role, status, hire_date, salary, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name, data.phone || '', data.email || '', data.role || 'employee',
    data.status || 'active', data.hire_date || new Date().toISOString().split('T')[0],
    data.salary || 0, data.notes || ''
  );
  auditLog('Crear empleado', `Creó al empleado "${data.name}"`);
  return result.lastInsertRowid;
}));

ipcMain.handle('db:employees:update', handleError(async (_, id, data) => {
  const old = db.prepare('SELECT name FROM employees WHERE id = ?').get(id) as { name: string } | undefined;
  const stmt = db.prepare(`
    UPDATE employees SET name=?, phone=?, email=?, role=?, status=?, hire_date=?, salary=?, notes=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `);
  const result = stmt.run(
    data.name, data.phone || '', data.email || '', data.role || 'employee',
    data.status || 'active', data.hire_date || new Date().toISOString().split('T')[0],
    data.salary || 0, data.notes || '', id
  );
  if (result.changes > 0) auditLog('Editar empleado', `Editó al empleado "${old?.name || id}"`);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:employees:delete', handleError(async (_, id) => {
  const emp = db.prepare('SELECT name FROM employees WHERE id = ?').get(id) as { name: string } | undefined;
  const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
  const result = stmt.run(id);
  if (result.changes > 0 && emp) auditLog('Eliminar empleado', `Eliminó al empleado "${emp.name}" (ID: ${id})`);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:suppliers:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT * FROM suppliers ORDER BY name LIMIT ? OFFSET ?'
    : 'SELECT * FROM suppliers ORDER BY name';
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:suppliers:getById', handleError(async (_, id) => {
  const stmt = db.prepare('SELECT * FROM suppliers WHERE id = ?');
  return stmt.get(id);
}));

ipcMain.handle('db:suppliers:create', handleError(async (_, data) => {
  const stmt = db.prepare(`
    INSERT INTO suppliers (name, phone, contact_person, city, address, products_type, notes, total_purchases, total_pending, last_purchase)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name, data.phone || '', data.contact_person || '', data.city || '',
    data.address || '', data.products_type || '', data.notes || '',
    data.total_purchases || 0, data.total_pending || 0, data.last_purchase || null
  );
  return result.lastInsertRowid;
}));

ipcMain.handle('db:suppliers:update', handleError(async (_, id, data) => {
  const stmt = db.prepare(`
    UPDATE suppliers SET name=?, phone=?, contact_person=?, city=?, address=?, products_type=?, notes=?, total_purchases=?, total_pending=?, last_purchase=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `);
  const result = stmt.run(
    data.name, data.phone || '', data.contact_person || '', data.city || '',
    data.address || '', data.products_type || '', data.notes || '',
    data.total_purchases || 0, data.total_pending || 0, data.last_purchase || null, id
  );
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:suppliers:delete', handleError(async (_, id) => {
  const stmt = db.prepare('DELETE FROM suppliers WHERE id = ?');
  const result = stmt.run(id);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:expenses:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT * FROM expenses ORDER BY date DESC LIMIT ? OFFSET ?'
    : 'SELECT * FROM expenses ORDER BY date DESC';
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:expenses:getById', handleError(async (_, id: number) => {
  const stmt = db.prepare('SELECT * FROM expenses WHERE id = ?');
  return stmt.get(id);
}));

ipcMain.handle('db:expenses:create', handleError(async (_, data) => {
  const stmt = db.prepare(`
    INSERT INTO expenses (date, category, description, amount, payment_method, supplier_id, city, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.date, data.category, data.description, data.amount,
    data.payment_method || 'cash', data.supplier_id || null, data.city || '', data.notes || ''
  );
  auditLog('Registrar gasto', `Registró gasto "${data.description}" por $${data.amount}`);
  return result.lastInsertRowid;
}));

ipcMain.handle('db:expenses:update', handleError(async (_, id, data) => {
  const stmt = db.prepare(`
    UPDATE expenses SET date=?, category=?, description=?, amount=?, payment_method=?, supplier_id=?, city=?, notes=?
    WHERE id=?
  `);
  const result = stmt.run(
    data.date, data.category, data.description, data.amount,
    data.payment_method || 'cash', data.supplier_id || null, data.city || '', data.notes || '', id
  );
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:expenses:delete', handleError(async (_, id) => {
  const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
  const result = stmt.run(id);
  return { success: result.changes > 0 };
}));

// ═══════════════════════════════════════════════════════════
// CATEGORÍAS
// ═══════════════════════════════════════════════════════════
ipcMain.handle('db:categories:getAll', handleError(async () => {
  return db.prepare('SELECT * FROM categories ORDER BY name').all();
}));

ipcMain.handle('db:categories:create', handleError(async (_, data) => {
  const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const result = stmt.run(data.name);
  return result.lastInsertRowid;
}));

ipcMain.handle('db:categories:update', handleError(async (_, id, data) => {
  const stmt = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
  const result = stmt.run(data.name, id);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:categories:delete', handleError(async (_, id) => {
  const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
  const result = stmt.run(id);
  return { success: result.changes > 0 };
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
    FROM sales WHERE date = ?
  `).get(today) as { count: number; total: number };

  const ventasSemana = db.prepare(`
    SELECT date, COALESCE(SUM(total), 0) as total
    FROM sales WHERE date >= date('now', '-7 days')
    GROUP BY date ORDER BY date
  `).all() as Array<{ date: string; total: number }>;

  const gastosHoy = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM expenses WHERE date = ?
  `).get(today) as { total: number };

  const totalProductos = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const totalClientes = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
  const totalProveedores = db.prepare('SELECT COUNT(*) as count FROM suppliers').get() as { count: number };
  const totalEmpleados = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };
  const deudaClientes = db.prepare('SELECT COALESCE(SUM(total_debt), 0) as total FROM clients').get() as { total: number };
  const stockBajo = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock <= min_stock AND stock > 0").get() as { count: number };
  const sinStock = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock = 0').get() as { count: number };

  const ventasRecientes = db.prepare(`
    SELECT s.id, s.date, s.total, s.payment_method, c.name as client_name
    FROM sales s LEFT JOIN clients c ON s.client_id = c.id
    ORDER BY s.id DESC LIMIT 5
  `).all() as Array<{ id: number; date: string; total: number; payment_method: string; client_name: string | null }>;

  const productosStockBajo = db.prepare(`
    SELECT id, name, stock, min_stock FROM products
    WHERE stock <= min_stock ORDER BY stock ASC LIMIT 10
  `).all() as Array<{ id: number; name: string; stock: number; min_stock: number }>;

  const verificarCajaAbierta = db.prepare(`
    SELECT COUNT(*) as count FROM sales WHERE date = ?
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
  // Asegurar valores por defecto para evitar NOT NULL constraint
  const safeRecibo = {
    id: recibo.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    numero: recibo.numero || `R-${Date.now()}`,
    fecha: recibo.fecha || new Date().toLocaleDateString(),
    fechaRaw: recibo.fechaRaw || new Date().toISOString(),
    hora: recibo.hora || new Date().toLocaleTimeString(),
    cliente: recibo.cliente || 'Consumidor Final',
    productos: JSON.stringify(recibo.productos || []),
    subtotal: recibo.subtotal ?? 0,
    iva: recibo.iva ?? 0,
    total: recibo.total ?? 0,
    metodoPago: recibo.metodoPago || 'Efectivo',
    vendedor: recibo.vendedor || 'Vendedor',
    negocioNombre: recibo.negocioNombre || '',
    negocioRuc: recibo.negocioRuc || '',
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
  const stmt = db.prepare('SELECT id, name, username, email, role, created_at FROM users WHERE email = ?');
  return stmt.get(email);
}));

ipcMain.handle('db:users:delete', handleError(async (_, id: number) => {
  // No permitir eliminar al propietario
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(id) as { role: string } | undefined;
  if (!user) return { success: false, error: 'Usuario no encontrado' };
  if (user.role === 'owner') return { success: false, error: 'No se puede eliminar al propietario' };
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:users:getAll', handleError(async (_, limit?: number, offset?: number) => {
  const query = limit
    ? 'SELECT id, name, username, email, role, created_at FROM users ORDER BY name LIMIT ? OFFSET ?'
    : 'SELECT id, name, username, email, role, created_at FROM users ORDER BY name';
  return limit ? db.prepare(query).all(limit, offset || 0) : db.prepare(query).all();
}));

ipcMain.handle('db:users:login', handleError(async (_, username: string, password: string) => {
  let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as Record<string, unknown> | undefined;

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

ipcMain.handle('db:users:create', handleError(async (_, data: {
  name: string; username: string; email: string; password: string; role: string;
}) => {
  const hashedPassword = bcrypt.hashSync(data.password, SALT_ROUNDS);
  const stmt = db.prepare(`INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)`);
  const result = stmt.run(data.name, data.username, data.email, hashedPassword, data.role);
  return { success: true, id: result.lastInsertRowid };
}));

ipcMain.handle('db:users:update', handleError(async (_, id: number, data: {
  name?: string; username?: string; email?: string; password?: string; role?: string;
}) => {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
  if (data.username !== undefined) { updates.push('username = ?'); params.push(data.username); }
  if (data.email !== undefined) { updates.push('email = ?'); params.push(data.email); }
  if (data.role !== undefined) { updates.push('role = ?'); params.push(data.role); }
  if (data.password !== undefined) {
    const hashed = bcrypt.hashSync(data.password, SALT_ROUNDS);
    updates.push('password = ?');
    params.push(hashed);
  }

  if (updates.length === 0) return { success: true, message: 'Sin cambios' };

  params.push(id);
  const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
  const result = stmt.run(...params);
  return { success: result.changes > 0 };
}));

ipcMain.handle('db:users:findByUsername', handleError(async (_, username: string) => {
  const user = db.prepare('SELECT id, name, username, email, role FROM users WHERE username = ?').get(username);
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
// VALIDACIÓN DE PERMISOS (expuesto al renderer)
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
