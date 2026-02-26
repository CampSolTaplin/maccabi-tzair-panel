import { Chanich, Activity, CommunityHours, AttendanceRecord, KPIData } from '@/types';

export const kpiData: KPIData = {
  totalChanichim: 608,
  totalMadrichim: 45,
  avgAttendance: 78,
  totalCommunityHours: 1240,
};

export const mockChanichim: Chanich[] = [
  { id: '1', fullName: 'Amelia Desai', gender: '', accountName: 'JJ Desai and Estee Garazi', age: 7, emergencyContactName: 'Estee Garazi', grade: 'Grade 1', school: 'Pine Crest', allergies: 'No', emergencyPhone: '305-788-7885', jewishIdentification: 'Mother', communityService: 'None', keepKosher: 'Yes', primaryEmail: 'egarazi@gmail.com', primaryPhone: '305-788-7885', contactPhone: '949-291-9992', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|1. Maccabi Katan (K-5 Grade)', program: 'Maccabi Katan', gradeLevel: '1st' },
  { id: '2', fullName: 'Tamar Silverstein', gender: 'Female', accountName: 'Perla and Scott Silverstein', age: 7, emergencyContactName: 'Perla Silverstein', grade: 'Grade 1', school: 'Ben Gamla', allergies: 'N/A', emergencyPhone: '305-725-7375', jewishIdentification: 'Both', communityService: 'JCC', keepKosher: 'No', primaryEmail: 'perliek@hotmail.com', primaryPhone: '305-725-7375', contactPhone: '305-725-7375', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|1. Maccabi Katan (K-5 Grade)', program: 'Maccabi Katan', gradeLevel: '1st' },
  { id: '3', fullName: 'Juliana Baredes', gender: '', accountName: 'Ezequiel Baredes and Yanina Miculitzki', age: 7, emergencyContactName: 'Yanina Miculitzki', grade: 'Grade 1', school: 'ACES', allergies: 'No', emergencyPhone: '305-450-1061', jewishIdentification: 'Both', communityService: 'JCC', keepKosher: 'No', primaryEmail: 'ebaredes@gmail.com', primaryPhone: '786-234-4321', contactPhone: '786-234-4321', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|1. Maccabi Katan (K-5 Grade)', program: 'Maccabi Katan', gradeLevel: '1st' },
  { id: '4', fullName: 'Aidan Cohen', gender: '', accountName: 'Roberto Cohen and Tatiana Feldman', age: 6, emergencyContactName: 'Tatiana Feldman', grade: 'Grade 1', school: 'Posnack', allergies: 'No', emergencyPhone: '917-402-7998', jewishIdentification: 'Both', communityService: 'None', keepKosher: 'No', primaryEmail: 'feld901@gmail.com', primaryPhone: '', contactPhone: '', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|1. Maccabi Katan (K-5 Grade)', program: 'Maccabi Katan', gradeLevel: '1st' },
  { id: '5', fullName: 'Sophia Levy', gender: 'Female', accountName: 'David and Rachel Levy', age: 9, emergencyContactName: 'Rachel Levy', grade: 'Grade 3', school: 'Scheck Hillel', allergies: 'No', emergencyPhone: '305-555-1234', jewishIdentification: 'Both', communityService: 'JCC', keepKosher: 'No', primaryEmail: 'rlevy@gmail.com', primaryPhone: '305-555-1234', contactPhone: '305-555-1234', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|1. Maccabi Katan (K-5 Grade)', program: 'Maccabi Katan', gradeLevel: '3rd' },
  { id: '6', fullName: 'David Mizrahi', gender: 'Male', accountName: 'Avi and Sarah Mizrahi', age: 11, emergencyContactName: 'Sarah Mizrahi', grade: 'Grade 5', school: 'Torah Academy', allergies: 'Nuts', emergencyPhone: '786-555-2345', jewishIdentification: 'Both', communityService: 'Synagogue', keepKosher: 'Yes', primaryEmail: 'smizrahi@gmail.com', primaryPhone: '786-555-2345', contactPhone: '786-555-2345', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|1. Maccabi Katan (K-5 Grade)', program: 'Maccabi Katan', gradeLevel: '5th' },
  { id: '7', fullName: 'Aaron Saada', gender: 'Male', accountName: 'Yosef and Yael Saada', age: 12, emergencyContactName: 'Yael Saada', grade: 'Grade 6', school: 'Ben Gamla', allergies: 'No', emergencyPhone: '305-555-5678', jewishIdentification: 'Both', communityService: 'None', keepKosher: 'No', primaryEmail: 'ysaada@gmail.com', primaryPhone: '305-555-5678', contactPhone: '305-555-5678', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|2. Maccabi Noar (6 - 8 Grade)', program: 'Maccabi Noar', gradeLevel: '6th' },
  { id: '8', fullName: 'Daniel Stern', gender: 'Male', accountName: 'Michael and Laura Stern', age: 13, emergencyContactName: 'Michael Stern', grade: 'Grade 7', school: 'Scheck Hillel', allergies: 'No', emergencyPhone: '305-555-7890', jewishIdentification: 'Both', communityService: 'JCC', keepKosher: 'No', primaryEmail: 'lstern@gmail.com', primaryPhone: '305-555-7890', contactPhone: '305-555-7890', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|2. Maccabi Noar (6 - 8 Grade)', program: 'Maccabi Noar', gradeLevel: '7th' },
  { id: '9', fullName: 'Gabriel Plotkin', gender: 'Male', accountName: 'Marcos and Diana Plotkin', age: 14, emergencyContactName: 'Marcos Plotkin', grade: 'Grade 8', school: 'Ben Gamla', allergies: 'No', emergencyPhone: '305-555-9012', jewishIdentification: 'Both', communityService: 'None', keepKosher: 'No', primaryEmail: 'dplotkin@gmail.com', primaryPhone: '305-555-9012', contactPhone: '305-555-9012', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|2. Maccabi Noar (6 - 8 Grade)', program: 'Maccabi Noar', gradeLevel: '8th' },
  { id: '10', fullName: 'Isabella Katz', gender: 'Female', accountName: 'Roberto and Daniela Katz', age: 14, emergencyContactName: 'Daniela Katz', grade: 'Grade 8', school: 'Torah Academy', allergies: 'Shellfish', emergencyPhone: '786-555-0123', jewishIdentification: 'Both', communityService: 'Synagogue', keepKosher: 'Yes', primaryEmail: 'dkatz@gmail.com', primaryPhone: '786-555-0123', contactPhone: '786-555-0123', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|2. Maccabi Noar (6 - 8 Grade)', program: 'Maccabi Noar', gradeLevel: '8th' },
  { id: '11', fullName: 'Abraham Mandelblum', gender: 'Male', accountName: 'Daniel and Ruth Mandelblum', age: 15, emergencyContactName: 'Ruth Mandelblum', grade: 'Grade 9', school: 'Scheck Hillel', allergies: 'No', emergencyPhone: '305-555-3344', jewishIdentification: 'Both', communityService: 'JCC', keepKosher: 'No', primaryEmail: 'rmandelblum@gmail.com', primaryPhone: '305-555-3344', contactPhone: '305-555-3344', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|3. Maccabi Pre-School of Madrichim', program: 'Pre-SOM', gradeLevel: '9th' },
  { id: '12', fullName: 'Adina Carmi', gender: 'Female', accountName: 'Eli and Yael Carmi', age: 15, emergencyContactName: 'Yael Carmi', grade: 'Grade 9', school: 'MAST Academy', allergies: 'No', emergencyPhone: '786-555-4455', jewishIdentification: 'Both', communityService: 'None', keepKosher: 'No', primaryEmail: 'ycarmi@gmail.com', primaryPhone: '786-555-4455', contactPhone: '786-555-4455', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|3. Maccabi Pre-School of Madrichim', program: 'Pre-SOM', gradeLevel: '9th' },
  { id: '13', fullName: 'Abigail Sananes', gender: 'Female', accountName: 'Ricardo and Monica Sananes', age: 16, emergencyContactName: 'Monica Sananes', grade: 'Grade 10', school: 'Scheck Hillel', allergies: 'No', emergencyPhone: '305-555-7788', jewishIdentification: 'Both', communityService: 'JCC', keepKosher: 'No', primaryEmail: 'msananes@gmail.com', primaryPhone: '305-555-7788', contactPhone: '305-555-7788', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|4. School of Madrichim', program: 'SOM', gradeLevel: '10th' },
  { id: '14', fullName: 'Alan Birnbaum', gender: 'Male', accountName: 'Jorge and Claudia Birnbaum', age: 16, emergencyContactName: 'Claudia Birnbaum', grade: 'Grade 10', school: 'MAST Academy', allergies: 'No', emergencyPhone: '305-555-9900', jewishIdentification: 'Both', communityService: 'None', keepKosher: 'No', primaryEmail: 'cbirnbaum@gmail.com', primaryPhone: '305-555-9900', contactPhone: '305-555-9900', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|4. School of Madrichim', program: 'SOM', gradeLevel: '10th' },
  { id: '15', fullName: 'Emma Zilberberg', gender: 'Female', accountName: 'Pablo and Ana Zilberberg', age: 13, emergencyContactName: 'Ana Zilberberg', grade: 'Grade 7', school: 'Posnack', allergies: 'No', emergencyPhone: '954-555-8901', jewishIdentification: 'Both', communityService: 'JCC', keepKosher: 'No', primaryEmail: 'azilberberg@gmail.com', primaryPhone: '954-555-8901', contactPhone: '954-555-8901', allEmails: '', enrollmentId: '', contactId: '', courseOptionId: '', fullCourseOption: 'Hebraica|2. Maccabi Noar (6 - 8 Grade)', program: 'Maccabi Noar', gradeLevel: '7th' },
];

export const mockActivities: Activity[] = [
  { id: '1', name: 'Shabat Regular — Katan + Noar', type: 'shabat', date: '2026-03-07', programs: ['Maccabi Katan', 'Maccabi Noar'], grades: ['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'], registeredCount: 390, description: 'Actividad semanal de Shabat', location: 'JCC' },
  { id: '2', name: 'Sleepover Noar — 6to a 8vo', type: 'sleepover', date: '2026-03-14', programs: ['Maccabi Noar'], grades: ['6th', '7th', '8th'], registeredCount: 200, description: 'Noche en el JCC para Maccabi Noar', location: 'JCC' },
  { id: '3', name: 'Machane Maccabiland — La Llanada', type: 'machaneh', date: '2026-03-21', endDate: '2026-03-23', programs: ['Maccabi Katan'], grades: ['1st', '2nd', '3rd', '4th', '5th'], registeredCount: 196, description: 'Campamento para Katan 1ro-5to grado', location: 'Camp La Llanada' },
  { id: '4', name: 'PRE-SOM Costa Rica Trip', type: 'trip', date: '2026-04-04', endDate: '2026-04-09', programs: ['Pre-SOM'], grades: ['9th'], registeredCount: 70, description: 'Viaje de Spring Break para 9no grado', location: 'Costa Rica' },
  { id: '5', name: 'Cadena Mexico Trip', type: 'trip', date: '2026-05-01', endDate: '2026-05-05', programs: ['Maccabi Noar', 'Pre-SOM'], grades: ['8th', '9th'], registeredCount: 58, description: 'Viaje educativo a México', location: 'México' },
  { id: '6', name: 'Panama Trip', type: 'trip', date: '2026-06-13', endDate: '2026-06-17', programs: ['Maccabi Noar'], grades: ['7th', '8th'], registeredCount: 52, description: 'Viaje a la comunidad judía de Panamá', location: 'Panamá' },
  { id: '7', name: 'Machane Gadol — SOM', type: 'machaneh', date: '2026-04-11', endDate: '2026-04-14', programs: ['SOM'], grades: ['10th'], registeredCount: 86, description: 'Campamento para SOM', location: 'Camp La Llanada' },
  { id: '8', name: 'Machane Gadol — Pre-SOM', type: 'machaneh', date: '2026-04-11', endDate: '2026-04-14', programs: ['Pre-SOM'], grades: ['9th'], registeredCount: 45, description: 'Campamento para Pre-SOM', location: 'Camp La Llanada' },
  { id: '9', name: 'Hebraica Puerto Rico Trip', type: 'trip', date: '2026-07-07', endDate: '2026-07-11', programs: ['Maccabi Noar'], grades: ['6th', '7th'], registeredCount: 23, description: 'Viaje comunitario a Puerto Rico', location: 'Puerto Rico' },
];

export const attendanceTrendData = {
  labels: ['Ene 10', 'Ene 17', 'Ene 24', 'Feb 1', 'Feb 7', 'Feb 14', 'Feb 21', 'Feb 28'],
  datasets: {
    katan: [78, 82, 75, 80, 85, 79, 82, 84],
    noar: [72, 70, 74, 68, 75, 72, 76, 75],
    preSom: [65, 68, 62, 70, 66, 71, 69, 71],
    som: [80, 78, 82, 76, 83, 80, 79, 80],
  },
};

export const programBreakdown = {
  labels: ['Katan (K-5)', 'Noar (6-8)', 'Pre-SOM (9th)', 'SOM (10th)'],
  data: [190, 200, 101, 117],
  colors: ['#1B3A5C', '#2D8B4E', '#D4A843', '#C0392B'],
};

export const hoursLeaderboard = [
  { name: 'Gabriel Plotkin', program: 'Noar', grade: '8th', hours: 38, lastActivity: 'Limpieza de playa' },
  { name: 'Isabella Katz', program: 'Noar', grade: '8th', hours: 34, lastActivity: 'Visita asilo de ancianos' },
  { name: 'Abraham Mandelblum', program: 'Pre-SOM', grade: '9th', hours: 29, lastActivity: 'Banco de alimentos' },
  { name: 'Abigail Sananes', program: 'SOM', grade: '10th', hours: 27, lastActivity: 'Tutoría juvenil' },
  { name: 'Daniel Stern', program: 'Noar', grade: '7th', hours: 24, lastActivity: 'Recaudación de fondos' },
  { name: 'Emma Zilberberg', program: 'Noar', grade: '7th', hours: 22, lastActivity: 'Limpieza de playa' },
  { name: 'Adina Carmi', program: 'Pre-SOM', grade: '9th', hours: 20, lastActivity: 'Visita hospital' },
  { name: 'Alan Birnbaum', program: 'SOM', grade: '10th', hours: 16, lastActivity: 'Tutoría juvenil' },
];
