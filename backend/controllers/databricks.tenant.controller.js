// backend/controllers/databricks.tenant.controller.js
import { PrismaClient } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import { DBSQLClient } from '@databricks/sql';
import Logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * @desc    Save Databricks connection metadata to DB
 * @route   POST /api/databricks/connections
 */
export const saveConnection = asyncHandler(async (req, res) => {
    const { name, host, httpPath, token } = req.body;
    const companyId = req.company?.id;

    if (!name || !host || !httpPath || !token) {
        return res.status(400).json({ message: 'All connection parameters are required' });
    }

    const connection = await prisma.databricksConnection.create({
        data: {
            name,
            host: host.replace(/^https?:\/\//, '').replace(/\/$/, ''),
            httpPath,
            token, // TODO: encrypt this
            companyId
        }
    });

    res.status(201).json(connection);
});

/**
 * @desc    Get all saved Databricks connections for the company
 * @route   GET /api/databricks/connections
 */
export const getConnections = asyncHandler(async (req, res) => {
    const companyId = req.company?.id;

    if (!companyId) {
        return res.status(400).json({ message: 'Company context required' });
    }

    const connections = await prisma.databricksConnection.findMany({
        where: { companyId },
        select: {
            id: true,
            name: true,
            host: true,
            httpPath: true,
            createdAt: true
            // omit token
        }
    });

    res.json(connections);
});

/**
 * @desc    Get available catalogs from Databricks
 * @route   GET /api/databricks/catalogs
 */
export const getCatalogs = asyncHandler(async (req, res) => {
    const { connectionId } = req.query;

    const conn = await prisma.databricksConnection.findUnique({
        where: { id: connectionId }
    });

    if (!conn) return res.status(404).json({ message: 'Connection not found' });

    const client = new DBSQLClient();
    try {
        await client.connect({ host: conn.host, path: conn.httpPath, token: conn.token });
        const session = await client.openSession();

        const queryOperation = await session.executeStatement('SHOW CATALOGS');
        const data = await queryOperation.fetchAll();

        await queryOperation.close();
        await session.close();
        await client.close();

        res.json(data.map(row => row.catalog || row.CATALOG_NAME));
    } catch (error) {
        // Fallback for non-UC environments
        if (error.message.includes('NOT_FOUND') || error.message.includes('not supported')) {
            return res.json(['hive_metastore']);
        }
        Logger.error(`[Databricks Catalog] Error fetching catalogs: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @desc    Get available schemas (databases) from Databricks
 * @route   GET /api/databricks/schemas
 */
export const getSchemas = asyncHandler(async (req, res) => {
    const { connectionId, catalogName } = req.query;

    const conn = await prisma.databricksConnection.findUnique({
        where: { id: connectionId }
    });

    if (!conn) return res.status(404).json({ message: 'Connection not found' });

    const client = new DBSQLClient();
    try {
        await client.connect({ host: conn.host, path: conn.httpPath, token: conn.token });
        const session = await client.openSession();

        const sql = catalogName ? `SHOW SCHEMAS IN ${catalogName}` : 'SHOW SCHEMAS';
        const queryOperation = await session.executeStatement(sql);
        const data = await queryOperation.fetchAll();

        await queryOperation.close();
        await session.close();
        await client.close();

        res.json(data.map(row => row.databaseName || row.SCHEMA_NAME || row.namespace));
    } catch (error) {
        Logger.error(`[Databricks Catalog] Error fetching schemas: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @desc    Get tables within a specific schema
 * @route   GET /api/databricks/tables
 */
export const getTables = asyncHandler(async (req, res) => {
    const { connectionId, catalogName, schemaName } = req.query;

    const conn = await prisma.databricksConnection.findUnique({
        where: { id: connectionId }
    });

    if (!conn) return res.status(404).json({ message: 'Connection not found' });

    const client = new DBSQLClient();
    try {
        await client.connect({ host: conn.host, path: conn.httpPath, token: conn.token });
        const session = await client.openSession();

        const queryOperation = await session.executeStatement(`SHOW TABLES IN ${catalogName ? `${catalogName}.` : ''}${schemaName}`);
        const data = await queryOperation.fetchAll();

        await queryOperation.close();
        await session.close();
        await client.close();

        res.json(data);
    } catch (error) {
        Logger.error(`[Databricks Catalog] Error fetching tables: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @desc    Delete a saved Databricks connection
 * @route   DELETE /api/databricks/connections/:id
 */
export const deleteConnection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
        return res.status(400).json({ message: 'Company context required' });
    }

    await prisma.databricksConnection.delete({
        where: { id, companyId }
    });

    res.json({ message: 'Connection deleted successfully' });
});

/**
 * @desc    Get columns for a table
 * @route   GET /api/databricks/columns
 */
export const getColumns = asyncHandler(async (req, res) => {
    const { connectionId, schemaName, tableName } = req.query;

    const conn = await prisma.databricksConnection.findUnique({
        where: { id: connectionId }
    });

    if (!conn) return res.status(404).json({ message: 'Connection not found' });

    const client = new DBSQLClient();
    try {
        await client.connect({ host: conn.host, path: conn.httpPath, token: conn.token });
        const session = await client.openSession();

        const queryOperation = await session.executeStatement(`DESCRIBE TABLE ${schemaName}.${tableName}`);
        const data = await queryOperation.fetchAll();

        await queryOperation.close();
        await session.close();
        await client.close();

        // Standardize column names (Databricks might return col_name or name)
        res.json(data.map(row => ({
            name: row.col_name || row.COLUMN_NAME,
            type: row.data_type || row.DATA_TYPE,
            comment: row.comment
        })));
    } catch (error) {
        Logger.error(`[Databricks Catalog] Error fetching columns: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
});
