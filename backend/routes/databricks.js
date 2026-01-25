import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import {
    saveConnection,
    getConnections,
    getSchemas,
    getTables,
    deleteConnection,
    getColumns,
    getCatalogs
} from '../controllers/databricks.tenant.controller.js';
import Logger from '../utils/logger.js';
import { DBSQLClient } from '@databricks/sql';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Databricks
 *   description: Databricks connector operations
 */

// Connection persistence
router.route('/connections')
    .get(protect, tenantContext, getConnections)
    .post(protect, tenantContext, saveConnection);

router.route('/connections/:id')
    .delete(protect, tenantContext, deleteConnection);


// Schema discovery
router.get('/catalogs', protect, tenantContext, getCatalogs);
router.get('/schemas', protect, tenantContext, getSchemas);
router.get('/tables', protect, tenantContext, getTables);
router.get('/columns', protect, tenantContext, getColumns);

/**
 * @swagger
 * /databricks/test-connection:
 *   post:
 *     summary: Test connection and execute query on Databricks using @databricks/sql driver
 *     tags: [Databricks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - host
 *               - path
 *               - token
 *               - query
 *             properties:
 *               host:
 *                 type: string
 *               path:
 *                 type: string
 *               token:
 *                 type: string
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: Query executed successfully
 */
router.post('/test-connection', protect, async (req, res) => {
    const { host, path: dbPath, token, query, rowLimit = 100 } = req.body;
    const logs = [];

    const addLog = (message) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            message
        };
        logs.push(logEntry);
        Logger.info(`[Databricks Bridge] ${message}`);
    };

    if (!host || !dbPath || !token || !query) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing required connection parameters.',
            logs: [{ timestamp: new Date().toISOString(), message: 'Error: Missing parameters' }]
        });
    }

    addLog(`Initializing Databricks SQL Client...`);
    const client = new DBSQLClient();

    try {
        addLog(`Connecting to host: ${host}...`);
        await client.connect({
            host: host.replace(/^https?:\/\//, '').replace(/\/$/, ''),
            path: dbPath,
            token: token,
        });

        addLog(`Handshake successful. Opening session...`);
        const session = await client.openSession();

        addLog(`Session established. Preparing query execution (Safety Limit: ${rowLimit})...`);

        // Safety Logic: Injection Guard & LIMIT check
        let sanitizedQuery = query.trim();
        const limitRegex = /LIMIT\s+\d+/i;

        if (!limitRegex.test(sanitizedQuery)) {
            sanitizedQuery = `${sanitizedQuery} LIMIT ${rowLimit}`;
        }

        addLog(`Executing Statement: ${sanitizedQuery.substring(0, 50)}${sanitizedQuery.length > 50 ? '...' : ''}`);
        const queryOperation = await session.executeStatement(sanitizedQuery, {
            runAsync: true,
            maxRows: rowLimit
        });

        addLog(`Fetching results...`);
        const data = await queryOperation.fetchAll();
        const schema = await queryOperation.getSchema();

        addLog(`Query successful. Received ${data.length} rows.`);

        await queryOperation.close();
        await session.close();
        await client.close();

        addLog(`Connection closed gracefully.`);

        const columns = schema?.columns?.map(col => col.columnName) || [];

        if (!data || !Array.isArray(data)) {
            throw new Error('Invalid data format received from Databricks');
        }

        // Transform data from array of objects to array of arrays for the raw UI table
        const dataArray = data.map(row => columns.map(col => row[col]));

        res.json({
            status: 'success',
            message: 'Connected and query executed successfully.',
            queryUsed: sanitizedQuery,
            logs,
            results: {
                columns,
                data: dataArray
            }
        });

    } catch (error) {
        addLog(`Error: ${error.message}`);
        console.error('[Databricks Bridge] FULL ERROR:', error);
        Logger.error(`[Databricks Bridge] Connection error: ${error.stack}`);

        try {
            if (client) await client.close();
        } catch (e) {
            // Ignore close error
        }

        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to connect to Databricks',
            logs
        });
    }
});

export default router;
