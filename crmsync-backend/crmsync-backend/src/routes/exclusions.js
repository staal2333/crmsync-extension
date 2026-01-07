/**
 * User Exclusions Routes
 * Routes for managing user exclusion rules
 */

const express = require('express');
const router = express.Router();
const exclusionsController = require('../controllers/exclusionsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get user's exclusions
router.get('/', exclusionsController.getExclusions);

// Save or create exclusions (upsert)
router.post('/', exclusionsController.saveExclusions);

// Update specific fields
router.patch('/', exclusionsController.updateExclusions);

// Delete exclusions
router.delete('/', exclusionsController.deleteExclusions);

module.exports = router;
