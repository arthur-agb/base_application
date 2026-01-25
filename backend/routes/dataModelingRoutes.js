// backend/routes/dataModelingRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import {
    getGroups,
    createGroup,
    deleteGroup,
    getModelsByGroup,
    getModelDetails,
    saveModel,
    deleteModel,
    executeModelQuery,
    executeDraftModelQuery,
    validateCardinality,
    batchValidateCardinality
} from '../controllers/dataModeling.tenant.controller.js';

const router = express.Router();

// Group routes
router.route('/groups')
    .get(protect, tenantContext, getGroups)
    .post(protect, tenantContext, createGroup);

router.route('/groups/:id')
    .delete(protect, tenantContext, deleteGroup);

// Model routes
router.route('/groups/:groupId/models')
    .get(protect, tenantContext, getModelsByGroup);

router.route('/models/save')
    .post(protect, tenantContext, saveModel);

router.route('/models/:id')
    .get(protect, tenantContext, getModelDetails)
    .delete(protect, tenantContext, deleteModel);

router.route('/models/:id/execute')
    .get(protect, tenantContext, executeModelQuery);

router.route('/models/execute-draft')
    .post(protect, tenantContext, executeDraftModelQuery);

router.route('/validate-cardinality')
    .post(protect, tenantContext, validateCardinality);

router.route('/validate-model-cardinality')
    .post(protect, tenantContext, batchValidateCardinality);

export default router;
