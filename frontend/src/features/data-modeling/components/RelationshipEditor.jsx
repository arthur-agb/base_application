import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack,
    Box,
    Typography,
    Paper,
    Divider,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import { MdClose, MdAdd, MdDelete, MdSwapHoriz, MdWarning, MdSync, MdCheckCircle } from 'react-icons/md';

const RelationshipEditor = ({
    open,
    onClose,
    onSave,
    onDelete,
    edge,
    nodes,
    colors,
    isDarkMode,
    connectionId
}) => {
    const [joinType, setJoinType] = useState('LEFT');
    const [cardinality, setCardinality] = useState('ONE_TO_MANY');
    const [conditions, setConditions] = useState([]);
    const [isValidating, setIsValidating] = useState(false);
    const [validationResults, setValidationResults] = useState(null);

    const sourceNode = nodes.find(n => n.id === edge?.source);
    const targetNode = nodes.find(n => n.id === edge?.target);

    // Initialize state from edge data when modal opens
    useEffect(() => {
        if (edge && edge.data) {
            setJoinType(edge.data.joinType || 'LEFT');
            setCardinality(edge.data.cardinality || 'ONE_TO_MANY');

            if (edge.data.conditions && edge.data.conditions.length > 0) {
                setConditions(edge.data.conditions);
            } else {
                // Heuristic for guessing join columns
                const sourceCols = sourceNode?.data?.columns || [];
                const targetCols = targetNode?.data?.columns || [];
                const sourceName = sourceNode?.data?.label?.toLowerCase() || '';

                let guessedFrom = edge.data.fromColumn || '';
                let guessedTo = edge.data.toColumn || '';

                if (!guessedFrom && !guessedTo) {
                    // Look for common patterns
                    const pkCandidates = ['id', 'pk', `${sourceName}_id`];
                    const matchedFrom = sourceCols.find(c => pkCandidates.includes(c.name?.toLowerCase()));
                    const matchedTo = targetCols.find(c => pkCandidates.includes(c.name?.toLowerCase()));

                    if (matchedFrom) guessedFrom = matchedFrom.name;
                    if (matchedTo) guessedTo = matchedTo.name;

                    // Cross check: if source has 'id' and target has '[source]_id'
                    const sourceId = sourceCols.find(c => c.name?.toLowerCase() === 'id');
                    const targetRef = targetCols.find(c => c.name?.toLowerCase() === `${sourceName}_id`);
                    if (sourceId && targetRef) {
                        guessedFrom = sourceId.name;
                        guessedTo = targetRef.name;
                    }
                }

                setConditions([{
                    id: Date.now(),
                    fromColumn: guessedFrom,
                    toColumn: guessedTo
                }]);
            }
        }
    }, [edge, sourceNode, targetNode]);

    const handleAddCondition = () => {
        setConditions([...conditions, { id: Date.now(), fromColumn: '', toColumn: '' }]);
    };

    const handleRemoveCondition = (id) => {
        if (conditions.length === 1) return; // Prevent deleting the last one
        setConditions(conditions.filter(c => c.id !== id));
    };

    const updateCondition = (id, field, value) => {
        setConditions(conditions.map(c =>
            c.id === id ? { ...c, [field]: value } : c
        ));
    };

    const handleValidateCardinality = async () => {
        if (!connectionId || !sourceNode || !targetNode) return;
        const cleanConditions = conditions.filter(c => c.fromColumn && c.toColumn);
        if (cleanConditions.length === 0) return alert('Select join columns first');

        setIsValidating(true);
        try {
            const response = await axios.post('/api/data-modeling/validate-cardinality', {
                connectionId,
                sourceTable: { tableName: sourceNode.data.label, schema: sourceNode.data.schema },
                targetTable: { tableName: targetNode.data.label, schema: targetNode.data.schema },
                conditions: cleanConditions
            }, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            setCardinality(response.data.detectedCardinality);
            setValidationResults(response.data);
        } catch (error) {
            console.error('Validation failed', error);
            alert('Cardinality analysis failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsValidating(false);
        }
    };

    const handleSave = () => {
        const cleanConditions = conditions.filter(c => c.fromColumn && c.toColumn);
        if (cleanConditions.length === 0) {
            alert('Please configure at least one valid join condition.');
            return;
        }

        onSave({
            joinType,
            cardinality,
            conditions: cleanConditions,
            // Keep legacy fields populated with the first condition for backward compat if needed
            fromColumn: cleanConditions[0].fromColumn,
            toColumn: cleanConditions[0].toColumn
        });
    };

    if (!sourceNode || !targetNode) return null;

    const sourceCols = sourceNode.data?.columns || [];
    const targetCols = targetNode.data?.columns || [];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: colors?.background,
                    backgroundImage: 'none',
                    border: `1px solid ${colors?.borderColor}`
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, color: colors?.textPrimary }}>
                <Typography variant="h6" component="div">Edit Relationship</Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: colors?.textPrimary }}><MdClose /></IconButton>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {/* High Level Settings */}
                    <Stack direction="row" spacing={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Join Type</InputLabel>
                            <Select
                                value={joinType}
                                label="Join Type"
                                onChange={(e) => setJoinType(e.target.value)}
                            >
                                <MenuItem value="LEFT">Left Join</MenuItem>
                                <MenuItem value="RIGHT">Right Join</MenuItem>
                                <MenuItem value="INNER">Inner Join</MenuItem>
                                <MenuItem value="FULL">Full Outer Join</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                            <InputLabel>Cardinality</InputLabel>
                            <Select
                                value={cardinality}
                                label="Cardinality"
                                onChange={(e) => setCardinality(e.target.value)}
                            >
                                <MenuItem value="ONE_TO_ONE">One to One (1:1)</MenuItem>
                                <MenuItem value="ONE_TO_MANY">One to Many (1:N)</MenuItem>
                                <MenuItem value="MANY_TO_ONE">Many to One (N:1)</MenuItem>
                                <MenuItem value="MANY_TO_MANY">Many to Many (N:N)</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    {cardinality === 'MANY_TO_MANY' && (
                        <Alert
                            severity="warning"
                            variant="outlined"
                            icon={<MdWarning />}
                            sx={{
                                bgcolor: isDarkMode ? 'rgba(255, 152, 0, 0.05)' : 'rgba(255, 152, 0, 0.02)',
                                border: '1px dashed #FF9800'
                            }}
                        >
                            <Typography variant="body2" fontWeight="700" color="warning.main">
                                Potential Many-to-Many Join
                            </Typography>
                            <Typography variant="caption" display="block">
                                This relationship can lead to significant duplicate data and performance degradation.
                                It is highly recommended to use a junction table or bridge table to normalize this join.
                            </Typography>
                        </Alert>
                    )}

                    <Divider textAlign="left"><Typography variant="caption" color="text.secondary">JOIN CRITERIA</Typography></Divider>

                    {/* Join Logic Builder */}
                    <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
                        <Stack spacing={2}>
                            {conditions.map((condition, index) => (
                                <Stack key={condition.id} direction="row" spacing={1} alignItems="center">
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                                            {sourceNode.data.label} (Source)
                                        </Typography>
                                        <FormControl fullWidth size="small" sx={{ bgcolor: 'background.paper' }}>
                                            <Select
                                                value={sourceCols.some(c => c.name === condition.fromColumn) ? condition.fromColumn : ''}
                                                displayEmpty
                                                onChange={(e) => updateCondition(condition.id, 'fromColumn', e.target.value)}
                                            >
                                                <MenuItem value="" disabled>Select Column</MenuItem>
                                                {sourceCols.map(col => (
                                                    <MenuItem key={col.name} value={col.name}>{col.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box sx={{ pt: 2, color: 'text.secondary' }}>
                                        <MdSwapHoriz size={24} />
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                                            {targetNode.data.label} (Target)
                                        </Typography>
                                        <FormControl fullWidth size="small" sx={{ bgcolor: 'background.paper' }}>
                                            <Select
                                                value={targetCols.some(c => c.name === condition.toColumn) ? condition.toColumn : ''}
                                                displayEmpty
                                                onChange={(e) => updateCondition(condition.id, 'toColumn', e.target.value)}
                                            >
                                                <MenuItem value="" disabled>Select Column</MenuItem>
                                                {targetCols.map(col => (
                                                    <MenuItem key={col.name} value={col.name}>{col.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box sx={{ pt: 2 }}>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveCondition(condition.id)}
                                            disabled={conditions.length === 1}
                                        >
                                            <MdDelete />
                                        </IconButton>
                                    </Box>
                                </Stack>
                            ))}
                        </Stack>

                        <Button
                            startIcon={<MdAdd />}
                            size="small"
                            sx={{ mt: 2 }}
                            onClick={handleAddCondition}
                        >
                            Add Join Condition
                        </Button>
                    </Box>

                    {/* Cardinality Analysis Info */}
                    {validationResults && (
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9', borderRadius: 2 }}>
                            <Typography variant="caption" fontWeight="700" color="primary" display="block" gutterBottom>
                                CARDINALITY ANALYSIS RESULTS
                            </Typography>
                            <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
                                <Box>
                                    <Typography variant="caption" display="block" color="text.secondary">Source Table</Typography>
                                    <Typography variant="body2" sx={{ color: validationResults.source.isMany ? 'warning.main' : 'success.main', fontWeight: 600 }}>
                                        {validationResults.source.isMany ? 'Has Duplicates (Many)' : 'Unique Keys (One)'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                        {validationResults.source.distinctKeys} keys / {validationResults.source.totalRows} rows
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" display="block" color="text.secondary">Target Table</Typography>
                                    <Typography variant="body2" sx={{ color: validationResults.target.isMany ? 'warning.main' : 'success.main', fontWeight: 600 }}>
                                        {validationResults.target.isMany ? 'Has Duplicates (Many)' : 'Unique Keys (One)'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                        {validationResults.target.distinctKeys} keys / {validationResults.target.totalRows} rows
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" display="block" color="text.secondary">Detected Relationship</Typography>
                                    <Chip label={validationResults.detectedCardinality} size="small" color="primary" sx={{ mt: 0.5, fontWeight: 700 }} />
                                </Box>
                            </Stack>
                        </Paper>
                    )}

                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleValidateCardinality}
                        disabled={isValidating}
                        startIcon={isValidating ? <CircularProgress size={16} /> : <MdSync />}
                        sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                    >
                        {isValidating ? 'Analyzing Full Dataset...' : 'Analyze Cardinality (Full Scan)'}
                    </Button>

                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button color="error" onClick={onDelete}>Delete Relationship</Button>
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSave}>Apply Changes</Button>
            </DialogActions>
        </Dialog>
    );
};

export default RelationshipEditor;
