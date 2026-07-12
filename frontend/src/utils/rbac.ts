// ─── RBAC Permission Configuration ────────────────────────────────────────────
// Defines which pages and which CRUD actions each role can perform.

export type AppRole =
  | 'ADMIN'           // Fleet Manager — full access
  | 'DISPATCHER'      // Operations Dispatcher — trips & drivers
  | 'SAFETY_OFFICER'  // Safety Compliance — maintenance & fleet
  | 'FINANCIAL_ANALYST' // Finance — expenses, fuel, reports
  | 'DRIVER';         // Transit Operator — own trips & fuel

// Pages each role may access
export const PAGE_ACCESS: Record<AppRole, string[]> = {
  ADMIN:             ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuel', 'expenses', 'reports'],
  DISPATCHER:        ['dashboard', 'fleet', 'drivers', 'trips'],
  SAFETY_OFFICER:    ['dashboard', 'fleet', 'drivers', 'maintenance'],
  FINANCIAL_ANALYST: ['dashboard', 'expenses', 'fuel', 'reports'],
  DRIVER:            ['dashboard', 'trips', 'fuel'],
};

// Resources each role may CREATE
export const CAN_CREATE: Record<AppRole, string[]> = {
  ADMIN:             ['vehicle', 'driver', 'trip', 'maintenance', 'fuel', 'expense'],
  DISPATCHER:        ['trip'],
  SAFETY_OFFICER:    ['maintenance'],
  FINANCIAL_ANALYST: ['expense'],
  DRIVER:            ['fuel'],
};

// Resources each role may DELETE
export const CAN_DELETE: Record<AppRole, string[]> = {
  ADMIN:             ['vehicle', 'driver', 'trip', 'maintenance', 'fuel', 'expense'],
  DISPATCHER:        [],
  SAFETY_OFFICER:    [],
  FINANCIAL_ANALYST: [],
  DRIVER:            [],
};

// Resources each role may EDIT/UPDATE
export const CAN_EDIT: Record<AppRole, string[]> = {
  ADMIN:             ['vehicle', 'driver', 'trip', 'maintenance', 'fuel', 'expense'],
  DISPATCHER:        ['trip'],
  SAFETY_OFFICER:    ['maintenance'],
  FINANCIAL_ANALYST: ['expense'],
  DRIVER:            [],
};

function normalizeRole(role?: string | null): AppRole {
  const valid: AppRole[] = ['ADMIN', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER'];
  if (role && valid.includes(role as AppRole)) return role as AppRole;
  return 'DRIVER'; // safest fallback
}

export function canAccessPage(role: string | undefined | null, page: string): boolean {
  return PAGE_ACCESS[normalizeRole(role)]?.includes(page) ?? false;
}

export function canCreate(role: string | undefined | null, resource: string): boolean {
  return CAN_CREATE[normalizeRole(role)]?.includes(resource) ?? false;
}

export function canDelete(role: string | undefined | null, resource: string): boolean {
  return CAN_DELETE[normalizeRole(role)]?.includes(resource) ?? false;
}

export function canEdit(role: string | undefined | null, resource: string): boolean {
  return CAN_EDIT[normalizeRole(role)]?.includes(resource) ?? false;
}

// Human-readable label per role
export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN:             'Fleet Manager',
  DISPATCHER:        'Dispatcher',
  SAFETY_OFFICER:    'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
  DRIVER:            'Driver',
};

export function getRoleLabel(role?: string | null): string {
  return ROLE_LABELS[normalizeRole(role)] ?? role ?? 'Unknown';
}
