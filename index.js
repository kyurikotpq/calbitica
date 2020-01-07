/**
 * REQUIRING STUFF
 * 
 */
require('dotenv').config(); // env
const express = require('express'); // EXPRESS
const cookieSession = require('cookie-session'); // cookie
const mongoose = require('mongoose'); // mongoose

// Import route files and websocket controller
let api = require('./routes/api/index');
let mvc = require('./routes/mvc/index');

let apiErrorHandler = require('./middleware/api-error');

// Setup app, static assets, view engine, cookie
let app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(cookieSession({
    name: 'calbitica',
    keys: [process.env.COOKIE_KEY],

    // Cookie Options
    cookie: {
        secure: true,
        httpOnly: true,
        domain: process.env.DOMAIN,
        maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days
    }
}));

// connect to mongodb
mongoose.connect(process.env.MONGO_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    },
    () => {
        console.log('Successfully connected to MongoDB')
    }
);

// Frontend portion
app.use('/', mvc.dashboard);
app.use('/auth', mvc.auth);
app.use('/settings', mvc.settings);

// API portion
// Accept JSON only
app.use(express.json())
app.use('/api/settings', api.settings);
app.use('/api/h', api.habitica);
app.use('/api/calbit', api.calbit);
app.use('/api/cal', api.calendar);
app.use('/api/auth', api.auth);

// Error handling portion
app.use(apiErrorHandler);

// Web portion
const MVC_PORT = 3000;
app.listen(MVC_PORT, () => {
    console.log('Calbitica started! Visit http://localhost:' + MVC_PORT);
});
