const couponModel=require('../../model/couponModel')


//------loadcouponmanagementpage----------------------------------------------------

const loadcouponmanagementpage = async function (req, res) {
  const admin = req.session.admin;
  const coupons =await couponModel.find({})
 
  try {
      res.render('admin/coupon-page', { admin: admin, coupons:coupons });
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
}


//----------------loadcreatecoupontpage-----------------------------------------------


const loadcreatecouponpage = async function (req, res) {
  try {
    const admin = req.session.admin;
      res.render('admin/addcoupons-page', { admin: admin });
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
}

//---------------------createcouponfunction---------------------------------------------------------------

const createcouponfunction = async function (req, res) {
    try {
        const { userId, coupon, description, percentage, minimumamount, maximumamount, expiryDate } = req.body; 

        // Check if a coupon with the same name already exists for the user
        const existingCoupon = await couponModel.findOne({  coupon: coupon });
       

        if (!existingCoupon) {
            const newCoupon = new couponModel({
                userId: userId, 
                coupon: coupon,
                description: description,
                isListed: true, 
                percentage: percentage,
                minimumamount:minimumamount,
                maximumamount: maximumamount,
                expiryDate: new Date(expiryDate) 
            });

            await newCoupon.save();
            res.redirect('/couponmanagement'); 
        }else{
            req.flash('error', 'Coupon with same name already exist');
            res.redirect('/createcouponpage'); 
        }   
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ success: false, error: 'Failed to create coupon' });
    }
}

//---------------------- listOrUnlistcoupon-------------------------------------------------------------------------------------


const  listOrUnlistcoupon= async (req, res) => {
    try {
        const id = req.query.id;
        
        const coupon = await couponModel.findOne({ _id: id });
        
  
        if (!id || !coupon) {
            return res.status(400).json({ success: false, message: 'Invalid coupon ID' });
        }
  
        if (coupon.isListed === false) {
            await couponModel.updateOne({ _id: id }, { $set: { isListed: true } });
            return res.json({ success: true, flag: 1 });
        } else { 
            await couponModel.updateOne({ _id: id }, { $set: { isListed: false } });
            return res.json({ success: true, flag: 0 });
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };




module.exports={
loadcouponmanagementpage,
loadcreatecouponpage,
createcouponfunction,
listOrUnlistcoupon
 
}