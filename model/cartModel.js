const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true
    },
    price: {
      type: Number,
      default: 0 
    },
    quantity: {
      type: Number,
      required: true,
    },
    cartDate:{
      type:Date,
      default: Date.now,
    }
  }
  ],

totalPrice: {
  type: Number,
  default: 0 
},

createdOn: {
  type: Date,
  default: Date.now
}
})

const Cart= mongoose.model('Cart',cartSchema);
module.exports= Cart;