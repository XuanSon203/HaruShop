const express = require('express');
const routes = express.Router();
const CustomerController = require('../../controller/admin/AddressController');

routes.get('/', CustomerController.index);
routes.get('/stats', CustomerController.stats);
routes.put('/:id', CustomerController.update);
routes.delete('/:id', CustomerController.remove);

module.exports = routes;


