'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  labels: string[];
  amounts: number[];
}

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#20c997'];

export default function PrinterRevenueChart({ labels, amounts }: Props) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Revenue (P)',
        data: amounts,
        backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
        borderRadius: 6,
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
        ticks: { callback: (v: number | string) => `P${Number(v).toFixed(0)}`, font: { size: 11 } },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
  };

  return (
    <div style={{ position: 'relative', height: '200px' }}>
      {labels.length === 0 ? (
        <div className="d-flex align-items-center justify-content-center h-100 text-secondary small">
          No sales data yet
        </div>
      ) : (
        <Bar data={data} options={options as object} />
      )}
    </div>
  );
}
