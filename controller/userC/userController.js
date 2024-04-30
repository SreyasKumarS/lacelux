const userHelper= require("../../helper/userHelper")
const productModel=require("../../model/addproductModel")
const userModel=require("../../model/userModel")
const cartModel=require("../../model/cartModel")
const orderModel=require("../../model/orderModel")
const categoryModel=require('../../model/categoryModel')
const wishlistModel=require("../../model/wishlistModel")
const walletModel = require('../../model/walletModel');
const transactionModel = require('../../model/transactionModel'); 
const couponModel = require('../../model/couponModel');
const {generateReferralCode} =require('../../helper/referralcode')
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');


//login page rendering----------------------------------------------------------------
const loadlogin= function(req,res){
  const {successMessage,errorMessage}=req.session;
  //clear session
  req.session.successMessage=null;
  req.session.errorMessage=null;

  res.render('user/user-login', { error: req.flash('error'),successMessage,errorMessage})
}


//register page rendering-------------------------------------------------------------
const loadregister=function(req,res){
  const {message} = req.query;
  res.render('user/user-register',{message})
}


//home page or user dashboard---------------------------------------------------------
const loadhome=async function(req,res){
  try{
   const data= await productModel.find().populate("category")
   res.render('user/user-home',{data:data,user:req.session.user})
  }catch(error){
    res.status(500).send('Internal server error')
  }
}

//create user function------------------------------------------------

// const CreateUser = async (req, res) => {
//   try {
  
//     const response = await userHelper.doSignUp(
//       req.body,
//       req.session.otpmatched,
//       req.session.userEmail
//     );
//     if (!response.status) {
                
//       res.redirect("/usersignup");
//     } else {
      
//       res.redirect("/userlogin");
//     }
//   } catch (err) {}
// };


const CreateUser = async (req, res) => {
  try {
    const referralCode = generateReferralCode(6);
    const user = new userModel({ ...req.body, referralCode });
    const response = await userHelper.doSignUp(req.body, user, req.session.otpmatched, req.session.userEmail);

    if (response.status) {
     
      if (req.body.referralCode) {
        const referrer = await userModel.findOne({ referralCode: req.body.referralCode });
    
        if (referrer) {
          const bonusAmount = 1000;
    
          let referrerWallet = await walletModel.findOne({ userId: referrer._id });
          if (!referrerWallet) {
            referrerWallet = await walletModel.create({ userId: referrer._id, balance: bonusAmount });
          } else {
            referrerWallet.balance += bonusAmount;
          }
            await referrerWallet.save();
              // Creating and saving a new transaction
          const transaction = await transactionModel.create({
            userId: referrer._id,
            amount: bonusAmount,
            status: 'Completed',
            type: 'Referral Reward',
          });

         
          const newUser = await userModel.findOne({ email: req.body.email });
          if (newUser) {
            const newUserId = newUser._id;

            let newUserWallet = await walletModel.create({ userId: newUserId, balance: bonusAmount });
            await newUserWallet.save();


            const transaction = await transactionModel.create({
              userId: newUserId,
              amount: bonusAmount,
              status: 'Completed',
              type: 'Referral Bonus',
            });

          } else {
            console.error('No user found with the email:', req.body.email);
          }
           }
      }
      res.redirect("/userlogin");
    } else {

      res.redirect(`/userregister?message=${response.message}`);
    }
    
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).send('Internal Server Error');
  }
};





//productdetailspage rendering-----------------------------------------------------------------------

const loadproductdetailspage = async function (req, res) {
  try {
          const id = req.params.id;
          const data = await productModel.findOne({ _id: id }).populate("category");
          const doc =await productModel.find({category:data.category})
          console.log(data);
          res.render('user/user-productdetails', {data: data,user:req.session.user,doc:doc });
      }
 catch (error) {
      console.log("Error in loading product details page:", error);
      res.status(500).send("Internal Server Error");
  }}


//userlogin-----------------------------------------------------------------------------------------------
const loaduserlogin = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });

    if (!user) {
      req.flash("errorMessage", "User does not exist");
      res.redirect('/userlogin');
    } else if (bcrypt.compareSync(req.body.password, user.password)) {
      if (user.isActive === true) {
        req.session.user = user;
        res.redirect("/");
      } else {
        req.flash("error", "User is Blocked");
        res.redirect('/userlogin');
      }
    } else {
      req.flash("error", "Incorrect password");
      res.redirect('/userlogin');
    }
  } catch (error) {
    console.log("Error in user login: " + error);
    res.status(500).send("Internal Server Error: " + error);
  }
};



//------laodshop,filter,sorting-----------------------------------------------------------

const loadshop = async function (req, res) {
  try {
    const category = req.params.category || undefined; 
    const searchQuery = req.query.q || ''; // Extract the search query from request query parameters
    
   
    const categories = await categoryModel.find({});
    const page = parseInt(req.query.page) || 1; 
    const limit = 4; 
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy;
    const selectedSortOption = sortBy;

    let productsQuery = productModel.find({});
    let categoryFilter = {};
    let searchFilter = {};

    if (sortBy === 'Price: Low to High') {
        productsQuery = productsQuery.sort({ regularPrice: 1 });
    }else if (sortBy === 'Price: High to Low') {
        productsQuery = productsQuery.sort({ regularPrice: -1 });
    } else if (sortBy === 'aA - zZ') {
        productsQuery = productsQuery.sort({ productName: 1 });
    } else if (sortBy === 'zZ - aA') {
        productsQuery = productsQuery.sort({ productName: -1 });
    } else if (sortBy === 'New Arrivals') {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 1);
        productsQuery = productsQuery.find({ createdOn: { $gte: tenDaysAgo.getTime() } });
    }


    if (category) {
        categoryFilter = { 'category': category };
    }

    if (searchQuery) {
      searchFilter = { 'productName': { $regex: searchQuery, $options: 'i' } }; // Case-insensitive search using regex
  }

    productsQuery = productsQuery.find({ $and: [categoryFilter, searchFilter] });

    const totalItems = await productModel.countDocuments({ $and: [categoryFilter, searchFilter] });
    const totalPages = Math.ceil(totalItems / limit);

    const products = await productsQuery.skip(skip).limit(limit).populate('category');

    res.render("user/user-shop", { 
        data: products, 
        user: req.session.user, 
        selectedSortOption, 
        currentPage: page, 
        totalPages,
        categories,
        text: category,
        searchQuery  
    });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal server error');
  }
}



//user logout -----------------------------------------------------------------------------
const logoutUser =(req,res)=>{
  try{
      req.session.user = null
      res.redirect('/userlogin')

  }catch(error){
    console.log(error)
  }
}

//reset password -----------------------------------------------------------------------------

const resetPass = async (req,res)=>{

  const email = req.body.email
  const user = await userModel.findOne({email:email})

  if(user){
   const newPass = await bcrypt.hash(req.body.password, 10);
   await userModel.findOneAndUpdate(
    { email: email },
    { password: newPass },
    { new: true}
   );

   req.session.successMessage = 'Password updated successfully';
   res.redirect('/userlogin');

  }else {
   req.session.errorMessage = 'User not found';
   res.redirect('/userlogin');

}}


//load profile page--------------------------------------------------------------------

const loadprofilepage = async function(req, res) {
  try {
    const { successMessage } = req.flash();
    const { errorMessage } = req.flash();
    const userData = await userModel.findOne({ email: req.session.user.email });
    const orderData = await orderModel.find({ userID: userData._id }).sort({orderDate:-1})
res.render('user/profile-page', {
  user: req.session.user,
  SM: successMessage,
  EM: errorMessage,
  data: userData,
  orders: orderData   
});
} catch (error) {
console.error("Error loading profile page:", error);
res.status(500).json({ success: false, message: 'Internal server error' });
}
};



//userprofilecreation function-------------------------------------------------------------

const userprofilecreation = async (req, res) => {
  const {pointer}=req.query;
  try {
    const { name, mobile, pincode, houseName, cityOrTown, district, state, country } = req.body;

    const existingUser = await userModel.findOne({ email: req.session.user.email });

    if (!existingUser) {
      req.flash('errorMessage', 'User not found');
      res.redirect('/profilepage');
    
    }
    existingUser.address.push({
      name,
      mobile,
      pincode,
      houseName,
      cityOrTown,
      district,
      state,
      country
    });
    await existingUser.save();

    req.flash('successMessage', 'Address added successfully');
    req.session.user = existingUser;
    if(pointer){
      res.redirect('/usercheckoutpage');
    }else{
    res.redirect('/profilepage');
    }
  } catch (error) {
    console.error('Error adding address:', error);
    req.flash('errorMessage', 'Error adding address'); 
    res.redirect('/profilepage');
  }
};


//--------loadEditaddresspage-------------------------------------------------

const loadEditaddresspage = async function(req, res) {
  const addressid = req.query.id; 
  const userid = req.session.user._id;
  const {flag}=req.query;


  try {
    const user = await userModel.findById(userid);

    if (!user) {
      console.log('User not found for ID:', userid);
      return res.status(404).send('User not found');
    }
    const address = user.address.id(addressid);


    if (!address) {
      console.log('Address not found for ID:', addressid);
      return res.status(404).send('Address not found');
    }

    if(flag){
      res.render('user/checkout-edit', { user: req.session.user, address });
    }
    else{
    res.render('user/addressedit-page', { user: req.session.user, address });
    }
  } catch (error) {
    console.error('Error finding address:', error);
    res.status(500).send('Internal Server Error');
  }
}

//updateuserdetails------------------------------------------------------------

const updateuserdetails= async (req, res) => {
  const addressId = req.query.id; 
  const { name, mobile, houseName, cityOrTown, pincode, district, state, country } = req.body;
  const userId = req.session.user._id;
  const{flag}=req.query;

  try {
      const user = await userModel.findById(userId);
      if (!user) {
          return res.status(404).send('User not found');
      }

      const address = user.address.id(addressId);
      if (!address) {
          return res.status(404).send('Address not found');
      }

      address.name = name;
      address.mobile = mobile;
      address.houseName = houseName;
      address.cityOrTown = cityOrTown;
      address.pincode = pincode;
      address.district = district;
      address.state = state;
      address.country = country;

      await user.save();
     if(flag){
      res.redirect('/usercheckoutpage');
     }else{
      res.redirect('/profilepage'); 
     }
  } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).send('Internal Server Error');
  }
};



//DELETING ADDRESS------------------------------------------------

const deleteaddress = async (req,res)=>{
  
  const { addressId } = req.query;
  const userId = req.session.user._id;

  try {
  
  const updatedUser = await userModel.findOneAndUpdate(
    { 
        _id: userId 
    },
    { 
        $pull: {
            address: { _id: addressId }
        } 
    },
    { 
        new: true
    }
);

  if (!updatedUser) {
      return res.status(404).send('Address not found');
  }

  res.status(200).send('Address deleted successfully');

} catch (err) {
    res.status(500).send('Failed to delete address');
}}


//user checkout page----------------------------------------------------------

// const loadusercheckoutpage=async function(req,res){
//   const userId = req.session.user._id;


 
//   const coupons =await couponModel.find({})
//   const data = await userModel.findOne({ email: req.session.user.email });
//   const wallet= await walletModel.findOne({userId:userId})


//   const product = await cartModel
//       .find({ userId: userId })
//       .populate('items.product'); 


// console.log(product);

//  res.render('user/usercheckout-page',{user:req.session.user,data,product, wallet:wallet,coupons:coupons})
// }


const loadusercheckoutpage=async function(req,res){
  const userId = req.session.user._id;


 
  const coupons = await couponModel.find({ userId: { $nin: [userId] } });
  const data = await userModel.findOne({ email: req.session.user.email });
  const wallet= await walletModel.findOne({userId:userId})
  console.log(wallet); 
  console.log(wallet ? wallet.balance : 'Wallet not found'); 


  const product = await cartModel
      .find({ userId: userId })
      .populate('items.product'); 


const outOfStockProducts = product.filter(item => item.items[0].product.stock === 0);
const outOfStockProductNames = outOfStockProducts.map(item => item.items[0].product.productName);

 
const allProductsAvailable = product.every(item => item.items[0].product.stock > 0);    

 if (!allProductsAvailable) {
  
  req.flash('error',`The following products are currently out of stock: ${outOfStockProductNames.join(', ')} kindly remove the product from your cart and proceed with your order`)
  return res.redirect('/cartpage')
}

 res.render('user/usercheckout-page',{user:req.session.user,data,product, wallet: wallet ? wallet : { balance: 0 },coupons:coupons})
}
   






//final order page------------------------------------------------------------


// const placeorderfunction = async function (req, res) {
//   try {
//     const userId = req.session.user._id;
//     const { addressIndex, payment_option } = req.body;

//     const user = await userModel.findOne({ _id: userId });
//     const cart = await cartModel.findOne({ userId: userId });

//     if (user) {
//       const address = user.address[addressIndex];

//       const billingDetails = {
//         name: address.name,
//         mobile: address.mobile,
//         pincode: address.pincode,
//         houseName: address.houseName,
//         cityOrTown: address.cityOrTown,
//         district: address.district,
//         state: address.state,
//         country: address.country,
//       };

//       // Log the received payment option for debugging
//       console.log('Payment Option:', payment_option);

//       const paymentStatus = payment_option === 'RazorPay' ? 'Paid' : 'Pending';
//       console.log('Payment Status:', paymentStatus); // Log the assigned payment status

//       const newOrder = new orderModel({
//         userID: userId,
//         items: cart.items,
//         totalPrice: cart.totalPrice,
//         status: 'Pending',
//         billingDetails: billingDetails,
//         paymentMethod: payment_option,
//         paymentStatus: paymentStatus,
//       });

//       await newOrder.save();
//       for (const item of cart.items) {
//         const product = await productModel.findById(item.product);
//         if (product) {
//           product.stock -= item.quantity;
//           await product.save();
//         }
//       }

//       await cartModel.findOneAndUpdate(
//         { userId: userId },
//         { $set: { items: [], totalPrice: 0 } }
//       );

//       res.render('user/thankyou-page', req.session.user);
//     } else {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
//   } catch (error) {
//     console.error("Error placing order:", error);
//     return res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// };


const placeorderfunction = async function (req, res) {
  try {
    const userId = req.session.user._id;
    const { addressIndex, payment_option, placeordertotalPrice,couponDis,RazPayFail } = req.body;
  

    const user = await userModel.findOne({ _id: userId });
    const cart = await cartModel.findOne({ userId: userId });

    if (user) {
      const address = user.address[addressIndex];

      const billingDetails = {
        name: address.name,
        mobile: address.mobile,
        pincode: address.pincode,
        houseName: address.houseName,
        cityOrTown: address.cityOrTown,
        district: address.district,
        state: address.state,
        country: address.country,
      };
      
      // const paymentStatus = payment_option === 'RazorPay' ? 'Paid' : payment_option === 'Wallet' ? 'Paid': 'Pending';
      const paymentStatus = (payment_option === 'RazorPay' && !RazPayFail) ? 'Paid' : (payment_option === 'Wallet') ? 'Paid':'Pending';

      const newOrder = new orderModel({
        userID: userId,
        items: cart.items,
        totalPrice: placeordertotalPrice,
        status: 'Pending',
        billingDetails: billingDetails,
        paymentMethod: payment_option,
        paymentStatus: paymentStatus,
        couponDiscount: couponDis
      });

      await newOrder.save();

      for (const item of cart.items) {
        const product = await productModel.findById(item.product);
        if (product) {
          product.stock -= item.quantity;
          await product.save();
        }
      }

      await cartModel.findOneAndUpdate(
        { userId: userId },
        { $set: { items: [], totalPrice: 0 } }
      );

      if (payment_option==='Wallet'){

        await walletModel.findOneAndUpdate(
          {userId:userId},
          {$inc:{balance:-newOrder.totalPrice}}
        )

        const transaction = new transactionModel({
          userId,
          amount:-newOrder.totalPrice,
          status: 'Completed',
          type: 'Debit',
        });
    
        await transaction.save();
      }
     const order = await orderModel.findById(newOrder._id).populate('items.product').exec()
     console.log(order,'failureeeeeeeeeeeeeeeee');

      res.render('user/thankyou-page', {
        orderId: newOrder._id,
        userId: userId,
        user: req.session.user, // Include user session data all this for pdf invoice download
        order:order
      });

    } else {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};




//order info page----------------------------------------------------------------

const loadorderinfopage= async function(req,res){
try{  
  const user=req.session.user
  const {id}=req.query;
  console.log(`this ${id}`);
  const orderData = await orderModel.find({ _id: id }).populate('items.product')
  console.log("helloooo",orderData);

  res.render('user/orderinfo-page', {user:user,orderData:orderData})
}catch{

}}


//cancel order function-----------------------------------------------------------------

// const cancelOrderFunction = async (req, res) => {
//   try {
//     const { orderId, productId } = req.body;

//     const updatedOrder = await orderModel.findOneAndUpdate(
//       { _id: orderId, 'items._id': productId },
//       { $set: { 'items.$.status': 'Cancelled' } },
//       { new: true }
//     );

//     if (!updatedOrder) {
//       return res.status(404).send('Order or product not found.');
//     }

//     const canceledItem = updatedOrder.items.find((item) => item._id.toString() === productId);

//     if (canceledItem) {
//       const productDetails = await productModel.findById(canceledItem.product);

//       if (!productDetails) {
//         return res.status(404).send('Product not found.');
//       }

//       // Check if payment method is not a coupon
     
//         // Calculate the refund amount based on the canceled item's price and quantity
//         const refundAmount = canceledItem.price * canceledItem.quantity;
        
//         // Refund the wallet only if payment was made using wallet
//         if (updatedOrder.paymentMethod === 'Wallet') {
//           const userWallet = await walletModel.findOne({ userId: updatedOrder.userID });

//           if (!userWallet) {
//             return res.status(404).send('User wallet not found.');
//           }

//           userWallet.balance += refundAmount; // Credit the refund amount back to the wallet
//           await userWallet.save();
//         }

//       productDetails.stock += canceledItem.quantity;
//       await productDetails.save();
//     } else {
//       return res.status(404).send('Item not found in the order.');
//     }

//     res.status(200).send('Product cancelled successfully.');
//   } catch (error) {
//     console.error('Error cancelling product:', error);
//     res.status(500).send('Error cancelling product.');
//   }
// };



const cancelOrderFunction = async (req, res) => {
  try {
    const { orderId, productId } = req.body;
    const {admin}=req.query


    let updatedOrder; 
    if (admin) 
    {
    updatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId, 'items._id': productId },
      { $set: { 'items.$.status': 'Cancelled','items.$.cancelmessage':true } },
      { new: true });
    }else
    {
      updatedOrder = await orderModel.findOneAndUpdate(
        { _id: orderId, 'items._id': productId },
        { $set: { 'items.$.status': 'Cancelled'} },
        { new: true });
    }

   
    if (!updatedOrder) {
      return res.status(404).send('Order or product not found.');
    }


  const canceledItem = updatedOrder.items.find((item) => item._id.toString() === productId);

        
    if (canceledItem) {
      const productDetails = await productModel.findById(canceledItem.product);

      if (!productDetails) {
        return res.status(404).send('Product not found.');
      }

    
      const refundAmount = canceledItem.price * canceledItem.quantity;

      
      if (updatedOrder.paymentMethod === 'RazorPay' || updatedOrder.paymentMethod === 'Wallet') {
        let userWallet = await walletModel.findOne({ userId: updatedOrder.userID });


        if (!userWallet) {
          userWallet = await walletModel.create({
            userId: updatedOrder.userID, // Use updatedOrder.userID to create the wallet
            balance: refundAmount, // Set initial balance as 0 or any other default value
          });
          await userWallet.save();

          
        let transaction = new transactionModel({
          userId:updatedOrder.userID,
          amount:refundAmount,
          status: 'Completed',
          type: 'Refund',
        });
    
        await transaction.save();
        return res.status(200).send('Product cancelled successfully.');
          
        }

        
        userWallet.balance += refundAmount; 
        await userWallet.save();

        
        const transaction = new transactionModel({
          userId: updatedOrder.userID,
          amount: refundAmount, 
          status: 'Completed',
          type: 'Refund',
        });

        await transaction.save();
      }  

      productDetails.stock += canceledItem.quantity;
      await productDetails.save();
    } else {
      return res.status(404).send('Item not found in the order.');
    }

    res.status(200).send('Product cancelled successfully.');
  } catch (error) {
    console.error('Error cancelling product:', error);
    res.status(500).send('Error cancelling product.');
  }
};

//------------------------------return order------------------------------------------------------------------



const returnOrderFunction = async (req, res) => {
  try {
    const { orderId, productId } = req.body;

    const updatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId, 'items._id': productId },
      { $set: { 'items.$.status': 'Returned' } },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).send('Order or product not found.');
    }

    const canceledItem = updatedOrder.items.find((item) => item._id.toString() === productId);

    if (canceledItem) {
      const productDetails = await productModel.findById(canceledItem.product);

      if (!productDetails) {
        return res.status(404).send('Product not found.');
      }

      // Calculate the refund amount based on the canceled item's price and quantity
      const refundAmount = canceledItem.price * canceledItem.quantity;

      // Refund to wallet for products purchased via Razorpay or Wallet
      if (updatedOrder.paymentMethod === 'RazorPay' || updatedOrder.paymentMethod === 'Wallet') {
        const userWallet = await walletModel.findOne({ userId: updatedOrder.userID });

        if (!userWallet) {
          return res.status(404).send('User wallet not found.');
        }

        userWallet.balance += refundAmount; // Credit the refund amount back to the wallet
        await userWallet.save();

        // Create a transaction record for the refund
        const transaction = new transactionModel({
          userId: updatedOrder.userID,
          amount: refundAmount, // Negative amount for refunds
          status: 'Completed',
          type: 'Refund',
        });

        await transaction.save();
      }

      
      productDetails.stock += canceledItem.quantity;
      await productDetails.save();
    } else {
      return res.status(404).send('Item not found in the order.');
    }

    res.status(200).send('Product cancelled successfully.');
  } catch (error) {
    console.error('Error cancelling product:', error);
    res.status(500).send('Error cancelling product.');
  }
};




//search for items---------------------------------------------------------------------

const searchforitemsfunction = async (req, res, next) => {
  try {
    const searchTerm = req.query.q;
    console.log('Search Term:', searchTerm); // Log the search term

    const searchResult = await productModel.find({ 
      $or: [
        { productName: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ]
    }).populate("category");

    res.render('user/user-home', {
      data: searchResult,
      user: req.session.user
    })
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
};

//wish list page-------------------------------------------------------------------

// const loadwishlistpage = async function(req, res) {
//   const userId = req.session.user;
//   try {
//     const data = await wishlistModel.findOne({ userId:userId }).populate('items.product')
//     data.items.sort((a, b) =>b.wishDate - a.wishDate)
    
//     const user = req.session.user;
//     res.render('user/wishlist-page', { user: user, data: data });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error loading wishlist page');
//   }
// };



const loadwishlistpage = async function(req, res) {
  try {
    const userId = req.session.user;
    const data = await wishlistModel.findOne({ userId }).populate('items.product');
    
    if (!data || !data.items || data.items.length === 0) {
      // Handle case where wishlist data is empty or undefined
      res.render('user/wishlist-page', { user: userId, data: null }); // Pass null data to template
    } else {
      data.items.sort((a, b) => b.wishDate - a.wishDate);
      res.render('user/wishlist-page', { user: userId, data });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading wishlist page');
  }
};




//wishlist function--------------------------------------------------------------------

const wishlistfunction = async (req, res) => {
  const { productId } = req.query;
  
  try {
    
    const userId = req.session.user._id;
    
    const existingItem = await wishlistModel.findOne({ userId, 'items.product': productId });

    if (existingItem) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    const newItem = { product: productId };
    await wishlistModel.findOneAndUpdate(
      { userId },
      { $push: { items: newItem } },
      { upsert: true }
    );

    res.status(200).json({ message: 'Product added to wishlist' });
  } catch (error) {
    console.error('Error adding product to wishlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


//remove product form wishlist--------------------------------------------------------------------

const removeProductFromwishlist = async (req, res) => {
  try {
    const productid = req.query.id;
    const userId = req.session.user._id;

    const result = await wishlistModel.updateOne(
      { userId: userId },
      { $pull: { items: { product: productid } } }
    );

    if (result.modifiedCount > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//-------------------loadwallet --------------------------------------------------------------------

// const loadwallet = async function(req, res) {
//   try {
//     const user = req.session.user._id;

//     // Fetch the user's data including the referral code
//     const userreferral = await userModel.findById(user).select('referralCode');

//     const wallet = await walletModel.findOne({ userId: user });
//     const transactions = await transactionModel.find({ userId: user }).sort({date:-1})
//     res.render('user/wallet-page', { userreferral:userreferral, user: user, transactions: transactions, wallet:wallet });

//   } catch (error) {
//     console.error(error); 
//     res.status(500).send('Internal Server Error'); 
//   }
// };




const loadwallet = async function(req, res) {
  try {
    const user = req.session.user._id;

    // Fetch the user's data including the referral code
    const userreferral = await userModel.findById(user).select('referralCode');

    let userWallet = await walletModel.findOne({ userId: user });
    
    // Set balance to zero for new users without a wallet
    if (!userWallet) {
      userWallet = { balance: 0 };
    }

    const transactions = await transactionModel.find({ userId: user }).sort({ date: -1 });

    res.render('user/wallet-page', { userreferral: userreferral, user: user, transactions: transactions, wallet: userWallet });

  } catch (error) {
    console.error(error); 
    res.status(500).send('Internal Server Error'); 
  }
};



//------------------deposit wallet function-------------------------------------

const depositwalletfunction = async function (req, res) {
  try {
    const userId = req.session.user._id;
    const amount = parseFloat(req.body.payment_amount); 

    if (isNaN(amount) || amount <= 0) { 
      return res.status(400).json({ message: 'Invalid deposit amount' });
    }

    let wallet = await walletModel.findOne({ userId });

    if (!wallet) {
      wallet = new walletModel({
        userId,
        balance: 0,
      });
    }

    wallet.balance += amount; // Use parsed amount directly
    await wallet.save();

    const transaction = new transactionModel({
      userId,
      amount,
      status: 'Completed',
      type: 'Credit',
    });

    await transaction.save();

    res.redirect('/wallet')
  } catch (error) {
    console.error('Error depositing amount:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//-------------------couponapplyfunction-----------------------------------------------------------------------------

const couponapplyfunction = async function (req, res) {
  try {
    const { couponCode } = req.query;
    console.log(couponCode);
    const coupon = await couponModel.findOne({ coupon: couponCode });
    console.log(coupon);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    const userId = req.session.user._id; 
    const userCart = await cartModel.findOne({ userId });
    const totalAmount = userCart.totalPrice;
    if (!userCart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Check if the totalAmount is less than the minimum purchase amount specified in the coupon
    if (totalAmount < coupon.minimumamount) {
      return res.status(400).json({ error: `Minimum purchase amount required to apply this coupon is ${coupon.minimumamount}` });
    }


     // Add user's ID to the usedBy array in the coupon document
     coupon.userId.push(userId);
     await coupon.save();
 

    const amountDividedBYPercentage = Math.ceil(totalAmount * coupon.percentage / 100);
    if (amountDividedBYPercentage > coupon.maximumamount) {
      const amountToPay = (totalAmount - coupon.maximumamount);
      res.json({ totalAmount: amountToPay, couponId: couponCode, discountAmount: coupon.maximumamount, couponCode: coupon.coupon_code });   
    } else {
      const amountToPay = (totalAmount - amountDividedBYPercentage);
      res.json({ totalAmount: amountToPay, couponId: couponCode, discountAmount: amountDividedBYPercentage, couponCode: coupon.coupon_code });
    }

  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

//------------- generateInvoicefunction-----------------------------------------------------------------


const generateInvoicefunction = async function (req, res) {
  try {
    const orderId = req.query.orderId; 
    const userId = req.query.userId;
    if (!orderId || !userId) {
      return res.status(400).send('Invalid request parameters');
    }

   
    const order = await orderModel.findOne({ _id: orderId, userID: userId }).populate('items.product');
  
    if (!order) {
      console.log("order illa")
      return res.status(404).send('Order not found');
    }
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice</title>
      <style>
        /* Add your CSS styles here */
        body {
          font-family: Arial, sans-serif;
        }
        .invoice-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin-right: auto;
          margin-left: auto;
        }
        .billing-address {
          float: left;
          margin-bottom: 20px;
          margin-right: 50px;
        }
        .billing-address h3 {
          margin-bottom: 5px;
        }
        .product-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .product-table th, .product-table td {
          border: 1px solid #000;
          padding: 8px;
        }
        .total-row td {
          border-top: 2px solid #000;
          font-weight: bold;
        }
        .coupon-discount, .Tax.IGST, .Shipping.Charges, .grand-total {
          text-align: right;
          margin-top: 10px;
          font-size: 12px;
          font-weight: bold;
        }
        .grand-total {
          font-size: 18px;
          margin-top: 20px;
        }

        .footer {
          position: fixed;
          bottom: 20px;
          width: calc(100% - 40px);
          margin: 0 20px;
          font-size: 12px;
          text-align:  center; 
          background-color: #f5f5f5; /* Optional: Add a background color for better visibility */
          padding: 10px; /* Optional: Add padding for better spacing */
          border-top: 1px solid #ccc; /* Optional: Add a border to separate the footer from the content */
          box-sizing: border-box; /* Optional: Ensure padding and border are included in width calculation */
        }
        
      </style>
    </head>
    <body>
      <div class="billing-address">
        <h3>Billing Address</h3>
        <p>Name: ${order.billingDetails.name}</p>
        <p>Mobile: ${order.billingDetails.mobile}</p>
        <p>Address: ${order.billingDetails.houseName}, ${order.billingDetails.district}, ${order.billingDetails.state}, ${order.billingDetails.country}, ${order.billingDetails.pincode}</p>
        <p>Payment Status: ${order.paymentStatus}</p>
        <p>Payment Method: ${order.paymentMethod}</p>
      </div>
      <div class="invoice-header">
        <div class="company-name">LaceLux</div>
      </div>
      <h1>Invoice</h1>
      <table class="product-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.product.productName}</td>
              <td>${item.quantity}</td>
              <td>₹${item.price}</td>
              <td>₹${item.quantity * item.price}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="coupon-discount">
        <p>Discount: ₹${order.couponDiscount}</p>
      </div>
      <div class="Tax IGST">
        <p>Tax IGST: ₹${(order.totalPrice * 0.08).toFixed(2)} included</p>
      </div>
      <div class="Shipping Charges">
        <p>Shipping Charges: Nil</p>
      </div>
      <div class="grand-total">
        <p>Grand Total: ₹${order.totalPrice}</p>
      </div>
      <div class="footer">
      <p>Returns Policy: At LaceLux, we strive for perfection with every delivery. However, if you need to return an item, please ensure it is accompanied by the original brand box/price tag, packaging, and invoice. Without these, it may be challenging for us to process your request promptly. Your cooperation is appreciated. Terms and conditions apply.</p>
      <p>The goods sold are intended for end-user consumption and not for resale.</p>
      <p>Registered Office: SKRETAIL, 6-1-530, Khairtabad, Hyderabad, Landmark: Mahakali Temple, Hyderabad, Andhra Pradesh - 500004</p>
      <p>Contact LaceLux: 1800 208 9898 || www.lacelux.com/helpcentre</p>
    </div>
    </body>
    </html>
  `;   
  
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent);
   
    const pdfBuffer = await page.pdf({ format: 'A4' }); 
  
    await browser.close();
    console.log("all set")
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice.pdf"`);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).send('Internal Server Error');
  }
};

//-----------------------------------------------------------------------------------------
const changepasswordFunction = async (req, res) => {
  try {
      const userId = req.session.user._id;
      const { email, password, npassword, cpassword } = req.body;

      console.log('User ID:', userId);
      console.log('Received Email:', email);
      console.log('Received Passwords:', password, npassword, cpassword);

      // Validate email and password against your database
      const user = await userModel.findById(userId);
      console.log('User:', user);

      if (!user) {
          console.log('User not found');
          return res.status(400).json({ success: false, message: 'User not found' });
      }

      // Check if new password matches confirm password
      if (npassword !== cpassword) {
          console.log('New password and confirm password do not match');
          return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
      }

      // Compare current password with hashed password from the database
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('isPasswordValid:', isPasswordValid);

      if (!isPasswordValid) {
          console.log('Invalid current password');
          return res.status(400).json({ success: false, message: 'Invalid current password' });
      }

      // Hash the new password before updating
      const hashedPassword = await bcrypt.hash(npassword, 10);

      console.log('Updating password:', user.password, 'to', hashedPassword);

      // Update the user's password in the database
      user.password = hashedPassword;
      await user.save();

      res.json({ success: true });
  } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
}




module.exports={
loadlogin,
loadregister,
loadhome,
CreateUser,
loadproductdetailspage,
loaduserlogin,
loadshop,
logoutUser,
resetPass,
loadprofilepage,
userprofilecreation,
loadEditaddresspage,
updateuserdetails,
deleteaddress,
loadusercheckoutpage,
placeorderfunction,
loadorderinfopage,
cancelOrderFunction,
returnOrderFunction,
searchforitemsfunction,
loadwishlistpage,
wishlistfunction,
removeProductFromwishlist,
loadwallet,
depositwalletfunction,
couponapplyfunction,
generateInvoicefunction,
changepasswordFunction

}