import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material';
import { Container, Box } from '@mui/material';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [mode, setMode] = useState('dark');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light mode
                primary: {
                  main: '#4facfe',
                  light: '#00f2fe',
                  dark: '#2196f3',
                },
                secondary: {
                  main: '#00f2fe',
                  light: '#4dfff8',
                  dark: '#00bfd4',
                },
                background: {
                  default: '#f8fafc',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#1e293b',
                  secondary: '#475569',
                },
                divider: 'rgba(0, 0, 0, 0.06)',
              }
            : {
                // Dark mode
                primary: {
                  main: '#00f2fe',
                },
                background: {
                  default: '#0a1929',
                  paper: '#132f4c',
                },
                text: {
                  primary: '#ffffff',
                  secondary: '#b2bac2',
                },
              }),
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h6: {
            fontWeight: 600,
          },
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(19, 47, 76, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 600,
              },
            },
          },
        },
      }),
    [mode],
  );

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Navbar mode={mode} toggleTheme={toggleTheme} isMobile={isMobile} />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 1,
              mt: isMobile ? 0 : '64px',
              mb: isMobile ? '64px' : 0,
              width: '100%',
              minHeight: `calc(100vh - ${isMobile ? '0px' : '64px'})`,
              maxWidth: isMobile ? '100vw' : 'lg',
              overflowX: 'hidden',
              mx: 'auto'
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/goals" element={<Goals />} />
            </Routes>
          </Box>
        </Box>
      </ThemeProvider>
    </Router>
  );
}

export default App;
