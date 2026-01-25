// src/pages/admin/DataModeler.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    Stack,
    IconButton,
    Button,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import {
    MdSave,
    MdPlayArrow,
    MdClose,
    MdSync,
    MdWarning,
    MdCheckCircle
} from 'react-icons/md';
import axios from 'axios';
import ModelLibrarySidebar from '../../features/data-modeling/components/ModelLibrarySidebar';
import TableCatalogSidebar from '../../features/data-modeling/components/TableCatalogSidebar';
import ModelingCanvas from '../../features/data-modeling/components/ModelingCanvas';
import RelationshipEditor from '../../features/data-modeling/components/RelationshipEditor';

const DataModeler = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const canvasRef = useRef(null);

    // Core modeling state
    const [activeModel, setActiveModel] = useState(null);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);

    // Relationship Modal State
    const [relModalOpen, setRelModalOpen] = useState(false);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [availableNodes, setAvailableNodes] = useState([]); // Snapshot of nodes for the modal

    // Table Modal State
    const [tableModalOpen, setTableModalOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);

    // Sync & Conflict State
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncDialogOpen, setSyncDialogOpen] = useState(false);
    const [syncResults, setSyncResults] = useState([]); // { tableName, added: [], removed: [], matched: true }

    // Preview State
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewSql, setPreviewSql] = useState('');
    const [previewStage, setPreviewStage] = useState('initial'); // initial, validating, connecting, fetching, done, error
    const [loadingStages, setLoadingStages] = useState({
        validation: 'pending',
        connection: 'pending',
        execution: 'pending'
    });

    // Group Selection (Save Error Recovery)
    const [groups, setGroups] = useState([]);
    const [groupSelectOpen, setGroupSelectOpen] = useState(false);
    const [selectedGroupForSave, setSelectedGroupForSave] = useState('');
    const [refreshLibrary, setRefreshLibrary] = useState(0);
    const [validationErrors, setValidationErrors] = useState([]);

    // Styling constants
    const colors = {
        background: isDarkMode ? '#0d1b2a' : '#FFFFFF',
        sidebarBackground: isDarkMode ? '#112233' : '#F8F9FA',
        borderColor: isDarkMode ? '#234567' : '#DFE1E6',
        textPrimary: isDarkMode ? '#E8EAED' : '#172B4D',
    };

    const fetchGroups = async () => {
        try {
            const response = await axios.get('/api/data-modeling/groups', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setGroups(response.data);
        } catch (error) {
            console.error('Error fetching groups for save:', error);
        }
    };

    const performSave = async (modelToSave, targetGroupId) => {
        setIsSaving(true);
        const nodes = canvasRef.current.getNodes();
        const edges = canvasRef.current.getEdges();

        const payload = {
            id: modelToSave.id,
            groupId: targetGroupId,
            name: modelToSave.name || 'Untitled Model',
            connectionId: selectedConnection?.id,
            tables: nodes.map(n => ({
                id: n.id, // Frontend ID used for rel matching
                tableName: n.data.label,
                schema: n.data.schema,
                columns: n.data.columns,
                alias: n.data.alias,
                x: n.position.x,
                y: n.position.y
            })),
            relationships: edges.map(e => {
                // Serialize conditions if multiple exist, otherwise standard
                const isComplex = e.data?.conditions && e.data.conditions.length > 0;
                let fromCol = e.data?.fromColumn || 'id';
                let toCol = e.data?.toColumn || 'id';

                if (isComplex) {
                    // Store compressed JSON in fromColumn to avoid DB schema changes
                    // Format: __JSON__:[{...}]
                    fromCol = '__JSON__:' + JSON.stringify(e.data.conditions);
                    toCol = 'REQ_JSON_PARSING'; // Flag for validity
                }

                return {
                    fromTableId: e.source,
                    toTableId: e.target,
                    fromColumn: fromCol,
                    toColumn: toCol,
                    joinType: e.data?.joinType || 'LEFT',
                    cardinality: e.data?.cardinality || 'ONE_TO_MANY'
                };
            })
        };

        try {
            const response = await axios.post('/api/data-modeling/models/save', payload, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            // Update active model with saved ID and data
            setActiveModel(response.data.model);
            setRefreshLibrary(prev => prev + 1);
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save model: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveModel = async () => {
        if (!activeModel) return;

        const targetGroupId = activeModel.groupId || activeModel.group_id;

        if (!targetGroupId) {
            // Instead of erroring, prompt user to select a group
            if (groups.length === 0) await fetchGroups();
            setGroupSelectOpen(true);
            return;
        }

        performSave(activeModel, targetGroupId);
    };

    const handleConfirmGroupSelection = () => {
        if (!selectedGroupForSave) return;

        const updatedModel = { ...activeModel, groupId: selectedGroupForSave };
        setActiveModel(updatedModel);

        setGroupSelectOpen(false);
        performSave(updatedModel, selectedGroupForSave);
    };

    const handleEdgeClick = (edge) => {
        setSelectedEdge(edge);
        setAvailableNodes(canvasRef.current.getNodes());
        setRelModalOpen(true);
    };

    const handleNodeClick = (node) => {
        setSelectedNode(node);
        setTableModalOpen(true);
    };

    const updateTableConfig = (newData) => {
        canvasRef.current.setNodes(nds => nds.map(n =>
            n.id === selectedNode.id ? { ...n, data: { ...n.data, ...newData } } : n
        ));
        setTableModalOpen(false);
    };

    const updateRelationship = (newData) => {
        const edges = canvasRef.current.getEdges();
        const updatedEdges = edges.map(e =>
            e.id === selectedEdge.id ? { ...e, data: { ...e.data, ...newData } } : e
        );
        canvasRef.current.setEdges(updatedEdges);

        // Re-validate
        const m2m = updatedEdges.filter(e => e.data?.cardinality === 'MANY_TO_MANY');
        setValidationErrors(m2m.map(e => ({ id: e.id, type: 'MANY_TO_MANY' })));

        setRelModalOpen(false);
    };

    const handleDeleteRelationship = () => {
        if (!selectedEdge) return;
        canvasRef.current.setEdges(eds => {
            const filtered = eds.filter(e => e.id !== selectedEdge.id);
            // Re-validate
            const m2m = filtered.filter(e => e.data?.cardinality === 'MANY_TO_MANY');
            setValidationErrors(m2m.map(e => ({ id: e.id, type: 'MANY_TO_MANY' })));
            return filtered;
        });
        setRelModalOpen(false);
    };

    const handleNodeDelete = (nodeId) => {
        canvasRef.current.setNodes(nds => nds.filter(n => n.id !== nodeId));
        // ReactFlow handles edge cleanup automatically if we update state correctly
    };

    const fetchColumnsForNode = async (nodeId, connectionId, schema, label) => {
        if (!connectionId || !schema || !label) return;

        const attemptUpdate = async (retryCount = 0) => {
            const currentNodes = canvasRef.current.getNodes();
            const nodeExists = currentNodes.find(n => n.id === nodeId);

            if (!nodeExists && retryCount < 5) {
                setTimeout(() => attemptUpdate(retryCount + 1), 200);
                return;
            }
            if (!nodeExists) return;

            // Set loading
            canvasRef.current.setNodes(nds => nds.map(n =>
                n.id === nodeId ? {
                    ...n,
                    data: {
                        ...n.data,
                        loading: true,
                        onRefresh: () => fetchColumnsForNode(nodeId, connectionId, schema, label),
                        onEdit: () => handleNodeClick(n),
                        onDelete: () => handleNodeDelete(nodeId)
                    }
                } : n
            ));

            try {
                const response = await axios.get(`/api/databricks/columns?connectionId=${connectionId}&schemaName=${schema}&tableName=${label}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });

                canvasRef.current.setNodes(nds => nds.map(n =>
                    n.id === nodeId ? {
                        ...n,
                        data: {
                            ...n.data,
                            columns: response.data,
                            loading: false,
                            onRefresh: () => fetchColumnsForNode(nodeId, connectionId, schema, label),
                            onEdit: () => handleNodeClick(n),
                            onDelete: () => handleNodeDelete(nodeId)
                        }
                    } : n
                ));
            } catch (error) {
                console.error(`Failed to fetch columns for ${label}:`, error);
                canvasRef.current.setNodes(nds => nds.map(n =>
                    n.id === nodeId ? { ...n, data: { ...n.data, loading: false } } : n
                ));
            }
        };

        attemptUpdate();
    };

    const handleNodeAdd = async (newNode) => {
        const { connectionId, schema, label } = newNode.data;
        // Inject onDelete/onEdit immediately for visual consistency
        canvasRef.current.setNodes(nds => nds.map(n =>
            n.id === newNode.id ? {
                ...n,
                data: {
                    ...n.data,
                    onEdit: () => handleNodeClick(n),
                    onDelete: () => handleNodeDelete(newNode.id)
                }
            } : n
        ));
        fetchColumnsForNode(newNode.id, connectionId, schema, label);
    };

    const handleSyncModel = async () => {
        if (!selectedConnection || !canvasRef.current) return;

        setIsSyncing(true);
        const nodes = canvasRef.current.getNodes();
        const results = [];

        for (const node of nodes) {
            const { schema, label, columns: cachedColumns } = node.data;
            if (!schema || !label) continue;

            try {
                const response = await axios.get(`/api/databricks/columns?connectionId=${selectedConnection.id}&schemaName=${schema}&tableName=${label}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const liveColumns = response.data;
                const liveNames = liveColumns.map(c => c.name);
                const cachedNames = (cachedColumns || []).map(c => c.name || c);

                const added = liveNames.filter(name => !cachedNames.includes(name));
                const removed = cachedNames.filter(name => !liveNames.includes(name));

                results.push({
                    nodeId: node.id,
                    tableName: label,
                    added,
                    removed,
                    liveColumns,
                    matched: added.length === 0 && removed.length === 0
                });
            } catch (error) {
                console.error(`Sync failed for table ${label}:`, error);
            }
        }

        setSyncResults(results);
        setSyncDialogOpen(true);
        setIsSyncing(false);
    };

    const applySyncUpdates = () => {
        const nodes = canvasRef.current.getNodes();
        const updatedNodes = nodes.map(node => {
            const result = syncResults.find(r => r.nodeId === node.id);
            if (result) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        columns: result.liveColumns,
                        onRefresh: () => fetchColumnsForNode(node.id, selectedConnection.id, node.data.schema, node.data.label),
                        onDelete: () => handleNodeDelete(node.id)
                    }
                };
            }
            return node;
        });

        canvasRef.current.setNodes(updatedNodes);
        setSyncDialogOpen(false);
        setSyncResults([]);
    };

    const handleSelectModel = async (model) => {
        setActiveModel(model);
        if (!model?.id) {
            if (canvasRef.current) {
                canvasRef.current.setNodes([]);
                canvasRef.current.setEdges([]);
            }
            return;
        }

        setIsModelLoading(true);
        try {
            const response = await axios.get(`/api/data-modeling/models/${model.id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const fullModel = response.data;
            setActiveModel(fullModel); // Ensure we have the full object with groupId

            if (fullModel.connectionId) {
                setSelectedConnection(fullModel.connection);
            }

            // Map backend tables to ReactFlow nodes
            const loadedNodes = (fullModel.tables || []).map(t => ({
                id: t.id,
                type: 'tableNode',
                position: { x: t.x || 0, y: t.y || 0 },
                data: {
                    label: t.tableName,
                    alias: t.alias,
                    schema: t.schema,
                    connectionId: fullModel.connectionId,
                    columns: t.columns || [],
                    loading: false,
                    onRefresh: () => fetchColumnsForNode(t.id, fullModel.connectionId, t.schema, t.tableName),
                    onEdit: () => handleNodeClick({ id: t.id, data: { label: t.tableName, alias: t.alias } }),
                    onDelete: () => handleNodeDelete(t.id),
                    colors
                }
            }));

            // Map backend relationships to ReactFlow edges
            const loadedEdges = (fullModel.relationships || []).map(r => {
                const isComplex = r.fromColumn && r.fromColumn.startsWith('__JSON__:');
                let conditions = [];
                let displayFrom = r.fromColumn;
                let displayTo = r.toColumn;

                if (isComplex) {
                    try {
                        conditions = JSON.parse(r.fromColumn.substring(9));
                        if (conditions.length > 0) {
                            displayFrom = conditions[0].fromColumn;
                            displayTo = conditions[0].toColumn;
                        }
                    } catch (e) { console.error('Failed to parse join conditions', e); }
                }

                return {
                    id: r.id,
                    source: r.fromTableId,
                    target: r.toTableId,
                    type: 'smoothstep',
                    animated: true,
                    data: {
                        fromColumn: displayFrom,
                        toColumn: displayTo,
                        joinType: r.joinType,
                        cardinality: r.cardinality,
                        conditions: isComplex ? conditions : [{ id: 1, fromColumn: r.fromColumn, toColumn: r.toColumn }]
                    }
                };
            });

            if (canvasRef.current) {
                canvasRef.current.setNodes(loadedNodes);
                canvasRef.current.setEdges(loadedEdges);

                // Initial Validation Scan
                const m2m = loadedEdges.filter(e => e.data?.cardinality === 'MANY_TO_MANY');
                setValidationErrors(m2m.map(e => ({ id: e.id, type: 'MANY_TO_MANY' })));

                // Trigger background fetch for tables with missing columns
                loadedNodes.forEach(node => {
                    if (!node.data.columns || node.data.columns.length === 0) {
                        fetchColumnsForNode(node.id, node.data.connectionId, node.data.schema, node.data.label);
                    }
                });

                setTimeout(() => canvasRef.current.fitView(), 100);
            }
        } catch (error) {
            console.error('Failed to load model details:', error);
        } finally {
            setIsModelLoading(false);
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            height: 'calc(100vh - 110px)',
            backgroundColor: 'transparent',
            gap: 1
        }}>
            <ModelLibrarySidebar
                onSelectModel={handleSelectModel}
                activeModelId={activeModel?.id}
                colors={colors}
                refreshTrigger={refreshLibrary}
            />

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Paper elevation={0} sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    border: `1px solid ${colors.borderColor}`,
                    backgroundColor: colors.background,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Stack spacing={0.5} sx={{ flex: 1 }}>
                        <TextField
                            size="small"
                            variant="standard"
                            value={activeModel?.name || ''}
                            onChange={(e) => setActiveModel(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter Model Name..."
                            InputProps={{ disableUnderline: true, sx: { fontSize: '1rem', fontWeight: 700 } }}
                            sx={{ maxWidth: 400 }}
                        />
                        <Typography variant="caption" sx={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {selectedConnection ? (
                                <>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'success.main' }} />
                                    Connected to <strong>{selectedConnection.name}</strong>
                                </>
                            ) : (
                                <>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'warning.main' }} />
                                    No data source selected
                                </>
                            )}
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={isSyncing ? <CircularProgress size={16} /> : <MdSync />}
                            onClick={handleSyncModel}
                            disabled={isSyncing || !selectedConnection || !activeModel}
                            sx={{ textTransform: 'none', borderRadius: '20px' }}
                        >
                            Sync with Source
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={previewLoading ? <CircularProgress size={16} /> : <MdPlayArrow />}
                            onClick={async () => {
                                if (!selectedConnection) return alert('Please select a data source first.');

                                setPreviewData(null);
                                setPreviewSql('');
                                setPreviewLoading(true);
                                setPreviewOpen(true);
                                setPreviewStage('validating');
                                setLoadingStages({ validation: 'loading', connection: 'pending', execution: 'pending' });

                                const nodes = canvasRef.current.getNodes();
                                const edges = canvasRef.current.getEdges();

                                try {
                                    // 1. Cardinality Check (Pre-flight)
                                    const valResponse = await axios.post('/api/data-modeling/validate-model-cardinality', {
                                        connectionId: selectedConnection.id,
                                        tables: nodes.map(n => ({ id: n.id, tableName: n.data.label, schema: n.data.schema })),
                                        relationships: edges.map(e => ({
                                            id: e.id,
                                            fromTableId: e.source,
                                            toTableId: e.target,
                                            fromColumn: e.data?.conditions ? '__JSON__:' + JSON.stringify(e.data.conditions) : (e.data?.fromColumn || 'id')
                                        }))
                                    }, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

                                    setValidationErrors(valResponse.data.issues || []);
                                    setLoadingStages(prev => ({ ...prev, validation: 'success', connection: 'loading' }));
                                    setPreviewStage('connecting');

                                    // 2. Draft Execution
                                    const response = await axios.post('/api/data-modeling/models/execute-draft', {
                                        connectionId: selectedConnection.id,
                                        tables: nodes.map(n => ({
                                            id: n.id,
                                            tableName: n.data.label,
                                            schema: n.data.schema,
                                            alias: n.data.alias
                                        })),
                                        relationships: edges.map(e => {
                                            const isComplex = e.data?.conditions && e.data.conditions.length > 0;
                                            return {
                                                fromTableId: e.source,
                                                toTableId: e.target,
                                                fromColumn: isComplex ? '__JSON__:' + JSON.stringify(e.data.conditions) : (e.data?.fromColumn || 'id'),
                                                toColumn: isComplex ? 'REQ_JSON_PARSING' : (e.data?.toColumn || 'id'),
                                                joinType: e.data?.joinType || 'LEFT'
                                            };
                                        }),
                                        rowLimit: 50
                                    }, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

                                    setLoadingStages(prev => ({ ...prev, connection: 'success', execution: 'success' }));
                                    setPreviewStage('done');
                                    setPreviewData(response.data.results);
                                    setPreviewSql(response.data.sql);

                                } catch (error) {
                                    console.error('Preview failed', error);
                                    const errMsg = error.response?.data?.message || error.message;
                                    const errSql = error.response?.data?.sql;
                                    setPreviewSql(`${errSql ? `-- Generated SQL --\n${errSql}\n\n` : ''}-- Error executing query --\n${errMsg}`);
                                    setPreviewData(null);
                                    setPreviewStage('error');
                                    setLoadingStages(prev => ({
                                        validation: prev.validation === 'loading' ? 'error' : prev.validation,
                                        connection: prev.connection === 'loading' ? 'error' : prev.connection,
                                        execution: prev.execution === 'loading' ? 'error' : prev.execution
                                    }));
                                } finally {
                                    setPreviewLoading(false);
                                }
                            }}
                            sx={{ textTransform: 'none', borderRadius: '20px' }}
                            disabled={previewLoading || !selectedConnection}
                        >
                            Preview
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<MdSave />}
                            onClick={handleSaveModel}
                            disabled={isSaving || !activeModel}
                            sx={{
                                textTransform: 'none',
                                borderRadius: '20px',
                                backgroundColor: '#0052CC'
                            }}
                        >
                            {isSaving ? 'Saving...' : 'Save Model'}
                        </Button>
                    </Stack>
                </Paper>

                <Box sx={{ flex: 1, position: 'relative' }}>
                    {validationErrors.length > 0 && (
                        <Box sx={{
                            position: 'absolute',
                            top: 10, left: 10, right: 10,
                            zIndex: 100,
                            pointerEvents: 'none'
                        }}>
                            <Alert
                                severity="warning"
                                variant="filled"
                                sx={{
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                    pointerEvents: 'auto'
                                }}
                                action={
                                    <Button color="inherit" size="small" onClick={() => setValidationErrors([])}>
                                        Dismiss
                                    </Button>
                                }
                            >
                                <Typography variant="subtitle2" fontWeight="700">
                                    Validation Warning: {validationErrors.length} Many-to-Many Join(s) detected.
                                </Typography>
                                <Typography variant="caption">
                                    Problematic edges are highlighted in red. Many-to-Many joins can cause data duplicates.
                                    Consider using a bridge table to resolve.
                                </Typography>
                            </Alert>
                        </Box>
                    )}
                    {isModelLoading && (
                        <Box sx={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 10, bgcolor: 'rgba(255,255,255,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <CircularProgress size={40} />
                        </Box>
                    )}
                    <ModelingCanvas
                        ref={canvasRef}
                        model={activeModel}
                        colors={colors}
                        onEdgeClick={handleEdgeClick}
                        onNodeAdd={handleNodeAdd}
                        isModalOpen={relModalOpen || tableModalOpen || syncDialogOpen || groupSelectOpen || previewOpen}
                    />
                </Box>
            </Box>

            <TableCatalogSidebar
                onSelectConnection={setSelectedConnection}
                currentConnection={selectedConnection}
                colors={colors}
            />

            {/* Relationship Editor Modal */}
            <RelationshipEditor
                open={relModalOpen}
                onClose={() => setRelModalOpen(false)}
                onSave={updateRelationship}
                onDelete={handleDeleteRelationship}
                edge={selectedEdge}
                nodes={availableNodes}
                colors={colors}
                isDarkMode={isDarkMode}
                connectionId={selectedConnection?.id}
            />
            {/* Table Editor Modal */}
            <Dialog
                open={tableModalOpen}
                onClose={() => setTableModalOpen(false)}
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
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: colors.textPrimary }}>
                    Configure Table
                    <IconButton size="small" onClick={() => setTableModalOpen(false)} sx={{ color: colors.textPrimary }}><MdClose /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Table Name"
                            fullWidth
                            size="small"
                            value={selectedNode?.data?.label || ''}
                            disabled
                        />
                        <TextField
                            label="Alias"
                            fullWidth
                            size="small"
                            placeholder="e.g., cust"
                            value={selectedNode?.data?.alias || ''}
                            onChange={(e) => setSelectedNode({
                                ...selectedNode,
                                data: { ...selectedNode.data, alias: e.target.value }
                            })}
                        />
                        <Alert severity="info" sx={{ fontSize: '0.7rem' }}>
                            Aliases help avoid naming conflicts in complex joins.
                        </Alert>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        color="error"
                        size="small"
                        onClick={() => {
                            handleNodeDelete(selectedNode.id);
                            setTableModalOpen(false);
                        }}
                        sx={{ mr: 'auto', textTransform: 'none' }}
                    >
                        Delete Table
                    </Button>
                    <Button onClick={() => setTableModalOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => updateTableConfig({ alias: selectedNode.data.alias })}
                    >
                        Apply
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Sync Results Modal */}
            <Dialog
                open={syncDialogOpen}
                onClose={() => setSyncDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: colors.background,
                        backgroundImage: 'none',
                        border: `1px solid ${colors.borderColor}`
                    }
                }}
            >
                <DialogTitle sx={{ color: colors.textPrimary }}>Schema Sync Results</DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 1 }}>
                        {syncResults.map((res, idx) => (
                            <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, borderColor: res.matched ? 'success.main' : 'warning.main' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" fontWeight="bold">{res.tableName}</Typography>
                                    {res.matched ? (
                                        <Chip icon={<MdCheckCircle />} label="In Sync" color="success" size="small" variant="outlined" />
                                    ) : (
                                        <Chip icon={<MdWarning />} label="Modified" color="warning" size="small" variant="outlined" />
                                    )}
                                </Stack>

                                {res.added.length > 0 && (
                                    <Box mb={1}>
                                        <Typography variant="caption" color="success.main" display="block">Added Columns:</Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>{res.added.join(', ')}</Typography>
                                    </Box>
                                )}

                                {res.removed.length > 0 && (
                                    <Box>
                                        <Typography variant="caption" color="error.main" display="block">Removed Columns:</Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8, textDecoration: 'line-through' }}>{res.removed.join(', ')}</Typography>
                                    </Box>
                                )}
                            </Paper>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSyncDialogOpen(false)}>Ignore</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={applySyncUpdates}
                        disabled={syncResults.every(r => r.matched)}
                    >
                        Update Model Schema
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Group Selection Dialog (Save Error) */}
            <Dialog
                open={groupSelectOpen}
                onClose={() => setGroupSelectOpen(false)}
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
                <DialogTitle sx={{ color: colors.textPrimary }}>Select Model Location</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
                            This model is missing its parent group. Please select a folder to save it to.
                        </Alert>
                        <FormControl fullWidth size="small">
                            <InputLabel>Group Folder</InputLabel>
                            <Select
                                value={selectedGroupForSave}
                                label="Group Folder"
                                onChange={(e) => setSelectedGroupForSave(e.target.value)}
                            >
                                {groups.map(g => (
                                    <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setGroupSelectOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleConfirmGroupSelection}
                        variant="contained"
                        disabled={!selectedGroupForSave}
                        sx={{ backgroundColor: '#0052CC' }}
                    >
                        Save Model
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Preview Results Dialog */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: colors.background,
                        backgroundImage: 'none',
                        border: `1px solid ${colors.borderColor}`
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: colors.textPrimary, pb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="h6" component="div">Model Preview</Typography>
                        <Chip label="Limit 50" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', opacity: 0.7 }} />
                    </Stack>

                    <Stack direction="row" spacing={3} alignItems="center" sx={{ mr: 4 }}>
                        <LoadingStep label="Validation" status={loadingStages.validation} compact />
                        <LoadingStep label="Connection" status={loadingStages.connection} compact />
                        <LoadingStep label="Execution" status={loadingStages.execution} compact />
                        <IconButton size="small" onClick={() => setPreviewOpen(false)} sx={{ color: colors.textPrimary, ml: 1 }}><MdClose /></IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    {previewStage !== 'done' && previewStage !== 'error' ? (
                        <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box sx={{ position: 'relative', mb: 4 }}>
                                <CircularProgress size={80} thickness={2} sx={{ color: 'primary.main', opacity: 0.3 }} />
                                <CircularProgress
                                    size={80}
                                    thickness={4}
                                    sx={{
                                        position: 'absolute',
                                        left: 0,
                                        color: 'primary.main',
                                        strokeLinecap: 'round'
                                    }}
                                />
                            </Box>

                            <Typography variant="h6" fontWeight="600" gutterBottom>
                                {previewStage === 'validating' ? 'Performing Pre-flight Checks' :
                                    previewStage === 'connecting' ? 'Establishing Connection' :
                                        'Fetching Preview Data'}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                This may take a few seconds depending on your warehouse size.
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {/* Validation Warnings if any */}
                            {validationErrors.length > 0 && previewStage === 'done' && (
                                <Alert severity="warning" variant="outlined">
                                    <Typography variant="subtitle2" fontWeight="700">Explosion Warning</Typography>
                                    <Typography variant="caption">
                                        Data results below may be replicated due to {validationErrors.length} Many-to-Many joins.
                                    </Typography>
                                </Alert>
                            )}

                            {/* SQL Preview */}
                            <Paper variant="outlined" sx={{
                                p: 1.5,
                                bgcolor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
                                border: `1px solid ${colors.borderColor}`,
                                maxHeight: 250,
                                overflow: 'auto'
                            }}>
                                <Typography variant="caption" sx={{
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre-wrap',
                                    color: isDarkMode ? '#4fc3f7' : '#0052cc',
                                    lineHeight: 1.5
                                }}>
                                    {previewSql}
                                </Typography>
                            </Paper>

                            {/* Data Table */}
                            {previewData && (
                                <Box sx={{ overflowX: 'auto', border: `1px solid ${colors.borderColor}`, borderRadius: 1 }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '0.8rem',
                                        color: colors.textPrimary
                                    }}>
                                        <thead>
                                            <tr>
                                                {previewData.columns.map((col, i) => (
                                                    <th key={i} style={{
                                                        textAlign: 'left',
                                                        padding: '12px 10px',
                                                        borderBottom: `2px solid ${isDarkMode ? '#334455' : '#ddd'}`,
                                                        backgroundColor: isDarkMode ? '#1a2a3a' : '#fafafa',
                                                        position: 'sticky',
                                                        top: 0,
                                                        fontWeight: 700
                                                    }}>{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.data.map((row, i) => (
                                                <tr key={i} style={{
                                                    borderBottom: `1px solid ${isDarkMode ? '#223344' : '#eee'}`,
                                                    transition: 'background 0.2s',
                                                    '&:hover': { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }
                                                }}>
                                                    {row.map((cell, j) => (
                                                        <td key={j} style={{ padding: '10px 10px', opacity: 0.9 }}>{String(cell ?? '')}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Box>
                            )}
                            {!previewData && previewStage === 'error' && (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <MdWarning size={40} color={theme.palette.error.main} style={{ marginBottom: 16 }} />
                                    <Typography variant="body1" fontWeight="600" color="error">Execution Failed</Typography>
                                    <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.7 }}>
                                        Check the SQL log below for technical details.
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

// Sub-component for clean loading steps
const LoadingStep = ({ label, status, compact = false }) => (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: status === 'pending' ? 0.3 : 1 }}>
        {status === 'loading' && <CircularProgress size={compact ? 12 : 14} thickness={6} />}
        {status === 'success' && <MdCheckCircle color="#36B37E" size={compact ? 14 : 16} />}
        {status === 'error' && <MdWarning color="#FF5630" size={compact ? 14 : 16} />}
        {status === 'pending' && <Box sx={{ width: compact ? 12 : 16, height: compact ? 12 : 16, borderRadius: '50%', border: '2px solid #ccc' }} />}
        <Typography variant="caption" fontWeight={status === 'loading' ? '700' : '500'} sx={{ fontSize: compact ? '0.65rem' : 'inherit' }}>
            {label}
        </Typography>
    </Stack>
);
export default DataModeler;
