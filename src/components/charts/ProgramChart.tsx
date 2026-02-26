'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { programBreakdown } from '@/lib/mock-data';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ProgramChart() {
  const data = {
    labels: programBreakdown.labels,
    datasets: [
      {
        data: programBreakdown.data,
        backgroundColor: programBreakdown.colors,
        borderWidth: 3,
        borderColor: '#fff',
        hoverBorderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle' as const,
          font: { family: "'DM Sans', sans-serif" },
        },
      },
    },
  };

  return (
    <div className="h-[280px]">
      <Doughnut data={data} options={options} />
    </div>
  );
}
