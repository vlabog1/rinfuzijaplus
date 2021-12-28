const express = require('express');
const router = express.Router();
const pages = require('../controllers/pages');

router.get('/contact', pages.getContact);

module.exports = router;