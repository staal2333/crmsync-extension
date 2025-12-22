const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const hubspotController = require('../controllers/hubspotController');
const salesforceController = require('../controllers/salesforceController');

// =====================================================
// HUBSPOT ROUTES
// =====================================================

// OAuth flow
router.get('/hubspot/connect', authenticateToken, hubspotController.hubspotConnect);
router.get('/hubspot/callback', hubspotController.hubspotCallback);

// Sync operations
router.post('/hubspot/sync-contact', authenticateToken, hubspotController.hubspotSyncContact);
router.post('/hubspot/sync-all', authenticateToken, hubspotController.hubspotSyncAll);
router.post('/hubspot/check-duplicate', authenticateToken, hubspotController.hubspotCheckDuplicate);

// Status & management
router.get('/hubspot/status', authenticateToken, hubspotController.hubspotStatus);
router.delete('/hubspot/disconnect', authenticateToken, hubspotController.hubspotDisconnect);

// =====================================================
// SALESFORCE ROUTES
// =====================================================

// OAuth flow
router.get('/salesforce/connect', authenticateToken, salesforceController.salesforceConnect);
router.get('/salesforce/callback', salesforceController.salesforceCallback);

// Sync operations
router.post('/salesforce/sync-contact', authenticateToken, salesforceController.salesforceSyncContact);
router.post('/salesforce/sync-all', authenticateToken, salesforceController.salesforceSyncAll);
router.post('/salesforce/check-duplicate', authenticateToken, salesforceController.salesforceCheckDuplicate);

// Status & management
router.get('/salesforce/status', authenticateToken, salesforceController.salesforceStatus);
router.delete('/salesforce/disconnect', authenticateToken, salesforceController.salesforceDisconnect);

module.exports = router;
