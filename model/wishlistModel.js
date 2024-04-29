const mongoose = require("mongoose");


const wishListSchema = mongoose.Schema({

  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  items:[{
    product:{
      type: mongoose.Schema.Types.ObjectId,   
      ref: "product",
      required: true,
    },
    wishDate: {
      type: Date,
      default: Date.now,
    }
  }]
},
);



const Wishlist = mongoose.model("Wishlist", wishListSchema);

module.exports = Wishlist;