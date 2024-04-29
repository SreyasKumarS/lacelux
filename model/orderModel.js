const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      price: {
        type: Number,
        default: 0,
      },
      quantity: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: ["Pending", "Shipped", "Delivered", "cancelled","Returned"],
        default: "Pending",
      },
      cancelmessage:{
        type:Boolean,
        default:false
      }
    },
  ],
  totalPrice: {
    type: Number,
    default: 0,
  },
  billingDetails: {
    name: String,
    mobile: String,
    pincode: String,
    houseName: String,
    cityorTown: String,
    district: String,
    state: String,
    country: String,
    email: String,
  },
  paymentMethod: {
    type: String,
    
  },
  paymentStatus: {
    type: String,
    
  },
  couponDiscount: {
    type: Number,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model("Order", OrderSchema);