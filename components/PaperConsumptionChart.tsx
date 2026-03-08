'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  labels: string[];
  counts: number[];
}

const COLORS = ['#6c757d', '#ffc107', '#dc3545', '#6f42c1', '#0d6efd', '#198754', '#20c997', '#fd7e14'];

export default function PaperConsumptionChart({ labels, counts }: Props) {
  const data = {
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div style={{ position: 'relative', height: '200px' }}>
      {labels.length === 0 ? (
        <div className="d-flex align-items-center justify-content-center h-100 text-secondary small">
          No sales data yet
        </div>
      ) : (
        <Doughnut data={data} options={options} />
      )}
    </div>
  );
}
