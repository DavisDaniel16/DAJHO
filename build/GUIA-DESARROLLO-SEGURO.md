# Guía de Desarrollo Seguro para Proyectos Electron + React + SQLite

> Basada en el feedback de un desarrollador full stack senior sobre el proyecto DAJHO.

---

## 📋 Índice

1. [Arquitectura](#1-arquitectura)
2. [Seguridad en Electron](#2-seguridad-en-electron)
3. [Base de Datos](#3-base-de-datos)
4. [Lógica de Negocio](#4-lógica-de-negocio)
5. [Buenas Prácticas de Código](#5-buenas-prácticas-de-código)
6. [Git y Control de Versiones](#6-git-y-control-de-versiones)
7. [Uso de IA (Vibe Coding)](#7-uso-de-ia-vibe-coding)
8. [Stack Técnico](#8-stack-técnico)
9. [Checklist de Seguridad](#9-checklist-de-seguridad)

---

## 1. Arquitectura

### Estructura de carpetas (recomendada)

```
src/
├── main/           # Proceso principal (Node.js)
│   ├── index.ts        # Creación de ventana, configuración
│   ├── database.ts     # Inicialización y migraciones de SQLite
│   ├── ipc-handlers.ts # Handlers IPC (lógica de negocio)
│   └── security.ts     # Permisos, rate limiting (separado)
├── preload/        # Puente seguro entre main y renderer
│   └── index.ts        # contextBridge, whitelist de métodos
├── shared/         # Tipos compartidos entre capas
│   └── types.ts        # Interfaces del API, modelos de datos
└── renderer/       # Frontend React
    └── src/
        ├── App.tsx
        ├── context/     # AuthContext, ThemeContext
        ├── hooks/       # Hooks para llamar al backend
        ├── pages/       # Páginas de la app
        └── config/      # Configuraciones por tipo de negocio
```

### Regla de oro: 3 capas

```
Renderer (UI) ──llama──> Preload (bridge) ──invoca──> Main (lógica)
     │                      │                           │
     │  Solo UI             │  Solo puente              │  Toda la lógica
     │  No lógica           │  No lógica                │  Validación
     │  No SQL              │  Whitelist                │  BD
     └──────────────────────┴───────────────────────────┘
```

---

## 2. Seguridad en Electron

### ⛔ NUNCA hacer esto

```typescript
// ❌ MAL: Exponer ipcRenderer directamente
contextBridge.exposeInMainWorld('api', {
  send: ipcRenderer.send,      // El renderer puede enviar cualquier canal
  on: ipcRenderer.on           // El renderer puede escuchar cualquier evento
});

// ❌ MAL: nodeIntegration activado
new BrowserWindow({
  webPreferences: {
    nodeIntegration: true,      // El renderer tiene acceso a Node.js
    contextIsolation: false     // Sin aislamiento de contexto
  }
});

// ❌ MAL: Lógica de negocio en el frontend
const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
// El usuario puede manipular esto con DevTools
```

### ✅ HACER esto

```typescript
// ✅ BIEN: contextBridge con métodos específicos
contextBridge.exposeInMainWorld('dajhoAPI', {
  // Solo métodos concretos, nunca ipcRenderer directamente
  products: {
    getAll: () => ipcRenderer.invoke('db:products:getAll'),
    create: (data) => ipcRenderer.invoke('db:products:create', data),
  }
});

// ✅ BIEN: Whitelist de métodos permitidos
const ALLOWED_METHODS = new Set([
  'products.getAll',
  'products.create',
  // ... solo los necesarios
]);

// ✅ BIEN: Configuración segura del BrowserWindow
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload/index.js'),
    contextIsolation: true,      // SIEMPRE true
    nodeIntegration: false,      // SIEMPRE false
    sandbox: true,               // Opcional, más seguro
  }
});
```

### Validación de entrada (Zod)

Toda entrada del renderer debe validarse en el backend:

```typescript
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
});

ipcMain.handle('db:products:create', handleError(async (_, data) => {
  const parsed = productSchema.parse(data); // Lanza error si inválido
  // ... usar parsed, no data
}));
```

### Rate Limiting

Proteger contra abuso de los handlers IPC:

```typescript
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(channel: string, maxPerMinute = 60): boolean {
  const now = Date.now();
  let entry = rateLimitStore.get(channel);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000 };
    rateLimitStore.set(channel, entry);
  }
  entry.count++;
  return entry.count <= maxPerMinute;
}
```

### Permisos por Rol

Nunca confiar en el rol que envía el frontend:

```typescript
// ✅ BIEN: La sesión se mantiene en el main process
let currentSession: User | null = null;

function handleError(handler) {
  return async (...args) => {
    const role = currentSession?.role; // Del main process, NO del frontend
    if (!hasPermission(channel, role)) {
      throw new Error('Acceso denegado');
    }
    return await handler(...args);
  };
}
```

---

## 3. Base de Datos

### Soft Delete (OBLIGATORIO)

Nunca usar `DELETE FROM` en datos transaccionales:

```sql
-- ✅ BIEN: Soft delete
ALTER TABLE products ADD COLUMN active INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN deleted_at DATETIME DEFAULT NULL;

UPDATE products SET active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?;
SELECT * FROM products WHERE active = 1;
```

```sql
-- ❌ MAL: Hard delete
DELETE FROM products WHERE id = ?;
```

### NO usar ON DELETE CASCADE

```sql
-- ❌ MAL: Puede destruir datos históricos
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE

-- ✅ BIEN: Manejar las relaciones manualmente
FOREIGN KEY (sale_id) REFERENCES sales(id)
```

### Transacciones

Operaciones que modifican múltiples tablas deben ser transaccionales:

```typescript
const result = db.transaction(() => {
  db.prepare('INSERT INTO sales ...').run(...);
  for (const item of items) {
    db.prepare('INSERT INTO sale_items ...').run(...);
    db.prepare('UPDATE products SET stock = stock - ? ...').run(...);
  }
})();
```

### Consultas parametrizadas

Siempre usar `?` placeholders, nunca concatenar:

```typescript
// ✅ BIEN
db.prepare('SELECT * FROM products WHERE id = ?').get(id);

// ❌ MAL
db.prepare(`SELECT * FROM products WHERE id = ${id}`).get();
```

### Índices

Crear índices para columnas usadas en WHERE, JOIN y ORDER BY:

```sql
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_active_name ON products(active, name);
CREATE INDEX IF NOT EXISTS idx_sales_active_date ON sales(active, date);
```

---

## 4. Lógica de Negocio

### Los totales se calculan en el backend

```typescript
// ✅ BIEN: Backend calcula todo
ipcMain.handle('db:sales:create', handleError(async (_, data) => {
  // 1. Validar stock
  for (const item of data.items) {
    const product = db.prepare('SELECT price, stock FROM products WHERE id = ?').get(item.product_id);
    if (!product) throw new Error('Producto no encontrado');
    if (product.stock < item.quantity) throw new Error('Stock insuficiente');
    
    // 2. Usar precio de la BD, no del frontend
    item.price = product.price;
    item.subtotal = product.price * item.quantity;
  }
  
  // 3. Calcular totales
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const iva = subtotal * 0.12;
  const total = subtotal + iva;
  
  // 4. Insertar con valores calculados
}));
```

### El frontend solo muestra

```typescript
// ✅ BIEN: Frontend solo pide datos y muestra
const response = await window.dajhoAPI.sales.create({
  items: cartItems,
  clientId: selectedClient,
});
```

### Auditoría

Toda operación de escritura debe registrar en audit_log:

```typescript
function auditLog(action: string, details: string) {
  db.prepare(
    'INSERT INTO audit_log (user_id, user_name, action, details) VALUES (?, ?, ?, ?)'
  ).run(currentSession.id, currentSession.name, action, details);
}
```

---

## 5. Buenas Prácticas de Código

### TypeScript

- Tipos explícitos siempre (evitar `any`)
- Interfaces compartidas entre backend y frontend
- Usar `unknown` en lugar de `any` para datos desconocidos

### Naming

- BD: nombres en inglés (products, clients, sales)
- UI: nombres en español (Productos, Clientes, Ventas)
- Funciones: verbos en inglés (createProduct, getSaleById)

### Manejo de errores

```typescript
// Wrapper genérico para todos los handlers IPC
function handleError<T>(handler: (...args: any[]) => T) {
  return async (...args: any[]) => {
    try {
      // Rate limiting
      if (!checkRateLimit(channel)) throw new Error('Demasiadas peticiones');
      // Permisos
      if (!validatePermission(channel, role)) throw new Error('Acceso denegado');
      // Ejecutar
      return await handler(...args);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { success: false, error: 'Datos inválidos' };
      }
      return { success: false, error: err.message };
    }
  };
}
```

---

## 6. Git y Control de Versiones

### GitFlow

```
main              → Producción (protegida)
├── develop       → Integración
│   ├── feature/  → Nuevas funcionalidades
│   ├── fix/      → Correcciones
│   └── refactor/ → Refactors
├── release/      → Preparación de release
└── hotfix/       → Parches urgentes a producción
```

### Conventional Commits

```
feat:     Nueva funcionalidad para el usuario
fix:      Corrección de bug
refactor: Cambio que no agrega feature ni corrige bug
security: Parche de seguridad
perf:     Mejora de rendimiento
docs:     Documentación
style:    Formato, espacios, puntos y coma
chore:    Tareas de mantenimiento
```

### Reglas

- Commits pequeños y atómicos (un concepto por commit)
- PRs de menos de 300 líneas
- No commitear directamente a `main`
- Usar ramas: `feature/nombre-descriptivo`

---

## 7. Uso de IA (Vibe Coding)

### ❌ Mal uso

```
Prompt: "Haz un sistema de ventas completo"
→ La IA genera código genérico, sin contexto de seguridad,
  sin considerar la arquitectura del proyecto.
```

### ✅ Buen uso (Context Engineering)

```
Contexto del proyecto:
- Electron + React + TypeScript + better-sqlite3
- Toda la lógica de negocio va en ipc-handlers.ts
- Soft delete en todas las tablas (active=1)
- Validación con Zod en el backend
- Sesión en el main process (currentSession)
- Rate limiting en handlers críticos

Tarea: Implementar el handler para crear una venta
que:
1. Valide stock de cada producto
2. Use el precio de la BD
3. Calcule subtotal, IVA y total en el backend
4. Use transacciones
5. Registre en audit_log
```

### Consejos clave

1. **Estudia fundamentos primero** — No uses IA para aprender, úsala para acelerar
2. **Context Engineering** — Entre más contexto le des a la IA, mejor resultado obtienes
3. **Archivos de instrucciones** — Usa `.github/copilot-instructions.md` para definir reglas
4. **Divide y vencerás** — Tareas pequeñas y específicas, no megaprompts
5. **Revisa siempre** — La IA puede generar código que se vea bien pero sea inseguro
6. **Modelos de frontera** — Usa Claude Sonnet, GPT-4o, DeepSeek V4 Flash para código complejo

### Ejemplo de archivo de contexto (`.github/copilot-instructions.md`)

```markdown
# Reglas del Proyecto

## Seguridad
- Toda validación va en el backend (ipc-handlers.ts)
- Nunca confiar en datos del frontend
- La sesión se mantiene en el main process

## Base de Datos
- Soft delete: active=1, deleted_at, nunca DELETE FROM
- No ON DELETE CASCADE
- Consultas parametrizadas siempre

## Git
- GitFlow
- Conventional Commits
- PRs < 300 líneas
```

---

## 8. Stack Técnico

### Gestor de paquetes: pnpm (NO npm)

```bash
npm install -g pnpm           # Instalar pnpm
pnpm install                  # Instalar dependencias
pnpm add zod                  # Agregar dependencia
pnpm approve-builds <paq>     # Aprobar scripts de compilación
pnpm rebuild                  # Reconstruir módulos nativos
```

### ¿Por qué pnpm?

| Característica | npm | pnpm |
|:---|---:|:---:|
| Malware protection | ❌ | ✅ |
| Determinista | ❌ | ✅ |
| Aislamiento de dependencias | ❌ | ✅ |
| Disk space eficiente | ❌ | ✅ |
| Build scripts controlados | ❌ | ✅ |

### Stack recomendado

```
Runtime:    Electron
Frontend:   React + TypeScript + Vite
BD:         better-sqlite3 (síncrono)
Validación: Zod
Estilos:    CSS-in-JS (objetos de estilo)
Build:      electron-builder
Package:    pnpm
```

---

## 9. Checklist de Seguridad

Antes de lanzar a producción, verificar:

- [ ] `contextIsolation: true` en BrowserWindow
- [ ] `nodeIntegration: false` en BrowserWindow
- [ ] Preload usa `contextBridge`, no expone `ipcRenderer`
- [ ] Whitelist de métodos IPC en el preload
- [ ] Validación Zod en todos los handlers IPC
- [ ] Rate limiting en handlers críticos
- [ ] Sesión manejada en el main process
- [ ] Permisos por rol validados en backend
- [ ] Soft delete en todas las tablas
- [ ] No hay `ON DELETE CASCADE`
- [ ] Todas las queries son parametrizadas
- [ ] No hay `dangerouslySetInnerHTML`
- [ ] No hay `eval()` ni `new Function()`
- [ ] Los totales se calculan en backend
- [ ] Auditoría en operaciones de escritura
- [ ] Contraseñas hasheadas (bcrypt)
- [ ] Bloqueo por intentos fallidos de login
- [ ] Backup automático de la BD
- [ ] Módulos nativos reconstruidos para Electron
- [ ] pnpm como gestor de paquetes

---

## 10. Anti-patrones a EVITAR

| Anti-patrón | Por qué evitarlo |
|:---|---:|
| `dangerouslySetInnerHTML` | XSS directo |
| `eval()`, `new Function()` | Ejecución de código arbitrario |
| `DELETE FROM` sin WHERE | Borra toda la tabla |
| `ON DELETE CASCADE` | Destruye datos históricos |
| Lógica de negocio en frontend | El usuario puede manipularla |
| Confiar en el rol del frontend | El usuario puede falsificarlo |
| npm | Riesgo de malware |
| Commits gigantes | Imposible de auditar |
| Una rama para todo | Caos en el historial |
| Prompt sin contexto | Resultados de baja calidad |

---

## Conclusión

El feedback de un desarrollador senior se puede resumir en:

1. **Seguridad primero** — Electron tiene su propio modelo de seguridad, respétalo
2. **Backend de confianza** — El frontend es un cliente más, nunca confíes en él
3. **Datos íntegros** — Soft delete, transacciones, auditoría
4. **Código mantenible** — Tipos, arquitectura clara, ramas, commits pequeños
5. **IA con contexto** — Context Engineering > prompts a lo loco
6. **pnpm > npm** — Seguridad por defecto

---

*Documento basado en la revisión de DAJHO — Junio 2026*
