const express = require('express');
const { check, body } = require('express-validator/check');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', [
   body('email')
      .isEmail()
      .withMessage('Please enter a valid email.'),
   body(
      'password',
      'Please enter a password with only numbers and text and at least 5 characters.'
   )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
], authController.postLogin);

router.post('/signup', [
   check('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
         return User.findOne({
            email: value
         })
            .then(userDoc => {
               if (userDoc) {
                  return Promise.reject('E-mail exists already, please pick a differente one.');
               }
            })
      }),
   body(
      'password',
      'Please enter a password with only numbers and text and at least 5 characters.'
   )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
   body('confirmPassword').trim().custom((value, { req }) => {
      if (value !== req.body.password) {
         throw new Error('Passwords have to match!');
      }
      return true;
   }),
],
   authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', [
   body('email')
      .isLength({ min: 1 })
      .isEmail()
      .withMessage('Please enter a valid email.'),

], authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', [
   check('password')
      .isEmpty()
      .withMessage('Please enter a valid password')
      .isStrongPassword()
      .withMessage('Please enter a password with only numbers and text and at least 5 characters.')
      .isLength({ min: 5 })
      .withMessage('Please enter a password with only numbers and text and at least 5 characters.'),
], authController.postNewPassword);

router.get('/reset-message', authController.getResetMessage);

router.get('/user', authController.getUser);

router.post('/user', [
   check('firstname')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Please enter a valid Name'),
   check('lastname')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Please enter a valid Last Name'),
   check('streetaddress')
      .isLength({ min: 3 })
      .withMessage('Please enter a valid Address'),
   check('housenumber')
      .trim()
      .isNumeric()
      .withMessage('Please enter a valid Number address'),
   check('towncity')
      .isLength({ min: 2 })
      .withMessage('Please enter a valid Town name'),
   check('postcodezip')
      .trim()
      .isLength({ min: 5, max: 5 })
      .withMessage('Please enter a valid postcode'),
   check('phone')
      .trim()
      .isLength({ min: 9, max: 12 })
      .withMessage('Please enter a valid phone number'),
   check('email')
      .trim()
      .isEmail()
      .withMessage('Please enter a valid email.')
], authController.postUser);

module.exports = router;