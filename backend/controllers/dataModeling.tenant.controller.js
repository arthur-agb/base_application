// backend/controllers/dataModeling.tenant.controller.js
import { PrismaClient } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import { DBSQLClient } from '@databricks/sql';
import Logger from '../utils/logger.js';

const prisma = new PrismaClient();

// -- GROUPS --

/**
 * @desc    Get all data model groups for the tenant
 * @route   GET /api/data-modeling/groups
 * @access  Private
 */
export const getGroups = asyncHandler(async (req, res) => {
    const companyId = req.company?.id;

    if (!companyId) {
        return res.status(400).json({ message: 'Company context required' });
    }

    const groups = await prisma.dataModelGroup.findMany({
        where: { companyId },
        include: { _count: { select: { models: true } } },
        orderBy: { name: 'asc' }
    });

    res.json(groups);
});

/**
 * @desc    Create a new data model group
 * @route   POST /api/data-modeling/groups
 * @access  Private/Manager
 */
export const createGroup = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const companyId = req.company?.id;

    if (!name) {
        return res.status(400).json({ message: 'Group name is required' });
    }

    const group = await prisma.dataModelGroup.create({
        data: {
            name,
            companyId
        }
    });

    res.status(201).json(group);
});

// -- MODELS --

/**
 * @desc    Get all models for a specific group
 * @route   GET /api/data-modeling/groups/:groupId/models
 * @access  Private
 */
export const getModelsByGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const models = await prisma.dataModel.findMany({
        where: { groupId },
        orderBy: { updatedAt: 'desc' }
    });

    res.json(models);
});

/**
 * @desc    Get full details of a single data model (tables + relationships)
 * @route   GET /api/data-modeling/models/:id
 * @access  Private
 */
export const getModelDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const model = await prisma.dataModel.findUnique({
        where: { id },
        include: {
            tables: true,
            relationships: true,
            connection: {
                select: { id: true, name: true, host: true }
            }
        }
    });

    if (!model) {
        return res.status(404).json({ message: 'Data model not found' });
    }

    res.json(model);
});

/**
 * @desc    Create or update a data model with its visual orchestration
 * @route   POST /api/data-modeling/models/save
 * @access  Private/Manager
 */
export const saveModel = asyncHandler(async (req, res) => {
    const {
        id,
        name,
        description,
        groupId,
        connectionId,
        tables,
        relationships,
        filters,
        isGroupByAll
    } = req.body;

    if (!groupId) {
        return res.status(400).json({ message: 'Missing groupId' });
    }
    if (!name) {
        return res.status(400).json({ message: 'Missing model name' });
    }

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
        let model;

        if (id) {
            // Update existing model
            model = await tx.dataModel.update({
                where: { id },
                data: { name, description, connectionId, groupId, filters, isGroupByAll }
            });

            // Wipe existing tables/rels and recreate (simplest way to handle updates for visual canvas)
            await tx.dataModelRelationship.deleteMany({ where: { modelId: id } });
            await tx.dataModelTable.deleteMany({ where: { modelId: id } });
        } else {
            // Create new model
            model = await tx.dataModel.create({
                data: { name, description, connectionId, groupId, filters, isGroupByAll }
            });
        }

        // 1. Re-create tables
        const createdTables = [];
        for (const table of (tables || [])) {
            const newTable = await tx.dataModelTable.create({
                data: {
                    modelId: model.id,
                    tableName: table.tableName,
                    schema: table.schema,
                    columns: table.columns,
                    selectedColumns: table.selectedColumns, // ADDED
                    alias: table.alias,
                    x: table.x || 0,
                    y: table.y || 0
                }
            });
            // Map frontend ID (temporary) to backend ID for relationship creation
            table.backendId = newTable.id;
            createdTables.push(newTable);
        }

        // 2. Re-create relationships
        const createdRelationships = [];
        for (const rel of (relationships || [])) {
            // Re-resolve table IDs based on the newly created table IDs
            const fromTable = tables.find(t => t.id === rel.fromTableId);
            const toTable = tables.find(t => t.id === rel.toTableId);

            if (!fromTable || !toTable) continue;

            const newRel = await tx.dataModelRelationship.create({
                data: {
                    modelId: model.id,
                    fromTableId: fromTable.backendId,
                    toTableId: toTable.backendId,
                    fromColumn: rel.fromColumn,
                    toColumn: rel.toColumn,
                    joinType: rel.joinType || 'LEFT',
                    cardinality: rel.cardinality || 'ONE_TO_MANY'
                }
            });
            createdRelationships.push(newRel);
        }

        return { model, tables: createdTables, relationships: createdRelationships };
    });

    res.json(result);
});

/**
 * @desc    Delete a data model group
 * @route   DELETE /api/data-modeling/groups/:id
 * @access  Private/Manager
 */
export const deleteGroup = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.dataModelGroup.delete({ where: { id } });
    res.json({ message: 'Group deleted successfully' });
});

/**
 * @desc    Delete a data model
 * @route   DELETE /api/data-modeling/models/:id
 * @access  Private/Manager
 */
export const deleteModel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.dataModel.delete({ where: { id } });
    res.json({ message: 'Model deleted successfully' });
});

const generateSql = (tables, relationships, filters = null, isGroupByAll = false) => {
    // Handle manual SQL override check
    if (filters && typeof filters === 'object' && !Array.isArray(filters)) {
        if (filters.isManual && filters.manualSql) {
            return filters.manualSql;
        }
    }

    if (!tables || tables.length === 0) return null;

    // Helper to escape identifiers
    const escape = (val) => val ? `\`${val.replace(/`/g, '``')}\`` : val;

    // Safety Strategy: Use strict numeric aliases (t1, t2, ...) 
    const aliasMap = {}; // nodeId -> uniqueAlias (e.g. t1, t2)
    tables.forEach((table, index) => {
        aliasMap[table.id] = `t${index + 1}`;
    });

    const qualify = (table) => {
        if (!table || !table.tableName) return 'UNKNOWN_TABLE';
        if (!table.schema) return escape(table.tableName);
        return table.schema.split('.')
            .map(p => escape(p))
            .concat(escape(table.tableName))
            .join('.');
    };

    // Track which tables are already part of the JOIN tree
    const joinedTableIds = new Set();
    const baseTable = tables[0];
    joinedTableIds.add(baseTable.id);

    const baseAlias = aliasMap[baseTable.id];

    // -- Column Selection Logic --
    const selectedColumnsList = [];
    tables.forEach(table => {
        const alias = aliasMap[table.id];
        if (table.selectedColumns && Array.isArray(table.selectedColumns) && table.selectedColumns.length > 0) {
            table.selectedColumns.forEach(col => {
                if (col.hidden) return;

                let colExpr = `${escape(alias)}.${escape(col.name)}`;
                if (col.aggregation && col.aggregation !== 'NONE') {
                    colExpr = `${col.aggregation}(${colExpr})`;
                }

                if (col.alias) {
                    colExpr += ` AS ${escape(col.alias)}`;
                } else if (col.aggregation && col.aggregation !== 'NONE') {
                    // Default alias for aggregations if none provided
                    colExpr += ` AS ${escape(`${col.aggregation.toLowerCase()}_${col.name}`)}`;
                }

                selectedColumnsList.push(colExpr);
            });
        }
    });

    const selectClause = selectedColumnsList.length > 0
        ? selectedColumnsList.join(', \n       ')
        : '*';

    let sql = `SELECT ${selectClause} \nFROM ${qualify(baseTable)} AS ${escape(baseAlias)}`;

    // Keep track of processed relationships to avoid duplicates/infinite loops if graph is messy
    const processedRelIds = new Set();
    let madeProgress = true;

    while (madeProgress) {
        madeProgress = false;

        relationships.forEach((rel, index) => {
            if (processedRelIds.has(index)) return;

            const fromJoined = joinedTableIds.has(rel.fromTableId);
            const toJoined = joinedTableIds.has(rel.toTableId);

            // We can only process this relationship if EXACTLY one side is already joined
            // If both are, we might be creating a cycle (which we'll ignore for simple tree SQL)
            // If neither are, we wait for a future pass
            if (fromJoined && !toJoined) {
                // Joining TO the target table
                const sourceTable = tables.find(t => t.id === rel.fromTableId);
                const targetTable = tables.find(t => t.id === rel.toTableId);

                if (sourceTable && targetTable) {
                    const fromRef = aliasMap[sourceTable.id];
                    const toRef = aliasMap[targetTable.id];

                    sql += `\n${rel.joinType} JOIN ${qualify(targetTable)} AS ${escape(toRef)}`;
                    sql += buildJoinOn(rel, fromRef, toRef, escape);

                    joinedTableIds.add(targetTable.id);
                    processedRelIds.add(index);
                    madeProgress = true;
                }
            } else if (!fromJoined && toJoined) {
                // Joining TO the source table
                const sourceTable = tables.find(t => t.id === rel.fromTableId);
                const targetTable = tables.find(t => t.id === rel.toTableId);

                if (sourceTable && targetTable) {
                    const fromRef = aliasMap[sourceTable.id];
                    const toRef = aliasMap[targetTable.id];

                    // Note: Here we are joining the 'sourceTable' because the 'targetTable' was already in the query
                    sql += `\n${rel.joinType} JOIN ${qualify(sourceTable)} AS ${escape(fromRef)}`;
                    sql += buildJoinOn(rel, fromRef, toRef, escape);

                    joinedTableIds.add(sourceTable.id);
                    processedRelIds.add(index);
                    madeProgress = true;
                }
            }
        });
    }

    // Handle any orphaned tables (not connected to anything) - just as safe fallback
    tables.forEach(table => {
        if (!joinedTableIds.has(table.id)) {
            const alias = aliasMap[table.id];
            sql += `\nCROSS JOIN ${qualify(table)} AS ${escape(alias)}`;
            joinedTableIds.add(table.id);
        }
    });

    // -- WHERE Filters --
    let activeFilters = filters;
    if (filters && typeof filters === 'object' && !Array.isArray(filters)) {
        activeFilters = filters.conditions || [];
    }

    if (activeFilters && Array.isArray(activeFilters) && activeFilters.length > 0) {
        const whereClauses = activeFilters.map(f => {
            // Find the table and its alias
            const table = tables.find(t => t.id === f.tableId);
            const alias = table ? aliasMap[table.id] : null;
            if (!alias) return null;

            const colRef = `${escape(alias)}.${escape(f.column)}`;
            let val = f.value;

            // Basic type handling (simplified)
            if (typeof val === 'string' && f.operator !== 'IN') {
                val = `'${val.replace(/'/g, "''")}'`;
            }

            switch (f.operator) {
                case 'EQ': return `${colRef} = ${val}`;
                case 'NEQ': return `${colRef} <> ${val}`;
                case 'GT': return `${colRef} > ${val}`;
                case 'LT': return `${colRef} < ${val}`;
                case 'GTE': return `${colRef} >= ${val}`;
                case 'LTE': return `${colRef} <= ${val}`;
                case 'LIKE': return `${colRef} LIKE '${f.value}'`;
                case 'IN': return `${colRef} IN (${Array.isArray(val) ? val.join(', ') : val})`;
                case 'IS_NULL': return `${colRef} IS NULL`;
                case 'IS_NOT_NULL': return `${colRef} IS NOT NULL`;
                default: return null;
            }
        }).filter(c => c !== null);

        if (whereClauses.length > 0) {
            sql += `\nWHERE ${whereClauses.join(' AND ')}`;
        }
    }

    // -- GROUP BY ALL --
    if (isGroupByAll) {
        sql += `\nGROUP BY ALL`;
    }

    return sql;
};

// Internal helper for JOIN ... ON logic
const buildJoinOn = (rel, fromRef, toRef, escape) => {
    if (rel.fromColumn && rel.fromColumn.startsWith('__JSON__:')) {
        try {
            const conditions = JSON.parse(rel.fromColumn.substring(9));
            let onSql = '';
            conditions.forEach((cond, idx) => {
                const prefix = idx === 0 ? ' ON' : ' AND';
                onSql += `${prefix} ${escape(fromRef)}.${escape(cond.fromColumn)} = ${escape(toRef)}.${escape(cond.toColumn)}`;
            });
            return onSql;
        } catch (e) {
            return ` ON ${escape(fromRef)}.\`id\` = ${escape(toRef)}.\`id\``;
        }
    } else {
        return ` ON ${escape(fromRef)}.${escape(rel.fromColumn || 'id')} = ${escape(toRef)}.${escape(rel.toColumn || 'id')}`;
    }
};

/**
 * @desc    Execute a data model's query on Databricks
 * @route   GET /api/data-modeling/models/:id/execute
 */
export const executeModelQuery = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rowLimit = 100 } = req.query;

    const model = await prisma.dataModel.findUnique({
        where: { id },
        include: {
            tables: true,
            relationships: true,
            connection: true
        }
    });

    if (!model || !model.connection) {
        return res.status(404).json({ message: 'Model or Connection not found' });
    }

    if (model.tables.length === 0) {
        return res.status(400).json({ message: 'Model must have at least one table' });
    }

    // -- Dynamic SQL Generation Logic --
    const sqlBase = generateSql(model.tables, model.relationships, model.filters, model.isGroupByAll);
    if (!sqlBase) {
        return res.status(400).json({ message: 'Model must have at least one table' });
    }

    // Only append LIMIT if it's not already present at the end of the query
    const hasLimit = /\blimit\s+\d+\s*$/i.test(sqlBase.trim());
    const sql = hasLimit ? sqlBase : `${sqlBase} LIMIT ${rowLimit}`;

    // -- Execution on Databricks --
    const client = new DBSQLClient();
    try {
        await client.connect({
            host: model.connection.host,
            path: model.connection.httpPath,
            token: model.connection.token
        });
        const session = await client.openSession();
        const queryOperation = await session.executeStatement(sql);
        const data = await queryOperation.fetchAll();
        const schema = await queryOperation.getSchema();

        await queryOperation.close();
        await session.close();
        await client.close();

        res.json({
            sql,
            results: {
                columns: schema?.columns?.map(c => c.columnName) || [],
                data: data.map(row => (schema?.columns?.map(c => row[c.columnName]) || []))
            }
        });
    } catch (error) {
        Logger.error(`[Data Modeler] Execution failed: ${error.message}`);
        res.status(500).json({ message: error.message, sql });
    }
});

/**
 * @desc    Execute a DRAFT model query (unsaved changes)
 * @route   POST /api/data-modeling/models/execute-draft
 */
export const executeDraftModelQuery = asyncHandler(async (req, res) => {
    const { connectionId, tables, relationships, rowLimit = 100 } = req.body;

    if (!connectionId) {
        return res.status(400).json({ message: 'Connection ID required for preview' });
    }

    const connection = await prisma.databricksConnection.findUnique({ where: { id: connectionId } });
    if (!connection) {
        return res.status(404).json({ message: 'Connection not found' });
    }

    const sqlBase = generateSql(tables, relationships, req.body.filters, req.body.isGroupByAll);
    if (!sqlBase) {
        return res.status(400).json({ message: 'No tables configured' });
    }

    // Only append LIMIT if it's not already present at the end of the query
    const hasLimit = /\blimit\s+\d+\s*$/i.test(sqlBase.trim());
    const sql = hasLimit ? sqlBase : `${sqlBase} LIMIT ${rowLimit}`;

    Logger.info(`[Data Modeler] Executing DRAFT SQL:\n${sql}`);

    const client = new DBSQLClient();
    try {
        await client.connect({
            host: connection.host,
            path: connection.httpPath,
            token: connection.token
        });
        const session = await client.openSession();
        const queryOperation = await session.executeStatement(sql);
        const data = await queryOperation.fetchAll();
        const schema = await queryOperation.getSchema();

        await queryOperation.close();
        await session.close();
        await client.close();

        res.json({
            sql,
            results: {
                columns: schema?.columns?.map(c => c.columnName) || [],
                data: data.map(row => (schema?.columns?.map(c => row[c.columnName]) || []))
            }
        });
    } catch (error) {
        Logger.error(`[Data Modeler] Draft Execution failed: ${error.message}\nSQL: ${sql}`);
        res.status(500).json({ message: error.message, sql });
    }
});

/**
 * @desc    Validate relationship cardinality by checking for duplicates on join keys
 * @route   POST /api/data-modeling/validate-cardinality
 */
export const validateCardinality = asyncHandler(async (req, res) => {
    const { connectionId, sourceTable, targetTable, conditions } = req.body;

    if (!connectionId || !sourceTable || !targetTable || !conditions?.length) {
        return res.status(400).json({ message: 'Missing parameters for validation' });
    }

    const connection = await prisma.databricksConnection.findUnique({ where: { id: connectionId } });
    if (!connection) return res.status(404).json({ message: 'Connection not found' });

    const escape = (val) => `\`${val.replace(/`/g, '``')}\``;
    const qualify = (table) => {
        if (!table.schema) return escape(table.tableName);
        return table.schema.split('.').map(p => escape(p)).concat(escape(table.tableName)).join('.');
    };

    const sourceQual = qualify(sourceTable);
    const targetQual = qualify(targetTable);

    const sourceKeys = conditions.map(c => escape(c.fromColumn)).join(', ');
    const targetKeys = conditions.map(c => escape(c.toColumn)).join(', ');

    const sql = `
        SELECT 'source' as side, count(*) as total_rows, count(distinct ${sourceKeys}) as distinct_keys FROM ${sourceQual}
        UNION ALL
        SELECT 'target' as side, count(*) as total_rows, count(distinct ${targetKeys}) as distinct_keys FROM ${targetQual}
    `;

    const client = new DBSQLClient();
    try {
        await client.connect({ host: connection.host, path: connection.httpPath, token: connection.token });
        const session = await client.openSession();
        const op = await session.executeStatement(sql);
        const rows = await op.fetchAll();
        await op.close();
        await session.close();
        await client.close();

        // Interpret results
        const sourceRes = rows.find(r => r.side === 'source');
        const targetRes = rows.find(r => r.side === 'target');

        const sourceIsMany = sourceRes.total_rows > sourceRes.distinct_keys;
        const targetIsMany = targetRes.total_rows > targetRes.distinct_keys;

        res.json({
            source: { isMany: sourceIsMany, totalRows: sourceRes.total_rows, distinctKeys: sourceRes.distinct_keys },
            target: { isMany: targetIsMany, totalRows: targetRes.total_rows, distinctKeys: targetRes.distinct_keys },
            detectedCardinality: sourceIsMany && targetIsMany ? 'MANY_TO_MANY' :
                sourceIsMany ? 'MANY_TO_ONE' :
                    targetIsMany ? 'ONE_TO_MANY' : 'ONE_TO_ONE'
        });
    } catch (error) {
        Logger.error(`[Data Modeler] Cardinality validation failed: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @desc    Validate all relationships in a model
 * @route   POST /api/data-modeling/validate-model-cardinality
 */
export const batchValidateCardinality = asyncHandler(async (req, res) => {
    const { connectionId, tables, relationships } = req.body;

    if (!connectionId || !tables?.length || !relationships?.length) {
        return res.json({ issues: [], validated: true });
    }

    const connection = await prisma.databricksConnection.findUnique({ where: { id: connectionId } });
    if (!connection) return res.status(404).json({ message: 'Connection not found' });

    const escape = (val) => `\`${val.replace(/`/g, '``')}\``;
    const qualify = (table) => {
        if (!table.schema) return escape(table.tableName);
        return table.schema.split('.').map(p => escape(p)).concat(escape(table.tableName)).join('.');
    };

    const client = new DBSQLClient();
    try {
        await client.connect({ host: connection.host, path: connection.httpPath, token: connection.token });
        const session = await client.openSession();

        const reports = [];
        const issues = [];
        for (const rel of relationships) {
            const source = tables.find(t => t.id === rel.fromTableId);
            const target = tables.find(t => t.id === rel.toTableId);

            if (!source || !target) continue;

            let sourceKeys = '';
            let targetKeys = '';

            if (rel.fromColumn && rel.fromColumn.startsWith('__JSON__:')) {
                try {
                    const conditions = JSON.parse(rel.fromColumn.substring(9));
                    sourceKeys = conditions.map(c => escape(c.fromColumn)).join(', ');
                    targetKeys = conditions.map(c => escape(c.toColumn)).join(', ');
                } catch (e) {
                    sourceKeys = escape('id');
                    targetKeys = escape('id');
                }
            } else {
                sourceKeys = escape(rel.fromColumn || 'id');
                targetKeys = escape(rel.toColumn || 'id');
            }

            const sql = `
                SELECT 'source' as side, count(*) as total_rows, count(distinct ${sourceKeys}) as distinct_keys FROM ${qualify(source)}
                UNION ALL
                SELECT 'target' as side, count(*) as total_rows, count(distinct ${targetKeys}) as distinct_keys FROM ${qualify(target)}
            `;

            const op = await session.executeStatement(sql);
            const rows = await op.fetchAll();
            await op.close();

            const sourceRes = rows.find(r => r.side === 'source');
            const targetRes = rows.find(r => r.side === 'target');

            if (sourceRes && targetRes) {
                const sourceIsMany = sourceRes.total_rows > sourceRes.distinct_keys;
                const targetIsMany = targetRes.total_rows > targetRes.distinct_keys;

                const cardinality = sourceIsMany && targetIsMany ? 'MANY_TO_MANY' :
                    sourceIsMany ? 'MANY_TO_ONE' :
                        targetIsMany ? 'ONE_TO_MANY' : 'ONE_TO_ONE';

                const report = {
                    id: rel.id || `e_${rel.fromTableId}_${rel.toTableId}`,
                    sourceLabel: source.tableName,
                    targetLabel: target.tableName,
                    sourceStats: { total: sourceRes.total_rows, distinct: sourceRes.distinct_keys },
                    targetStats: { total: targetRes.total_rows, distinct: targetRes.distinct_keys },
                    cardinality
                };
                reports.push(report);

                if (sourceIsMany && targetIsMany) {
                    issues.push({
                        ...report,
                        type: 'MANY_TO_MANY'
                    });
                }
            }
        }

        await session.close();
        await client.close();
        res.json({ issues, reports, validated: true });

    } catch (error) {
        Logger.error(`[Data Modeler] Batch validation failed: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
});
