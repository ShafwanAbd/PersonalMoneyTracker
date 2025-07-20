import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Pagination,
  useMediaQuery,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import { useTheme } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import { motion } from 'framer-motion';
import axios from 'axios';
import { id } from 'date-fns/locale';
import { format } from 'date-fns';

function Transactions() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [formattedDate, setFormattedDate] = useState(format(date, 'd MMMM yyyy', { locale: id }));
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  const [categoryActionError, setCategoryActionError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [categoryError, setCategoryError] = useState(false);
  const [filter, setFilter] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Define all categories
  const allCategories = [
    // Income categories
    'Salary',
    'Freelance',
    'Investments',
    'Business',
    'Rental',
    'Gifts',
    'Refunds',
    // Expense categories
    'Food & Dining',
    'Transportation',
    'Housing',
    'Utilities',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Education',
    'Personal Care',
    'Travel',
    'Gifts & Donations',
    'Investments',
    'Other'
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setAmountError(!value || isNaN(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const isAmountValid = amount && !isNaN(amount);
    const numAmount = parseFloat(amount);
    const type = numAmount >= 0 ? 'income' : 'expense';
    const isCategoryValid = category && categories.includes(category);
    
    setAmountError(!isAmountValid);
    setCategoryError(!isCategoryValid);
    
    if (!isAmountValid || !isCategoryValid) {
      return;
    }

    try {
      const transactionData = {
        amount: numAmount,
        category,
        date: date.toISOString(),
        formattedDate: formattedDate,
        description,
        type
      };

      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/transactions`, transactionData);
      
      // Reset form
      setAmount('');
      setCategory('');
      setDate(new Date());
      setDescription('');
      setAmountError(false);
      setCategoryError(false);
      
      // Refresh transactions
      fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategory }),
      });
      if (response.ok) {
        await fetchCategories();
        setNewCategory('');
      } else {
        const data = await response.json();
        setCategoryActionError(data.message || 'Failed to add category');
      }
    } catch (error) {
      setCategoryActionError('Error adding category');
    }
  };

  const handleEditCategory = (name) => {
    setEditCategory(name);
    setEditCategoryValue(name);
  };

  const handleSaveEditCategory = async (oldName) => {
    if (!editCategoryValue || editCategoryValue === oldName) {
      setEditCategory(null);
      setEditCategoryValue('');
      return;
    }
    try {
      // First update the category name
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/categories/${oldName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: editCategoryValue }),
      });
      
      if (response.ok) {
        // Then update all transactions that use this category
        const updateResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/transactions/category/${oldName}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newCategory: editCategoryValue }),
        });

        if (updateResponse.ok) {
          await fetchCategories();
          await fetchTransactions(); // Refresh transactions to show updated categories
          setEditCategory(null);
          setEditCategoryValue('');
          setCategoryActionError('');
        } else {
          const data = await updateResponse.json();
          setCategoryActionError(data.message || 'Failed to update transactions');
        }
      } else {
        const data = await response.json();
        setCategoryActionError(data.message || 'Failed to edit category');
      }
    } catch (error) {
      console.error('Error editing category:', error);
      setCategoryActionError('Error editing category');
    }
  };

  const handleDeleteCategoryDialog = async (categoryName) => {
    if (!window.confirm(`Delete category "${categoryName}"?`)) return;
    await handleDeleteCategory(categoryName);
  };

  const handleDeleteCategory = async (categoryName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/categories/${categoryName}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCategories();
        setDeleteError('');
      } else {
        const data = await response.json();
        setDeleteError(data.message);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Filtered and paginated transactions
  const filteredTransactions = transactions.filter((t) => {
    const search = filter.toLowerCase();
    return (
      t.category.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search) ||
      t.type.toLowerCase().includes(search)
    );
  });

  // Sort handler
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    if (sortBy === 'amount') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }
    if (sortBy === 'date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  const totalPages = Math.ceil(sortedTransactions.length / rowsPerPage);
  const paginatedTransactions = sortedTransactions.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Edit handlers
  const handleEditClick = (transaction) => {
    setEditTransaction({ ...transaction });
    setEditDialogOpen(true);
  };
  const handleEditChange = (field, value) => {
    setEditTransaction((prev) => ({ ...prev, [field]: value }));
  };
  const handleEditSave = async () => {
    if (!editTransaction) return;
    // Type is determined only by sign of amount
    const numAmount = parseFloat(editTransaction.amount);
    const type = numAmount >= 0 ? 'income' : 'expense';
    const updated = { ...editTransaction, amount: numAmount, type };
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/transactions/${editTransaction._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (response.ok) {
        setEditDialogOpen(false);
        setEditTransaction(null);
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  // Delete with confirmation (update UI after deletion)
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/transactions/${deleteId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setTransactions((prev) => prev.filter((t) => t._id !== deleteId));
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
    setDeleteConfirmOpen(false);
    setDeleteId(null);
  };

  // When rowsPerPage or filter changes, reset to first page
  useEffect(() => {
    setPage(1);
  }, [rowsPerPage, filter]);

  const handleExport = () => {
    // Prepare CSV header
    const csvHeader = 'date,description,amount,category\n';
    // Prepare CSV rows
    const csvRows = transactions.map(t => {
      // Escape commas and quotes in fields
      const escape = (str) => `"${String(str).replace(/"/g, '""')}"`;
      return [
        t.date ? new Date(t.date).toLocaleDateString('en-CA') : '',
        escape(t.description || ''),
        t.amount != null ? t.amount : '',
        escape(t.category || '')
      ].join(',');
    });
    const csvContent = csvHeader + csvRows.join('\n');
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    try {
      setIsImporting(true);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const csvData = e.target.result;
          const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/import/csv`, {
            csvData: csvData
          });

          setImportResult(response.data);
          setShowImportDialog(true);
          
          // Refresh transactions if any were imported
          if (response.data.imported > 0) {
            fetchTransactions();
          }
        } catch (error) {
          console.error('Error importing CSV:', error);
          const errorMessage = error.response?.data?.error || error.message;
          alert(`Failed to import CSV: ${errorMessage}`);
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file');
      setIsImporting(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setIsDeletingAll(true);
      const response = await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/transactions/all`);
      
      if (response.status === 200) {
        setShowDeleteAllDialog(false);
        fetchTransactions(); // Refresh the transaction list
        alert('All transactions have been deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting all transactions:', error);
      alert('Failed to delete all transactions');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setCategoryError(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
      <Box sx={{ p: 3, minHeight: '100vh' }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, flexGrow: 1 }}>
                Add New Transaction
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, ml: isMobile ? 0 : 'auto' }}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                  id="csv-import-input"
                />
                <label htmlFor="csv-import-input">
                  <Button
                    component="span"
                    disabled={isImporting}
                    variant="contained"
                    startIcon={<UploadIcon />}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      background: 'linear-gradient(135deg, rgba(0,242,254,0.7) 0%, rgba(79,172,254,0.7) 100%)',
                      color: '#fff',
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(0,242,254,0.85) 0%, rgba(79,172,254,0.85) 100%)',
                        color: '#fff',
                      },
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      px: isMobile ? 1.5 : 2,
                    }}
                  >
                    {isMobile ? 'Import' : (isImporting ? 'Importing...' : 'Import from CSV')}
                  </Button>
                </label>
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(0,242,254,0.7) 0%, rgba(79,172,254,0.7) 100%)',
                    color: '#fff',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(0,242,254,0.85) 0%, rgba(79,172,254,0.85) 100%)',
                      color: '#fff',
                    },
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    px: isMobile ? 1.5 : 2,
                  }}
                >
                  {isMobile ? 'Export' : (isExporting ? 'Exporting...' : 'Export to CSV')}
                </Button>
              </Box>
            </Box>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  required
                  error={amountError}
                  sx={{ flex: 1, minWidth: '200px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                  }}
                  helperText={amountError ? "Invalid amount" : "Negative for expense, positive for income"}
                />
                <TextField
                  select
                  value={category}
                  onChange={handleCategoryChange}
                  label="Category"
                  fullWidth
                  required
                  error={categoryError}
                  sx={{ flex: 1, minWidth: '200px' }}
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
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  sx={{ flex: 1, minWidth: '200px' }}
                />
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
                  <DatePicker
                    label="Date"
                    value={date}
                    onChange={(newValue) => {
                      setDate(newValue);
                      setFormattedDate(format(newValue, 'd MMMM yyyy', { locale: id }));
                    }}
                    views={['year', 'month', 'day']}
                    openTo="day"
                    format="dd MMMM yyyy"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        required
                        helperText="Format: 6 Juni 2025"
                        sx={{ borderRadius: 2, input: { color: '#fff' } }}
                        InputProps={{ ...params.InputProps, sx: { borderRadius: 2 } }}
                        value={formattedDate}
                        onChange={(e) => {
                          const dateParts = e.target.value.split(' ');
                          if (dateParts.length === 3) {
                            const day = parseInt(dateParts[0]);
                            const monthName = dateParts[1];
                            const year = parseInt(dateParts[2]);
                            const month = new Date(Date.parse(monthName + ' 1, 2025')).getMonth();
                            const newDate = new Date(year, month, day);
                            setDate(newDate);
                            setFormattedDate(format(newDate, 'd MMMM yyyy', { locale: id }));
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={amountError || categoryError || !category || !categories.includes(category)}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(0,242,254,0.7) 0%, rgba(79,172,254,0.7) 100%)',
                    color: '#fff',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(0,242,254,0.85) 0%, rgba(79,172,254,0.85) 100%)',
                      color: '#fff',
                    },
                  }}
                >
                  Add Transaction
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setOpenDialog(true)}
                  startIcon={<AddIcon />}
                  fullWidth
                  sx={{
                    borderColor: theme.palette.mode === 'light' ? '#4facfe' : theme.palette.primary.main,
                    color: theme.palette.mode === 'light' ? '#4facfe' : theme.palette.primary.main,
                    '&:hover': {
                      borderColor: theme.palette.mode === 'light' ? '#00f2fe' : theme.palette.primary.light,
                      backgroundColor: theme.palette.mode === 'light' 
                        ? 'rgba(79, 172, 254, 0.1)'
                        : 'rgba(0, 242, 254, 0.1)',
                    },
                  }}
                >
                  Manage Categories
                </Button>
              </Box>
            </Box>
          </Paper>

        {isMobile && isPortrait ? (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mt: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: theme.palette.mode === 'light' 
                ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                : 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)',
              color: theme.palette.text.primary,
              borderRadius: 2,
              border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
              minHeight: 200,
            }}
          >
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, textAlign: 'center' }}>
              Transaction History
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
              Please rotate your phone to view the transaction history.
            </Typography>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mt: 3,
              background: theme.palette.mode === 'light' 
                ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)'
                : 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)',
              color: theme.palette.text.primary,
              borderRadius: 2,
              transition: 'all 0.3s ease',
              border: theme.palette.mode === 'light' ? '1px solid rgba(79, 172, 254, 0.1)' : 'none',
            }}
          >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, flex: 1 }}>
                  Transaction History
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setShowDeleteAllDialog(true)}
                  disabled={transactions.length === 0}
                  sx={{
                    borderColor: '#ff6b6b',
                    color: '#ff6b6b',
                    '&:hover': {
                      borderColor: '#ff5252',
                      backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    },
                    '&.Mui-disabled': {
                      borderColor: 'rgba(255, 107, 107, 0.3)',
                      color: 'rgba(255, 107, 107, 0.3)',
                    },
                  }}
                >
                  Delete All Data
                </Button>
                <TextField
                  label="Filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  size="small"
                  sx={{ minWidth: 200 }}
                />
                <TextField
                  select
                  label="Rows"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  size="small"
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </TextField>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell onClick={() => handleSort('date')} sx={{ cursor: 'pointer' }}>
                        Date {sortBy === 'date' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </TableCell>
                      <TableCell onClick={() => handleSort('description')} sx={{ cursor: 'pointer' }}>
                        Description {sortBy === 'description' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </TableCell>
                      <TableCell onClick={() => handleSort('category')} sx={{ cursor: 'pointer' }}>
                        Category {sortBy === 'category' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </TableCell>
                      <TableCell align="right" onClick={() => handleSort('amount')} sx={{ cursor: 'pointer' }}>
                        Amount {sortBy === 'amount' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedTransactions.map((transaction) => {
                      const numAmount = parseFloat(transaction.amount);
                      // Expense if amount is negative
                      const isExpense = numAmount < 0;
                      const displayAmount = isExpense ? `- ${formatCurrency(Math.abs(numAmount))}` : formatCurrency(numAmount);
                      return (
                        <TableRow 
                          key={transaction._id}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(0, 242, 254, 0.08)',
                              transition: 'background-color 0.2s ease',
                            },
                            '& td': {
                              padding: '8px 16px',
                              height: '40px'
                            }
                          }}
                        >
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell align="right">
                            <Typography
                              sx={{
                                color: isExpense ? '#ff6b6b' : '#00ff9d',
                                fontWeight: 500,
                              }}
                            >
                              {displayAmount}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={() => handleEditClick(transaction)}
                              sx={{ color: theme.palette.info.main, mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDeleteClick(transaction._id)}
                              sx={{
                                color: theme.palette.error.main,
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                },
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                  shape="rounded"
                  showFirstButton
                  showLastButton
                />
              </Box>
            </Paper>
        )}

        <motion.div whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0, 242, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)}
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
              Manage Categories
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  label="New Category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
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
                />
                <Button
                  variant="contained"
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim()}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(0,242,254,0.7) 0%, rgba(79,172,254,0.7) 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(0,242,254,0.85) 0%, rgba(79,172,254,0.85) 100%)',
                      color: '#fff',
                    },
                    '&.Mui-disabled': {
                      background: theme.palette.mode === 'light'
                        ? 'rgba(79, 172, 254, 0.3)'
                        : 'rgba(0, 242, 254, 0.3)',
                      color: theme.palette.mode === 'light'
                        ? 'rgba(255, 255, 255, 0.7)'
                        : 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                >
                  Add
                </Button>
              </Box>
              <List>
                {categories.map((cat) => (
                  <ListItem
                    key={cat}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {editCategory === cat ? (
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
                            onClick={() => handleEditCategory(cat)}
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
                    {editCategory === cat ? (
                      <Box sx={{ width: '100%' }}>
                        <TextField
                          value={editCategoryValue}
                          onChange={e => setEditCategoryValue(e.target.value)}
                          size="small"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEditCategory(cat);
                            if (e.key === 'Escape') setEditCategory(null);
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
                        {categoryActionError && (
                          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                            {categoryActionError}
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
            </DialogContent>
            <DialogActions sx={{ 
              borderTop: `1px solid ${theme.palette.mode === 'light' ? 'rgba(79, 172, 254, 0.2)' : 'rgba(0, 242, 254, 0.1)'}`,
              p: 2
            }}>
              <Button 
                onClick={() => setOpenDialog(false)}
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
        </motion.div>

        {deleteError && (
          <motion.div whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0, 242, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
            <Dialog open={!!deleteError} onClose={() => setDeleteError('')}>
              <DialogTitle>Cannot Delete Category</DialogTitle>
              <DialogContent>
                <Typography>{deleteError}</Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteError('')}>OK</Button>
              </DialogActions>
            </Dialog>
          </motion.div>
        )}

        {/* Edit Dialog */}
        <motion.div whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0, 242, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, rgba(19,47,76,0.95) 60%, rgba(0,242,254,0.08) 100%)',
                backdropFilter: 'blur(18px)',
                borderRadius: 4,
                border: '1.5px solid rgba(0,242,254,0.25)',
                boxShadow: '0 8px 32px 0 rgba(0,242,254,0.15)',
                p: 2,
                minWidth: 350,
              }
            }}
          >
            <DialogTitle sx={{
              fontWeight: 700,
              fontSize: 26,
              textAlign: 'center',
              background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}>
              Edit Transaction
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <TextField
                label="Description"
                value={editTransaction?.description || ''}
                onChange={(e) => handleEditChange('description', e.target.value)}
                sx={{ borderRadius: 2, input: { color: '#fff' } }}
                InputProps={{ sx: { borderRadius: 2 } }}
                fullWidth
              />
              <Autocomplete
                options={categories}
                value={editTransaction?.category || ''}
                onChange={(event, newValue) => handleEditChange('category', newValue || '')}
                inputValue={editTransaction?.category || ''}
                onInputChange={(event, newInputValue) => handleEditChange('category', newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    required
                    sx={{ borderRadius: 2, input: { color: '#fff' } }}
                    InputProps={{ ...params.InputProps, sx: { borderRadius: 2 } }}
                    fullWidth
                  />
                )}
                sx={{ borderRadius: 2, minWidth: '200px' }}
                freeSolo={false}
              />
              <TextField
                label="Amount"
                type="number"
                value={editTransaction?.amount || ''}
                onChange={(e) => handleEditChange('amount', e.target.value)}
                sx={{ borderRadius: 2, input: { color: '#fff' } }}
                InputProps={{ sx: { borderRadius: 2 } }}
                fullWidth
              />
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={editTransaction?.date ? new Date(editTransaction.date) : null}
                  onChange={(newDate) => handleEditChange('date', newDate)}
                  views={['year', 'month', 'day']}
                  openTo="day"
                  format="dd MMMM yyyy"
                  slotProps={{ textField: { fullWidth: true, sx: { borderRadius: 2, input: { color: '#fff' } } } }}
                />
              </LocalizationProvider>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
              <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#00f2fe', fontWeight: 600 }}>Cancel</Button>
              <Button
                onClick={handleEditSave}
                variant="contained"
                sx={{
                  background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
                  color: '#132f4c',
                  fontWeight: 700,
                  borderRadius: 2,
                  boxShadow: '0 0 12px 2px #00f2fe55',
                  px: 4,
                  py: 1.2,
                  fontSize: 18,
                  '&:hover': {
                    background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                    boxShadow: '0 0 18px 4px #00f2fe99',
                  },
                }}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <motion.div whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0, 242, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
          <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogContent>
              <Typography>Are you sure you want to delete this transaction?</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
            </DialogActions>
          </Dialog>
        </motion.div>

        {/* Import Result Dialog */}
        <motion.div whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0, 242, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
          <Dialog open={showImportDialog} onClose={() => setShowImportDialog(false)}
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, rgba(19,47,76,0.95) 60%, rgba(0,242,254,0.08) 100%)',
                backdropFilter: 'blur(18px)',
                borderRadius: 4,
                border: '1.5px solid rgba(0,242,254,0.25)',
                boxShadow: '0 8px 32px 0 rgba(0,242,254,0.15)',
                p: 2,
                minWidth: 400,
              }
            }}
          >
            <DialogTitle sx={{
              fontWeight: 700,
              fontSize: 24,
              textAlign: 'center',
              background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}>
              Import Results
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              {importResult && (
                <>
                  <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                    {importResult.message}
                  </Typography>
                  
                  {importResult.imported > 0 && (
                    <Typography sx={{ color: '#00f2fe', fontWeight: 600 }}>
                      ✓ Successfully imported: {importResult.imported} transactions
                    </Typography>
                  )}
                  
                  {importResult.errors > 0 && (
                    <Typography sx={{ color: '#ff6b6b', fontWeight: 600 }}>
                      ✗ Errors: {importResult.errors} rows
                    </Typography>
                  )}
                  
                  {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                        Error Details:
                      </Typography>
                      <Box sx={{ 
                        maxHeight: 200, 
                        overflowY: 'auto', 
                        bgcolor: 'rgba(255, 107, 107, 0.1)', 
                        p: 1, 
                        borderRadius: 1,
                        border: '1px solid rgba(255, 107, 107, 0.3)'
                      }}>
                        {importResult.errorDetails.map((error, index) => (
                          <Typography key={index} sx={{ color: '#ff6b6b', fontSize: '0.875rem', mb: 0.5 }}>
                            {error}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', px: 3, pb: 2 }}>
              <Button 
                onClick={() => setShowImportDialog(false)}
                variant="contained"
                sx={{
                  background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
                  color: '#132f4c',
                  fontWeight: 700,
                  borderRadius: 2,
                  boxShadow: '0 0 12px 2px #00f2fe55',
                  px: 4,
                  py: 1.2,
                  fontSize: 16,
                  '&:hover': {
                    background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                    boxShadow: '0 0 18px 4px #00f2fe99',
                  },
                }}
              >
                OK
              </Button>
            </DialogActions>
          </Dialog>
        </motion.div>

        {/* Delete All Confirmation Dialog */}
        <motion.div whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0, 242, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
          <Dialog open={showDeleteAllDialog} onClose={() => setShowDeleteAllDialog(false)}
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, rgba(19,47,76,0.95) 60%, rgba(0,242,254,0.08) 100%)',
                backdropFilter: 'blur(18px)',
                borderRadius: 4,
                border: '1.5px solid rgba(255, 107, 107, 0.25)',
                boxShadow: '0 8px 32px 0 rgba(255, 107, 107, 0.15)',
                p: 2,
                minWidth: 400,
              }
            }}
          >
            <DialogTitle sx={{
              fontWeight: 700,
              fontSize: 24,
              textAlign: 'center',
              color: '#ff6b6b',
              mb: 2,
            }}>
              ⚠️ Delete All Data
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Typography sx={{ color: '#fff', fontWeight: 500, textAlign: 'center' }}>
                Are you sure you want to delete ALL transactions?
              </Typography>
              <Typography sx={{ color: '#ff6b6b', fontWeight: 600, textAlign: 'center', fontSize: '0.9rem' }}>
                This action cannot be undone!
              </Typography>
              <Typography sx={{ color: '#fff', fontWeight: 400, textAlign: 'center', fontSize: '0.85rem' }}>
                Total transactions to delete: {transactions.length}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
              <Button 
                onClick={() => setShowDeleteAllDialog(false)}
                sx={{ 
                  color: '#00f2fe', 
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 242, 254, 0.1)',
                  },
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                variant="contained"
                sx={{
                  background: 'linear-gradient(90deg, #ff6b6b 0%, #ff5252 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: 2,
                  boxShadow: '0 0 12px 2px #ff6b6b55',
                  px: 4,
                  py: 1.2,
                  fontSize: 16,
                  '&:hover': {
                    background: 'linear-gradient(90deg, #ff5252 0%, #ff6b6b 100%)',
                    boxShadow: '0 0 18px 4px #ff6b6b99',
                  },
                  '&.Mui-disabled': {
                    background: 'rgba(255, 107, 107, 0.3)',
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                {isDeletingAll ? 'Deleting...' : 'Delete All'}
              </Button>
            </DialogActions>
          </Dialog>
        </motion.div>
      </Box>
    </motion.div>
  );
}

export default Transactions; 