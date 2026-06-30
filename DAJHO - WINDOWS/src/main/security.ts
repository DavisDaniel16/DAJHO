/**
 * security.ts — Módulo de seguridad centralizado
 * 
 * Separado de ipc-handlers.ts para mantener una única fuente de verdad
 * sobre permisos, rate limiting y auditoría.
 */

// ═══════════════════════════════════════════════════════════
// MAPA DE PERMISOS
// ═══════════════════════════════════════════════════════════
// Define qué rol puede ejecutar cada canal IPC.
// Los canales NO listados aquí son accesibles por cualquier rol autenticado.
export const HANDLER_PERMISSIONS: Record<string, string[]> = {
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
  // Recibos — solo owner puede eliminar
  'db:recibos:delete': ['owner'],
  // Auditoría — solo owner
  'db:audit:getLogs': ['owner'],
  // Usuarios bloqueados — solo owner
  'db:users:unlock': ['owner'],
  'db:users:getLocked': ['owner'],
};

/**
 * Verifica si un rol tiene permiso para ejecutar un canal IPC.
 */
export function validatePermission(channel: string, userRole?: string | null): boolean {
  const requiredRoles = HANDLER_PERMISSIONS[channel];
  if (!requiredRoles) return true; // canal público (requiere autenticación)
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

// ═══════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_CONFIG: Record<string, number> = {
  // Operaciones críticas — más restrictivas
  'db:users:login': 10,
  'db:utils:verifyPassword': 15,
  'db:users:create': 5,
  // Operaciones de escritura — límite moderado
  'db:sales:create': 30,
  'db:products:create': 20,
  'db:products:update': 20,
  'db:clients:create': 20,
  'db:recibos:save': 30,
  // Backup — muy restrictivo
  'db:backup:manual': 2,
  'db:backup:restore': 1,
  // Por defecto para todo lo demás
  default: 120,
};

/**
 * Verifica rate limiting para un canal.
 * Retorna true si la petición está dentro del límite, false si excede.
 */
export function checkRateLimit(channel: string): boolean {
  const now = Date.now();
  const maxRequests = RATE_LIMIT_CONFIG[channel] ?? RATE_LIMIT_CONFIG.default;
  const key = channel;

  let entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000 }; // ventana de 1 minuto
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  if (entry.count > maxRequests) {
    console.warn(`[RATE LIMIT] Canal '${channel}' excedido (${entry.count}/${maxRequests})`);
    return false;
  }

  return true;
}

/**
 * Limpia entradas expiradas del rate limit store (opcional, para evitar memory leak).
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000);
