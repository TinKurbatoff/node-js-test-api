var express = require('express');
const router = express.Router();

// Get controllers
const index_controller = require('../middleware/validators');
const shipment_controller = require('../middleware/validators'); // for further separaton
const organization_controller = require('../middleware/validators'); // for further separaton
const packs_controller = require('../middleware/validators'); // for further separaton

  // API just presents itself (will populate with swagger)
router.get('/', index_controller.index);  

// Shipment
router.post('/shipment/', shipment_controller.post_shipment);
router.get('/shipment/:shipmentId?', shipment_controller.get_shipment);

// Organization
router.post('/organization/', organization_controller.post_organization);
router.get('/organization/:organizationId?', organization_controller.get_organization);
  
// Packs
router.get('/packs/:units?', packs_controller.get_packs);

module.exports = router;