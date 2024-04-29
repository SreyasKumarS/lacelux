const cartModel=require("../../model/cartModel")
const productModel=require("../../model/addproductModel")
const userModel=require('../../model/userModel')
const orderModel=require("../../model/orderModel")




const loadcartpage = async function(req, res) {
  try {
    
      const userId = req.session.user._id;
      console.log(userId);
      const data = await cartModel.find({ userId: userId }).populate('items.product')
      //sorting for latest added product at top-----
      data.forEach(cart => {
        cart.items.sort((a, b) => new Date(b.cartDate) - new Date(a.cartDate));
      });
      
        
      res.render('user/cart-page', { user: req.session.user, data: data});
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
  }
}



//cart page function-------------------------------------------------

const cartpagefunction=async function(req,res){
  const userId=req.session.user._id;
  const productId=req.params.productId
  const quantity=1;
  
  if(!req.session.user)
  { res.redirect('/userlogin')} 
  else{

  const product= await productModel.findById(productId);
  if(!product || product.stock==0){
   return res.status(400).json({success:false,message:'Product is currently out of stock'})
  }
  
  let cart= await cartModel.findOne({userId})

  if(!cart){
    const newCart=new cartModel({
      userId:userId,
      items:[
        {
          product:productId,
          price:product.regularPrice,
          quantity:quantity,
          }
      ],
      totalPrice:product.regularPrice*quantity
    })
    await newCart.save();
    return res.status(200).json({ success: true, message: 'cart created' });
  }


  const existingProduct = cart.items.find(item => item.product.toString() === productId.toString());

  if (existingProduct) {
    const isInCart = true;
    return res.status(200).json({ success: true, message: 'Product already in cart', isInCart: isInCart });
  }
  cart.items.push({
    product: productId,
    quantity: quantity,
    price: product.regularPrice
  });
    cart.totalPrice = cart.items.reduce(
      (total,item)=> total + item.price * item.quantity,0
    )
    await cart.save();
    res.status(200).json({ success: true, message: 'Product added to cart successfully', cartId: cart._id });
  };}



//update quanity in cart page------------------------------------------------------------------------

const updateQuantity = async function(req, res) {
  try {
    const newQuantity = parseInt(req.body.quantity, 10);
    const userId = req.session.user._id;
    const productId = req.params.productId;
  

    const userCart = await cartModel.find({ userId: userId });
    

    let subtotal = 0; 

    if (userCart) {
      const cartItem = userCart[0].items.find(item => item.product.toString() === productId);
    if (cartItem) {
        subtotal = cartItem.price * newQuantity; 
        console.log(subtotal);
      }
    }
   
    const updateResult = await cartModel.updateOne(
      {
        userId: userId,
        "items.product": productId
      },
      {
        $set: { "items.$.quantity": newQuantity }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).send('Cart item not found');
    }
    const updatedCart = await cartModel.findOne({ userId: userId });

    if (!updatedCart) {
      return res.status(404).send('Cart not found');
    }
    updatedCart.totalPrice = updatedCart.items.reduce(
      (total, item) => total + item.price * item.quantity, 0
    );
    await updatedCart.save();

    res.status(200).json({
      success: true,
      message: 'Quantity updated successfully',
      totalPrice: updatedCart.totalPrice,
      subtotal: subtotal
    });
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).send('Internal server error');
  }
};



//remove product from cart-------------------------------------------------------

const removeProductFromTheCart = async (req, res) => {
  try {
    const productid = req.query.id;
    const userId = req.session.user._id;

    const result = await cartModel.updateOne(
      { userId: userId },
      { $pull: { items: { product: productid } } }
    );

    const updatedCart = await cartModel.findOne({ userId: userId });

    if (!updatedCart) {
      return res.status(404).send('Cart not found');
    }
    updatedCart.totalPrice = updatedCart.items.reduce(
      (total, item) => total + item.price * item.quantity, 0
    );

    await updatedCart.save(); 

    if (result.modifiedCount > 0) {
      res.json({ success: true, totalPrice: updatedCart.totalPrice }); 
    } else {
      res.json({ success: false });
    }

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};



//-----------------retryOrderFunction----------------------------------------------------------------

const retryOrderFunction = async function (req, res) {
  try {
    const userId = req.session.user._id;
    const orderId = req.params.orderId;
    console.log('Order ID:', orderId);

    // Find the order by ID using your original orderModel
    const order = await orderModel.findById(orderId);
    console.log('Found Order:', order);

    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentStatus === 'Pending') {
      console.log('Payment status is Pending');
      // Update the payment status to 'Paid'
      order.paymentStatus = 'Paid';
      await order.save();

      console.log('Payment status updated successfully');
      // Render the thank you page after updating the payment status
      res.json({ 
        success: true,
        message: 'Payment status updated successfully',
        orderId: orderId,
        userId: userId,
        user: req.session.user, // Include user session data all this for pdf invoice download
        order:order });


    } else {
      console.log('Order payment status is not Pending');
      return res.status(400).json({ error: 'Order payment status is not Pending' });
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

//-----------------------------------------------------------------------------------------

const loadretrythankyoupage= async function(req,res){
  try{


    const orderId = req.query.orderId;
    
    // Now you can use orderId, userId, user, and order as needed
    console.log('Order ID:', orderId);
    const order = await orderModel.findById(orderId)
  
    res.render('user/thankyou-page', {
      orderId: orderId,
      userId:req.session.user._id,
      order:order
    });

  }catch (error) {
    // Handle any errors that may occur during processing
    console.error('Error loading retry thank you page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};




module.exports={
  loadcartpage,
  cartpagefunction,
  updateQuantity,
  removeProductFromTheCart,
  retryOrderFunction,
  loadretrythankyoupage
}