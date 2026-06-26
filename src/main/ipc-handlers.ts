import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { db } from './database.js';

const SALT_ROUNDS = 10;

// ============================================
// PRODUCTOS
// ============================================
ipcMain.handle('db:products:getAll', async () => {
  const stmt = db.prepare('SELECT * FROM products ORDER BY name');
  return stmt.all();
});

ipcMain.handle('db:products:getById', async (_, id) => {
  const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
  return stmt.get(id);
});

ipcMain.handle('db:products:create', async (_, data) => {
  const stmt = db.prepare(`
    INSERT INTO products (name, price, cost, stock, category, size, color, barcode, min_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.price,
    data.cost,
    data.stock || 0,
    data.category || '',
    data.size || '',
    data.color || '',
    data.barcode || '',
    data.min_stock || 5
  );
  return result.lastInsertRowid;
});

ipcMain.handle('db:products:update', async (_, id, data) => {
  const stmt = db.prepare(`
    UPDATE products 
    SET name = ?, price = ?, cost = ?, stock = ?, category = ?, size = ?, color = ?, barcode = ?, min_stock = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(
    data.name,
    data.price,
    data.cost,
    data.stock || 0,
    data.category || '',
    data.size || '',
    data.color || '',
    data.barcode || '',
    data.min_stock || 5,
    id
  );
  return result.changes > 0;
});

ipcMain.handle('db:products:delete', async (_, id) => {
  const deleteProduct = db.transaction((productId: number) => {
    // Primero eliminar referencias en sale_items
    db.prepare('DELETE FROM sale_items WHERE product_id = ?').run(productId);
    // Luego eliminar el producto
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    return result.changes > 0;
  });
  return deleteProduct(id);
});

ipcMain.handle('db:products:updateStock', async (_, id, stock) => {
  const stmt = db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  const result = stmt.run(stock, id);
  return result.changes > 0;
});

// ============================================
// CLIENTES
// ============================================
ipcMain.handle('db:clients:getAll', async () => {
  const stmt = db.prepare('SELECT * FROM clients ORDER BY name');
  return stmt.all();
});

ipcMain.handle('db:clients:getById', async (_, id) => {
  const stmt = db.prepare('SELECT * FROM clients WHERE id = ?');
  return stmt.get(id);
});

ipcMain.handle('db:clients:create', async (_, data) => {
  const stmt = db.prepare(`
    INSERT INTO clients (name, phone, email, document, total_debt, total_purchases)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.phone || '',
    data.email || '',
    data.document || '',
    data.total_debt || 0,
    data.total_purchases || 0
  );
  return result.lastInsertRowid;
});

ipcMain.handle('db:clients:update', async (_, id, data) => {
  const stmt = db.prepare(`
    UPDATE clients 
    SET name = ?, phone = ?, email = ?, document = ?, total_debt = ?, total_purchases = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(
    data.name,
    data.phone || '',
    data.email || '',
    data.document || '',
    data.total_debt || 0,
    data.total_purchases || 0,
    id
  );
  return result.changes > 0;
});

ipcMain.handle('db:clients:delete', async (_, id) => {
  const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
});

// ============================================
// VENTAS
// ============================================
ipcMain.handle('db:sales:getAll', async () => {
  const stmt = db.prepare(`
    SELECT s.*, c.name as client_name, e.name as employee_name 
    FROM sales s
    LEFT JOIN clients c ON s.client_id = c.id
    LEFT JOIN employees e ON s.employee_id = e.id
    ORDER BY s.date DESC, s.id DESC
  `);
  return stmt.all();
});

ipcMain.handle('db:sales:getById', async (_, id) => {
  const sale = db.prepare(`
    SELECT s.*, c.name as client_name, e.name as employee_name 
    FROM sales s
    LEFT JOIN clients c ON s.client_id = c.id
    LEFT JOIN employees e ON s.employee_id = e.id
    WHERE s.id = ?
  `).get(id) as Record<string, unknown> | undefined;
  
  const items = db.prepare(`
    SELECT si.*, p.name as product_name 
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = ?
  `).all(id);
  
  return { ...(sale || {}), items };
});

ipcMain.handle('db:sales:create', async (_, data) => {
  // Iniciar transacción
  const insertSale = db.transaction((saleData: any) => {
    // Insertar la venta
    const stmt = db.prepare(`
      INSERT INTO sales (date, time, client_id, employee_id, subtotal, iva, total, payment_method, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      saleData.date,
      saleData.time,
      saleData.client_id || null,
      saleData.employee_id || null,
      saleData.subtotal,
      saleData.iva || 0,
      saleData.total,
      saleData.payment_method || 'Efectivo',
      saleData.status || 'completed'
    );
    const saleId = result.lastInsertRowid;

    // Insertar los items
    for (const item of saleData.items) {
      db.prepare(`
        INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `).run(saleId, item.product_id, item.quantity, item.price, item.subtotal);

      // Actualizar stock del producto
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
        .run(item.quantity, item.product_id);
    }

    return saleId;
  });

  return insertSale(data);
});

ipcMain.handle('db:sales:getByDate', async (_, date) => {
  const stmt = db.prepare(`
    SELECT s.*, c.name as client_name,
      (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
    FROM sales s
    LEFT JOIN clients c ON s.client_id = c.id
    WHERE s.date = ?
    ORDER BY s.id DESC
  `);
  return stmt.all(date);
});

ipcMain.handle('db:sales:getByDateRange', async (_, start, end) => {
  const stmt = db.prepare(`
    SELECT s.*, c.name as client_name 
    FROM sales s
    LEFT JOIN clients c ON s.client_id = c.id
    WHERE s.date BETWEEN ? AND ?
    ORDER BY s.date DESC
  `);
  return stmt.all(start, end);
});

// ============================================
// EMPLEADOS
// ============================================
ipcMain.handle('db:employees:getAll', async () => {
  const stmt = db.prepare('SELECT * FROM employees ORDER BY name');
  return stmt.all();
});

ipcMain.handle('db:employees:getById', async (_, id) => {
  const stmt = db.prepare('SELECT * FROM employees WHERE id = ?');
  return stmt.get(id);
});

ipcMain.handle('db:employees:create', async (_, data) => {
  const stmt = db.prepare(`
    INSERT INTO employees (name, phone, email, role, status, hire_date, salary, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.phone || '',
    data.email || '',
    data.role || 'employee',
    data.status || 'active',
    data.hire_date || new Date().toISOString().split('T')[0],
    data.salary || 0,
    data.notes || ''
  );
  return result.lastInsertRowid;
});

ipcMain.handle('db:employees:update', async (_, id, data) => {
  const stmt = db.prepare(`
    UPDATE employees 
    SET name = ?, phone = ?, email = ?, role = ?, status = ?, hire_date = ?, salary = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(
    data.name,
    data.phone || '',
    data.email || '',
    data.role || 'employee',
    data.status || 'active',
    data.hire_date || new Date().toISOString().split('T')[0],
    data.salary || 0,
    data.notes || '',
    id
  );
  return result.changes > 0;
});

ipcMain.handle('db:employees:delete', async (_, id) => {
  const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
});

// ============================================
// PROVEEDORES
// ============================================
ipcMain.handle('db:suppliers:getAll', async () => {
  const stmt = db.prepare('SELECT * FROM suppliers ORDER BY name');
  return stmt.all();
});

ipcMain.handle('db:suppliers:getById', async (_, id) => {
  const stmt = db.prepare('SELECT * FROM suppliers WHERE id = ?');
  return stmt.get(id);
});

ipcMain.handle('db:suppliers:create', async (_, data) => {
  const stmt = db.prepare(`
    INSERT INTO suppliers (name, phone, contact_person, city, address, products_type, notes, total_purchases, total_pending, last_purchase)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.phone || '',
    data.contact_person || '',
    data.city || '',
    data.address || '',
    data.products_type || '',
    data.notes || '',
    data.total_purchases || 0,
    data.total_pending || 0,
    data.last_purchase || null
  );
  return result.lastInsertRowid;
});

ipcMain.handle('db:suppliers:update', async (_, id, data) => {
  const stmt = db.prepare(`
    UPDATE suppliers 
    SET name = ?, phone = ?, contact_person = ?, city = ?, address = ?, products_type = ?, notes = ?, total_purchases = ?, total_pending = ?, last_purchase = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(
    data.name,
    data.phone || '',
    data.contact_person || '',
    data.city || '',
    data.address || '',
    data.products_type || '',
    data.notes || '',
    data.total_purchases || 0,
    data.total_pending || 0,
    data.last_purchase || null,
    id
  );
  return result.changes > 0;
});

ipcMain.handle('db:suppliers:delete', async (_, id) => {
  const stmt = db.prepare('DELETE FROM suppliers WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
});

// ============================================
// GASTOS
// ============================================
ipcMain.handle('db:expenses:getAll', async () => {
  const stmt = db.prepare('SELECT * FROM expenses ORDER BY date DESC');
  return stmt.all();
});

ipcMain.handle('db:expenses:create', async (_, data) => {
  const stmt = db.prepare(`
    INSERT INTO expenses (date, category, description, amount, payment_method, supplier_id, city, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.date,
    data.category,
    data.description,
    data.amount,
    data.payment_method || 'cash',
    data.supplier_id || null,
    data.city || '',
    data.notes || ''
  );
  return result.lastInsertRowid;
});

ipcMain.handle('db:expenses:update', async (_, id, data) => {
  const stmt = db.prepare(`
    UPDATE expenses 
    SET date = ?, category = ?, description = ?, amount = ?, payment_method = ?, supplier_id = ?, city = ?, notes = ?
    WHERE id = ?
  `);
  const result = stmt.run(
    data.date,
    data.category,
    data.description,
    data.amount,
    data.payment_method || 'cash',
    data.supplier_id || null,
    data.city || '',
    data.notes || '',
    id
  );
  return result.changes > 0;
});

ipcMain.handle('db:expenses:delete', async (_, id) => {
  const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
});

// ============================================
// CONFIGURACIÓN
// ============================================
ipcMain.handle('db:settings:get', async (_, key) => {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const result = stmt.get(key) as { value: string } | undefined;
  return result ? result.value : null;
});

ipcMain.handle('db:settings:set', async (_, key, value) => {
  const stmt = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = ?
  `);
  const result = stmt.run(key, value, value);
  return result.changes > 0;
});

ipcMain.handle('db:settings:getAll', async () => {
  const stmt = db.prepare('SELECT * FROM settings');
  const rows = stmt.all();
  const settings: Record<string, string> = {};
  rows.forEach((row: any) => {
    settings[row.key] = row.value;
  });
  return settings;
});

// ============================================
// USUARIOS
// ============================================
ipcMain.handle('db:users:getByEmail', async (_, email) => {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
});

ipcMain.handle('db:users:getAll', async () => {
  const stmt = db.prepare('SELECT id, name, username, email, role, created_at FROM users');
  return stmt.all();
});

ipcMain.handle('db:users:login', async (_, username: string, password: string) => {
  // Buscar usuario por username
  let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as Record<string, unknown> | undefined;
  
  // Si no encuentra, intentar por email (compatibilidad)
  if (!user) {
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(username) as Record<string, unknown> | undefined;
  }
  
  if (!user) return null;

  const storedPassword = user.password as string;
  let passwordMatch = false;

  // Verificar si es bcrypt (empieza con $2a$ o $2b$)
  if (storedPassword.startsWith('$2')) {
    passwordMatch = bcrypt.compareSync(password, storedPassword);
  } else {
    // Migración automática: contraseña en texto plano → bcrypt
    passwordMatch = (password === storedPassword);
    if (passwordMatch) {
      const hashed = bcrypt.hashSync(password, SALT_ROUNDS);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.id);
      console.log(`✅ Contraseña migrada a bcrypt para: ${username}`);
    }
  }

  if (!passwordMatch) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  };
});

// ============================================
// USUARIOS - Crear (para empleados nuevos)
// ============================================
ipcMain.handle('db:users:create', async (_, data: {
  name: string; username: string; email: string; password: string; role: string;
}) => {
  try {
    const hashedPassword = bcrypt.hashSync(data.password, SALT_ROUNDS);
    const stmt = db.prepare(`
      INSERT INTO users (name, username, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(data.name, data.username, data.email, hashedPassword, data.role);
    return { success: true, id: result.lastInsertRowid };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// ============================================
// NEGOCIO
// ============================================
ipcMain.handle('db:business:getFirst', async () => {
  const stmt = db.prepare('SELECT * FROM business LIMIT 1');
  return stmt.get() || null;
});

ipcMain.handle('db:business:update', async (_, data: {
  name: string; owner: string; phone: string; email: string;
  address: string; city: string; ruc: string;
}) => {
  const existing = db.prepare('SELECT id FROM business LIMIT 1').get() as { id: number } | undefined;
  if (existing) {
    db.prepare(`
      UPDATE business SET name=?, owner=?, phone=?, email=?, address=?, city=?, ruc=?
      WHERE id=?
    `).run(data.name, data.owner, data.phone, data.email, data.address, data.city, data.ruc, existing.id);
  } else {
    db.prepare(`
      INSERT INTO business (name, owner, phone, email, address, city, ruc)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.name, data.owner, data.phone, data.email, data.address, data.city, data.ruc);
  }
  return true;
});

console.log('✅ IPC handlers registrados');

// ============================================
// ARCHIVOS (Exportar Excel, etc.)
// ============================================
ipcMain.handle('file:saveDialog', async (_, filename: string, buffer: ArrayBuffer) => {
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
});