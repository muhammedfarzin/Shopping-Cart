var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var adminHelpers=require('../helpers/admin-helpers')
var userHelpers=require('../helpers/user-helpers')

/* GET users listing. */
router.get('/', function (req, res, next) {

  productHelpers.getAllProduct().then((products) => {
    res.render('admin/view-products', { title: 'Admin Panel', admin: true, products })

  })
});

router.get('/add-product', (req, res) => {
  res.render('admin/add-product', {title: 'Add Product', admin:true})
})

router.post('/add-product', (req, res) => {
  productHelpers.addProducts(req.body, (id) => {
    let image = req.files.Image
    image.mv('./public/product-images/' + id + '.jpg', (err) => {
      if (!err) {
        res.render('admin/add-product', { title: 'Add Product', admin:true })
      } else {
        console.log(err);
      }
    })
  })
})

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin')
  })
})

router.get('/edit-product/:id',async(req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit-product',{title:'Edit Product',admin:true,product})
})

router.post('/edit-product/:id',(req,res)=>{
  let proId=req.params.id
  let proDetails=req.body
  productHelpers.updateProduct(proId,proDetails).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/product-images/'+proId+'.jpg')
    }
  })
})

router.get('/orders',async(req,res)=>{
  let orders=await adminHelpers.getAllOrders()
  res.render('admin/view-all-orders',{orders,admin:true})
})

router.get('/users',async(req,res)=>{
  let users=await adminHelpers.getAllUsers()
  console.log(users);
  res.render('admin/view-all-users',{users,admin:true})
})

router.get('/delete-account/:id', (req, res) => {
  let userId = req.params.id
  userHelpers.deleteAccount(userId).then((response) => {
    res.redirect('/admin/users')
  })
})

router.get('/orders/:id',async(req,res)=>{
  let orders=await userHelpers.getUserOrders(req.params.id)
  res.render('admin/orders',{orders,admin:true})
})

router.get('/users/view-order-products/:id',async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  res.render('admin/view-order-products',{products,admin:true})
})

module.exports = router;
