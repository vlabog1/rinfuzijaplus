const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 20;

exports.getIndexProducts = (req, res, next) => {
    Product.find()
      .then(products => {
        if(!req.user) {
          res.render('pages/index', {
            products: products,
            pageTitle: 'Naslovna',
            path: '/index',
            hasProducts: products.length > 0,
            role: false
        });
        } else {
            let role = req.user.role;
            res.render('pages/index', {
              products: products,
              pageTitle: 'Naslovna',
              path: '/index',
              hasProducts: products.length > 0,
              totalProducts: req.user.cart.items.length,
              firstname: req.user.firstname,
              lastname: req.user.lastname,
              isAuthenticated: req.session.isLoggedIn,
              role: role
          }); 
        }
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        console.log(err)
        return next(error);
     });

}

exports.getShopProducts =  (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
  Product.find().countDocuments().then(numProducts => {
    totalItems = numProducts;
    return Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  })
  .then(products => {
    if(!req.user) {
      res.render('pages/shop', {
        products: products,
        pageTitle: 'Prodavnica',
        path: '/shop',
        hasProducts: products.length > 0,
        activeShop: true,
        productCSS: true,
        isAuthenticated: req.session.isLoggedIn,
        role: false,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      firstPage: 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
    });
    } else {
        let role = req.user.role;
        res.render('pages/shop', {
          products: products,
          pageTitle: 'Prodavnica',
          path: '/shop',
          hasProducts: products.length > 0,
          activeShop: true,
          productCSS: true,
          isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        firstPage: 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        totalProducts: req.user.cart.items.length,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        role: role
      });
    }
  })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
     });
}

exports.getProductSingle = (req, res, next) => {
         if(!req.user) {
          const prodId = req.params.productId
          Product.findById(prodId)
          .then(product => {
                     return res.render('pages/product-single', {
                          product: product, 
                          pageTitle: product.title,
                          path: '/product-single',
                          isAuthenticated: req.session.isLoggedIn,
                          isAuthorised: false,
                      });
          })
          .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
         });
         } else {
          let role = req.user.role;
          const prodId = req.params.productId
          const cartProdId = req.user.cart.items
          let quantity = '1'
          Product.findById(prodId)
          .then(product => {
            cartProdId.forEach(items => {
            if(items.productId.toString() === prodId.toString()) {
                return quantity = items.quantity.toString()
            }
          })
           return res.render('pages/product-single', {
                product: product, 
                pageTitle: product.title,
                path: '/product-single',
                isAuthenticated: req.session.isLoggedIn,
                quantity: quantity,
                totalProducts: req.user.cart.items.length,
                role: role,
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
}

exports.getCart = (req, res, next) => {
    let role = req.user.role;
    req.user
      .populate('cart.items.productId')
      .execPopulate()
      .then(user => {
            //  console.log(user.cart.items);
             const products = user.cart.items;
             let total = 0;
             const numberOfProducts = products.length;
             products.forEach(p => {
                  total += p.quantity * p.productId.price;
             });

             res.render('pages/cart', { 
             pageTitle: 'Korpa', 
             path: '/cart',
             products: products,
             isAuthenticated: req.session.isLoggedIn,
             totalSum: total,
             totalProducts: numberOfProducts,
             role: role,
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

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    const quantity = req.body.quantity  || 1;
    Product.findById(prodId)
    .then(product => {
        return req.user.addToCart(product, quantity);
    })
    .then(result => {
            res.redirect('/cart');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
     });
}

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user
      .removeFromCart(prodId)
      .then(result => {
              res.redirect('/cart');
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
     });
}

exports.postOrder = (req, res, next) => {
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
           const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } };
           });
           const order = new Order({
            user: {
                 firstname: req.user.firstname,
                 lastname: req.user.lastname,
                 streetaddress: req.user.streetaddress,
                 housenumber: req.user.housenumber,
                 towncity: req.user.towncity,
                 postcodezip: req.user.postcodezip,
                 phone: req.user.phone,
                 email: req.user.email,
                 userId: req.user
            },
            products: products
       });
       return order.save();
    })
      .then(result => {
          return req.user.clearCart();
      })
      .then(() => {
            res.redirect('/order')
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
     });
}

exports.getOrders = (req, res, next) => {
      let role = req.user.role;
      Order.find({'user.userId': req.user._id})
        .then(orders => {
                    res.render('pages/order', {
                      path: '/orders',
                      pageTitle: 'Vaše narudžbine',
                      orders: orders,
                      isAuthenticated: req.session.isLoggedIn,
                      role: role,
                      totalProducts: req.user.cart.items.length,
                      firstname: req.user.firstname,
                      lastname: req.user.lastname
                    })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
         });
}

exports.getTotal = (req, res, next) => {
               let role = req.user.role;
               const orderId = order._id
               Order.findById(orderId).then(orderses => {
                let totalPrice = 0;
                orderses.products.forEach(prod => {
                      totalPrice = totalPrice + prod.quantity * prod.product.price;
                      console.log(totalPrice);
                });
                res.render('pages/order', {
                  path: '/orders',
                  pageTitle: 'Your Orders',
                  isAuthenticated: req.session.isLoggedIn,
                  role: role,
                  totalSum: totalPrice
                })
              })
              .catch(err => next(err));
}

exports.getCheckout = (req, res, next) => {
  let role = req.user.role;
  req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then(user => {
         const products = user.cart.items;
         let total = 0;
         products.forEach(p => {
              total += p.quantity * p.productId.price;
         });
         res.render('pages/checkout', {
         pageTitle: 'Ispravka', 
         path: '/checkout',
         products: products,
         isAuthenticated: req.session.isLoggedIn,
         role: role,
         totalSum: total,
         firstName: user.firstname,
         lastname: user.lastname,
         streetaddress: user.streetaddress,
         housenumber: user.housenumber,
         towncity: user.towncity,
         postcodezip: req.user.postcodezip,
         phone: req.user.phone,
         emailaddress: req.user.email,
         userId: req.user,
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

exports.getAbout = (req, res, next) => {
    if(!req.user) {
      res.render('pages/about', { 
        pageTitle: 'O nama', 
        path: '/about', 
        isAuthenticated: req.session.isLoggedIn,
        role: false
      });
    } else {
      let role = req.user.role;
      res.render('pages/about', { 
        pageTitle: 'O nama', 
        path: '/about', 
        isAuthenticated: req.session.isLoggedIn,
        totalProducts: req.user.cart.items.length,
        role: role,
        firstname: req.user.firstname,
        lastname: req.user.lastname
      });
    }
}

exports.getBlog = (req, res, next) => {
    if(!req.user) {
      res.render('pages/blog', {  
        pageTitle: 'Blog', 
        path: '/blog', 
        isAuthenticated: req.session.isLoggedIn,
        role: false
      });
    } else {
      let role = req.user.role;
      res.render('pages/blog', { 
        pageTitle: 'Blog', 
        path: '/blog', 
        isAuthenticated: req.session.isLoggedIn,
        totalProducts: req.user.cart.items.length,
        role: role,
        firstname: req.user.firstname,
        lastname: req.user.lastname
      });
    }
   
}

exports.getBlogSingle = (req, res, next) => {
    if(!req.user) {
      res.render('pages/blog-single', { 
        pageTitle: 'Blog proizvod', 
        path: '/blog-single', 
        isAuthenticated: req.session.isLoggedIn,
        role: false
      });
    } else {
      let role = req.user.role;
      res.render('pages/blog-single', { 
        pageTitle: 'Blog proizvod', 
        path: '/blog-single', 
        isAuthenticated: req.session.isLoggedIn, 
        totalProducts: req.user.cart.items.length,
        role: role,
        firstname: req.user.firstname,
        lastname: req.user.lastname 
      });
    }
    
}

exports.getContact = (req, res, next) => {
    if(!req.user) {
      res.render('pages/contact', { 
        pageTitle: 'Kontakt', 
        path: '/contact', 
        isAuthenticated: req.session.isLoggedIn,
        role: false
      });
    } else {
      let role = req.user.role;
      res.render('pages/contact', { 
        pageTitle: 'Kontakt', 
        path: '/contact', 
        isAuthenticated: req.session.isLoggedIn,
        totalProducts: req.user.cart.items.length,
        role: role,
        firstname: req.user.firstname,
        lastname: req.user.lastname
      });
    }
    
}

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    console.log(orderId);
    Order.findById(orderId).then(order => {
         console.log(order)
         if(!order) {
               return next(new Error('No order found.'));
         }
         if(order.user.userId.toString() !== req.user._id.toString()) {
              return next(new Error('Unauthorized'));
         }
         const invoiceName = 'invoice-' + orderId + '.pdf';
         const invoicePath = path.join('data', 'invoices', invoiceName);

         const pdfDoc = new PDFDocument();
         res.setHeader('Content-Type', 'application/pdf');
         res.setHeader('Content-Disposition', 'inline; filename="'+ invoiceName +'"');
         pdfDoc.pipe(fs.createWriteStream(invoicePath));
         pdfDoc.pipe(res);

         pdfDoc.fontSize(26).text('Ukupan racun za korisnika' + ` ${order.user.firstname + ' ' + order.user.lastname}`, {
              underline: true
         });
         
         pdfDoc.text('-----------------------------------------');
         let totalPrice = 0;
         order.products.forEach(prod => {
               totalPrice = totalPrice + prod.quantity * prod.product.price;
               pdfDoc.fontSize(14).text( prod.quantity + ' x ' + '$' + prod.product.price + ' === ' + `${prod.product.title}`);
               console.log(prod.quantity)
         }); 
         pdfDoc.text('-----------------------------------------');
         pdfDoc.fontSize(18).text('Ukupan zbir: din' + totalPrice);
   
         pdfDoc.end();
    }).catch(err => next(err));
}


