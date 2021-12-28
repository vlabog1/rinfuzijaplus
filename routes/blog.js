const express = require('express');
const router = express.Router();
const pages = require('../controllers/pages');


router.get('/blog', pages.getBlog);
router.get('/blog-single', pages.getBlogSingle);

module.exports = router;