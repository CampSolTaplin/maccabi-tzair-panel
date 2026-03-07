import { Chanich } from '@/types';

// ── Group definitions for attendance tabs & roster filtering ──

export interface GroupDef {
  key: string;
  label: string;
  area: string;
  color: string;
}

export const PROGRAM_GROUPS = ['Pre-SOM', 'Trips', 'Machanot'];

export const GROUP_DEFS: GroupDef[] = [
  { key: 'Kinder', label: 'Kinder', area: 'Katan', color: 'text-blue-700' },
  { key: '1st Grade', label: '1st Grade', area: 'Katan', color: 'text-blue-700' },
  { key: '2nd Grade', label: '2nd Grade', area: 'Katan', color: 'text-blue-700' },
  { key: '3rd Grade', label: '3rd Grade', area: 'Katan', color: 'text-blue-700' },
  { key: '4th Grade', label: '4th Grade', area: 'Katan', color: 'text-blue-700' },
  { key: '5th Grade', label: '5th Grade', area: 'Katan', color: 'text-blue-700' },
  { key: '6th Grade', label: '6th Grade', area: 'Noar', color: 'text-purple-700' },
  { key: '7th Grade', label: '7th Grade', area: 'Noar', color: 'text-purple-700' },
  { key: '8th Grade', label: '8th Grade', area: 'Noar', color: 'text-purple-700' },
  { key: 'Pre-SOM', label: 'Pre-SOM', area: 'Leadership', color: 'text-amber-700' },
  { key: 'Trips', label: 'Trips', area: 'Special', color: 'text-rose-700' },
  { key: 'Machanot', label: 'Machanot', area: 'Special', color: 'text-cyan-700' },
];

/** Check if a chanich belongs to a specific group */
export function matchesGroup(groupKey: string, chanich: Chanich): boolean {
  if (PROGRAM_GROUPS.includes(groupKey)) return chanich.program === groupKey;
  return chanich.gradeLevel.toLowerCase().includes(groupKey.toLowerCase());
}

/** Find the first matching group key for a chanich */
export function findGroupKey(chanich: Chanich): string | null {
  for (const g of GROUP_DEFS) {
    if (matchesGroup(g.key, chanich)) return g.key;
  }
  return null;
}
