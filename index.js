/**
 * REQUIRING STUFF
 * 
 */
require('dotenv').config(); // env
const express = require('express'); // EXPRESS
const cookieSession = require('cookie-session'); // cookie
const mongoose = require('mongoose'); // mongoose

// Import route files
// let habits = require('./routes/api/habitica');
let mvc = require('./routes/mvc/index');

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
        useUnifiedTopology: true
    },
    () => {
        console.log('Successfully connected to MongoDB')
    }
);

// Frontend portion
app.use('/', mvc.dashboard);
app.use('/auth', mvc.auth);

// API portion
// Accept JSON only
app.use(express.json())
// app.use('/api/v1/habits', habits);

const PORT = 3000;
app.listen(PORT, () => {
    console.log('Calbitica started! Visit http://localhost:' + PORT);
});