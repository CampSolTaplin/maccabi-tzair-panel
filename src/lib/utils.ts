import { Program } from '@/types';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function parseProgram(courseOption: string): Program {
  if (courseOption.includes('Maccabi Katan')) return 'Maccabi Katan';
  if (courseOption.includes('Maccabi Noar')) return 'Maccabi Noar';
  if (courseOption.includes('Pre-School of Madrichim') || courseOption.includes('PRE-SOM'))
    return 'Pre-SOM';
  if (courseOption.includes('School of Madrichim') || courseOption.includes('SOM'))
    return 'SOM';
  return 'Maccabi Katan';
}

export function parseGrade(grade: string): string {
  if (!grade) return 'N/A';
  const g = grade.toLowerCase().trim();
  if (g.includes('kinder') || g === 'k') return 'K';
  if (g.includes('preschool') || g.includes('pre-k')) return 'Pre-K';
  const match = g.match(/(\d+)/);
  if (match) return `${match[1]}th`;
  return grade;
}

export function programColor(program: Program): string {
  const colors: Record<Program, string> = {
    'Maccabi Katan': '#1B3A5C',
    'Maccabi Noar': '#2D8B4E',
    'Pre-SOM': '#D4A843',
    'SOM': '#C0392B',
    'Madrichim': '#6C3483',
    'Sr. Madrichim': '#1A5276',
  };
  return colors[program] || '#1B3A5C';
}

export function programBgClass(program: Program): string {
  const classes: Record<Program, string> = {
    'Maccabi Katan': 'bg-blue-100 text-blue-800',
    'Maccabi Noar': 'bg-green-100 text-green-800',
    'Pre-SOM': 'bg-amber-100 text-amber-800',
    'SOM': 'bg-red-100 text-red-800',
    'Madrichim': 'bg-purple-100 text-purple-800',
    'Sr. Madrichim': 'bg-indigo-100 text-indigo-800',
  };
  return classes[program] || 'bg-gray-100 text-gray-800';
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
