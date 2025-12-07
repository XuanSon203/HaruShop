const express = require('express');
const router = express.Router();
const ctrl = require('../../controller/client/ShippingPublicController');

// Public endpoints (only active providers, with methods)
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);

module.exports = router;


