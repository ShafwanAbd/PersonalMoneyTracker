import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

function Navbar() {
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'rgba(19, 47, 76, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar>
        <AccountBalanceWalletIcon 
          sx={{ 
            mr: 2,
            color: '#00f2fe',
            fontSize: 32,
          }} 
        />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600,
          }}
        >
          Money Tracker
        </Typography>
        <Box>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            sx={{
              mx: 1,
              '&:hover': {
                background: 'rgba(0, 242, 254, 0.1)',
              },
            }}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/transactions"
            sx={{
              mx: 1,
              '&:hover': {
                background: 'rgba(79, 172, 254, 0.1)',
              },
            }}
          >
            Transactions
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 