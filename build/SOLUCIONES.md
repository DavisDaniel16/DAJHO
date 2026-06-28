# Soluciones a problemas comunes — DAJHO

> Documentación de problemas encontrados y sus soluciones durante el desarrollo de DAJHO.

---

## Índice

1. [Flash blanco al iniciar o navegar](#1-flash-blanco-al-iniciar-o-navegar)
2. [Error "Cannot read properties of null" al iniciar](#2-error-cannot-read-properties-of-null-al-iniciar)
3. [El acordeón de ayuda no funciona](#3-el-acordeón-de-ayuda-no-funciona)
4. [Error al hacer login en navegador (dev)](#4-error-al-hacer-login-en-navegador-dev)
5. [Vite se reinicia solo y mata Electron](#5-vite-se-reinicia-solo-y-mata-electron)
6. [Múltiples procesos de Electron acumulados](#6-múltiples-procesos-de-electron-acumulados)
7. [Error de caché de disco en Electron](#7-error-de-caché-de-disco-en-electron)
8. [Puerto en uso al hacer dev](#8-puerto-en-uso-al-hacer-dev)
9. [Chunks grandes en el build](#9-chunks-grandes-en-el-build)
10. [Base de datos: backup y recuperación](#10-base-de-datos-backup-y-recuperación)

---

## 1. Flash blanco al iniciar o navegar

**Síntoma:** Al abrir la app o navegar entre módulos, se ve un fondo blanco por milisegundos antes de que cargue el contenido.

**Causa raíz:** El `<Suspense>` envolvía a `<Routes>` completo. Al navegar entre módulos lazy, React desmontaba TODO el DOM (sidebar, topbar y contenido) y lo reemplazaba por el `PageLoader`, causando un flash.

**Solución:**

### 1.1 Mover Suspense dentro de cada ruta

En `src/renderer/src/App.tsx`:

```tsx
// ❌ ANTES: Suspense fuera de Routes
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/vender" element={
      <ProtectedRoute>
        <MainLayout>
          <Sales />  {/* lazy → activa Suspense → borra todo */}
        </MainLayout>
      </ProtectedRoute>
    } />
  </Routes>
</Suspense>

// ✅ DESPUÉS: Suspense dentro, solo envuelve el contenido lazy
<Routes>
  <Route path="/vender" element={
    <ProtectedRoute>
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          <Sales />
        </Suspense>
      </MainLayout>
    </ProtectedRoute>
  } />
</Routes>
```

### 1.2 Ventana oculta hasta estar lista

En `src/main/index.ts`:

```ts
const mainWindow = new BrowserWindow({
  show: false,                                    // ← no mostrar aún
  backgroundColor: '#f5f7fa',                      // ← color inmediato
  // ...
});

mainWindow.once('ready-to-show', () => {          // ← mostrar solo cuando haya contenido
  mainWindow?.show();
});
```

### 1.3 Script inline síncrono en el HTML

En `src/renderer/index.html` (y replicado en `vite.config.ts` como plugin para el build):

```html
<script>
  (function() {
    var isDark = localStorage.getItem('dajho_darkMode') === 'true';
    var bg = isDark ? '#0f1729' : '#f5f7fa';
    // document.write es SÍNCRONO → el navegador NO pinta hasta que termine
    document.write('<style>html,body{background-color:'+bg+' !important;}#root{background-color:'+bg+' !important;}<\/style>');
    if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
  })();
</script>
```

> **Nota:** Usar `document.write` con `<style>` es más confiable que `document.createElement('style')` + `appendChild` porque es síncrono y bloquea el parser.

### 1.4 PageLoader con altura completa y fondo

En `src/renderer/src/App.tsx`:

```tsx
const PageLoader = () => {
  const { colors } = useTheme();
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: 'calc(100vh - 64px)',  // ← altura completa del área de contenido
      backgroundColor: colors.bgPrimary,
      color: colors.textSecondary,
      fontSize: 14,
    }}>
      Cargando...
    </div>
  );
};
```

### 1.5 Fondo explícito en el área de contenido

En `src/renderer/src/App.tsx`:

```tsx
const styles = {
  content: {
    flex: 1,
    marginTop: '64px',
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: '#f5f7fa',  // ← fondo explícito (se sobrescribe con el tema)
  },
};

// En MainLayout, sobrescribir con el color del tema activo:
<div style={{
  ...styles.content,
  backgroundColor: colors.bgPrimary,
}}>
  {children}
</div>
```

---

## 2. Error "Cannot read properties of null" al iniciar

**Síntoma:** En la consola del navegador: `TypeError: Cannot read properties of null (reading 'style')`

**Causa:** El script inline del `index.html` intenta acceder a `document.body` desde el `<head>`, pero el `<body>` aún no existe.

**Solución:** Usar `document.documentElement` (el elemento `<html>`) en lugar de `document.body`:

```javascript
// ❌ MAL: document.body es null en <head>
document.body.style.backgroundColor = '#0f1729';

// ✅ BIEN: document.documentElement siempre existe
document.documentElement.style.backgroundColor = '#0f1729';

// ✅ MEJOR: inyectar un <style> en lugar de inline styles
document.write('<style>html,body{background-color:#0f1729!important;}<\\/style>');
```

---

## 3. El acordeón de ayuda no funciona

**Síntoma:** En la página de Ayuda, todas las secciones aparecen expandidas siempre. El acordeón no colapsa.

**Causa:** El estilo `sectionContent` se calculaba UNA vez en `useMemo` y se aplicaba a TODAS las secciones usando `openSection` como booleano global. Cuando una sección estaba abierta (`openSection !== null`), TODAS las secciones obtenían `maxHeight: '2000px'`.

**Solución:** Convertir `sectionContent` en una función que reciba `isOpen` por sección:

```tsx
// ❌ ANTES: estilo global que afecta a todas las secciones
const styles = useMemo(() => ({
  sectionContent: {
    maxHeight: openSection ? '2000px' : '0',  // ← todas las secciones igual
  },
}), [openSection]);

// ✅ DESPUÉS: función que recibe isOpen por sección
const styles = useMemo(() => ({
  getSectionContent: (isOpen: boolean) => ({
    maxHeight: isOpen ? '2000px' : '0',
    padding: isOpen ? '6px 18px 18px' : '0 18px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    backgroundColor: colors.bgSecondary,
  }),
}), [colors]);

// En el render:
{SECTION_ORDER.map((key) => {
  const isOpen = openSection === key;
  return (
    <div style={styles.getSectionContent(isOpen)}>...</div>
  );
})}
```

---

## 4. Error al hacer login en navegador (dev)

**Síntoma:** `TypeError: Cannot read properties of undefined (reading 'users')` al hacer login desde `http://localhost:5173`.

**Causa:** La API `window.dajhoAPI` solo existe dentro de la ventana nativa de Electron (expuesta por el preload script). En un navegador común, `window.dajhoAPI` es `undefined`.

**Solución:** Usar la ventana de Electron, no el navegador. La app se inicia con `npm run dev` que lanza tanto Vite como Electron automáticamente.

> ⚠️ `http://localhost:5173` es solo el servidor de desarrollo de Vite. No tiene acceso a las APIs de Electron (IPC, base de datos, sistema de archivos).

---

## 5. Vite se reinicia solo y mata Electron

**Síntoma:** Al modificar `vite.config.ts`, Vite se reinicia y `concurrently` termina el proceso de Electron.

**Causa:** `concurrently -k` envía SIGTERM a TODOS los procesos cuando uno termina. Al reiniciar Vite, Electron se mata.

**Solución:**

1. Detener el dev server (`Ctrl+C`)
2. Matar procesos zombie:
   ```powershell
   Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
3. Reiniciar: `npm run dev`

Para evitar el problema, modificar `vite.config.ts` antes de iniciar el dev server, no después.

---

## 6. Múltiples procesos de Electron acumulados

**Síntoma:** Varias ventanas de Electron abiertas, la app se vuelve lenta o la BD se corrompe.

**Causa:** Cada vez que Vite reinicia (por cambio en `vite.config.ts`), se lanza una nueva instancia de Electron sin matar la anterior.

**Solución:**

```powershell
# Matar TODOS los procesos de Electron
Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force

# Verificar que no queden
Get-Process electron -ErrorAction SilentlyContinue | Format-Table Id, ProcessName
```

---

## 7. Error de caché de disco en Electron

**Síntoma:** En la terminal:
```
ERROR:net\disk_cache\cache_util_win.cc:25] Unable to move the cache: Acceso denegado.
ERROR:gpu\ipc\host\gpu_disk_cache.cc:737] Gpu Cache Creation failed: -2
```

**Causa:** Múltiples instancias de Electron compitiendo por la misma carpeta de caché de GPU.

**Solución:** Es inofensivo. Solo indica que hay procesos zombie. Matar los procesos extras de Electron.

---

## 8. Puerto en uso al hacer dev

**Síntoma:** `Port 5173 is in use, trying another one...` y la app se abre en `localhost:5174` (u otro puerto).

**Causa:** Una instancia anterior de Vite quedó ejecutándose en el puerto 5173.

**Solución:**

```powershell
# Encontrar el proceso que usa el puerto 5173
netstat -ano | findstr :5173

# Matar el proceso por PID (ejemplo: PID 12345)
taskkill /F /PID 12345
```

O simplemente reiniciar la PC si es persistente.

---

## 9. Chunks grandes en el build

**Síntoma:**
```
(!) Some chunks are larger than 500 kB after minification.
assets/Sales-BSk9pClU.js 1,482.12 kB
```

**Causa:** El módulo de Ventas (`Sales.tsx`) es muy grande porque incluye la librería `xlsx` y componentes pesados.

**Soluciones posibles:**

1. **Code splitting más granular:** Dividir `Sales.tsx` en sub-módulos lazy.
2. **Mover `xlsx` a chunk separado:** En `vite.config.ts`:
   ```ts
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           xlsx: ['xlsx'],
         },
       },
     },
   }
   ```
3. **Cargar xlsx solo cuando se necesita:** Import dinámico en el componente que lo usa.

---

## 10. Base de datos: backup y recuperación

**Ubicación de la BD:**
```
%APPDATA%/dajho-desktop/database.db
```

**Backup automático:** La app crea un backup en `database.backup.db` cada vez que inicia.

**Recuperación manual:**
1. Cerrar la app
2. Copiar `database.backup.db` a `database.db`
3. Reiniciar la app

**Respaldos manuales:** Desde Configuración → Base de Datos → "Respaldar ahora".

---

> 📝 **Última actualización:** 28/06/2026
