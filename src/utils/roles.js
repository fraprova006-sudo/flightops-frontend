export const SUPERVISOR_ROLES = ['COS', 'Responsabile', 'RIT Landside', 'RIT Airside'];

export const canSeeAllFlights = (role) => SUPERVISOR_ROLES.includes(role);
export const canAssignStaff = (role) => ['COS', 'Responsabile'].includes(role);

export const ROLE_COLORS = {
  'COS': '#ef4444',
  'Responsabile': '#f97316',
  'RIT Landside': '#eab308',
  'RIT Airside': '#84cc16',
  'Gate Agent': '#06b6d4',
  'Check-in': '#3b82f6',
  'Rampa': '#8b5cf6',
  'Capisquadra': '#ec4899',
  'Nastro Bagagli': '#14b8a6',
  'Aviazione Generale': '#f59e0b',
  'Autista Mezzi Complessi': '#6366f1',
  'Manutenzione': '#78716c',
  'PRM': '#10b981',
  'Security': '#dc2626',
  'Security Carraio': '#b91c1c',
  'Carboil': '#d97706',
  'Arrivi/Lost & Found': '#7c3aed',
  'Cargo': '#0891b2',
  'Biglietteria': '#16a34a',
};
