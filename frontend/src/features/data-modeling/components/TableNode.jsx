// src/features/data-modeling/components/TableNode.jsx
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography, Paper, Divider, Stack, IconButton } from '@mui/material';
import { MdTableChart, MdKey, MdSync, MdDelete, MdSettings } from 'react-icons/md';
import { CircularProgress } from '@mui/material';

const TableNode = ({ data }) => {
    // data contains: label (tableName), columns (optional), colors, loading (optional)
    const colors = data.colors;
    const isLoading = data.loading;

    return (
        <Paper
            elevation={3}
            sx={{
                minWidth: 180,
                maxWidth: 250,
                borderRadius: '8px',
                overflow: 'hidden',
                border: `1px solid ${colors.borderColor}`,
                backgroundColor: colors.background,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 1,
                backgroundColor: 'rgba(0, 82, 204, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderBottom: `1px solid ${colors.borderColor}`
            }}>
                <MdTableChart color="#0052CC" size={16} />
                <Typography variant="caption" fontWeight="700" sx={{ flex: 1, noWrap: true, fontSize: '0.7rem' }}>
                    {data.alias ? `${data.alias} (${data.label})` : data.label}
                </Typography>

                <Stack direction="row" spacing={0.2} alignItems="center">
                    {!isLoading && (
                        <>
                            <IconButton
                                size="small"
                                sx={{ p: 0.2, opacity: 0.4, '&:hover': { opacity: 1, color: '#0052CC' } }}
                                disabled={data.isModalOpen}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (data.onEdit) data.onEdit();
                                }}
                            >
                                <MdSettings size={14} />
                            </IconButton>
                            <IconButton
                                size="small"
                                sx={{ p: 0.2, opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' } }}
                                disabled={data.isModalOpen}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (data.onDelete) data.onDelete();
                                }}
                            >
                                <MdDelete size={14} />
                            </IconButton>
                        </>
                    )}

                    {isLoading ? (
                        <CircularProgress size={12} thickness={5} sx={{ color: '#0052CC' }} />
                    ) : (
                        <IconButton
                            size="small"
                            sx={{ p: 0.2, opacity: 0.4, '&:hover': { opacity: 1 } }}
                            disabled={data.isModalOpen}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (data.onRefresh) data.onRefresh();
                            }}
                        >
                            <MdSync size={14} />
                        </IconButton>
                    )}
                </Stack>
            </Box>

            {/* Column List */}
            <Box sx={{ p: 1, maxHeight: 180, overflowY: 'auto' }}>
                <Stack spacing={0.5}>
                    {data.columns && data.columns.length > 0 ? data.columns.map((col, idx) => {
                        const colName = col.name || col;
                        const selection = data.selectedColumns?.find(c => c.name === colName);
                        const isSelected = !!selection;
                        const isConnected = data.connectedColumns?.has(colName);

                        return (
                            <Box
                                key={idx}
                                onClick={() => data.onToggleColumn && data.onToggleColumn(colName)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    cursor: 'pointer',
                                    p: '2px 4px',
                                    borderRadius: '4px',
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' },
                                    bgcolor: isSelected ? 'rgba(0, 82, 204, 0.05)' : 'transparent'
                                }}
                            >
                                {/* Selection Indicator */}
                                <Box sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '3px',
                                    border: `1px solid ${isSelected ? '#0052CC' : '#ccc'}`,
                                    bgcolor: isSelected ? '#0052CC' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 0.5
                                }}>
                                    {isSelected && (
                                        <Typography sx={{
                                            color: 'white',
                                            fontSize: '0.6rem',
                                            fontWeight: 'bold',
                                            lineHeight: 1
                                        }}>
                                            {selection.aggregation && selection.aggregation !== 'NONE' ? 'Σ' : (selection.alias ? 'ƒ' : '✓')}
                                        </Typography>
                                    )}
                                </Box>

                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: '0.65rem',
                                        opacity: isSelected || isConnected ? 1 : 0.6,
                                        fontWeight: isSelected || isConnected ? 600 : 400,
                                        color: isConnected ? '#0052CC' : isSelected ? 'inherit' : 'text.secondary',
                                        flex: 1
                                    }}
                                >
                                    {colName}
                                </Typography>

                                {selection?.alias && (
                                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'primary.main', fontStyle: 'italic', ml: 0.5 }}>
                                        as {selection.alias}
                                    </Typography>
                                )}

                                {selection?.aggregation && selection.aggregation !== 'NONE' && (
                                    <Chip
                                        label={selection.aggregation}
                                        size="small"
                                        sx={{ height: 14, fontSize: '0.5rem', bgcolor: 'primary.main', color: 'white' }}
                                    />
                                )}

                                {/* Type (only if not aggregated or if it's the base type) */}
                                {!selection?.aggregation && (col.type || col.typeName) && (
                                    <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.4 }}>
                                        {col.type || col.typeName}
                                    </Typography>
                                )}
                            </Box>
                        );
                    }) : !isLoading && (
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', fontStyle: 'italic', opacity: 0.6 }}>
                            Drop to fetch columns...
                        </Typography>
                    )}
                    {isLoading && !data.columns && (
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', fontStyle: 'italic', opacity: 0.5 }}>
                            Fetching schema...
                        </Typography>
                    )}
                </Stack>
            </Box>

            {/* Connection Handles */}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#0052CC', width: 8, height: 8 }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#0052CC', width: 8, height: 8 }}
            />
        </Paper>
    );
};

export default memo(TableNode);
