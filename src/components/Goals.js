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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Flag as FlagIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

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

  const [transactionCategories, setTransactionCategories] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Load goals from database on component mount
  useEffect(() => {
    fetchGoals();
    fetchTransactionCategories();
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
        category: goal.category || 'savings',
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
        category: 'savings',
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.9) 0%, rgba(79, 172, 254, 0.9) 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 1) 0%, rgba(79, 172, 254, 1) 100%)',
            }
          }}
        >
          Add Goal
        </Button>
      </Box>

      {goals.length === 0 ? (
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
        <Grid container spacing={3}>
          {goals.map((goal) => (
            <Grid item xs={12} md={6} lg={4} key={goal._id}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
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
                  }
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
                <CardContent>
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

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getProgressPercentage(goal.currentAmount, goal.targetAmount)}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.08)' : 'rgba(79, 172, 254, 0.15)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.9) 0%, rgba(79, 172, 254, 0.9) 100%)',
                        }
                      }}
                    />
                  </Box>

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
                        borderColor: 'rgba(79, 172, 254, 0.4)',
                        color: 'rgba(79, 172, 254, 0.9)',
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
                  rows={Math.max(1, formData.description.split('\n').length)}
                  placeholder="Add more details about your goal..."
                  helperText="Optional: Add notes, milestones, or motivation"
                />
              </Grid>
            </Box>

            {/* Financial Details Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Financial Details
              </Typography>
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
                      <MenuItem value="savings">Savings</MenuItem>
                      <MenuItem value="purchase">Purchase</MenuItem>
                      <MenuItem value="income">Income Goal</MenuItem>
                      <MenuItem value="debt">Debt Payoff</MenuItem>
                      <MenuItem value="investment">Investment</MenuItem>
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
                <Grid item xs={12} mt={3}>
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
                        Progress
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getProgressPercentage(selectedGoal.currentAmount, selectedGoal.targetAmount)}
                          sx={{ 
                            flexGrow: 1, 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.05)' : 'rgba(79, 172, 254, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.8) 0%, rgba(79, 172, 254, 0.8) 100%)',
                            }
                          }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'rgba(0, 242, 254, 0.8)' }}>
                          {Math.round(getProgressPercentage(selectedGoal.currentAmount, selectedGoal.targetAmount))}%
                        </Typography>
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