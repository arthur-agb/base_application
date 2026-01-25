// src/features/data-modeling/components/FilterManager.jsx
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Box,
    Typography,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField
} from '@mui/material';
import { MdAdd, MdDelete, MdClose, MdFilterAlt } from 'react-icons/md';

const FilterManager = ({ open, onClose, filters, setFilters, tables, colors }) => {
    const addFilter = () => {
        if (tables.length === 0) return;

        // Default to first table and its first column
        const firstTable = tables[0];
        const firstCol = (firstTable.data.columns?.[0]?.name || firstTable.data.columns?.[0]) || 'id';

        setFilters([...filters, {
            id: Date.now(),
            tableId: firstTable.id,
            column: firstCol,
            operator: 'EQ',
            value: ''
        }]);
    };

    const updateFilter = (id, updates) => {
        setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const removeFilter = (id) => {
        setFilters(filters.filter(f => f.id !== id));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: colors.background,
                    backgroundImage: 'none',
                    border: `1px solid ${colors.borderColor}`
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: colors.textPrimary }}>
                <MdFilterAlt color="#0052CC" />
                Global Filters (WHERE)
                <IconButton size="small" onClick={onClose} sx={{ ml: 'auto', color: colors.textPrimary }}><MdClose /></IconButton>
            </DialogTitle>
            <DialogContent>
                <Typography variant="caption" sx={{ mb: 2, display: 'block', opacity: 0.7 }}>
                    Define conditions to filter the entire data model results. All conditions are combined with AND.
                </Typography>

                <Stack spacing={2} sx={{ mt: 1 }}>
                    {filters.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: 'center', border: `1px dashed ${colors.borderColor}`, borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ opacity: 0.5 }}>No filters applied to this model.</Typography>
                        </Box>
                    ) : filters.map((filter, idx) => {
                        const table = tables.find(t => t.id === filter.tableId);
                        const columns = table?.data?.columns || [];

                        return (
                            <Stack key={filter.id} direction="row" spacing={1} alignItems="flex-start">
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Table</InputLabel>
                                    <Select
                                        label="Table"
                                        value={filter.tableId}
                                        onChange={(e) => updateFilter(filter.id, { tableId: e.target.value, column: tables.find(t => t.id === e.target.value)?.data?.columns?.[0]?.name || 'id' })}
                                    >
                                        {tables.map(t => (
                                            <MenuItem key={t.id} value={t.id}>{t.data.alias || t.data.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Column</InputLabel>
                                    <Select
                                        label="Column"
                                        value={filter.column}
                                        onChange={(e) => updateFilter(filter.id, { column: e.target.value })}
                                    >
                                        {columns.map((col, i) => (
                                            <MenuItem key={i} value={col.name || col}>{col.name || col}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Operator</InputLabel>
                                    <Select
                                        label="Operator"
                                        value={filter.operator}
                                        onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                                    >
                                        <MenuItem value="EQ">=</MenuItem>
                                        <MenuItem value="NEQ">!=</MenuItem>
                                        <MenuItem value="GT">&gt;</MenuItem>
                                        <MenuItem value="LT">&lt;</MenuItem>
                                        <MenuItem value="GTE">&gt;=</MenuItem>
                                        <MenuItem value="LTE">&lt;=</MenuItem>
                                        <MenuItem value="LIKE">LIKE</MenuItem>
                                        <MenuItem value="IN">IN</MenuItem>
                                        <MenuItem value="IS_NULL">IS NULL</MenuItem>
                                        <MenuItem value="IS_NOT_NULL">IS NOT NULL</MenuItem>
                                    </Select>
                                </FormControl>

                                {filter.operator !== 'IS_NULL' && filter.operator !== 'IS_NOT_NULL' && (
                                    <TextField
                                        label="Value"
                                        size="small"
                                        value={filter.value}
                                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                                        sx={{ flex: 1 }}
                                        placeholder={filter.operator === 'IN' ? 'val1, val2...' : 'Enter value...'}
                                    />
                                )}

                                <IconButton size="small" color="error" onClick={() => removeFilter(filter.id)} sx={{ mt: 0.5 }}>
                                    <MdDelete />
                                </IconButton>
                            </Stack>
                        );
                    })}

                    <Button
                        startIcon={<MdAdd />}
                        onClick={addFilter}
                        size="small"
                        sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                    >
                        Add Filter
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained" sx={{ px: 4 }}>Done</Button>
            </DialogActions>
        </Dialog>
    );
};

export default FilterManager;
