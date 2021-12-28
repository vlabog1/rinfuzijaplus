const express = require('express');
const router = express.Router();
const pages = require('../controllers/pages');

router.get('/about', pages.getAbout);

module.exports = router;