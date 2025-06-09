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
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTheme } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import { motion } from 'framer-motion';

function Transactions() {
  const theme = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
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

  // Define known expense categories (add more as needed)
  const expenseCategories = [
    'Food', 'Transportation', 'Entertainment', 'Bills', 'Other', 'gaming', 'hutang'
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
      const response = await fetch('http://localhost:5000/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category || categoryError || !categories.includes(category)) return;

    const numAmount = parseFloat(amount);
    // Type is determined only by sign of amount
    const type = numAmount >= 0 ? 'income' : 'expense';

    const transaction = {
      amount: numAmount, // store as entered
      description: description || 'No description',
      type,
      category,
      date: date.toISOString(),
    };

    try {
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (response.ok) {
        setAmount('');
        setDescription('');
        setCategory('');
        setDate(new Date());
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/${id}`, {
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
      const response = await fetch('http://localhost:5000/api/categories', {
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
      const response = await fetch(`http://localhost:5000/api/categories/${oldName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCategoryValue }),
      });
      if (response.ok) {
        await fetchCategories();
        setEditCategory(null);
        setEditCategoryValue('');
      } else {
        const data = await response.json();
        setCategoryActionError(data.message || 'Failed to edit category');
      }
    } catch (error) {
      setCategoryActionError('Error editing category');
    }
  };

  const handleDeleteCategoryDialog = async (categoryName) => {
    if (!window.confirm(`Delete category "${categoryName}"?`)) return;
    await handleDeleteCategory(categoryName);
  };

  const handleDeleteCategory = async (categoryName) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${categoryName}`, {
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
      const response = await fetch(`http://localhost:5000/api/transactions/${editTransaction._id}`, {
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
      const response = await fetch(`http://localhost:5000/api/transactions/${deleteId}`, {
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

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
      <Box sx={{ p: 3, minHeight: '100vh' }}>
        <motion.div whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0, 242, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              background: 'rgba(19, 47, 76, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
              Add New Transaction
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap'}} mt={2}>
              <TextField
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                sx={{ flex: 1, minWidth: '200px' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                }}
                helperText={parseFloat(amount) >= 0 ? "Positive for income" : "Negative for expense"}
              />
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ flex: 1, minWidth: '200px' }}
              />
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={date}
                  onChange={(newDate) => setDate(newDate)}
                  sx={{ flex: 1, minWidth: '200px' }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                  views={['year', 'month', 'day']}
                  openTo="day"
                  format="dd MMMM yyyy"
                />
              </LocalizationProvider>
              <Autocomplete
                options={categories}
                value={category}
                onChange={(event, newValue) => {
                  setCategory(newValue || '');
                  setCategoryError(!newValue);
                }}
                inputValue={category}
                onInputChange={(event, newInputValue, reason) => {
                  if (categories.includes(newInputValue)) {
                    setCategory(newInputValue);
                    setCategoryError(false);
                  } else {
                    setCategory(newInputValue);
                    setCategoryError(true);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    required
                    error={categoryError}
                    helperText={categoryError ? 'Please select a valid category' : ''}
                    sx={{ flex: 1, minWidth: '200px' }}
                  />
                )}
                sx={{ flex: 1, minWidth: '200px' }}
                freeSolo={false}
              />
              <Button
                variant="contained"
                type="submit"
                sx={{
                  flex: 1,
                  minWidth: '200px',
                  background: 'linear-gradient(45deg, #00f2fe 30%, #4facfe 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #4facfe 30%, #00f2fe 90%)',
                  },
                }}
                disabled={categoryError || !category || !categories.includes(category)}
              >
                Add Transaction
              </Button>
              <Button
                variant="outlined"
                onClick={() => setOpenDialog(true)}
                startIcon={<AddIcon />}
                sx={{
                  flex: 1,
                  minWidth: '200px',
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.light,
                    backgroundColor: 'rgba(0, 242, 254, 0.1)',
                  },
                }}
              >
                Manage Categories
              </Button>
            </Box>
          </Paper>
        </motion.div>

        <motion.div whileHover={{ boxShadow: '0 8px 32px rgba(0, 242, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              background: 'rgba(19, 47, 76, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, flex: 1 }}>
                Transaction History
              </Typography>
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
                    // Expense if amount is negative or category is in expenseCategories
                    const isExpense = numAmount < 0 || expenseCategories.map(c => c.toLowerCase()).includes((transaction.category || '').toLowerCase());
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
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0, 242, 254, 0.18)' }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, minWidth: 320 }}>
                <List dense>
                  {categories.map((cat) => (
                    <ListItem key={cat} sx={{ py: 0.5 }}>
                      {editCategory === cat ? (
                        <TextField
                          value={editCategoryValue}
                          onChange={e => setEditCategoryValue(e.target.value)}
                          size="small"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEditCategory(cat);
                            if (e.key === 'Escape') setEditCategory(null);
                          }}
                          sx={{ mr: 1, flex: 1 }}
                        />
                      ) : (
                        <ListItemText primary={cat} sx={{ flex: 1, mr: 1 }} />
                      )}
                      <ListItemSecondaryAction>
                        {editCategory === cat ? (
                          <IconButton edge="end" color="primary" onClick={() => handleSaveEditCategory(cat)}>
                            <SaveIcon />
                          </IconButton>
                        ) : (
                          <IconButton edge="end" color="info" onClick={() => handleEditCategory(cat)}>
                            <EditIcon />
                          </IconButton>
                        )}
                        <IconButton edge="end" color="error" onClick={() => handleDeleteCategoryDialog(cat)} disabled={cat === 'Other'} sx={{ ml: 1 }}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <TextField
                    label="New Category"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <Button variant="contained" onClick={handleAddCategory} disabled={!newCategory}>
                    Add
                  </Button>
                </Box>
                {categoryActionError && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>{categoryActionError}</Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Close</Button>
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
      </Box>
    </motion.div>
  );
}

export default Transactions; 