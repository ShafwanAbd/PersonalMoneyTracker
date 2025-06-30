import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FlagIcon from '@mui/icons-material/Flag';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

function Navbar({ mode, toggleTheme, isMobile }) {
  const theme = useTheme();

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        top: isMobile ? 'auto' : 0,
        bottom: isMobile ? 0 : 'auto',
        height: '64px',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <Toolbar>
        {!isMobile && (
          <>
            <AccountBalanceWalletIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Inside Wallet
            </Typography>
          </>
        )}

        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? 1 : 2, 
            flexGrow: 1,
            justifyContent: isMobile ? 'space-evenly' : 'flex-end' 
        }}>
          {isMobile ? (
            <>
              <IconButton color="inherit" component={RouterLink} to="/">
                <AccountBalanceWalletIcon />
              </IconButton>
              <IconButton color="inherit" component={RouterLink} to="/transactions">
                <ReceiptIcon />
              </IconButton>
              <IconButton color="inherit" component={RouterLink} to="/goals">
                <FlagIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/"
                startIcon={<AccountBalanceWalletIcon />}
              >
                Dashboard
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/transactions"
                startIcon={<ReceiptIcon />}
              >
                Transactions
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/goals"
                startIcon={<FlagIcon />}
              >
                Goals
              </Button>
            </>
          )}
        </Box>
        
        <IconButton 
            onClick={toggleTheme} 
            color="inherit"
            sx={{
              ml: 2,
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'rotate(30deg)',
              },
            }}
        >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 