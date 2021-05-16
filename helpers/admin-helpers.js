const db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const collections = require('../config/collections')
const { resolve, reject } = require('promise')
const objectId = require('mongodb').ObjectID

module.exports={
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collections.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection(collections.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    }
}