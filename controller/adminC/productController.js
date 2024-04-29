const productModel=require('../../model/addproductModel')
const categoryModel=require('../../model/categoryModel')



//product list page----------------------------------------------------------

const loadproductlist= async function(req,res){
  try{
   
    const data=await productModel.find().populate("category")
    const Message=req.flash('message')
    res.render('admin/product-list',{data:data,message:Message});
  } catch(error){
    console.error("Error fetching category data:", error);
    res.status(500).send("Internal Server Error")
  }
};

//add product page--------------------------------------------------
const loadaddProductPage = async(req,res)=>{
  try {
      if (req.session.admin) {
          const category = await categoryModel.find({islisted:true})
          res.render('admin/add-product',{cat:category})
          
      }else{
          res.redirect("/adminlogin")
      }
    }catch (error) { 
      console.log("error in add products "+error)  
    }
}


//add product function------------------------------------------------------------
const addproducts = async (req, res) => {
  try {
      
      const product = req.body;
      const {productName} = req.body;
      const trimmedProductName = productName.trim();
      

      
      const productExist = await productModel.findOne({ productName: trimmedProductName });
      
      if (productExist) {
          const message="cannot add duplicate product , product  exist with same name ";
          return res.json({status:false,message:message})
      }
    

      if (!productExist) {
          console.log("product does not exist");

          
         const images = [];

          if (req.files && req.files.length > 0) {
              
              for (let i = 0; i < req.files.length; i++) {
                  const file = req.files[i];
                  console.log("File MIME Type:", file.mimetype); 
          
                  // Check if the file is an image (only allow image/jpeg, image/png, and image/gif)
                  if (!(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif')) {
                      console.log("Invalid File MIME Type:", file.mimetype);
                      const errormessage = "Cannot Add product. Please upload images in JPEG, PNG, or GIF format only.";
                      return res.json({ success: false, fileerrormessage: errormessage });
                  }

                  images.push(file.filename);
              }
          }
          
          const productAdding = {
              id: Date.now(),
              brand: product.brandName,
              productName: productName,
              description: product.description,
              category: product.category,
              regularPrice: product.regularPrice,
              discount: product.discount,
              createdOn: Date.now(),
              productImage: images,
              stock: product.stock,
          };
      
          await productModel.create(productAdding);
          
          const message="product added successfully";
          return res.json({success:true,message:message}) 
      } else {
          const errormessage ="Cannot Add product Already exist";
            return res.json({ success: false, errormessage:errormessage }); // 
      }
      
  } catch (error) {
      console.log("error happened in addproducts:", error);
      res.status(500).json({ error: error.message });
  }
};


//block or unblock product--------------------------------------------------------------------

const  blockOrUnblockproduct= async (req, res) => {
  try {
      const id = req.query.id;
      const product = await productModel.findOne({ _id: id });

      if (!id || !product) {
          return res.status(400).json({ success: false, message: 'Invalid product ID' });
      }

      if (product.isBlocked === false) {
          await productModel.updateOne({ _id: id }, { $set: { isBlocked: true } });
          return res.json({ success: true, flag: 1 });
      } else { 
          await productModel.updateOne({ _id: id }, { $set: { isBlocked: false } });
          return res.json({ success: true, flag: 0 });
      }
  } catch (error) {
      console.error(error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



//edit page rendering----------------------------------------------------------------------------
const loadeditProductPage = async(req,res)=>{
    try {
   
        if (req.session.admin) {


            const id=req.query.id;
            const category = await categoryModel.find({islisted:true})
            const data = await productModel.find({_id:id})
            res.render('admin/product-edit', { cat: category, data: data });
        }else{
            res.redirect("/adminlogin")
        }
      }catch (error) {
        console.log("Error in loading edit product page:", error);
        res.status(500).send("Internal Server Error");
    }
};

//product update function------------------------------------------------------------------

const productupdate = async (req, res) => {
    try {
        console.log("req now in productUpdate ");
        const id = req.params.id;
        console.log(id)
        const data = req.body;
        const images = [];
  
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }
        }
        const duplicate = await productModel.findOne({ productName: data.productName,_id:{$ne:id} });
       
            if (req.files && req.files.length>0) {
                
                const prodata = await productModel.findById({_id:id})
                prodata.productImage.push(...images)
                prodata.save()
                console.log(prodata.productImage);
            }

        if (!duplicate || duplicate._id.toString() === id) {
             
            
            console.log("Yes product name available or it's the same product.");
  
       
            await productModel.findByIdAndUpdate(
                id,
                {
                    productName: data.productName,
                    description: data.description,
                    brand: data.brand,
                    category: data.category,
                    regularPrice: data.regularPrice,
                    discount: data.discount,
                    stock: data.stock,
                    color: data.color,
                },
                { new: true }
            );
  
           
            req.flash("message", "Product Edit successfully");
            res.redirect("/productlist");
        } else {
            req.flash("message", "Product exists with the same name. Please choose a different name.");
            res.redirect(`/editproductpage?id=${duplicate.id}`);
        }
    } catch (error) {
        console.log("Error message when updating : " + error.message);
    }
  };

//delete image function----------------------------------------------------------------------------------------

const deleteImage = async (req, res) => {
try {
    const { productId, imageName } = req.body;
    const product = await productModel.findById(productId);

    if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updatedImages = product.productImage.filter(img => img !== imageName);
    product.productImage = updatedImages;

    // Save the updated product
    await product.save();

    return res.json({ success: true, message: 'Image deleted successfully' });
} catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
}
};

//-----------------------------------------------------------------------------------------------------

const productoffer = async (req, res) => {
    try {
        const { productId, discount } = req.query; // Accessing query parameters

        // Find the product by ID
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).send({ success: false, message: 'Product not found' });
        }

        // Save the current regular price as the old price
        const oldRegularPrice = product.regularPrice;

        // Calculate new regular price after applying the discount
        const newRegularPrice = oldRegularPrice - discount;
        
        // Update the product prices
        product.regularPrice = newRegularPrice;
        product.discount = discount;
        product.oldPrice = oldRegularPrice; // Update the old price

        // Save the updated product
        await product.save();

        res.send({ success: true, message: 'Discount applied successfully', data: product });
    } catch (error) {
        res.status(500).send({ success: false, message: 'Server error', error: error.message });
    }
};






module.exports={
  loadproductlist,
  loadaddProductPage,
  addproducts, 
  blockOrUnblockproduct,
  loadeditProductPage,
  productupdate,
  deleteImage,
  productoffer
}