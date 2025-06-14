import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, useTheme } from '@mui/material';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
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
import axios from 'axios';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { motion } from 'framer-motion';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
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
  const [range, setRange] = useState('all');
  const [viewType, setViewType] = useState('simple');
  const [valueMode, setValueMode] = useState('default');
  const [rangeData, setRangeData] = useState([]);
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
    { value: 'default', label: 'Default' },
    { value: 'sum', label: 'Sum' },
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
        backgroundColor: 'rgba(0,242,254,0.15)',
        tension: 0.4,
        fill: false,
        pointRadius: 3,
      },
      {
        label: 'Expenses',
        data: getValueArray(rangeData.map(d => d.expenses)),
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255,107,107,0.15)',
        tension: 0.4,
        fill: false,
        pointRadius: 3,
      },
      {
        label: 'Balance',
        data: getValueArray(rangeData.map(d => d.balance), true),
        borderColor: '#4facfe',
        backgroundColor: 'rgba(79, 172, 254, 0.15)',
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
          backgroundColor: `hsla(${index * 30}, 100%, 50%, 0.15)`,
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
          backgroundColor: `hsla(${index * 30 + 180}, 100%, 50%, 0.15)`,
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
        backgroundColor: 'rgba(79, 172, 254, 0.15)',
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        borderWidth: 2,
        borderDash: [5, 5],
      });

      return datasets;
    })(),
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
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
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

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
      <Box sx={{ m: 0, p: 3, minHeight: '100vh' }}>
        <Grid container spacing={0} width="100%" justifyContent="space-between">
          <Grid item xs={12} md={4} sx={{ width: '32%' }}>
            <motion.div whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(0, 242, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(0, 242, 254, 0.05) 100%)',
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#00f2fe' }}>
                  Total Income
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00ff9d' }}>
                  <AnimatedNumber value={summary.totalIncome} />
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4} sx={{ width: '32%' }}>
            <motion.div whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(79, 172, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)',
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#4facfe' }}>
                  Total Expenses
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff6b6b' }}>
                  <AnimatedNumber value={summary.totalExpenses} />
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4} sx={{ width: '32%' }}>
            <motion.div whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(0, 255, 157, 0.18)' }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.1) 0%, rgba(0, 255, 157, 0.05) 100%)',
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#00ff9d' }}>
                  Balance
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  <AnimatedNumber value={summary.balance} />
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

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
                '&:hover': {
                  boxShadow: '0 8px 32px rgba(79, 172, 254, 0.1)',
                },
                m: 0,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#00f2fe', flex: 1, letterSpacing: 1 }}>
                  Total In/Outflow
                </Typography>
                <TextField
                  select
                  value={viewType}
                  onChange={e => setViewType(e.target.value)}
                  size="small"
                  sx={{ minWidth: 120, background: 'rgba(10,25,41,0.7)', borderRadius: 2, ml: 2 }}
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
                  sx={{ minWidth: 120, background: 'rgba(10,25,41,0.7)', borderRadius: 2, ml: 2 }}
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
                  sx={{ minWidth: 160, background: 'rgba(10,25,41,0.7)', borderRadius: 2, ml: 2 }}
                >
                  {rangeOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{width: '100%', px: 0, m: 0 }}>
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
                        hoverRadius: 8,
                        hoverBackgroundColor: ctx => ctx.datasetIndex === 0 ? '#00f2fe' : ctx.datasetIndex === 1 ? '#ff6b6b' : '#4facfe',
                        shadowBlur: 16,
                        shadowColor: ctx => ctx.datasetIndex === 0 ? '#00f2fe' : ctx.datasetIndex === 1 ? '#ff6b6b' : '#4facfe',
                      },
                    },
                    plugins: {
                      legend: lineRangeOptions.plugins.legend,
                      tooltip: lineRangeOptions.plugins.tooltip,
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3} justifyContent="space-between"> 
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 400,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 32px rgba(79, 172, 254, 0.1)',
                },
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#4facfe', mb: 2 }}>
                Income by Category
              </Typography>
              <Box sx={{ flex: 1, position: 'relative' }}>
                <Doughnut data={incomeDoughnutData} options={doughnutOptions} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 400,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 32px rgba(0, 255, 157, 0.1)',
                },
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#4facfe', mb: 2 }}>
                Expenses by Category
              </Typography>
              <Box sx={{ flex: 1, position: 'relative' }}>
                <Doughnut data={expenseDoughnutData} options={doughnutOptions} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 400,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 32px rgba(0, 255, 157, 0.1)',
                },
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#4facfe', mb: 2 }}>
                Income vs Expenses Overview
              </Typography>
              <Box sx={{ flex: 1, position: 'relative' }}>
                <Doughnut
                  data={{
                    labels: ['Income', 'Expenses'],
                    datasets: [
                      {
                        data: [summary.totalIncome, summary.totalExpenses],
                        backgroundColor: [
                          '#00f2fe',
                          '#ff6b6b',
                        ],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    ...doughnutOptions,
                    plugins: {
                      ...doughnutOptions.plugins,
                      legend: {
                        ...doughnutOptions.plugins.legend,
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
}

export default Dashboard; 