import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Container, Box } from '@mui/material';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Navbar from './components/Navbar';
import Settings from './components/Settings';

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

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Navbar mode={mode} toggleTheme={toggleTheme} />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 4,
              mt: '64px', // Height of the AppBar
              width: '100%',
              minHeight: 'calc(100vh - 64px)',
              maxWidth: 'lg',
              mx: 'auto'
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </ThemeProvider>
    </Router>
  );
}

export default App;
