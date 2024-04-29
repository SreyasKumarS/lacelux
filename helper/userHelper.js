const userModel = require("../model/userModel");

const { generateReferralCode } = require("../helper/referralcode");

const bcrypt = require("bcrypt");

// const doSignUp = (userData, verify,emailVerify) => {
//   return new Promise(async (resolve, reject) => {
//     const userExist = await userModel.findOne({
//       $or: [{ email: userData.email }, { mobile: userData.mobile }],
//     });
//     console.log("Hello");
//     if(emailVerify===userData.email){
      
//     if (!userExist) {
//       console.log("user not exist");
//       console.log(userData.password +" "+userData.confirmPassword)
//       if (userData.password === userData.confirmPassword) {
//         console.log("password matched");
//         console.log(verify);
//         if (verify) {  //otp verification
//           console.log("verfied");
//           try {
//             const password = await bcrypt.hash(userData.password, 10);

//             const referralCode = generateReferralCode(6); // Generate a 6-digit referral code

//             const userd = {
//               name: userData.username,
//               email: userData.email,
//               mobile: userData.mobile,
//               password: password,
//               isVerified: true,
//               referralCode: referralCode, // Include referral code in user data
//             };
//             userModel
//               .create(userd)
//               .then((data) => {
//                 const response = { status: true, message: "Signed Up Successfully" };
//                 console.log(data);
//                 resolve(response);
//               })
//               .catch((error) => {
//                 console.log(error);
//                 reject(error);
//               });
//           } catch (error) {
//             console.log(error.message);
//             reject(error);
//           }
//         } else {
//           response.status =false,
//           response.message="OTP doesn't match";
//           resolve(response);
//         }
//       }else{
//         response.status = false;
//         response.message = "Password doesn't Match"
//         resolve(response)
//       }
//     } else {
//       response.status=false;
//       response.message="User already Exists";
//       resolve(response);
//     }
//   }else{
//     response.status =false;
//     response.message = "Email not matched"
//     resolve(response)
//   }
//   });
// };




const doSignUp = async (userData, user, verify, emailVerify) => {
  try {
    const response = {}; // Define response object

    const userExist = await userModel.findOne({
      $or: [{ email: userData.email }, { mobile: userData.mobile }],
    });
    

    if (emailVerify === userData.email) {
      if (!userExist) {
        if (userData.password === userData.confirmPassword) {
          if (verify) {
            const password = await bcrypt.hash(userData.password, 10);
            const referralCode = generateReferralCode(6); // Generate a 6-digit referral code
            const userd = {
              name: userData.username,
              email: userData.email,
              mobile: userData.mobile,
              password: password,
              isVerified: true,
              referralCode: referralCode, // Include referral code in user data
            };

            await userModel.create(userd); // Save the user object to the database

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