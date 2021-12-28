const express = require('express');
const router = express.Router();
const pages = require('../controllers/pages');
const isAuth = require('../middleware/is-auth');

router.get('/cart', isAuth, pages.getCart);
router.post('/cart', isAuth, pages.postCart);
router.get('/checkout', isAuth, pages.getCheckout);
router.post('/cart-delete-item', isAuth, pages.postCartDeleteProduct);
router.get('/order', isAuth, pages.getOrders);
router.get('/checkout', isAuth, pages.getCheckout);
router.get('/order/:orderId', isAuth, pages.getInvoice);
router.post('/order', isAuth, pages.postOrder);

module.exports = router;