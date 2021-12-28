const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const {validationResult} = require('express-validator/check');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}))

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    // console.log(req.flash('error'));
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        // isAuthenticated: req.session.isLoggedIn,
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
          },
          validationErrors: []
    })
}


exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        editing: false,
        isAuthenticated: req.session.isLoggedIn,
        isAuthorised: true,
        errorMessage: message,
        oldInput: {
            firstname: '',
            lastname: '',
            streetaddress: '', 
            housenumber: '',
            towncity: '',
            postcodezip: '',
            phone: '',
            email: '',
            password: '',
            confirmpassword: ''
        },
        validationErrors: []
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        // console.log(errors.array());
        return res.status(422)
         .render('auth/login', {
           path: '/login',
           pageTitle: 'Login',
           errorMessage: errors.array()[0].msg,
           oldInput: {
            email: email,
            password: password
          },
          validationErrors: errors.array()
       })
   }
    User.findOne({
            email: email
        })
        .then(user => {
            if (!user) {
                return res.status(422)
                .render('auth/login', {
                  path: '/login',
                  pageTitle: 'Login',
                  errorMessage: 'Invalid email or password.',
                  oldInput: {
                   email: email,
                   password: password
                 },
                 validationErrors: []
              })
            }
            bcrypt
                .compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err);
                            res.redirect('/index')
                        });
                    }
                    return res.status(422)
                    .render('auth/login', {
                      path: '/login',
                      pageTitle: 'Login',
                      errorMessage: 'Invalid email or password.',
                      oldInput: {
                       email: email,
                       password: password
                     },
                     validationErrors: []
                  })
                }).catch(err => {
                    console.log(err);
                    res.redirect('/login');
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
         });
}

exports.postSignup = (req, res, next) => {
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const streetaddress = req.body.streetaddress;
    const housenumber = req.body.housenumber;
    const towncity = req.body.towncity;
    const postcodezip = req.body.postcodezip;
    const phone = req.body.phone;
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        // console.log(errors.array());
         return res.status(422)
          .render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            editing: false,
            // isAuthenticated: req.session.isLoggedIn,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                firstname: firstname,
                lastname: lastname,
                streetaddress: streetaddress,
                housenumber: housenumber,
                towncity: towncity,
                postcodezip: postcodezip,
                phone: phone,
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: errors.array()
        })
    }
              bcrypt
                .hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({
                        firstname,
                        lastname,
                        streetaddress,
                        housenumber,
                        towncity,
                        postcodezip,
                        phone,
                        email,
                        password: hashedPassword,
                        cart: {
                            items: []
                        }
                    });
                    return user.save();
                })
                .then(result => {
                    res.redirect('/login');
                    return transporter.sendMail({
                        to: email,
                        from: 'rinfuzijaplus@em405.rinfuzijaplus.ga',
                        subject: 'Signup succeeded!',
                        html: '<h1>You successfully signed up in rinfuzijaplus web Shop!</h1>'
                    }).catch(err => {
                        console.log(err);
                    });

                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                 });
}


exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        res.redirect('/index');
    });
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    })
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({
                email: req.body.email
            }).then(user => {
                console.log(user);
                if (!user) {
                    req.flash('error', 'No account with that email found.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect('/');
                transporter.sendMail({
                    to: req.body.email,
                    from: 'rinfuzijaplus@em405.rinfuzijaplus.ga',
                    subject: 'Password Reset!',
                    html: `
                        <p>You requested a password reset</p>
                        <p>Click this <a href="http://localhost:4000/reset/${token}">link</a> to set a new password.</p>
                   `
                })
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
        console.log(user)
        let message = req.flash('error');
        if (message.length > 0) {
            message = message[0];
        } else {
            message = null;
        }
        res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'New Password',
            errorMessage: message,
            userId: user._id.toString(),
            passwordToken: token
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
     });
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken, 
        resetTokenExpiration: {$gt: Date.now()}, 
        _id: userId
    })
    .then(user => {
        resetUser = user;
          return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
    })
    .then(result => {
         res.redirect('/login');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
     });
}

exports.getResetMessage = (req, res, next) => {
    res.render('auth/reset-message')
}

exports.getUser = (req, res, next) => {
    let role = req.user.role;
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
        res.render('auth/user', {
            path: '/user',
            pageTitle: 'Korisnik',
            editing: false,
            isAuthenticated: req.session.isLoggedIn,
            isAuthorised: false,
            errorMessage: message,
            successMessage: null,
            oldInput: {
                firstname: req.user.firstname,
                lastname:  req.user.lastname,
                streetaddress:  req.user.streetaddress, 
                housenumber:  req.user.housenumber,
                towncity:  req.user.towncity,
                postcodezip:  req.user.postcodezip,
                phone:  req.user.phone,
                email:  req.user.email,
                password:  req.user.password,
                confirmpassword:  req.user.confirmPassword
            },
            validationErrors: [],
            totalProducts: req.user.cart.items.length,
            role: role,
            firstname: req.user.firstname,
            lastname: req.user.lastname
        })
}

exports.postUser = (req, res, next) => {
    const userId = req.user._id;

    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const streetaddress = req.body.streetaddress;
    const housenumber = req.body.housenumber;
    const towncity = req.body.towncity;
    const postcodezip = req.body.postcodezip;
    const phone = req.body.phone;
    const email = req.body.email;
    const errors = validationResult(req);
    // console.log(req.user._id)
    if(!errors.isEmpty()) {
        // console.log(errors.array(), 'ima greška');
        let role = req.user.role;
        return res.status(422)
          .render('auth/user', {
            path: '/user',
            pageTitle: 'Korisnik',
            editing: false,
            isAuthenticated: req.session.isLoggedIn,
            role: role,
            errorMessage: errors.array()[0].msg,
            successMessage: false,
            oldInput: {
                firstname: firstname,
                lastname: lastname,
                streetaddress: streetaddress,
                housenumber: housenumber,
                towncity: towncity,
                postcodezip: postcodezip,
                phone: phone,
                email: email
            },
            validationErrors: errors.array(),
            totalProducts: req.user.cart.items.length,
            firstname: firstname,
            lastname: lastname
        }).catch(err => console.log(err))
    } else {
        User.findById(userId)
          .then(user => {
                    user.firstname = firstname;
                    user.lastname = lastname;
                    user.streetaddress = streetaddress;
                    user.housenumber = housenumber;
                    user.towncity = towncity;
                    user.postcodezip = postcodezip;
                    user.phone = phone;
                    user.email = user.email;
                    user.password = user.password;
                
                return user.save()
          })
          .then(user => {
            let role = req.user.role;
            return res.status(422)
            .render('auth/user', {
              path: '/user',
              pageTitle: 'Korisnik',
              editing: false,
              isAuthenticated: req.session.isLoggedIn,
              role: role,
              errorMessage: false,
              successMessage: 'You are successfulie chenged your data',
              oldInput: {
                  firstname: firstname,
                  lastname: lastname,
                  streetaddress: streetaddress,
                  housenumber: housenumber,
                  towncity: towncity,
                  postcodezip: postcodezip,
                  phone: phone,
                  email: user.email
              },
              validationErrors: errors.array(),
              totalProducts: req.user.cart.items.length,
              firstname: user.firstname,
              lastname: user.lastname
            })
          }).catch(err => console.log(err))
    }     
}