// src/features/data-modeling/components/TableCatalogSidebar.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    IconButton,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    TextField,
    InputAdornment,
    Stack,
    Collapse
} from '@mui/material';
import {
    MdStorage,
    MdSearch,
    MdTableChart,
    MdKeyboardArrowRight,
    MdExpandMore,
    MdChevronRight,
    MdFolder,
    MdCloud,
    MdAccountTree,
    MdOutlineSchema
} from 'react-icons/md';
import axios from 'axios';

const TableCatalogSidebar = ({ onSelectConnection, currentConnection, colors }) => {
    const [connections, setConnections] = useState([]);
    const [catalogs, setCatalogs] = useState({}); // { connectionId: [catalogs] }
    const [schemas, setSchemas] = useState({}); // { 'connectionId.catalog': [schemas] }
    const [tables, setTables] = useState({}); // { 'connectionId.catalog.schema': [tables] }

    const [loading, setLoading] = useState({}); // { 'nodeId': boolean }
    const [expanded, setExpanded] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch saved connections
    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const response = await axios.get('/api/databricks/connections', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setConnections(response.data);
                if (response.data.length > 0 && !currentConnection) {
                    onSelectConnection(response.data[0]);
                }
            } catch (error) {
                console.error('Error fetching connections:', error);
            }
        };
        fetchConnections();
    }, []);

    const toggleExpand = async (id, type, params) => {
        const newExpanded = new Set(expanded);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
            setExpanded(newExpanded);
            return;
        }

        newExpanded.add(id);
        setExpanded(newExpanded);

        // Fetch data if not already present
        if (type === 'catalog' && !catalogs[params.connectionId]) {
            await fetchCatalogs(params.connectionId);
        } else if (type === 'schema' && !schemas[`${params.connectionId}.${params.catalogName}`]) {
            await fetchSchemas(params.connectionId, params.catalogName);
        } else if (type === 'table' && !tables[`${params.connectionId}.${params.catalogName}.${params.schemaName}`]) {
            await fetchTables(params.connectionId, params.catalogName, params.schemaName);
        }
    };

    const fetchCatalogs = async (connectionId) => {
        setLoading(prev => ({ ...prev, [connectionId]: true }));
        try {
            const response = await axios.get(`/api/databricks/catalogs?connectionId=${connectionId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setCatalogs(prev => ({ ...prev, [connectionId]: response.data }));
        } catch (error) {
            console.error('Error fetching catalogs:', error);
        } finally {
            setLoading(prev => ({ ...prev, [connectionId]: false }));
        }
    };

    const fetchSchemas = async (connectionId, catalogName) => {
        const id = `${connectionId}.${catalogName}`;
        setLoading(prev => ({ ...prev, [id]: true }));
        try {
            const response = await axios.get(`/api/databricks/schemas?connectionId=${connectionId}&catalogName=${catalogName}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setSchemas(prev => ({ ...prev, [id]: response.data }));
        } catch (error) {
            console.error('Error fetching schemas:', error);
        } finally {
            setLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const fetchTables = async (connectionId, catalogName, schemaName) => {
        const id = `${connectionId}.${catalogName}.${schemaName}`;
        setLoading(prev => ({ ...prev, [id]: true }));
        try {
            const response = await axios.get(`/api/databricks/tables?connectionId=${connectionId}&catalogName=${catalogName}&schemaName=${schemaName}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setTables(prev => ({ ...prev, [id]: response.data }));
        } catch (error) {
            console.error('Error fetching tables:', error);
        } finally {
            setLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    // Fetch catalogs when connection changes
    useEffect(() => {
        if (currentConnection && !catalogs[currentConnection.id]) {
            fetchCatalogs(currentConnection.id);
        }
    }, [currentConnection]);

    const filteredTables = (schemaTables, query) => {
        return schemaTables.filter(t =>
            (t.TABLE_NAME || t.tableName || '').toLowerCase().includes(query.toLowerCase())
        );
    };
    const onDragStart = (event, nodeData) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
        event.dataTransfer.effectAllowed = 'move';

        const ghost = document.createElement('div');
        ghost.textContent = nodeData.label;
        ghost.style.cssText = `position:absolute; top:-1000px; left:-1000px; background:#0052CC; color:white; padding:8px 16px; border-radius:20px; font-size:12px; font-weight:600; box-shadow:0 4px 12px rgba(0, 82, 204, 0.4); z-index:9999; pointer-events:none;`;
        document.body.appendChild(ghost);
        event.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => document.body.removeChild(ghost), 0);
    };

    return (
        <Paper elevation={0} sx={{
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${colors.borderColor}`,
            backgroundColor: colors.sidebarBackground,
            borderRadius: '12px',
            overflow: 'hidden'
        }}>
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" mb={2}>Data Catalog</Typography>

                <FormControl fullWidth size="small" variant="outlined" sx={{ mb: 2 }}>
                    <InputLabel>DataSource</InputLabel>
                    <Select
                        value={currentConnection?.id || ''}
                        label="DataSource"
                        onChange={(e) => {
                            const conn = connections.find(c => c.id === e.target.value);
                            onSelectConnection(conn);
                            if (conn && !catalogs[conn.id]) fetchCatalogs(conn.id);
                        }}
                        sx={{ fontSize: '0.75rem' }}
                    >
                        {connections.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search tables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><MdSearch size={18} /></InputAdornment>,
                        sx: { fontSize: '0.75rem', borderRadius: '10px' }
                    }}
                />
            </Box>

            <Divider />

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <List sx={{ py: 0 }} dense>
                    {currentConnection && catalogs[currentConnection.id]?.map(catalog => (
                        <CatalogNode
                            key={catalog}
                            catalog={catalog}
                            connId={currentConnection.id}
                            expanded={expanded}
                            toggleExpand={toggleExpand}
                            schemas={schemas}
                            tables={tables}
                            loading={loading}
                            onDragStart={onDragStart}
                            searchQuery={searchQuery}
                        />
                    ))}
                    {!currentConnection && (
                        <Typography variant="caption" sx={{ display: 'block', p: 4, textAlign: 'center', opacity: 0.5 }}>
                            Select a data source to browse
                        </Typography>
                    )}
                </List>
            </Box>

            <Box sx={{ p: 1.5, backgroundColor: 'rgba(0,0,0,0.02)', borderTop: `1px solid ${colors.borderColor}` }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <MdCloud size={14} color="#4C9AFF" />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                        Drag tables to canvas
                    </Typography>
                </Stack>
            </Box>
        </Paper>
    );
};

const CatalogNode = ({ catalog, connId, expanded, toggleExpand, schemas, tables, loading, onDragStart, searchQuery }) => {
    const id = `${connId}.${catalog}`;
    const isExpanded = expanded.has(id);
    const catalogSchemas = schemas[id] || [];

    return (
        <>
            <ListItem button onClick={() => toggleExpand(id, 'schema', { connectionId: connId, catalogName: catalog })} sx={{ py: 0.5 }}>
                <IconButton size="small" sx={{ mr: 0.5, p: 0 }}>
                    {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
                </IconButton>
                <MdAccountTree style={{ marginRight: 8, color: '#0052CC', opacity: 0.7 }} />
                <ListItemText primary={catalog} primaryTypographyProps={{ variant: 'caption', fontWeight: 700, noWrap: true }} />
            </ListItem>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 2 }}>
                    {loading[id] ? <CircularProgress size={16} sx={{ m: 2 }} /> :
                        catalogSchemas.map(schema => (
                            <SchemaNode
                                key={schema}
                                catalog={catalog}
                                schema={schema}
                                connId={connId}
                                expanded={expanded}
                                toggleExpand={toggleExpand}
                                tables={tables}
                                loading={loading}
                                onDragStart={onDragStart}
                                searchQuery={searchQuery}
                            />
                        ))
                    }
                </List>
            </Collapse>
        </>
    );
};

const SchemaNode = ({ catalog, schema, connId, expanded, toggleExpand, tables, loading, onDragStart, searchQuery }) => {
    const id = `${connId}.${catalog}.${schema}`;
    const isExpanded = expanded.has(id);
    const schemaTables = tables[id] || [];

    const filteredTables = schemaTables.filter(t =>
        (t.TABLE_NAME || t.tableName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (searchQuery && filteredTables.length === 0) return null;

    return (
        <>
            <ListItem button onClick={() => toggleExpand(id, 'table', { connectionId: connId, catalogName: catalog, schemaName: schema })} sx={{ py: 0.5 }}>
                <IconButton size="small" sx={{ mr: 0.5, p: 0 }}>
                    {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
                </IconButton>
                <MdOutlineSchema style={{ marginRight: 8, color: '#36B37E', opacity: 0.7 }} />
                <ListItemText primary={schema} primaryTypographyProps={{ variant: 'caption', fontWeight: 600, noWrap: true }} />
            </ListItem>
            <Collapse in={isExpanded || (searchQuery !== '')} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 2 }}>
                    {loading[id] ? <CircularProgress size={16} sx={{ m: 2 }} /> :
                        filteredTables.map((table, idx) => {
                            const name = table.TABLE_NAME || table.tableName;
                            return (
                                <ListItem
                                    key={idx}
                                    button
                                    draggable
                                    onDragStart={(e) => onDragStart(e, {
                                        type: 'tableNode',
                                        label: name,
                                        schema: `${catalog}.${schema}`,
                                        connectionId: connId
                                    })}
                                    sx={{ py: 0.2, cursor: 'grab' }}
                                >
                                    <MdTableChart style={{ marginRight: 8, color: '#0052CC', fontSize: 14 }} />
                                    <ListItemText
                                        primary={name}
                                        primaryTypographyProps={{ variant: 'caption', fontSize: '0.7rem', noWrap: true }}
                                    />
                                </ListItem>
                            );
                        })
                    }
                </List>
            </Collapse>
        </>
    );
};

export default TableCatalogSidebar;
