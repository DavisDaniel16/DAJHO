# DAJHO - Instrucciones de Contexto para AI

## Descripción del Proyecto

Aplicación de escritorio para gestión de negocios construida con **Electron + React + TypeScript + better-sqlite3**.

---

## 🏗️ Arquitectura

```
src/
├── main/           # Proceso principal (Node.js)
│   ├── index.ts        # Creación de ventana, configuración
│   ├── database.ts     # Inicialización y migraciones de SQLite
│   └── ipc-handlers.ts # Lógica de negocio y handlers IPC
├── preload/        # Puente seguro entre main y renderer
│   └── index.ts        # contextBridge, expone APIs limitadas
└── renderer/       # Frontend React (Vite)
    └── src/
        ├── App.tsx
        ├── context/    # AuthContext, ThemeContext, SidebarContext
        ├── hooks/      # useDB, etc.
        ├── pages/      # Login, Dashboard, Sales, Inventory, etc.
        ├── components/ # Componentes reutilizables
        └── store/      # Lógica de recibos
```

## 🔒 Reglas de Seguridad (OBLIGATORIAS)

### 1. Proceso Principal vs Renderer
- **Toda la lógica de negocio y validación** va en `src/main/ipc-handlers.ts`, NUNCA en el renderer.
- El renderer solo hace UI y llama al backend vía `window.dajhoAPI`.
- No confiar en ningún dato que venga del renderer — validar siempre en el backend.

### 2. Preload (src/preload/index.ts)
- Usar `contextBridge.exposeInMainWorld` — nunca exponer `ipcRenderer` directamente.
- Exponer solo métodos específicos, nunca canales IPC genéricos.
- NO usar `ipcRenderer.on` ni `ipcRenderer.send` sin validación explícita.
- El preload NO debe contener lógica de negocio.

### 3. Validación de Entrada (Backend)
- **Siempre** validar y sanitizar los datos que llegan del renderer.
- Usar un esquema de validación (Zod recomendado) en cada handler IPC.
- Verificar tipos, rangos, longitudes máximas.
- Sanitizar strings (trim, escapar HTML si se guarda texto).

### 4. Permisos
- La sesión se mantiene en el main process (`currentSession`), NUNCA confiar en el rol que envía el renderer.
- El mapa `HANDLER_PERMISSIONS` controla qué rol puede ejecutar cada canal IPC.
- Los canales no listados son accesibles por cualquier rol autenticado — revisar esto explícitamente.
- Implementar rate limiting en handlers críticos.

### 5. Base de Datos

#### Soft Delete (REGLAMENTARIO)
- **NUNCA** usar `DELETE FROM` en tablas con datos transaccionales.
- Todas las tablas deben tener:
  ```sql
  active INTEGER DEFAULT 1
  deleted_at DATETIME DEFAULT NULL
  ```
- Todas las queries SELECT deben filtrar con `WHERE active = 1`.
- Las eliminaciones son `UPDATE table SET active = 0, deleted_at = CURRENT_TIMESTAMP`.

#### ON DELETE CASCADE
- **NUNCA** usar `ON DELETE CASCADE`. Puede destruir datos históricos.
- Si se necesita "eliminar", usar soft delete y manejar las relaciones manualmente.

#### Transacciones
- Usar `db.transaction()` para operaciones que modifican múltiples tablas.
- Las operaciones de venta (crear, eliminar) deben ser transaccionales.

#### Consultas
- Siempre usar consultas parametrizadas (`?` placeholders).
- NUNCA concatenar strings para construir SQL.
- Crear índices para columnas usadas en WHERE, JOIN y ORDER BY.

## 🧠 Lógica de Negocio

### Ventas (Sales)
- **Calcular totales en el backend**, no confiar en lo que envía el frontend.
  ```typescript
  // Backend calcula:
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const iva = subtotal * ivaPorcentaje;
  const total = subtotal + iva;
  ```
- Validar stock ANTES de insertar la venta.
- Restaurar stock al eliminar una venta.

### Productos (Inventory)
- El precio de venta debe venir de la BD, no del frontend.
- El stock no puede ser negativo — validar en el backend.

### Clientes
- Actualizar `total_debt` y `total_purchases` en el backend al crear/eliminar ventas.

## 📝 Convenciones de Código

- **TypeScript** siempre con tipos explícitos (evitar `any`).
- Nombres en inglés para tablas y columnas de BD.
- Nombres en español para la UI.
- Funciones asíncronas con `async/await`.
- Usar `handleError` wrapper para todos los handlers IPC (ya implementado).
- Auditoría: todas las operaciones de escritura deben registrar en `audit_log`.

## 🐙 Git Practices

- Usar **GitFlow**: ramas `main`, `develop`, `feature/*`, `release/*`, `hotfix/*`.
- Commits pequeños y atómicos siguiendo **Conventional Commits**:
  ```
  feat:  Nueva funcionalidad
  fix:   Corrección de bug
  refactor: Cambio de código sin cambiar funcionalidad
  security: Parche de seguridad
  perf:  Mejora de rendimiento
  docs:  Documentación
  ```
- PRs de menos de 300 líneas para facilitar la revisión.
- Un commit por concepto, no megacommits de miles de líneas.
- No commitear directamente a `main` — siempre usar PR.

## 🔧 Stack Técnico

- **Runtime:** Electron (Node.js)
- **Frontend:** React + TypeScript + Vite
- **BD:** better-sqlite3 (SQLite síncrono)
- **Validación:** Zod (esquemas en backend)
- **Estilos:** CSS-in-JS con objetos de estilos
- **Construcción:** electron-builder
- **Gestor de paquetes:** pnpm (más seguro que npm)

## 🏪 Versiones de Negocio

El proyecto soporta múltiples versiones configuradas por tipo de negocio:

| Versión | Comando | Color | Especialización |
|---------|---------|-------|-----------------|
| 1.T Tienda | `DAJHO_TYPE=tienda pnpm dev` | Azul | Gestión general |
| 1.R Ropa | `DAJHO_TYPE=ropa pnpm dev` | Rosa | Tallas, colores, temporadas |
| 1.F Ferretería | `DAJHO_TYPE=ferreteria pnpm dev` | Naranja | Marcas, unidades de medida |

La configuración vive en `src/renderer/src/config/` y se selecciona automáticamente según la variable de entorno `DAJHO_TYPE` o el nombre del ejecutable.

## ⚠️ Anti-patrones a EVITAR

- ❌ `dangerouslySetInnerHTML` en React
- ❌ `eval()`, `new Function()`, `setTimeout` con strings
- ❌ `DELETE FROM` sin filtro (borrar toda la tabla)
- ❌ `ON DELETE CASCADE` en foreign keys
- ❌ Lógica de negocio en el frontend (cálculos de totales, validación de stock)
- ❌ Confiar en el rol/usuario que envía el frontend
- ❌ npm (usar pnpm)
- ❌ Commits gigantes sin descripción clara
