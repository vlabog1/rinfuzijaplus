const mongoose = require('mongoose');

const fileHelper = require('../util/file');
// const mongodb = require('mongodb');
const {validationResult} = require('express-validator/check');


const Product = require('../models/product');
const User = require('../models/user');
// const router = require('../routes/shop');

// const ObjectId = mongodb.ObjectId;

exports.getAddProduct = (req, res, next) => {
    let role = req.user.role;
    res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/add-product',
      editing: false,
      hasError: false,
      errorMessage: null,
      validationErrors: [],
      role: role,
      totalProducts: req.user.cart.items.length,
      firstname: req.user.firstname,
      lastname: req.user.lastname
    });
}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    if(!image) {
        let role = req.user.role;
        console.log('not image')
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/edit-product',
            editing: false, 
            hasError: true,
            product: {
                 title: title,
                 price: price,
                 description: description
            },
            errorMessage: 'Atached file is not an image.',
            validationErrors: [],
            role: role,
            totalProducts: req.user.cart.items.length,
            firstname: req.user.firstname,
            lastname: req.user.lastname
          });
    }
    
    const imageUrl = image.path;

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
            console.log(errors.array());
           
    }

    const product = new Product({
        
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user._id
    }
    );
    product
        .save()   
        .then(result => {
           console.log('Created Product');
           console.log(result)
          res.redirect('/update-product');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
         });
}

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    console.log(req.query, 'req.query.edit')
    if(!editMode) {
           return res.redirect('/');
    }
    let role = req.user.role;
    const prodId = req.params.productId;
    Product.findById(prodId)
         .then(product => {
             if(!product) {
                     return res.redirect('/');
             }
                res.render('admin/edit-product', {
                    pageTitle: 'Edit Product',
                    path: '/edit-product',
                    editing: editMode, 
                    product: product,
                    hasError: false,
                    errorMessage: null,
                    validationErrors: [],
                    role: role,
                    totalProducts: req.user.cart.items.length,
                    firstname: req.user.firstname,
                    lastname: req.user.lastname
                  });
         })
         .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
         });
}

exports.postEditProduct = (req, res, next) => {
       const prodId = req.body.productId;
       const updatedTitle = req.body.title;
       const updatedPrice = req.body.price;
       const image = req.file;
       const updatedDesc = req.body.description;
       const errors = validationResult(req);

    if(!errors.isEmpty()) {
            let role = req.user.role;
            return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true, 
            hasError: true,
            product: {
                 title: updatedTitle,
                 price: updatedPrice,
                 description: updatedDesc,
                 _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            role: role,
            totalProducts: req.user.cart.items.length,
            firstname: req.user.firstname,
            lastname: req.user.lastname
          });
    }
       
       Product.findById(prodId)
         .then(product => {
             if(product.userId.toString() !== req.user._id.toString()) {
                  return res.redirect('/index');
             }
             product.title = updatedTitle;
             product.price = updatedPrice;
             if(image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
             }
             
             product.description = updatedDesc;
             return product.save()
             .then(result => {
                console.log(result);
                res.redirect('/update-product');
             });
         })
         .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
         });
       
}

exports.getProduct = (req, res, next) => {
    Product.find({userId: req.user._id})
        //  .select('title price -_id')
        //  .populate('userId', 'name')
         .then(products => {
            let role = req.user.role;
            res.render('admin/update-product', {
                prods: products,
                pageTitle: 'Edit Products',
                path: '/update-product',
                isAuthenticated: req.session.isLoggedIn,
                role: role,
                totalProducts: req.user.cart.items.length,
                firstname: req.user.firstname,
                lastname: req.user.lastname
            });
         })
         .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
         });
}

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId).then(product => {
         if(!product) {
              return next(new Error('Product not found.'))
         }
         fileHelper.deleteFile(product.imageUrl,);
         return Product.deleteOne({_id: prodId, userId: req.user._id});
    })
    .then(() => { 
          console.log('Deleted One Product');
          res.status(200).json({message: 'Success!'});
    })
    .catch(err => {
          res.status(500).json({message: 'Deliting product failed.'});
     });
}

