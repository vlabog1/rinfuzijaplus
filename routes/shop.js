const express = require('express');
const router = express.Router();
const pages = require('../controllers/pages');

router.get('/', pages.getShopProducts);
router.get('/product-single/:productId', pages.getProductSingle);

module.exports = router;