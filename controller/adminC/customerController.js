const userModel=require("../../model/userModel")
const orderModel=require('../../model/orderModel')

//customer or user page mangement--------------------------------------------
const loadcustomermanagement = async (req, res) => {
  try {
    const data=await userModel.find()
    res.render("admin/customer-management",{data:data});
  } catch (error) {
    console.log("Error in customer management:", error);
    res.status(500).send("Internal Server Error");
  }
}

//list & unlist user-----------------------------------------------------------
const  blockOrUnblockcustomer= async (req, res) => {
  try {
      const id = req.query.id;
      const user = await userModel.findOne({ _id: id });

      if (!id || !user) {
          return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }

      if (user.isActive === true) {
          await userModel.updateOne({ _id: id }, { $set: { isActive: false } });
          return res.json({ success: true, flag: 1 });
      } else { 
          await userModel.updateOne({ _id: id }, { $set: { isActive: true } });
          return res.json({ success: true, flag: 0 });
      }
  } catch (error) {
      console.error(error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//order management page---------------------------------------------------------------------

const loadordermanagement = async (req, res) => {
  try {
    const admin=req.session.admin
    const orderData = await orderModel.find({ }).populate('userID').sort({orderDate:-1})
    res.render("admin/order-management",{admin:admin,orderData:orderData});
  } catch (error) {
    console.log("Error in customer management:", error);
    res.status(500).send("Internal Server Error");
  }
}
//order info page function------------------------------------------------------------------------
const loadadminorderinfopage=async (req,res)=>{
  try{
    const admin=req.session.admin;
    const {id,user}=req.query;
    console.log(`user id: ${user}`);
    const User= await userModel.findById({_id:user})
    console.log(User);
    const orderData = await orderModel.find({ _id: id }).populate('items.product')
    
    res.render('admin/orderinfo-page', { orderData:orderData,admin:admin,user:User });

  } catch (error) {
    console.log("Error in loading order information page:", error);
    res.status(500).send("Internal Server Error");
  }
}


//status updation----------------------------------------------------------------------------------

const statusUpdationFunction = async (req, res) => {
  const { itemId, newStatus } = req.body;

  try {
    
    await orderModel.updateOne({ "items._id": itemId }, { "$set": { "items.$.status": newStatus } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};




module.exports={
  loadcustomermanagement,
  blockOrUnblockcustomer,
  loadordermanagement,
  loadadminorderinfopage,
  statusUpdationFunction
  
}