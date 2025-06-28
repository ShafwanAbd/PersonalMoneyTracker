import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Select, MenuItem, FormControl, InputLabel, useTheme, FormControlLabel, Switch, TextField, Button } from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';

function Settings() {
  const theme = useTheme();
  const [autoExportInterval, setAutoExportInterval] = useState('never');
  const [settings, setSettings] = useState({ autoExport: false, exportInterval: 'never' });
  const [exportIntervals, setExportIntervals] = useState([
    { value: 'never', label: 'Never' },
    { value: '7d', label: 'Every 7 Days' },
    { value: '1m', label: 'Every Month' },
    { value: '3m', label: 'Every 3 Months' }
  ]);

  useEffect(() => {
    // Fetch current settings when component mounts
    const fetchSettings = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/settings');
        setAutoExportInterval(response.data.autoExportInterval || 'never');
        setSettings({
          autoExport: response.data.autoExport || false,
          exportInterval: response.data.autoExportInterval || 'never'
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleAutoExportChange = async (event) => {
    const newInterval = event.target.value;
    try {
      await axios.post('http://localhost:5000/api/settings', {
        autoExportInterval: newInterval
      });
      setAutoExportInterval(newInterval);
      setSettings({ ...settings, exportInterval: newInterval });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
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
          <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
            Google Sheets Export Settings
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoExport}
                  onChange={handleChange}
                  name="autoExport"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: theme.palette.mode === 'light' ? '#4facfe' : '#00f2fe',
                      '& + .MuiSwitch-track': {
                        backgroundColor: theme.palette.mode === 'light' ? '#4facfe' : '#00f2fe',
                      },
                    },
                  }}
                />
              }
              label="Enable Auto Export"
            />
            <TextField
              select
              fullWidth
              label="Export Interval"
              name="exportInterval"
              value={settings.exportInterval}
              onChange={handleChange}
              disabled={!settings.autoExport}
              sx={{ mt: 2 }}
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
              {exportIntervals.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 3,
                background: theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                  : 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                color: '#fff',
                '&:hover': {
                  background: theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                    : 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                  opacity: 0.9,
                },
              }}
            >
              Save Settings
            </Button>
          </Box>
        </Paper>
      </Box>
    </motion.div>
  );
}

export default Settings; 