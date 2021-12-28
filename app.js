const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');

const errorController = require('./controllers/error');
const User = require('./models/user');

// const mongoConnect = require('./util/database').mongoConnect;
const MONGODB_URI = 
   `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.mkffb.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

// const { userInfo } = require('os');
// const user = require('./models/user');
const app = express();
const store = new MongoDBStore({
   uri: MONGODB_URI,
   collection: 'sessions'
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'images');
   },
   filename: (req, file, cb) => {
      cb(null, file.filename + '-' + file.originalname);
   }
});

const fileFilter = (req, file, cb) => {
   if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
      cb(null, true);
   } else {
      cb(null, false);
   }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const indexRoutes = require('./routes/index');
const aboutRoutes = require('./routes/about');
const blogRoutes = require('./routes/blog');
const cartRoutes = require('./routes/cart');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(helmet());
app.use(compression());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
   session({
      secret: 'my secret',
      resave: false,
      saveUninitialized: false,
      store: store
   })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
   res.locals.isAuthenticated = req.session.isLoggedIn;
   res.locals.csrfToken = req.csrfToken();
   next();
})

app.use((req, res, next) => {
   if (!req.session.user) {
      return next();
   }
   User.findById(req.session.user._id)
      .then(user => {
         if (!user) {
            console.log('Not User')
            return next();
         }
         req.user = user;
         next();
      })
      .catch(err => {
         next(new Error(err));
      })
});

app.use(indexRoutes);
app.use(aboutRoutes);
app.use(blogRoutes);
app.use(cartRoutes);
app.use(contactRoutes);
app.use(adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) => {
   res.status(500).render('pages/500', {
      pageTitle: 'Error!',
      path: '/500',
      isAuthenticated: req.session.isLoggedIn
   });
});

// const port = process.env.PORT || 4000
// app.listen(port, () => console.log(`Listening on port ${port}...`));

// mongoConnect(() => {
//        app.listen(4000)
// })

mongoose
   .connect(MONGODB_URI)
   .then(result => {
      app.listen(process.env.PORT || 3000)
   })
   .catch(err => {
      console.log(err);
   })