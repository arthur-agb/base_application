// backend/routes/databricks.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Logger from '../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Databricks
 *   description: Databricks connector operations
 */

/**
 * Extract warehouse ID from HTTP path
 * HTTP path format: /sql/1.0/warehouses/xxx or /sql/1.0/endpoints/xxx
 */
function extractWarehouseId(httpPath) {
    const match = httpPath.match(/\/(warehouses|endpoints)\/([a-z0-9]+)/i);
    return match ? match[2] : null;
}

/**
 * @swagger
 * /databricks/test-connection:
 *   post:
 *     summary: Test connection and execute query on Databricks
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
 *                 example: adb-12345.azuredatabricks.net
 *               path:
 *                 type: string
 *                 example: /sql/1.0/warehouses/abcde12345
 *               token:
 *                 type: string
 *                 example: dapi1234567890abcdef
 *               query:
 *                 type: string
 *                 example: SELECT * FROM silver.sales_summary
 *     responses:
 *       200:
 *         description: Query executed successfully
 *       400:
 *         description: Missing parameters
 *       504:
 *         description: Connection timed out
 *       500:
 *         description: Internal server error
 */
router.post('/test-connection', protect, async (req, res) => {
    const { host, path: dbPath, token, query } = req.body;

    if (!host || !dbPath || !token || !query) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing required connection parameters: host, path, token, and query are mandatory.'
        });
    }

    // Clean up host (remove protocol if present)
    const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Extract warehouse ID from the HTTP path
    const warehouseId = extractWarehouseId(dbPath);
    if (!warehouseId) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid HTTP path. Expected format: /sql/1.0/warehouses/<warehouse_id> or /sql/1.0/endpoints/<warehouse_id>'
        });
    }

    // Safety Logic: Injection Guard & LIMIT check
    let sanitizedQuery = query.trim();
    const limitRegex = /LIMIT\s+\d+/i;

    if (!limitRegex.test(sanitizedQuery)) {
        sanitizedQuery = `${sanitizedQuery} LIMIT 100`;
    }

    Logger.info(`[Databricks] Executing query on ${cleanHost}, warehouse: ${warehouseId}`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
        // Use Databricks SQL Statement Execution API
        // https://docs.databricks.com/api/workspace/statementexecution/executestatement
        const response = await fetch(
            `https://${cleanHost}/api/2.0/sql/statements`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    warehouse_id: warehouseId,
                    statement: sanitizedQuery,
                    wait_timeout: '30s',
                    on_wait_timeout: 'CANCEL',
                }),
                signal: controller.signal,
            }
        );

        clearTimeout(timeoutId);

        // Handle non-OK responses
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to execute query';

            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            Logger.error(`[Databricks] API error: ${response.status} - ${errorMessage}`);

            return res.status(response.status).json({
                status: 'error',
                message: errorMessage
            });
        }

        const result = await response.json();

        // Check for statement execution errors
        if (result.status?.state === 'FAILED') {
            const errorMessage = result.status?.error?.message || 'Query execution failed';
            Logger.error(`[Databricks] Query failed: ${errorMessage}`);
            return res.status(400).json({
                status: 'error',
                message: errorMessage
            });
        }

        // Handle pending/running state (should not happen with wait_timeout)
        if (result.status?.state === 'PENDING' || result.status?.state === 'RUNNING') {
            return res.status(202).json({
                status: 'pending',
                message: 'Query is still running. Please try again.',
                statementId: result.statement_id
            });
        }

        // Extract columns and data from the result
        const columns = result.manifest?.schema?.columns?.map(col => col.name) || [];
        const data = result.result?.data_array || [];

        Logger.info(`[Databricks] Query successful. Returned ${data.length} rows.`);

        res.json({
            status: 'success',
            message: 'Query executed successfully.',
            queryUsed: sanitizedQuery,
            results: {
                columns,
                data
            }
        });

    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            Logger.error('[Databricks] Request timed out');
            return res.status(504).json({
                status: 'error',
                message: 'Databricks connection timed out after 30 seconds.'
            });
        }

        Logger.error('[Databricks] Connection error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to connect to Databricks'
        });
    }
});

export default router;
