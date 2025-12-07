const express = require("express");
const routes = express.Router();
const addressController = require("../../controller/client/AddressController");

routes.get('/', addressController.index);
routes.post('/add', addressController.add);
routes.put('/edit/:id', addressController.edit);
routes.delete('/delete/:id', addressController.delete);
routes.put('/edit/:id', addressController.edit);
module.exports = routes;


