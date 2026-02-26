'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { attendanceTrendData } from '@/lib/mock-data';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function AttendanceChart() {
  const data = {
    labels: attendanceTrendData.labels,
    datasets: [
      {
        label: 'Katan',
        data: attendanceTrendData.datasets.katan,
        borderColor: '#1B2A6B',
        backgroundColor: 'rgba(27,42,107,0.06)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#1B2A6B',
      },
      {
        label: 'Noar',
        data: attendanceTrendData.datasets.noar,
        borderColor: '#2D8B4E',
        backgroundColor: 'rgba(45,139,78,0.04)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#2D8B4E',
      },
      {
        label: 'Pre-SOM',
        data: attendanceTrendData.datasets.preSom,
        borderColor: '#E8687D',
        backgroundColor: 'rgba(232,104,125,0.06)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#E8687D',
      },
      {
        label: 'SOM',
        data: attendanceTrendData.datasets.som,
        borderColor: '#2A3D8F',
        backgroundColor: 'rgba(42,61,143,0.04)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#2A3D8F',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' as const, font: { family: "'DM Sans', sans-serif" } },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 50,
        max: 100,
        ticks: { callback: (v: unknown) => v + '%', font: { family: "'DM Sans', sans-serif" } },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: "'DM Sans', sans-serif" } },
      },
    },
    interaction: { intersect: false, mode: 'index' as const },
  };

  return (
    <div className="h-[280px]">
      <Line data={data} options={options} />
    </div>
  );
}
