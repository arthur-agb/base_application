import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Typography,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Stack,
    Divider,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    Chip,
    CircularProgress
} from '@mui/material';
import {
    MdLock,
    MdHistory,
    MdTrendingUp,
    MdAttachMoney,
    MdPercent,
    MdClose,
    MdChevronRight,
    MdExpandMore,
    MdCloudDownload,
    MdTerminal,
    MdCheckCircle
} from 'react-icons/md';
import axios from 'axios';

// AG Grid Styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const CommercialForecast = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [scenario, setScenario] = useState('live_v1');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isLiveLoading, setIsLiveLoading] = useState(false);
    const [liveLogs, setLiveLogs] = useState([]);
    const [isLiveMode, setIsLiveMode] = useState(false);

    // Model Registry State
    const [registeredModels, setRegisteredModels] = useState([]);
    const [selectedModelId, setSelectedModelId] = useState('');

    // Manual expansion state
    const [expandedIds, setExpandedIds] = useState(new Set(['m', 'm_hs', 'm_hs_001', 'm_on', 'm_on_gl', 'w', 'w_ou', 'w_ou_099']));

    const toggleExpand = useCallback((id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Theme-aware colors
    const colors = useMemo(() => ({
        background: isDarkMode ? '#0d1b2a' : '#FFFFFF',
        headerBackground: isDarkMode ? '#1b2838' : '#F4F5F7',
        rowBackground: isDarkMode ? '#0d1b2a' : '#FFFFFF',
        rowAltBackground: isDarkMode ? '#132536' : '#FAFBFC',
        rowHoverBackground: isDarkMode ? '#1e3a5f' : '#EBECF0',
        selectedBackground: isDarkMode
            ? 'rgba(0, 82, 204, 0.35)'
            : 'rgba(0, 82, 204, 0.12)',
        lockedRowBackground: isDarkMode ? '#152535' : '#F4F5F7',
        textPrimary: isDarkMode ? '#E8EAED' : '#172B4D',
        textSecondary: isDarkMode ? '#9AA5B1' : '#6B778C',
        headerText: isDarkMode ? '#FFFFFF' : '#172B4D',
        borderColor: isDarkMode ? '#234567' : '#DFE1E6',
        accentBackground: isDarkMode
            ? 'rgba(0, 82, 204, 0.3)'
            : 'rgba(0, 82, 204, 0.08)',
        leverColor: isDarkMode ? '#4C9AFF' : '#0052CC',
    }), [isDarkMode]);

    const auditHistory = [
        { id: 1, user: 'Arthur', action: 'Updated Menswear ASP', from: '£22', to: '£24', impact: '+£50k', time: '10 mins ago' },
        { id: 2, user: 'Sarah', action: 'Locked Q1 Net Sales', from: 'Unlocked', to: 'Locked', impact: 'N/A', time: '1 hour ago' },
        { id: 3, user: 'System', action: 'Recalculated Z-Scores', from: '-', to: 'Done', impact: 'Low', time: '3 hours ago' },
    ];

    // Master list of all rows (groups and drivers)
    const masterData = useMemo(() => [
        // Menswear
        { id: 'm', label: 'Menswear', level: 0, isGroup: true },
        { id: 'm_hs', label: 'High Street', level: 1, parentId: 'm', isGroup: true },
        { id: 'm_hs_001', label: 'Store 001', level: 2, parentId: 'm_hs', isGroup: true },
        { id: 1, driver: 'Units', level: 3, parentId: 'm_hs_001', jan: 1200, feb: 1350, mar: 1400, seasonTotal: 3950, zScore: 1.1 },
        { id: 2, driver: 'ASP', level: 3, parentId: 'm_hs_001', jan: 55.00, feb: 55.00, mar: 55.00, seasonTotal: 55.00, zScore: 0.8 },
        { id: 3, driver: 'Returns %', level: 3, parentId: 'm_hs_001', jan: 12, feb: 12, mar: 15, seasonTotal: 13, zScore: 2.1 },
        { id: 4, driver: 'Net Sales', level: 3, parentId: 'm_hs_001', jan: 58080, feb: 65340, mar: 65450, seasonTotal: 188870, zScore: 1.2, locked: true },

        { id: 'm_on', label: 'Online', level: 1, parentId: 'm', isGroup: true },
        { id: 'm_on_gl', label: 'Global', level: 2, parentId: 'm_on', isGroup: true },
        { id: 5, driver: 'Units', level: 3, parentId: 'm_on_gl', jan: 5000, feb: 5200, mar: 5500, seasonTotal: 15700, zScore: 0.5 },
        { id: 6, driver: 'ASP', level: 3, parentId: 'm_on_gl', jan: 48.00, feb: 48.00, mar: 48.00, seasonTotal: 48.00, zScore: 0.3 },
        { id: 7, driver: 'Returns %', level: 3, parentId: 'm_on_gl', jan: 25, feb: 26, mar: 24, seasonTotal: 25, zScore: 1.5 },
        { id: 8, driver: 'Net Sales', level: 3, parentId: 'm_on_gl', jan: 180000, feb: 184896, mar: 200640, seasonTotal: 565536, zScore: 1.0, locked: true },

        // Womenswear
        { id: 'w', label: 'Womenswear', level: 0, isGroup: true },
        { id: 'w_ou', label: 'Outlet', level: 1, parentId: 'w', isGroup: true },
        { id: 'w_ou_099', label: 'Store 099', level: 2, parentId: 'w_ou', isGroup: true },
        { id: 9, driver: 'Units', level: 3, parentId: 'w_ou_099', jan: 800, feb: 850, mar: 900, seasonTotal: 2550, zScore: 0.9 },
        { id: 10, driver: 'ASP', level: 3, parentId: 'w_ou_099', jan: 32.00, feb: 32.00, mar: 32.00, seasonTotal: 32.00, zScore: 0.2 },
        { id: 11, driver: 'Returns %', level: 3, parentId: 'w_ou_099', jan: 8, feb: 8, mar: 9, seasonTotal: 8.3, zScore: 1.1 },
        { id: 12, driver: 'Net Sales', level: 3, parentId: 'w_ou_099', jan: 23552, feb: 25024, mar: 26208, seasonTotal: 74784, zScore: 1.0, locked: true },
    ], []);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                // Fetch groups first to get all models (simplification for POC)
                const groupsRes = await axios.get('/api/data-modeling/groups', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });

                let allModels = [];
                for (const group of groupsRes.data) {
                    const modelsRes = await axios.get(`/api/data-modeling/groups/${group.id}/models`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    allModels = [...allModels, ...modelsRes.data.map(m => ({ ...m, groupName: group.name }))];
                }
                setRegisteredModels(allModels);
            } catch (error) {
                console.error('Failed to fetch models for registry:', error);
            }
        };
        fetchModels();
    }, []);

    // State for the actual data being displayed
    const [gridData, setGridData] = useState(masterData);

    const handlePullLiveData = async () => {
        setIsLiveLoading(true);
        setLiveLogs([{ timestamp: new Date().toISOString(), message: 'Accessing Logic Brick Registry...' }]);

        try {
            let response;
            const addLog = (msg) => setLiveLogs(prev => [...prev, { timestamp: new Date().toISOString(), message: msg }]);

            if (selectedModelId) {
                // RUN DATA MODEL (Multi-table join)
                addLog('Executing Orchestrated Model...');
                response = await axios.get(`/api/data-modeling/models/${selectedModelId}/execute`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
            } else {
                // FALLBACK: Legacy single connection test
                const saved = localStorage.getItem('databricks_saved_connections');
                const conn = saved ? JSON.parse(saved)[0] : null;
                if (!conn) throw new Error('No connection found');

                response = await axios.post('/api/databricks/test-connection', {
                    host: conn.host,
                    path: conn.httpPath,
                    token: conn.token,
                    query: conn.query || 'SELECT * FROM main.default.sales LIMIT 5',
                    rowLimit: 10
                }, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
            }

            if (response.data.status === 'success' || response.data.results) {
                addLog('Data retrieval successful.');
                addLog('Applying Hierarchical Mapping...');

                // Dynamic Mapper Logic
                setTimeout(() => {
                    const freshData = [...gridData];
                    const liveResults = response.data.results;

                    if (liveResults?.data?.length > 0) {
                        // Find numeric columns for Units and ASP in the joined result
                        // In a real app, this would be based on model metadata
                        const firstRow = liveResults.data[0];
                        const numbers = firstRow.filter(cell => typeof cell === 'number');

                        // Update "Store 001" and "Global Online" as visual proof
                        const driversToUpdate = [1, 2, 5, 6, 9, 10]; // Units and ASP row IDs
                        driversToUpdate.forEach((id, idx) => {
                            const row = freshData.find(d => d.id === id);
                            if (row && numbers[idx % numbers.length] !== undefined) {
                                row.jan = numbers[idx % numbers.length] * (1 + Math.random() * 0.1);
                                row.seasonTotal = row.jan + row.feb + row.mar;
                            }
                        });
                    }

                    setGridData(freshData);
                    setIsLiveMode(true);
                    setTimeout(() => setIsLiveLoading(false), 1000);
                }, 2000);
            }
        } catch (error) {
            console.error('Live pull failed:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Execution failed';
            setLiveLogs(prev => [...prev, { timestamp: new Date().toISOString(), message: `Error: ${errorMsg}` }]);
            setTimeout(() => setIsLiveLoading(false), 4000);
        }
    };

    // Filtered data based on expansion state
    const visibleData = useMemo(() => {
        const result = [];
        const process = (parentId = null) => {
            const children = gridData.filter(d => d.parentId === parentId || (parentId === null && d.level === 0));
            children.forEach(child => {
                result.push(child);
                if (child.isGroup && expandedIds.has(child.id)) {
                    process(child.id);
                }
            });
        };
        process();
        return result;
    }, [gridData, expandedIds]);

    const HierarchyCellRenderer = (params) => {
        const { data } = params;
        if (!data) return null;

        const paddingLeft = data.level * 24;
        const isExpanded = expandedIds.has(data.id);

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', pl: `${paddingLeft}px`, height: '100%' }}>
                {data.isGroup ? (
                    <IconButton
                        size="small"
                        onClick={() => toggleExpand(data.id)}
                        sx={{ p: 0.5, mr: 0.5, color: colors.textSecondary }}
                    >
                        {isExpanded ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
                    </IconButton>
                ) : (
                    <Box sx={{ width: 28 }} />
                )}
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: data.isGroup ? 700 : 400,
                        color: data.isGroup ? colors.textPrimary : colors.textSecondary,
                        fontSize: data.isGroup ? '0.875rem' : '0.8rem'
                    }}
                >
                    {data.isGroup ? data.label : data.driver}
                </Typography>
            </Box>
        );
    };

    const columnDefs = useMemo(() => [
        {
            headerName: 'Hierarchy / Driver',
            field: 'id',
            pinned: 'left',
            width: 300,
            cellRenderer: HierarchyCellRenderer,
            cellStyle: params => ({
                backgroundColor: params.data?.isGroup ? (isDarkMode ? '#132536' : '#FAFBFC') : 'transparent',
                borderRight: `1px solid ${colors.borderColor}`
            })
        },
        {
            field: 'jan',
            headerName: 'Jan',
            editable: params => !params.data?.locked && !params.data?.isGroup,
            valueFormatter: params => {
                if (params.data?.isGroup) return '';
                const driver = params.data?.driver;
                if (driver === 'Units') return params.value?.toLocaleString();
                if (driver === 'Returns %') return `${params.value}%`;
                return `£${params.value?.toLocaleString()}`;
            },
            cellStyle: params => ({
                color: params.data?.driver === 'Returns %' ? colors.leverColor : colors.textPrimary,
                backgroundColor: params.data?.isGroup ? (isDarkMode ? '#132536' : '#FAFBFC') : (params.data?.locked ? colors.lockedRowBackground : 'transparent'),
                textAlign: 'right'
            })
        },
        {
            field: 'feb',
            headerName: 'Feb',
            editable: params => !params.data?.locked && !params.data?.isGroup,
            valueFormatter: params => {
                if (params.data?.isGroup) return '';
                const driver = params.data?.driver;
                if (driver === 'Units') return params.value?.toLocaleString();
                if (driver === 'Returns %') return `${params.value}%`;
                return `£${params.value?.toLocaleString()}`;
            },
            cellStyle: params => ({
                color: params.data?.driver === 'Returns %' ? colors.leverColor : colors.textPrimary,
                backgroundColor: params.data?.isGroup ? (isDarkMode ? '#132536' : '#FAFBFC') : (params.data?.locked ? colors.lockedRowBackground : 'transparent'),
                textAlign: 'right'
            })
        },
        {
            field: 'mar',
            headerName: 'Mar',
            editable: params => !params.data?.locked && !params.data?.isGroup,
            valueFormatter: params => {
                if (params.data?.isGroup) return '';
                const driver = params.data?.driver;
                if (driver === 'Units') return params.value?.toLocaleString();
                if (driver === 'Returns %') return `${params.value}%`;
                return `£${params.value?.toLocaleString()}`;
            },
            cellStyle: params => ({
                color: params.data?.driver === 'Returns %' ? colors.leverColor : colors.textPrimary,
                backgroundColor: params.data?.isGroup ? (isDarkMode ? '#132536' : '#FAFBFC') : (params.data?.locked ? colors.lockedRowBackground : 'transparent'),
                textAlign: 'right'
            })
        },
        {
            field: 'seasonTotal',
            headerName: 'Season Total',
            cellStyle: params => ({
                backgroundColor: params.data?.isGroup ? (isDarkMode ? '#132536' : '#FAFBFC') : colors.accentBackground,
                fontWeight: '700',
                color: colors.textPrimary,
                textAlign: 'right'
            }),
            cellRenderer: params => {
                if (params.data?.isGroup) return null;
                return (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        height: '100%',
                        justifyContent: 'flex-end',
                        pr: 1
                    }}>
                        <span>
                            {params.data?.driver === 'Units' ? params.value?.toLocaleString() :
                                params.data?.driver === 'Returns %' ? `${params.value}%` :
                                    `£${params.value?.toLocaleString()}`}
                        </span>
                        <MdLock
                            size={14}
                            style={{
                                opacity: 0.6,
                                color: colors.textSecondary,
                                marginLeft: '4px'
                            }}
                            title="Season Total Locked"
                        />
                    </Box>
                );
            }
        },
        {
            field: 'zScore',
            headerName: 'Z-Score',
            width: 100,
            cellStyle: params => {
                if (params.data?.isGroup) return { backgroundColor: isDarkMode ? '#132536' : '#FAFBFC' };
                if (params.value > 2.0) {
                    return {
                        color: theme.palette.error.main,
                        fontWeight: 'bold',
                        backgroundColor: isDarkMode ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)',
                        textAlign: 'center'
                    };
                }
                return { color: colors.textPrimary, textAlign: 'center' };
            },
            valueFormatter: params => params.data?.isGroup ? '' : params.value
        }
    ], [theme, colors, isDarkMode, expandedIds]);

    const defaultColDef = useMemo(() => ({
        flex: 1,
        minWidth: 100,
        resizable: true,
        sortable: params => !params.data?.isGroup,
        filter: true,
    }), []);

    // Comprehensive AG Grid styling that works in both light and dark modes
    const gridContainerStyles = useMemo(() => ({
        // AG Grid CSS Variables - these provide the base theme
        '--ag-background-color': colors.background,
        '--ag-foreground-color': colors.textPrimary,
        '--ag-header-background-color': colors.headerBackground,
        '--ag-header-foreground-color': colors.headerText,
        '--ag-row-border-color': colors.borderColor,
        '--ag-border-color': colors.borderColor,
        '--ag-secondary-border-color': colors.borderColor,
        '--ag-row-hover-color': colors.rowHoverBackground,
        '--ag-selected-row-background-color': colors.selectedBackground,
        '--ag-odd-row-background-color': colors.rowBackground,
        '--ag-header-column-separator-display': 'block',
        '--ag-header-column-separator-color': colors.borderColor,
        '--ag-header-column-separator-height': '50%',
        '--ag-cell-horizontal-border': `1px solid ${colors.borderColor}`,
        '--ag-input-focus-border-color': theme.palette.primary.main,

        // Direct CSS overrides for complete control
        '& .ag-root-wrapper': {
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: colors.background,
        },
        '& .ag-header': {
            backgroundColor: colors.headerBackground,
            borderBottom: `2px solid ${colors.borderColor}`,
        },
        '& .ag-header-cell': {
            backgroundColor: colors.headerBackground,
            color: colors.headerText,
            fontWeight: 600,
            fontSize: '0.875rem',
        },
        '& .ag-header-cell-label': {
            color: colors.headerText,
        },
        '& .ag-header-cell-text': {
            color: colors.headerText,
        },
        '& .ag-row': {
            backgroundColor: colors.rowBackground,
            color: colors.textPrimary,
            borderBottom: `1px solid ${colors.borderColor}`,
        },
        '& .ag-row-odd': {
            backgroundColor: colors.rowBackground,
        },
        '& .ag-row:hover': {
            backgroundColor: colors.rowHoverBackground,
        },
        '& .ag-row-selected': {
            backgroundColor: `${colors.selectedBackground} !important`,
        },
        '& .ag-cell': {
            color: colors.textPrimary,
            borderRight: `1px solid ${colors.borderColor}`,
            display: 'flex',
            alignItems: 'center',
        },
        '& .ag-cell:last-child': {
            borderRight: 'none',
        },
        '& .ag-cell-value': {
            color: colors.textPrimary,
        },
        '& .ag-body-viewport': {
            backgroundColor: colors.background,
        },
        '& .ag-center-cols-viewport': {
            backgroundColor: colors.background,
        },
        '& .ag-pinned-left-cols-container': {
            backgroundColor: colors.background,
        },
        '& .ag-pinned-left-header': {
            backgroundColor: colors.headerBackground,
        },
        // Filter popup styling
        '& .ag-popup': {
            backgroundColor: colors.background,
            color: colors.textPrimary,
        },
        '& .ag-filter': {
            backgroundColor: colors.background,
            color: colors.textPrimary,
        },
        '& .ag-filter-toolpanel-header': {
            backgroundColor: colors.headerBackground,
            color: colors.headerText,
        },
        '& .ag-input-field-input': {
            backgroundColor: colors.background,
            color: colors.textPrimary,
            border: `1px solid ${colors.borderColor}`,
        },
        // Menu styling
        '& .ag-menu': {
            backgroundColor: colors.background,
            color: colors.textPrimary,
            border: `1px solid ${colors.borderColor}`,
        },
        '& .ag-menu-option-active': {
            backgroundColor: colors.rowHoverBackground,
        },
    }), [colors, theme]);

    // Inject global styles for AG Grid popups (they render at document body level)
    useEffect(() => {
        const styleId = 'ag-grid-popup-theme-styles';
        let styleElement = document.getElementById(styleId);

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = `
            /* AG Grid Popup/Filter Styling - injected dynamically for theme support */
            .ag-popup-child,
            .ag-menu,
            .ag-filter {
                background-color: ${colors.background} !important;
                color: ${colors.textPrimary} !important;
                border: 1px solid ${colors.borderColor} !important;
                border-radius: 6px !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
            }

            .ag-menu-header {
                background-color: ${colors.headerBackground} !important;
                color: ${colors.headerText} !important;
                border-bottom: 1px solid ${colors.borderColor} !important;
            }

            .ag-menu-option {
                color: ${colors.textPrimary} !important;
            }

            .ag-menu-option-active,
            .ag-menu-option:hover {
                background-color: ${colors.rowHoverBackground} !important;
            }

            .ag-menu-option-icon {
                color: ${colors.textSecondary} !important;
            }

            .ag-filter-wrapper {
                background-color: ${colors.background} !important;
            }

            .ag-filter-body-wrapper {
                background-color: ${colors.background} !important;
                padding: 8px !important;
            }

            .ag-filter-condition {
                background-color: ${colors.background} !important;
            }

            .ag-input-field-input,
            .ag-text-field-input,
            .ag-select .ag-picker-field-wrapper {
                background-color: ${colors.rowAltBackground} !important;
                color: ${colors.textPrimary} !important;
                border: 1px solid ${colors.borderColor} !important;
                border-radius: 4px !important;
            }

            .ag-input-field-input:focus,
            .ag-text-field-input:focus {
                border-color: ${theme.palette.primary.main} !important;
                outline: none !important;
            }

            .ag-select-list {
                background-color: ${colors.background} !important;
                border: 1px solid ${colors.borderColor} !important;
            }

            .ag-select-list-item {
                color: ${colors.textPrimary} !important;
            }

            .ag-select-list-item:hover,
            .ag-select-list-item.ag-active-item {
                background-color: ${colors.rowHoverBackground} !important;
            }

            .ag-filter-apply-panel {
                border-top: 1px solid ${colors.borderColor} !important;
                padding: 8px !important;
            }

            .ag-filter-apply-panel-button {
                background-color: ${theme.palette.primary.main} !important;
                color: #FFFFFF !important;
                border: none !important;
                border-radius: 4px !important;
                padding: 6px 12px !important;
                cursor: pointer !important;
            }

            .ag-filter-apply-panel-button:hover {
                background-color: ${theme.palette.primary.dark || '#003d99'} !important;
            }

            .ag-icon {
                color: ${colors.textSecondary} !important;
            }

            .ag-tab {
                color: ${colors.textSecondary} !important;
            }

            .ag-tab-selected {
                color: ${theme.palette.primary.main} !important;
                border-bottom-color: ${theme.palette.primary.main} !important;
            }

            .ag-mini-filter {
                background-color: ${colors.background} !important;
            }

            .ag-set-filter-list {
                background-color: ${colors.background} !important;
            }

            .ag-virtual-list-item {
                color: ${colors.textPrimary} !important;
            }

            .ag-checkbox-input-wrapper::after {
                color: ${theme.palette.primary.main} !important;
            }
        `;

        return () => {
            // Cleanup on unmount
            const el = document.getElementById(styleId);
            if (el) {
                el.remove();
            }
        };
    }, [colors, theme, isDarkMode]);

    const onCellValueChanged = (params) => {
        const { node, data, colDef, newValue, oldValue } = params;
        if (newValue === oldValue) return;
        console.log(`Cell value changed in ${colDef.field} from ${oldValue} to ${newValue}`);
    };

    return (
        <Box
            sx={{
                height: 'calc(100vh - 110px)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'transparent',
                gap: 2
            }}
        >
            {/* Global Context Bar */}
            <Paper elevation={0} sx={{
                p: 2,
                borderRadius: '12px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.borderColor}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Stack direction="row" spacing={3} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel id="scenario-select-label" sx={{ color: colors.textSecondary }}>Scenario</InputLabel>
                        <Select
                            labelId="scenario-select-label"
                            value={scenario}
                            label="Scenario"
                            onChange={(e) => setScenario(e.target.value)}
                            sx={{
                                color: colors.textPrimary,
                                '.MuiOutlinedInput-notchedOutline': { borderColor: colors.borderColor },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main }
                            }}
                        >
                            <MenuItem value="live_v1">[ LIVE v1 ]</MenuItem>
                            <MenuItem value="arthur_sandbox">[ Arthur's Sandbox ]</MenuItem>
                            <MenuItem value="budget_2026">[ Budget 2026 ]</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel id="model-select-label" sx={{ color: colors.textSecondary }}>Data Model</InputLabel>
                        <Select
                            labelId="model-select-label"
                            value={selectedModelId}
                            label="Data Model"
                            onChange={(e) => setSelectedModelId(e.target.value)}
                            sx={{
                                color: colors.textPrimary,
                                '.MuiOutlinedInput-notchedOutline': { borderColor: colors.borderColor },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main }
                            }}
                        >
                            <MenuItem value="">[ AD-HOC (Legacy) ]</MenuItem>
                            {registeredModels.map(m => (
                                <MenuItem key={m.id} value={m.id}>{`[ ${m.groupName} ] ${m.name}`}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Divider orientation="vertical" flexItem />

                    <Stack direction="row" spacing={4}>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <MdAttachMoney size={12} /> Total Sales
                            </Typography>
                            <Typography variant="subtitle2" fontWeight="700" color="text.primary">
                                £45.2m
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <MdTrendingUp size={12} /> Net Margin
                            </Typography>
                            <Typography variant="subtitle2" fontWeight="700" color="success.main">
                                £12.1m
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <MdPercent size={12} /> Var to Budget
                            </Typography>
                            <Typography variant="subtitle2" fontWeight="700" color="error.main">
                                -1.2%
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    {isLiveMode ? (
                        <Chip
                            icon={<MdCheckCircle />}
                            label="GOLD LAYER ACTIVE"
                            color="success"
                            variant="filled"
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                        />
                    ) : (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={isLiveLoading ? <MdTerminal /> : <MdCloudDownload />}
                            onClick={handlePullLiveData}
                            disabled={isLiveLoading}
                            sx={{
                                borderRadius: '20px',
                                textTransform: 'none',
                                px: 2,
                                backgroundColor: isDarkMode ? '#0052CC' : '#0052CC',
                                '&:hover': { backgroundColor: '#0747A6' }
                            }}
                        >
                            {isLiveLoading ? 'Connecting...' : 'Pull Live Data'}
                        </Button>
                    )}

                    <Button
                        variant="outlined"
                        startIcon={<MdHistory />}
                        onClick={() => setIsHistoryOpen(true)}
                        sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            borderColor: colors.borderColor,
                            color: colors.textPrimary,
                            '&:hover': {
                                backgroundColor: colors.rowHoverBackground,
                                borderColor: theme.palette.primary.main
                            }
                        }}
                    >
                        View History
                    </Button>
                </Stack>
            </Paper>

            <Box mb={1}>
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                    Commercial Planning Cockpit
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    "Excel interface with Supercomputer intelligence." Handle hierarchies and drivers with native phasing (Community Edition).
                </Typography>
            </Box>

            <Box
                flex={1}
                className={isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}
                sx={gridContainerStyles}
            >
                <AgGridReact
                    rowData={visibleData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    animateRows={true}
                    suppressDragLeaveHidesColumns={true}
                    headerHeight={48}
                    rowHeight={40}
                    onCellValueChanged={onCellValueChanged}
                    theme="legacy"
                    getRowId={params => String(params.data.id)}
                />
            </Box>

            {/* Audit History Drawer */}
            <Drawer
                anchor="right"
                open={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                PaperProps={{
                    sx: {
                        width: 350,
                        backgroundColor: colors.background,
                        borderLeft: `1px solid ${colors.borderColor}`,
                        p: 0
                    }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.borderColor}` }}>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">Audit History</Typography>
                    <IconButton onClick={() => setIsHistoryOpen(false)} size="small">
                        <MdClose color={colors.textPrimary} />
                    </IconButton>
                </Box>
                <List sx={{ pt: 0 }}>
                    {auditHistory.map((item, index) => (
                        <React.Fragment key={item.id}>
                            <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', gap: 1, py: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <Chip label={item.user} size="small" sx={{ backgroundColor: colors.accentBackground, color: colors.textPrimary, fontWeight: 600 }} />
                                    <Typography variant="caption" color="text.secondary">{item.time}</Typography>
                                </Box>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2" fontWeight="600" color="text.primary" component="div">
                                            {item.action}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box mt={0.5} component="div">
                                            <Typography variant="caption" component="div" color="text.secondary">
                                                Changed from <strong>{item.from}</strong> to <strong>{item.to}</strong>
                                            </Typography>
                                            <Typography variant="caption" component="div" color="success.main" fontWeight="600" mt={0.5}>
                                                Profit Impact: {item.impact}
                                            </Typography>
                                        </Box>
                                    }
                                    secondaryTypographyProps={{ component: 'div' }}
                                />
                            </ListItem>
                            {index < auditHistory.length - 1 && <Divider component="li" sx={{ borderColor: colors.borderColor }} />}
                        </React.Fragment>
                    ))}
                </List>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Showing last 3 actions. Full audit trail available in Gold Layer.
                    </Typography>
                </Box>
            </Drawer>

            {/* Handshake Loading Overlay */}
            {isLiveLoading && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(13, 27, 42, 0.85)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <Paper
                        elevation={24}
                        sx={{
                            p: 4,
                            width: 500,
                            backgroundColor: '#1b2838',
                            border: `1px solid #234567`,
                            borderRadius: 3,
                            color: '#FFFFFF'
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                            <CircularProgress size={24} sx={{ color: '#4C9AFF' }} />
                            <Typography variant="h6" fontWeight="bold">Databricks Bridge Handshake</Typography>
                        </Stack>
                        <Box
                            sx={{
                                backgroundColor: '#050a0f',
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid #234567',
                                fontFamily: 'monospace',
                                minHeight: 120
                            }}
                        >
                            {liveLogs.map((log, i) => (
                                <Typography key={i} variant="caption" sx={{ display: 'block', mb: 0.5, color: i === liveLogs.length - 1 ? '#4C9AFF' : '#5c6370' }}>
                                    {`> ${log.message}`}
                                </Typography>
                            ))}
                        </Box>
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default CommercialForecast;
