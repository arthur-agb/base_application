import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    CircularProgress,
    Divider,
    Chip,
    Stack,
    Tabs,
    Tab,
    InputAdornment,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    MdLink,
    MdLinkOff,
    MdPlayArrow,
    MdVisibility,
    MdVisibilityOff,
    MdVpnKey,
    MdCloud,
    MdSave,
    MdDelete,
    MdAdd
} from 'react-icons/md';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

// Local storage key for saved connections
const SAVED_CONNECTIONS_KEY = 'databricks_saved_connections';

const DatabricksConnect = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [searchParams, setSearchParams] = useSearchParams();

    // Theme-aware colors - matching CommercialForecast.jsx
    const colors = useMemo(() => ({
        background: isDarkMode ? '#0d1b2a' : '#FFFFFF',
        headerBackground: isDarkMode ? '#1b2838' : '#F4F5F7',
        rowBackground: isDarkMode ? '#0d1b2a' : '#FFFFFF',
        rowAltBackground: isDarkMode ? '#132536' : '#FAFBFC',
        rowHoverBackground: isDarkMode ? '#1e3a5f' : '#EBECF0',
        selectedBackground: isDarkMode
            ? 'rgba(0, 82, 204, 0.35)'
            : 'rgba(0, 82, 204, 0.12)',
        textPrimary: isDarkMode ? '#E8EAED' : '#172B4D',
        textSecondary: isDarkMode ? '#9AA5B1' : '#6B778C',
        headerText: isDarkMode ? '#FFFFFF' : '#172B4D',
        borderColor: isDarkMode ? '#234567' : '#DFE1E6',
        accentBackground: isDarkMode
            ? 'rgba(0, 82, 204, 0.3)'
            : 'rgba(0, 82, 204, 0.08)',
    }), [isDarkMode]);

    // Auth method tab
    const [authMethod, setAuthMethod] = useState(0); // 0 = PAT, 1 = SSO

    // Saved connections
    const [savedConnections, setSavedConnections] = useState([]);
    const [selectedConnectionId, setSelectedConnectionId] = useState('');
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [newConnectionName, setNewConnectionName] = useState('');

    // Connection form state
    const [formData, setFormData] = useState({
        host: '',
        httpPath: '',
        token: '',
        query: 'SELECT * FROM main.default.sales LIMIT 10'
    });

    // PAT visibility toggle
    const [showToken, setShowToken] = useState(false);

    // Connection status
    const [connectionStatus, setConnectionStatus] = useState({
        connected: false,
        host: null,
        method: null,
        loading: false
    });

    // Query execution state
    const [queryState, setQueryState] = useState({
        loading: false,
        result: null,
        error: null
    });

    // General notification
    const [notification, setNotification] = useState(null);

    // SSO loading state
    const [ssoLoading, setSsoLoading] = useState(false);

    // Load saved connections from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(SAVED_CONNECTIONS_KEY);
            if (saved) {
                setSavedConnections(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Failed to load saved connections:', error);
        }
    }, []);

    // Get auth token for API calls
    const getAuthHeaders = useCallback(() => ({
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    }), []);

    // Check SSO connection status on mount
    const checkSSOStatus = useCallback(async () => {
        try {
            const response = await axios.get('/api/databricks/oauth/status', {
                headers: getAuthHeaders()
            });
            if (response.data.connected) {
                setConnectionStatus({
                    connected: true,
                    host: response.data.host,
                    method: 'sso',
                    loading: false
                });
                setFormData(prev => ({
                    ...prev,
                    host: response.data.host,
                    httpPath: response.data.httpPath || prev.httpPath
                }));
                setAuthMethod(1);
            }
        } catch (error) {
            console.error('Failed to check SSO status:', error);
        }
    }, [getAuthHeaders]);

    // Handle URL parameters from OAuth callback
    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const host = searchParams.get('host');

        if (success === 'true') {
            setNotification({
                type: 'success',
                message: `Successfully connected to Databricks${host ? ` (${host})` : ''}`
            });
            setSearchParams({});
            checkSSOStatus();
        } else if (error) {
            setNotification({
                type: 'error',
                message: decodeURIComponent(error)
            });
            setSearchParams({});
        }
    }, [searchParams, setSearchParams, checkSSOStatus]);

    useEffect(() => {
        checkSSOStatus();
    }, [checkSSOStatus]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAuthMethodChange = (event, newValue) => {
        setAuthMethod(newValue);
        setNotification(null);
    };

    // Select a saved connection
    const handleSelectConnection = (connectionId) => {
        setSelectedConnectionId(connectionId);

        if (connectionId === '') {
            // Clear form for new connection
            setFormData(prev => ({
                ...prev,
                host: '',
                httpPath: '',
                token: ''
            }));
            return;
        }

        const connection = savedConnections.find(c => c.id === connectionId);
        if (connection) {
            setFormData(prev => ({
                ...prev,
                host: connection.host,
                httpPath: connection.httpPath,
                token: connection.token
            }));
            if (connection.authMethod !== undefined) {
                setAuthMethod(connection.authMethod);
            }
        }
    };

    // Save current connection (handles both new and overwrite)
    const handleSaveConnection = () => {
        if (!newConnectionName.trim()) {
            setNotification({
                type: 'error',
                message: 'Please enter a connection name'
            });
            return;
        }

        const connectionData = {
            name: newConnectionName.trim(),
            host: formData.host,
            httpPath: formData.httpPath,
            token: formData.token,
            authMethod,
            createdAt: new Date().toISOString()
        };

        let updatedConnections;
        let newId;

        // Check if we are updating the currently selected connection
        if (selectedConnectionId) {
            // If the name is the same, overwrite it. If changed, ask user (or just save as new which is safer/simpler UI for now)
            // Ideally we'd have a specific "Overwrite" button, but for this UI let's check:
            const existing = savedConnections.find(c => c.id === selectedConnectionId);

            if (existing && existing.name === newConnectionName.trim()) {
                // Overwrite existing
                updatedConnections = savedConnections.map(c =>
                    c.id === selectedConnectionId ? { ...c, ...connectionData, id: c.id } : c
                );
                newId = selectedConnectionId;
            } else {
                // Save as new (name changed or explicitly new)
                newId = Date.now().toString();
                updatedConnections = [...savedConnections, { ...connectionData, id: newId }];
            }
        } else {
            // New connection
            newId = Date.now().toString();
            updatedConnections = [...savedConnections, { ...connectionData, id: newId }];
        }

        setSavedConnections(updatedConnections);
        localStorage.setItem(SAVED_CONNECTIONS_KEY, JSON.stringify(updatedConnections));

        setSelectedConnectionId(newId);
        setNewConnectionName('');
        setSaveDialogOpen(false);

        setNotification({
            type: 'success',
            message: `Connection "${connectionData.name}" saved successfully`
        });
    };

    // Delete a saved connection
    const handleDeleteConnection = (connectionId) => {
        const updated = savedConnections.filter(c => c.id !== connectionId);
        setSavedConnections(updated);
        localStorage.setItem(SAVED_CONNECTIONS_KEY, JSON.stringify(updated));

        if (selectedConnectionId === connectionId) {
            setSelectedConnectionId('');
            setFormData(prev => ({
                ...prev,
                host: '',
                httpPath: '',
                token: ''
            }));
        }

        setNotification({
            type: 'info',
            message: 'Connection deleted'
        });
    };

    // Connect with PAT
    const handleConnectPAT = async () => {
        if (!formData.host || !formData.httpPath || !formData.token) {
            setNotification({
                type: 'error',
                message: 'Please enter Server Hostname, HTTP Path, and Personal Access Token'
            });
            return;
        }

        setConnectionStatus(prev => ({ ...prev, loading: true }));
        setNotification(null);

        try {
            const response = await axios.post('/api/databricks/test-connection', {
                host: formData.host,
                path: formData.httpPath,
                token: formData.token,
                query: 'SELECT 1 as test'
            }, {
                headers: getAuthHeaders()
            });

            if (response.data.status === 'success') {
                setConnectionStatus({
                    connected: true,
                    host: formData.host,
                    method: 'pat',
                    loading: false
                });
                setNotification({
                    type: 'success',
                    message: 'Successfully connected to Databricks'
                });
            }
        } catch (error) {
            console.error('PAT connection error:', error);
            setConnectionStatus(prev => ({ ...prev, loading: false }));
            setNotification({
                type: 'error',
                message: error.response?.data?.message || 'Failed to connect. Please check your credentials.'
            });
        }
    };

    // Initiate SSO authentication
    const handleConnectSSO = async () => {
        if (!formData.host || !formData.httpPath) {
            setNotification({
                type: 'error',
                message: 'Please enter both Server Hostname and HTTP Path'
            });
            return;
        }

        setSsoLoading(true);
        setNotification(null);

        try {
            const response = await axios.post('/api/databricks/oauth/initiate', {
                host: formData.host,
                httpPath: formData.httpPath
            }, {
                headers: getAuthHeaders()
            });

            if (response.data.authorizationUrl) {
                window.location.href = response.data.authorizationUrl;
            }
        } catch (error) {
            console.error('SSO initiation error:', error);
            setNotification({
                type: 'error',
                message: error.response?.data?.message || 'Failed to initiate SSO.'
            });
            setSsoLoading(false);
        }
    };

    // Disconnect
    const handleDisconnect = async () => {
        if (connectionStatus.method === 'sso') {
            try {
                await axios.post('/api/databricks/oauth/disconnect', {}, {
                    headers: getAuthHeaders()
                });
            } catch (error) {
                console.error('Disconnect error:', error);
            }
        }

        setConnectionStatus({
            connected: false,
            host: null,
            method: null,
            loading: false
        });
        setQueryState({ loading: false, result: null, error: null });
        setNotification({
            type: 'info',
            message: 'Disconnected from Databricks'
        });
    };

    // Execute query
    const handleExecuteQuery = async (e) => {
        e.preventDefault();

        if (!connectionStatus.connected) {
            setNotification({
                type: 'warning',
                message: 'Please connect to Databricks first'
            });
            return;
        }

        setQueryState({ loading: true, result: null, error: null });

        try {
            let response;

            if (connectionStatus.method === 'sso') {
                response = await axios.post('/api/databricks/oauth/query', {
                    query: formData.query
                }, {
                    headers: getAuthHeaders()
                });
            } else {
                response = await axios.post('/api/databricks/test-connection', {
                    host: formData.host,
                    path: formData.httpPath,
                    token: formData.token,
                    query: formData.query
                }, {
                    headers: getAuthHeaders()
                });
            }

            setQueryState({
                loading: false,
                result: response.data,
                error: null
            });
        } catch (error) {
            console.error('Query execution error:', error);

            if (error.response?.data?.requiresAuth) {
                setConnectionStatus({
                    connected: false,
                    host: null,
                    method: null,
                    loading: false
                });
                setNotification({
                    type: 'warning',
                    message: 'Session expired. Please reconnect.'
                });
            }

            setQueryState({
                loading: false,
                result: null,
                error: error.response?.data?.message || 'Failed to execute query'
            });
        }
    };

    // Table styles matching CommercialForecast
    const tableStyles = useMemo(() => ({
        '& .MuiTableHead-root': {
            backgroundColor: colors.headerBackground,
        },
        '& .MuiTableCell-head': {
            backgroundColor: colors.headerBackground,
            color: colors.headerText,
            fontWeight: 600,
            borderBottom: `2px solid ${colors.borderColor}`,
        },
        '& .MuiTableCell-body': {
            color: colors.textPrimary,
            borderBottom: `1px solid ${colors.borderColor}`,
        },
        '& .MuiTableRow-root:hover': {
            backgroundColor: colors.rowHoverBackground,
        },
        '& .MuiTableRow-root:nth-of-type(odd)': {
            backgroundColor: colors.rowAltBackground,
        },
    }), [colors]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'transparent',
                minHeight: 'calc(100vh - 120px)',
            }}
        >
            {/* Header */}
            <Box mb={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="h5" fontWeight="bold" color="text.primary">
                            Data Sources
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Connect to your Databricks SQL Warehouse to query real-time data.
                        </Typography>
                    </Box>

                    {connectionStatus.connected ? (
                        <Chip
                            icon={<MdLink />}
                            label={`Connected via ${connectionStatus.method === 'sso' ? 'SSO' : 'PAT'}`}
                            color="success"
                            variant="outlined"
                            onDelete={handleDisconnect}
                            deleteIcon={<MdLinkOff />}
                        />
                    ) : (
                        <Chip
                            icon={<MdLinkOff />}
                            label="Not Connected"
                            color="default"
                            variant="outlined"
                        />
                    )}
                </Stack>
            </Box>

            {/* Notification Alert */}
            {notification && (
                <Alert
                    severity={notification.type}
                    sx={{ mb: 3 }}
                    onClose={() => setNotification(null)}
                >
                    {notification.message}
                </Alert>
            )}

            {/* Saved Connections Section */}
            <Box
                sx={{
                    mb: 3,
                    p: 3,
                    backgroundColor: colors.background,
                    borderRadius: 2,
                    border: `1px solid ${colors.borderColor}`
                }}
            >
                <Typography variant="subtitle1" fontWeight="600" color="text.primary" mb={2}>
                    Saved Connections
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl sx={{ minWidth: 300 }} size="small">
                        <InputLabel>Select a saved connection</InputLabel>
                        <Select
                            value={selectedConnectionId}
                            label="Select a saved connection"
                            onChange={(e) => handleSelectConnection(e.target.value)}
                            disabled={connectionStatus.connected}
                        >
                            <MenuItem value="">
                                <em>New Connection</em>
                            </MenuItem>
                            {savedConnections.map((conn) => (
                                <MenuItem key={conn.id} value={conn.id}>
                                    {conn.name} ({conn.host})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedConnectionId && !connectionStatus.connected && (
                        <IconButton
                            color="error"
                            onClick={() => handleDeleteConnection(selectedConnectionId)}
                            title="Delete this connection"
                        >
                            <MdDelete />
                        </IconButton>
                    )}

                    {/* Save button only enabled when connected */}
                    {connectionStatus.connected && (
                        <Button
                            variant="outlined"
                            startIcon={<MdSave />}
                            onClick={() => {
                                // Pre-fill name if updating existing
                                if (selectedConnectionId) {
                                    const existing = savedConnections.find(c => c.id === selectedConnectionId);
                                    if (existing) setNewConnectionName(existing.name);
                                } else {
                                    setNewConnectionName('');
                                }
                                setSaveDialogOpen(true);
                            }}
                        >
                            {selectedConnectionId ? 'Update / Save New' : 'Save Connection'}
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* Auth Method Tabs */}
            {/* Note: Tabs are disabled when connected to prevent switching context while active */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={authMethod}
                    onChange={handleAuthMethodChange}
                >
                    <Tab
                        icon={<MdVpnKey />}
                        iconPosition="start"
                        label="Personal Access Token"
                        disabled={connectionStatus.connected}
                    />
                    <Tab
                        icon={<MdCloud />}
                        iconPosition="start"
                        label="SSO (Enterprise)"
                        disabled={connectionStatus.connected}
                    />
                </Tabs>
            </Box>

            {/* Connection Form */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    p: 3,
                    backgroundColor: colors.background,
                    borderRadius: 2,
                    border: `1px solid ${colors.borderColor}`
                }}
            >
                <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                    Connection Details
                </Typography>

                <TextField
                    fullWidth
                    label="Server Hostname"
                    name="host"
                    placeholder="adb-xxx.azuredatabricks.net"
                    value={formData.host}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled={connectionStatus.connected}
                    helperText="Your Databricks workspace hostname"
                    size="small"
                />

                <TextField
                    fullWidth
                    label="HTTP Path"
                    name="httpPath"
                    placeholder="/sql/1.0/warehouses/xxxxx"
                    value={formData.httpPath}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled={connectionStatus.connected}
                    helperText="SQL Warehouse HTTP path"
                    size="small"
                />

                {/* PAT-specific field */}
                {authMethod === 0 && !connectionStatus.connected && (
                    <TextField
                        fullWidth
                        label="Personal Access Token"
                        name="token"
                        type={showToken ? 'text' : 'password'}
                        placeholder="dapi..."
                        value={formData.token}
                        onChange={handleChange}
                        required
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        helperText="Your Databricks Personal Access Token"
                        size="small"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowToken(!showToken)}
                                        edge="end"
                                        size="small"
                                    >
                                        {showToken ? <MdVisibilityOff /> : <MdVisibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                )}

                {/* SSO info message */}
                {authMethod === 1 && !connectionStatus.connected && (
                    <Alert severity="info" sx={{ mt: -1 }}>
                        SSO authentication requires your Databricks workspace to have OAuth configured.
                    </Alert>
                )}

                {/* Connect Buttons */}
                {!connectionStatus.connected && (
                    <Stack direction="row" spacing={2}>
                        {authMethod === 0 ? (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleConnectPAT}
                                disabled={connectionStatus.loading || !formData.host || !formData.httpPath || !formData.token}
                                startIcon={connectionStatus.loading ? <CircularProgress size={20} color="inherit" /> : <MdLink />}
                            >
                                {connectionStatus.loading ? 'Connecting...' : 'Connect'}
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleConnectSSO}
                                disabled={ssoLoading || !formData.host || !formData.httpPath}
                                startIcon={ssoLoading ? <CircularProgress size={20} color="inherit" /> : <MdCloud />}
                            >
                                {ssoLoading ? 'Redirecting...' : 'Connect with SSO'}
                            </Button>
                        )}
                    </Stack>
                )}

                {/* Query Section - only when connected */}
                {connectionStatus.connected && (
                    <>
                        <Divider sx={{ my: 1 }} />

                        <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                            Query
                        </Typography>

                        <TextField
                            fullWidth
                            label="SQL Query"
                            name="query"
                            multiline
                            rows={4}
                            value={formData.query}
                            onChange={handleChange}
                            required
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            helperText="Enter a SQL query. A LIMIT clause will be added if not present."
                        />

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleExecuteQuery}
                            disabled={queryState.loading}
                            startIcon={queryState.loading ? <CircularProgress size={20} color="inherit" /> : <MdPlayArrow />}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            {queryState.loading ? 'Executing...' : 'Run Query'}
                        </Button>
                    </>
                )}
            </Box>

            {/* Query Error */}
            {queryState.error && (
                <Alert severity="error" sx={{ mt: 3 }}>
                    {queryState.error}
                </Alert>
            )}

            {/* Query Results */}
            {queryState.result && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom color="success.main" fontWeight="bold">
                        Query Results
                    </Typography>
                    <Box
                        sx={{
                            mb: 2,
                            p: 2,
                            backgroundColor: colors.accentBackground,
                            borderRadius: 1,
                            border: `1px solid ${colors.borderColor}`
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            QUERY EXECUTED:
                        </Typography>
                        <Typography variant="body2" component="code" sx={{ fontFamily: 'monospace', color: colors.textPrimary }}>
                            {queryState.result.queryUsed}
                        </Typography>
                    </Box>

                    <TableContainer
                        sx={{
                            border: `1px solid ${colors.borderColor}`,
                            borderRadius: 2,
                            backgroundColor: colors.background,
                            ...tableStyles
                        }}
                    >
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {queryState.result.results.columns.map((col, idx) => (
                                        <TableCell key={idx}>
                                            {col.toUpperCase()}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {queryState.result.results.data.map((row, rowIdx) => (
                                    <TableRow key={rowIdx}>
                                        {row.map((cell, cellIdx) => (
                                            <TableCell key={cellIdx}>
                                                {typeof cell === 'number' ? cell.toLocaleString() : (cell ?? '-')}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        Showing {queryState.result.results.data.length} rows
                    </Typography>
                </Box>
            )}

            {/* Save Connection Dialog */}
            <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
                <DialogTitle>Save Connection</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Connection Name"
                        fullWidth
                        variant="outlined"
                        value={newConnectionName}
                        onChange={(e) => setNewConnectionName(e.target.value)}
                        placeholder="e.g., Production Warehouse"
                        helperText="Enter a memorable name for this connection"
                    />
                    <Box sx={{ mt: 2, p: 2, backgroundColor: colors.rowAltBackground, borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            This will save:
                        </Typography>
                        <Typography variant="body2">Host: {formData.host}</Typography>
                        <Typography variant="body2">Path: {formData.httpPath}</Typography>
                        <Typography variant="body2">Token: ••••••••{formData.token.slice(-4)}</Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveConnection}
                        variant="contained"
                        disabled={!newConnectionName.trim()}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DatabricksConnect;
