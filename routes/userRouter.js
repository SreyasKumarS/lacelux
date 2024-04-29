const express=require('express')
const router=express.Router()
const nocache=require('nocache')
const bcrypt=require('bcrypt')
const isUser=require('../middleware/userAuth')
const userController=require('../controller/userC/userController')
const cartController=require('../controller/userC/cartController')
const otpHelper = require('../helper/otpHelper')
const loginresetpasswordHelper = require('../helper/Resetloginpassword')
const google=require('../helper/google')



//userside-------------------------------------------------------------------
router.get('/',userController.loadhome)
router.get('/userregister',userController.loadregister)
router.get('/userlogin',userController.loadlogin)
router.post('/sendotp',otpHelper.sendOtp)
router.post('/verifyotp',otpHelper.verify)
router.post("/usersignup",userController.CreateUser)
router.get('/productdetails/:id',userController.loadproductdetailspage)
router.post('/userlogin',userController.loaduserlogin )
router.get('/usershop/:category?',userController.loadshop)
router.get('/categoryFilter/:category?',userController.loadshop)
router.get('/userlogout',userController.logoutUser)
router.post('/resetpass',userController.resetPass)
router.get('/cartpage',isUser,cartController.loadcartpage)
router.get('/cartpagefunction/:productId',isUser,cartController.cartpagefunction)
router.patch('/updateQuantity/:productId',cartController.updateQuantity)
router.patch('/removeProductFromTheCart',cartController.removeProductFromTheCart)

//user profile side----------------------------------------------------------------------------------
router.get('/profilepage',isUser,userController.loadprofilepage)
router.post('/userprofilecreation',userController.userprofilecreation)
router.get('/editaddresspage',isUser,userController.loadEditaddresspage)
router.post('/updateuserdetails',userController.updateuserdetails)
router.delete('/deleteaddress',isUser,userController.deleteaddress)
router.get('/usercheckoutpage',isUser,userController.loadusercheckoutpage)
router.post('/placeorder',isUser,userController.placeorderfunction)
router.get('/orderinfopage',isUser,userController.loadorderinfopage)
router.post('/cancelorder',isUser,userController.cancelOrderFunction)
router.post('/returnorder',isUser,userController.returnOrderFunction)
router.get('/searchforitems',isUser,userController.searchforitemsfunction)
router.get('/wishlist',isUser,userController.loadwishlistpage)
router.post('/wishlistfunction',isUser,userController.wishlistfunction)
router.patch('/removeProductFromwishlist',userController.removeProductFromwishlist)
router.get('/wallet',isUser,userController.loadwallet)
router.post('/depositwallet',isUser,userController.depositwalletfunction)
router.get('/couponapply',isUser,userController.couponapplyfunction)
router.get('/generateInvoice',isUser,userController.generateInvoicefunction)
router.post('/retryorder/:orderId',isUser,cartController.retryOrderFunction)
router.get('/retrythankyoupage',isUser,cartController.loadretrythankyoupage)
router.post('/changepassword',isUser,userController.changepasswordFunction)


//----------google login-----------------------------------------------------------------
router.get('/auth/google',google.googleauth)
router.get('/google/callback',google.goog);


//login reset password-----------------------------------------------------------------------
router.get('/forgotpass',loginresetpasswordHelper.loadForgotPassword)
router.post('/PwResetRequest',loginresetpasswordHelper.sendResetMail)
router.get('/resetPwPage',loginresetpasswordHelper.loadResetPage)
router.post('/resetPassword',loginresetpasswordHelper.resetPassword)






module.exports=router
