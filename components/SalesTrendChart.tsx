'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface Props {
  labels: string[];
  amounts: number[];
}

export default function SalesTrendChart({ labels, amounts }: Props) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Revenue (P)',
        data: amounts,
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13,110,253,0.12)',
        pointBackgroundColor: '#0d6efd',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => ` P${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v: number | string) => `P${Number(v).toFixed(0)}`,
          font: { size: 11 },
        },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ position: 'relative', height: '200px' }}>
      <Line data={data} options={options as object} />
    </div>
  );
}
