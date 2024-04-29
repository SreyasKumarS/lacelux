const express=require('express')
const router=express.Router()
const nocache=require('nocache')
const bcrypt=require('bcrypt')
const upload=require('../middleware/multer')
const isAdmin=require('../middleware/adminAuth')


const adminController=require('../controller/adminC/adminController')
const categoryController=require('../controller/adminC/categoryController')
const productController=require('../controller/adminC/productController')
const customerController=require('../controller/adminC/customerController')
const couponController=require('../controller/adminC/couponController')
// const dashController=require('../controller/adminC/dashController')

//adminside---------------------------------------------
router.get('/adminlogin',adminController.loadlogin)
router.get('/admindashboard',isAdmin,adminController.backtodashboard)
router.post('/admindashboard',adminController.loadadmindashboard)



//categoryside--------------------------------------------------------------------------
router.get('/categorylist',isAdmin,categoryController.loadcategorylist)
router.post('/addtocategory',isAdmin,categoryController.loadaddToCategory)
router.patch('/unlist',categoryController.loadunlistorlist)
router.get('/editcategory',isAdmin,categoryController.loadeditcategorypage)
router.post('/updatecategory/:id',isAdmin,categoryController.updateCategory)


//productside------------------------------------------------------------------------------------------
router.get('/productlist',isAdmin,productController.loadproductlist)
router.get('/addproductpage',isAdmin,productController.loadaddProductPage)
router.post('/addproducts',upload.array("images",5),productController.addproducts)
router.patch('/productunlist',isAdmin,productController. blockOrUnblockproduct)
router.get('/editproductpage',isAdmin,productController.loadeditProductPage)
router.post('/updateproduct/:id',upload.array("images",5),productController.productupdate)
router.get('/customermanagement',isAdmin, customerController.loadcustomermanagement);
router.patch('/customerunlist',isAdmin,customerController.blockOrUnblockcustomer)
router.post('/delete-image',isAdmin,productController.deleteImage)
router.post('/productoffer',isAdmin,productController.productoffer)

//order side---------------------------------------------------------------------------------------------
router.get('/ordermanagement',isAdmin, customerController.loadordermanagement);
router.get('/adminorderinfopage',isAdmin, customerController.loadadminorderinfopage);
router.post('/statusupdation',isAdmin,customerController.statusUpdationFunction)
//coiuponside--------------------------------------------------------------------------------------------
router.get('/couponmanagement',isAdmin,couponController.loadcouponmanagementpage)
router.get('/createcouponpage',isAdmin,couponController.loadcreatecouponpage)
router.post('/createcouponfunction',isAdmin,couponController.createcouponfunction)

//------sales repor side------------------------------------------------------------------------------
router.post('/generatesalesreport',adminController.generateSalesreport)
router.get('/bestsellers',isAdmin,adminController.loadbestsellerspage)

//------------------chartdisplay side---------------------------------------------
router.post('/showcart',isAdmin,adminController.showChart)
router.patch('/listOrUnlistcoupon',isAdmin,couponController.listOrUnlistcoupon)




module.exports=router;