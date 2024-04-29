const mongoose = require('mongoose')
const couponSchema = mongoose.Schema({
    userId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    coupon:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        default:true
    },
    percentage:{
        type:Number,
        required:true
    },
    minimumamount:{
        type:Number,
        required:true
    },
    maximumamount:{
        type:Number,
        required:true
    },
    expiryDate:{
        type:Date,
    }
})

module.exports= mongoose.model('Coupon',couponSchema)