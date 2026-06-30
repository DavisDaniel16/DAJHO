import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// Backup al iniciar para proteger contra corrupción de la sesión anterior
function realizarBackup(dbPath: string): void {
  try {
    const backupPath = dbPath.replace('.db', '.backup.db');
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      console.log('Backup automático creado:', backupPath);
    }
  } catch (err) {
    console.error('Error al crear backup:', err);
  }
}

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'database.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

realizarBackup(dbPath);

let db: Database.Database;

try {
  db = new Database(dbPath);

  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'employee',
      business_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migración: agregar columna username a BD existentes de versiones anteriores
  const tableInfo = db.prepare("PRAGMA table_info('users')").all() as Array<{ name: string }>;
  const hasUsernameColumn = tableInfo.some(col => col.name === 'username');
  if (!hasUsernameColumn) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN username TEXT NOT NULL DEFAULT ''`);
      db.exec(`UPDATE users SET username = LOWER(SUBSTR(email, 1, INSTR(email, '@') - 1)) WHERE username = ''`);
      const duplicates = db.prepare(`
        SELECT username FROM users GROUP BY username HAVING COUNT(*) > 1
      `).all() as Array<{ username: string }>;
      for (const dup of duplicates) {
        const dupsToFix = db.prepare(`
          SELECT id FROM users WHERE username = ? ORDER BY id
        `).all(dup.username) as Array<{ id: number }>;
        for (let i = 1; i < dupsToFix.length; i++) {
          db.prepare(`UPDATE users SET username = ? || ? WHERE id = ?`)
            .run(dup.username, i + 1, dupsToFix[i].id);
        }
      }
      console.log('Columna username agregada a users');
    } catch (err) {
      console.error('Error al migrar columna username:', err);
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS business (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      owner TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      ruc TEXT,
      logo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      size TEXT,
      color TEXT,
      barcode TEXT,
      min_stock INTEGER DEFAULT 5,
      business_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES business(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      document TEXT,
      total_debt REAL DEFAULT 0,
      total_purchases REAL DEFAULT 0,
      business_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES business(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      role TEXT DEFAULT 'employee',
      status TEXT DEFAULT 'active',
      hire_date DATE,
      salary REAL DEFAULT 0,
      sales_count INTEGER DEFAULT 0,
      notes TEXT,
      business_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES business(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      time TEXT,
      client_id INTEGER,
      employee_id INTEGER,
      subtotal REAL DEFAULT 0,
      iva REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_method TEXT,
      status TEXT DEFAULT 'completed',
      business_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (business_id) REFERENCES business(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      contact_person TEXT,
      city TEXT,
      address TEXT,
      products_type TEXT,
      notes TEXT,
      total_purchases REAL DEFAULT 0,
      total_pending REAL DEFAULT 0,
      last_purchase DATE,
      business_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES business(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      supplier_id INTEGER,
      city TEXT,
      notes TEXT,
      business_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (business_id) REFERENCES business(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      business_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES business(id)
    )
  `);

  // Insertar categorías por defecto si no existen
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const defaultCategories = [
      'Camisas', 'Pantalones', 'Zapatos', 'Accesorios',
      'Polos', 'Chaquetas', 'Vestidos', 'Ropa Interior', 'General'
    ];
    const insertCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
    for (const cat of defaultCategories) {
      insertCat.run(cat);
    }
    console.log('Categorías por defecto creadas');
  }

  // ═══════════════════════════════════════════════════════════
  // TABLA DE AUDITORÍA
  // ═══════════════════════════════════════════════════════════
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL DEFAULT 'Desconocido',
      action TEXT NOT NULL,
      details TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Migración: agregar columnas de bloqueo a users
  const usersColumns = db.prepare("PRAGMA table_info('users')").all() as Array<{ name: string }>;
  const hasLoginAttempts = usersColumns.some(col => col.name === 'login_attempts');
  if (!hasLoginAttempts) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0`);
      db.exec(`ALTER TABLE users ADD COLUMN locked_until DATETIME DEFAULT NULL`);
      console.log('Columnas de bloqueo agregadas a users');
    } catch (err) {
      console.error('Error al migrar columnas de bloqueo:', err);
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      business_id INTEGER,
      FOREIGN KEY (business_id) REFERENCES business(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS recibos (
      id TEXT PRIMARY KEY,
      numero TEXT NOT NULL,
      fecha TEXT NOT NULL,
      fecha_raw TEXT NOT NULL,
      hora TEXT NOT NULL,
      cliente TEXT NOT NULL DEFAULT 'Consumidor Final',
      productos TEXT NOT NULL DEFAULT '[]',
      subtotal REAL NOT NULL DEFAULT 0,
      iva REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      metodo_pago TEXT NOT NULL DEFAULT 'Efectivo',
      vendedor TEXT NOT NULL DEFAULT 'Vendedor',
      negocio_nombre TEXT NOT NULL DEFAULT '',
      negocio_ruc TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
    CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_clients_business ON clients(business_id);
    CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_business ON expenses(business_id);
    CREATE INDEX IF NOT EXISTS idx_employees_business ON employees(business_id);
    CREATE INDEX IF NOT EXISTS idx_suppliers_business ON suppliers(business_id);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
    -- Índices para soft delete (active = 1)
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
    CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);
    CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);
    CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);
    CREATE INDEX IF NOT EXISTS idx_expenses_active ON expenses(active);
    CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);
    CREATE INDEX IF NOT EXISTS idx_sales_active ON sales(active);
    CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
    -- Índice compuesto para queries frecuentes con soft delete
    CREATE INDEX IF NOT EXISTS idx_products_active_name ON products(active, name);
    CREATE INDEX IF NOT EXISTS idx_clients_active_name ON clients(active, name);
    CREATE INDEX IF NOT EXISTS idx_sales_active_date ON sales(active, date);
    CREATE INDEX IF NOT EXISTS idx_expenses_active_date ON expenses(active, date);
  `);

  // ═══════════════════════════════════════════════════════════
  // INICIALIZACIÓN: Solo crea lo esencial para que la app funcione.
  // NO se crean datos de negocio, empleados ni seed data.
  // El propietario configura todo desde la interfaz.
  // ═══════════════════════════════════════════════════════════

  // Crear usuario propietario si no existe ninguno
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  if (userCount.count === 0) {
    const hashPw = (pw: string) => bcrypt.hashSync(pw, 10);
    db.exec(`
      INSERT INTO users (name, username, email, password, role) VALUES 
      ('Propietario', 'propietario', 'propietario@dajho.com', '${hashPw('propietario123')}', 'owner')
    `);
    console.log('Usuario Propietario creado');
  } else {
    const ownerExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('propietario') as { count: number };
    if (ownerExists.count === 0) {
      const hashPw = (pw: string) => bcrypt.hashSync(pw, 10);
      db.exec(`
        INSERT INTO users (name, username, email, password, role) VALUES 
        ('Propietario', 'propietario', 'propietario@dajho.com', '${hashPw('propietario123')}', 'owner')
      `);
      console.log('Usuario Propietario agregado (migración)');
    }
  }

  // Settings por defecto (solo los técnicamente necesarios)
  const defaultSettings: Record<string, string> = {
    iva_porcentaje: '12',
    app_language: 'es',
    recibo_secuencial: '0',
  };
  for (const [key, value] of Object.entries(defaultSettings)) {
    const exists = db.prepare('SELECT COUNT(*) as count FROM settings WHERE key = ?').get(key) as { count: number };
    if (exists.count === 0) {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value);
    }
  }

  // Migración: resetear contador RIMPE si tiene un valor incorrecto (timestamp)
  const rimpeRow = db.prepare("SELECT value FROM settings WHERE key = 'recibo_secuencial'").get() as { value: string } | undefined;
  if (rimpeRow) {
    const val = parseInt(rimpeRow.value, 10);
    // Si el valor es mayor a 100000, es probable que sea un timestamp mal asignado
    if (val > 100000 || isNaN(val) || val < 0) {
      db.prepare("UPDATE settings SET value = '0' WHERE key = 'recibo_secuencial'").run();
      console.log('Contador RIMPE reseteado a 0');
    }
  }

  // Migración: agregar columna payment_reference a sales (para comprobante de transferencia)
  const salesColumns = db.prepare("PRAGMA table_info('sales')").all() as Array<{ name: string }>;
  const hasPaymentRef = salesColumns.some(col => col.name === 'payment_reference');
  if (!hasPaymentRef) {
    try {
      db.exec(`ALTER TABLE sales ADD COLUMN payment_reference TEXT DEFAULT ''`);
      console.log('Columna payment_reference agregada a sales');
    } catch (err) {
      console.error('Error al migrar columna payment_reference:', err);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SOFT DELETE: Agregar columnas active y deleted_at a tablas transaccionales
  // ═══════════════════════════════════════════════════════════
  const SOFT_DELETE_TABLES = ['products', 'clients', 'employees', 'suppliers', 'expenses', 'categories', 'sales', 'users'];
  for (const table of SOFT_DELETE_TABLES) {
    const cols = db.prepare(`PRAGMA table_info('${table}')`).all() as Array<{ name: string }>;
    if (!cols.some(c => c.name === 'active')) {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN active INTEGER DEFAULT 1`);
        db.exec(`ALTER TABLE ${table} ADD COLUMN deleted_at DATETIME DEFAULT NULL`);
        console.log(`Soft delete habilitado para: ${table}`);
      } catch (err) {
        console.error(`Error al migrar soft delete en ${table}:`, err);
      }
    }
  }

  // Migrar contraseñas legacy a bcrypt
  const plainPwUsers = db.prepare(
    "SELECT id, password FROM users WHERE password NOT LIKE '$2%'"
  ).all() as Array<{ id: number; password: string }>;

  if (plainPwUsers.length > 0) {
    for (const u of plainPwUsers) {
      const hashed = bcrypt.hashSync(u.password, 10);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, u.id);
    }
    console.log(`Contraseñas migradas a bcrypt`);
  }

  console.log('Base de datos inicializada en:', dbPath);

} catch (error) {
  console.error('Error al inicializar la base de datos:', error);
  // Fallback a BD en memoria para que la app no se caiga
  db = new Database(':memory:');
  console.log('Usando base de datos en memoria (temporal)');
}

export { db, dbPath };
