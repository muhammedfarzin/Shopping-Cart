const db = require('../config/connection')
const collections = require('../config/collections')
const { response } = require('express')
const { resolve, reject } = require('promise')
const objectId = require('mongodb').ObjectID

module.exports = {
    addProducts: (products, callback) => {
        products.price=parseInt(products.price)
        db.get().collection('product').insertOne(products).then((data) => {
            callback(data.ops[0]._id)
        })
    },
    getAllProduct: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).removeOne({ _id: objectId(proId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getProductDetails: (proId) => {
        console.log(proId);
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            proDetails.price=parseInt(proDetails.price)
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    name: proDetails.name,
                    category: proDetails.category,
                    price: proDetails.price,
                    description: proDetails.description
                }
            }).then(() => {
                resolve()
            })
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([{
                $match: { user: objectId(userId) }
            }, {
                $unwind:'$products'
            },{
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },{
                $lookup:{
                    from:collections.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },{
                $project:{
                    item:1,
                    quantity:1,
                    product:{$arrayElemAt:['$product',0]}
                }
            }
                /* $lookup: {
                    from: collections.PRODUCT_COLLECTION,
                    let: { proList: '$products' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $in: ['$_id', '$$proList']
                            }
                        }
                    }], as: 'cartItems'
                } */
            /* } */]).toArray()
            resolve(cartItems)
        })
    }
}