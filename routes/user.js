var express = require('express');
var router = express.Router();
const productHelper = require('../helpers/product-helpers');
const userHelper = require('../helpers/user-helpers')


const db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const collections = require('../config/collections');
const { NotFound } = require('http-errors');
const { response } = require('express');
const objectId = require('mongodb').ObjectID



const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', function (req, res, next) {
  productHelper.getAllProduct().then(async (products) => {
    let cartCount = null
    let user = req.session.user
    if (user) {
      cartCount = await userHelper.getCartCount(user._id)
    }
    res.render('user/view-products', { title: 'Shopping Cart', products, user, cartCount })
  })
});

router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { title: 'Login', loginErr: req.session.loginErr })
    req.session.loginErr = null
  }
})

router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginErr = 'invalid username or password'
      res.redirect('/login')
    }
  })
})

router.get('/signup', (req, res) => {
  res.render('user/signup', { title: 'Signup' })
})

router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    req.session.loggedIn = true
    req.session.user = response
    res.redirect('/login')
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/delete-account/:id', (req, res) => {
  let userId = req.params.id
  userHelper.deleteAccount(userId).then((response) => {
    req.session.destroy()
    res.redirect('/')
  })
})

router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user
  if (user) {
    cartCount = await userHelper.getCartCount(user._id)
  }
  let products = await productHelper.getCartProducts(user._id)
  console.log(products);
  let totalAmount = await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/cart', { title: 'Cart', user, products, totalAmount, cartCount })
})

router.get('/add-to-cart/:proId', async(req, res) => {
  userHelper.addToCart(req.params.proId, req.session.user._id).then(async() => {
    res.json({ status: true, cartCount })
  })
})

router.post('/change-product-quantity', (req, res, next) => {
  userHelper.changeProductQuantity(req.body).then(async (count) => {
    proId = req.body.product
    let cartCount=await userHelper.getCartCount(req.body.user)
    let total = await userHelper.getTotalAmount(req.body.user)
    res.json({ status: true, count, proId, total, cartCount })
  })
})

router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelper.getTotalAmount(req.session.user._id)
  let user = req.session.user
  res.render('user/address', { total, user })
})

router.post('/place-order', async (req, res) => {
  let products = await userHelper.getCartProductList(req.body.userId)
  let totalPrice = await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body, products, totalPrice).then((orderId) => {
    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    } else {
      userHelper.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }
  })
})

router.get('/order-success', verifyLogin, async(req, res) => {
  user=req.session.user
  if (user) {
    cartCount = await userHelper.getCartCount(user._id)
  }
  res.render('user/order-success',{user,cartCount})
})

router.get('/orders', verifyLogin, async (req, res) => {
  let orders = await userHelper.getUserOrders(req.session.user._id)
  user = req.session.user
  if (user) {
    cartCount = await userHelper.getCartCount(user._id)
  }
  res.render('user/orders', { user, orders,cartCount })
})

router.get('/view-order-products/:id',verifyLogin, async (req, res) => {
  let user=req.session.user
  if (user) {
    cartCount = await userHelper.getCartCount(user._id)
  }
  let products = await userHelper.getOrderProducts(req.params.id)
  res.render('user/view-order-products', { products,user,cartCount })
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelper.verifyPayment(req.body).then((response) => {
    console.log(response);
    userHelper.changePaymentStatus(req.body['order[receipt]'])
    res.json({ status: true })
  }).catch(() => {
    console.log('Payment Failed');
    res.json({ status: false })
  })
})

router.post('/delete-cart-product',(req,res)=>{
  
})

module.exports = router;
