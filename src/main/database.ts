console.log('========================================');
console.log('📁 INICIANDO database.ts');
console.log('========================================');

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import bcrypt from 'bcryptjs';

console.log('📁 Paso 1: Importaciones completadas');

// ============================================
// RUTA DE LA BASE DE DATOS
// ============================================
// Usar AppData (recomendado para producción)
// const userDataPath = app.getPath('userData');

// Usar una carpeta dentro del proyecto (para desarrollo)
const userDataPath = path.join(process.cwd(), 'data');
console.log('📁 userDataPath:', userDataPath);

const dbPath = path.join(userDataPath, 'database.db');
console.log('📁 dbPath:', dbPath);

// Asegurar que la carpeta existe
const dbDir = path.dirname(dbPath);
console.log('📁 dbDir:', dbDir);

if (!fs.existsSync(dbDir)) {
  console.log('📁 Creando carpeta:', dbDir);
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('✅ Carpeta creada exitosamente');
  } catch (err) {
    console.error('❌ Error al crear carpeta:', err);
  }
} else {
  console.log('✅ Carpeta ya existe');
}

// Crear/abrir la base de datos
console.log('📁 Creando/abriendo base de datos...');

let db: Database.Database;

try {
  db = new Database(dbPath);
  console.log('✅ Base de datos abierta correctamente');
  
  // Habilitar Foreign Keys
  db.pragma('foreign_keys = ON');
  console.log('✅ Foreign Keys habilitados');

  // ============================================
  // CREAR TABLAS
  // ============================================
  console.log('📁 Creando tablas...');

  // Tabla: Usuarios
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
  console.log('✅ Tabla users creada/verificada');

  // Migración: agregar username si no existe (bases de datos existentes)
  const tableInfo = db.prepare("PRAGMA table_info('users')").all() as Array<{ name: string }>;
  const hasUsernameColumn = tableInfo.some(col => col.name === 'username');
  if (!hasUsernameColumn) {
    try {
      // Agregar columna sin UNIQUE primero (UNIQUE fallaría con datos existentes)
      db.exec(`ALTER TABLE users ADD COLUMN username TEXT NOT NULL DEFAULT ''`);
      // Asignar usernames basados en el email (parte antes del @)
      db.exec(`UPDATE users SET username = LOWER(SUBSTR(email, 1, INSTR(email, '@') - 1)) WHERE username = ''`);
      // Si hay duplicados, agregar sufijo numérico
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
      console.log('✅ Columna username agregada a users');
    } catch (err) {
      console.error('❌ Error al migrar columna username:', err);
    }
  } else {
    console.log('✅ Columna username ya existe');
  }

  // Tabla: Empresa/Negocio
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
  console.log('✅ Tabla business creada/verificada');

  // Tabla: Productos
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
  console.log('✅ Tabla products creada/verificada');

  // Tabla: Clientes
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
  console.log('✅ Tabla clients creada/verificada');

  // Tabla: Empleados
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
  console.log('✅ Tabla employees creada/verificada');

  // Tabla: Ventas
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
  console.log('✅ Tabla sales creada/verificada');

  // Tabla: Detalle de Ventas
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);
  console.log('✅ Tabla sale_items creada/verificada');

  // Tabla: Proveedores
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
  console.log('✅ Tabla suppliers creada/verificada');

  // Tabla: Gastos
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
  console.log('✅ Tabla expenses creada/verificada');

  // Tabla: Configuraciones
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      business_id INTEGER,
      FOREIGN KEY (business_id) REFERENCES business(id)
    )
  `);
  console.log('✅ Tabla settings creada/verificada');

  // ============================================
  // DATOS INICIALES
  // ============================================
  console.log('📁 Insertando datos iniciales...');

  // Verificar si hay usuarios
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  console.log('📁 Usuarios existentes:', userCount.count);

  if (userCount.count === 0) {
    const hashPw = (pw: string) => bcrypt.hashSync(pw, 10);
    db.exec(`
      INSERT INTO users (name, username, email, password, role) VALUES 
      ('Propietario', 'propietario', 'propietario@dajho.com', '${hashPw('propietario123')}', 'owner'),
      ('Empleado', 'empleado', 'empleado@dajho.com', '${hashPw('empleado123')}', 'employee')
    `);
    console.log('✅ Usuarios creados (Propietario + Empleado)');
  } else {
    console.log('✅ Usuarios ya existen');
    // Migración: eliminar usuario admin si existe (sobrante de versiones anteriores)
    const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin') as { count: number };
    if (adminExists.count > 0) {
      db.exec(`DELETE FROM users WHERE username = 'admin'`);
      console.log('✅ Usuario admin eliminado (migración)');
    }
        // Migración: renombrar vendedor a empleado si aún tiene el nombre antiguo
    const vendedorUser = db.prepare('SELECT id, password FROM users WHERE username = ?').get('vendedor') as { id: number; password: string } | undefined;
    if (vendedorUser) {
      const newPassword = vendedorUser.password.startsWith('$2')
        ? vendedorUser.password  // ya está hasheada, mantenerla
        : bcrypt.hashSync('empleado123', 10);  // texto plano → hash
      db.prepare(`UPDATE users SET name = 'Empleado', username = 'empleado', email = 'empleado@dajho.com', password = ? WHERE id = ?`)
        .run(newPassword, vendedorUser.id);
      console.log('✅ Usuario vendedor migrado a empleado (contraseña preservada)');
    }
    // Migración: agregar Propietario si no existe (bases de datos existentes)
    const ownerExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('propietario') as { count: number };
    if (ownerExists.count === 0) {
      const hashPw = (pw: string) => bcrypt.hashSync(pw, 10);
      db.exec(`
        INSERT INTO users (name, username, email, password, role) VALUES 
        ('Propietario', 'propietario', 'propietario@dajho.com', '${hashPw('propietario123')}', 'owner')
      `);
      console.log('✅ Usuario Propietario agregado (migración)');
    } else {
      console.log('✅ Usuario Propietario ya existe');
    }
  }

  // Verificar si hay negocio
  const businessCount = db.prepare('SELECT COUNT(*) as count FROM business').get() as { count: number };
  console.log('📁 Negocios existentes:', businessCount.count);

  if (businessCount.count === 0) {
    db.exec(`
      INSERT INTO business (name, owner, phone, email, address, city, ruc) VALUES 
      ('Tienda de Ropa DAJHO', 'Tu Novia', '0987654321', 'tienda@dajho.com', 'Calle Principal 123', 'Quito', '1234567890001')
    `);
    console.log('✅ Negocio creado');
  } else {
    console.log('✅ Negocio ya existe');
  }

  // ============================================
  // MIGRACIÓN: Sincronizar usuarios → empleados
  // ============================================
  const users = db.prepare('SELECT id, name, email, role FROM users').all() as Array<{ id: number; name: string; email: string; role: string }>;
  for (const user of users) {
    const exists = db.prepare('SELECT COUNT(*) as count FROM employees WHERE email = ?').get(user.email) as { count: number };
    if (exists.count === 0) {
      db.prepare(`
        INSERT INTO employees (name, email, role, status, hire_date, salary, sales_count, notes)
        VALUES (?, ?, ?, 'active', date('now'), 0, 0, '')
      `).run(user.name, user.email, user.role === 'owner' ? 'owner' : 'employee');
      console.log(`✅ Empleado creado para: ${user.name}`);
    }
  }

    // ============================================
  // MIGRACIÓN GLOBAL: Asegurar que TODAS las contraseñas estén hasheadas
  // ============================================
  const plainPwUsers = db.prepare(
    "SELECT id, password FROM users WHERE password NOT LIKE '$2%'"
  ).all() as Array<{ id: number; password: string }>;
  
  if (plainPwUsers.length > 0) {
    console.log(`📁 Migrando ${plainPwUsers.length} contraseña(s) a bcrypt...`);
    for (const u of plainPwUsers) {
      const hashed = bcrypt.hashSync(u.password, 10);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, u.id);
    }
    console.log(`✅ ${plainPwUsers.length} contraseña(s) migradas a bcrypt`);
  }

  console.log('========================================');
  console.log('✅ Base de datos inicializada en:', dbPath);
  console.log('========================================');

} catch (error) {
  console.error('❌ Error al inicializar la base de datos:', error);
  // Si hay error, creamos una base de datos vacía para que la app no falle
  db = new Database(':memory:');
  console.log('⚠️ Usando base de datos en memoria (temporal)');
}

// ============================================
// ✅ EXPORTAR LA BASE DE DATOS (FUERA DEL TRY/CATCH)
// ============================================
export { db };