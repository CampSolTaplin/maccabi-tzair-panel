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
  if (match) {
    const num = parseInt(match[1]);
    if (num === 1) return '1st';
    if (num === 2) return '2nd';
    if (num === 3) return '3rd';
    return `${num}th`;
  }
  return grade;
}

export function programColor(program: Program): string {
  const colors: Record<Program, string> = {
    'Maccabi Katan': '#1B2A6B',
    'Maccabi Noar': '#2D8B4E',
    'Pre-SOM': '#E8687D',
    'SOM': '#2A3D8F',
    'Madrichim': '#6C3483',
    'Sr. Madrichim': '#1A5276',
  };
  return colors[program] || '#1B2A6B';
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
