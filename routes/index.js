const express = require('express');
const router = express.Router();
const pages = require('../controllers/pages');

router.get('/index', pages.getIndexProducts);

module.exports = router;