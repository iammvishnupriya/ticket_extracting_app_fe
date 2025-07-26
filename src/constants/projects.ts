// ⚠️ DEPRECATED: These are fallback project names only.
// Project names should now be fetched dynamically from the backend using useProjects() hook.
// This constant is kept for backward compatibility and fallback scenarios only.
export const FALLBACK_PROJECT_NAMES = [
  'Material reciept',
  'My buddy',
  'CK_Alumni',
  'HEPL_Alumni',
  'MMW Module(Ticket tool)',
  'CK Trends',
  'Livewire',
  'Meeting agenda',
  'Pro Hire',
  'E-Capex',
  'SOP',
  'Assert Management',
  'Mould Mamp'
] as const;

// Legacy export for backward compatibility
export const PROJECT_NAMES = FALLBACK_PROJECT_NAMES;

export type ProjectName = string; // Now allows any string from backend