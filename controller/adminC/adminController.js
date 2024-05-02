require('dotenv').config();
const adminModel=require('../../model/adminModel')
const orderModel=require("../../model/orderModel")
const userModel=require("../../model/userModel")


//--------------loginpage------------------------------------------------------------------------------

const loadlogin = function(req, res) {
  res.render('admin/admin-login', { errorMessage: req.flash('errorMessage') });
};

//----admindashboardpage--------------------------------------------------------------------------------

const loadadmindashboard = async (req, res) => {
  try {

    const salesDetails = await orderModel.find();

    const admin = await adminModel.findOne({ email: req.body.email });

    if (admin) {
      if (admin.password === req.body.password) {
        req.session.admin = admin;

        
        const orders = await orderModel.find(); 
        const users= await userModel.find()
        const numberOfUsers = users.length;


        
        let totalRevenue = 0;
        let totalOrders = orders.length;
        let totalProducts = 0;

        orders.forEach((order) => {
          totalRevenue += order.totalPrice; 
          totalProducts += order.items.reduce((acc, item) => acc + item.quantity, 0);
          
        });

       // Get the current date
       let currentDate = new Date().toISOString().split('T')[0];



        res.render('admin/admin-dashboard', {
          orders: orders,
          admin: req.session.admin,
          totalRevenue: totalRevenue,
          totalOrders: totalOrders,
          totalProducts: totalProducts,
          numberOfUsers:numberOfUsers,
          salesDetails:salesDetails,
          currentDate 
        });
      } else {
        req.flash("errorMessage", "Invalid email ID or password");
        res.redirect('/adminlogin');
        console.log("Password incorrect");
      }
    } else {
      req.flash("errorMessage", "Admin not found");
      res.redirect('/adminlogin');
    }
  } catch (error) {
    console.log("Error in admin login: " + error);
    res.status(500).send("Internal Server Error" + error);
  }
};













//-------------------back to admin dahsboard page--------------------------------------------------------

const backtodashboard = async (req, res) => {
  try {
   
const admin=req.session.admin
    
      if (admin){

      const orders = await orderModel.find(); 
      const users = await userModel.find(); 
      const numberOfUsers = users.length;

      let totalRevenue = 0;
      let totalOrders = orders.length;
      let totalProducts = 0;

      orders.forEach((order) => {
        totalRevenue += order.totalPrice; 
        totalProducts += order.items.reduce((acc, item) => acc + item.quantity, 0);
        
      });

      let currentDate = new Date().toISOString().split('T')[0];

      res.render('admin/admin-dashboard', {
        orders: orders,
        admin: req.session.admin,
        totalRevenue: totalRevenue,
        totalOrders: totalOrders,
        totalProducts: totalProducts,
        numberOfUsers: numberOfUsers,
        currentDate
      });
    } else {
      req.flash("errorMessage", "Admin not found");
      res.redirect('/adminlogin');
    }
  } catch (error) {
    console.log("Error in admin login: " + error);
    res.status(500).send("Internal Server Error" + error);
  }
};



//product list page-----------------------------------------------------------------
const loadproductlist=function(req,res){
  res.render('admin/product-list');
}


//----------------SALES REPORT-----------------------------------------------------------------------

const generateSalesreport = async (req, res, next) => {
  try {
    const { interval, startDate, endDate } = req.body;

    let startDateObj, endDateObj;
    if (interval === 'weekly') {
    
      endDateObj = new Date(endDate);
      startDateObj = new Date(endDateObj);
      startDateObj.setDate(endDateObj.getDate() - 7); 
    } else {
     
      startDateObj = new Date(startDate);
      endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999); 
    }

    const reportData = await orderModel.aggregate([
      {
        $match: {
          orderDate: { $gte: startDateObj, $lte: endDateObj }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'itemsWithProductDetails'
        }
      },
      {
        $group: {
          _id: "$_id",
          orderId: { $first: "$_id" },
          date: { $first: "$orderDate" },
          totalPrice: { $first: "$totalPrice" },
          products: { $push: "$itemsWithProductDetails.productName" },
          couponDiscount:{$first:"$couponDiscount"},
          firstName: { $first: "$billingDetails.name" },
          paymentMethod: { $first: "$paymentMethod" },
          paymentStatus: { $first: "$paymentStatus" }
        }
      }
    ]);

    res.json({ reportData });
  } catch (err) {
    next(err);
  }
};




//-------------------loadbestsellerspage---------------------------------------------------------------------



const loadbestsellerspage = async function(req, res) {
  try {
    const bestSellingProducts = await orderModel.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalQuantity: { $sum: '$items.quantity' } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }, 
      {
          $lookup: {
              from: 'products', 
              localField: '_id',
              foreignField: '_id',
              as: 'productDetails'
          }
      },
      {
          $addFields: {
              productDetails: { $arrayElemAt: ['$productDetails', 0] }
          }
      },
      {
          $project: {
              _id: 0,
              productId: '$_id',
              totalQuantity: 1,
              productDetails: 1
          }
      }
  ]);
 

   const bestSellingCategories = await orderModel.aggregate([
    { $unwind: '$items' },
    {
        $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
        }
    },
    { $unwind: '$productDetails' },
    {
        $group: {
            _id: '$productDetails.category',
            totalQuantity: { $sum: '$items.quantity' }
        }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 }, 
    {
        $lookup: {
            from: 'categories', 
            localField: '_id',
            foreignField: '_id',
            as: 'categoryDetails'
        }
    },
    {
        $addFields: {
            categoryDetails: { $arrayElemAt: ['$categoryDetails', 0] }
        }
    },
    {
        $project: {
            _id: 0,
            categoryId: '$_id',
            totalQuantity: 1,
            categoryName: '$categoryDetails.name'
        }
    }
]);

const bestSellingBrands = await orderModel.aggregate([

  { $unwind: '$items' },
  {
      $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
      }
  },
  { $unwind: '$productDetails' },
  {
      $group: {
          _id: '$productDetails.brand',
          totalQuantity: { $sum: '$items.quantity' }
      }
  },
  { $sort: { totalQuantity: -1 } },
  { $limit: 5 }, 
  {
      $project: {
          _id: 0,
          brandName: '$_id',
          totalQuantity: 1
      }
  }
]);

    res.render('admin/bestsellers-page', { bestSellingProducts: bestSellingProducts,bestSellingCategory:bestSellingCategories,bestSellingBrands :bestSellingBrands });
  } catch (error) {
    console.error('Error loading best selling products page:', error);
    res.status(500).send('Error loading best selling products page');
  }
};

//-------------------------------------------------------------------------------------------------
const showChart = async (req, res) => {
  try {
    const monthlySalesData = await orderModel.aggregate([
      {
        $match: {
          "items.status": "Delivered", 
          "orderDate": {
            $gte: new Date("2024-01-01"), 
            $lt: new Date("2024-12-31")   
          }
        }
      },
      {
        $unwind: "$items" 
      },
      {
        $match: {
          "items.status": "Delivered" 
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$orderDate" }, 
            year: { $year: "$orderDate" }    
          },
          totalAmount: { $sum: "$items.price" }, 
          countDelivered: { $sum: 1 } 
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } } 
    ]);
    
    console.log("Monthly Sales Data:", monthlySalesData);
    
    
    
    
  

    const dailySalesData = await orderModel.aggregate([
      { 
        $match: { 
          "items.status": "Delivered", 
          "orderDate": { 
            $gte: new Date("2024-04-01"), 
            $lt: new Date("2024-04-30")   
          } 
        } 
      },
      { 
        $unwind: "$items" 
      },
      { 
        $match: { 
          "items.status": "Delivered" 
        } 
      },
      { 
        $group: { 
          _id: { day: { $dayOfMonth: "$orderDate" } }, 
          totalAmount: { $sum: "$items.price" }, 
          countDeliveredItems: { $sum: 1 } 
        } 
      },
      { $sort: { "_id.day": 1 } } 
    ]);
    
    console.log("Daily Sales Data:", dailySalesData);
    
    





    
    const orderStatuses = await orderModel.aggregate([
      { $unwind: "$items" }, 
      {
        $group: {
          _id: "$items.status", 
          count: { $sum: 1 } 
        }
      }
    ]);

    

    
    const eachOrderStatusCount = {};
    orderStatuses.forEach((status) => {
      eachOrderStatusCount[status._id] = status.count;
    });

    res.status(200).json({
      monthlySalesData,
      dailySalesData,
      eachOrderStatusCount
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};



module.exports={
  loadlogin,
  loadadmindashboard,
  backtodashboard,
  loadproductlist,
  generateSalesreport,
  loadbestsellerspage,
  showChart 
}