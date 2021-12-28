const path = require('path');

const express = require('express');

const { check, body } = require('express-validator/check');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const router = express.Router();


// // /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// // /admin/add-product => POST
router.get('/update-product', isAuth, adminController.getProduct);

// // /admin/add-product => update and delete
router.post('/add-product', [
   body('title')
      .isString()
      .isLength({ min: 3 })
      .trim(),
   body('price')
      .isFloat(),
   body('description')
      .isLength({ min: 5, max: 200 })
      .trim()
], isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
   body('title')
      .isString()
      .isLength({ min: 3 })
      .trim(),
   body('price')
      .isFloat(),
   body('description')
      .isLength({ min: 5, max: 200 })
      .trim()
], isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;