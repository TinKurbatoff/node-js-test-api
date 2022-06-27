var express = require('express');
const router = express.Router();

// Get validators (middleware data converters )
// if it would grow — will separate into several files
const { index, 
        post_shipment, get_shipment, 
        post_organization, get_organization,
        get_packs } = require('../middleware/validators');

  // API just presents itself (will populate with swagger)
router.get('/', index);  

// Shipment
router.post('/shipment/', post_shipment);
router.get('/shipment/:shipmentId?', get_shipment);

// Organization
router.post('/organization/', post_organization);
router.get('/organization/:organizationId?', get_organization);
  
// Packs
router.get('/packs/:units?', get_packs);

module.exports = router;