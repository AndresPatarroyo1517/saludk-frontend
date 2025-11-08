export const ROLES = {
  PACIENTE: 'paciente',
  MEDICO: 'medico',
  DIRECTOR_MEDICO: 'director_medico'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const ROLE_REDIRECTS: Record<UserRole, string> = {
  [ROLES.PACIENTE]: '/dashboard',
  [ROLES.MEDICO]: '/medico',
  [ROLES.DIRECTOR_MEDICO]: '/director'
};

export const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/terms', '/privacy'];