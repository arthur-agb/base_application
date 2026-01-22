import React from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center'
        }}
      >
        <Typography variant="h1" color="primary">
          404
        </Typography>
        <Typography variant="h4" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" paragraph>
          The page you are looking for might have been removed, 
          had its name changed, or is temporarily unavailable.
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;