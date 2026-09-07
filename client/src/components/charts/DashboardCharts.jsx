import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1'];

export function CategoryChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = {
    labels: data.map(d => d.name?.length > 15 ? d.name.substring(0, 15) + '...' : d.name),
    datasets: [{
      data: data.map(d => d.count),
      backgroundColor: COLORS.slice(0, data.length),
      borderWidth: 0,
      borderRadius: 6
    }]
  };

  return (
    <Bar data={chartData} options={{
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
    }} />
  );
}

export function StatusDonut({ data }) {
  if (!data || data.length === 0) return null;

  const statusColors = {
    submitted: '#3b82f6', ai_analyzed: '#8b5cf6', assigned: '#6366f1', under_review: '#f59e0b',
    in_progress: '#f97316', resolved: '#22c55e', closed: '#6b7280', rejected: '#ef4444', verified: '#059669'
  };

  const chartData = {
    labels: data.map(d => d.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
    datasets: [{
      data: data.map(d => d.count),
      backgroundColor: data.map(d => statusColors[d.status] || '#6b7280'),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  return (
    <Doughnut data={chartData} options={{
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15, font: { size: 11 } } } },
      cutout: '65%'
    }} />
  );
}

export function TrendLine({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = {
    labels: data.map(d => d.month || d.date),
    datasets: [
      {
        label: 'Total', data: data.map(d => d.total || d.count), borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#3b82f6'
      },
      ...(data[0]?.resolved !== undefined ? [{
        label: 'Resolved', data: data.map(d => d.resolved), borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#22c55e'
      }] : [])
    ]
  };

  return (
    <Line data={chartData} options={{
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { usePointStyle: true } } },
      scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
    }} />
  );
}

export function PriorityChart({ data }) {
  if (!data || data.length === 0) return null;

  const prioColors = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

  const chartData = {
    labels: data.map(d => d.priority?.charAt(0).toUpperCase() + d.priority?.slice(1)),
    datasets: [{
      data: data.map(d => d.count),
      backgroundColor: data.map(d => prioColors[d.priority] || '#6b7280'),
      borderWidth: 2, borderColor: '#fff'
    }]
  };

  return (
    <Doughnut data={chartData} options={{
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } } },
      cutout: '60%'
    }} />
  );
}

