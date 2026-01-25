// src/features/data-modeling/components/ModelLibrarySidebar.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Collapse,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack
} from '@mui/material';
import {
    MdExpandMore,
    MdChevronRight,
    MdFolder,
    MdSchema,
    MdAdd,
    MdMoreVert,
    MdCreateNewFolder,
    MdDelete
} from 'react-icons/md';
import axios from 'axios';

const ModelLibrarySidebar = ({ onSelectModel, activeModelId, colors, refreshTrigger }) => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Global New Model State
    const [newModelDialogOpen, setNewModelDialogOpen] = useState(false);
    const [newModelName, setNewModelName] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('');

    const handleOpenNewModelDialog = (groupId = '') => {
        setSelectedGroupId(groupId);
        setNewModelName('');
        setNewModelDialogOpen(true);
    };

    const handleCreateModel = () => {
        if (!newModelName.trim() || !selectedGroupId) {
            alert('Please provide a name and select a group.');
            return;
        }
        onSelectModel({ groupId: selectedGroupId, name: newModelName });
        setNewModelDialogOpen(false);
    };

    const fetchGroups = async () => {
        try {
            const response = await axios.get('/api/data-modeling/groups', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setGroups(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching groups:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [refreshTrigger]);

    const toggleGroup = (groupId) => {
        const next = new Set(expandedGroups);
        if (next.has(groupId)) {
            next.delete(groupId);
        } else {
            next.add(groupId);
        }
        setExpandedGroups(next);
    };

    const handleDeleteGroup = async (e, groupId) => {
        e.stopPropagation();
        if (!window.confirm('Deleting this group will NOT delete the models inside, but they will become unorganized. Continue?')) return;

        try {
            await axios.delete(`/api/data-modeling/groups/${groupId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchGroups();
        } catch (error) {
            console.error('Error deleting group:', error);
            alert('Cannot delete group. Ensure it is empty first or contact support.');
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        try {
            await axios.post('/api/data-modeling/groups', { name: newGroupName }, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setNewGroupName('');
            setNewGroupDialogOpen(false);
            fetchGroups();
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    return (
        <Paper elevation={0} sx={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${colors.borderColor}`,
            backgroundColor: colors.sidebarBackground,
            borderRadius: '12px',
            overflow: 'hidden'
        }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight="700">Model Library</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => setNewGroupDialogOpen(true)} title="New Group">
                        <MdCreateNewFolder />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => handleOpenNewModelDialog()}
                        title="New Model"
                        sx={{ color: '#0052CC' }}
                    >
                        <MdAdd />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <List sx={{ pt: 0 }}>
                        {groups.map((group) => (
                            <React.Fragment key={group.id}>
                                <ListItem
                                    button
                                    onClick={() => toggleGroup(group.id)}
                                    sx={{ py: 1 }}
                                >
                                    <IconButton size="small" sx={{ mr: 1, p: 0 }}>
                                        {expandedGroups.has(group.id) ? <MdExpandMore /> : <MdChevronRight />}
                                    </IconButton>
                                    <MdFolder style={{ marginRight: 8, color: '#FFB800' }} />
                                    <ListItemText
                                        primary={group.name}
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: colors.textPrimary }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleDeleteGroup(e, group.id)}
                                        sx={{ opacity: 0.2, '&:hover': { opacity: 1, color: 'error.main' } }}
                                    >
                                        <MdDelete size={14} />
                                    </IconButton>
                                    <Typography variant="caption" sx={{ ml: 1, opacity: 0.5, color: colors.textPrimary }}>
                                        ({group._count?.models || 0})
                                    </Typography>
                                </ListItem>
                                <Collapse in={expandedGroups.has(group.id)} timeout="auto">
                                    <GroupModels
                                        groupId={group.id}
                                        onSelectModel={onSelectModel}
                                        activeModelId={activeModelId}
                                        onOpenNewModel={() => handleOpenNewModelDialog(group.id)}
                                        refreshTrigger={refreshTrigger}
                                    />
                                </Collapse>
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Box>

            {/* Create Group Dialog */}
            <Dialog
                open={newGroupDialogOpen}
                onClose={() => setNewGroupDialogOpen(false)}
                PaperProps={{
                    sx: {
                        backgroundColor: colors.background,
                        backgroundImage: 'none',
                        border: `1px solid ${colors.borderColor}`
                    }
                }}
            >
                <DialogTitle sx={{ color: colors.textPrimary }}>New Group</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Group Name"
                        fullWidth
                        variant="outlined"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="e.g., Sales Forecasting"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNewGroupDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateGroup} variant="contained" sx={{ backgroundColor: '#0052CC' }}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Model Dialog */}
            <Dialog
                open={newModelDialogOpen}
                onClose={() => setNewModelDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: colors.background,
                        backgroundImage: 'none',
                        border: `1px solid ${colors.borderColor}`
                    }
                }}
            >
                <DialogTitle sx={{ color: colors.textPrimary }}>New Data Model</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            autoFocus
                            label="Model Name"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={newModelName}
                            onChange={(e) => setNewModelName(e.target.value)}
                            placeholder="e.g., Customer Segmentation"
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Target Group</InputLabel>
                            <Select
                                value={selectedGroupId}
                                label="Target Group"
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                            >
                                {groups.map(g => (
                                    <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNewModelDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreateModel}
                        variant="contained"
                        sx={{ backgroundColor: '#0052CC' }}
                        disabled={!newModelName.trim() || !selectedGroupId}
                    >
                        Create Model
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

// Helper component to fetch models within a group
const GroupModels = ({ groupId, onSelectModel, activeModelId, onOpenNewModel, refreshTrigger }) => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchModels = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/data-modeling/groups/${groupId}/models`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setModels(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching models:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
    }, [groupId, refreshTrigger]);

    const handleDeleteModel = async (e, modelId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this model?')) return;

        try {
            await axios.delete(`/api/data-modeling/models/${modelId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchModels();
            if (activeModelId === modelId) {
                onSelectModel(null);
            }
        } catch (error) {
            console.error('Error deleting model:', error);
            alert('Failed to delete model');
        }
    };

    return (
        <List component="div" disablePadding>
            {loading ? (
                <ListItem sx={{ pl: 6 }}><Typography variant="caption">Loading...</Typography></ListItem>
            ) : models.length === 0 ? (
                <ListItem sx={{ pl: 6 }}><Typography variant="caption" sx={{ fontStyle: 'italic' }}>No models</Typography></ListItem>
            ) : (
                models.map((model) => (
                    <ListItem
                        button
                        key={model.id}
                        onClick={() => onSelectModel(model)}
                        selected={activeModelId === model.id}
                        secondaryAction={
                            <IconButton
                                edge="end"
                                size="small"
                                onClick={(e) => handleDeleteModel(e, model.id)}
                                sx={{ opacity: 0.3, '&:hover': { opacity: 1, color: 'error.main' } }}
                            >
                                <MdDelete size={14} />
                            </IconButton>
                        }
                        sx={{
                            pl: 6,
                            py: 0.5,
                            '&.Mui-selected': {
                                backgroundColor: 'rgba(0, 82, 204, 0.08)',
                                color: '#0052CC',
                                borderRight: '3px solid #0052CC'
                            }
                        }}
                    >
                        <MdSchema style={{ marginRight: 8, fontSize: 14 }} />
                        <ListItemText
                            primary={model.name}
                            primaryTypographyProps={{ variant: 'caption', fontWeight: 500 }}
                        />
                    </ListItem>
                ))
            )}
            <ListItem button sx={{ pl: 6, py: 0.5, color: '#0052CC' }} onClick={onOpenNewModel}>
                <MdAdd style={{ marginRight: 8, fontSize: 14 }} />
                <Typography variant="caption" fontWeight="600">New Model</Typography>
            </ListItem>
        </List>
    );
};

export default ModelLibrarySidebar;
