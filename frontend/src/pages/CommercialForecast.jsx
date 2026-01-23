import React, { useMemo, useState, useEffect } from 'react';
// AG Grid
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { MdLock } from 'react-icons/md';

// AG Grid Styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const CommercialForecast = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // Theme-aware colors - using blue-tinted dark mode to match app's primary blue (#0052CC)
    const colors = useMemo(() => ({
        // Background colors - blue-tinted dark mode
        background: isDarkMode ? '#0d1b2a' : '#FFFFFF',           // Deep navy blue
        headerBackground: isDarkMode ? '#1b2838' : '#F4F5F7',     // Slightly lighter navy
        rowBackground: isDarkMode ? '#0d1b2a' : '#FFFFFF',        // Deep navy blue  
        rowAltBackground: isDarkMode ? '#132536' : '#FAFBFC',     // Alternating navy blue
        rowHoverBackground: isDarkMode ? '#1e3a5f' : '#EBECF0',   // Brighter blue on hover
        selectedBackground: isDarkMode
            ? 'rgba(0, 82, 204, 0.35)'   // Primary blue with transparency for dark
            : 'rgba(0, 82, 204, 0.12)',  // Primary blue with transparency for light
        lockedRowBackground: isDarkMode ? '#152535' : '#F4F5F7',  // Subtle blue tint for locked

        // Text colors
        textPrimary: isDarkMode ? '#E8EAED' : '#172B4D',
        textSecondary: isDarkMode ? '#9AA5B1' : '#6B778C',
        headerText: isDarkMode ? '#FFFFFF' : '#172B4D',

        // Border colors - blue-tinted
        borderColor: isDarkMode ? '#234567' : '#DFE1E6',

        // Accent colors - using primary blue (#0052CC)
        accentBackground: isDarkMode
            ? 'rgba(0, 82, 204, 0.3)'     // Stronger blue accent for dark
            : 'rgba(0, 82, 204, 0.08)',   // Subtle blue accent for light
    }), [isDarkMode, theme]);

    // Mock data based on the "Driver" model
    const [rowData] = useState([
        // Hierarchy Node A
        { id: 1, node: 'North America Retail', driver: 'Units', jan: 1200, feb: 1350, mar: 1400, seasonTotal: 3950, zScore: 1.1 },
        { id: 2, node: 'North America Retail', driver: 'ASP', jan: 55.00, feb: 55.00, mar: 58.50, seasonTotal: 56.17, zScore: 0.8 },
        { id: 3, node: 'North America Retail', driver: 'Returns', jan: 60, feb: 72, mar: 110, seasonTotal: 242, zScore: 2.1 }, // Warning > 2.0
        { id: 4, node: 'North America Retail', driver: 'Net Sales', jan: 65940, feb: 74178, mar: 81790, seasonTotal: 221908, zScore: 1.2, locked: true },

        // Hierarchy Node B
        { id: 5, node: 'EMEA Wholesale', driver: 'Units', jan: 800, feb: 850, mar: 900, seasonTotal: 2550, zScore: 0.9 },
        { id: 6, node: 'EMEA Wholesale', driver: 'ASP', jan: 42.00, feb: 42.00, mar: 42.00, seasonTotal: 42.00, zScore: 0.2 },
        { id: 7, node: 'EMEA Wholesale', driver: 'Returns', jan: 20, feb: 22, mar: 25, seasonTotal: 67, zScore: 1.5 },
        { id: 8, node: 'EMEA Wholesale', driver: 'Net Sales', jan: 33580, feb: 35678, mar: 37775, seasonTotal: 107033, zScore: 1.0, locked: true },
    ]);

    const columnDefs = useMemo(() => [
        {
            field: 'node',
            headerName: 'Hierarchy Node',
            pinned: 'left',
            width: 200,
            cellStyle: {
                fontWeight: '600',
                color: colors.textPrimary
            }
        },
        {
            field: 'driver',
            headerName: 'Driver',
            pinned: 'left',
            width: 150,
            cellStyle: params => {
                const baseStyle = {
                    fontWeight: '500',
                    color: colors.textPrimary
                };
                if (params.data?.locked) {
                    return {
                        ...baseStyle,
                        backgroundColor: colors.lockedRowBackground
                    };
                }
                return baseStyle;
            }
        },
        {
            field: 'jan',
            headerName: 'January',
            editable: params => !params.data?.locked,
            valueFormatter: params => params.data?.driver === 'Units' || params.data?.driver === 'Returns'
                ? params.value
                : `$${params.value?.toLocaleString()}`,
            cellStyle: params => ({
                color: colors.textPrimary,
                backgroundColor: params.data?.locked ? colors.lockedRowBackground : 'transparent'
            })
        },
        {
            field: 'feb',
            headerName: 'February',
            editable: params => !params.data?.locked,
            valueFormatter: params => params.data?.driver === 'Units' || params.data?.driver === 'Returns'
                ? params.value
                : `$${params.value?.toLocaleString()}`,
            cellStyle: params => ({
                color: colors.textPrimary,
                backgroundColor: params.data?.locked ? colors.lockedRowBackground : 'transparent'
            })
        },
        {
            field: 'mar',
            headerName: 'March',
            editable: params => !params.data?.locked,
            valueFormatter: params => params.data?.driver === 'Units' || params.data?.driver === 'Returns'
                ? params.value
                : `$${params.value?.toLocaleString()}`,
            cellStyle: params => ({
                color: colors.textPrimary,
                backgroundColor: params.data?.locked ? colors.lockedRowBackground : 'transparent'
            })
        },
        {
            field: 'seasonTotal',
            headerName: 'Season Total',
            cellStyle: {
                backgroundColor: colors.accentBackground,
                fontWeight: '700',
                color: colors.textPrimary
            },
            cellRenderer: params => (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    height: '100%',
                    justifyContent: 'space-between',
                    pr: 1,
                    color: colors.textPrimary
                }}>
                    <span>
                        {params.data?.driver === 'Units' || params.data?.driver === 'Returns'
                            ? params.value
                            : `$${params.value?.toLocaleString()}`}
                    </span>
                    <MdLock
                        size={14}
                        style={{
                            opacity: 0.6,
                            color: colors.textSecondary
                        }}
                        title="Season Total Locked"
                    />
                </Box>
            )
        },
        {
            field: 'zScore',
            headerName: 'Z-Score',
            cellStyle: params => {
                if (params.value > 2.0) {
                    return {
                        color: theme.palette.error.main,
                        fontWeight: 'bold'
                    };
                }
                return { color: colors.textPrimary };
            }
        }
    ], [theme, colors]);

    const defaultColDef = useMemo(() => ({
        flex: 1,
        minWidth: 120,
        resizable: true,
        sortable: true,
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
        '--ag-odd-row-background-color': colors.rowAltBackground,
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
            backgroundColor: colors.rowAltBackground,
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

    return (
        <Box
            sx={{
                height: 'calc(100vh - 120px)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'transparent',
            }}
        >
            <Box mb={2}>
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                    Commercial Planning Cockpit
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage units, ASP, and returns across commercial hierarchy nodes.
                </Typography>
            </Box>

            <Box
                flex={1}
                className={isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}
                sx={gridContainerStyles}
            >
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    animateRows={true}
                    suppressDragLeaveHidesColumns={true}
                    headerHeight={48}
                    rowHeight={44}
                />
            </Box>
        </Box>
    );
};

export default CommercialForecast;
