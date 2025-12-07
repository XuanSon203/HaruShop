const express = require("express");
const router = express.Router();
const SearchController = require("../../controller/client/SearchController");

// GET /search?q=...&limit=...&type=...
router.get("/", SearchController.searchAll);

// GET /search/suggestions?q=...
router.get("/suggestions", SearchController.getSuggestions);

// GET /search/popular?category=...&limit=...
router.get("/popular", SearchController.getPopular);

module.exports = router;