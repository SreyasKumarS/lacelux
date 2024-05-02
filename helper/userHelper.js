const userModel = require("../model/userModel");

const { generateReferralCode } = require("../helper/referralcode");

const bcrypt = require("bcrypt");



const doSignUp = async (userData, user, verify, emailVerify) => {
  try {
    const response = {}; 

    const userExist = await userModel.findOne({
      $or: [{ email: userData.email }, { mobile: userData.mobile }],
    });
    

    if (emailVerify === userData.email) {
      if (!userExist) {
        if (userData.password === userData.confirmPassword) {
          if (verify) {
            const password = await bcrypt.hash(userData.password, 10);
            const referralCode = generateReferralCode(6); 
            const userd = {
              name: userData.username,
              email: userData.email,
              mobile: userData.mobile,
              password: password,
              isVerified: true,
              referralCode: referralCode, 
            };

            await userModel.create(userd); 

            response.status = true;
            response.message = "Signed Up Successfully";
          } else {
            response.status = false;
            response.message = "OTP doesn't match";
          }
        } else {
          response.status = false;
          response.message = "Password doesn't Match";
        }
      } else {
        response.status = false;
        response.message = "User already Exists";
      }
    } else {
      response.status = false;
      response.message = "Email not matched";
    }

    return response;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};



module.exports = {
  doSignUp,

}