import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  Snackbar,
  useTheme,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Flag as FlagIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import Pagination from '@mui/material/Pagination';

const ShimmerBar = styled('div')({
  position: 'absolute',
  top: 0, left: 0, bottom: 0, right: 0,
  width: '100%',
  borderRadius: 8,
  pointerEvents: 'none',
  background: 'linear-gradient(120deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.32) 50%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0.0) 100%)',
  opacity: 0.7,
  animation: 'shimmerMove 2.5s linear infinite'
});

const CustomProgressBar = ({ value }) => {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 8,
      background: 'rgba(79, 172, 254, 0.15)',
      borderRadius: 4,
      overflow: 'hidden',
      transition: 'box-shadow 0.4s cubic-bezier(0.4,0,0.2,1)'
    }}>
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${value}%`,
        background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.9) 0%, rgba(79, 172, 254, 0.9) 100%)',
        borderRadius: 4,
        overflow: 'hidden',
        zIndex: 1,
        transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: value > 0 ? '0 0 16px 4px rgba(0,242,254,0.35), 0 0 32px 8px rgba(79,172,254,0.18)' : 'none'
      }}>
        {value > 0 && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '100%',
            background: 'linear-gradient(120deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0.0) 100%)',
            opacity: 0.7,
            borderRadius: 4,
            pointerEvents: 'none',
            animation: 'shimmerMoveCustom 1.8s linear infinite'
          }} />
        )}
      </div>
      <style>{`
        @keyframes shimmerMoveCustom {
          0% { transform: translateX(-60%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
    </div>
  );
};

// Add a function to generate a color from a string (category name)
function getCategoryColor(category, theme) {
  // Simple hash to color palette (5 colors)
  const palette = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
}

const Goals = () => {
  const theme = useTheme();
  const [goals, setGoals] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    category: 'savings',
    priority: 'medium',
    autoUpdate: {
      enabled: false,
      useAllCategories: false,
      categories: [],
      transactionTypes: ['income']
    }
  });

  const [goalCategories, setGoalCategories] = useState([]);
  const [transactionCategories, setTransactionCategories] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Add state for sorting, pagination, and filter for contributing transactions
  const [contribSortBy, setContribSortBy] = useState('date');
  const [contribSortDirection, setContribSortDirection] = useState('desc');
  const [contribPage, setContribPage] = useState(1);
  const [contribRowsPerPage, setContribRowsPerPage] = useState(10);
  const [contribFilter, setContribFilter] = useState('');
  const [contribView, setContribView] = useState('default');

  // Category management state
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [categoryEditIndex, setCategoryEditIndex] = useState(null);
  const [categoryEditValue, setCategoryEditValue] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const sortOptions = [
    { value: 'targetAmount', label: 'Highest Target Amount' },
    { value: 'progress', label: 'Highest Progress (Target/Current)' },
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Title (A-Z)' },
    { value: 'category', label: 'Category (A-Z)' },
    { value: 'createdAt', label: 'Date Created' },
  ];

  const [sortBy, setSortBy] = useState('createdAt');

  // Sorting logic
  const sortedGoals = React.useMemo(() => {
    let sorted = [...goals];
    switch (sortBy) {
      case 'targetAmount':
        sorted.sort((a, b) => b.targetAmount - a.targetAmount);
        break;
      case 'progress':
        sorted.sort((a, b) => {
          const aProgress = a.targetAmount > 0 ? a.currentAmount / a.targetAmount : 0;
          const bProgress = b.targetAmount > 0 ? b.currentAmount / b.targetAmount : 0;
          return bProgress - aProgress;
        });
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        sorted.sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'category':
        sorted.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'createdAt':
      default:
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    return sorted;
  }, [goals, sortBy]);

  // Load goals from database on component mount
  useEffect(() => {
    fetchGoals();
    fetchGoalCategories();
    fetchTransactionCategories();
    fetchTransactions();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching goals from database...');
      
      const response = await fetch(`${API_BASE_URL}/api/goals`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Goals fetched from database:', data);
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError('Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGoalCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goal-categories`);
      if (response.ok) {
        const categories = await response.json();
        setGoalCategories(categories);
      }
    } catch (error) {
      console.error('Error fetching goal categories:', error);
    }
  };

  const fetchTransactionCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transaction-categories`);
      if (response.ok) {
        const categories = await response.json();
        setTransactionCategories(categories);
      }
    } catch (error) {
      console.error('Error fetching transaction categories:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/transactions`);
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        targetAmount: goal.targetAmount?.toString() || '',
        currentAmount: goal.currentAmount?.toString() || '0',
        targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : '',
        category: goal.category || (goalCategories[0] || ''),
        priority: goal.priority || 'medium',
        autoUpdate: goal.autoUpdate || {
          enabled: false,
          useAllCategories: false,
          categories: [],
          transactionTypes: ['income']
        }
      });
    } else {
      setEditingGoal(null);
      setFormData({
        title: '',
        description: '',
        targetAmount: '',
        currentAmount: '0',
        targetDate: '',
        category: goalCategories[0] || '',
        priority: 'medium',
        autoUpdate: {
          enabled: false,
          useAllCategories: false,
          categories: [],
          transactionTypes: ['income']
        }
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGoal(null);
    setFormData({
      title: '',
      description: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: '',
      category: 'savings',
      priority: 'medium',
      autoUpdate: {
        enabled: false,
        useAllCategories: false,
        categories: [],
        transactionTypes: ['income']
      }
    });
  };

  const handleOpenDetailModal = (goal) => {
    setSelectedGoal(goal);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedGoal(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showSnackbar('Title is required', 'error');
      return;
    }

    try {
      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetAmount: parseFloat(formData.targetAmount) || 0,
        currentAmount: parseFloat(formData.currentAmount) || 0,
        targetDate: formData.targetDate || null,
        category: formData.category,
        priority: formData.priority,
        autoUpdate: formData.autoUpdate,
      };

      console.log('Submitting goal data:', goalData);

      let response;
      if (editingGoal) {
        // Update existing goal
        response = await fetch(`${API_BASE_URL}/api/goals/${editingGoal._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(goalData),
        });
      } else {
        // Create new goal
        response = await fetch(`${API_BASE_URL}/api/goals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(goalData),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedGoal = await response.json();
      console.log('Goal saved to database:', savedGoal);

      // Refresh goals list
      await fetchGoals();
      
      showSnackbar(
        editingGoal ? 'Goal updated successfully!' : 'Goal created successfully!'
      );
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving goal:', error);
      showSnackbar('Failed to save goal. Please try again.', 'error');
    }
  };

  const handleDelete = async (goalId) => {
    try {
      console.log('Deleting goal:', goalId);
      
      const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Goal deleted from database');
      
      // Refresh goals list
      await fetchGoals();
      showSnackbar('Goal deleted successfully!');
    } catch (error) {
      console.error('Error deleting goal:', error);
      showSnackbar('Failed to delete goal. Please try again.', 'error');
    }
  };

  const handleToggleComplete = async (goalId) => {
    try {
      const goal = goals.find(g => g._id === goalId);
      if (!goal) return;

      const updatedGoal = { ...goal, completed: !goal.completed };
      
      const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedGoal),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh goals list
      await fetchGoals();
      showSnackbar(
        updatedGoal.completed ? 'Goal marked as completed!' : 'Goal marked as incomplete!'
      );
    } catch (error) {
      console.error('Error toggling goal completion:', error);
      showSnackbar('Failed to update goal. Please try again.', 'error');
    }
  };

  const handleUpdateProgress = async (goalId, newAmount) => {
    try {
      const goal = goals.find(g => g._id === goalId);
      if (!goal) return;

      const updatedGoal = { ...goal, currentAmount: newAmount };
      
      const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedGoal),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh goals list
      await fetchGoals();
    } catch (error) {
      console.error('Error updating goal progress:', error);
      showSnackbar('Failed to update progress. Please try again.', 'error');
    }
  };

  const getProgressPercentage = (current, target) => {
    const percentage = (parseFloat(current) / parseFloat(target)) * 100;
    return Math.min(percentage, 100);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'savings': return <TrendingUpIcon />;
      case 'purchase': return <FlagIcon />;
      case 'income': return <TrendingUpIcon />;
      case 'debt': return <TrendingDownIcon />;
      default: return <FlagIcon />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Add debug button in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Category management handlers
  const handleOpenCategoryManager = () => {
    setCategoryManagerOpen(true);
    setCategoryInput('');
    setCategoryEditIndex(null);
    setCategoryEditValue('');
    setCategoryError('');
  };
  const handleCloseCategoryManager = () => {
    setCategoryManagerOpen(false);
    setCategoryInput('');
    setCategoryEditIndex(null);
    setCategoryEditValue('');
    setCategoryError('');
  };
  const handleAddCategory = async () => {
    if (!categoryInput.trim()) return;
    setCategoryLoading(true);
    setCategoryError('');
    try {
      await axios.post(`${API_BASE_URL}/api/goal-categories`, { name: categoryInput.trim() });
      await fetchGoalCategories();
      setCategoryInput('');
    } catch (err) {
      setCategoryError(err.response?.data?.message || 'Failed to add category');
    } finally {
      setCategoryLoading(false);
    }
  };
  const handleEditCategory = (idx, value) => {
    setCategoryEditIndex(idx);
    setCategoryEditValue(value);
    setCategoryError('');
  };
  const handleSaveEditCategory = async (oldName) => {
    if (!categoryEditValue.trim() || oldName === categoryEditValue.trim()) {
      setCategoryEditIndex(null);
      setCategoryEditValue('');
      return;
    }
    setCategoryLoading(true);
    setCategoryError('');
    try {
      await axios.put(`${API_BASE_URL}/api/goal-categories/${encodeURIComponent(oldName)}`, { newName: categoryEditValue.trim() });
      await fetchGoalCategories();
      setCategoryEditIndex(null);
      setCategoryEditValue('');
    } catch (err) {
      setCategoryError(err.response?.data?.message || 'Failed to edit category');
    } finally {
      setCategoryLoading(false);
    }
  };
  const handleDeleteCategory = async (name) => {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    setCategoryLoading(true);
    setCategoryError('');
    try {
      await axios.delete(`${API_BASE_URL}/api/goal-categories/${encodeURIComponent(name)}`);
      await fetchGoalCategories();
    } catch (err) {
      setCategoryError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setCategoryLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Loading goals...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchGoals}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'rgba(0, 242, 254, 0.9)' }}>
          Financial Goals
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={e => setSortBy(e.target.value)}
            >
              {sortOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)'
                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: '#fff',
              fontWeight: 600,
              borderRadius: 2,
              px: 2,
              '&:hover': {
                background: theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)'
                  : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                opacity: 0.9,
              },
            }}
          >
            Add Goal
          </Button>
        </Box>
      </Box>

      {sortedGoals.length === 0 ? (
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            textAlign: 'center',
            background: theme.palette.mode === 'light' 
              ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.04) 0%, rgba(0, 242, 254, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(79, 172, 254, 0.07) 0%, rgba(79, 172, 254, 0.03) 100%)',
            border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.08)' : '1px solid rgba(79, 172, 254, 0.15)',
            borderRadius: 2,
          }}
        >
          <FlagIcon sx={{ fontSize: 64, color: 'rgba(0, 242, 254, 0.75)', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No goals yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start by adding your first financial goal to track your progress
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.9) 0%, rgba(79, 172, 254, 0.9) 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 1) 0%, rgba(79, 172, 254, 1) 100%)',
              }
            }}
          >
            Create Your First Goal
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '1fr 1fr 1fr',
            },
            gap: 3,
          }}
        >
          {sortedGoals.map((goal) => (
            <Card
              key={goal._id}
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                opacity: goal.completed ? 0.7 : 1,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                background: theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.04) 0%, rgba(0, 242, 254, 0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(79, 172, 254, 0.07) 0%, rgba(79, 172, 254, 0.03) 100%)',
                border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.08)' : '1px solid rgba(79, 172, 254, 0.15)',
                borderRadius: 2,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.palette.mode === 'light'
                    ? '0 8px 32px rgba(79, 172, 254, 0.15)'
                    : '0 8px 32px rgba(0, 242, 254, 0.2)',
                  background: theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.07) 0%, rgba(0, 242, 254, 0.03) 100%)'
                    : 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)',
                },
              }}
              onClick={() => handleOpenDetailModal(goal)}
            >
              {goal.completed && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                  }}
                >
                  <CheckCircleIcon color="success" />
                </Box>
              )}
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Top content: title, chips, description */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}> 
                    <Typography variant="h6" component="h3" sx={{ mr: 1, flexGrow: 1, color: 'rgba(0, 242, 254, 0.9)' }}>
                      {goal.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {goal.autoUpdate?.enabled && (
                        <Chip
                          label="Auto"
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{
                            borderColor: 'rgba(0, 242, 254, 0.4)',
                            color: 'rgba(0, 242, 254, 0.9)',
                          }}
                        />
                      )}
                      <Chip
                        label={goal.priority}
                        color={getPriorityColor(goal.priority)}
                        size="small"
                      />
                    </Box>
                  </Box>
                  {goal.description && (
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.4,
                          maxHeight: goal.description.split('\n').length > 4 ? '7rem' : '5.6rem', // Extra space for ellipsis
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {goal.description.split('\n').slice(0, 4).join('\n')}
                        {goal.description.split('\n').length > 4 && '\n...'}
                      </Typography>
                    </Box>
                  )}
                  {/* Progress section stays at the top */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </Typography>
                      </Box>
                    </Box>
                    <CustomProgressBar value={getProgressPercentage(goal.currentAmount, goal.targetAmount)} />
                  </Box>
                </Box>
                {/* Bottom content: date, auto-update, actions, category */}
                <Box sx={{ mt: 'auto' }}>
                  {goal.targetDate && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Target Date: {formatDate(goal.targetDate)}
                    </Typography>
                  )}
                  {goal.autoUpdate?.enabled && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Auto-update: {goal.autoUpdate.useAllCategories ? 'All categories' : `${goal.autoUpdate.categories.length} categories`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Types: {goal.autoUpdate.transactionTypes.join(', ')}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(goal._id);
                        }}
                        color={goal.completed ? 'success' : 'default'}
                        sx={{
                          color: goal.completed ? 'success.main' : 'rgba(0, 242, 254, 0.75)',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 242, 254, 0.08)',
                          }
                        }}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(goal);
                        }}
                        sx={{
                          color: 'rgba(79, 172, 254, 0.75)',
                          '&:hover': {
                            backgroundColor: 'rgba(79, 172, 254, 0.08)',
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGoalToDelete(goal);
                          setDeleteDialogOpen(true);
                        }}
                        color="error"
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(244, 67, 54, 0.08)',
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Chip
                      label={goal.category}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderColor: getCategoryColor(goal.category, theme),
                        color: getCategoryColor(goal.category, theme),
                        background: theme.palette.mode === 'light'
                          ? 'rgba(0,0,0,0.02)'
                          : 'rgba(0,0,0,0.18)',
                        fontWeight: 600,
                        letterSpacing: 0.2,
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Add/Edit Goal Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
            {editingGoal ? 'Edit Goal' : 'Add New Goal'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {editingGoal ? 'Update your financial goal details' : 'Create a new financial goal to track your progress'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Goal Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Buy a car, Save for vacation"
                    helperText="Give your goal a clear, descriptive name"
                  />
                </Grid>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  minRows={1}
                  maxRows={8}
                  placeholder="Add more details about your goal..."
                  helperText="Optional: Add notes, milestones, or motivation"
                />
              </Grid>
            </Box>

            {/* Financial Details Section */}
            <Box>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: { xs: 1, md: 0 } }}>
                    Financial Details
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon/>}
                    onClick={handleOpenCategoryManager}
                    sx={{ minHeight: 36, py: 1, px: 2 }}
                  >
                    Manage Goal Categories
                  </Button>
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Target Amount"
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                    }}
                    required
                    placeholder="0"
                    helperText="How much do you want to save/spend?"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Current Amount"
                    type="number"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                    }}
                    placeholder="0"
                    helperText="How much have you saved so far?"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Target Date"
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    helperText="When do you want to achieve this goal?"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      label="Category"
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {goalCategories.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl> 
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      label="Priority"
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Auto-Update Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Auto-Update Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Automatically update goal progress when you add transactions
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Auto Update</InputLabel>
                    <Select
                      value={formData.autoUpdate.enabled ? 'enabled' : 'disabled'}
                      label="Auto Update"
                      onChange={(e) => {
                        const enabled = e.target.value === 'enabled';
                        setFormData({
                          ...formData,
                          autoUpdate: {
                            ...formData.autoUpdate,
                            enabled: enabled,
                          }
                        });
                      }}
                    >
                      <MenuItem value="enabled">Enabled</MenuItem>
                      <MenuItem value="disabled">Disabled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {formData.autoUpdate.enabled && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Category Selection</InputLabel>
                        <Select
                          value={formData.autoUpdate.useAllCategories ? 'all' : 'selected'}
                          label="Category Selection"
                          onChange={(e) => {
                            const useAllCategories = e.target.value === 'all';
                            setFormData({
                              ...formData,
                              autoUpdate: {
                                ...formData.autoUpdate,
                                useAllCategories: useAllCategories,
                                categories: useAllCategories ? [] : formData.autoUpdate.categories,
                              }
                            });
                          }}
                        >
                          <MenuItem value="all">All Categories</MenuItem>
                          <MenuItem value="selected">Selected Categories</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {!formData.autoUpdate.useAllCategories && (
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Select Categories</InputLabel>
                          <Select
                            value={formData.autoUpdate.categories}
                            label="Select Categories"
                            onChange={(e) => {
                              const categories = e.target.value;
                              setFormData({
                                ...formData,
                                autoUpdate: {
                                  ...formData.autoUpdate,
                                  categories: categories,
                                }
                              });
                            }}
                            multiple
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                  <Chip key={value} label={value} size="small" />
                                ))}
                              </Box>
                            )}
                          >
                            {transactionCategories.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Select>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Select transaction categories that should contribute to this goal
                          </Typography>
                        </FormControl>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Transaction Types</InputLabel>
                        <Select
                          value={formData.autoUpdate.transactionTypes}
                          label="Transaction Types"
                          onChange={(e) => {
                            const transactionTypes = e.target.value;
                            setFormData({
                              ...formData,
                              autoUpdate: {
                                ...formData.autoUpdate,
                                transactionTypes: transactionTypes,
                              }
                            });
                          }}
                          multiple
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip 
                                  key={value} 
                                  label={value === 'income' ? 'Income' : 'Expense'} 
                                  size="small"
                                  color={value === 'income' ? 'success' : 'error'}
                                />
                              ))}
                            </Box>
                          )}
                        >
                          <MenuItem value="income">Income</MenuItem>
                          <MenuItem value="expense">Expense</MenuItem>
                        </Select>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Choose which types of transactions should update this goal
                        </Typography>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.title.trim()}
            sx={{ minWidth: 120 }}
          >
            {editingGoal ? 'Update Goal' : 'Create Goal'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Manager Modal */}
      <Dialog 
        open={categoryManagerOpen} 
        onClose={handleCloseCategoryManager}
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'light'
              ? '#ffffff'
              : 'rgba(10,25,41,0.7)',
            backdropFilter: 'blur(10px)',
            border: theme.palette.mode === 'light' 
              ? '1px solid rgba(79, 172, 254, 0.2)'
              : '1px solid rgba(0, 242, 254, 0.1)',
            boxShadow: theme.palette.mode === 'light'
              ? '0 8px 32px rgba(79, 172, 254, 0.15)'
              : '0 8px 32px rgba(0, 242, 254, 0.15)',
            borderRadius: 2,
            minWidth: '400px',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: theme.palette.mode === 'light' ? '#1e293b' : '#fff',
          borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.2)' : 'rgba(0, 242, 254, 0.1)'}`,
          pb: 2,
          fontWeight: 600
        }}>
          Manage Goal Categories
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="New Category"
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: theme.palette.mode === 'light'
                    ? '#ffffff'
                    : 'rgba(10,25,41,0.7)',
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.3)' : 'rgba(0, 242, 254, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.5)' : 'rgba(0, 242, 254, 0.4)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.mode === 'light' ? '#4facfe' : '#00f2fe',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.mode === 'light' ? '#334155' : '#94a3b8',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: theme.palette.mode === 'light' ? '#4facfe' : '#00f2fe',
                },
                '& .MuiInputBase-input': {
                  color: theme.palette.mode === 'light' ? '#1e293b' : '#fff',
                },
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); }}
              disabled={categoryLoading}
            />
            <Button
              variant="contained"
              onClick={handleAddCategory}
              disabled={!categoryInput.trim()}
              sx={{
                background: theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                  : 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                color: '#fff',
                fontWeight: 600,
                '&:hover': {
                  background: theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                    : 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                  opacity: 0.9,
                },
                '&.Mui-disabled': {
                  background: theme.palette.mode === 'light'
                    ? 'rgba(79, 172, 254, 0.3)'
                    : 'rgba(0, 242, 254, 0.3)',
                  color: theme.palette.mode === 'light'
                    ? 'rgba(255, 255, 255, 0.7)'
                    : 'rgba(255, 255, 255, 0.5)',
                },
                minWidth: 64
              }}
            >
              Add
            </Button>
          </Box>
          <List>
            {goalCategories.map((cat) => (
              <ListItem
                key={cat}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {categoryEditIndex !== null && goalCategories[categoryEditIndex] === cat ? (
                      <IconButton 
                        edge="end" 
                        onClick={() => handleSaveEditCategory(cat)}
                        sx={{
                          color: theme.palette.mode === 'light' ? '#4facfe' : '#00f2fe',
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'light' 
                              ? 'rgba(79, 172, 254, 0.1)'
                              : 'rgba(0, 242, 254, 0.1)',
                          },
                        }}
                      >
                        <SaveIcon />
                      </IconButton>
                    ) : (
                      <IconButton 
                        edge="end" 
                        onClick={() => handleEditCategory(goalCategories.indexOf(cat), cat)}
                        sx={{
                          color: theme.palette.mode === 'light' ? '#4facfe' : '#00f2fe',
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'light' 
                              ? 'rgba(79, 172, 254, 0.1)'
                              : 'rgba(0, 242, 254, 0.1)',
                          },
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    <IconButton 
                      edge="end" 
                      onClick={() => handleDeleteCategory(cat)}
                      sx={{
                        color: theme.palette.mode === 'light' ? '#4facfe' : '#00f2fe',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'light' 
                            ? 'rgba(79, 172, 254, 0.1)'
                            : 'rgba(0, 242, 254, 0.1)',
                        },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
                sx={{
                  border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.2)' : 'rgba(0, 242, 254, 0.1)'}`,
                  borderRadius: 1,
                  mb: 1,
                  background: theme.palette.mode === 'light'
                    ? '#ffffff'
                    : 'rgba(10,25,41,0.7)',
                  '&:hover': {
                    background: theme.palette.mode === 'light'
                      ? 'rgba(79, 172, 254, 0.05)'
                      : 'rgba(0, 242, 254, 0.1)',
                  },
                }}
              >
                {categoryEditIndex !== null && goalCategories[categoryEditIndex] === cat ? (
                  <Box sx={{ width: '100%' }}>
                    <TextField
                      value={categoryEditValue}
                      onChange={e => setCategoryEditValue(e.target.value)}
                      size="small"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEditCategory(cat);
                        if (e.key === 'Escape') { setCategoryEditIndex(null); setCategoryEditValue(''); }
                      }}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          background: theme.palette.mode === 'light'
                            ? '#ffffff'
                            : 'rgba(10,25,41,0.7)',
                          '& fieldset': {
                            borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.3)' : 'rgba(0, 242, 254, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.5)' : 'rgba(0, 242, 254, 0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.mode === 'light' ? '#4facfe' : '#00f2fe',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: theme.palette.mode === 'light' ? '#1e293b' : '#fff',
                        },
                      }}
                    />
                    {categoryError && (
                      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                        {categoryError}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <ListItemText 
                    primary={cat}
                    primaryTypographyProps={{
                      color: theme.palette.mode === 'light' ? '#1e293b' : '#fff',
                      fontWeight: 500,
                    }}
                  />
                )}
              </ListItem>
            ))}
          </List>
          {categoryError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {categoryError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: `1px solid ${theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.2)' : 'rgba(0, 242, 254, 0.1)'}`,
          p: 2
        }}>
          <Button 
            onClick={handleCloseCategoryManager}
            sx={{
              color: theme.palette.mode === 'light' ? '#4facfe' : '#00f2fe',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'light' 
                  ? 'rgba(79, 172, 254, 0.1)'
                  : 'rgba(0, 242, 254, 0.1)',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Goal Detail Modal */}
      <Dialog open={detailModalOpen} onClose={handleCloseDetailModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: 'rgba(0, 242, 254, 0.8)' }}>
            {selectedGoal?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Goal Details
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedGoal && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Basic Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'rgba(0, 242, 254, 0.7)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FlagIcon fontSize="small" />
                  Basic Information
                </Typography>
                {selectedGoal.description && (
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      background: theme.palette.mode === 'light' 
                        ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.03) 0%, rgba(0, 242, 254, 0.01) 100%)'
                        : 'linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)',
                      border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.05)' : '1px solid rgba(0, 242, 254, 0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                      Description
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.primary" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedGoal.description}
                    </Typography>
                  </Paper>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        background: theme.palette.mode === 'light' 
                          ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.03) 0%, rgba(0, 242, 254, 0.01) 100%)'
                          : 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(79, 172, 254, 0.02) 100%)',
                        border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.05)' : '1px solid rgba(79, 172, 254, 0.1)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                        Category
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: 'rgba(79, 172, 254, 0.8)' }}>
                        {selectedGoal.category.charAt(0).toUpperCase() + selectedGoal.category.slice(1)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        background: theme.palette.mode === 'light' 
                          ? 'linear-gradient(135deg, rgba(0, 255, 157, 0.03) 0%, rgba(0, 255, 157, 0.01) 100%)'
                          : 'linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 255, 157, 0.02) 100%)',
                        border: theme.palette.mode === 'light' ? '1px solid rgba(0, 255, 157, 0.05)' : '1px solid rgba(0, 255, 157, 0.1)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                        Priority
                      </Typography>
                      <Chip 
                        label={selectedGoal.priority.charAt(0).toUpperCase() + selectedGoal.priority.slice(1)}
                        size="small"
                        color={getPriorityColor(selectedGoal.priority)}
                        sx={{ fontWeight: 500 }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Financial Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'rgba(0, 242, 254, 0.7)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon fontSize="small" />
                  Financial Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        background: theme.palette.mode === 'light' 
                          ? 'linear-gradient(135deg, rgba(0, 255, 157, 0.03) 0%, rgba(0, 255, 157, 0.01) 100%)'
                          : 'linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 255, 157, 0.02) 100%)',
                        border: theme.palette.mode === 'light' ? '1px solid rgba(0, 255, 157, 0.05)' : '1px solid rgba(0, 255, 157, 0.1)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                        Target Amount
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'rgba(0, 255, 157, 0.8)', fontSize: '1.1rem' }}>
                        {formatCurrency(selectedGoal.targetAmount)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        background: theme.palette.mode === 'light' 
                          ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.03) 0%, rgba(0, 242, 254, 0.01) 100%)'
                          : 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(79, 172, 254, 0.02) 100%)',
                        border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.05)' : '1px solid rgba(79, 172, 254, 0.1)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                        Current Amount
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'rgba(79, 172, 254, 0.8)', fontSize: '1.1rem' }}>
                        {formatCurrency(selectedGoal.currentAmount)}
                      </Typography>
                    </Paper>
                  </Grid> 
                </Grid>

                <Grid item xs={12}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        mt: 2,
                        p: 2, 
                        background: theme.palette.mode === 'light' 
                          ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.03) 0%, rgba(0, 242, 254, 0.01) 100%)'
                          : 'linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)',
                        border: theme.palette.mode === 'light' ? '1px solid rgba(0, 242, 254, 0.05)' : '1px solid rgba(0, 242, 254, 0.1)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                        Progress
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CustomProgressBar value={getProgressPercentage(selectedGoal.currentAmount, selectedGoal.targetAmount)} />
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'rgba(0, 242, 254, 0.8)' }}>
                          {Math.round(getProgressPercentage(selectedGoal.currentAmount, selectedGoal.targetAmount))}%
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        background: theme.palette.mode === 'light' 
                          ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.03) 0%, rgba(0, 242, 254, 0.01) 100%)'
                          : 'linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)',
                        border: theme.palette.mode === 'light' ? '1px solid rgba(0, 242, 254, 0.05)' : '1px solid rgba(0, 242, 254, 0.1)',
                        borderRadius: 2,
                        mt: 2
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                        Contributing Transactions
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <TextField
                          label="Filter"
                          value={contribFilter}
                          onChange={e => { setContribFilter(e.target.value); setContribPage(1); }}
                          size="small"
                          sx={{ minWidth: 180 }}
                        />
                        <TextField
                          select
                          label="Rows"
                          value={contribRowsPerPage}
                          onChange={e => { setContribRowsPerPage(Number(e.target.value)); setContribPage(1); }}
                          size="small"
                          sx={{ minWidth: 90 }}
                        >
                          <MenuItem value={5}>5</MenuItem>
                          <MenuItem value={10}>10</MenuItem>
                          <MenuItem value={20}>20</MenuItem>
                          <MenuItem value={50}>50</MenuItem>
                        </TextField>
                        <TextField
                          select
                          label="View"
                          value={contribView}
                          onChange={e => setContribView(e.target.value)}
                          size="small"
                          sx={{ minWidth: 120 }}
                        >
                          <MenuItem value="default">Default</MenuItem>
                          <MenuItem value="simple">Simple</MenuItem>
                        </TextField>
                      </Box>
                      <Box>
                        {(() => {
                          if (!selectedGoal) return null;
                          // Filtering logic
                          const auto = selectedGoal.autoUpdate || {};
                          const useAllCategories = auto.useAllCategories;
                          const allowedCategories = auto.categories || [];
                          const allowedTypes = auto.transactionTypes || [];
                          let filtered = transactions.filter(tx => {
                            // Type match
                            if (allowedTypes.length && !allowedTypes.includes(tx.type)) return false;
                            // Category match
                            if (!useAllCategories && allowedCategories.length && !allowedCategories.includes(tx.category)) return false;
                            // Only count positive for income, negative for expense
                            if (tx.type === 'income' && parseFloat(tx.amount) <= 0) return false;
                            if (tx.type === 'expense' && parseFloat(tx.amount) >= 0) return false;
                            // Filter by search
                            const search = contribFilter.toLowerCase();
                            if (
                              !(
                                tx.category.toLowerCase().includes(search) ||
                                (tx.description || '').toLowerCase().includes(search) ||
                                tx.type.toLowerCase().includes(search)
                              )
                            ) return false;
                            return true;
                          });
                          // Sort
                          filtered = [...filtered].sort((a, b) => {
                            let aValue = a[contribSortBy];
                            let bValue = b[contribSortBy];
                            if (contribSortBy === 'amount') {
                              aValue = parseFloat(aValue);
                              bValue = parseFloat(bValue);
                            }
                            if (contribSortBy === 'date') {
                              aValue = new Date(aValue);
                              bValue = new Date(bValue);
                            }
                            if (aValue < bValue) return contribSortDirection === 'asc' ? -1 : 1;
                            if (aValue > bValue) return contribSortDirection === 'asc' ? 1 : -1;
                            return 0;
                          });
                          // Simple view: group and sum by category and type
                          let tableRows = filtered;
                          let totalPages = Math.ceil(filtered.length / contribRowsPerPage) || 1;
                          if (contribView === 'simple') {
                            const grouped = {};
                            filtered.forEach(tx => {
                              const key = tx.category + '|' + tx.type;
                              if (!grouped[key]) {
                                grouped[key] = {
                                  category: tx.category,
                                  type: tx.type,
                                  amount: 0
                                };
                              }
                              grouped[key].amount += parseFloat(tx.amount);
                            });
                            tableRows = Object.values(grouped);
                            // Sort simple view
                            tableRows = [...tableRows].sort((a, b) => {
                              let aValue = a[contribSortBy];
                              let bValue = b[contribSortBy];
                              if (contribSortBy === 'amount') {
                                aValue = parseFloat(aValue);
                                bValue = parseFloat(bValue);
                              }
                              if (aValue < bValue) return contribSortDirection === 'asc' ? -1 : 1;
                              if (aValue > bValue) return contribSortDirection === 'asc' ? 1 : -1;
                              return 0;
                            });
                            totalPages = Math.ceil(tableRows.length / contribRowsPerPage) || 1;
                            tableRows = tableRows.slice((contribPage - 1) * contribRowsPerPage, contribPage * contribRowsPerPage);
                          } else {
                            tableRows = filtered.slice((contribPage - 1) * contribRowsPerPage, contribPage * contribRowsPerPage);
                          }
                          if (!filtered.length) return (
                            <Typography variant="body2" color="text.secondary">No transactions found.</Typography>
                          );
                          return (
                            <>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      {contribView === 'default' && (
                                        <>
                                          <TableCell onClick={() => {
                                            setContribSortBy('date');
                                            setContribSortDirection(contribSortBy === 'date' && contribSortDirection === 'asc' ? 'desc' : 'asc');
                                          }} sx={{ cursor: 'pointer' }}>
                                            Date {contribSortBy === 'date' ? (contribSortDirection === 'asc' ? '▲' : '▼') : ''}
                                          </TableCell>
                                          <TableCell onClick={() => {
                                            setContribSortBy('description');
                                            setContribSortDirection(contribSortBy === 'description' && contribSortDirection === 'asc' ? 'desc' : 'asc');
                                          }} sx={{ cursor: 'pointer' }}>
                                            Description {contribSortBy === 'description' ? (contribSortDirection === 'asc' ? '▲' : '▼') : ''}
                                          </TableCell>
                                        </>
                                      )}
                                      <TableCell onClick={() => {
                                        setContribSortBy('category');
                                        setContribSortDirection(contribSortBy === 'category' && contribSortDirection === 'asc' ? 'desc' : 'asc');
                                      }} sx={{ cursor: 'pointer' }}>
                                        Category {contribSortBy === 'category' ? (contribSortDirection === 'asc' ? '▲' : '▼') : ''}
                                      </TableCell>
                                      <TableCell onClick={() => {
                                        setContribSortBy('type');
                                        setContribSortDirection(contribSortBy === 'type' && contribSortDirection === 'asc' ? 'desc' : 'asc');
                                      }} sx={{ cursor: 'pointer' }}>
                                        Type {contribSortBy === 'type' ? (contribSortDirection === 'asc' ? '▲' : '▼') : ''}
                                      </TableCell>
                                      <TableCell onClick={() => {
                                        setContribSortBy('amount');
                                        setContribSortDirection(contribSortBy === 'amount' && contribSortDirection === 'asc' ? 'desc' : 'asc');
                                      }} align="right" sx={{ cursor: 'pointer' }}>
                                        Amount {contribSortBy === 'amount' ? (contribSortDirection === 'asc' ? '▲' : '▼') : ''}
                                      </TableCell>
                                      {contribView === 'simple' && (
                                        <TableCell align="right">% of Progress</TableCell>
                                      )}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {tableRows.map((tx, idx) => (
                                      <TableRow key={tx._id || tx.category + '|' + tx.type}>
                                        {contribView === 'default' && (
                                          <>
                                            <TableCell>{new Date(tx.date).toLocaleDateString('id-ID')}</TableCell>
                                            <TableCell>{tx.description}</TableCell>
                                          </>
                                        )}
                                        <TableCell>{tx.category}</TableCell>
                                        <TableCell>{tx.type}</TableCell>
                                        <TableCell align="right" style={{ color: tx.type === 'income' ? '#00ff9d' : '#ff6b6b', fontWeight: 500 }}>
                                          {formatCurrency(Math.abs(tx.amount))}
                                        </TableCell>
                                        {contribView === 'simple' && (
                                          <TableCell align="right">
                                            {(() => {
                                              // Calculate percentage of progress
                                              const total = Math.abs(selectedGoal.currentAmount);
                                              if (!total) return '0%';
                                              return ((Math.abs(tx.amount) / total) * 100).toFixed(1) + '%';
                                            })()}
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <Pagination
                                  count={totalPages}
                                  page={contribPage}
                                  onChange={(e, value) => setContribPage(value)}
                                  color="primary"
                                  shape="rounded"
                                  showFirstButton
                                  showLastButton
                                />
                              </Box>
                            </>
                          );
                        })()}
                      </Box>
                    </Paper>
                  </Grid>
              </Box>

              {/* Target Date Section */}
              {selectedGoal.targetDate && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'rgba(0, 242, 254, 0.7)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon fontSize="small" />
                    Target Date
                  </Typography>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      background: theme.palette.mode === 'light' 
                        ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.03) 0%, rgba(255, 193, 7, 0.01) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 193, 7, 0.05) 0%, rgba(255, 193, 7, 0.02) 100%)',
                      border: theme.palette.mode === 'light' ? '1px solid rgba(255, 193, 7, 0.05)' : '1px solid rgba(255, 193, 7, 0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500, color: 'rgba(255, 193, 7, 0.8)' }}>
                      {formatDate(selectedGoal.targetDate)}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Auto-Update Information */}
              {selectedGoal.autoUpdate?.enabled && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'rgba(0, 242, 254, 0.7)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon fontSize="small" />
                    Auto-Update Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          background: theme.palette.mode === 'light' 
                            ? 'linear-gradient(135deg, rgba(0, 255, 157, 0.03) 0%, rgba(0, 255, 157, 0.01) 100%)'
                            : 'linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 255, 157, 0.02) 100%)',
                          border: theme.palette.mode === 'light' ? '1px solid rgba(0, 255, 157, 0.05)' : '1px solid rgba(0, 255, 157, 0.1)',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                          Category Selection
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'rgba(0, 255, 157, 0.8)' }}>
                          {selectedGoal.autoUpdate.useAllCategories ? 'All Categories' : 'Selected Categories'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          background: theme.palette.mode === 'light' 
                            ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.03) 0%, rgba(0, 242, 254, 0.01) 100%)'
                            : 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(79, 172, 254, 0.02) 100%)',
                          border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.05)' : '1px solid rgba(79, 172, 254, 0.1)',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                          Transaction Types
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {selectedGoal.autoUpdate.transactionTypes.map((type) => (
                            <Chip 
                              key={type} 
                              label={type.charAt(0).toUpperCase() + type.slice(1)} 
                              size="small" 
                              color={type === 'income' ? 'success' : 'error'}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Paper>
                    </Grid>
                    {!selectedGoal.autoUpdate.useAllCategories && selectedGoal.autoUpdate.categories.length > 0 && (
                      <Grid item xs={12}>
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2, 
                            background: theme.palette.mode === 'light' 
                              ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.03) 0%, rgba(0, 242, 254, 0.01) 100%)'
                              : 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(79, 172, 254, 0.02) 100%)',
                            border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.05)' : '1px solid rgba(79, 172, 254, 0.1)',
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                            Selected Categories
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {selectedGoal.autoUpdate.categories.map((category) => (
                              <Chip key={category} label={category} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Timestamps */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'rgba(0, 242, 254, 0.7)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EditIcon fontSize="small" />
                  Timestamps
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        background: theme.palette.mode === 'light' 
                          ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.03) 0%, rgba(0, 242, 254, 0.01) 100%)'
                          : 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(79, 172, 254, 0.02) 100%)',
                        border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.05)' : '1px solid rgba(79, 172, 254, 0.1)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                        Created
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                        {formatDate(selectedGoal.createdAt)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        background: theme.palette.mode === 'light' 
                          ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.03) 0%, rgba(0, 242, 254, 0.01) 100%)'
                          : 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(79, 172, 254, 0.02) 100%)',
                        border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.05)' : '1px solid rgba(79, 172, 254, 0.1)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                        Last Updated
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                        {formatDate(selectedGoal.updatedAt)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseDetailModal} 
            variant="outlined"
            sx={{
              borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.2)' : 'rgba(0, 242, 254, 0.2)',
              color: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.6)' : 'rgba(0, 242, 254, 0.8)',
              '&:hover': {
                borderColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.3)' : 'rgba(0, 242, 254, 0.3)',
                backgroundColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.03)' : 'rgba(0, 242, 254, 0.05)',
              }
            }}
          >
            Close
          </Button>
          <Button 
            onClick={() => {
              handleCloseDetailModal();
              handleOpenDialog(selectedGoal);
            }} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.8) 0%, rgba(79, 172, 254, 0.8) 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.9) 0%, rgba(79, 172, 254, 0.9) 100%)',
              }
            }}
          >
            Edit Goal
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Goal</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete the goal "{goalToDelete?.title}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (goalToDelete) handleDelete(goalToDelete._id);
              setDeleteDialogOpen(false);
              setGoalToDelete(null);
            }} 
            color="error" variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Goals; 