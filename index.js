// ------------------ Fill the following details -----------------------------
// Student name: Amritpal Singh
// Student email: asingh2369@conestogac.on.ca

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { RSA_NO_PADDING } = require('constants');
mongoose.connect('mongodb://localhost:27017/final8020set3', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Order = mongoose.model('Order', {
    customerName: String,
    customerNumber: String,
    blizzards: Number,
    sundaes: Number,
    shakes: Number
});

const User = mongoose.model('User', {
    userLogin: String,
    userPass: String
});

var myApp = express();
myApp.use(session({
    secret: 'superrandomsecret',
    resave: false,
    saveUninitialized: true
}));
myApp.use(express.urlencoded({ extended: false }));

myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');

// constants
const CHOCOLATE_BLIZZARD_PRICE = 7.98;
const STRAWBERRY_SUNDAE_PRICE = 5.99;
const BLUEBERRY_SHAKE_PRICE = 5.49;
const TAX = 13.00;

// regular expressions
var customerNameRegex = /^[a-zA-Z]{1,}\s[a-zA-Z]{1,}$/
var customerNumberRegex = /^[0-9]{2}\-[a-zA-Z]{2}\-[0-9]{3}$/
var itemQuantityRegex = /^([1-9]|[1-9][0-9])$/

//function to check a string using regex
function checkRegex(userInput, regex) {
    if (regex.test(userInput)) {
        return true;
    }
    else {
        return false;
    }
}

// validation function for available items
function validateBlizzards(value, { req }) {
    // fetch data for items
    var blizzards = req.body.blizzards;

    // parse input into integer
    blizzards = parseInt(blizzards);

    if (isNaN(blizzards) || blizzards < 0) {
        throw new Error('Please enter a valid item quantity');
    }
    else if (!checkRegex(value, itemQuantityRegex)) {
        throw new Error('Please enter quantity between 1 and 99');
    }
    else {
        if (blizzards == null) {
            throw new Error('Invalid input for Blizzard');
        }
    }
    return true;
}

function validateSundaes(value, { req }) {
    // fetch data for items
    var sundaes = req.body.sundaes;

    // parse input into integer
    sundaes = parseInt(sundaes);

    if (isNaN(sundaes) || sundaes < 0) {
        throw new Error('Please enter a valid item quantity');
    }
    else if (!checkRegex(value, itemQuantityRegex)) {
        throw new Error('Please enter quantity between 1 and 99');
    }
    else {
        if (sundaes == null) {
            throw new Error('Invalid input for Sundae');
        }
    }
    return true;
}

function validateShakes(value, { req }) {
    // fetch data for items
    var shakes = req.body.shakes;

    // parse input into integer
    shakes = parseInt(shakes);

    if (isNaN(shakes) || shakes < 0) {
        throw new Error('Please enter a valid item quantity');
    }
    else if (!checkRegex(value, itemQuantityRegex)) {
        throw new Error('Please enter quantity between 1 and 99');
    }
    else {
        if (shakes == null) {
            throw new Error('Invalid input for Shake');
        }
    }
    return true;
}

//------------- Use this space only for your routes ---------------------------
// route to create order
myApp.get('/', function (req, res) {
    // use this to display the order form
    res.render('createOrder')
});

// create order from post
myApp.post('/process', [
    check('customerName', 'Please enter your full name.').matches(customerNameRegex),
    check('customerNumber', 'Please enter correct format NN-XX-NNN').matches(customerNumberRegex),
    check('blizzards', '').custom(validateBlizzards),
    check('sundaes', '').custom(validateSundaes),
    check('shakes', '').custom(validateShakes)
],
    function (req, res) {
        // use this to display the order form
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render('createOrder', {
                errors: errors.array()
            });
        }
        else {
            var customerName = req.body.customerName;
            var customerNumber = req.body.customerNumber;
            var blizzards = req.body.blizzards;
            var sundaes = req.body.sundaes;
            var shakes = req.body.shakes;

            //calculate purchase cost of each item
            var blizzardsPurchasePrice = blizzards * CHOCOLATE_BLIZZARD_PRICE;
            var sundaesPurchasePrice = sundaes * STRAWBERRY_SUNDAE_PRICE;
            var shakesPurchasePrice = shakes * BLUEBERRY_SHAKE_PRICE;

            // calculate sub total
            var subTotal = blizzardsPurchasePrice + sundaesPurchasePrice + shakesPurchasePrice;

            //calculate tax amount
            var taxAmount = (subTotal * TAX) / 100;

            //calculate total amount
            var totalAmount = subTotal + taxAmount;

            var receiptData = {
                customerName: customerName,
                customerNumber: customerNumber,
                blizzards: blizzards,
                sundaes: sundaes,
                shakes: shakes,
                CHOCOLATE_BLIZZARD_PRICE: CHOCOLATE_BLIZZARD_PRICE,
                STRAWBERRY_SUNDAE_PRICE: STRAWBERRY_SUNDAE_PRICE,
                BLUEBERRY_SHAKE_PRICE: BLUEBERRY_SHAKE_PRICE,
                TAX: TAX,
                blizzardsPurchasePrice: blizzardsPurchasePrice,
                sundaesPurchasePrice: sundaesPurchasePrice,
                shakesPurchasePrice: shakesPurchasePrice,
                subTotal: subTotal,
                taxAmount: taxAmount,
                totalAmount: totalAmount
            }

            var newOrder = new Order(receiptData);

            newOrder.save().then(function () {
                console.log('New Order Created Successfully');
            })

            res.render('receipt', receiptData);
        }
    }
);

// write any other routes here as needed

// login page
myApp.get('/login', function (req, res) {
    res.render('login')
});

//login from post
myApp.post('/login', function (req, res) {
    var userLogin = req.body.userLogin;
    var userPass = req.body.userPass;

    User.findOne({
        userLogin: userLogin,
        userPass: userPass
    }).exec(function (err, admin) {
        if (admin) {
            //store userLogin in session and set logged in true
            req.session.userLogin = admin.userLogin;
            req.session.userLoggedIn = true;

            //redirect to orders page to view all orders
            res.redirect('/orders');
        }
        else {
            res.render('login', { error: 'Invalid username or password. Please try again.' });
        }
    });
});

// route for view orders
myApp.get('/orders', function (req, res) {
    // use this to display all the orders when a user is logged in as admin
    if (req.session.userLoggedIn) {
        Order.find({}).exec(function (err, orders) {
            res.render('orders', {
                orders: orders
            });
        });
    }
    else {
        res.redirect('/login');
    }
});

// route for delete page
myApp.use('/orderDelete/:orderid', function (req, res) {
    if (req.session.userLoggedIn) {
        var orderid = req.params.orderid;

        Order.findByIdAndDelete({ _id: orderid }).exec(function (err, order) {
            if (order) {
                res.render('orderDelete', { message: 'Order Deleted Successfully' });
            }
            else {
                res.render('orderDelete', { message: 'Sorry, could not be Deleted' });
            }
        });
    }
    else {
        res.redirect('/login');
    }
});

// route for logout page
myApp.get('/logout', function (req, res) {
    if (req.session.userLoggedIn) {
        req.session.username = '';
        req.session.userLoggedIn = false;
        res.render('logout', { message: 'You have successfully logged out' })
    }
    else {
        res.redirect('/login');
    }
});

//---------- Do not modify anything below this other than the port ------------
//------------------------ Setup the database ---------------------------------

myApp.get('/setup', function (req, res) {

    let userData = [{
        'userLogin': 'admin',
        'userPass': 'admin'
    }];

    User.collection.insertMany(userData);

    var firstNames = ['John ', 'Alana ', 'Jane ', 'Will ', 'Tom ', 'Leon ', 'Jack ', 'Kris ', 'Lenny ', 'Lucas '];
    var lastNames = ['May', 'Riley', 'Rees', 'Smith', 'Walker', 'Allen', 'Hill', 'Byrne', 'Murray', 'Perry'];

    let ordersData = [];

    for (i = 0; i < 10; i++) {
        let tempMemb = Math.floor((Math.random() * 100)) + '-AB' + '-' + Math.floor((Math.random() * 1000))
        let tempName = firstNames[Math.floor((Math.random() * 10))] + lastNames[Math.floor((Math.random() * 10))];
        let tempOrder = {
            customerName: tempName,
            customerNumber: tempMemb,
            blizzards: Math.floor((Math.random() * 10)),
            sundaes: Math.floor((Math.random() * 10)),
            shakes: Math.floor((Math.random() * 10))
        };
        ordersData.push(tempOrder);
    }

    Order.collection.insertMany(ordersData);
    res.send('Database setup complete. You can now proceed with your exam.');

});

//----------- Start the server -------------------

myApp.listen(8080);// change the port only if 8080 is blocked on your system
console.log('Server started at 8080 for mywebsite...');