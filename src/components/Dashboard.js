import React, { useState, useEffect, useRef } from 'react';
import { Grid, Paper, Typography, Box, useTheme, Button, Fab, Dialog, DialogTitle, DialogContent, TextField, IconButton, List, ListItem, ListItemText, Avatar, useMediaQuery } from '@mui/material';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import axios from 'axios';
import MenuItem from '@mui/material/MenuItem';
import { motion } from 'framer-motion';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  ChartDataLabels
);

// Format number to Indonesian currency format
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// AnimatedNumber: casino-style animated number
function AnimatedNumber({ value, duration = 2500, prefix = 'Rp ' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = display;
    let startTime = null;
    function animate(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setDisplay(start + (value - start) * progress);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
    return () => setDisplay(value);
    // eslint-disable-next-line
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {display.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

function Dashboard() {
  const theme = useTheme();
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    categoryExpenses: [],
    categoryIncome: [],
    dailyAverages: [],
  });
  
  // Load chart options from localStorage with defaults
  const [range, setRange] = useState(() => {
    const savedRange = localStorage.getItem('dashboard-range');
    return savedRange || 'all';
  });
  
  const [viewType, setViewType] = useState(() => {
    const savedViewType = localStorage.getItem('dashboard-viewType');
    return savedViewType || 'simple';
  });
  
  const [valueMode, setValueMode] = useState(() => {
    const savedValueMode = localStorage.getItem('dashboard-valueMode');
    return savedValueMode || 'default';
  });
  
  const [rangeData, setRangeData] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // AI Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref for input field
  const inputRef = useRef(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isPortrait = useMediaQuery('(orientation: portrait)');

  // Save chart options to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dashboard-range', range);
  }, [range]);

  useEffect(() => {
    localStorage.setItem('dashboard-viewType', viewType);
  }, [viewType]);

  useEffect(() => {
    localStorage.setItem('dashboard-valueMode', valueMode);
  }, [valueMode]);

  const rangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' },
  ];

  const viewTypeOptions = [
    { value: 'simple', label: 'Simple' },
    { value: 'complex', label: 'Complex' },
  ];

  const valueModeOptions = [
    { value: 'default', label: 'Column Bar' },
    { value: 'sum', label: 'Line Graph' },
  ];

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/summary');
        setSummary(response.data);
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchRangeData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/transactions/summary-range?range=${range}&breakdown=${viewType}`);
        console.log('Fetched data:', response.data); // Debug log
        setRangeData(response.data);
      } catch (error) {
        console.error('Error fetching range data:', error);
        setRangeData([]);
      }
    };
    fetchRangeData();
  }, [range, viewType]);

  // Helper to get default or cumulative data
  function getValueArray(arr, isBalance = false) {
    if (valueMode === 'default') return arr;
    // For balance in sum mode, don't accumulate
    if (isBalance && valueMode === 'sum') return arr;
    // Cumulative sum for other cases
    let sum = 0;
    return arr.map(v => (sum += v));
  }

  const lineRangeData = {
    labels: rangeData.map(d => {
      const date = new Date(d.date);
      return range === '7d' || range === '30d' || range === '1m'
        ? date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
        : date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }),
    datasets: viewType === 'simple' ? [
      {
        label: 'Income',
        data: getValueArray(rangeData.map(d => d.income)),
        borderColor: '#00f2fe',
        backgroundColor: 'rgba(0, 242, 254, 0.8)',
        tension: 0.4,
        fill: false,
        pointRadius: 3,
      },
      {
        label: 'Expenses',
        data: getValueArray(rangeData.map(d => d.expenses)),
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.8)',
        tension: 0.4,
        fill: false,
        pointRadius: 3,
      },
      {
        label: 'Balance',
        data: getValueArray(rangeData.map(d => d.balance), true),
        borderColor: '#4facfe',
        backgroundColor: 'rgba(79, 172, 254, 0.8)',
        tension: 0.4,
        fill: false,
        pointRadius: 3,
      },
    ] : (() => {
      // Collect all unique categories across all data points
      const incomeCategoriesSet = new Set();
      const expenseCategoriesSet = new Set();
      rangeData.forEach(d => {
        Object.keys(d.incomeBreakdown || {}).forEach(cat => incomeCategoriesSet.add(cat));
        Object.keys(d.expenseBreakdown || {}).forEach(cat => expenseCategoriesSet.add(cat));
      });
      const incomeCategories = Array.from(incomeCategoriesSet);
      const expenseCategories = Array.from(expenseCategoriesSet);

      const datasets = [];

      // Add income category lines
      incomeCategories.forEach((category, index) => {
        datasets.push({
          label: `Income - ${category}`,
          data: getValueArray(rangeData.map(d => d.incomeBreakdown?.[category] || 0)),
          borderColor: `hsl(${index * 30}, 100%, 50%)`,
          backgroundColor: `hsla(${index * 30}, 100%, 50%, 0.8)`,
          tension: 0.4,
          fill: false,
          pointRadius: 3,
        });
      });

      // Add expense category lines
      expenseCategories.forEach((category, index) => {
        datasets.push({
          label: `Expense - ${category}`,
          data: getValueArray(rangeData.map(d => d.expenseBreakdown?.[category] || 0)),
          borderColor: `hsl(${index * 30 + 180}, 100%, 50%)`,
          backgroundColor: `hsla(${index * 30 + 180}, 100%, 50%, 0.8)`,
          tension: 0.4,
          fill: false,
          pointRadius: 3,
        });
      });

      // Add balance line
      datasets.push({
        label: 'Balance',
        data: getValueArray(rangeData.map(d => d.balance), true),
        borderColor: '#4facfe',
        backgroundColor: 'rgba(79, 172, 254, 0.8)',
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        borderWidth: 2,
        borderDash: [5, 5],
      });

      return datasets;
    })(),
  };

  // Custom external tooltip handler
  function customLineTooltip(context) {
    // Tooltip Element
    let tooltipEl = document.getElementById('custom-line-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'custom-line-tooltip';
      tooltipEl.style.background = 'rgba(20, 30, 40, 0.97)';
      tooltipEl.style.borderRadius = '8px';
      tooltipEl.style.color = '#fff';
      tooltipEl.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.transition = 'all .1s ease';
      tooltipEl.style.zIndex = 1000;
      tooltipEl.style.padding = '10px 16px';
      tooltipEl.style.fontSize = '14px';
      document.body.appendChild(tooltipEl);
    }

    // Hide if no tooltip
    const tooltipModel = context.tooltip;
    if (!tooltipModel || tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    // Title
    let html = '';
    if (tooltipModel.title && tooltipModel.title.length) {
      html += `<div style="font-weight:600;font-size:15px;margin-bottom:6px;">${tooltipModel.title[0]}</div>`;
    }

    // Sort items by value (biggest to smallest)
    const items = tooltipModel.dataPoints ? [...tooltipModel.dataPoints] : [];
    items.sort((a, b) => b.parsed.y - a.parsed.y);

    // List items with colored box
    html += items.map(item => {
      const color = item.dataset.borderColor || item.dataset.backgroundColor;
      return `<div style="display:flex;align-items:center;margin-bottom:2px;">
        <span style="display:inline-block;width:12px;height:12px;background:${color};border-radius:2px;margin-right:8px;"></span>
        <span>${item.dataset.label}: ${formatCurrency(item.parsed.y)}</span>
      </div>`;
    }).join('');

    tooltipEl.innerHTML = html;

    // Smart positioning (relative to page)
    const {caretX, caretY, chart} = tooltipModel;
    const chartRect = chart.canvas.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    let left = chartRect.left + caretX + 16;
    let top;
    // Prefer below, but if not enough space, show above
    if (chartRect.top + caretY + tooltipRect.height + 24 < windowHeight) {
      top = chartRect.top + caretY + 16;
    } else {
      top = chartRect.top + caretY - tooltipRect.height - 16;
      if (top < 0) top = 8;
    }
    // If overflow right, show to the left of the mouse
    if (left + tooltipRect.width > windowWidth - 8) {
      left = chartRect.left + caretX - tooltipRect.width - 16;
      if (left < 8) left = 8;
    }
    // Prevent overflow left
    if (left < 8) left = 8;
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.opacity = 1;
  }

  // Custom plugin for vertical line on hover (for line charts)
  const verticalLinePlugin = {
    id: 'verticalLine',
    afterDraw: (chart) => {
      if (chart.tooltip?._active && chart.tooltip._active.length) {
        const ctx = chart.ctx;
        ctx.save();
        const activePoint = chart.tooltip._active[0];
        const x = activePoint.element.x;
        const topY = chart.scales.y.top;
        const bottomY = chart.scales.y.bottom;
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
  };

  // Custom plugin for bar hover highlight
  const barHoverPlugin = {
    id: 'barHover',
    afterDraw: (chart) => {
      if (chart.tooltip?._active && chart.tooltip._active.length) {
        const ctx = chart.ctx;
        ctx.save();
        
        // Get all active points to determine the full range
        const activePoints = chart.tooltip._active;
        if (activePoints.length > 0) {
          // Find the minimum and maximum x positions of all active bars
          let minX = Infinity;
          let maxX = -Infinity;
          
          activePoints.forEach(point => {
            if (point.element && point.element.x !== undefined) {
              const barWidth = point.element.width || 20;
              const barX = point.element.x;
              const leftX = barX - barWidth / 2;
              const rightX = barX + barWidth / 2;
              
              minX = Math.min(minX, leftX);
              maxX = Math.max(maxX, rightX);
            }
          });
          
          if (minX !== Infinity && maxX !== -Infinity) {
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;
            const highlightWidth = maxX - minX;
            const highlightX = minX;
            
            // Draw full column highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(highlightX, topY, highlightWidth, bottomY - topY);
            
            // Draw column border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(highlightX, topY, highlightWidth, bottomY - topY);
          }
        }
        
        ctx.restore();
      }
    }
  };

  const lineRangeOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.palette.text.primary,
          font: { size: 14, family: theme.typography.fontFamily },
        },
      },
      tooltip: {
        enabled: false, // Disable the default tooltip
        external: customLineTooltip
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        ticks: { color: theme.palette.text.primary },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: { color: theme.palette.text.primary },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  };

  // Custom tooltip for Income by Category
  const incomeTooltip = function(context) {
    // Remove any existing doughnut tooltips first
    const existingTooltips = document.querySelectorAll('[id^="doughnut-tooltip"]');
    existingTooltips.forEach(el => el.remove());
    
    let tooltipEl = document.getElementById('doughnut-tooltip-income');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'doughnut-tooltip-income';
      tooltipEl.style.background = 'rgba(20, 30, 40, 0.97)';
      tooltipEl.style.borderRadius = '8px';
      tooltipEl.style.color = '#fff';
      tooltipEl.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.position = 'fixed';
      tooltipEl.style.transition = 'all .1s ease';
      tooltipEl.style.zIndex = 9999;
      tooltipEl.style.padding = '10px 16px';
      tooltipEl.style.fontSize = '14px';
      document.body.appendChild(tooltipEl);
    }

    const tooltipModel = context.tooltip;
    if (!tooltipModel || tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    const chart = context.chart;
    const dataset = chart.data.datasets[0];
    const labels = chart.data.labels;
    const data = dataset.data;
    
    const allData = labels.map((label, index) => ({
      label: label,
      value: data[index],
      color: dataset.backgroundColor[index] || dataset.borderColor[index]
    })).sort((a, b) => b.value - a.value);

    const total = data.reduce((a, b) => a + b, 0);

    let html = '<div style="font-weight:600;font-size:15px;margin-bottom:8px;">All Income Categories</div>';
    
    html += allData.map(item => {
      const percentage = ((item.value / total) * 100).toFixed(1);
      return `<div style="display:flex;align-items:center;margin-bottom:4px;">
        <span style="display:inline-block;width:12px;height:12px;background:${item.color};border-radius:2px;margin-right:8px;"></span>
        <span>${item.label}: ${formatCurrency(item.value)} (${percentage}%)</span>
      </div>`;
    }).join('');

    tooltipEl.innerHTML = html;

    // Position relative to the specific chart
    const chartRect = chart.canvas.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    
    // Position above the chart
    let left = chartRect.left + (chartRect.width / 2) - (tooltipRect.width / 2);
    let top = chartRect.top - tooltipRect.height - 10;
    
    // Adjust if overflow
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) {
      top = chartRect.bottom + 10; // Show below if no space above
    }
    
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.opacity = 1;
  };

  // Custom tooltip for Expenses by Category
  const expenseTooltip = function(context) {
    // Remove any existing doughnut tooltips first
    const existingTooltips = document.querySelectorAll('[id^="doughnut-tooltip"]');
    existingTooltips.forEach(el => el.remove());
    
    let tooltipEl = document.getElementById('doughnut-tooltip-expense');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'doughnut-tooltip-expense';
      tooltipEl.style.background = 'rgba(20, 30, 40, 0.97)';
      tooltipEl.style.borderRadius = '8px';
      tooltipEl.style.color = '#fff';
      tooltipEl.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.position = 'fixed';
      tooltipEl.style.transition = 'all .1s ease';
      tooltipEl.style.zIndex = 9999;
      tooltipEl.style.padding = '10px 16px';
      tooltipEl.style.fontSize = '14px';
      document.body.appendChild(tooltipEl);
    }

    const tooltipModel = context.tooltip;
    if (!tooltipModel || tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    const chart = context.chart;
    const dataset = chart.data.datasets[0];
    const labels = chart.data.labels;
    const data = dataset.data;
    
    const allData = labels.map((label, index) => ({
      label: label,
      value: data[index],
      color: dataset.backgroundColor[index] || dataset.borderColor[index]
    })).sort((a, b) => b.value - a.value);

    const total = data.reduce((a, b) => a + b, 0);

    let html = '<div style="font-weight:600;font-size:15px;margin-bottom:8px;">All Expense Categories</div>';
    
    html += allData.map(item => {
      const percentage = ((item.value / total) * 100).toFixed(1);
      return `<div style="display:flex;align-items:center;margin-bottom:4px;">
        <span style="display:inline-block;width:12px;height:12px;background:${item.color};border-radius:2px;margin-right:8px;"></span>
        <span>${item.label}: ${formatCurrency(item.value)} (${percentage}%)</span>
      </div>`;
    }).join('');

    tooltipEl.innerHTML = html;

    // Position relative to the specific chart
    const chartRect = chart.canvas.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    
    // Position above the chart
    let left = chartRect.left + (chartRect.width / 2) - (tooltipRect.width / 2);
    let top = chartRect.top - tooltipRect.height - 10;
    
    // Adjust if overflow
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) {
      top = chartRect.bottom + 10; // Show below if no space above
    }
    
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.opacity = 1;
  };

  // Custom tooltip for Income vs Expenses Overview
  const overviewTooltip = function(context) {
    // Remove any existing doughnut tooltips first
    const existingTooltips = document.querySelectorAll('[id^="doughnut-tooltip"]');
    existingTooltips.forEach(el => el.remove());
    
    let tooltipEl = document.getElementById('doughnut-tooltip-overview');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'doughnut-tooltip-overview';
      tooltipEl.style.background = 'rgba(20, 30, 40, 0.97)';
      tooltipEl.style.borderRadius = '8px';
      tooltipEl.style.color = '#fff';
      tooltipEl.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.position = 'fixed';
      tooltipEl.style.transition = 'all .1s ease';
      tooltipEl.style.zIndex = 9999;
      tooltipEl.style.padding = '10px 16px';
      tooltipEl.style.fontSize = '14px';
      document.body.appendChild(tooltipEl);
    }

    const tooltipModel = context.tooltip;
    if (!tooltipModel || tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    const chart = context.chart;
    const dataset = chart.data.datasets[0];
    const labels = chart.data.labels;
    const data = dataset.data;
    
    const allData = labels.map((label, index) => ({
      label: label,
      value: data[index],
      color: dataset.backgroundColor[index] || dataset.borderColor[index]
    })).sort((a, b) => b.value - a.value);

    const total = data.reduce((a, b) => a + b, 0);

    let html = '<div style="font-weight:600;font-size:15px;margin-bottom:8px;">Income vs Expenses</div>';
    
    html += allData.map(item => {
      const percentage = ((item.value / total) * 100).toFixed(1);
      return `<div style="display:flex;align-items:center;margin-bottom:4px;">
        <span style="display:inline-block;width:12px;height:12px;background:${item.color};border-radius:2px;margin-right:8px;"></span>
        <span>${item.label}: ${formatCurrency(item.value)} (${percentage}%)</span>
      </div>`;
    }).join('');

    tooltipEl.innerHTML = html;

    // Position relative to the specific chart
    const chartRect = chart.canvas.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    
    // Position above the chart
    let left = chartRect.left + (chartRect.width / 2) - (tooltipRect.width / 2);
    let top = chartRect.top - tooltipRect.height - 10;
    
    // Adjust if overflow
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) {
      top = chartRect.bottom + 10; // Show below if no space above
    }
    
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.opacity = 1;
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.palette.text.primary,
          font: {
            size: 12,
            family: theme.typography.fontFamily,
          },
          padding: 20,
        },
      },
      datalabels: {
        color: theme.palette.mode === 'light' ? '#ffffff' : '#1a1a1a',
        font: {
          weight: 'bold',
          size: 12,
          family: theme.typography.fontFamily,
        },
        formatter: function(value, context) {
          const dataset = context.dataset;
          const total = dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return percentage + '%';
        },
        textAlign: 'center',
        textBaseline: 'middle',
      }
    },
    cutout: '70%',
  };

  // Income by Category options
  const incomeDoughnutOptions = {
    ...doughnutOptions,
    plugins: {
      ...doughnutOptions.plugins,
      tooltip: {
        enabled: false,
        external: incomeTooltip
      }
    }
  };

  // Expenses by Category options
  const expenseDoughnutOptions = {
    ...doughnutOptions,
    plugins: {
      ...doughnutOptions.plugins,
      tooltip: {
        enabled: false,
        external: expenseTooltip
      }
    }
  };

  // Income vs Expenses Overview options
  const overviewDoughnutOptions = {
    ...doughnutOptions,
    plugins: {
      ...doughnutOptions.plugins,
      tooltip: {
        enabled: false,
        external: overviewTooltip
      }
    }
  };

  const incomeVsExpensesData = {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        data: [Math.abs(summary.totalIncome), Math.abs(summary.totalExpenses)],
        backgroundColor: [
          theme.palette.mode === 'light' ? '#4facfe' : '#00f2fe',
          theme.palette.mode === 'light' ? '#00f2fe' : '#ff6b6b',
        ],
        borderWidth: 0,
      },
    ],
  };

  // Debug logging
  console.log('Income vs Expenses Data:', {
    income: Math.abs(summary.totalIncome),
    expenses: Math.abs(summary.totalExpenses),
    total: Math.abs(summary.totalIncome) + Math.abs(summary.totalExpenses),
    incomePercent: ((Math.abs(summary.totalIncome) / (Math.abs(summary.totalIncome) + Math.abs(summary.totalExpenses))) * 100).toFixed(1),
    expensesPercent: ((Math.abs(summary.totalExpenses) / (Math.abs(summary.totalIncome) + Math.abs(summary.totalExpenses))) * 100).toFixed(1)
  });

  // Special options for Income vs Expenses Overview to ensure 100% total
  const incomeVsExpensesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.palette.text.primary,
          font: {
            size: 12,
            family: theme.typography.fontFamily,
          },
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: theme.palette.mode === 'light' ? '#ffffff' : '#1a1a1a',
        font: {
          weight: 'bold',
          size: 12,
          family: theme.typography.fontFamily,
        },
        formatter: function(value, context) {
          const dataset = context.dataset;
          const total = dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return percentage + '%';
        },
        textAlign: 'center',
        textBaseline: 'middle',
      }
    },
    cutout: '70%',
  };

  const incomeDoughnutData = {
    labels: summary.categoryIncome.map(item => item._id),
    datasets: [
      {
        data: summary.categoryIncome.map(item => item.total),
        backgroundColor: [
          '#00f2fe',
          '#4facfe',
          '#00ff9d',
          '#ff3cac',
          '#ff9a8b',
          '#ff6b6b',
        ],
        borderWidth: 0,
      },
    ],
  };

  const expenseDoughnutData = {
    labels: summary.categoryExpenses.map(item => item._id),
    datasets: [
      {
        data: summary.categoryExpenses.map(item => item.total),
        backgroundColor: [
          '#ff6b6b', // 🍓 Red (primary for expense)
          '#ff8787', // 🍉 Soft red
          '#ffb3b3', // 🩷 Pale pink-red
          '#c94c4c', // 🍒 Dark red
          '#8b0000', // 🍷 Deep red
          '#ff4f81', // 🌺 Warm pink
        ],
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: ['Income', 'Expenses', 'Balance'],
    datasets: [
      {
        label: 'Amount',
        data: [summary.totalIncome, summary.totalExpenses, summary.balance],
        backgroundColor: [
          'rgba(0, 242, 254, 0.8)',
          'rgba(79, 172, 254, 0.8)',
          'rgba(0, 255, 157, 0.8)',
        ],
        borderRadius: 8,
      },
    ],
  };

  const lineData = {
    labels: summary.dailyAverages.map(item => item.day),
    datasets: [
      {
        label: 'Average Income',
        data: summary.dailyAverages.map(item => item.income),
        borderColor: '#00f2fe',
        backgroundColor: 'rgba(0, 242, 254, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Average Expenses',
        data: summary.dailyAverages.map(item => item.expenses),
        borderColor: '#4facfe',
        backgroundColor: 'rgba(79, 172, 254, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.palette.text.primary,
          font: {
            size: 12,
            family: theme.typography.fontFamily,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: function(value) {
            return formatCurrency(value);
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
    },
  };

  // AI Chat functions
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Auto-focus the input field
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    try {
      // Create context from financial data
      const context = {
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpenses,
        balance: summary.balance,
        incomeCategories: summary.categoryIncome,
        expenseCategories: summary.categoryExpenses,
        dailyAverages: summary.dailyAverages
      };

      const response = await axios.post('http://localhost:5000/api/ai-chat', {
        message: inputMessage,
        context: context
      });

      const aiMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Auto-focus again after AI responds
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openChat = () => {
    setChatOpen(true);
    // Add welcome message if it's the first time opening
    if (messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        text: "Hello! I'm Iwa Assistant your personal finance assistant. I can help you analyze your spending patterns, provide insights about your finances, and answer questions about your transactions. How can I help you today?",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages([welcomeMessage]);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatOpen) {
      const messagesContainer = document.getElementById('messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [messages, chatOpen, isLoading]);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
      <Box sx={{ m: 0, p: 3, minHeight: '100vh' }}>
        {isMobile ? (
          <Slider {...sliderSettings}>
            <Box sx={{ px: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  background: theme.palette.mode === 'light' 
                    ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(0, 242, 254, 0.05) 100%)',
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#00f2fe' }}>
                  Total Income
                </Typography>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  color: '#00ff9d',
                  fontSize: { xs: '1.5rem', sm: '2.125rem' } 
                }}>
                  <AnimatedNumber value={summary.totalIncome} />
                </Typography>
              </Paper>
            </Box>
            <Box sx={{ px: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  background: theme.palette.mode === 'light' 
                    ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)',
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#4facfe' }}>
                  Total Expenses
                </Typography>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  color: '#ff6b6b',
                  fontSize: { xs: '1.5rem', sm: '2.125rem' } 
                }}>
                  <AnimatedNumber value={summary.totalExpenses} />
                </Typography>
              </Paper>
            </Box>
            <Box sx={{ px: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  background: theme.palette.mode === 'light' 
                    ? 'linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 255, 157, 0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(0, 255, 157, 0.1) 0%, rgba(0, 255, 157, 0.05) 100%)',
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#00ff9d' }}>
                  Balance
                </Typography>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.5rem', sm: '2.125rem' } 
                }}>
                  <AnimatedNumber value={summary.balance} />
                </Typography>
              </Paper>
            </Box>
          </Slider>
        ) : (
        <Grid container width="100%" justifyContent="space-between" rowSpacing={{ xs: 3, md: 0 }}>
          <Grid item xs={12} md="auto" sx={{ width: { xs: '100%', md: '32%' } }}>
            <motion.div whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(0, 242, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  background: theme.palette.mode === 'light' 
                    ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(0, 242, 254, 0.05) 100%)',
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'light'
                      ? '0 8px 32px rgba(79, 172, 254, 0.15)'
                      : '0 8px 32px rgba(0, 242, 254, 0.18)',
                  },
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#00f2fe' }}>
                  Total Income
                </Typography>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  color: '#00ff9d',
                  fontSize: { xs: '1.5rem', sm: '2.125rem' } 
                }}>
                  <AnimatedNumber value={summary.totalIncome} />
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
          <Grid item xs={12} md="auto" sx={{ width: { xs: '100%', md: '32%' } }}>
            <motion.div whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(79, 172, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  background: theme.palette.mode === 'light' 
                    ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)',
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'light'
                      ? '0 8px 32px rgba(79, 172, 254, 0.15)'
                      : '0 8px 32px rgba(79, 172, 254, 0.1)',
                  },
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#4facfe' }}>
                  Total Expenses
                </Typography>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  color: '#ff6b6b',
                  fontSize: { xs: '1.5rem', sm: '2.125rem' } 
                }}>
                  <AnimatedNumber value={summary.totalExpenses} />
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
          <Grid item xs={12} md="auto" sx={{ width: { xs: '100%', md: '32%' } }}>
            <motion.div whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(0, 255, 157, 0.18)' }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  background: theme.palette.mode === 'light' 
                    ? 'linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 255, 157, 0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(0, 255, 157, 0.1) 0%, rgba(0, 255, 157, 0.05) 100%)',
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'light'
                      ? '0 8px 32px rgba(79, 172, 254, 0.15)'
                      : '0 8px 32px rgba(0, 255, 157, 0.18)',
                  },
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#00ff9d' }}>
                  Balance
                </Typography>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.5rem', sm: '2.125rem' } 
                }}>
                  <AnimatedNumber value={summary.balance} />
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
        )}

        <Grid container spacing={0} justifyContent="space-between" sx={{ mt: 3, width: '100%' }}>
          <Grid item xs={12} sx={{ p: 0, m: 0, width: '100%' }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                width: '100%',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                background: theme.palette.mode === 'light' 
                  ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)',
                border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                '&:hover': {
                  boxShadow: theme.palette.mode === 'light'
                    ? '0 8px 32px rgba(79, 172, 254, 0.15)'
                    : '0 8px 32px rgba(79, 172, 254, 0.1)',
                },
                m: 0,
                mb: 3,
                height: isMobile && isPortrait ? 300 : 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#00f2fe', flex: 1, letterSpacing: 1 }}>
                  Total In/Outflow
                </Typography>
                {!isMobile && (
                  <>
                    <TextField
                      select
                      value={viewType}
                      onChange={e => setViewType(e.target.value)}
                      size="small"
                      sx={{ 
                        minWidth: 120, 
                        mx: 1,
                        background: theme.palette.mode === 'light' 
                          ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                          : 'rgba(10,25,41,0.7)',
                        borderRadius: 2,
                        border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                          },
                        },
                        '& .MuiSelect-select': {
                          color: theme.palette.text.primary,
                        },
                      }}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            sx: {
                              background: theme.palette.mode === 'light' 
                                ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                                : 'rgba(10,25,41,0.95)',
                              backdropFilter: 'blur(10px)',
                              border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
                              '& .MuiMenuItem-root': {
                                color: theme.palette.text.primary,
                                '&:hover': {
                                  background: theme.palette.mode === 'light' 
                                    ? 'rgba(79, 172, 254, 0.1)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                },
                                '&.Mui-selected': {
                                  background: theme.palette.mode === 'light' 
                                    ? 'rgba(79, 172, 254, 0.15)'
                                    : 'rgba(255, 255, 255, 0.15)',
                                  '&:hover': {
                                    background: theme.palette.mode === 'light' 
                                      ? 'rgba(79, 172, 254, 0.2)'
                                      : 'rgba(255, 255, 255, 0.2)',
                                  },
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      {viewTypeOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      value={valueMode}
                      onChange={e => setValueMode(e.target.value)}
                      size="small"
                      sx={{ 
                        minWidth: 120, 
                        mx: 1,
                        background: theme.palette.mode === 'light' 
                          ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                          : 'rgba(10,25,41,0.7)',
                        borderRadius: 2,
                        border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                          },
                        },
                        '& .MuiSelect-select': {
                          color: theme.palette.text.primary,
                        },
                      }}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            sx: {
                              background: theme.palette.mode === 'light' 
                                ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                                : 'rgba(10,25,41,0.95)',
                              backdropFilter: 'blur(10px)',
                              border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
                              '& .MuiMenuItem-root': {
                                color: theme.palette.text.primary,
                                '&:hover': {
                                  background: theme.palette.mode === 'light' 
                                    ? 'rgba(79, 172, 254, 0.1)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                },
                                '&.Mui-selected': {
                                  background: theme.palette.mode === 'light' 
                                    ? 'rgba(79, 172, 254, 0.15)'
                                    : 'rgba(255, 255, 255, 0.15)',
                                  '&:hover': {
                                    background: theme.palette.mode === 'light' 
                                      ? 'rgba(79, 172, 254, 0.2)'
                                      : 'rgba(255, 255, 255, 0.2)',
                                  },
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      {valueModeOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      value={range}
                      onChange={e => setRange(e.target.value)}
                      size="small"
                      sx={{ 
                        minWidth: 160, 
                        mx: 1,
                        background: theme.palette.mode === 'light' 
                          ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                          : 'rgba(10,25,41,0.7)',
                        borderRadius: 2,
                        border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                          },
                        },
                        '& .MuiSelect-select': {
                          color: theme.palette.text.primary,
                        },
                      }}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            sx: {
                              background: theme.palette.mode === 'light' 
                                ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                                : 'rgba(10,25,41,0.95)',
                              backdropFilter: 'blur(10px)',
                              border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
                              '& .MuiMenuItem-root': {
                                color: theme.palette.text.primary,
                                '&:hover': {
                                  background: theme.palette.mode === 'light' 
                                    ? 'rgba(79, 172, 254, 0.1)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                },
                                '&.Mui-selected': {
                                  background: theme.palette.mode === 'light' 
                                    ? 'rgba(79, 172, 254, 0.15)'
                                    : 'rgba(255, 255, 255, 0.15)',
                                  '&:hover': {
                                    background: theme.palette.mode === 'light' 
                                      ? 'rgba(79, 172, 254, 0.2)'
                                      : 'rgba(255, 255, 255, 0.2)',
                                  },
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      {rangeOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                  </>
                )}
              </Box>
              <Box sx={{width: '100%', px: 0, m: 0, flex: 1 }}>
                {isMobile && isPortrait ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body1" sx={{ textAlign: 'center', p: 2 }}>
                      Please rotate your phone to view the chart
                    </Typography>
                  </Box>
                ) : valueMode === 'default' ? (
                  <Bar
                    data={{
                      labels: lineRangeData.labels,
                      datasets: lineRangeData.datasets.map((dataset, index) => {
                        if (dataset.label === 'Balance') {
                          // Convert balance to line dataset
                          return {
                            ...dataset,
                            type: 'line',
                            borderWidth: 3,
                            borderDash: [8, 4],
                            fill: false,
                            pointRadius: 2,
                            pointHoverRadius: 4,
                            tension: 0.4,
                            yAxisID: 'y',
                          };
                        }
                        // Keep income and expenses as bars
                        return {
                          ...dataset,
                          type: 'bar',
                          yAxisID: 'y',
                        };
                      })
                    }}
                    options={{
                      ...lineRangeOptions,
                      animation: {
                        duration: 1800,
                        easing: 'easeInOutQuart',
                      },
                      elements: {
                        bar: {
                          borderRadius: 8,
                          borderSkipped: false,
                          borderWidth: 1,
                          borderColor: ctx => {
                            const colors = ['#00f2fe', '#ff6b6b', '#4facfe'];
                            return colors[ctx.datasetIndex % colors.length];
                          },
                        },
                        line: {
                          borderWidth: 3,
                          borderDash: [8, 4],
                        },
                        point: {
                          radius: 6,
                          hoverRadius: 8,
                          backgroundColor: '#4facfe',
                          borderColor: '#ffffff',
                          borderWidth: 2,
                        },
                      },
                      plugins: {
                        legend: lineRangeOptions.plugins.legend,
                        tooltip: lineRangeOptions.plugins.tooltip,
                        datalabels: {
                          display: false,
                        },
                      },
                    }}
                    plugins={[barHoverPlugin]}
                  />
                ) : (
                  <Line
                    data={lineRangeData}
                    options={{
                      ...lineRangeOptions,
                      animation: {
                        duration: 1800,
                        easing: 'easeInOutQuart',
                      },
                      elements: {
                        line: {
                          borderWidth: 3,
                          cubicInterpolationMode: 'monotone',
                          borderColor: ctx => ctx.datasetIndex === 2 ? '#4facfe' : undefined,
                          backgroundColor: 'transparent',
                          shadowBlur: 10,
                          shadowColor: ctx => ctx.datasetIndex === 0 ? '#00f2fe' : ctx.datasetIndex === 1 ? '#ff6b6b' : '#4facfe',
                        },
                        point: {
                          radius: 5,
                          backgroundColor: ctx => ctx.datasetIndex === 0 ? '#00f2fe' : ctx.datasetIndex === 1 ? '#ff6b6b' : '#4facfe',
                          borderWidth: 1,
                          hoverRadius: 4,
                          hoverBackgroundColor: ctx => ctx.datasetIndex === 0 ? '#00f2fe' : ctx.datasetIndex === 1 ? '#ff6b6b' : '#4facfe',
                          shadowBlur: 16,
                          shadowColor: ctx => ctx.datasetIndex === 0 ? '#00f2fe' : ctx.datasetIndex === 1 ? '#ff6b6b' : '#4facfe',
                        },
                      },
                      plugins: {
                        legend: lineRangeOptions.plugins.legend,
                        tooltip: lineRangeOptions.plugins.tooltip,
                        datalabels: {
                          display: false,
                        },
                      },
                    }}
                    plugins={[verticalLinePlugin]}
                  />
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3} justifyContent="space-between"> 
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
                height: 400,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                background: theme.palette.mode === 'light' 
                  ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)',
                border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                '&:hover': {
                  boxShadow: theme.palette.mode === 'light'
                    ? '0 8px 32px rgba(79, 172, 254, 0.15)'
                    : '0 8px 32px rgba(79, 172, 254, 0.1)',
                },
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 500, 
                  color: theme.palette.mode === 'light' ? '#4facfe' : '#4facfe',
                  mb: 2 
                }}
              >
                Income by Category
              </Typography>
              <Box sx={{ flex: 1, position: 'relative' }}>
                <Doughnut data={incomeDoughnutData} options={incomeDoughnutOptions} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
                height: 400,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                background: theme.palette.mode === 'light' 
                  ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)',
                border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                '&:hover': {
                  boxShadow: theme.palette.mode === 'light'
                    ? '0 8px 32px rgba(79, 172, 254, 0.15)'
                    : '0 8px 32px rgba(79, 172, 254, 0.1)',
                },
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 500, 
                  color: theme.palette.mode === 'light' ? '#4facfe' : '#4facfe',
                  mb: 2 
                }}
              >
                Expenses by Category
              </Typography>
              <Box sx={{ flex: 1, position: 'relative' }}>
                <Doughnut data={expenseDoughnutData} options={expenseDoughnutOptions} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
                height: 400,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                background: theme.palette.mode === 'light' 
                  ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)',
                border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
                '&:hover': {
                  boxShadow: theme.palette.mode === 'light'
                    ? '0 8px 32px rgba(79, 172, 254, 0.15)'
                    : '0 8px 32px rgba(79, 172, 254, 0.1)',
                },
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 500, 
                  color: theme.palette.mode === 'light' ? '#4facfe' : '#4facfe',
                  mb: 2 
                }}
              >
                Income vs Expenses Overview
              </Typography>
              <Box sx={{ flex: 1, position: 'relative' }}>
                <Doughnut
                  data={incomeVsExpensesData}
                  options={overviewDoughnutOptions}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* AI Chat Floating Button */}
      <Fab
        color="primary"
        aria-label="AI Chat"
        onClick={openChat}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0, 242, 254, 0.3)',
        }}
      >
        <ChatIcon />
      </Fab>

      {/* AI Chat Dialog */}
      <Dialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            height: '70vh',
            background: theme.palette.mode === 'light' 
              ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)',
            border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon />
            Iwa Assistant
          </Box>
          <IconButton onClick={() => setChatOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Messages Area */}
          <Box 
            id="messages-container"
            sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              p: 2,
              maxHeight: '50vh'
            }}
          >
            <List sx={{ p: 0 }}>
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    px: 0,
                    py: 1
                  }}
                >
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    maxWidth: '80%',
                    flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
                  }}>
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: message.sender === 'user' ? '#4facfe' : '#00f2fe',
                      fontSize: '0.875rem'
                    }}>
                      {message.sender === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                    </Avatar>
                    <Box sx={{
                      background: message.sender === 'user' 
                        ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                        : theme.palette.mode === 'light' 
                          ? 'rgba(255, 255, 255, 0.9)'
                          : 'rgba(20, 30, 40, 0.9)',
                      color: message.sender === 'user' ? 'white' : theme.palette.text.primary,
                      borderRadius: 2,
                      p: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      wordBreak: 'break-word'
                    }}>
                      {message.sender === 'user' ? (
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          {message.text}
                        </Typography>
                      ) : (
                        <Box sx={{ mb: 0.5 }}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <Typography variant="body2" sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
                                  {children}
                                </Typography>
                              ),
                              h1: ({ children }) => (
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#4facfe' }}>
                                  {children}
                                </Typography>
                              ),
                              h2: ({ children }) => (
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#4facfe' }}>
                                  {children}
                                </Typography>
                              ),
                              h3: ({ children }) => (
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#4facfe' }}>
                                  {children}
                                </Typography>
                              ),
                              strong: ({ children }) => (
                                <Typography component="span" sx={{ fontWeight: 'bold', color: '#4facfe' }}>
                                  {children}
                                </Typography>
                              ),
                              ul: ({ children }) => (
                                <Box component="ul" sx={{ pl: 2, mb: 1 }}>
                                  {children}
                                </Box>
                              ),
                              ol: ({ children }) => (
                                <Box component="ol" sx={{ pl: 2, mb: 1 }}>
                                  {children}
                                </Box>
                              ),
                              li: ({ children }) => (
                                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                                  {children}
                                </Typography>
                              ),
                              blockquote: ({ children }) => (
                                <Box sx={{ 
                                  borderLeft: '3px solid #4facfe', 
                                  pl: 2, 
                                  mb: 1,
                                  fontStyle: 'italic',
                                  opacity: 0.8
                                }}>
                                  {children}
                                </Box>
                              ),
                            }}
                          >
                            {message.text}
                          </ReactMarkdown>
                        </Box>
                      )}
                      <Typography variant="caption" sx={{ 
                        opacity: 0.7,
                        fontSize: '0.7rem'
                      }}>
                        {message.timestamp}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              ))}
              {isLoading && (
                <ListItem sx={{ display: 'flex', justifyContent: 'flex-start', px: 0, py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#00f2fe' }}>
                      <SmartToyIcon />
                    </Avatar>
                    <Box sx={{
                      background: theme.palette.mode === 'light' 
                        ? 'rgba(255, 255, 255, 0.9)'
                        : 'rgba(20, 30, 40, 0.9)',
                      borderRadius: 2,
                      p: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        AI is thinking...
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              )}
            </List>
          </Box>
          
          {/* Input Area */}
          <Box sx={{ 
            p: 2, 
            borderTop: `1px solid ${theme.palette.divider}`,
            background: theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(20, 30, 40, 0.8)'
          }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask me about your finances..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                inputRef={inputRef}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    background: theme.palette.mode === 'light' 
                      ? 'rgba(255, 255, 255, 0.9)'
                      : 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              />
              <IconButton
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                sx={{
                  background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(0,0,0,0.12)',
                    color: 'rgba(0,0,0,0.26)'
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default Dashboard; 