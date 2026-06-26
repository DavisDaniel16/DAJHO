# 🚀 DAJHO — Sistema de Gestión Empresarial

**DAJHO** es una aplicación de escritorio moderna y potente construida con **Electron**, **React**, **TypeScript** y **Vite**, diseñada para la gestión integral de pequeños y medianos negocios. Ofrece control completo de ventas, inventario, empleados, clientes, proveedores, gastos, estadísticas y más, todo con una interfaz rápida, responsive y con soporte de temas claro/oscuro.

---

## ✨ Funcionalidades

### 🔐 Autenticación y roles
- Sistema de inicio de sesión con dos roles: **propietario** (acceso total) y **empleado** (acceso limitado).
- Permisos diferenciados por módulo según el rol del usuario.

### 🛒 Ventas
- Registro rápido de ventas con selección de productos, cliente y empleado.
- Aplicación de descuentos por producto y total.
- Generación automática de **nota de venta en PDF** al concretar la venta.
- Descuento automático del stock al registrar la venta.

### 📦 Inventario
- Control completo de productos: código, nombre, precio de compra/venta, stock y proveedor.
- Vista de productos con stock bajo (umbral configurable).
- **Importación masiva** desde archivos Excel (.xlsx).
- **Exportación** del inventario a Excel.
- Permisos de solo lectura para empleados.

### 👥 Clientes
- Registro y gestión de clientes con información de contacto.
- Control de deudas: seguimiento de saldo pendiente por cliente.
- Historial de compras por cliente.

### 👤 Empleados
- Administración del personal con asignación de rol (propietario/empleado).
- Gestión de horarios, teléfono y dirección.

### 🏢 Proveedores
- Catálogo de proveedores con datos de contacto y productos asociados.

### 💸 Gastos
- Registro de gastos categorizados (servicios, insumos, nómina, etc.).
- Visualización y filtros por fecha y categoría.

### 📊 Balance
- Panel con resumen económico: ingresos totales, gastos, deudas de clientes y balance neto.
- Vista clara del estado financiero del negocio.

### 📈 Estadísticas
- Reportes visuales con **gráficos** de ventas, ingresos, gastos y rentabilidad.
- Filtros por período y categoría.

### 💰 Cerrar Caja
- Control de cierre de caja diario con resumen de ventas, gastos y balance del día.
- Registro histórico de cierres de caja.

### 📄 Recibos
- Historial completo de recibos/notas de venta generadas.
- Visualización detallada con productos, cantidades y totales.
- Posibilidad de regenerar PDF de recibos anteriores.

### ⚙️ Configuraciones
- Ajustes del negocio: nombre, dirección, teléfono, moneda, etc.
- Personalización de la interfaz y preferencias del sistema.
- Persistencia de configuraciones en base de datos.

### 🌙 Temas claro/oscuro
- Interfaz adaptable con cambio de tema en tiempo real.
- Diseño moderno con consistencia visual en ambos modos.

---

## 🛠️ Tecnologías

| Tecnología               | Versión   |
| ------------------------ | --------- |
| Electron                 | ^42.4     |
| React                    | ^18.2     |
| TypeScript               | ^5.3      |
| Vite                     | ^7.3      |
| React Router DOM         | ^6.26     |
| Electron Builder         | ^26.15    |
| better-sqlite3           | ^12.11    |
| @react-pdf/renderer      | ^4.5      |
| xlsx (SheetJS)           | ^0.18     |
| lucide-react             | ^1.21     |
| bcryptjs                 | ^3.0      |
| concurrently             | ^8.2      |

---

## 📁 Estructura del proyecto

```
dajho-desktop/
├── data/
│   └── database.db                  # Base de datos SQLite
├── src/
│   ├── main/                        # Proceso principal de Electron
│   │   ├── index.ts                 # Punto de entrada de Electron (ventana, menú)
│   │   ├── database.ts              # Conexión y esquema SQLite (migraciones)
│   │   └── ipc-handlers.ts          # Handlers IPC (puente BD ↔ renderer)
│   ├── preload/                     # Script de precarga (CommonJS)
│   │   └── index.ts                 # Expone dajhoAPI al renderer
│   └── renderer/                    # Aplicación React (frontend)
│       ├── index.html
│       └── src/
│           ├── main.tsx                     # Punto de entrada de React
│           ├── App.tsx                      # Componente raíz con rutas
│           ├── index.css                    # Estilos globales
│           ├── vite-env.d.ts               # Tipos de window.dajhoAPI
│           ├── context/
│           │   ├── AuthContext.tsx           # Contexto de autenticación y permisos
│           │   └── ThemeContext.tsx          # Contexto de tema claro/oscuro
│           ├── hooks/
│           │   └── useDB.ts                # Hooks genéricos (useProducts, useClients, etc.)
│           ├── store/
│           │   └── recibosStore.ts          # Estado global de recibos (Zustand)
│           ├── styles/
│           │   ├── theme.ts                # Definición de colores y tokens por tema
│           │   ├── themedStyles.ts          # Estilos temáticos reutilizables
│           │   └── useThemedStyles.ts       # Hook para aplicar estilos temáticos
│           ├── components/
│           │   ├── layout/
│           │   │   ├── Sidebar.tsx          # Barra lateral de navegación
│           │   │   └── TopBar.tsx           # Barra superior con info del usuario
│           │   └── ReciboPDF.tsx            # Componente PDF para nota de venta
│           └── pages/
│               ├── Login.tsx               # Pantalla de inicio de sesión
│               ├── Sales.tsx               # Registro de ventas
│               ├── Balance.tsx             # Balance económico
│               ├── Statistics.tsx           # Estadísticas y gráficos
│               ├── Inventory.tsx           # Gestión de inventario
│               ├── Expenses.tsx            # Control de gastos
│               ├── Employees.tsx           # Administración de empleados
│               ├── Clients.tsx             # Gestión de clientes
│               ├── Suppliers.tsx           # Administración de proveedores
│               ├── Settings.tsx            # Configuraciones del negocio
│               ├── CerrarCaja.tsx          # Cierre de caja diario
│               └── Recibos.tsx             # Historial de recibos
├── dist-electron/                 # Compilados de Electron (generado)
│   ├── main/
│   ├── preload/
│   └── renderer/
├── release/                       # Instaladores generados (electron-builder)
├── package.json
├── vite.config.ts                 # Configuración de Vite
├── tsconfig.json                  # Configuración de TypeScript (renderer)
├── tsconfig.electron.json         # Configuración de TypeScript (main)
├── tsconfig.preload.json          # Configuración de TypeScript (preload)
├── tsconfig.node.json             # Configuración de TypeScript (node)
└── README.md
```

---

## 🚀 Instalación y uso

### Requisitos

- **Node.js** >= 18
- **npm** >= 9
- **Windows**, **macOS** o **Linux**

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd dajho-desktop

# 2. Instalar dependencias (recompila automáticamente better-sqlite3 para Electron)
npm install

# 3. Ejecutar en modo desarrollo (Vite + Electron)
npm run dev

# 4. Construir para producción
npm run build

# 5. Iniciar versión compilada
npm start

# 6. Generar instalador (.exe para Windows)
npm run dist
```

> ⚠️ `npm install` ejecuta automáticamente `electron-builder install-app-deps` para recompilar `better-sqlite3` para la versión de Electron instalada.

---

## 🔐 Credenciales por defecto

| Usuario       | Contraseña        | Rol         | Acceso |
| ------------- | ----------------- | ----------- | ------ |
| `propietario` | `propietario123`  | `owner`     | 🔓 **Total** — puede ver, agregar, editar y eliminar en todos los módulos |
| `empleado`    | `empleado123`     | `employee`  | 🔒 **Limitado** — solo ventas, recibos y cierre de caja |

> 🔑 Puedes cambiar estas credenciales desde la pantalla de Configuraciones o directamente en la base de datos.

---

## 📜 Scripts disponibles

| Comando               | Descripción                                                 |
| --------------------- | ----------------------------------------------------------- |
| `npm run dev`         | Inicia Vite + Electron en modo desarrollo (hot reload)      |
| `npm run build`       | Compila Electron y el renderer para producción              |
| `npm start`           | Compila y ejecuta la aplicación compilada                   |
| `npm run dist`        | Genera el instalador (.exe) con electron-builder            |
| `npm run preview`     | Previsualiza la build del renderer en el navegador          |
| `npm run dev:direct`  | Abre Electron directamente con los archivos compilados      |
| `npm run build:renderer` | Compila solo el frontend (Vite)                         |
| `npm run build:electron` | Compila solo el backend Electron (TypeScript)            |

---

## 🗄️ Base de datos

El proyecto usa **SQLite** a través de [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3). La base de datos se almacena en un archivo local:

```
data/database.db
```

- **No requiere servidor** ni instalación adicional.
- Las **tablas** se crean automáticamente al iniciar la app por primera vez.
- Las **migraciones** de esquema se ejecutan en cada inicio si es necesario.
- Las contraseñas se almacenan cifradas con **bcryptjs**.

---

## 🧱 Arquitectura

DAJHO sigue la arquitectura clásica de Electron con tres capas:

```
┌──────────────────────────────────────────────────┐
│                  Renderer (React)                 │
│  UI, componentes, páginas, hooks, contexto        │
├──────────────────────────────────────────────────┤
│                  Preload (bridge)                 │
│  Expone API segura al renderer via contextBridge  │
├──────────────────────────────────────────────────┤
│               Main Process (Electron)             │
│  Ventanas, menús, IPC handlers, SQLite            │
└──────────────────────────────────────────────────┘
```

- **Main Process**: Gestiona la ventana de Electron, los menús y los handlers IPC que interactúan con la base de datos SQLite.
- **Preload**: Expone una API tipada (`window.dajhoAPI`) al renderer usando `contextBridge` para comunicación segura.
- **Renderer**: Aplicación React con Vite, enrutamiento con React Router DOM y estilos temáticos.

---

## 📦 Distribución

Para generar un instalable para Windows:

```bash
npm run dist
```

El instalador se generará en la carpeta `release/` con las siguientes características:

- Instalador **NSIS** con opción de elegir directorio.
- Atajo en el escritorio.
- Aplicación portable lista para usar sin dependencias externas.

---

## 📄 Licencia

MIT — Este proyecto es de uso libre.

---

<p align="center">Hecho con ❤️ usando Electron, React, TypeScript y Vite</p>
