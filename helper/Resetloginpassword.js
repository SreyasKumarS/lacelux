const userModel= require("../model/userModel")
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt")



//CONFIGURING ADMIN EMAIL----------------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.otpemail,
    pass: process.env.otppassword
  }
});


//FUNCTION FOR SENDING RESETLINK EMAIL----------------------------------

function sendPasswordResetEmail(email,userID) {
  const resetLink = `http://lacelux.sbs/resetPwPage?userID=${userID}`;
  transporter.sendMail({
    from: process.env.otpemail,
    to: email,
    subject: 'Password Reset',
    text: `Click the following link to reset your password: ${resetLink}`
  });
}





//FORGOT PASSWORD PAGE-----------------------------------------------------------------
const loadForgotPassword = (req,res)=>{
  
  res.render("user/forgot-password")
}




//SENDING EMAIL WITH RESETLINK TO USER---------------------------------------------------
const sendResetMail = async (req,res)=>{
  
  const { email } = req.body;

  
  const user = await userModel.findOne({ email:email });
  if (!user) {
    return res.status(400).send('User not found');
    
  }

  sendPasswordResetEmail(email,user._id)
  res.status(200).send('Password reset email sent');
}



//LOADING RESET PAGE-------------------------------------------------------------
 const loadResetPage = (req,res)=>{
  const {userID} = req.query;

  res.render("user/pwResetPage",{userId:userID})
}



//RESETTING PASSWORD---------------------------------------------------------------
const resetPassword = async (req, res) => {


  const { password,confirmPassword,userID } = req.body;

  const user = await userModel.findById(userID)
  

  if (user) {     
              try {

                        if (password !== confirmPassword) {
                        return res.status(400).send('Passwords do not match');
                        }
                        
                      
                        const newPass = await bcrypt.hash(password, 10);

                        
                        
                        await userModel.findOneAndUpdate(
                          { _id: userID },
                          { password: newPass },
                          { new: true}
                        );

                        res.status(200).send('Password updated successfully');
                        

              } catch (err) {
                        console.error(err);
                        res.status(500).send('Failed to update password');
              }

              
            } else {
              
                   res.status(500).send('Failed to find user');
            }
}




const pwResetHelper = {
  loadForgotPassword,
  sendResetMail,
  loadResetPage,
  resetPassword
}


module.exports= pwResetHelper