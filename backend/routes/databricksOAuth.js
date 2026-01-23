// backend/routes/databricksOAuth.js
import express from 'express';
import crypto from 'crypto';
import { protect } from '../middleware/authMiddleware.js';
import Logger from '../utils/logger.js';

const router = express.Router();

// In-memory store for OAuth state (in production, use Redis or database)
const oauthStateStore = new Map();
const tokenStore = new Map(); // Store tokens per user

/**
 * @swagger
 * tags:
 *   name: Databricks OAuth
 *   description: Databricks SSO OAuth 2.0 authentication operations
 */

/**
 * Generate a random state parameter for CSRF protection
 */
const generateState = () => crypto.randomBytes(32).toString('hex');

/**
 * Generate PKCE code verifier and challenge
 */
const generatePKCE = () => {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');
    return { codeVerifier, codeChallenge };
};

/**
 * @swagger
 * /databricks/oauth/initiate:
 *   post:
 *     summary: Initiate Databricks OAuth SSO flow
 *     tags: [Databricks OAuth]
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
 *               - httpPath
 *             properties:
 *               host:
 *                 type: string
 *                 description: Databricks workspace hostname (e.g., adb-xxx.azuredatabricks.net)
 *               httpPath:
 *                 type: string
 *                 description: SQL Warehouse HTTP path (e.g., /sql/1.0/endpoints/xxxxx)
 *     responses:
 *       200:
 *         description: Returns the OAuth authorization URL for redirect
 */
router.post('/initiate', protect, async (req, res) => {
    try {
        const { host, httpPath } = req.body;
        const userId = req.user.id;

        if (!host || !httpPath) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required parameters: host and httpPath are mandatory.'
            });
        }

        // Validate host format
        if (!host.includes('databricks.net') && !host.includes('azuredatabricks.net')) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid Databricks host. Must be a valid Databricks workspace URL.'
            });
        }

        // Clean up host (remove protocol if present)
        const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/$/, '');

        // Generate state and PKCE for security
        const state = generateState();
        const { codeVerifier, codeChallenge } = generatePKCE();

        // Store state with user info and connection details (expires in 10 minutes)
        oauthStateStore.set(state, {
            userId,
            host: cleanHost,
            httpPath,
            codeVerifier,
            createdAt: Date.now(),
            expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
        });

        // Clean up expired states
        cleanupExpiredStates();

        // Build the Databricks OAuth authorization URL
        // Databricks uses their own OAuth server or Azure AD depending on workspace config
        const redirectUri = `${process.env.API_BASE_URL || 'https://' + process.env.ROOT_DOMAIN}/api/databricks/oauth/callback`;

        // Databricks OAuth 2.0 authorization endpoint
        // For Azure Databricks, this goes through the workspace's OAuth endpoint
        const authUrl = new URL(`https://${cleanHost}/oidc/v1/authorize`);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', process.env.DATABRICKS_CLIENT_ID || 'databricks-sql-connector');
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', 'sql offline_access');
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');

        Logger.info(`[Databricks OAuth] Initiated SSO flow for user ${userId} to workspace ${cleanHost}`);

        res.json({
            status: 'success',
            authorizationUrl: authUrl.toString(),
            message: 'Redirect the user to this URL to complete SSO authentication.'
        });

    } catch (error) {
        Logger.error('[Databricks OAuth] Error initiating OAuth flow:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to initiate OAuth flow. Please try again.'
        });
    }
});

/**
 * @swagger
 * /databricks/oauth/callback:
 *   get:
 *     summary: OAuth callback endpoint - handles the redirect from Databricks
 *     tags: [Databricks OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Authorization code from Databricks
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         required: true
 *         description: State parameter for CSRF validation
 *     responses:
 *       302:
 *         description: Redirects back to the application
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;

        // Handle OAuth errors from Databricks
        if (error) {
            Logger.error(`[Databricks OAuth] Error from provider: ${error} - ${error_description}`);
            return res.redirect(`${process.env.FRONTEND_URL || ''}/datasource?error=${encodeURIComponent(error_description || error)}`);
        }

        if (!code || !state) {
            return res.redirect(`${process.env.FRONTEND_URL || ''}/datasource?error=${encodeURIComponent('Missing authorization code or state')}`);
        }

        // Validate state
        const storedState = oauthStateStore.get(state);
        if (!storedState) {
            Logger.warn('[Databricks OAuth] Invalid or expired state parameter');
            return res.redirect(`${process.env.FRONTEND_URL || ''}/datasource?error=${encodeURIComponent('Session expired. Please try again.')}`);
        }

        // Check if state has expired
        if (Date.now() > storedState.expiresAt) {
            oauthStateStore.delete(state);
            return res.redirect(`${process.env.FRONTEND_URL || ''}/datasource?error=${encodeURIComponent('Session expired. Please try again.')}`);
        }

        const { userId, host, httpPath, codeVerifier } = storedState;

        // Exchange authorization code for tokens
        const redirectUri = `${process.env.API_BASE_URL || 'https://' + process.env.ROOT_DOMAIN}/api/databricks/oauth/callback`;

        const tokenResponse = await fetch(`https://${host}/oidc/v1/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: process.env.DATABRICKS_CLIENT_ID || 'databricks-sql-connector',
                code_verifier: codeVerifier,
            }).toString(),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            Logger.error(`[Databricks OAuth] Token exchange failed: ${errorData}`);
            return res.redirect(`${process.env.FRONTEND_URL || ''}/datasource?error=${encodeURIComponent('Failed to complete authentication')}`);
        }

        const tokens = await tokenResponse.json();

        // Store tokens securely (in production, encrypt and store in database)
        tokenStore.set(userId, {
            host,
            httpPath,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + (tokens.expires_in * 1000),
            createdAt: Date.now()
        });

        // Clean up used state
        oauthStateStore.delete(state);

        Logger.info(`[Databricks OAuth] Successfully authenticated user ${userId} to workspace ${host}`);

        // Redirect back to the app with success
        res.redirect(`${process.env.FRONTEND_URL || ''}/datasource?success=true&host=${encodeURIComponent(host)}`);

    } catch (error) {
        Logger.error('[Databricks OAuth] Callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || ''}/datasource?error=${encodeURIComponent('Authentication failed. Please try again.')}`);
    }
});

/**
 * @swagger
 * /databricks/oauth/status:
 *   get:
 *     summary: Check if user has a valid Databricks connection
 *     tags: [Databricks OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection status
 */
router.get('/status', protect, async (req, res) => {
    const userId = req.user.id;
    const connection = tokenStore.get(userId);

    if (!connection) {
        return res.json({
            connected: false,
            message: 'No active Databricks connection'
        });
    }

    // Check if token is expired
    if (Date.now() > connection.expiresAt) {
        // Attempt to refresh the token
        try {
            const refreshed = await refreshToken(userId, connection);
            if (refreshed) {
                return res.json({
                    connected: true,
                    host: connection.host,
                    httpPath: connection.httpPath,
                    message: 'Connected to Databricks'
                });
            }
        } catch (error) {
            Logger.error('[Databricks OAuth] Token refresh failed:', error);
        }

        tokenStore.delete(userId);
        return res.json({
            connected: false,
            message: 'Session expired. Please reconnect.'
        });
    }

    res.json({
        connected: true,
        host: connection.host,
        httpPath: connection.httpPath,
        message: 'Connected to Databricks'
    });
});

/**
 * @swagger
 * /databricks/oauth/disconnect:
 *   post:
 *     summary: Disconnect from Databricks
 *     tags: [Databricks OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Disconnected successfully
 */
router.post('/disconnect', protect, async (req, res) => {
    const userId = req.user.id;
    tokenStore.delete(userId);

    Logger.info(`[Databricks OAuth] User ${userId} disconnected from Databricks`);

    res.json({
        status: 'success',
        message: 'Disconnected from Databricks'
    });
});

/**
 * @swagger
 * /databricks/oauth/query:
 *   post:
 *     summary: Execute a query on Databricks using SSO authentication
 *     tags: [Databricks OAuth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 example: SELECT * FROM main.default.sales LIMIT 10
 *     responses:
 *       200:
 *         description: Query results
 */
router.post('/query', protect, async (req, res) => {
    const userId = req.user.id;
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({
            status: 'error',
            message: 'Query is required'
        });
    }

    const connection = tokenStore.get(userId);

    if (!connection) {
        return res.status(401).json({
            status: 'error',
            message: 'Not connected to Databricks. Please authenticate first.',
            requiresAuth: true
        });
    }

    // Check and refresh token if needed
    if (Date.now() > connection.expiresAt) {
        try {
            const refreshed = await refreshToken(userId, connection);
            if (!refreshed) {
                tokenStore.delete(userId);
                return res.status(401).json({
                    status: 'error',
                    message: 'Session expired. Please reconnect.',
                    requiresAuth: true
                });
            }
        } catch (error) {
            tokenStore.delete(userId);
            return res.status(401).json({
                status: 'error',
                message: 'Session expired. Please reconnect.',
                requiresAuth: true
            });
        }
    }

    // Apply LIMIT safety
    let sanitizedQuery = query.trim();
    const limitRegex = /LIMIT\s+\d+/i;
    if (!limitRegex.test(sanitizedQuery)) {
        sanitizedQuery = `${sanitizedQuery} LIMIT 100`;
    }

    try {
        // Execute query using Databricks SQL Statement API
        const statementResponse = await fetch(
            `https://${connection.host}/api/2.0/sql/statements`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${connection.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    warehouse_id: extractWarehouseId(connection.httpPath),
                    statement: sanitizedQuery,
                    wait_timeout: '30s',
                }),
            }
        );

        if (!statementResponse.ok) {
            const errorData = await statementResponse.json();
            Logger.error('[Databricks OAuth] Query execution failed:', errorData);
            return res.status(statementResponse.status).json({
                status: 'error',
                message: errorData.message || 'Query execution failed'
            });
        }

        const result = await statementResponse.json();

        // Transform response to our format
        const columns = result.manifest?.schema?.columns?.map(c => c.name) || [];
        const data = result.result?.data_array || [];

        res.json({
            status: 'success',
            queryUsed: sanitizedQuery,
            results: {
                columns,
                data
            }
        });

    } catch (error) {
        Logger.error('[Databricks OAuth] Query error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to execute query'
        });
    }
});

/**
 * Helper function to refresh an expired token
 */
async function refreshToken(userId, connection) {
    if (!connection.refreshToken) {
        return false;
    }

    try {
        const tokenResponse = await fetch(`https://${connection.host}/oidc/v1/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: connection.refreshToken,
                client_id: process.env.DATABRICKS_CLIENT_ID || 'databricks-sql-connector',
            }).toString(),
        });

        if (!tokenResponse.ok) {
            return false;
        }

        const tokens = await tokenResponse.json();

        // Update stored tokens
        tokenStore.set(userId, {
            ...connection,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || connection.refreshToken,
            expiresAt: Date.now() + (tokens.expires_in * 1000),
        });

        return true;
    } catch (error) {
        Logger.error('[Databricks OAuth] Token refresh error:', error);
        return false;
    }
}

/**
 * Extract warehouse ID from HTTP path
 */
function extractWarehouseId(httpPath) {
    // HTTP path format: /sql/1.0/warehouses/xxx or /sql/1.0/endpoints/xxx
    const match = httpPath.match(/\/(warehouses|endpoints)\/([a-z0-9]+)/i);
    return match ? match[2] : null;
}

/**
 * Clean up expired OAuth states
 */
function cleanupExpiredStates() {
    const now = Date.now();
    for (const [state, data] of oauthStateStore.entries()) {
        if (now > data.expiresAt) {
            oauthStateStore.delete(state);
        }
    }
}

export default router;
