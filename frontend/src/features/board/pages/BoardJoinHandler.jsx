import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import boardService from '../services/boardService';
import { fetchCurrentAuthUserProfile } from '../../users/slices/userSlice';
import { selectTenant } from '../../auth/slices/authSlice';

const BoardJoinHandler = () => {
    const { boardId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [status, setStatus] = useState('joining'); // joining, success, error
    const [error, setError] = useState('');

    useEffect(() => {
        const join = async () => {
            try {
                const response = await boardService.joinBoard(boardId);
                setStatus('success');

                // Refresh user profile and select the correct company
                // This is important because joining a board might add the user to a new company
                const profile = await dispatch(fetchCurrentAuthUserProfile()).unwrap();

                // If the user joined a board in a different company, we might need to switch context
                // For now, let's just wait a bit and redirect
                setTimeout(() => {
                    navigate(`/boards/${boardId}`);
                }, 2000);
            } catch (err) {
                console.error('Failed to join board:', err);
                setStatus('error');
                setError(err.message || 'Failed to join the board. The link might be invalid or expired.');
            }
        };

        if (boardId) {
            join();
        }
    }, [boardId, dispatch, navigate]);

    if (status === 'joining') {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" gap={2}>
                <CircularProgress />
                <Typography variant="h6">Joining board...</Typography>
            </Box>
        );
    }

    if (status === 'error') {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" gap={2}>
                <Typography variant="h5" color="error">Oops!</Typography>
                <Typography variant="body1">{error}</Typography>
                <Button variant="contained" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                </Button>
            </Box>
        );
    }

    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" gap={2}>
            <Typography variant="h5" color="primary">Success!</Typography>
            <Typography variant="body1">You have joined the board. Redirecting you now...</Typography>
        </Box>
    );
};

export default BoardJoinHandler;
