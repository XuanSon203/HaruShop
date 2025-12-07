const express = require('express');
const routes = express.Router();
const homeController = require('../../controller/client/HomeController.js')
routes.get("/",homeController.index);

module.exports = routes;