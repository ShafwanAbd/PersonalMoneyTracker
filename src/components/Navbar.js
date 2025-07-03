import React, { useEffect, useRef, useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FlagIcon from '@mui/icons-material/Flag';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

function Navbar({ mode, toggleTheme, isMobile }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(window.scrollY);

  useEffect(() => {
    if (isMobile) return; // Don't hide on mobile
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setVisible(false); // Scrolling down
      } else {
        setVisible(true); // Scrolling up
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        top: isMobile ? 'auto' : 0,
        bottom: isMobile ? 0 : 'auto',
        height: '64px',
        display: 'flex',
        justifyContent: 'center',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        transform: !isMobile && !visible ? 'translateY(-100%)' : 'translateY(0)',
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
            gap: 0, 
            flexGrow: 1,
            justifyContent: isMobile ? 'space-evenly' : 'flex-end',
            height: '100%'
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
                sx={{ height: '100%', minWidth: '120px' }}
              >
                Dashboard
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/transactions"
                sx={{ height: '100%', minWidth: '120px' }}
              >
                Transactions
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/goals"
                sx={{ height: '100%', minWidth: '120px' }}
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