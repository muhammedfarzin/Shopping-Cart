const db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const collections = require('../config/collections')
const { resolve, reject } = require('promise')
const objectId = require('mongodb').ObjectID
const Razorpay = require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_FeUTYV5p0xgxmK',
    key_secret: 'peTXFDg8827fYVUZZ3a9ra5I',
});

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(async (data) => {

                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
                resolve(user)
            })
        })
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log('Login Success');
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('Login Failed');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('Login Failed');
                resolve({ status: false })
            }
        })
    },
    deleteAccount: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).removeOne({ _id: objectId(userId) }).then((response) => {
                resolve(response)
            })
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collections.CART_COLLECTION).updateOne({ 'products.item': objectId(proId) }, {
                        $inc: { 'products.$.quantity': 1 }
                    }).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collections.CART_COLLECTION).updateOne({ user: objectId(userId) }, {
                        $push: { products: proObj }
                    }).then((response) => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            } resolve(count)
        })
    },
    changeProductQuantity: (data) => {
        return new Promise((resolve, reject) => {
            data.count = parseInt(data.count)
            db.get().collection(collections.CART_COLLECTION).updateOne({ _id: objectId(data.cart), 'products.item': objectId(data.product) }, {
                $inc: { 'products.$.quantity': data.count }
            }).then(async (response) => {
                let count = await db.get().collection(collections.CART_COLLECTION).findOne({ _id: objectId(data.cart) })
                count = count.products
                count.forEach((item, index) => {
                    if (item.item == data.product) {
                        count = item.quantity
                        resolve(count)
                    }
                })
            })
        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collections.CART_COLLECTION).aggregate([{
                $match: { user: objectId(userId) }
            }, {
                $unwind: '$products'
            }, {
                $project: {
                    item: '$products.item',
                    quantity: '$products.quantity'
                }
            }, {
                $lookup: {
                    from: collections.PRODUCT_COLLECTION,
                    localField: 'item',
                    foreignField: '_id',
                    as: 'product'
                }
            }, {
                $project: {
                    item: 1,
                    quantity: 1,
                    product: { $arrayElemAt: ['$product', 0] }
                }
            }, {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                }
            }
            ]).toArray()
            resolve(total[0].total)
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            let status = order["payment-method"] === 'COD' ? 'Placed' : 'Pending'
            let orderObj = {
                userId: objectId(order.userId),
                deliveryDetails: {
                    Mobile: order.Mobile,
                    Address: order.Address,
                    Pincode: order.Pincode
                },
                paymentMethod: order["payment-method"],
                products: products,
                totalAmount: total,
                date: new Date(),
                status: status
            }
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collections.CART_COLLECTION).removeOne({ user: objectId(order.userId) })
                resolve(response.ops[0]._id)
            })
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()
            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },
    generateRazorpay: (orderId,totalAmount) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalAmount*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ''+orderId
              };
              instance.orders.create(options, function(err, order) {
                  if(err){
                      console.log('genRzpErr: ',err);
                  }else{
                    console.log('genRzpOrd: ',order);
                  }
                resolve(order)
              });
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'peTXFDg8827fYVUZZ3a9ra5I');
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            console.log(hmac);
            console.log(details['payment[razorpay_signature]']);
            hmac=details['payment[razorpay_signature]']

            if(hmac==details['payment[razorpay_signature]']){
                resolve('if success')
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
        {
            $set:{
                status:'Placed'
            }
        }).then(()=>{
            resolve()
        })
    },
    DeleteCartProduct:(cartId,proId)=>{
        return new Promise((resolve,reject)=>{
            
        })
    }
}